import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCourierProvider } from '@/lib/courier';
import { recordAuditLog } from '@/lib/audit';
import { verifyAdminSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    // 1. Verify admin authentication
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized. Admin authentication required.' }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, providerName = 'POSTEX' } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // 2. Load order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, shipments: { orderBy: { createdAt: 'desc' } } },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 3. Verify order status is CONFIRMED (Do not allow shipment creation before order confirmation)
    if (order.status !== 'CONFIRMED' && order.status !== 'PACKING' && order.status !== 'DISPATCHED') {
      return NextResponse.json({
        error: `Order must be CONFIRMED before sending to PostEx. Current status is ${order.status}.`,
      }, { status: 400 });
    }

    // 4. Validate customer details
    if (!order.customerName?.trim() || !order.customerPhone?.trim() || !order.shippingAddress?.trim() || !order.shippingCity?.trim()) {
      return NextResponse.json({
        error: 'Order has incomplete shipping details (Name, Phone, Address, or City missing). Please update customer information before sending to PostEx.',
      }, { status: 400 });
    }

    // 5. Check for existing active/successful shipment to prevent duplicate shipments
    const existingActiveShipment = order.shipments?.find(
      (s) => s.status !== 'FAILED' && s.status !== 'CANCELLED'
    );

    if (existingActiveShipment) {
      return NextResponse.json({
        error: `PostEx shipment already exists for this order. (Tracking ID: ${existingActiveShipment.trackingNumber || 'Pending'})`,
        shipment: existingActiveShipment,
        alreadyExists: true,
      }, { status: 400 });
    }

    // 6. Execute shipment creation with courier provider
    const provider = getCourierProvider(providerName);
    const result = await provider.createShipment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      shippingAddress: order.shippingAddress,
      shippingCity: order.shippingCity,
      shippingProvince: order.shippingProvince,
      postalCode: order.postalCode,
      codAmount: order.totalAmount,
      orderNotes: order.orderNotes,
      items: order.items.map((i) => ({
        productTitle: i.productTitle,
        variantInfo: i.variantInfo,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
    });

    if (!result.success && result.status === 'UNCONFIGURED') {
      // Record failed shipment attempt without changing order status
      await prisma.shipment.create({
        data: {
          orderId: order.id,
          provider: providerName,
          status: 'FAILED',
          codAmount: order.totalAmount,
          metadata: JSON.stringify({ error: result.message }),
        },
      });

      return NextResponse.json({
        error: result.message || 'PostEx integration is not configured yet. Please enter valid API credentials in Admin Settings.',
        unconfigured: true,
      }, { status: 400 });
    }

    if (!result.success) {
      // Record failed shipment attempt without altering CONFIRMED order status
      await prisma.shipment.create({
        data: {
          orderId: order.id,
          provider: providerName,
          status: 'FAILED',
          codAmount: order.totalAmount,
          metadata: JSON.stringify({ error: result.message }),
        },
      });

      return NextResponse.json({
        error: result.message || 'PostEx shipment could not be created.',
      }, { status: 400 });
    }

    // 7. Save successful Shipment record in database
    const shipment = await prisma.shipment.create({
      data: {
        orderId: order.id,
        provider: result.provider || providerName,
        trackingNumber: result.trackingNumber || null,
        externalShipmentId: result.externalShipmentId || null,
        status: result.status || 'CREATED',
        labelUrl: result.labelUrl || null,
        trackingUrl: result.trackingUrl || null,
        codAmount: order.totalAmount,
        metadata: result.metadata ? JSON.stringify(result.metadata) : null,
      },
    });

    // Update order courier & tracking number while preserving status (or advancing to PACKING/DISPATCHED)
    await prisma.order.update({
      where: { id: order.id },
      data: {
        courier: result.provider || providerName,
        trackingNumber: result.trackingNumber || order.trackingNumber,
      },
    });

    await recordAuditLog(
      'SHIPMENT_CREATED',
      'Shipment',
      shipment.id,
      `Created ${result.provider || providerName} shipment for order #${order.orderNumber}. Tracking ID: ${result.trackingNumber || 'N/A'}`
    );

    return NextResponse.json({
      success: true,
      shipment,
      message: 'Shipment created successfully.',
    });
  } catch (error: any) {
    console.error('Shipment creation failed:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}


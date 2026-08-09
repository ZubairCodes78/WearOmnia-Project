import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCourierProvider } from '@/lib/courier';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, providerName = 'POSTEX' } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, shipments: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check for existing active shipment to prevent duplicate shipments
    const existingActiveShipment = order.shipments?.find(
      (s) => s.status !== 'CANCELLED'
    );

    if (existingActiveShipment) {
      return NextResponse.json({
        error: `Shipment already exists for this order (Tracking: ${existingActiveShipment.trackingNumber || 'Pending'})`,
        shipment: existingActiveShipment,
      }, { status: 400 });
    }

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
      return NextResponse.json({
        error: result.message || 'PostEx integration is not configured yet.',
        unconfigured: true,
      }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({
        error: result.message || 'Failed to create shipment',
      }, { status: 400 });
    }

    // Create DB Shipment record
    const shipment = await prisma.shipment.create({
      data: {
        orderId: order.id,
        provider: result.provider,
        trackingNumber: result.trackingNumber || null,
        externalShipmentId: result.externalShipmentId || null,
        status: result.status,
        labelUrl: result.labelUrl || null,
        trackingUrl: result.trackingUrl || null,
        codAmount: order.totalAmount,
        metadata: result.metadata ? JSON.stringify(result.metadata) : null,
      },
    });

    // Update order courier & tracking number
    await prisma.order.update({
      where: { id: order.id },
      data: {
        courier: result.provider,
        trackingNumber: result.trackingNumber || order.trackingNumber,
        status: order.status === 'PENDING' ? 'CONFIRMED' : order.status,
      },
    });

    await recordAuditLog('SHIPMENT_CREATED', 'Shipment', shipment.id, `Created ${result.provider} shipment for order #${order.orderNumber}`);

    return NextResponse.json({
      success: true,
      shipment,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Shipment creation failed:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/phone';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 10; // Max 10 requests per minute

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(req: Request) {
  try {
    // Rate limit check
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a moment.' },
        { status: 429 }
      );
    }

    const { orderNumber, trackingId, phone } = await req.json();

    const searchTerm = (orderNumber || trackingId || '').trim().toUpperCase();

    if (!searchTerm) {
      return NextResponse.json(
        { error: 'Please enter your Order Number or Courier Tracking ID.' },
        { status: 400 }
      );
    }

    // Find order by orderNumber OR trackingNumber OR Shipment.trackingNumber
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: searchTerm },
          { trackingNumber: searchTerm },
          { shipments: { some: { OR: [{ trackingNumber: searchTerm }, { externalShipmentId: searchTerm }] } } },
        ],
      },
      include: {
        items: {
          select: {
            id: true,
            productTitle: true,
            variantInfo: true,
            unitPrice: true,
            quantity: true,
            subtotal: true,
          },
        },
        shipments: {
          orderBy: { createdAt: 'desc' },
        },
        timeline: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            status: true,
            note: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'We could not find an order with that Order Number or Tracking ID. Please verify and try again.' },
        { status: 404 }
      );
    }

    // Optional phone verification if phone is provided
    if (phone && phone.trim()) {
      const cleanPhone = normalizePhone(phone);
      const orderPhone = normalizePhone(order.customerPhone);
      if (cleanPhone !== orderPhone) {
        return NextResponse.json(
          { error: 'The phone number does not match our records. Please use the phone number used during checkout.' },
          { status: 403 }
        );
      }
    }

    const activeShipment = order.shipments && order.shipments.length > 0 ? order.shipments[0] : null;

    // Return safe customer-facing information
    return NextResponse.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: activeShipment?.status || order.status,
        customerName: order.customerName,
        orderDate: order.createdAt,
        shippingCity: order.shippingCity,
        shippingProvince: order.shippingProvince,
        trackingNumber: activeShipment?.trackingNumber || order.trackingNumber,
        courier: activeShipment?.provider === 'POSTEX' ? 'PostEx Courier' : (order.courier || 'PostEx Express'),
        paymentMethod: order.paymentMethod,
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        shippingFee: order.shippingFee,
        totalAmount: order.totalAmount,
        codCharges: order.codCharges,
        items: order.items.map((item) => ({
          title: item.productTitle,
          variant: item.variantInfo,
          price: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })),
        timeline: order.timeline
          .filter((t) => !t.note?.toLowerCase().includes('admin'))
          .map((t) => ({
            status: t.status,
            date: t.createdAt,
          })),
      },
    });
  } catch (error) {
    console.error('Track order error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

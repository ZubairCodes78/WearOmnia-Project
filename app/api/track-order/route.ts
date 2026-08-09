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

    const { orderNumber, phone } = await req.json();

    if (!orderNumber || !phone) {
      return NextResponse.json(
        { error: 'Please provide both your order number and phone number.' },
        { status: 400 }
      );
    }

    // Find order by order number AND verify phone
    const order = await prisma.order.findUnique({
      where: { orderNumber: orderNumber.trim().toUpperCase() },
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
        { error: 'We could not find an order with that order number. Please check and try again.' },
        { status: 404 }
      );
    }

    // Verify phone number matches using normalized comparison
    const cleanPhone = normalizePhone(phone);
    const orderPhone = normalizePhone(order.customerPhone);
    if (cleanPhone !== orderPhone) {
      return NextResponse.json(
        { error: 'The phone number does not match our records. Please use the phone number you provided during checkout.' },
        { status: 403 }
      );
    }

    // Return only safe customer-facing information
    // DO NOT expose: internalAdminNote, customerId, database IDs, email, isReadByAdmin
    return NextResponse.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        customerName: order.customerName,
        orderDate: order.createdAt,
        shippingCity: order.shippingCity,
        shippingProvince: order.shippingProvince,
        trackingNumber: order.trackingNumber,
        courier: order.courier,
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
          // Filter out internal admin notes from timeline
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

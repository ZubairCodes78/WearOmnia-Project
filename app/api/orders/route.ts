import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { defaultPaymentGateway } from '@/lib/payments/cod';
import { recordAuditLog } from '@/lib/audit';
import { NotificationService } from '@/lib/notifications/notification-service';
import { broadcastAdminEvent } from '@/lib/events/event-emitter';
import { getSiteSettings } from '@/lib/settings';
import { normalizePhone, validatePhone } from '@/lib/phone';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fullName,
      phone,
      whatsapp,
      email,
      province,
      city,
      address,
      postalCode,
      orderNotes,
      couponCode,
      items,
    } = body;

    if (!fullName || !phone || !province || !city || !address || !items || items.length === 0) {
      return NextResponse.json({ error: 'Please complete all required fields and add items to your order' }, { status: 400 });
    }

    // Normalize and validate phone number
    const finalPhone = normalizePhone(phone);
    
    if (!validatePhone(phone)) {
      return NextResponse.json({ error: 'Please enter a valid Pakistani mobile number.' }, { status: 400 });
    }

    if (whatsapp && !validatePhone(whatsapp)) {
      return NextResponse.json({ error: 'Please enter a valid Pakistani mobile number.' }, { status: 400 });
    }

    // Check for duplicate order submission (same phone + same items within 1 minute)
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentOrder = await prisma.order.findFirst({
      where: {
        customerPhone: finalPhone,
        createdAt: { gte: oneMinuteAgo },
      },
    });

    if (recentOrder) {
      return NextResponse.json({ error: 'You already placed an order recently. Please wait before placing another order.' }, { status: 429 });
    }

    // Check stock availability for all items
    for (const item of items) {
      if (item.productId) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { stockQuantity: true, title: true },
        });

        if (!product) {
          return NextResponse.json({ error: `Product not found: ${item.title}` }, { status: 400 });
        }

        if (product.stockQuantity < item.quantity) {
          return NextResponse.json({
            error: `Sorry, "${product.title}" is no longer available in the requested quantity. Only ${product.stockQuantity} units left in stock.`
          }, { status: 400 });
        }
      }
    }

    // 1. Calculate subtotal
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.price * item.quantity;
    }

    // 2. Shipping fee
    const siteSettings = await getSiteSettings();
    let shippingFee = siteSettings.flatShippingFee || 250;
    const rule = await prisma.shippingRule.findUnique({ where: { city } });
    if (rule) {
      shippingFee = subtotal >= rule.freeShippingMinAmount ? 0 : rule.charge;
    } else if (subtotal >= (siteSettings.freeShippingThreshold || 10000)) {
      shippingFee = 0;
    }

    // 3. COD fee
    const codFee = siteSettings.codCharge || 0;

    // 3. Process Coupon Discount
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.trim().toUpperCase() },
      });
      if (coupon && coupon.isActive && subtotal >= coupon.minOrderAmount) {
        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
            discountAmount = coupon.maxDiscountAmount;
          }
        } else {
          discountAmount = coupon.discountValue;
        }
        discountAmount = Math.min(discountAmount, subtotal);

        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee + codFee);

    // 4. Customer linkage
    let customer = await prisma.customer.findUnique({ where: { phone: finalPhone } });
    const now = new Date();

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          fullName: fullName.trim(),
          phone: finalPhone,
          whatsapp: whatsapp ? normalizePhone(whatsapp) : finalPhone,
          email: email ? email.trim() : 'wearomniaofficial@gmail.com',
          province,
          city,
          address,
          postalCode,
          totalSpent: totalAmount,
          ordersCount: 1,
          averageOrderValue: totalAmount,
          lastOrderDate: now,
          isVIP: totalAmount > 40000,
        },
      });
    } else {
      const newOrdersCount = customer.ordersCount + 1;
      const newTotalSpent = customer.totalSpent + totalAmount;
      const newAOV = newTotalSpent / newOrdersCount;

      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          fullName: fullName.trim(),
          whatsapp: whatsapp ? normalizePhone(whatsapp) : customer.whatsapp,
          email: email ? email.trim() : customer.email || 'wearomniaofficial@gmail.com',
          province,
          city,
          address,
          postalCode,
          totalSpent: newTotalSpent,
          ordersCount: newOrdersCount,
          averageOrderValue: newAOV,
          lastOrderDate: now,
          isVIP: newTotalSpent > 40000,
        },
      });
    }

    // 5. Generate Order Number
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `OMNIA-${randomDigits}`;

    // Payment Processing (COD Abstraction)
    const paymentResult = await defaultPaymentGateway.processPayment({
      orderNumber,
      amount: totalAmount,
      currency: 'PKR',
      customerName: fullName,
      customerPhone: finalPhone,
      customerEmail: email,
      description: 'WearOMNIA Cash On Delivery Order',
    });

    // 6. Create Order, Timeline, Items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        customerName: fullName.trim(),
        customerPhone: finalPhone,
        customerWhatsapp: whatsapp ? normalizePhone(whatsapp) : finalPhone,
        customerEmail: email || null,
        shippingProvince: province,
        shippingCity: city,
        shippingAddress: address,
        postalCode,
        orderNotes,
        subtotal,
        discountAmount,
        shippingFee,
        codCharges: codFee,
        totalAmount,
        paymentMethod: paymentResult.paymentMethod,
        status: 'PENDING',
        couponCode: couponCode || null,
        items: {
          create: items.map((i: any) => ({
            productId: i.productId,
            productTitle: i.title,
            variantInfo: `Size: ${i.size}, Color: ${i.color}`,
            unitPrice: i.price,
            quantity: i.quantity,
            subtotal: i.price * i.quantity,
          })),
        },
        timeline: {
          create: {
            status: 'PENDING',
            note: 'Order placed by customer via Single Page Guest Checkout (COD)',
            updatedBy: 'Customer (Guest)',
          },
        },
      },
    });

    // 7. Inventory Logs & Stock Decrement
    for (const item of items) {
      if (item.productId) {
        const prod = await prisma.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        }).catch(() => null);

        if (prod) {
          await prisma.inventoryLog.create({
            data: {
              productId: item.productId,
              changeQuantity: -item.quantity,
              stockAfter: prod.stockQuantity,
              reason: 'ORDER_PLACED',
            },
          }).catch(() => {});

          // Low Stock Alert Check
          if (prod.stockQuantity <= 5) {
            await prisma.adminNotification.create({
              data: {
                type: 'LOW_STOCK',
                title: `⚠️ Low Stock Alert: ${prod.title}`,
                message: `Only ${prod.stockQuantity} units left in stock. SKU: ${prod.sku}`,
              },
            }).catch(() => {});
          }
        }
      }
    }

    // 8. Dispatch Step 1 & Step 2 WhatsApp Notifications & Real-Time SSE
    try {
      await NotificationService.sendOrderConfirmationRequest(order);
    } catch (e) {
      console.error('[WhatsApp Trigger Failed - Fault Tolerant Catch]', e);
    }

    const adminNotif = await prisma.adminNotification.create({
      data: {
        orderId: order.id,
        type: 'NEW_ORDER',
        title: `🛍️ New Order #${orderNumber}`,
        message: `New Order #${orderNumber} placed by ${fullName} from ${city} for Rs. ${totalAmount.toLocaleString()}`,
      },
    }).catch(() => null);

    // Broadcast SSE Real-Time event to Admin Console
    broadcastAdminEvent({
      type: 'NEW_ORDER',
      order,
      notification: adminNotif,
      sound: true,
      timestamp: new Date().toISOString(),
    });

    await recordAuditLog('ORDER_PLACED', 'Order', order.id, `Order #${orderNumber} placed for Rs. ${totalAmount}`);

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
    });
  } catch (error) {
    console.error('Order creation failed:', error);
    return NextResponse.json({ error: 'Failed to place order. Please try again.' }, { status: 500 });
  }
}

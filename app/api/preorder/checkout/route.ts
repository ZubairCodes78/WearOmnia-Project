import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';
import { NotificationService } from '@/lib/notifications/notification-service';
import { broadcastAdminEvent } from '@/lib/events/event-emitter';
import { getSiteSettings, getPreOrderSettings } from '@/lib/settings';
import { normalizePhone, validatePhone } from '@/lib/phone';
import { generateNextOrderNumber } from '@/lib/order-number';
import { calculatePreOrderAmounts } from '@/lib/preorder';
import { validateCouponServer } from '@/lib/coupons';
import { paymentProofExists } from '@/lib/storage';

export const runtime = 'nodejs';

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
      screenshotKey,
      selectedPaymentMethodId,
    } = body;

    // 1. Basic validation
    if (!fullName || !phone || !province || !city || !address || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Please complete all required fields and ensure items are in your cart' },
        { status: 400 }
      );
    }

    if (!screenshotKey) {
      return NextResponse.json(
        { error: 'Please upload your advance payment proof screenshot to place your pre-order' },
        { status: 400 }
      );
    }

    if (!selectedPaymentMethodId) {
      return NextResponse.json(
        { error: 'Please select the payment method you transferred the advance payment to' },
        { status: 400 }
      );
    }

    // 2. Validate payment proof file exists on disk
    const proofExists = await paymentProofExists(screenshotKey);
    if (!proofExists) {
      return NextResponse.json(
        { error: 'Uploaded payment screenshot could not be verified. Please re-upload your screenshot.' },
        { status: 400 }
      );
    }

    // 3. Verify Payment Method
    const paymentMethod = await prisma.preOrderPaymentMethod.findUnique({
      where: { id: selectedPaymentMethodId },
    });

    if (!paymentMethod || !paymentMethod.isActive) {
      return NextResponse.json(
        { error: 'Selected payment method is currently unavailable. Please choose another payment method.' },
        { status: 400 }
      );
    }

    // 4. Verify Pre-Order Settings
    const preOrderSettings = await getPreOrderSettings();
    if (!preOrderSettings.preorder_enabled) {
      return NextResponse.json(
        { error: 'Pre-orders are currently not accepting new orders.' },
        { status: 400 }
      );
    }

    // 5. Phone validation and normalization
    const finalPhone = normalizePhone(phone);
    if (!validatePhone(phone)) {
      return NextResponse.json(
        { error: 'Please enter a valid Pakistani mobile number.' },
        { status: 400 }
      );
    }

    if (whatsapp && !validatePhone(whatsapp)) {
      return NextResponse.json(
        { error: 'Please enter a valid Pakistani WhatsApp number.' },
        { status: 400 }
      );
    }

    // 6. Anti-duplicate submission check (1 minute window)
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentOrder = await prisma.order.findFirst({
      where: {
        customerPhone: finalPhone,
        createdAt: { gte: oneMinuteAgo },
      },
    });

    if (recentOrder) {
      return NextResponse.json(
        { error: 'You recently placed an order. Please wait a minute before placing another order.' },
        { status: 429 }
      );
    }

    // 7. Verify all products are PRE-ORDER and recalculate prices from DB
    const productIds = items.map((i: any) => i.productId).filter(Boolean);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let advancePercent = preOrderSettings.preorder_advance_percent || 50;

    for (const item of items) {
      const prod = productMap.get(item.productId);
      if (!prod) {
        return NextResponse.json({ error: `Product not found: ${item.title}` }, { status: 400 });
      }

      // STRICT MIXED-CART CHECK:
      if (!prod.isPreOrder) {
        return NextResponse.json(
          {
            error: `"${prod.title}" is an in-stock item. Pre-order and in-stock items cannot be combined in the same order. Please order them separately.`,
          },
          { status: 400 }
        );
      }

      // If product has a custom pre-order advance percent, use it
      if (prod.preOrderAdvancePercent && prod.preOrderAdvancePercent > 0) {
        advancePercent = prod.preOrderAdvancePercent;
      }
    }

    // 8. Server-side totals calculation
    let subtotal = 0;
    const validatedItems = items.map((item: any) => {
      const prod = productMap.get(item.productId);
      const unitPrice = prod ? (prod.discountPrice ?? prod.basePrice) : item.price;
      const originalPrice = prod ? prod.basePrice : item.price;
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;

      return {
        productId: item.productId,
        productTitle: prod ? prod.title : item.title,
        variantInfo: `Size: ${item.size || 'Standard'}, Color: ${item.color || 'Standard'}`,
        unitPrice,
        originalPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      };
    });

    // 9. Shipping Fee
    const siteSettings = await getSiteSettings();
    let shippingFee = siteSettings.flatShippingFee || 250;
    const rule = await prisma.shippingRule.findUnique({ where: { city } });
    if (rule) {
      shippingFee = subtotal >= rule.freeShippingMinAmount ? 0 : rule.charge;
    } else if (subtotal >= (siteSettings.freeShippingThreshold || 10000)) {
      shippingFee = 0;
    }

    // 10. Coupon calculation via central server validation
    let discountAmount = 0;
    if (couponCode) {
      const couponValidation = await validateCouponServer({
        code: couponCode,
        subtotal,
        isPreOrder: true,
        now: new Date(),
      });

      if (couponValidation.valid && couponValidation.calculatedDiscount) {
        discountAmount = couponValidation.calculatedDiscount;
        await prisma.coupon.update({
          where: { code: couponValidation.code! },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

    // 11. Calculate Pre-Order Advance and Remaining Amounts
    const { advanceAmount, remainingAmount } = calculatePreOrderAmounts(totalAmount, advancePercent);

    // 12. Customer linkage
    let customer = await prisma.customer.findUnique({ where: { phone: finalPhone } });
    const now = new Date();

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          fullName: fullName.trim(),
          phone: finalPhone,
          whatsapp: whatsapp ? normalizePhone(whatsapp) : finalPhone,
          email: email ? email.trim() : 'wearomniaa@gmail.com',
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
          email: email ? email.trim() : customer.email || 'wearomniaa@gmail.com',
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

    // 13. Sequential Order Number generation with retry
    let order: any = null;
    let orderNumber = '';

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        orderNumber = await generateNextOrderNumber(prisma);

        order = await prisma.order.create({
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
            codCharges: 0,
            totalAmount,
            amountPaid: 0, // Rs. 0 until Admin verifies and approves payment proof
            paymentMethod: 'PRE_ORDER_ADVANCE',
            status: 'PENDING',
            couponCode: couponCode || null,
            isPreOrder: true,
            preOrderPaymentStatus: 'PAYMENT_REVIEW_PENDING',
            preOrderPaymentMethodName: paymentMethod.displayName,
            preOrderPaymentScreenshotUrl: screenshotKey,
            preOrderAdvancePercent: advancePercent,
            preOrderAdvanceAmount: advanceAmount,
            preOrderRemainingAmount: remainingAmount,
            items: {
              create: validatedItems,
            },
            timeline: {
              create: {
                status: 'PENDING',
                note: `Pre-order created. Advance payment (${advancePercent}% = Rs. ${advanceAmount.toLocaleString()}) submitted via ${paymentMethod.displayName}. Payment proof screenshot pending verification.`,
                updatedBy: 'Customer (Pre-order)',
              },
            },
          },
        });
        break;
      } catch (createErr: any) {
        if (createErr?.code === 'P2002' && attempt < 2) {
          continue;
        }
        throw createErr;
      }
    }

    // 14. Decrement inventory if stock is configured
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
              reason: 'PRE_ORDER_PLACED',
            },
          }).catch(() => {});
        }
      }
    }

    // 15. Notifications
    try {
      await NotificationService.sendPreOrderReceived(order);
    } catch (e) {
      console.error('[Pre-Order WhatsApp Error - Non-fatal]', e);
    }

    const adminNotif = await prisma.adminNotification.create({
      data: {
        orderId: order.id,
        type: 'PREORDER_PAYMENT_PENDING',
        title: `⏳ Pre-Order Payment Review ${orderNumber}`,
        message: `Pre-Order ${orderNumber} placed by ${fullName}. Advance of Rs. ${advanceAmount.toLocaleString()} awaiting verification.`,
      },
    }).catch(() => null);

    broadcastAdminEvent({
      type: 'NEW_ORDER',
      order,
      notification: adminNotif,
      sound: true,
      timestamp: new Date().toISOString(),
    });

    await recordAuditLog(
      'PRE_ORDER_PLACED',
      'Order',
      order.id,
      `Pre-Order ${orderNumber} placed for total Rs. ${totalAmount} (Advance Rs. ${advanceAmount} pending review)`
    );

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
    });
  } catch (error: any) {
    console.error('Pre-order checkout failed:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to place pre-order. Please try again.' },
      { status: 500 }
    );
  }
}

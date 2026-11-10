import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { defaultPaymentGateway } from '@/lib/payments/cod';
import { recordAuditLog } from '@/lib/audit';
import { NotificationService } from '@/lib/notifications/notification-service';
import { broadcastAdminEvent } from '@/lib/events/event-emitter';
import { sendAdminPushNotification } from '@/lib/notifications/fcm';
import { getSiteSettings } from '@/lib/settings';
import { normalizePhone, validatePhone } from '@/lib/phone';
import { generateNextOrderNumber } from '@/lib/order-number';
import { WEAROMNIA_CAMPAIGN, validatePreOrderCampaignCoupon } from '@/lib/preorder';
import { paymentProofExists } from '@/lib/storage';
import { calculateServerCartQuote } from '@/lib/campaigns';

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
      paymentMethod: requestedPaymentMethod,
      screenshotKey,
      selectedPaymentMethodId,
      expectedTotalAmount,
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

    // Check stock availability and pre-order status for all items
    for (const item of items) {
      if (item.productId) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { stockQuantity: true, title: true, isPreOrder: true, basePrice: true },
        });

        if (!product) {
          return NextResponse.json({ error: `Product not found: ${item.title}` }, { status: 400 });
        }

        if (product.isPreOrder) {
          return NextResponse.json({
            error: `"${product.title}" is a pre-order piece and requires advance payment confirmation. Cash on Delivery is not available for pre-orders.`
          }, { status: 400 });
        }

        if (product.stockQuantity < item.quantity) {
          return NextResponse.json({
            error: `Sorry, "${product.title}" is no longer available in the requested quantity. Only ${product.stockQuantity} units left in stock.`
          }, { status: 400 });
        }
      }
    }

    // 1. Settings & Payment Option Handling
    const siteSettings = await getSiteSettings();
    const isFullAdvance = requestedPaymentMethod === 'FULL_ADVANCE';

    let activePaymentMethodRecord: any = null;
    if (isFullAdvance) {
      if (siteSettings.full_advance_payment_enabled === false) {
        return NextResponse.json({ error: 'Full Advance Payment is currently not enabled.' }, { status: 400 });
      }

      if (!screenshotKey) {
        return NextResponse.json({ error: 'Please upload your payment screenshot before placing the order.' }, { status: 400 });
      }

      const proofExists = await paymentProofExists(screenshotKey);
      if (!proofExists) {
        return NextResponse.json({ error: 'Uploaded payment screenshot could not be verified. Please re-upload your screenshot.' }, { status: 400 });
      }

      if (!selectedPaymentMethodId) {
        return NextResponse.json({ error: 'Please select the payment method you transferred the payment to.' }, { status: 400 });
      }

      activePaymentMethodRecord = await prisma.preOrderPaymentMethod.findUnique({
        where: { id: selectedPaymentMethodId },
      });

      if (!activePaymentMethodRecord || !activePaymentMethodRecord.isActive) {
        return NextResponse.json({ error: 'Selected payment method is currently unavailable. Please choose another payment method.' }, { status: 400 });
      }
    }

    // 2. Server-Authoritative Pricing, Seasonal Campaign Discounts, Coupon Stacking & Shipping
    const quote = await calculateServerCartQuote({
      items,
      couponCode: couponCode || null,
      isPreOrderOrder: false,
      city,
      paymentMethod: isFullAdvance ? 'FULL_ADVANCE' : 'CASH_ON_DELIVERY',
      now: new Date(),
    });

    // Guard against expired campaigns or stale totals shown in customer browser during checkout
    if (
      expectedTotalAmount !== undefined &&
      expectedTotalAmount !== null &&
      Math.round(Number(expectedTotalAmount)) !== quote.totalAmount
    ) {
      return NextResponse.json(
        {
          error:
            'Campaign pricing or order totals changed since you opened checkout. Please review the updated summary before placing your order.',
          code: 'PRICE_CHANGED',
          quote,
        },
        { status: 409 }
      );
    }

    const subtotal = quote.subtotal;
    const shippingFee = quote.shippingFee;
    const codFee = quote.codCharges;
    const discountAmount = quote.couponDiscountAmount;
    const totalAmount = quote.totalAmount;

    if (quote.couponValid && quote.couponCode) {
      await prisma.coupon.update({
        where: { code: quote.couponCode },
        data: { usedCount: { increment: 1 } },
      }).catch(() => {});
    }

    // 4. Customer linkage
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

    // 5. Generate Sequential Order Number (0001, 0002, ...)
    let order: any = null;
    let orderNumber = '';

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        orderNumber = await generateNextOrderNumber(prisma);

        // Payment Processing (COD Abstraction for Cash on Delivery)
        let resolvedPaymentMethod = 'CASH_ON_DELIVERY';
        if (!isFullAdvance) {
          const paymentResult = await defaultPaymentGateway.processPayment({
            orderNumber,
            amount: totalAmount,
            currency: 'PKR',
            customerName: fullName,
            customerPhone: finalPhone,
            customerEmail: email,
            description: 'WearOMNIA Cash On Delivery Order',
          });
          resolvedPaymentMethod = paymentResult.paymentMethod;
        } else {
          resolvedPaymentMethod = 'FULL_ADVANCE';
        }

        // 6. Create Order, Timeline, Items
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
            codCharges: codFee,
            totalAmount,
            amountPaid: 0,
            paymentMethod: resolvedPaymentMethod,
            status: isFullAdvance ? 'PAYMENT_REVIEW_PENDING' : 'PENDING',
            couponCode: quote.couponCode || null,
            campaignId: quote.primaryCampaignId,
            campaignName: quote.primaryCampaignName,
            campaignSlug: quote.primaryCampaignSlug,
            campaignIds: quote.campaignIds,
            campaignDiscountAmount: quote.campaignDiscountAmount,
            couponDiscountAmount: quote.couponDiscountAmount,
            isPreOrder: false,
            preOrderPaymentStatus: isFullAdvance ? 'PAYMENT_REVIEW_PENDING' : null,
            preOrderPaymentMethodName: isFullAdvance ? activePaymentMethodRecord.displayName : null,
            preOrderPaymentScreenshotUrl: isFullAdvance ? screenshotKey : null,
            preOrderAdvancePercent: isFullAdvance ? 100 : null,
            preOrderAdvanceAmount: isFullAdvance ? totalAmount : null,
            preOrderRemainingAmount: isFullAdvance ? 0 : null,
            items: {
              create: quote.items.map((i) => ({
                productId: i.productId,
                productTitle: i.productTitle,
                variantInfo: i.variantInfo,
                unitPrice: i.unitPrice,
                originalPrice: i.originalPrice,
                campaignId: i.campaignId,
                campaignName: i.campaignName,
                campaignDiscountPerUnit: i.campaignDiscountPerUnit,
                quantity: i.quantity,
                subtotal: i.subtotal,
              })),
            },
            timeline: {
              create: {
                status: isFullAdvance ? 'PAYMENT_REVIEW_PENDING' : 'PENDING',
                note: isFullAdvance
                  ? `Order placed with 100% Full Advance Payment (Rs. ${totalAmount.toLocaleString()}) via ${activePaymentMethodRecord.displayName}. Payment proof screenshot pending manual review.`
                  : 'Order placed by customer via Single Page Guest Checkout (COD)',
                updatedBy: isFullAdvance ? 'Customer (Full Advance)' : 'Customer (Guest)',
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

    // 8. Dispatch Official Phase 4 WhatsApp Order Confirmation & Real-Time SSE
    try {
      const fullOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      });
      if (fullOrder) {
        await NotificationService.sendOrderConfirmation(fullOrder);
      }
    } catch (e) {
      console.error('[WhatsApp Order Confirmation Trigger Failed - Fault Tolerant Catch]', e);
    }

    const adminNotif = await prisma.adminNotification.create({
      data: {
        orderId: order.id,
        type: isFullAdvance ? 'PAYMENT_REVIEW_PENDING' : 'NEW_ORDER',
        title: isFullAdvance ? `⏳ Payment Review: ${orderNumber}` : `🛍️ New Order ${orderNumber}`,
        message: isFullAdvance
          ? `Order ${orderNumber} placed by ${fullName} with 100% Full Advance Payment of Rs. ${totalAmount.toLocaleString()} via ${activePaymentMethodRecord.displayName}. Payment screenshot pending review.`
          : `New Order ${orderNumber} placed by ${fullName} from ${city} for Rs. ${totalAmount.toLocaleString()}`,
      },
    }).catch(() => null);

    // Broadcast SSE Real-Time event to Admin Console
    broadcastAdminEvent({
      type: isFullAdvance ? 'PAYMENT_PROOF_RESUBMITTED' : 'NEW_ORDER',
      order,
      notification: adminNotif,
      sound: true,
      timestamp: new Date().toISOString(),
    });

    // Send instant FCM push notification to all active admin devices (deduplicated)
    sendAdminPushNotification({
      idempotencyKey: `NEW_ORDER:${order.id}`,
      type: 'NEW_ORDER',
      orderId: order.id,
      title: isFullAdvance ? `⏳ Payment Review: #${orderNumber}` : `🛍️ New Order #${orderNumber}`,
      body: isFullAdvance
        ? `Rs. ${totalAmount.toLocaleString()} Full Advance • ${fullName} (${city}) - Review Proof`
        : `Rs. ${totalAmount.toLocaleString()} • ${fullName} (${city})`,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: fullName,
        city: city,
        amount: String(totalAmount),
      },
    }).catch(err => console.error('[FCM Push Error]', err));

    await recordAuditLog(
      isFullAdvance ? 'ORDER_PLACED_FULL_ADVANCE' : 'ORDER_PLACED',
      'Order',
      order.id,
      `Order ${orderNumber} placed for Rs. ${totalAmount} via ${isFullAdvance ? `Full Advance (${activePaymentMethodRecord.displayName})` : 'COD'}`
    );

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
      createdAt: order.createdAt,
    });
  } catch (error) {
    console.error('Order creation failed:', error);
    return NextResponse.json({ error: 'Failed to place order. Please try again.' }, { status: 500 });
  }
}

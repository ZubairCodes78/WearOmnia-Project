import { PaymentGateway, PaymentOrderDetails, PaymentResult } from './types';

export class CashOnDeliveryGateway implements PaymentGateway {
  public name = 'CASH_ON_DELIVERY';

  public async processPayment(order: PaymentOrderDetails): Promise<PaymentResult> {
    return {
      success: true,
      transactionId: `COD-${order.orderNumber}`,
      paymentMethod: 'CASH_ON_DELIVERY',
      message: 'Cash On Delivery order confirmed. Collectable at doorstep.',
    };
  }
}

export const defaultPaymentGateway = new CashOnDeliveryGateway();

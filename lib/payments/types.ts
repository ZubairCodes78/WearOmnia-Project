export interface PaymentOrderDetails {
  orderNumber: string;
  amount: number;
  currency: string; // PKR
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  description: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  paymentMethod: string;
  message: string;
}

export interface PaymentGateway {
  name: string;
  processPayment(order: PaymentOrderDetails): Promise<PaymentResult>;
}

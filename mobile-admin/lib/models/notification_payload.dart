class OrderNotificationPayload {
  final String? type;
  final String? orderId;
  final String? orderNumber;
  final String? customerName;
  final String? city;
  final String? amount;
  final String? title;
  final String? body;
  final Map<String, dynamic> rawData;

  OrderNotificationPayload({
    this.type,
    this.orderId,
    this.orderNumber,
    this.customerName,
    this.city,
    this.amount,
    this.title,
    this.body,
    required this.rawData,
  });

  factory OrderNotificationPayload.fromMap(Map<String, dynamic> map, {String? notificationTitle, String? notificationBody}) {
    return OrderNotificationPayload(
      type: map['type'] as String?,
      orderId: map['orderId'] as String?,
      orderNumber: map['orderNumber'] as String?,
      customerName: map['customerName'] as String?,
      city: map['city'] as String?,
      amount: map['amount'] as String?,
      title: notificationTitle ?? map['title'] as String?,
      body: notificationBody ?? map['body'] as String?,
      rawData: map,
    );
  }

  bool get isNewOrder => type == 'NEW_ORDER';
}

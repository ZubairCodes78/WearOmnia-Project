class OrderItem {
  final String id;
  final String? productId;
  final String productTitle;
  final String? variantInfo;
  final double unitPrice;
  final double? originalPrice;
  final int quantity;
  final double subtotal;
  final String? imageUrl;

  OrderItem({
    required this.id,
    this.productId,
    required this.productTitle,
    this.variantInfo,
    required this.unitPrice,
    this.originalPrice,
    required this.quantity,
    required this.subtotal,
    this.imageUrl,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    String? img;
    if (json['product'] != null &&
        json['product']['images'] != null &&
        (json['product']['images'] as List).isNotEmpty) {
      img = json['product']['images'][0]['url'] as String?;
    }

    return OrderItem(
      id: json['id'] as String? ?? '',
      productId: json['productId'] as String?,
      productTitle: json['productTitle'] as String? ?? 'Product',
      variantInfo: json['variantInfo'] as String?,
      unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0.0,
      originalPrice: (json['originalPrice'] as num?)?.toDouble(),
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0.0,
      imageUrl: img,
    );
  }
}

class OrderTimelineItem {
  final String id;
  final String status;
  final String? previousStatus;
  final String? note;
  final String updatedBy;
  final DateTime createdAt;

  OrderTimelineItem({
    required this.id,
    required this.status,
    this.previousStatus,
    this.note,
    required this.updatedBy,
    required this.createdAt,
  });

  factory OrderTimelineItem.fromJson(Map<String, dynamic> json) {
    return OrderTimelineItem(
      id: json['id'] as String? ?? '',
      status: json['status'] as String? ?? 'PENDING',
      previousStatus: json['previousStatus'] as String?,
      note: json['note'] as String?,
      updatedBy: json['updatedBy'] as String? ?? 'System',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

class CustomerSummary {
  final String id;
  final String fullName;
  final String phone;
  final String? whatsapp;
  final String? email;
  final int ordersCount;
  final double totalSpent;
  final bool isVIP;

  CustomerSummary({
    required this.id,
    required this.fullName,
    required this.phone,
    this.whatsapp,
    this.email,
    required this.ordersCount,
    required this.totalSpent,
    required this.isVIP,
  });

  factory CustomerSummary.fromJson(Map<String, dynamic> json) {
    return CustomerSummary(
      id: json['id'] as String? ?? '',
      fullName: json['fullName'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      whatsapp: json['whatsapp'] as String?,
      email: json['email'] as String?,
      ordersCount: (json['ordersCount'] as num?)?.toInt() ?? 0,
      totalSpent: (json['totalSpent'] as num?)?.toDouble() ?? 0.0,
      isVIP: json['isVIP'] as bool? ?? false,
    );
  }
}

class OrderModel {
  final String id;
  final String orderNumber;
  final String customerName;
  final String customerPhone;
  final String? customerWhatsapp;
  final String? customerEmail;
  final String shippingProvince;
  final String shippingCity;
  final String shippingAddress;
  final String? postalCode;
  final String? orderNotes;
  final String? internalAdminNote;
  final double subtotal;
  final double discountAmount;
  final double shippingFee;
  final double codCharges;
  final double totalAmount;
  final double amountPaid;
  final String paymentMethod;
  final String status;
  final String? trackingNumber;
  final String? courier;
  final bool isPreOrder;
  final String? preOrderPaymentStatus;
  final double? preOrderAdvanceAmount;
  final double? preOrderRemainingAmount;
  final bool isReadByAdmin;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<OrderItem> items;
  final List<OrderTimelineItem> timeline;
  final CustomerSummary? customer;

  OrderModel({
    required this.id,
    required this.orderNumber,
    required this.customerName,
    required this.customerPhone,
    this.customerWhatsapp,
    this.customerEmail,
    required this.shippingProvince,
    required this.shippingCity,
    required this.shippingAddress,
    this.postalCode,
    this.orderNotes,
    this.internalAdminNote,
    required this.subtotal,
    required this.discountAmount,
    required this.shippingFee,
    required this.codCharges,
    required this.totalAmount,
    required this.amountPaid,
    required this.paymentMethod,
    required this.status,
    this.trackingNumber,
    this.courier,
    required this.isPreOrder,
    this.preOrderPaymentStatus,
    this.preOrderAdvanceAmount,
    this.preOrderRemainingAmount,
    required this.isReadByAdmin,
    required this.createdAt,
    required this.updatedAt,
    this.items = const [],
    this.timeline = const [],
    this.customer,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    List<OrderItem> itemsList = [];
    if (json['items'] != null && json['items'] is List) {
      itemsList = (json['items'] as List)
          .map((i) => OrderItem.fromJson(i as Map<String, dynamic>))
          .toList();
    }

    List<OrderTimelineItem> timelineList = [];
    if (json['timeline'] != null && json['timeline'] is List) {
      timelineList = (json['timeline'] as List)
          .map((t) => OrderTimelineItem.fromJson(t as Map<String, dynamic>))
          .toList();
    }

    CustomerSummary? cust;
    if (json['customer'] != null && json['customer'] is Map) {
      cust = CustomerSummary.fromJson(json['customer'] as Map<String, dynamic>);
    }

    return OrderModel(
      id: json['id'] as String? ?? '',
      orderNumber: json['orderNumber'] as String? ?? '',
      customerName: json['customerName'] as String? ?? 'Customer',
      customerPhone: json['customerPhone'] as String? ?? '',
      customerWhatsapp: json['customerWhatsapp'] as String?,
      customerEmail: json['customerEmail'] as String?,
      shippingProvince: json['shippingProvince'] as String? ?? '',
      shippingCity: json['shippingCity'] as String? ?? '',
      shippingAddress: json['shippingAddress'] as String? ?? '',
      postalCode: json['postalCode'] as String?,
      orderNotes: json['orderNotes'] as String?,
      internalAdminNote: json['internalAdminNote'] as String?,
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0.0,
      discountAmount: (json['discountAmount'] as num?)?.toDouble() ?? 0.0,
      shippingFee: (json['shippingFee'] as num?)?.toDouble() ?? 0.0,
      codCharges: (json['codCharges'] as num?)?.toDouble() ?? 0.0,
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0.0,
      amountPaid: (json['amountPaid'] as num?)?.toDouble() ?? 0.0,
      paymentMethod: json['paymentMethod'] as String? ?? 'CASH_ON_DELIVERY',
      status: json['status'] as String? ?? 'PENDING',
      trackingNumber: json['trackingNumber'] as String?,
      courier: json['courier'] as String?,
      isPreOrder: json['isPreOrder'] as bool? ?? false,
      preOrderPaymentStatus: json['preOrderPaymentStatus'] as String?,
      preOrderAdvanceAmount: (json['preOrderAdvanceAmount'] as num?)?.toDouble(),
      preOrderRemainingAmount: (json['preOrderRemainingAmount'] as num?)?.toDouble(),
      isReadByAdmin: json['isReadByAdmin'] as bool? ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'] as String) ?? DateTime.now()
          : DateTime.now(),
      items: itemsList,
      timeline: timelineList,
      customer: cust,
    );
  }
}

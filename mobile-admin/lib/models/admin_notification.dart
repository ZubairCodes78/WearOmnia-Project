class AdminNotificationModel {
  final String id;
  final String? orderId;
  final String type;
  final String title;
  final String message;
  final bool isRead;
  final DateTime createdAt;

  AdminNotificationModel({
    required this.id,
    this.orderId,
    required this.type,
    required this.title,
    required this.message,
    required this.isRead,
    required this.createdAt,
  });

  factory AdminNotificationModel.fromJson(Map<String, dynamic> json) {
    return AdminNotificationModel(
      id: json['id'] as String? ?? '',
      orderId: json['orderId'] as String?,
      type: json['type'] as String? ?? 'GENERAL',
      title: json['title'] as String? ?? 'Notification',
      message: json['message'] as String? ?? '',
      isRead: json['isRead'] as bool? ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

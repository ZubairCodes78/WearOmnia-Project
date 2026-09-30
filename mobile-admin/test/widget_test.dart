import 'package:flutter_test/flutter_test.dart';
import 'package:wearomnia_admin/config/app_config.dart';
import 'package:wearomnia_admin/models/admin_user.dart';
import 'package:wearomnia_admin/models/notification_payload.dart';
import 'package:wearomnia_admin/models/order.dart';

void main() {
  group('WearOMNIA Admin Models and Config Tests', () {
    test('AppConfig default URL is valid and canonicalization works', () {
      expect(AppConfig.defaultBaseUrl, isNotEmpty);
      expect(AppConfig.canonicalProductionUrl, equals('https://www.wearomnia.com'));
      expect(AppConfig.notificationChannelId, equals('wearomnia_orders'));

      // Test apex wearomnia.com canonicalization
      expect(AppConfig.canonicalizeUrl('https://wearomnia.com'), equals('https://www.wearomnia.com'));
      expect(AppConfig.canonicalizeUrl('https://wearomnia.com/'), equals('https://www.wearomnia.com'));
      expect(AppConfig.canonicalizeUrl('http://wearomnia.com'), equals('https://www.wearomnia.com'));
      expect(AppConfig.canonicalizeUrl('https://www.wearomnia.com/'), equals('https://www.wearomnia.com'));
      expect(AppConfig.canonicalizeUrl('http://10.0.2.2:3000'), equals('http://10.0.2.2:3000'));
    });

    test('AdminUser deserializes correctly', () {
      final json = {
        'id': 'admin-uuid-123',
        'email': 'admin@wearomnia.com',
        'name': 'WearOMNIA Admin',
        'twoFactorEnabled': true,
        'twoFactorEnabledAt': '2026-01-01T00:00:00Z',
      };

      final admin = AdminUser.fromJson(json);
      expect(admin.id, equals('admin-uuid-123'));
      expect(admin.email, equals('admin@wearomnia.com'));
      expect(admin.twoFactorEnabled, isTrue);
      expect(admin.name, equals('WearOMNIA Admin'));
    });

    test('OrderModel deserializes with items and timeline', () {
      final json = {
        'id': 'order-101',
        'orderNumber': 'WO-2026-0001',
        'customerName': 'Ahmed Khan',
        'customerPhone': '+923001234567',
        'shippingProvince': 'Punjab',
        'shippingCity': 'Lahore',
        'shippingAddress': 'House 123, Street 4, Gulberg III',
        'subtotal': 12000.0,
        'discountAmount': 1000.0,
        'shippingFee': 250.0,
        'codCharges': 0.0,
        'totalAmount': 11250.0,
        'amountPaid': 0.0,
        'paymentMethod': 'CASH_ON_DELIVERY',
        'status': 'PENDING',
        'isPreOrder': false,
        'isReadByAdmin': false,
        'items': [
          {
            'id': 'item-1',
            'productTitle': 'Velvet Embroidered Shawl',
            'variantInfo': 'Size: Free, Color: Emerald Gold',
            'unitPrice': 12000.0,
            'quantity': 1,
            'subtotal': 12000.0,
          }
        ],
        'timeline': [
          {
            'id': 't-1',
            'status': 'PENDING',
            'note': 'Order created',
            'updatedBy': 'Customer',
          }
        ],
      };

      final order = OrderModel.fromJson(json);
      expect(order.id, equals('order-101'));
      expect(order.orderNumber, equals('WO-2026-0001'));
      expect(order.customerName, equals('Ahmed Khan'));
      expect(order.totalAmount, equals(11250.0));
      expect(order.items.length, equals(1));
      expect(order.items.first.productTitle, equals('Velvet Embroidered Shawl'));
      expect(order.timeline.length, equals(1));
    });

    test('OrderNotificationPayload parses FCM data map correctly', () {
      final map = {
        'type': 'NEW_ORDER',
        'orderId': 'order-xyz-789',
        'orderNumber': 'WO-2026-9999',
        'customerName': 'Sara Malik',
        'city': 'Karachi',
        'amount': '15500',
      };

      final payload = OrderNotificationPayload.fromMap(
        map,
        notificationTitle: '🛍️ New Order #WO-2026-9999',
        notificationBody: 'Rs. 15,500 • Sara Malik (Karachi)',
      );

      expect(payload.isNewOrder, isTrue);
      expect(payload.orderId, equals('order-xyz-789'));
      expect(payload.orderNumber, equals('WO-2026-9999'));
      expect(payload.title, contains('WO-2026-9999'));
      expect(payload.body, contains('Sara Malik'));
    });
  });
}

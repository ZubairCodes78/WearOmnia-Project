import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:wearomnia_admin/config/app_theme.dart';
import 'package:wearomnia_admin/models/order.dart';
import 'package:wearomnia_admin/screens/order_detail_screen.dart';
import 'package:wearomnia_admin/services/auth_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final testOrder = OrderModel.fromJson({
    'id': 'test-preorder-001',
    'orderNumber': 'WO-2026-9901',
    'customerName': 'Muhammad Zubair Khan',
    'customerPhone': '+923001234567',
    'customerEmail': 'zubair@wearomnia.com',
    'shippingProvince': 'Punjab',
    'shippingCity': 'Lahore',
    'shippingAddress': 'Sector Y, Phase 3, DHA Lahore',
    'subtotal': 25000.0,
    'discountAmount': 1000.0,
    'shippingFee': 250.0,
    'codCharges': 0.0,
    'totalAmount': 24250.0,
    'amountPaid': 5000.0,
    'paymentMethod': 'BANK_TRANSFER',
    'status': 'PENDING',
    'isPreOrder': true,
    'preOrderPaymentStatus': 'PAYMENT_REVIEW_PENDING',
    'preOrderAdvanceAmount': 5000.0,
    'preOrderRemainingAmount': 19250.0,
    'preOrderPaymentScreenshotUrl': 'https://example.com/proof.jpg',
    'trackingNumber': 'POSTEX-789012',
    'courier': 'PostEx',
    'isReadByAdmin': true,
    'customer': {
      'id': 'c-1',
      'name': 'Muhammad Zubair Khan',
      'phone': '+923001234567',
      'email': 'zubair@wearomnia.com',
      'ordersCount': 5,
      'totalSpent': 120000.0,
      'isVIP': true,
    },
    'items': [
      {
        'id': 'item-1',
        'productTitle': 'Royal Velvet Heavily Embroidered Shawl',
        'variantInfo': 'Size: Free, Color: Emerald Deep Gold',
        'unitPrice': 15000.0,
        'quantity': 1,
        'subtotal': 15000.0,
      },
      {
        'id': 'item-2',
        'productTitle': 'Luxury Silk Kurta Trouser Set',
        'variantInfo': 'Size: Large, Color: Jet Black',
        'unitPrice': 10000.0,
        'quantity': 1,
        'subtotal': 10000.0,
      }
    ],
    'timeline': [
      {
        'id': 'tl-1',
        'status': 'PENDING',
        'note': 'Order placed by customer via pre-order checkout',
        'updatedBy': 'Customer',
        'createdAt': '2026-09-30T10:00:00Z',
      },
      {
        'id': 'tl-2',
        'status': 'PAYMENT_REVIEW_PENDING',
        'note': 'Customer submitted bank transfer slip for advance payment',
        'updatedBy': 'Customer',
        'createdAt': '2026-09-30T10:15:00Z',
      }
    ],
  });

  Widget buildTestWidget({required Size screenSize}) {
    return MediaQuery(
      data: MediaQueryData(
        size: screenSize,
        padding: const EdgeInsets.only(top: 24, bottom: 34),
        viewPadding: const EdgeInsets.only(top: 24, bottom: 34),
      ),
      child: MaterialApp(
        theme: AppTheme.darkTheme,
        home: ChangeNotifierProvider<AuthService>(
          create: (_) => AuthService(),
          child: OrderDetailScreen(
            orderId: 'test-preorder-001',
            initialOrder: testOrder,
            autoFetch: false,
          ),
        ),
      ),
    );
  }

  final testScreens = [
    {'name': '320px (Narrow Phone)', 'size': const Size(320, 640)},
    {'name': '360px (Standard Phone)', 'size': const Size(360, 800)},
    {'name': '375px (iPhone Mini/SE)', 'size': const Size(375, 812)},
    {'name': '390px (Modern Phone)', 'size': const Size(390, 844)},
    {'name': '430px (Large Phone)', 'size': const Size(430, 932)},
    {'name': '768px (Tablet)', 'size': const Size(768, 1024)},
  ];

  for (final screen in testScreens) {
    final name = screen['name'] as String;
    final size = screen['size'] as Size;

    testWidgets('OrderDetailScreen renders without overflow on $name ($size)', (tester) async {
      tester.view.physicalSize = size;
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(buildTestWidget(screenSize: size));
      await tester.pumpAndSettle();

      // Check for zero exceptions / overflows
      expect(tester.takeException(), isNull, reason: 'Must render with zero exceptions on $name');

      // Verify header and status badge
      expect(find.text('Pre-Order Payment Proof'), findsOneWidget);
      expect(find.text('PAYMENT REVIEW'), findsOneWidget);

      // Verify payment proof action buttons
      expect(find.text('View Payment Proof'), findsOneWidget);
      expect(find.text('Approve'), findsOneWidget);
      expect(find.text('Reject'), findsOneWidget);

      // Verify top actions
      expect(find.text('Update Status'), findsWidgets);
      expect(find.text('Confirm Order'), findsWidgets);

      // Verify Sticky Bottom Bar
      expect(find.text('Review Payment Proof'), findsOneWidget);

      // Verify Customer Card & Items
      expect(find.text('Customer Details'), findsOneWidget);
      expect(find.text('Royal Velvet Heavily Embroidered Shawl'), findsOneWidget);
      expect(find.text('PostEx Courier'), findsOneWidget);
    });
  }
}

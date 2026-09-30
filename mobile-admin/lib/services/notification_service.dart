import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../models/notification_payload.dart';
import '../screens/order_detail_screen.dart';
import 'api_service.dart';

// Top-level background message handler for FCM
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (e) {
    // Firebase already initialized or failed
  }
  // Android automatically handles notification display if notification payload is present
}

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  GlobalKey<NavigatorState>? navigatorKey;
  ApiService? _apiService;

  String? _fcmToken;
  String? get fcmToken => _fcmToken;

  // Stream for in-app UI updates when foreground notification arrives
  final StreamController<OrderNotificationPayload> _foregroundNotificationController =
      StreamController<OrderNotificationPayload>.broadcast();
  Stream<OrderNotificationPayload> get onForegroundNotification =>
      _foregroundNotificationController.stream;

  // Deduplication set for processed message IDs
  final Set<String> _processedMessageIds = <String>{};

  // Pending order ID to open if tapped before UI is ready
  String? _pendingOrderIdToOpen;

  void setNavigatorKey(GlobalKey<NavigatorState> key) {
    navigatorKey = key;
    if (_pendingOrderIdToOpen != null) {
      final id = _pendingOrderIdToOpen!;
      _pendingOrderIdToOpen = null;
      Future.delayed(const Duration(milliseconds: 600), () {
        navigateToOrderDetail(id);
      });
    }
  }

  void updateApiService(ApiService apiService) {
    _apiService = apiService;
    // If we have an FCM token and an authenticated API service, register it
    if (_fcmToken != null) {
      registerDeviceTokenWithBackend(_fcmToken!);
    }
  }

  Future<void> initialize() async {
    try {
      // 1. Initialize Flutter Local Notifications for Android Foreground display
      const AndroidInitializationSettings androidSettings =
          AndroidInitializationSettings('@mipmap/ic_launcher');
      const DarwinInitializationSettings iosSettings =
          DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );

      const InitializationSettings initSettings = InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      );

      await _localNotifications.initialize(
        settings: initSettings,
        onDidReceiveNotificationResponse: (NotificationResponse response) {
          if (response.payload != null && response.payload!.isNotEmpty) {
            try {
              final data = jsonDecode(response.payload!) as Map<String, dynamic>;
              _handleNotificationData(data);
            } catch (e) {
              // Payload not JSON
            }
          }
        },
      );

      // Create Android Notification Channel
      if (!kIsWeb && Platform.isAndroid) {
        final AndroidNotificationChannel channel = AndroidNotificationChannel(
          AppConfig.notificationChannelId,
          AppConfig.notificationChannelName,
          description: AppConfig.notificationChannelDescription,
          importance: Importance.max,
          playSound: true,
          enableVibration: true,
        );

        await _localNotifications
            .resolvePlatformSpecificImplementation<
                AndroidFlutterLocalNotificationsPlugin>()
            ?.createNotificationChannel(channel);
      }

      // 2. Request Notification Permissions from FCM
      final settings = await _fcm.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: true,
        provisional: false,
        sound: true,
      );

      if (kDebugMode) {
        print('[FCM] User granted permission: ${settings.authorizationStatus}');
      }

      // 3. Get FCM Device Token
      _fcmToken = await _fcm.getToken();
      if (kDebugMode) {
        print('[FCM] Device Token: $_fcmToken');
      }

      if (_fcmToken != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('cached_fcm_token', _fcmToken!);
        if (_apiService != null) {
          await registerDeviceTokenWithBackend(_fcmToken!);
        }
      }

      // 4. Handle Token Refresh
      _fcm.onTokenRefresh.listen((newToken) {
        _fcmToken = newToken;
        if (kDebugMode) {
          print('[FCM] Token refreshed: $newToken');
        }
        if (_apiService != null) {
          registerDeviceTokenWithBackend(newToken);
        }
      });

      // 5. Handle Foreground Messages (App Open & Active)
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        _handleForegroundMessage(message);
      });

      // 6. Handle Background Notification Click (App in Background)
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        _handleNotificationData(message.data);
      });

      // 7. Handle Cold Start Notification Click (App Terminated)
      final initialMessage = await _fcm.getInitialMessage();
      if (initialMessage != null) {
        _handleNotificationData(initialMessage.data);
      }
    } catch (e) {
      if (kDebugMode) {
        print('[FCM] Notification initialization error: $e');
      }
    }
  }

  // Handles incoming message when app is in foreground
  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    final messageId = message.messageId ??
        '${message.data['orderId']}_${DateTime.now().millisecondsSinceEpoch}';

    // Deduplication check
    if (_processedMessageIds.contains(messageId)) {
      return;
    }
    _processedMessageIds.add(messageId);
    if (_processedMessageIds.length > 50) {
      _processedMessageIds.remove(_processedMessageIds.first);
    }

    final title = message.notification?.title ??
        message.data['title'] ??
        '🛍️ New Order Received';
    final body = message.notification?.body ??
        message.data['body'] ??
        'A new customer order has been placed.';

    // Broadcast to UI stream
    final payload = OrderNotificationPayload.fromMap(
      message.data,
      notificationTitle: title,
      notificationBody: body,
    );
    _foregroundNotificationController.add(payload);

    // Show heads-up notification in Android status bar with sound
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      AppConfig.notificationChannelId,
      AppConfig.notificationChannelName,
      channelDescription: AppConfig.notificationChannelDescription,
      importance: Importance.max,
      priority: Priority.high,
      playSound: true,
      enableVibration: true,
      icon: '@mipmap/ic_launcher',
    );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const NotificationDetails notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    final notificationId =
        (message.data['orderNumber']?.hashCode ?? DateTime.now().millisecondsSinceEpoch) % 100000;

    await _localNotifications.show(
      id: notificationId,
      title: title,
      body: body,
      notificationDetails: notificationDetails,
      payload: jsonEncode(message.data),
    );
  }

  // Handles clicking a notification (from foreground local notification, background click, or cold launch)
  void _handleNotificationData(Map<String, dynamic> data) {
    final orderId = data['orderId'] as String?;
    if (orderId != null && orderId.isNotEmpty) {
      navigateToOrderDetail(orderId);
    }
  }

  String? get pendingOrderId => _pendingOrderIdToOpen;
  void clearPendingOrder() => _pendingOrderIdToOpen = null;

  // Navigates directly to the exact Order Detail screen
  void navigateToOrderDetail(String orderId, {bool isAuthenticated = true}) {
    if (!isAuthenticated) {
      _pendingOrderIdToOpen = orderId;
      return;
    }

    if (navigatorKey?.currentState != null) {
      navigatorKey!.currentState!.push(
        MaterialPageRoute(
          builder: (context) => OrderDetailScreen(orderId: orderId),
        ),
      );
    } else {
      _pendingOrderIdToOpen = orderId;
    }
  }

  // Registers FCM token securely with the Next.js backend
  Future<void> registerDeviceTokenWithBackend(String token) async {
    if (_apiService != null) {
      final success = await _apiService!.registerDeviceToken(token);
      if (kDebugMode) {
        print('[FCM] Device token registered with backend: $success');
      }
    }
  }

  // Unregisters FCM token on admin logout
  Future<void> unregisterDeviceTokenFromBackend() async {
    if (_fcmToken != null && _apiService != null) {
      await _apiService!.unregisterDeviceToken(_fcmToken!);
    }
  }

  void dispose() {
    _foregroundNotificationController.close();
  }
}

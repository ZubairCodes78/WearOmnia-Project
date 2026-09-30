import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/order.dart';
import '../models/admin_user.dart';
import 'device_service.dart';

class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? error;
  final bool requires2FA;
  final String? challengeToken;
  final bool isRevoked;

  ApiResponse({
    required this.success,
    this.data,
    this.error,
    this.requires2FA = false,
    this.challengeToken,
    this.isRevoked = false,
  });
}

class DashboardStats {
  final int todayOrders;
  final int pendingOrders;
  final int confirmedOrders;
  final int preOrders;
  final int pendingPayments;
  final double totalRevenue;

  DashboardStats({
    required this.todayOrders,
    required this.pendingOrders,
    required this.confirmedOrders,
    required this.preOrders,
    required this.pendingPayments,
    required this.totalRevenue,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      todayOrders: (json['todayOrders'] as num?)?.toInt() ?? 0,
      pendingOrders: (json['pendingOrders'] as num?)?.toInt() ?? 0,
      confirmedOrders: (json['confirmedOrders'] as num?)?.toInt() ?? 0,
      preOrders: (json['preOrders'] as num?)?.toInt() ?? 0,
      pendingPayments: (json['pendingPayments'] as num?)?.toInt() ?? 0,
      totalRevenue: (json['totalRevenue'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class DashboardData {
  final DashboardStats stats;
  final List<OrderModel> recentOrders;

  DashboardData({required this.stats, required this.recentOrders});
}

class ApiService {
  final String? authToken;
  static String? _cachedDeviceId;

  ApiService({this.authToken});

  static void setDeviceId(String id) {
    _cachedDeviceId = id;
  }

  Map<String, String> _buildHeaders() {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (authToken != null && authToken!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $authToken';
    }
    if (_cachedDeviceId != null && _cachedDeviceId!.isNotEmpty) {
      headers['x-device-id'] = _cachedDeviceId!;
    }
    return headers;
  }

  static Map<String, dynamic>? _tryDecode(String body) {
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map<String, dynamic>) return decoded;
    } catch (_) {}
    return null;
  }

  static const Duration requestTimeout = Duration(seconds: 30);

  /// Transparently follow HTTP 301, 302, 307, 308 redirects for POST requests
  static Future<http.Response> _safePost(
    Uri uri, {
    Map<String, String>? headers,
    Object? body,
    Duration timeout = requestTimeout,
    int maxRedirects = 3,
  }) async {
    var currentUri = uri;
    for (int i = 0; i <= maxRedirects; i++) {
      final response = await http
          .post(currentUri, headers: headers, body: body)
          .timeout(timeout);

      if (response.statusCode == 301 ||
          response.statusCode == 302 ||
          response.statusCode == 307 ||
          response.statusCode == 308) {
        final location = response.headers['location'];
        if (location != null && location.isNotEmpty && i < maxRedirects) {
          final nextUri = currentUri.resolve(location);
          if (nextUri.scheme == 'https' || nextUri.host == currentUri.host) {
            if ((response.statusCode == 301 || response.statusCode == 308) &&
                nextUri.host != currentUri.host) {
              final newBase = '${nextUri.scheme}://${nextUri.host}';
              AppConfig.setBaseUrl(newBase);
            }
            currentUri = nextUri;
            continue;
          }
        }
      }
      return response;
    }
    throw http.ClientException('Too many redirects', uri);
  }

  /// Transparently follow HTTP 301, 302, 307, 308 redirects for GET requests
  static Future<http.Response> _safeGet(
    Uri uri, {
    Map<String, String>? headers,
    Duration timeout = requestTimeout,
    int maxRedirects = 3,
  }) async {
    var currentUri = uri;
    for (int i = 0; i <= maxRedirects; i++) {
      final response = await http
          .get(currentUri, headers: headers)
          .timeout(timeout);

      if (response.statusCode == 301 ||
          response.statusCode == 302 ||
          response.statusCode == 307 ||
          response.statusCode == 308) {
        final location = response.headers['location'];
        if (location != null && location.isNotEmpty && i < maxRedirects) {
          final nextUri = currentUri.resolve(location);
          if (nextUri.scheme == 'https' || nextUri.host == currentUri.host) {
            if ((response.statusCode == 301 || response.statusCode == 308) &&
                nextUri.host != currentUri.host) {
              final newBase = '${nextUri.scheme}://${nextUri.host}';
              AppConfig.setBaseUrl(newBase);
            }
            currentUri = nextUri;
            continue;
          }
        }
      }
      return response;
    }
    throw http.ClientException('Too many redirects', uri);
  }

  // 1. Admin Login
  static Future<ApiResponse<AdminUser>> login({
    required String email,
    required String password,
  }) async {
    try {
      final url = Uri.parse('${AppConfig.baseUrl}/api/admin/login');
      final response = await _safePost(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email.trim(),
          'password': password,
        }),
      );

      final json = _tryDecode(response.body);

      if (response.statusCode == 200 && json != null) {
        if (json['requires2FA'] == true) {
          return ApiResponse(
            success: false,
            requires2FA: true,
            challengeToken: json['challengeToken'] as String?,
          );
        }

        final admin = AdminUser.fromJson(json['admin'] as Map<String, dynamic>);
        return ApiResponse(
          success: true,
          data: admin,
          challengeToken: json['token'] as String?, // token is admin.id
        );
      } else {
        return ApiResponse(
          success: false,
          error: json?['error'] as String? ?? 'Login failed (${response.statusCode})',
        );
      }
    } catch (e) {
      return ApiResponse(
        success: false,
        error: 'Network connection error: ${e.toString()}',
      );
    }
  }

  // 2. Verify 2FA TOTP or Recovery Code
  static Future<ApiResponse<AdminUser>> verify2FA({
    required String code,
    String? challengeToken,
    bool isRecoveryCode = false,
  }) async {
    try {
      final url = Uri.parse('${AppConfig.baseUrl}/api/admin/2fa/verify');
      final response = await _safePost(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'code': code.trim(),
          'challengeToken': challengeToken,
          'isRecoveryCode': isRecoveryCode,
        }),
      );

      final json = _tryDecode(response.body);

      if (response.statusCode == 200 && json != null && json['success'] == true) {
        final admin = AdminUser.fromJson(json['admin'] as Map<String, dynamic>);
        return ApiResponse(
          success: true,
          data: admin,
          challengeToken: json['token'] as String?, // session token
        );
      } else {
        return ApiResponse(
          success: false,
          error: json?['error'] as String? ?? '2FA verification failed (${response.statusCode})',
        );
      }
    } catch (e) {
      return ApiResponse(
        success: false,
        error: 'Network connection error: ${e.toString()}',
      );
    }
  }

  // 3. Register FCM Device Token
  Future<bool> registerDeviceToken(String fcmToken) async {
    try {
      final details = await DeviceService.getDeviceDetails();
      final url = Uri.parse('${AppConfig.baseUrl}/api/admin/devices/register');
      final response = await _safePost(
        url,
        headers: _buildHeaders(),
        body: jsonEncode({
          'fcmToken': fcmToken,
          'deviceType': details.deviceType,
          'deviceName': details.deviceName,
          'deviceId': details.deviceId,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // 4. Unregister FCM Device Token
  Future<bool> unregisterDeviceToken(String fcmToken) async {
    try {
      final url = Uri.parse('${AppConfig.baseUrl}/api/admin/devices/unregister');
      final response = await _safePost(
        url,
        headers: _buildHeaders(),
        body: jsonEncode({'fcmToken': fcmToken}),
      );

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // 5. Fetch Orders
  Future<ApiResponse<List<OrderModel>>> fetchOrders({
    String? status,
    String? search,
    int page = 1,
    int limit = 30,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
      };
      if (status != null && status.isNotEmpty && status != 'ALL') {
        queryParams['status'] = status;
      }
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      final uri = Uri.parse('${AppConfig.baseUrl}/api/admin/orders')
          .replace(queryParameters: queryParams);

      final response = await _safeGet(uri, headers: _buildHeaders());

      if (response.statusCode == 200) {
        final json = _tryDecode(response.body);
        if (json != null) {
          final rawOrders = json['orders'] as List? ?? [];
          final orders = rawOrders
              .map((o) => OrderModel.fromJson(o as Map<String, dynamic>))
              .toList();

          return ApiResponse(success: true, data: orders);
        }
        return ApiResponse(success: false, error: 'Malformed orders response from server');
      } else {
        return ApiResponse(
          success: false,
          error: 'Failed to fetch orders (Code: ${response.statusCode})',
        );
      }
    } catch (e) {
      return ApiResponse(
        success: false,
        error: 'Network connection error: ${e.toString()}',
      );
    }
  }

  // 6. Fetch Single Order Detail
  Future<ApiResponse<OrderModel>> fetchOrderDetail(String orderId) async {
    try {
      final uri = Uri.parse('${AppConfig.baseUrl}/api/admin/orders/$orderId');
      final response = await _safeGet(uri, headers: _buildHeaders());

      if (response.statusCode == 200) {
        final json = _tryDecode(response.body);
        if (json != null && json['order'] != null) {
          final order = OrderModel.fromJson(json['order'] as Map<String, dynamic>);
          return ApiResponse(success: true, data: order);
        }
        return ApiResponse(success: false, error: 'Malformed order detail response');
      } else {
        return ApiResponse(
          success: false,
          error: 'Order not found or access denied (${response.statusCode})',
        );
      }
    } catch (e) {
      return ApiResponse(
        success: false,
        error: 'Network connection error: ${e.toString()}',
      );
    }
  }

  // 7. Update Order Status
  Future<ApiResponse<bool>> updateOrderStatus({
    required String orderId,
    required String status,
    String? internalAdminNote,
  }) async {
    try {
      final uri = Uri.parse('${AppConfig.baseUrl}/api/admin/orders/update-status');
      final bodyMap = <String, dynamic>{
        'orderId': orderId,
        'status': status,
      };
      if (internalAdminNote != null) {
        bodyMap['internalAdminNote'] = internalAdminNote;
      }

      final response = await _safePost(
        uri,
        headers: _buildHeaders(),
        body: jsonEncode(bodyMap),
      );

      final json = _tryDecode(response.body);
      if (response.statusCode == 200 && json?['success'] == true) {
        return ApiResponse(success: true, data: true);
      } else {
        return ApiResponse(
          success: false,
          error: json?['error'] as String? ?? 'Failed to update order status',
        );
      }
    } catch (e) {
      return ApiResponse(
        success: false,
        error: 'Network error: ${e.toString()}',
      );
    }
  }

  // 8. Test Push Notification
  Future<ApiResponse<bool>> sendTestPushNotification({String? orderId}) async {
    try {
      final uri = Uri.parse('${AppConfig.baseUrl}/api/admin/notifications/test-push');
      final bodyMap = <String, dynamic>{
        'title': '⚡ WearOMNIA Push Test',
        'body': 'FCM high-priority delivery test for Admin App.',
      };
      if (orderId != null) {
        bodyMap['orderId'] = orderId;
      }

      final response = await _safePost(
        uri,
        headers: _buildHeaders(),
        body: jsonEncode(bodyMap),
      );

      final json = _tryDecode(response.body);
      if (response.statusCode == 200 && json?['success'] == true) {
        return ApiResponse(success: true, data: true);
      } else {
        return ApiResponse(
          success: false,
          error: json?['error'] as String? ?? 'Failed to send test push',
        );
      }
    } catch (e) {
      return ApiResponse(
        success: false,
        error: 'Network error: ${e.toString()}',
      );
    }
  }

  // 9. Fetch Dashboard Data
  Future<ApiResponse<DashboardData>> fetchDashboardData() async {
    try {
      final uri = Uri.parse('${AppConfig.baseUrl}/api/admin/dashboard/stats');
      final response = await _safeGet(uri, headers: _buildHeaders());

      final json = _tryDecode(response.body);

      if (response.statusCode == 200 && json != null) {
        final statsJson = json['stats'] as Map<String, dynamic>? ?? {};
        final recentOrdersList = (json['recentOrders'] as List? ?? [])
            .map((o) => OrderModel.fromJson(o as Map<String, dynamic>))
            .toList();

        return ApiResponse(
          success: true,
          data: DashboardData(
            stats: DashboardStats.fromJson(statsJson),
            recentOrders: recentOrdersList,
          ),
        );
      } else if (response.statusCode == 403 && json?['error'] == 'DEVICE_REVOKED') {
        return ApiResponse(
          success: false,
          isRevoked: true,
          error: 'This device has been revoked by an administrator.',
        );
      } else {
        return ApiResponse(
          success: false,
          error: json?['error'] as String? ?? 'Failed to load dashboard data (${response.statusCode})',
        );
      }
    } catch (e) {
      return ApiResponse(
        success: false,
        error: 'Network connection error: ${e.toString()}',
      );
    }
  }

  // 10. Approve Payment
  Future<ApiResponse<bool>> approvePayment(String orderId) async {
    try {
      final uri = Uri.parse('${AppConfig.baseUrl}/api/admin/orders/$orderId/approve-payment');
      final response = await _safePost(uri, headers: _buildHeaders());

      final json = _tryDecode(response.body);
      if (response.statusCode == 200 && json?['success'] == true) {
        return ApiResponse(success: true, data: true);
      } else {
        return ApiResponse(
          success: false,
          error: json?['error'] as String? ?? 'Failed to approve payment',
        );
      }
    } catch (e) {
      return ApiResponse(
        success: false,
        error: 'Network error: ${e.toString()}',
      );
    }
  }

  // 11. Reject Payment
  Future<ApiResponse<bool>> rejectPayment(String orderId, String reason) async {
    try {
      final uri = Uri.parse('${AppConfig.baseUrl}/api/admin/orders/$orderId/reject-payment');
      final response = await _safePost(
        uri,
        headers: _buildHeaders(),
        body: jsonEncode({'reason': reason}),
      );

      final json = _tryDecode(response.body);
      if (response.statusCode == 200 && json?['success'] == true) {
        return ApiResponse(success: true, data: true);
      } else {
        return ApiResponse(
          success: false,
          error: json?['error'] as String? ?? 'Failed to reject payment',
        );
      }
    } catch (e) {
      return ApiResponse(
        success: false,
        error: 'Network error: ${e.toString()}',
      );
    }
  }

  // 12. Confirm Order
  Future<ApiResponse<bool>> confirmOrder(String orderId) async {
    try {
      final uri = Uri.parse('${AppConfig.baseUrl}/api/admin/orders/$orderId/confirm');
      final response = await _safePost(uri, headers: _buildHeaders());

      final json = _tryDecode(response.body);
      if (response.statusCode == 200 && json?['success'] == true) {
        return ApiResponse(success: true, data: true);
      } else {
        return ApiResponse(
          success: false,
          error: json?['error'] as String? ?? 'Failed to confirm order',
        );
      }
    } catch (e) {
      return ApiResponse(
        success: false,
        error: 'Network error: ${e.toString()}',
      );
    }
  }
}

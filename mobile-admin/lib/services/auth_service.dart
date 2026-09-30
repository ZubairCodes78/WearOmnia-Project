import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/admin_user.dart';
import 'api_service.dart';
import 'device_service.dart';

class AuthService extends ChangeNotifier {
  static const String _keyToken = 'wearomnia_admin_token';
  static const String _keyUser = 'wearomnia_admin_user';

  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  AdminUser? _currentUser;
  String? _token;
  bool _isLoading = true;
  String? _challengeToken;

  AdminUser? get currentUser => _currentUser;
  String? get token => _token;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _token != null && _currentUser != null;
  String? get challengeToken => _challengeToken;
  ApiService get apiService => ApiService(authToken: _token);

  Future<void> init() async {
    try {
      final deviceId = await DeviceService.getDeviceId();
      ApiService.setDeviceId(deviceId);

      final savedToken = await _storage.read(key: _keyToken);
      final savedUserJson = await _storage.read(key: _keyUser);

      if (savedToken != null && savedUserJson != null) {
        _token = savedToken;
        _currentUser = AdminUser.fromJson(
          jsonDecode(savedUserJson) as Map<String, dynamic>,
        );
      }
    } catch (e) {
      // print('[AuthService] Error restoring session: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> handleSessionRevocation() async {
    await logout();
  }

  Future<ApiResponse<AdminUser>> login({
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final res = await ApiService.login(email: email, password: password);

      if (res.requires2FA) {
        _challengeToken = res.challengeToken;
        _isLoading = false;
        notifyListeners();
        return res;
      }

      if (res.success && res.data != null) {
        _token = res.challengeToken; // token is returned here
        _currentUser = res.data;
        _challengeToken = null;

        if (_token != null) {
          await _storage.write(key: _keyToken, value: _token);
          await _storage.write(
            key: _keyUser,
            value: jsonEncode(_currentUser!.toJson()),
          );
        }
      }

      _isLoading = false;
      notifyListeners();
      return res;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return ApiResponse(success: false, error: e.toString());
    }
  }

  Future<ApiResponse<AdminUser>> verify2FA({
    required String code,
    bool isRecoveryCode = false,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final res = await ApiService.verify2FA(
        code: code,
        challengeToken: _challengeToken,
        isRecoveryCode: isRecoveryCode,
      );

      if (res.success && res.data != null) {
        _token = res.challengeToken;
        _currentUser = res.data;
        _challengeToken = null;

        if (_token != null) {
          await _storage.write(key: _keyToken, value: _token);
          await _storage.write(
            key: _keyUser,
            value: jsonEncode(_currentUser!.toJson()),
          );
        }
      }

      _isLoading = false;
      notifyListeners();
      return res;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return ApiResponse(success: false, error: e.toString());
    }
  }

  Future<void> logout({Function(String token)? onBeforeClear}) async {
    if (_token != null && onBeforeClear != null) {
      await onBeforeClear(_token!);
    }

    _token = null;
    _currentUser = null;
    _challengeToken = null;

    await _storage.delete(key: _keyToken);
    await _storage.delete(key: _keyUser);

    notifyListeners();
  }
}

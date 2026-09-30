import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppConfig {
  static const String appName = 'WearOMNIA Admin';
  static const String notificationChannelId = 'wearomnia_orders';
  static const String notificationChannelName = 'WearOMNIA New Orders';
  static const String notificationChannelDescription =
      'Instant high-priority alerts for new customer orders';

  static const String _prefBaseUrlKey = 'wearomnia_api_base_url';

  // Default base URL depending on platform / mode
  static String get defaultBaseUrl {
    if (kReleaseMode) {
      return 'https://wearomnia.com';
    }
    if (kIsWeb) return 'http://localhost:3000';
    if (Platform.isAndroid) {
      // 10.0.2.2 points to host machine from standard Android Emulator
      return 'http://10.0.2.2:3000';
    }
    return 'http://localhost:3000';
  }

  static String _currentBaseUrl = '';

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _currentBaseUrl = prefs.getString(_prefBaseUrlKey) ?? defaultBaseUrl;
  }

  static String get baseUrl {
    if (_currentBaseUrl.isEmpty) {
      return defaultBaseUrl;
    }
    return _currentBaseUrl;
  }

  static Future<void> setBaseUrl(String url) async {
    final cleanUrl = url.trim().replaceAll(RegExp(r'/+$'), '');
    _currentBaseUrl = cleanUrl;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefBaseUrlKey, cleanUrl);
  }
}

import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppConfig {
  static const String appName = 'WearOMNIA Admin';
  static const String notificationChannelId = 'wearomnia_orders';
  static const String notificationChannelName = 'WearOMNIA New Orders';
  static const String notificationChannelDescription =
      'Instant high-priority alerts for new customer orders';

  static const String canonicalProductionUrl = 'https://www.wearomnia.com';
  static const String _prefBaseUrlKey = 'wearomnia_api_base_url';

  /// Canonicalize base URLs. Automatically converts apex wearomnia.com to www.wearomnia.com
  /// and strips trailing slashes to avoid HTTP 308 redirects.
  static String canonicalizeUrl(String url) {
    var cleanUrl = url.trim().replaceAll(RegExp(r'/+$'), '');
    if (cleanUrl.isEmpty) return defaultBaseUrl;

    try {
      final uri = Uri.parse(cleanUrl);
      if (uri.host.toLowerCase() == 'wearomnia.com') {
        final updatedUri = uri.replace(scheme: 'https', host: 'www.wearomnia.com');
        return updatedUri.toString().replaceAll(RegExp(r'/+$'), '');
      }
    } catch (_) {}
    return cleanUrl;
  }

  // Default base URL depending on platform / mode
  static String get defaultBaseUrl {
    if (kReleaseMode) {
      return canonicalProductionUrl;
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
    final saved = prefs.getString(_prefBaseUrlKey);
    if (saved != null && saved.isNotEmpty) {
      final canonical = canonicalizeUrl(saved);
      _currentBaseUrl = canonical;
      if (canonical != saved) {
        await prefs.setString(_prefBaseUrlKey, canonical);
      }
    } else {
      _currentBaseUrl = defaultBaseUrl;
    }
  }

  static String get baseUrl {
    if (_currentBaseUrl.isEmpty) {
      return defaultBaseUrl;
    }
    return _currentBaseUrl;
  }

  static Future<void> setBaseUrl(String url) async {
    final cleanUrl = canonicalizeUrl(url);
    _currentBaseUrl = cleanUrl;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefBaseUrlKey, cleanUrl);
  }
}

import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';

class DeviceDetails {
  final String deviceType;
  final String deviceName;
  final String deviceId;

  DeviceDetails({
    required this.deviceType,
    required this.deviceName,
    required this.deviceId,
  });
}

class DeviceService {
  static final DeviceInfoPlugin _deviceInfo = DeviceInfoPlugin();
  static String? _cachedDeviceId;

  static Future<String> getDeviceId() async {
    if (_cachedDeviceId != null) return _cachedDeviceId!;
    final details = await getDeviceDetails();
    _cachedDeviceId = details.deviceId;
    return _cachedDeviceId!;
  }

  static Future<DeviceDetails> getDeviceDetails() async {
    if (kIsWeb) {
      final webInfo = await _deviceInfo.webBrowserInfo;
      return DeviceDetails(
        deviceType: 'web',
        deviceName: '${webInfo.browserName.name} Browser',
        deviceId: 'web-${webInfo.userAgent?.hashCode.toString() ?? "unknown"}',
      );
    }

    if (Platform.isAndroid) {
      final androidInfo = await _deviceInfo.androidInfo;
      final name = '${androidInfo.manufacturer} ${androidInfo.model}';
      return DeviceDetails(
        deviceType: 'android',
        deviceName: name,
        deviceId: androidInfo.id,
      );
    }

    if (Platform.isIOS) {
      final iosInfo = await _deviceInfo.iosInfo;
      return DeviceDetails(
        deviceType: 'ios',
        deviceName: iosInfo.utsname.machine,
        deviceId: iosInfo.identifierForVendor ?? 'ios-device',
      );
    }

    return DeviceDetails(
      deviceType: 'other',
      deviceName: 'Admin Device',
      deviceId: 'generic-device',
    );
  }
}

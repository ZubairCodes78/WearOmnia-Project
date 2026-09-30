import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'config/app_config.dart';
import 'config/app_theme.dart';
import 'screens/splash_screen.dart';
import 'services/auth_service.dart';
import 'services/notification_service.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 1. Initialize local configuration & stored API endpoint
  try {
    await AppConfig.init().timeout(const Duration(seconds: 3));
  } catch (e) {
    debugPrint('[Main] AppConfig init note: $e');
  }

  // 2. Launch UI immediately so Flutter can paint frame 0 without blocking on network/FCM
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
      ],
      child: const WearOmniaAdminApp(),
    ),
  );

  // 3. Initialize Firebase & Notification Service asynchronously post-launch
  _initServicesAsync();
}

Future<void> _initServicesAsync() async {
  try {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  } catch (e) {
    debugPrint('[Main] Firebase initialization note: $e');
  }

  try {
    final notifService = NotificationService();
    notifService.setNavigatorKey(navigatorKey);
    await notifService.initialize();
  } catch (e) {
    debugPrint('[Main] Notification initialization error: $e');
  }
}

class WearOmniaAdminApp extends StatelessWidget {
  const WearOmniaAdminApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'WearOMNIA Admin',
      debugShowCheckedModeBanner: false,
      navigatorKey: navigatorKey,
      theme: AppTheme.darkTheme,
      home: const SplashScreen(),
    );
  }
}

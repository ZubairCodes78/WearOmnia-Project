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
  await AppConfig.init();

  // 2. Initialize Firebase Core
  try {
    await Firebase.initializeApp();
    // Register background messaging callback
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  } catch (e) {
    debugPrint('[Main] Firebase initialization note: $e');
  }

  // 3. Initialize Notification Service
  final notifService = NotificationService();
  notifService.setNavigatorKey(navigatorKey);
  await notifService.initialize();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
      ],
      child: const WearOmniaAdminApp(),
    ),
  );
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

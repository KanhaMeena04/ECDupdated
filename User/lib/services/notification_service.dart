import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'notification_api_service.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint("Handling background FCM message in User app: ${message.messageId}");
}

class NotificationService {
  static final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  static bool _initialized = false;

  static Future<void> initialize() async {
    if (_initialized) return;

    try {
      // Set background messaging handler
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // Request permission (Required for iOS, Android 13+)
      NotificationSettings settings = await _firebaseMessaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      debugPrint('User granted notification permission: ${settings.authorizationStatus}');

      // Configure foreground notification presentation options
      await _firebaseMessaging.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      // Fetch and register token
      await registerToken();

      // Listen for token refreshes
      _firebaseMessaging.onTokenRefresh.listen((newToken) {
        debugPrint("User FCM Token refreshed: $newToken");
        NotificationApiService.registerDevice(newToken);
      });

      // Foreground message listener
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('Notification received in foreground!');
        debugPrint('Title: ${message.notification?.title}');
        debugPrint('Body: ${message.notification?.body}');
      });

      // App opened from notification listener
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('User opened app from notification: ${message.data}');
      });

      _initialized = true;
    } catch (e) {
      debugPrint('NotificationService initialize error: $e');
    }
  }

  static Future<String?> getToken() async {
    try {
      return await _firebaseMessaging.getToken();
    } catch (e) {
      debugPrint('Error getting FCM token: $e');
      return null;
    }
  }

  static Future<void> registerToken() async {
    try {
      final token = await getToken();
      if (token != null && token.isNotEmpty) {
        debugPrint('Registering FCM token with backend...');
        await NotificationApiService.registerDevice(token);
      }
    } catch (e) {
      debugPrint('Error registering FCM token: $e');
    }
  }
}

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import '../routes/app_routes.dart';
import 'notification_api_service.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
    debugPrint("Handling background FCM message in User app: ${message.messageId}");
  } catch (e) {
    debugPrint("Background FCM error: $e");
  }
}

class NotificationService {
  static bool _initialized = false;

  static FirebaseMessaging? get _messagingInstance {
    try {
      return FirebaseMessaging.instance;
    } catch (e) {
      debugPrint('FirebaseMessaging not available: $e');
      return null;
    }
  }

  static Future<void> initialize() async {
    if (_initialized) return;

    try {
      final messaging = _messagingInstance;
      if (messaging == null) {
        debugPrint('NotificationService: Firebase not initialized, skipping FCM.');
        return;
      }

      // Set background messaging handler
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // Request permission (Required for iOS, Android 13+)
      NotificationSettings settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      debugPrint('User granted notification permission: ${settings.authorizationStatus}');

      // Configure foreground notification presentation options
      await messaging.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      // Fetch and register token
      await registerToken();

      // Listen for token refreshes
      messaging.onTokenRefresh.listen((newToken) {
        debugPrint("User FCM Token refreshed: $newToken");
        NotificationApiService.registerDevice(newToken);
      });

      // Foreground message listener
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('Notification received in foreground!');
        final title = message.notification?.title ?? message.data['title']?.toString() ?? '';
        final body = message.notification?.body ?? message.data['message']?.toString() ?? '';
        debugPrint('Title: $title');
        debugPrint('Body: $body');
        NotificationApiService.refreshUnreadCount();

        final ctx = AppRoutes.rootNavigatorKey.currentContext;
        if (ctx != null && (title.isNotEmpty || body.isNotEmpty)) {
          ScaffoldMessenger.maybeOf(ctx)?.showSnackBar(
            SnackBar(
              behavior: SnackBarBehavior.floating,
              backgroundColor: const Color(0xFF248C70),
              duration: const Duration(seconds: 4),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (title.isNotEmpty)
                    Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                  if (body.isNotEmpty)
                    Text(body, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white)),
                ],
              ),
            ),
          );
        }
      });

      // App opened from background notification listener
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('User opened app from background notification: ${message.data}');
        NotificationApiService.refreshUnreadCount();
      });

      // App opened from terminated/killed state (Recent Apps swiped away)
      try {
        final initialMessage = await messaging.getInitialMessage();
        if (initialMessage != null) {
          debugPrint('User opened app from terminated state via notification: ${initialMessage.data}');
          NotificationApiService.refreshUnreadCount();
        }
      } catch (e) {
        debugPrint('Error getting initial FCM message: $e');
      }

      _initialized = true;
    } catch (e) {
      debugPrint('NotificationService initialize error: $e');
    }
  }

  static Future<String?> getToken() async {
    try {
      final messaging = _messagingInstance;
      if (messaging == null) return null;
      return await messaging.getToken().timeout(const Duration(seconds: 4));
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

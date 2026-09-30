import 'dart:convert';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../api_constants.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint("Handling background FCM message in Restaurant app: ${message.messageId}");
}

class RestaurantNotificationService {
  static final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  static bool _initialized = false;

  static Future<void> initialize() async {
    if (_initialized) return;

    try {
      // Background message handler
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // Request notification permissions
      NotificationSettings settings = await _firebaseMessaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      debugPrint('Restaurant granted notification permission: ${settings.authorizationStatus}');

      // Configure foreground presentation options so popups/sounds play when open
      await _firebaseMessaging.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      // Register device token with backend
      await registerToken();

      // Listen for token refreshes
      _firebaseMessaging.onTokenRefresh.listen((newToken) {
        debugPrint("Restaurant FCM Token refreshed: $newToken");
        saveTokenToBackend(newToken);
      });

      // Foreground message listener
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('Restaurant FCM received in foreground: ${message.notification?.title}');
      });

      // Notification click listener
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('Restaurant opened app from notification: ${message.data}');
      });

      _initialized = true;
    } catch (e) {
      debugPrint('RestaurantNotificationService initialize error: $e');
    }
  }

  static Future<String?> getToken() async {
    try {
      return await _firebaseMessaging.getToken();
    } catch (e) {
      debugPrint('Error getting FCM token in Restaurant app: $e');
      return null;
    }
  }

  static Future<void> registerToken() async {
    try {
      final token = await getToken();
      if (token != null && token.isNotEmpty) {
        await saveTokenToBackend(token);
      }
    } catch (e) {
      debugPrint('Error registering FCM token for Restaurant: $e');
    }
  }

  static Future<bool> saveTokenToBackend(String fcmToken) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token') ?? '';
      
      if (token.isEmpty) {
        debugPrint('No auth token available to save FCM token yet');
        return false;
      }

      final url = Uri.parse('${ApiConstants.baseUrl}/api/users/fcm-token');
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'fcmToken': fcmToken}),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        debugPrint('✅ Restaurant FCM token registered successfully with backend');
        return true;
      } else {
        debugPrint('❌ Failed to register Restaurant FCM token: ${response.statusCode} - ${response.body}');
        return false;
      }
    } catch (e) {
      debugPrint('Error sending FCM token to backend: $e');
      return false;
    }
  }
}

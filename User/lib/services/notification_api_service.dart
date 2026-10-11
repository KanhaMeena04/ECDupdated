import '../core/constants/app_constants.dart';
import '../core/config/app_mode.dart';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'auth_service.dart';
import 'socket_service.dart';

class NotificationApiService {
  static String get apiBaseUrl => AppConstants.baseUrl;
  static String get notificationsUrl => '$apiBaseUrl/notifications';

  /// Reactive unread count notifier for dynamic notification badge updates
  static final ValueNotifier<int> unreadCountNotifier = ValueNotifier<int>(0);
  static bool _isSocketListening = false;

  static Future<Map<String, String>> _getHeaders() async {
    final token = await AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<bool> registerDevice(String fcmToken) async {
    if (kFrontendPreviewMode) return true;
    try {
      final response = await http.post(
        Uri.parse('$notificationsUrl/register-device'),
        headers: await _getHeaders(),
        body: jsonEncode({
          'fcmToken': fcmToken,
          'platform': kIsWeb ? 'web' : (Platform.isIOS ? 'ios' : 'android'),
        }),
      );
      
      debugPrint('API Response [registerDevice]: ${response.statusCode}');
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('Error registering device: $e');
      return false;
    }
  }

  /// Refreshes the unread count from the backend
  static Future<int> refreshUnreadCount() async {
    if (kFrontendPreviewMode) {
      unreadCountNotifier.value = 0;
      return 0;
    }
    try {
      final token = await AuthService.getToken();
      if (token == null || token.isEmpty) {
        unreadCountNotifier.value = 0;
        return 0;
      }
      final response = await http.get(
        Uri.parse(notificationsUrl),
        headers: await _getHeaders(),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        int unread = 0;
        if (data['unreadCount'] is num) {
          unread = (data['unreadCount'] as num).toInt();
        } else if (data['notifications'] is List) {
          final list = data['notifications'] as List;
          unread = list.where((item) => item['isRead'] != true).length;
        }
        unreadCountNotifier.value = unread;
        return unread;
      } else {
        unreadCountNotifier.value = 0;
      }
    } catch (e) {
      debugPrint('Error refreshing unread count: $e');
    }
    return unreadCountNotifier.value;
  }

  /// Listen for real-time notifications via WebSocket
  static void listenToRealtimeNotifications() {
    if (_isSocketListening) return;
    _isSocketListening = true;
    SocketService.on('notification:new', (_) {
      refreshUnreadCount();
    });
    SocketService.on('notification', (_) {
      refreshUnreadCount();
    });
  }

  static Future<List<Map<String, dynamic>>> getNotifications() async {
    if (kFrontendPreviewMode) {
      unreadCountNotifier.value = 0;
      return [];
    }
    try {
      final response = await http.get(
        Uri.parse(notificationsUrl),
        headers: await _getHeaders(),
      );
      debugPrint('API Response [getNotifications]: ${response.statusCode}');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final list = data['notifications'] as List? ?? [];
        if (data['unreadCount'] is num) {
          unreadCountNotifier.value = (data['unreadCount'] as num).toInt();
        } else {
          unreadCountNotifier.value = list.where((item) => item['isRead'] != true).length;
        }
        return list.map((item) => item as Map<String, dynamic>).toList();
      }
      unreadCountNotifier.value = 0;
      return [];
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
      unreadCountNotifier.value = 0;
      return [];
    }
  }

  static Future<bool> markAllAsRead() async {
    unreadCountNotifier.value = 0;
    if (kFrontendPreviewMode) return true;
    try {
      final response = await http.patch(
        Uri.parse('$notificationsUrl/mark-all-read'),
        headers: await _getHeaders(),
      );
      unreadCountNotifier.value = 0;
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error marking notifications as read: $e');
      unreadCountNotifier.value = 0;
      return false;
    }
  }
}

import '../core/constants/app_constants.dart';
import '../core/config/app_mode.dart';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'auth_service.dart';

class NotificationApiService {
  static String get apiBaseUrl => AppConstants.baseUrl;
  static String get notificationsUrl => '$apiBaseUrl/notifications';

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

  static Future<List<Map<String, dynamic>>> getNotifications() async {
    if (kFrontendPreviewMode) {
      return [
        {
          'id': '1',
          'title': 'Welcome to ECDKART!',
          'message': 'Explore top restaurants near you with free delivery.',
          'type': 'system',
          'createdAt': DateTime.now().subtract(const Duration(minutes: 10)).toIso8601String(),
          'isRead': false,
        }
      ];
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
        return list.map((item) => item as Map<String, dynamic>).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
      return [];
    }
  }

  static Future<bool> markAllAsRead() async {
    if (kFrontendPreviewMode) return true;
    try {
      final response = await http.patch(
        Uri.parse('$notificationsUrl/mark-all-read'),
        headers: await _getHeaders(),
      );
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error marking notifications as read: $e');
      return false;
    }
  }
}

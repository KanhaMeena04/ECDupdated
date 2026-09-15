import '../core/constants/app_constants.dart';
import '../core/config/app_mode.dart';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'auth_service.dart';

class NotificationApiService {
  static String get apiBaseUrl {
    // return AppConstants.baseUrl;
    return AppConstants.baseUrl;
  }

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
          'platform': Platform.isIOS ? 'ios' : 'android',
        }),
      );
      
      debugPrint('API Response [registerDevice]: ${response.statusCode}');
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('Error registering device: $e');
      return false;
    }
  }
}

import '../core/constants/app_constants.dart';
import '../core/config/app_mode.dart';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'auth_service.dart';

class IssueApiService {
  static String get baseUrl => '${AppConstants.baseUrl}/issues';

  static Future<Map<String, String>> _getHeaders() async {
    final token = await AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<Map<String, dynamic>> reportIssue(String orderId, String description) async {
    if (kFrontendPreviewMode) {
      return {'success': true, 'message': 'Issue reported successfully (Preview)'};
    }
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/report'),
        headers: await _getHeaders(),
        body: jsonEncode({
          'orderId': orderId,
          'description': description,
        }),
      );
      
      debugPrint('API Response [reportIssue]: ${response.statusCode} - ${response.body}');
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      }
      return {'success': false, 'message': 'Failed to report issue'};
    } catch (e) {
      debugPrint('Error reporting issue: $e');
      return {'success': false, 'message': e.toString()};
    }
  }
}

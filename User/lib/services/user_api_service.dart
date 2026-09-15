import '../core/constants/app_constants.dart';
import '../core/config/app_mode.dart';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'auth_service.dart';

class UserApiService {
  static String get baseUrl => '${AppConstants.baseUrl}/user';

  static Future<Map<String, String>> _getHeaders() async {
    final token = await AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<Map<String, dynamic>?> getProfile() async {
    if (kFrontendPreviewMode) {
      return {
        'user': {
          'id': 'preview_user_1',
          'name': 'Rahul Sharma',
          'email': 'rahul.sharma@example.com',
          'phone': '9876543210',
          'avatar': '',
        }
      };
    }
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/me'),
        headers: await _getHeaders(),
      );
      debugPrint('API Response [getProfile]: ${response.statusCode}');
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      debugPrint('Error fetching profile: $e');
      return null;
    }
  }

  static Future<bool> updateProfile(String name, {String? email, String? phone, String? avatar}) async {
    if (kFrontendPreviewMode) return true;
    try {
      final body = {'name': name};
      if (email != null) body['email'] = email;
      if (phone != null) body['phone'] = phone;
      if (avatar != null) body['avatar'] = avatar;

      final response = await http.put(
        Uri.parse('$baseUrl/update-profile'),
        headers: await _getHeaders(),
        body: jsonEncode(body),
      );
      debugPrint('API Response [updateProfile]: ${response.statusCode} - ${response.body}');
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error updating profile: $e');
      return false;
    }
  }

  static Future<bool> deleteAccount() async {
    if (kFrontendPreviewMode) return true;
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/delete-account'),
        headers: await _getHeaders(),
      );
      debugPrint('API Response [deleteAccount]: ${response.statusCode} - ${response.body}');
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error deleting account: $e');
      return false;
    }
  }

  static Future<String?> uploadImage(File image) async {
    if (kFrontendPreviewMode) return 'assets/static/b1.jpg';
    try {
      final token = await AuthService.getToken();
      final uploadUrl = baseUrl.replaceAll('/user', '/upload');
      final request = http.MultipartRequest(
        'POST',
        Uri.parse(uploadUrl),
      );
      
      if (token != null) {
        request.headers['Authorization'] = 'Bearer $token';
      }

      request.files.add(await http.MultipartFile.fromPath('image', image.path));

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data['url'];
        }
      }
      return null;
    } catch (e) {
      debugPrint('Error uploading image: $e');
      return null;
    }
  }
}

import '../core/constants/app_constants.dart';
import '../core/config/app_mode.dart';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'dart:io';

class SettingsApiService {
  static String get baseUrl {
    // return '${AppConstants.baseUrl}/settings';
    return '${AppConstants.baseUrl}/settings';
  }

  static Future<bool> isCodEnabled() async {
    if (kFrontendPreviewMode) return true;
    try {
      final response = await http.get(Uri.parse(baseUrl));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['settings'] != null) {
          return data['settings']['isCodEnabled'] ?? true;
        }
      }
    } catch (e) {
      debugPrint("Settings fetch error: $e");
    }
    return true; // Default to true if fetch fails
  }
}

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

  static Future<Map<String, dynamic>?> fetchSettings() async {
    if (kFrontendPreviewMode) return null;
    try {
      final response = await http.get(Uri.parse(baseUrl));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return ((data['settings'] ?? data['data'] ?? data) as Map<String, dynamic>);
        }
      }
    } catch (e) {
      debugPrint("Settings fetch error: $e");
    }
    return null;
  }

  static Future<Map<String, dynamic>> fetchBrandFooterConfig() async {
    try {
      final settings = await fetchSettings();
      if (settings != null && settings['brandFooterConfig'] is Map) {
        return Map<String, dynamic>.from(settings['brandFooterConfig']);
      }
    } catch (_) {}
    return {
      'enabled': true,
      'title': 'ECD here for You',
      'subtitle': 'Delivering fast food, groceries & happiness to your doorstep.',
      'badgeText': 'Fast Delivery & 100% Quality Guaranteed',
    };
  }

  static Future<Map<String, dynamic>?> fetchCmsPolicy(String slug) async {
    if (kFrontendPreviewMode) return null;
    try {
      final response = await http.get(Uri.parse('${AppConstants.baseUrl}/cms/$slug')).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map<String, dynamic>) return data;
      }
    } catch (e) {
      debugPrint("CMS Policy fetch error ($slug): $e");
    }
    return null;
  }
}

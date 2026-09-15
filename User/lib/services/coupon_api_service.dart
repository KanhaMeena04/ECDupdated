import '../core/constants/app_constants.dart';
import '../core/config/app_mode.dart';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'auth_service.dart';

class CouponApiService {
  // static String get baseUrl => '${AppConstants.baseUrl}/coupons';
  static String get baseUrl => '${AppConstants.baseUrl}/coupons';

  static Future<Map<String, String>> _getHeaders() async {
    final token = await AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  /// Fetch all active coupons
  static Future<List<dynamic>> getCoupons() async {
    if (kFrontendPreviewMode) {
      return [
        {
          'code': 'WELCOME50',
          'discount': 50,
          'minOrder': 199,
          'description': 'Get ₹50 OFF on your first food order',
        },
        {
          'code': 'FOODIE100',
          'discount': 100,
          'minOrder': 499,
          'description': 'Get ₹100 OFF on orders above ₹499',
        }
      ];
    }
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/active'),
        headers: await _getHeaders(),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['coupons'] ?? [];
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching coupons: $e');
      return [];
    }
  }

  /// Apply a coupon code to the current cart
  static Future<Map<String, dynamic>?> applyCoupon({
    required String code,
    required String storeId,
    required double orderAmount,
  }) async {
    if (kFrontendPreviewMode) {
      final discount = code.toUpperCase() == 'FOODIE100' ? 100.0 : 50.0;
      return {
        'success': true,
        'valid': true,
        'message': 'Coupon $code applied successfully!',
        'discountAmount': discount,
        'coupon': {
          'code': code.toUpperCase(),
          'discount': discount,
        }
      };
    }
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/validate'),
        headers: await _getHeaders(),
        body: jsonEncode({
          'code': code,
          'storeId': storeId,
          'orderAmount': orderAmount,
        }),
      );
      if (response.statusCode == 200 || response.statusCode == 400) {
        final data = jsonDecode(response.body);
        return {
          'success': response.statusCode == 200,
          'message': data['message'] ?? (response.statusCode == 200 ? 'Success' : 'Invalid or expired coupon'),
          if (response.statusCode == 200) ...data,
        };
      }
      return {'success': false, 'message': 'Invalid or expired coupon'};
    } catch (e) {
      debugPrint('Error applying coupon: $e');
      return {'success': false, 'message': 'Connection error'};
    }
  }
}

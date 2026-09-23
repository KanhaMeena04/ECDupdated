import '../core/constants/app_constants.dart';
import '../core/config/app_mode.dart';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'auth_service.dart';

class CartApiService {
  // static String get baseUrl => '${AppConstants.baseUrl}/cart';
  static String get baseUrl => '${AppConstants.baseUrl}/cart';

  static Future<Map<String, String>> _getHeaders() async {
    final token = await AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<Map<String, dynamic>?> getCart() async {
    if (kFrontendPreviewMode) {
      return {'items': []};
    }
    try {
      final response = await http.get(
        Uri.parse(baseUrl),
        headers: await _getHeaders(),
      );
      debugPrint('API Response [getCart]: ${response.statusCode}');
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      debugPrint('Error fetching cart: $e');
      return null;
    }
  }

  static Future<bool> addToCart(String productId, int quantity) async {
    if (kFrontendPreviewMode) return true;
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/add'),
        headers: await _getHeaders(),
        body: jsonEncode({'productId': productId, 'quantity': quantity}),
      );
      debugPrint('API Response [addToCart]: ${response.statusCode}');
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('Error adding to cart: $e');
      return false;
    }
  }

  static Future<bool> updateCart(String productId, int quantity) async {
    if (kFrontendPreviewMode) return true;
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/update'),
        headers: await _getHeaders(),
        body: jsonEncode({'productId': productId, 'quantity': quantity}),
      );
      debugPrint('API Response [updateCart]: ${response.statusCode}');
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error updating cart: $e');
      return false;
    }
  }

  static Future<bool> removeFromCart(String productId) async {
    if (kFrontendPreviewMode) return true;
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/remove'),
        headers: await _getHeaders(),
        body: jsonEncode({'productId': productId}),
      );
      debugPrint('API Response [removeFromCart]: ${response.statusCode}');
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error removing from cart: $e');
      return false;
    }
  }

  static Future<bool> clearCart() async {
    if (kFrontendPreviewMode) return true;
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/clear'),
        headers: await _getHeaders(),
      );
      debugPrint('API Response [clearCart]: ${response.statusCode}');
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error clearing cart: $e');
      return false;
    }
  }
}

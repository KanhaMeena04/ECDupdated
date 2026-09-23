import '../core/constants/app_constants.dart';
import '../core/config/app_mode.dart';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'auth_service.dart';

class OrderApiService {
  // static String get baseUrl => '${AppConstants.baseUrl}/orders';
  static String get baseUrl => '${AppConstants.baseUrl}/orders';

  static Future<Map<String, String>> _getHeaders() async {
    final token = await AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<Map<String, dynamic>> getMyOrders() async {
    if (kFrontendPreviewMode) {
      return {
        'active': [
          {
            '_id': 'ORD-PREVIEW-101',
            'id': 'ORD-PREVIEW-101',
            'orderId': 'ORD-PREVIEW-101',
            'status': 'out_for_delivery',
            'restaurant': {
              'name': 'The Gourmet Kitchen',
              'image': 'assets/static/restraunt.jpg'
            },
            'items': [
              {'name': 'Margherita Pizza', 'quantity': 1, 'price': 299},
              {'name': 'Chocolate Lava Cake', 'quantity': 2, 'price': 149}
            ],
            'totalAmount': 597,
            'deliveryAddress': '102, Royal Palms, Vijay Nagar, Indore',
            'createdAt': '2026-03-11T13:00:00Z'
          }
        ],
        'past': [
          {
            '_id': 'ORD-PREVIEW-100',
            'id': 'ORD-PREVIEW-100',
            'orderId': 'ORD-PREVIEW-100',
            'status': 'delivered',
            'restaurant': {
              'name': 'Pizza Perfection',
              'image': 'assets/static/pizza.jpg'
            },
            'items': [
              {'name': 'Double Cheeseburger', 'quantity': 2, 'price': 199}
            ],
            'totalAmount': 398,
            'deliveryAddress': '102, Royal Palms, Vijay Nagar, Indore',
            'createdAt': '2026-03-10T19:30:00Z'
          }
        ],
        'cancelled': [
          {
            '_id': 'ORD-PREVIEW-099',
            'id': 'ORD-PREVIEW-099',
            'orderId': 'ORD-PREVIEW-099',
            'status': 'cancelled',
            'restaurant': {
              'name': 'Burger Heights',
              'image': 'assets/static/b2.jpg'
            },
            'items': [
              {'name': 'Schezwan Hakka Noodles', 'quantity': 1, 'price': 179}
            ],
            'totalAmount': 179,
            'deliveryAddress': '102, Royal Palms, Vijay Nagar, Indore',
            'createdAt': '2026-03-08T15:10:00Z'
          }
        ]
      };
    }
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/my-orders'),
        headers: await _getHeaders(),
      );
      debugPrint('API Response [getMyOrders]: ${response.statusCode}');
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return {'active': [], 'past': [], 'cancelled': []};
    } catch (e) {
      debugPrint('Error fetching orders: $e');
      return {'active': [], 'past': [], 'cancelled': []};
    }
  }

  static Future<Map<String, dynamic>?> getOrderTracking(String orderId) async {
    if (kFrontendPreviewMode) {
      return {
        'orderId': orderId,
        'status': 'out_for_delivery',
        'driverName': 'Rahul Kumar',
        'driverPhone': '9876543210',
        'estimatedDeliveryTime': '20 mins',
        'restaurant': {
          'name': 'The Gourmet Kitchen',
          'lat': 22.7533,
          'lng': 75.8937
        },
        'user': {
          'lat': 22.7196,
          'lng': 75.8577
        },
        'driver': {
          'lat': 22.7365,
          'lng': 75.8757
        }
      };
    }
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/tracking/$orderId'),
        headers: await _getHeaders(),
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      debugPrint('Error fetching tracking: $e');
      return null;
    }
  }

  static Future<Map<String, dynamic>> cancelOrder(String orderId, String reason) async {
    if (kFrontendPreviewMode) {
      return {'success': true, 'message': 'Order cancelled (Preview)'};
    }
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/$orderId/cancel'),
        headers: await _getHeaders(),
        body: jsonEncode({'reason': reason}),
      );
      if (response.statusCode == 200) {
        return {'success': true};
      } else {
        final body = jsonDecode(response.body);
        return {'success': false, 'message': body['message'] ?? 'Failed to cancel order'};
      }
    } catch (e) {
      debugPrint('Error cancelling order: $e');
      return {'success': false, 'message': 'Network error or server unreachable.'};
    }
  }

  static Future<bool> failOrder(String orderId, String reason) async {
    if (kFrontendPreviewMode) return true;
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/$orderId/fail'),
        headers: await _getHeaders(),
        body: jsonEncode({'reason': reason}),
      );
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error failing order: $e');
      return false;
    }
  }

  static Future<Map<String, dynamic>?> placeOrder(Map<String, dynamic> orderData) async {
    if (kFrontendPreviewMode) {
      return {
        'success': true,
        'message': 'Order placed successfully (Preview)',
        'orderId': 'ORD-PREVIEW-102',
        'razorpayOrderId': 'rzp_preview_order_102',
        'order': {
          'id': 'ORD-PREVIEW-102',
          'status': 'placed',
          'totalAmount': orderData['totalAmount'] ?? 350.0,
        }
      };
    }
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/place'),
        headers: await _getHeaders(),
        body: jsonEncode(orderData),
      );
      debugPrint('API Response [placeOrder]: ${response.statusCode}');
      debugPrint('API Response Body [placeOrder]: ${response.body}');
      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        try {
          return jsonDecode(response.body);
        } catch (_) {
          return null;
        }
      }
    } catch (e) {
      debugPrint('Error placing order: $e');
      return null;
    }
  }

  static Future<bool> verifyPayment(Map<String, dynamic> verifyData) async {
    if (kFrontendPreviewMode) return true;
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/verify-payment'),
        headers: await _getHeaders(),
        body: jsonEncode(verifyData),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('Error verifying payment: $e');
      return false;
    }
  }

  static Future<Map<String, dynamic>?> calculateDeliveryFee(String restaurantId, double lat, double lng) async {
    if (kFrontendPreviewMode) {
      return {
        'success': true,
        'deliveryCharge': 35.0,
        'distanceKm': 3.2,
      };
    }
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/calculate-fee'),
        headers: await _getHeaders(),
        body: jsonEncode({
          'restaurantId': restaurantId,
          'lat': lat,
          'lng': lng,
        }),
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      debugPrint('Error calculating delivery fee: $e');
      return null;
    }
  }
}

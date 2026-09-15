import '../core/constants/app_constants.dart';
import '../core/config/app_mode.dart';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'dart:io';
import 'auth_service.dart';

class PaymentService {
  // static String get baseUrl => '${AppConstants.baseUrl}/razorpay';
  static String get baseUrl => '${AppConstants.baseUrl}/razorpay';

  static Future<Map<String, dynamic>?> createOrder(
    double amount,
  ) async {
    if (kFrontendPreviewMode) {
      return {
        'id': 'rzp_preview_order_123',
        'amount': amount,
        'currency': 'INR',
      };
    }
    final response = await http.post(
      Uri.parse("$baseUrl/create-order"),
      headers: {
        "Content-Type": "application/json",
      },
      body: jsonEncode({
        "amount": amount,
      }),
    );

    print("STATUS CODE: ${response.statusCode}");
    print("BODY: ${response.body}");

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }

    return null;
  }
  static Future<Map<String, dynamic>?> verifyPayment({
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String razorpaySignature,
  }) async {
    if (kFrontendPreviewMode) {
      return {
        'success': true,
        'message': 'Payment verified successfully (Preview)',
      };
    }
    final ordersBaseUrl = baseUrl.replaceAll('/razorpay', '/orders');
    final token = await AuthService.getToken();
    final response = await http.post(
      Uri.parse("$ordersBaseUrl/verify-payment"),
      headers: {
        "Content-Type": "application/json",
        if (token != null) "Authorization": "Bearer $token",
      },
      body: jsonEncode({
        "razorpay_order_id": razorpayOrderId,
        "razorpay_payment_id": razorpayPaymentId,
        "razorpay_signature": razorpaySignature,
      }),
    );

    print("VERIFY STATUS CODE: ${response.statusCode}");
    print("VERIFY BODY: ${response.body}");

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }
}

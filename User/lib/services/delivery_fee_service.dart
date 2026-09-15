import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../core/constants/app_constants.dart';
import '../core/config/app_mode.dart';

class DeliveryFeeService {
  static String get baseUrl => '${AppConstants.baseUrl}/payment';

  /// Calculates dynamic delivery fee based on distance and restaurant fee slabs
  static Future<Map<String, dynamic>?> calculateDeliveryFee({
    required double distanceKm,
    String? restaurantId,
  }) async {
    if (kFrontendPreviewMode) {
      return {'deliveryFee': 35.0, 'distanceKm': distanceKm};
    }
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/calculate-delivery-fee'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'distanceKm': distanceKm,
          if (restaurantId != null) 'restaurantId': restaurantId,
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      debugPrint('Error calculating delivery fee: $e');
    }
    return null;
  }
}

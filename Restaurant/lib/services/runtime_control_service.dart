import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../api_constants.dart';

class RestaurantRuntimeControlService {
  static Map<String, bool> flags = {
    'SELF_PICKUP': true,
    'AUTO_APPROVE_MENU': false,
  };

  static Map<String, dynamic> emergency = {
    'acceptNewOrders': true,
    'deliveryService': true,
    'selfPickup': true,
    'reason': '',
  };

  static DateTime? _lastFetchedAt;

  static Future<void> sync({bool force = false}) async {
    if (!force &&
        _lastFetchedAt != null &&
        DateTime.now().difference(_lastFetchedAt!).inSeconds < 45) {
      return;
    }
    try {
      final base = ApiConstants.baseUrl;
      final responses = await Future.wait([
        http.get(Uri.parse('$base/feature-flags/active')).timeout(const Duration(seconds: 6)),
        http.get(Uri.parse('$base/emergency')).timeout(const Duration(seconds: 6)),
      ]);
      if (responses[0].statusCode == 200) {
        final decoded = jsonDecode(responses[0].body);
        if (decoded['flags'] is Map) {
          final Map<String, bool> parsed = {};
          (decoded['flags'] as Map).forEach((k, v) {
            parsed[k.toString()] = v == true;
          });
          flags = parsed;
        }
      }
      if (responses[1].statusCode == 200) {
        final decoded = jsonDecode(responses[1].body);
        if (decoded['controls'] is Map<String, dynamic>) {
          emergency = decoded['controls'];
        }
      }
      _lastFetchedAt = DateTime.now();
    } catch (e) {
      debugPrint('RestaurantRuntimeControlService.sync skipped: $e');
    }
  }

  static bool get isOrdersHalted => emergency['acceptNewOrders'] == false;
  static bool get isSelfPickupEnabled =>
      emergency['selfPickup'] != false && (flags['SELF_PICKUP'] ?? true);
}


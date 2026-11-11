import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../core/constants/app_constants.dart';

class RuntimeControlService {
  static Map<String, bool> flags = {
    'SELF_PICKUP': true,
    'COD': true,
    'WALLET': true,
    'NEW_COUPON_ENGINE': true,
  };

  static Map<String, dynamic> emergency = {
    'acceptNewOrders': true,
    'deliveryService': true,
    'selfPickup': true,
    'onlinePayment': true,
    'cod': true,
    'riderDispatch': true,
    'couponsEnabled': true,
    'offersEnabled': true,
    'reason': '',
  };

  static Map<String, dynamic> trackingConfig = {
    'gpsIntervalSeconds': 60,
    'activeDeliveryOnly': true,
    'staleThresholdSeconds': 180,
  };

  static DateTime? _lastFetchedAt;

  static Future<void> sync({bool force = false}) async {
    if (!force &&
        _lastFetchedAt != null &&
        DateTime.now().difference(_lastFetchedAt!).inSeconds < 45) {
      return;
    }
    try {
      final base = AppConstants.baseUrl;
      final responses = await Future.wait([
        http.get(Uri.parse('$base/feature-flags/active')).timeout(const Duration(seconds: 6)),
        http.get(Uri.parse('$base/emergency')).timeout(const Duration(seconds: 6)),
        http.get(Uri.parse('$base/admin/public/tracking-config')).timeout(const Duration(seconds: 6)),
      ]);

      if (responses[0].statusCode == 200) {
        final decoded = jsonDecode(responses[0].body);
        if (decoded['flags'] is Map) {
          final Map<String, bool> parsed = {};
          (decoded['flags'] as Map).forEach((k, v) {
            parsed[k.toString()] = v == true;
          });
          if (parsed.isNotEmpty) flags = parsed;
        }
      }
      if (responses[1].statusCode == 200) {
        final decoded = jsonDecode(responses[1].body);
        if (decoded['controls'] is Map<String, dynamic>) {
          emergency = decoded['controls'];
        }
      }
      if (responses[2].statusCode == 200) {
        final decoded = jsonDecode(responses[2].body);
        if (decoded['config'] is Map<String, dynamic>) {
          trackingConfig = decoded['config'];
        }
      }
      _lastFetchedAt = DateTime.now();
    } catch (e) {
      debugPrint('RuntimeControlService.sync skipped: $e');
    }
  }

  static bool isFlagEnabled(String key, {bool fallback = true}) {
    return flags[key] ?? fallback;
  }

  static int get staleThresholdSeconds =>
      int.tryParse((trackingConfig['staleThresholdSeconds'] ?? 180).toString()) ?? 180;
}


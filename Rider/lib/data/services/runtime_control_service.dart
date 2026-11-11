import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../../core/constants/api_constansts.dart';

class RiderRuntimeControlService {
  static Map<String, bool> flags = {};
  static Map<String, dynamic> emergency = {
    'acceptNewOrders': true,
    'deliveryService': true,
    'riderDispatch': true,
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
      final base = ApiConstants.baseUrl;
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
          flags = parsed;
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
      debugPrint('RiderRuntimeControlService.sync skipped: $e');
    }
  }

  static int get gpsIntervalSeconds =>
      (int.tryParse((trackingConfig['gpsIntervalSeconds'] ?? 60).toString()) ?? 60).clamp(15, 300);

  static bool get activeDeliveryOnly => trackingConfig['activeDeliveryOnly'] != false;

  static bool get isDispatchHalted => emergency['riderDispatch'] == false;
}


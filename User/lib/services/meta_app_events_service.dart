import 'package:flutter/foundation.dart';
import 'package:facebook_app_events/facebook_app_events.dart';

class MetaAppEventsService {
  MetaAppEventsService._();

  static final FacebookAppEvents _events = FacebookAppEvents();

  static Future<void> registrationCompleted() async {
    try {
      await _events.logCompletedRegistration(
        registrationMethod: 'phone_otp',
      );
    } catch (e) {
      debugPrint('Meta registration event failed: $e');
    }
  }

  static Future<void> addToCart({
    required String itemId,
    required double price,
  }) async {
    try {
      await _events.logAddToCart(
        id: itemId,
        type: 'product',
        currency: 'INR',
        price: price,
      );
    } catch (e) {
      debugPrint('Meta add-to-cart event failed: $e');
    }
  }

  static Future<void> purchase({
    required double amount,
  }) async {
    try {
      await _events.logPurchase(
        amount: amount,
        currency: 'INR',
      );
    } catch (e) {
      debugPrint('Meta purchase event failed: $e');
    }
  }
}

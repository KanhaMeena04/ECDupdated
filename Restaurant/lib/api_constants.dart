import 'package:flutter/foundation.dart';

class ApiConstants {
  static String get baseUrl {
    if (kIsWeb) return 'http://localhost:5000/api';
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5000/api';
    }
    return 'http://localhost:5000/api';
  }
  
  static String? _restaurantId;
  static String? _authToken;

  static String get restaurantId => _restaurantId ??
      (throw StateError('Restaurant session is not authenticated'));
  static String get authToken =>
      _authToken ?? (throw StateError('Restaurant session is not authenticated'));

  static void setAuthenticatedSession({
    required String restaurantId,
    required String authToken,
  }) {
    if (restaurantId.isEmpty || authToken.isEmpty) {
      throw ArgumentError('Restaurant ID and auth token must not be empty');
    }
    _restaurantId = restaurantId;
    _authToken = authToken;
  }

  static void clearAuthenticatedSession() {
    _restaurantId = null;
    _authToken = null;
  }

  // Auth & Profile
  static String get sendOtp => "$baseUrl/restaurants/send-otp";
  static String get verifyOtp => "$baseUrl/restaurants/verify-otp";
  static String getProfile(String id) => "$baseUrl/restaurants/$id/profile";
  static String getOrderHistory(String id) => "$baseUrl/restaurants/$id/order-history";
  static String getDashboardStats(String id, String filter) => "$baseUrl/restaurants/$id/dashboard-stats?filter=$filter";
  static String get deleteAccount => "$baseUrl/restaurants/vendor/delete-account";

  // Endpoints
  static String getRestaurantOrders(String id) => "$baseUrl/orders/restaurant/$id";
  static String toggleActive(String id) => "$baseUrl/restaurants/$id/toggle-active";
  
  // Menu Management
  static String addMenuItem(String id) => "$baseUrl/restaurants/vendor/menu/add/$id";
  static String toggleMenuItem(String restId, String itemId) => "$baseUrl/restaurants/vendor/menu/toggle/$restId/$itemId";
  static String requestDeleteMenuItem(String restId, String itemId) => "$baseUrl/restaurants/$restId/menu/$itemId/request-delete";
  
  // Restaurant Payment & Wallet
  static String get restaurantWallet => "$baseUrl/payment/restaurant/wallet";
  static String get restaurantApply => "$baseUrl/restaurants/apply";
  static String restaurantSettings(String id) => "$baseUrl/restaurants/$id/settings";
  
  static String prepareOrder(String orderId) => "$baseUrl/orders/restaurant/prepare/$orderId";
  static String assignRider(String orderId) => "$baseUrl/orders/restaurant/ready/$orderId";
  static String verifyPickup(String orderId) => "$baseUrl/orders/restaurant/verify-pickup/$orderId";
  static String completePickup(String orderId) => "$baseUrl/orders/restaurant/complete-pickup/$orderId";
  static String cancelOrder(String orderId) => "$baseUrl/orders/restaurant/cancel/$orderId";
}

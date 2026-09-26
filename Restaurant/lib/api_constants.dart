import 'package:flutter/foundation.dart' show kIsWeb, defaultTargetPlatform, TargetPlatform, kReleaseMode;

class ApiConstants {
  // Pass --dart-define=LOCAL_IP=192.168.x.x or --dart-define=USE_LOCAL=true for local dev testing
  static const String _customLocalIp = String.fromEnvironment('LOCAL_IP', defaultValue: '');
  static const bool _useLocal = bool.fromEnvironment('USE_LOCAL', defaultValue: false);
  static const String _prodBaseUrl = 'https://ecd-kart-backend.onrender.com/api/v1';

  static String get baseUrl {
    if (kReleaseMode) {
      return _prodBaseUrl;
    }
    if (_useLocal || _customLocalIp.isNotEmpty) {
      if (_customLocalIp.isNotEmpty) {
        return 'http://$_customLocalIp:5000/api/v1';
      }
      if (kIsWeb) return 'http://localhost:5000/api/v1';
      if (defaultTargetPlatform == TargetPlatform.android) {
        return 'http://10.0.2.2:5000/api/v1';
      }
      return 'http://localhost:5000/api/v1';
    }
    return _prodBaseUrl;
  }
  
  static String? _restaurantId;
  static String? _authToken;

  static String get restaurantId => _restaurantId ?? '';
  static String get authToken => _authToken ?? '';

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
  static String get loginWithPin => "$baseUrl/restaurants/login-with-pin";
  static String getProfile(String id) => "$baseUrl/restaurants/$id/profile";
  static String getOrderHistory(String id) => "$baseUrl/restaurants/$id/order-history";
  static String getDashboardStats(String id, String filter) => "$baseUrl/restaurants/$id/dashboard-stats?filter=$filter";
  static String get deleteAccount => "$baseUrl/restaurants/vendor/delete-account";
  static String getApprovalStatus(String id) => "$baseUrl/restaurants/$id/status";
  static String checkApprovalStatusByMobile(String mobile) => "$baseUrl/restaurants/status/check?mobile=$mobile";

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

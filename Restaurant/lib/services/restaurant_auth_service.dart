import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../api_constants.dart';

class RestaurantAuthService {
  static const String _tokenKey = 'token';
  static const String _restaurantIdKey = 'restaurantId';
  static const String _vendorDataKey = 'restaurant_vendor_data';

  static Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    final restId = prefs.getString(_restaurantIdKey);
    if (token != null && token.isNotEmpty && restId != null && restId.isNotEmpty) {
      ApiConstants.setAuthenticatedSession(
        restaurantId: restId,
        authToken: token,
      );
      return true;
    }
    return false;
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  static Future<String?> getRestaurantId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_restaurantIdKey);
  }

  static Future<Map<String, dynamic>?> getVendorData() async {
    final prefs = await SharedPreferences.getInstance();
    final dataStr = prefs.getString(_vendorDataKey);
    if (dataStr != null) {
      try {
        return jsonDecode(dataStr);
      } catch (_) {}
    }
    return null;
  }

  static Future<void> saveAuthSession({
    required String token,
    required String restaurantId,
    Map<String, dynamic>? vendorData,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_restaurantIdKey, restaurantId);
    if (vendorData != null) {
      await prefs.setString(_vendorDataKey, jsonEncode(vendorData));
    }
    ApiConstants.setAuthenticatedSession(
      restaurantId: restaurantId,
      authToken: token,
    );
  }

  static Future<Map<String, dynamic>> getSavedAuthSession() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    final restId = prefs.getString(_restaurantIdKey);
    final vendor = await getVendorData();
    return {
      'token': token,
      'restaurantId': restId,
      'vendor': vendor,
    };
  }

  static Future<void> clearAuthSession() => logout();

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_restaurantIdKey);
    await prefs.remove(_vendorDataKey);
    ApiConstants.clearAuthenticatedSession();
  }
}

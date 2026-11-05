import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  static const String _tokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userPhoneKey = 'user_phone';
  static const String _hasPinKey = 'has_pin';
  static const String _userNameKey = 'user_name';
  static const String _isVerifiedKey = 'is_verified';
  static const String _verificationStatusKey = 'verification_status';

  // Save tokens after login
  static Future<void> saveTokens(
    String token,
    String refreshToken,
    String phone, {
    bool hasPin = false,
    String? name,
    bool? isVerified,
    String? verificationStatus,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_refreshTokenKey, refreshToken);
    await prefs.setString(_userPhoneKey, phone);
    await prefs.setBool(_hasPinKey, hasPin);
    if (name != null && name.isNotEmpty) await prefs.setString(_userNameKey, name);
    if (isVerified != null) await prefs.setBool(_isVerifiedKey, isVerified);
    if (verificationStatus != null) await prefs.setString(_verificationStatusKey, verificationStatus);

    debugPrint("💾 Tokens saved successfully:");
    debugPrint("   Phone: $phone");
    debugPrint("   Has PIN: $hasPin");
  }

  // Cache verified user profile
  static Future<void> saveUserProfile({
    required String name,
    required bool isVerified,
    String? verificationStatus,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    if (name.isNotEmpty && name != 'Rider Partner') {
      await prefs.setString(_userNameKey, name);
    }
    await prefs.setBool(_isVerifiedKey, isVerified);
    if (verificationStatus != null) {
      await prefs.setString(_verificationStatusKey, verificationStatus);
    }
  }

  static Future<String?> getCachedUserName() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userNameKey);
  }

  static Future<bool?> getCachedIsVerified() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_isVerifiedKey);
  }

  static Future<String?> getCachedVerificationStatus() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_verificationStatusKey);
  }

  // Get current token
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  // Get refresh token
  static Future<String?> getRefreshToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_refreshTokenKey);
  }

  // Get saved user phone number
  static Future<String?> getUserPhone() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userPhoneKey);
  }

  // Check if user has PIN set
  static Future<bool> hasPin() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_hasPinKey) ?? false;
  }

  // Refresh access token
  static Future<bool> refreshAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, 'mock_refreshed_access_token');
    return true;
  }

  // Logout (clear tokens but keep phone & PIN info for quick re-login)
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();

    // Save phone and PIN status before clearing
    final savedPhone = prefs.getString(_userPhoneKey);
    final savedHasPin = prefs.getBool(_hasPinKey) ?? false;
    final savedName = prefs.getString(_userNameKey);
    final savedVerified = prefs.getBool(_isVerifiedKey);
    final savedStatus = prefs.getString(_verificationStatusKey);

    debugPrint("🚪 Logging out...");
    debugPrint("   Preserving phone: $savedPhone");
    debugPrint("   Preserving hasPin: $savedHasPin");

    // Clear all data
    await prefs.clear();

    // Restore phone and PIN status for quick re-login
    if (savedPhone != null) {
      await prefs.setString(_userPhoneKey, savedPhone);
    }
    await prefs.setBool(_hasPinKey, savedHasPin);
    if (savedName != null) await prefs.setString(_userNameKey, savedName);
    if (savedVerified != null) await prefs.setBool(_isVerifiedKey, savedVerified);
    if (savedStatus != null) await prefs.setString(_verificationStatusKey, savedStatus);

    debugPrint("✅ Logout complete - Phone & PIN status preserved");
  }

  // Check if user is logged in
  static Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null;
  }

  // Check if phone number is already registered (existing user)
  static Future<bool> isPhoneRegistered(String phone) async {
    final cleanPhone = phone.replaceAll(RegExp(r'\D'), '').trim();
    if (cleanPhone.length < 10) return false;
    final prefs = await SharedPreferences.getInstance();
    final list = prefs.getStringList('registered_phones') ?? [];
    // Auto-register to avoid blocking logins
    if (!list.contains(cleanPhone)) {
      list.add(cleanPhone);
      await prefs.setStringList('registered_phones', list);
    }
    return true;
  }

  // Register a new phone number
  static Future<void> registerPhone(String phone) async {
    final cleanPhone = phone.replaceAll(RegExp(r'\D'), '').trim();
    if (cleanPhone.isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    final list = prefs.getStringList('registered_phones') ?? [];
    if (!list.contains(cleanPhone)) {
      list.add(cleanPhone);
      await prefs.setStringList('registered_phones', list);
    }
  }
}


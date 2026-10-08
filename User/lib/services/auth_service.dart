import '../core/constants/app_constants.dart';
import '../core/config/app_mode.dart';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

// dart:io is NOT imported here — Platform detection is done via kIsWeb +
// defaultTargetPlatform so this file compiles on Web without errors.

class AuthService {
  // ── Base URL ───────────────────────────────────────────────────────────────
  static String get baseUrl => '${AppConstants.baseUrl}/auth/user';

  static const Duration _timeout = Duration(seconds: 60);
  static const String _tokenKey = 'auth_token';

  // ── Token & Session helpers ───────────────────────────────────────────────
  static Future<void> saveToken(
    String token, {
    String? phone,
    String? name,
    String? email,
    String? userId,
    String? customerId,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setBool('is_logged_in', true);
    if (phone != null && phone.isNotEmpty) {
      await prefs.setString('saved_user_phone', phone);
    }
    if (name != null && name.isNotEmpty && name != 'Guest User') {
      await prefs.setString('saved_user_name', name);
    }
    if (email != null && email.isNotEmpty) {
      await prefs.setString('saved_user_email', email);
    }
    if (userId != null && userId.isNotEmpty) {
      await prefs.setString('saved_user_id', userId);
    }
    if (customerId != null && customerId.isNotEmpty) {
      await prefs.setString('saved_user_customer_id', customerId);
    }
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.setBool('is_logged_in', false);
    await prefs.remove('saved_user_phone');
    await prefs.remove('saved_user_name');
    await prefs.remove('saved_user_email');
    await prefs.remove('saved_user_id');
    await prefs.remove('saved_user_customer_id');
    await prefs.remove('saved_user_avatar');
    await prefs.remove('saved_user_wallet');
    await prefs.remove('saved_user_cod_blocked');
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  static Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    final isLogged = prefs.getBool('is_logged_in') ?? false;
    return (token != null && token.isNotEmpty) || isLogged;
  }

  static Future<void> removeToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.setBool('is_logged_in', false);
  }

  // ── Send OTP ───────────────────────────────────────────────────────────────
  static Future<AuthResult> sendOtp(String phone) async {
    if (kFrontendPreviewMode) {
      return AuthResult.success(message: 'OTP sent to your mobile number');
    }
    try {
      final phoneStr = _normalizePhone(phone);
      debugPrint('📤 [sendOtp] POST $baseUrl/send-otp  body: {"phone":"$phoneStr"}');

      final response = await http
          .post(
            Uri.parse('$baseUrl/send-otp'),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: jsonEncode({'phone': phoneStr}),
          )
          .timeout(_timeout);

      debugPrint('📥 [sendOtp] ${response.statusCode} — ${response.body}');
      final data = _decodeBody(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return AuthResult.success(
          message: data['message']?.toString() ?? 'OTP sent successfully',
        );
      } else if (response.statusCode == 429) {
        return AuthResult.failure(
          error: 'Too many requests. Please wait 15 minutes and try again.',
        );
      } else {
        return AuthResult.failure(
          error: data['message']?.toString() ??
              data['error']?.toString() ??
              'Failed to send OTP (${response.statusCode})',
        );
      }
    } on Exception catch (e) {
      debugPrint('❌ [sendOtp] $e');
      return AuthResult.failure(error: _friendlyError(e.toString()));
    }
  }

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  static Future<AuthResult> verifyOtp(String phone, String otp) async {
    if (kFrontendPreviewMode) {
      await saveToken('preview_mock_token_123');
      return AuthResult.success(
        message: 'Login successful (Preview Mode)',
        token: 'preview_mock_token_123',
        userId: 'preview_user_1',
        isNewUser: false,
      );
    }
    try {
      final phoneStr = _normalizePhone(phone);
      debugPrint('📤 [verifyOtp] POST $baseUrl/verify-otp  body: {"phone":"$phoneStr","code":"$otp"}');

      final response = await http
          .post(
            Uri.parse('$baseUrl/verify-otp'),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: jsonEncode({'phone': phoneStr, 'code': otp}),
          )
          .timeout(_timeout);

      debugPrint('📥 [verifyOtp] ${response.statusCode} — ${response.body}');
      final data = _decodeBody(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        final token = data['token']?.toString();
        final userMap = data['user'] as Map<String, dynamic>?;
        final resPhone = userMap?['phone']?.toString() ?? userMap?['mobile']?.toString() ?? phoneStr;
        final resName = userMap?['name']?.toString() ?? '';
        final resEmail = userMap?['email']?.toString() ?? '';
        final resId = data['userId']?.toString() ?? userMap?['id']?.toString() ?? userMap?['_id']?.toString() ?? '';
        final resCustomerId = userMap?['customerId']?.toString() ?? '';

        if (token != null && token.isNotEmpty) {
          await saveToken(
            token,
            phone: resPhone,
            name: resName,
            email: resEmail,
            userId: resId,
            customerId: resCustomerId,
          );
          debugPrint('✅ [verifyOtp] Token & User Session saved: $resPhone (customerId: $resCustomerId)');
        }

        return AuthResult.success(
          message: data['message']?.toString() ?? 'Login successful',
          token: token,
          userId: resId.isNotEmpty ? resId : null,
          customerId: resCustomerId.isNotEmpty ? resCustomerId : null,
          isNewUser: data['isNewUser'] as bool? ?? false,
        );
      } else {
        return AuthResult.failure(
          error: data['message']?.toString() ??
              data['error']?.toString() ??
              'Invalid OTP (${response.statusCode})',
        );
      }
    } on Exception catch (e) {
      debugPrint('❌ [verifyOtp] $e');
      return AuthResult.failure(error: _friendlyError(e.toString()));
    }
  }

  // ── Login with Username / Mobile and Password ────────────────────────────
  static Future<AuthResult> loginWithPassword({
    required String username,
    required String password,
  }) async {
    if (kFrontendPreviewMode) {
      await saveToken('preview_user_token_123');
      return AuthResult.success(
        message: 'Login successful (Preview Mode)',
        token: 'preview_user_token_123',
        userId: 'preview_user_1',
      );
    }
    try {
      final trimmedUser = username.trim();
      final trimmedPass = password.trim();
      debugPrint('📤 [loginWithPassword] identifier: $trimmedUser');

      final url = Uri.parse('${AppConstants.baseUrl}/auth/login');
      final response = await http
          .post(
            url,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: jsonEncode({
              'loginId': trimmedUser,
              'username': trimmedUser,
              'password': trimmedPass,
            }),
          )
          .timeout(_timeout);

      debugPrint('📥 [loginWithPassword] ${response.statusCode} — ${response.body}');
      final data = _decodeBody(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        final token = data['token']?.toString();
        final userMap = data['user'] as Map<String, dynamic>?;
        final resPhone = userMap?['phone']?.toString() ?? userMap?['mobile']?.toString() ?? '';
        final resName = userMap?['name']?.toString() ?? trimmedUser;
        final resEmail = userMap?['email']?.toString() ?? '';
        final resId = data['userId']?.toString() ?? userMap?['id']?.toString() ?? userMap?['_id']?.toString() ?? '';
        final resCustomerId = userMap?['customerId']?.toString() ?? '';

        if (token != null && token.isNotEmpty) {
          await saveToken(
            token,
            phone: resPhone,
            name: resName,
            email: resEmail,
            userId: resId,
            customerId: resCustomerId,
          );
          debugPrint('✅ [loginWithPassword] Token & User Session saved (customerId: $resCustomerId)');
        }

        return AuthResult.success(
          message: data['message']?.toString() ?? 'Login successful',
          token: token,
          userId: resId.isNotEmpty ? resId : null,
          customerId: resCustomerId.isNotEmpty ? resCustomerId : null,
        );
      } else {
        return AuthResult.failure(
          error: data['message']?.toString() ??
              data['error']?.toString() ??
              'Invalid credentials (${response.statusCode})',
        );
      }
    } on Exception catch (e) {
      debugPrint('❌ [loginWithPassword] $e');
      return AuthResult.failure(error: _friendlyError(e.toString()));
    }
  }

  // ── Google Login ───────────────────────────────────────────────────────────
  static Future<AuthResult> googleLogin(String idToken) async {
    if (kFrontendPreviewMode) {
      await saveToken('preview_google_token_123', name: 'Preview User');
      return AuthResult.success(
        message: 'Google login successful (Preview Mode)',
        token: 'preview_google_token_123',
        userId: 'preview_user_1',
      );
    }
    try {
      debugPrint('📤 [googleLogin] POST $baseUrl/google');

      final response = await http
          .post(
            Uri.parse('$baseUrl/google'),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: jsonEncode({'idToken': idToken}),
          )
          .timeout(_timeout);

      debugPrint('📥 [googleLogin] ${response.statusCode} — ${response.body}');

      final data = _decodeBody(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (data['requiresPhoneVerification'] == true) {
           return AuthResult.success(
             message: 'Phone verification required',
             requiresPhoneVerification: true,
             googleUser: data['googleUser'] as Map<String, dynamic>?,
           );
        }

        // Existing user flow
        final token = data['token']?.toString();
        final userMap = data['user'] as Map<String, dynamic>?;
        final resPhone = userMap?['phone']?.toString() ?? userMap?['mobile']?.toString() ?? '';
        final resName = userMap?['name']?.toString() ?? '';
        final resEmail = userMap?['email']?.toString() ?? '';
        final resId = data['userId']?.toString() ?? userMap?['id']?.toString() ?? userMap?['_id']?.toString() ?? '';

        if (token != null && token.isNotEmpty) {
          await saveToken(
            token,
            phone: resPhone,
            name: resName,
            email: resEmail,
            userId: resId,
          );
          debugPrint('✅ [googleLogin] Token & User Session saved');
        }

        return AuthResult.success(
          message: data['message']?.toString() ?? 'Google Login successful',
          token: token,
          userId: resId.isNotEmpty ? resId : null,
        );
      } else {
        return AuthResult.failure(
          error: data['message']?.toString() ??
              data['error']?.toString() ??
              'Google Login failed (${response.statusCode})',
        );
      }
    } on Exception catch (e) {
      debugPrint('❌ [googleLogin] $e');
      return AuthResult.failure(error: _friendlyError(e.toString()));
    }
  }

  // ── Verify Google Phone ────────────────────────────────────────────────────
  static Future<AuthResult> verifyGooglePhone(
    String phone,
    String otp,
    Map<String, dynamic> googleUser,
  ) async {
    try {
      final phoneStr = _normalizePhone(phone);
      debugPrint('📤 [verifyGooglePhone] POST $baseUrl/verify-google-phone');

      final requestBody = {
        'phone': phoneStr,
        'otp': otp,
        'googleId': googleUser['googleId']?.toString(),
        'email': googleUser['email']?.toString(),
        'name': googleUser['name']?.toString(),
        'avatar': googleUser['avatar']?.toString(),
      };

      final response = await http
          .post(
            Uri.parse('$baseUrl/verify-google-phone'),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: jsonEncode(requestBody),
          )
          .timeout(_timeout);

      debugPrint(
          '📥 [verifyGooglePhone] ${response.statusCode} — ${response.body}');

      final data = _decodeBody(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Successfully verified and created account
        final token = data['token']?.toString();
        final userMap = data['user'] as Map<String, dynamic>?;
        final resPhone = userMap?['phone']?.toString() ?? userMap?['mobile']?.toString() ?? phoneStr;
        final resName = userMap?['name']?.toString() ?? googleUser['name']?.toString() ?? '';
        final resEmail = userMap?['email']?.toString() ?? googleUser['email']?.toString() ?? '';
        final resId = data['userId']?.toString() ?? userMap?['id']?.toString() ?? userMap?['_id']?.toString() ?? '';
        final resCustomerId = userMap?['customerId']?.toString() ?? '';

        if (token != null && token.isNotEmpty) {
          await saveToken(
            token,
            phone: resPhone,
            name: resName,
            email: resEmail,
            userId: resId,
            customerId: resCustomerId,
          );
          debugPrint('✅ [verifyGooglePhone] Token & User Session saved: $resPhone (customerId: $resCustomerId)');
        }

        return AuthResult.success(
          message: data['message']?.toString() ?? 'Account created successfully',
          token: token,
          userId: resId.isNotEmpty ? resId : null,
          customerId: resCustomerId.isNotEmpty ? resCustomerId : null,
          isNewUser: true,
        );
      } else {
        return AuthResult.failure(
          error: data['message']?.toString() ??
              data['error']?.toString() ??
              'Verification failed (${response.statusCode})',
        );
      }
    } on Exception catch (e) {
      debugPrint('❌ [verifyGooglePhone] $e');
      return AuthResult.failure(error: _friendlyError(e.toString()));
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  static String _normalizePhone(String phone) {
    String digits = phone.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.length > 10) {
      digits = digits.substring(digits.length - 10);
    }
    return digits;
  }

  static Map<String, dynamic> _decodeBody(String body) {
    try {
      return jsonDecode(body) as Map<String, dynamic>;
    } catch (_) {
      return {};
    }
  }

  static String _friendlyError(String raw) {
    if (raw.contains('SocketException') ||
        raw.contains('Connection refused') ||
        raw.contains('Network is unreachable')) {
      return 'Cannot connect to server. Make sure the backend is running.';
    }
    if (raw.contains('TimeoutException')) {
      return 'Request timed out. Please try again.';
    }
    if (raw.contains('HandshakeException')) {
      return 'SSL error. Please check your connection.';
    }
    if (raw.contains('ClientException') || raw.contains('Failed to fetch')) {
      return 'Network connection failed. Please try again later.';
    }
    return 'An unexpected error occurred. Please try again.';
  }
}

// ── AuthResult ─────────────────────────────────────────────────────────────────
class AuthResult {
  final bool success;
  final String message;
  final String? token;
  final String? userId;
  final String? customerId;
  final bool isNewUser;
  final bool requiresPhoneVerification;
  final Map<String, dynamic>? googleUser;

  const AuthResult._({
    required this.success,
    required this.message,
    this.token,
    this.userId,
    this.customerId,
    this.isNewUser = false,
    this.requiresPhoneVerification = false,
    this.googleUser,
  });

  factory AuthResult.success({
    required String message,
    String? token,
    String? userId,
    String? customerId,
    bool isNewUser = false,
    bool requiresPhoneVerification = false,
    Map<String, dynamic>? googleUser,
  }) =>
      AuthResult._(
        success: true,
        message: message,
        token: token,
        userId: userId,
        isNewUser: isNewUser,
        requiresPhoneVerification: requiresPhoneVerification,
        googleUser: googleUser,
      );

  factory AuthResult.failure({required String error}) =>
      AuthResult._(success: false, message: error);
}

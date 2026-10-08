import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/auth_service.dart';
import '../services/user_api_service.dart';
import '../services/notification_service.dart';
import '../services/notification_api_service.dart';

class UserProvider extends ChangeNotifier {
  String _name = 'Guest User';
  String _email = '';
  String _phone = '';
  String _avatar = '';
  double _walletBalance = 0.0;
  bool _isCodBlocked = false;
  bool _codActive = true;
  bool _isLoading = false;

  String get name => _name;
  String get email => _email;
  String get phone => _phone;
  String get avatar => _avatar;
  double get walletBalance => _walletBalance;
  bool get isCodBlocked => _isCodBlocked;
  bool get codActive => _codActive;
  bool get isLoading => _isLoading;
  bool get isGuest => _phone.isEmpty && _email.isEmpty && (_name == 'Guest User' || _name.isEmpty);

  bool _hasFetchedProfile = false;
  bool get hasFetchedProfile => _hasFetchedProfile;

  UserProvider() {
    _loadSavedSession();
  }

  Future<void> _loadSavedSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = await AuthService.getToken();
      final savedPhone = prefs.getString('saved_user_phone');
      final savedName = prefs.getString('saved_user_name');
      final savedEmail = prefs.getString('saved_user_email');
      final savedAvatar = prefs.getString('saved_user_avatar');
      final savedWallet = prefs.getDouble('saved_user_wallet');
      final savedCodBlocked = prefs.getBool('saved_user_cod_blocked');

      if (token != null && token.isNotEmpty) {
        _phone = savedPhone ?? '';
        _name = (savedName != null && savedName.isNotEmpty) ? savedName : 'User';
        _email = savedEmail ?? '';
        _avatar = savedAvatar ?? '';
        if (savedWallet != null) _walletBalance = savedWallet;
        if (savedCodBlocked != null) {
          _isCodBlocked = savedCodBlocked;
          _codActive = !savedCodBlocked;
        }
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error loading saved user session: $e');
    }
  }

  Future<void> _saveSessionToPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('saved_user_phone', _phone);
      await prefs.setString('saved_user_name', _name);
      await prefs.setString('saved_user_email', _email);
      await prefs.setString('saved_user_avatar', _avatar);
      await prefs.setDouble('saved_user_wallet', _walletBalance);
      await prefs.setBool('saved_user_cod_blocked', _isCodBlocked);
    } catch (e) {
      debugPrint('Error saving user session to prefs: $e');
    }
  }

  void setUserInfo({String? name, String? email, String? phone, String? avatar, double? walletBalance, bool? isCodBlocked}) {
    if (name != null && name.isNotEmpty) _name = name;
    if (email != null) _email = email;
    if (phone != null && phone.isNotEmpty) _phone = phone;
    if (avatar != null) _avatar = avatar;
    if (walletBalance != null) _walletBalance = walletBalance;
    if (isCodBlocked != null) {
      _isCodBlocked = isCodBlocked;
      _codActive = !isCodBlocked;
    }
    _saveSessionToPrefs();
    notifyListeners();
  }

  void updateWalletBalance(double newBalance) {
    _walletBalance = newBalance;
    _saveSessionToPrefs();
    notifyListeners();
  }

  void clearUser() async {
    _name = 'Guest User';
    _email = '';
    _phone = '';
    _avatar = '';
    _walletBalance = 0.0;
    _isCodBlocked = false;
    _codActive = true;
    _hasFetchedProfile = false;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('saved_user_phone');
      await prefs.remove('saved_user_name');
      await prefs.remove('saved_user_email');
      await prefs.remove('saved_user_avatar');
      await prefs.remove('saved_user_wallet');
      await prefs.remove('saved_user_cod_blocked');
    } catch (_) {}
    notifyListeners();
  }

  Future<void> fetchProfile() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await AuthService.getToken();
      if (token == null || token.isEmpty) {
        clearUser();
        _hasFetchedProfile = true;
        _isLoading = false;
        notifyListeners();
        return;
      }

      final profileRes = await UserApiService.getProfileDetailed();
      final profileData = profileRes.data;

      if (profileRes.isSuccess && profileData != null && (profileData['user'] != null || profileData['phone'] != null || profileData['mobile'] != null)) {
        final userData = (profileData['user'] as Map<String, dynamic>?) ?? profileData;
        final fetchedName = userData['name']?.toString().trim();
        _name = (fetchedName != null && fetchedName.isNotEmpty) ? fetchedName : (_name.isNotEmpty && _name != 'Guest User' ? _name : 'User');
        _email = userData['email']?.toString() ?? _email;
        
        final fetchedPhone = userData['phone']?.toString().trim() ?? '';
        final fetchedMobile = userData['mobile']?.toString().trim() ?? '';
        if (fetchedPhone.isNotEmpty) {
          _phone = fetchedPhone;
        } else if (fetchedMobile.isNotEmpty) {
          _phone = fetchedMobile;
        }

        if (userData['avatar'] != null) {
          _avatar = userData['avatar'].toString();
        } else if (userData['profilePic'] != null) {
          _avatar = userData['profilePic'].toString();
        }

        // Live wallet balance from backend
        if (userData['walletBalance'] != null) {
          _walletBalance = (userData['walletBalance'] as num).toDouble();
        } else if (userData['wallet'] != null) {
          final wStr = userData['wallet'].toString().replaceAll(RegExp(r'[^0-9.]'), '');
          _walletBalance = double.tryParse(wStr) ?? 0.0;
        }

        // COD block status from admin
        _isCodBlocked = userData['isCodBlocked'] == true || userData['codActive'] == false;
        _codActive = userData['codActive'] != false && userData['isCodBlocked'] != true;

        await _saveSessionToPrefs();
      } else if (profileRes.statusCode == 401) {
        // Token genuinely invalid or expired (HTTP 401) — clear token and reset guest user
        debugPrint('Session expired or unauthorized (401), logging out.');
        await AuthService.removeToken();
        clearUser();
      } else {
        // Temporary network glitch, backend cold start, or offline launch:
        // RETAIN THE CACHED LOCAL SESSION so the user is NOT logged out!
        debugPrint('Profile fetch returned status ${profileRes.statusCode}; retaining cached session.');
      }

      // Register FCM device token regardless of profile fetch success
      final fcmToken = await NotificationService.getToken();
      if (fcmToken != null) {
        await NotificationApiService.registerDevice(fcmToken);
      }
      
      _hasFetchedProfile = true;
    } catch (e) {
      debugPrint('Error fetching profile: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateProfile(String newName, {String? email, String? phone, String? newAvatar}) async {
    _isLoading = true;
    notifyListeners();

    final success = await UserApiService.updateProfile(newName, email: email, phone: phone, avatar: newAvatar);
    if (success) {
      _name = newName;
      if (email != null) _email = email;
      if (phone != null) _phone = phone;
      if (newAvatar != null) _avatar = newAvatar;
      await _saveSessionToPrefs();
    }
    
    _isLoading = false;
    notifyListeners();
    return success;
  }

  Future<bool> deleteAccount() async {
    _isLoading = true;
    notifyListeners();

    final success = await UserApiService.deleteAccount();
    if (success) {
      clearUser();
    }
    _isLoading = false;
    notifyListeners();
    return success;
  }
}


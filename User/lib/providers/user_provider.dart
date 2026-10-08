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
  String _token = '';
  bool _isLoggedIn = false;
  double _walletBalance = 0.0;
  bool _isCodBlocked = false;
  bool _codActive = true;
  bool _isLoading = false;

  String get name => _name;
  String get email => _email;
  String get phone => _phone;
  String get avatar => _avatar;
  String get token => _token;
  double get walletBalance => _walletBalance;
  bool get isCodBlocked => _isCodBlocked;
  bool get codActive => _codActive;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _isLoggedIn || _token.isNotEmpty || (_phone.isNotEmpty && _name != 'Guest User');
  bool get isGuest => !isLoggedIn;

  bool _hasFetchedProfile = false;
  bool get hasFetchedProfile => _hasFetchedProfile;

  static Map<String, dynamic> _cachedSession = {};

  static Future<void> preheatSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token') ?? '';
      final isSavedLoggedIn = prefs.getBool('is_logged_in') ?? false;
      final savedPhone = prefs.getString('saved_user_phone') ?? '';
      final savedName = prefs.getString('saved_user_name') ?? '';
      final savedEmail = prefs.getString('saved_user_email') ?? '';
      final savedAvatar = prefs.getString('saved_user_avatar') ?? '';
      final savedWallet = prefs.getDouble('saved_user_wallet');
      final savedCodBlocked = prefs.getBool('saved_user_cod_blocked');

      _cachedSession = {
        'token': token,
        'is_logged_in': isSavedLoggedIn,
        'phone': savedPhone,
        'name': savedName,
        'email': savedEmail,
        'avatar': savedAvatar,
        'wallet': savedWallet,
        'codBlocked': savedCodBlocked,
      };
      debugPrint('🔥 [UserProvider] preheated session: phone=$savedPhone, loggedIn=$isSavedLoggedIn');
    } catch (e) {
      debugPrint('Error preheating user session: $e');
    }
  }

  void _applyCachedSession(Map<String, dynamic> data) {
    final token = (data['token'] as String?) ?? '';
    final isSavedLoggedIn = (data['is_logged_in'] as bool?) ?? false;
    final savedPhone = (data['phone'] as String?) ?? '';
    final savedName = (data['name'] as String?) ?? '';
    final savedEmail = (data['email'] as String?) ?? '';
    final savedAvatar = (data['avatar'] as String?) ?? '';
    final savedWallet = data['wallet'] as double?;
    final savedCodBlocked = data['codBlocked'] as bool?;

    if (token.isNotEmpty || isSavedLoggedIn || savedPhone.isNotEmpty) {
      _token = token;
      _isLoggedIn = true;
      _phone = savedPhone;
      _name = (savedName.isNotEmpty && savedName != 'Guest User')
          ? savedName
          : (savedPhone.isNotEmpty ? 'User $savedPhone' : 'User');
      _email = savedEmail;
      _avatar = savedAvatar;
      if (savedWallet != null) _walletBalance = savedWallet;
      if (savedCodBlocked != null) {
        _isCodBlocked = savedCodBlocked;
        _codActive = !savedCodBlocked;
      }
    }
  }

  UserProvider() {
    if (_cachedSession.isNotEmpty) {
      _applyCachedSession(_cachedSession);
    }
    _loadSavedSession();
  }

  Future<void> _loadSavedSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token') ?? await AuthService.getToken() ?? '';
      final isSavedLoggedIn = prefs.getBool('is_logged_in') ?? false;
      final savedPhone = prefs.getString('saved_user_phone') ?? '';
      final savedName = prefs.getString('saved_user_name') ?? '';
      final savedEmail = prefs.getString('saved_user_email') ?? '';
      final savedAvatar = prefs.getString('saved_user_avatar') ?? '';
      final savedWallet = prefs.getDouble('saved_user_wallet');
      final savedCodBlocked = prefs.getBool('saved_user_cod_blocked');

      if (token.isNotEmpty || isSavedLoggedIn || savedPhone.isNotEmpty) {
        _token = token;
        _isLoggedIn = true;
        _phone = savedPhone;
        _name = (savedName.isNotEmpty && savedName != 'Guest User')
            ? savedName
            : (savedPhone.isNotEmpty ? 'User $savedPhone' : 'User');
        _email = savedEmail;
        _avatar = savedAvatar;
        if (savedWallet != null) _walletBalance = savedWallet;
        if (savedCodBlocked != null) {
          _isCodBlocked = savedCodBlocked;
          _codActive = !savedCodBlocked;
        }
        _cachedSession = {
          'token': _token,
          'is_logged_in': _isLoggedIn,
          'phone': _phone,
          'name': _name,
          'email': _email,
          'avatar': _avatar,
          'wallet': _walletBalance,
          'codBlocked': _isCodBlocked,
        };
        notifyListeners();
        debugPrint('✅ Restored user session: name=$_name, phone=$_phone, loggedIn=$_isLoggedIn');
      }
    } catch (e) {
      debugPrint('Error loading saved user session: $e');
    }
  }

  Future<void> _saveSessionToPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (_phone.isNotEmpty) await prefs.setString('saved_user_phone', _phone);
      if (_name.isNotEmpty && _name != 'Guest User') await prefs.setString('saved_user_name', _name);
      if (_email.isNotEmpty) await prefs.setString('saved_user_email', _email);
      if (_avatar.isNotEmpty) await prefs.setString('saved_user_avatar', _avatar);
      await prefs.setDouble('saved_user_wallet', _walletBalance);
      await prefs.setBool('saved_user_cod_blocked', _isCodBlocked);
      if (_isLoggedIn || _token.isNotEmpty || _phone.isNotEmpty) {
        await prefs.setBool('is_logged_in', true);
      }
      _cachedSession = {
        'token': _token,
        'is_logged_in': _isLoggedIn,
        'phone': _phone,
        'name': _name,
        'email': _email,
        'avatar': _avatar,
        'wallet': _walletBalance,
        'codBlocked': _isCodBlocked,
      };
    } catch (e) {
      debugPrint('Error saving user session to prefs: $e');
    }
  }

  void setUserInfo({
    String? name,
    String? email,
    String? phone,
    String? avatar,
    double? walletBalance,
    bool? isCodBlocked,
    String? token,
  }) {
    if (token != null && token.isNotEmpty) _token = token;
    if (name != null && name.isNotEmpty && name != 'Guest User') _name = name;
    if (email != null) _email = email;
    if (phone != null && phone.isNotEmpty) _phone = phone;
    if (avatar != null) _avatar = avatar;
    if (walletBalance != null) _walletBalance = walletBalance;
    if (isCodBlocked != null) {
      _isCodBlocked = isCodBlocked;
      _codActive = !isCodBlocked;
    }
    _isLoggedIn = true;
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
    _token = '';
    _walletBalance = 0.0;
    _isCodBlocked = false;
    _codActive = true;
    _isLoggedIn = false;
    _hasFetchedProfile = false;
    _cachedSession.clear();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('saved_user_phone');
      await prefs.remove('saved_user_name');
      await prefs.remove('saved_user_email');
      await prefs.remove('saved_user_avatar');
      await prefs.remove('saved_user_wallet');
      await prefs.remove('saved_user_cod_blocked');
      await prefs.setBool('is_logged_in', false);
    } catch (_) {}
    notifyListeners();
  }

  Future<void> fetchProfile() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await AuthService.getToken();
      if (token == null || token.isEmpty) {
        final prefs = await SharedPreferences.getInstance();
        final isLogged = prefs.getBool('is_logged_in') ?? false;
        if (!isLogged && _phone.isEmpty) {
          clearUser();
        }
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
        if (fetchedName != null && fetchedName.isNotEmpty && fetchedName != 'Guest User') {
          _name = fetchedName;
        } else if (_name.isEmpty || _name == 'Guest User') {
          _name = 'User';
        }

        final fetchedEmail = userData['email']?.toString() ?? '';
        if (fetchedEmail.isNotEmpty) _email = fetchedEmail;

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
        _isLoggedIn = true;

        await _saveSessionToPrefs();
      } else {
        // Retain cached session and token — NEVER log user out automatically!
        debugPrint('Profile refresh status: ${profileRes.statusCode}; maintaining saved session.');
      }

      // Register FCM device token
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


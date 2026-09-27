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
  bool _isLoading = false;

  String get name => _name;
  String get email => _email;
  String get phone => _phone;
  String get avatar => _avatar;
  bool get isLoading => _isLoading;
  bool get isGuest => _phone.isEmpty && (_name == 'Guest User' || _name == 'User Name');

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

      if (token != null && token.isNotEmpty && savedPhone != null && savedPhone.isNotEmpty) {
        _phone = savedPhone;
        _name = (savedName != null && savedName.isNotEmpty) ? savedName : 'User';
        _email = savedEmail ?? '';
        _avatar = savedAvatar ?? '';
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error loading saved user session: $e');
    }
  }

  Future<void> _saveSessionToPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (_phone.isNotEmpty) {
        await prefs.setString('saved_user_phone', _phone);
        await prefs.setString('saved_user_name', _name);
        await prefs.setString('saved_user_email', _email);
        await prefs.setString('saved_user_avatar', _avatar);
      }
    } catch (e) {
      debugPrint('Error saving user session to prefs: $e');
    }
  }

  void setUserInfo({String? name, String? email, String? phone, String? avatar}) {
    if (name != null && name.isNotEmpty) _name = name;
    if (email != null) _email = email;
    if (phone != null && phone.isNotEmpty) _phone = phone;
    if (avatar != null) _avatar = avatar;
    _saveSessionToPrefs();
    notifyListeners();
  }

  void clearUser() async {
    _name = 'Guest User';
    _email = '';
    _phone = '';
    _avatar = '';
    _hasFetchedProfile = false;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('saved_user_phone');
      await prefs.remove('saved_user_name');
      await prefs.remove('saved_user_email');
      await prefs.remove('saved_user_avatar');
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

      final profileData = await UserApiService.getProfile();
      if (profileData != null && (profileData['user'] != null || profileData['phone'] != null || profileData['mobile'] != null)) {
        final userData = (profileData['user'] as Map<String, dynamic>?) ?? profileData;
        final fetchedName = userData['name']?.toString().trim();
        _name = (fetchedName != null && fetchedName.isNotEmpty) ? fetchedName : 'User';
        _email = userData['email']?.toString() ?? '';
        
        final fetchedPhone = userData['phone']?.toString().trim() ?? '';
        final fetchedMobile = userData['mobile']?.toString().trim() ?? '';
        _phone = fetchedPhone.isNotEmpty ? fetchedPhone : fetchedMobile;

        if (userData['avatar'] != null) {
          _avatar = userData['avatar'].toString();
        } else if (userData['profilePic'] != null) {
          _avatar = userData['profilePic'].toString();
        }

        await _saveSessionToPrefs();
      } else {
        // Token invalid or expired — clear token and reset guest user
        await AuthService.removeToken();
        clearUser();
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


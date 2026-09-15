import 'package:flutter/material.dart';
import '../services/user_api_service.dart';
import '../services/notification_service.dart';
import '../services/notification_api_service.dart';

class UserProvider extends ChangeNotifier {
  String _name = 'User Name';
  String _email = 'user@email.com';
  String _phone = '';
  bool _isLoading = false;

  String get name => _name;
  String get email => _email;
  String get phone => _phone;
  bool get isLoading => _isLoading;

  String _avatar = '';
  String get avatar => _avatar;

  void setUserInfo({String? name, String? email, String? phone, String? avatar}) {
    if (name != null) _name = name;
    if (email != null) _email = email;
    if (phone != null) _phone = phone;
    if (avatar != null) _avatar = avatar;
    notifyListeners();
  }

  void clearUser() {
    _name = 'User Name';
    _email = 'user@email.com';
    _phone = '';
    _avatar = '';
    _hasFetchedProfile = false;
    notifyListeners();
  }

  bool _hasFetchedProfile = false;
  bool get hasFetchedProfile => _hasFetchedProfile;

  Future<void> fetchProfile() async {
    _isLoading = true;
    notifyListeners();

    try {
      final profileData = await UserApiService.getProfile();
      if (profileData != null && profileData['user'] != null) {
        final userData = profileData['user'];
        _name = userData['name'] ?? _name;
        _email = userData['email'] ?? _email;
        _phone = userData['phone'] ?? _phone;
        if (userData['avatar'] != null) _avatar = userData['avatar'];
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
    }
    
    _isLoading = false;
    notifyListeners();
    return success;
  }

  Future<bool> deleteAccount() async {
    _isLoading = true;
    notifyListeners();

    final success = await UserApiService.deleteAccount();
    
    _isLoading = false;
    notifyListeners();
    return success;
  }
}

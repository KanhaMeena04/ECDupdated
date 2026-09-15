import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/location_service.dart';

class LocationProvider extends ChangeNotifier {
  String _location = 'Vijay Nagar, Indore';
  String _subAddress = 'Bhagora, Madhya Pradesh, India';
  double? lat = 22.7196;
  double? lng = 75.8577;
  double? deviceLat;
  double? deviceLng;
  bool _isLocationSet = false;

  LocationProvider() {
    _loadSavedLocation();
  }

  String get location => _location;
  String get subAddress => _subAddress;
  bool get isLocationSet => _isLocationSet;

  final List<String> _serviceableKeywords = [
    'madhya pradesh',
    'mp',
    'indore',
    'bhopal',
    'gwalior',
    'jabalpur',
    'ujjain',
    'delhi',
    'new delhi',
    'haryana',
    'gurgaon',
    'gurugram',
    'faridabad',
    'panipat',
    'ambala',
    'karnal',
    'noida',
  ];

  bool get isServiceable {
    final full = '$_location $_subAddress'.toLowerCase();
    return _serviceableKeywords.any((kw) => full.contains(kw));
  }

  bool isLocationServiceable(String address) {
    final lower = address.toLowerCase();
    return _serviceableKeywords.any((kw) => lower.contains(kw));
  }

  bool isFarFromDeviceLocation(String newLoc) {
    // If device location is available and new location name is significantly different
    if (deviceLat != null && lat != null) {
      // Calculate simple difference delta
      final dLat = (deviceLat! - lat!).abs();
      final dLng = (deviceLng! - lng!).abs();
      return (dLat > 0.05 || dLng > 0.05);
    }
    return false;
  }

  Future<void> _loadSavedLocation() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedLoc = prefs.getString('user_location');
      final savedSub = prefs.getString('user_sub_address');
      if (savedLoc != null && savedLoc.isNotEmpty) {
        _location = savedLoc;
        _subAddress = savedSub ?? 'Madhya Pradesh, India';
        _isLocationSet = true;
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> updateLocation(
    String newLocation, {
    String? subAddress,
    double? latitude,
    double? longitude,
  }) async {
    _location = newLocation;
    if (subAddress != null && subAddress.isNotEmpty) {
      _subAddress = subAddress;
    } else {
      _subAddress = 'Madhya Pradesh, India';
    }
    if (latitude != null) lat = latitude;
    if (longitude != null) lng = longitude;
    _isLocationSet = true;

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_location', _location);
      await prefs.setString('user_sub_address', _subAddress);
    } catch (_) {}

    notifyListeners();
  }

  Future<void> refreshLocation() async {
    try {
      String realLoc = await getCurrentLocationName();
      if (realLoc.isNotEmpty) {
        _location = realLoc;
        _isLocationSet = true;
        notifyListeners();
      }
    } catch (_) {}
  }
}


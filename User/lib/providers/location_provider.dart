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

  // Serviceability is determined dynamically by backend API geospatial queries
  bool get isServiceable => true;
  bool isLocationServiceable(String address) => true;

  bool isFarFromDeviceLocation(String newLoc) {
    if (deviceLat != null && lat != null) {
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
      final savedLat = prefs.getDouble('user_lat');
      final savedLng = prefs.getDouble('user_lng');

      if (savedLoc != null && savedLoc.isNotEmpty) {
        _location = savedLoc;
        _subAddress = savedSub ?? 'Madhya Pradesh, India';
        if (savedLat != null && savedLng != null) {
          lat = savedLat;
          lng = savedLng;
        } else {
          final coords = await getCoordinatesFromAddress(_location);
          if (coords != null) {
            lat = coords['lat'];
            lng = coords['lng'];
          }
        }
        _isLocationSet = true;
        _logLocationState();
        notifyListeners();
      } else {
        _logLocationState();
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

    if (latitude != null && longitude != null) {
      lat = latitude;
      lng = longitude;
    } else {
      final coords = await getCoordinatesFromAddress(newLocation);
      if (coords != null) {
        lat = coords['lat'];
        lng = coords['lng'];
      }
    }
    _isLocationSet = true;

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_location', _location);
      await prefs.setString('user_sub_address', _subAddress);
      if (lat != null) await prefs.setDouble('user_lat', lat!);
      if (lng != null) await prefs.setDouble('user_lng', lng!);
    } catch (_) {}

    _logLocationState();
    notifyListeners();
  }

  Future<void> refreshLocation() async {
    try {
      final pos = await getCurrentPositionSafe();
      if (pos != null) {
        lat = pos.latitude;
        lng = pos.longitude;
        deviceLat = pos.latitude;
        deviceLng = pos.longitude;
        String realLoc = await reverseGeocode(pos.latitude, pos.longitude);
        if (realLoc.isNotEmpty) {
          _location = realLoc;
        }
        _isLocationSet = true;

        try {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('user_location', _location);
          await prefs.setDouble('user_lat', lat!);
          await prefs.setDouble('user_lng', lng!);
        } catch (_) {}

        _logLocationState();
        notifyListeners();
      }
    } catch (_) {}
  }

  void _logLocationState() {
    debugPrint('USER_LOCATION\naddress = $_location\nlat = $lat\nlng = $lng');
  }
}

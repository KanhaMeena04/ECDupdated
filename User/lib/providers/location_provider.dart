import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import '../services/location_service.dart';
import '../services/restaurant_api_service.dart';

class LocationProvider extends ChangeNotifier {
  String _location = 'Vijay Nagar, Indore';
  String _subAddress = 'Madhya Pradesh, India';
  double? lat = 22.7533;
  double? lng = 75.8937;
  double? deviceLat;
  double? deviceLng;
  bool _isLocationSet = false;
  bool _isServiceable = true;
  String _serviceabilityMessage = '';
  Map<String, dynamic>? _serviceArea;

  LocationProvider() {
    _loadSavedLocation();
  }

  String get location => _location;
  String get subAddress => _subAddress;
  bool get isLocationSet => _isLocationSet;
  bool get isServiceable => _isServiceable;
  String get serviceabilityMessage => _serviceabilityMessage;
  Map<String, dynamic>? get serviceArea => _serviceArea;

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
        await checkServiceability();
        notifyListeners();
      } else {
        await checkServiceability();
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
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_location', _location);
      await prefs.setString('user_sub_address', _subAddress);
      if (lat != null) await prefs.setDouble('user_lat', lat!);
      if (lng != null) await prefs.setDouble('user_lng', lng!);
    } catch (_) {}

    _logLocationState();
    // Check serviceability asynchronously with strict timeout
    checkServiceability(
      address: '$_location, $_subAddress',
      latitude: lat,
      longitude: lng,
    );
  }

  Future<bool> checkServiceability({
    String? address,
    String? pincode,
    double? latitude,
    double? longitude,
  }) async {
    try {
      final addr = address ?? '$_location, $_subAddress';
      final checkLat = latitude ?? lat;
      final checkLng = longitude ?? lng;

      String pin = pincode ?? '';
      if (pin.isEmpty) {
        final match = RegExp(r'\b\d{6}\b').firstMatch(addr);
        if (match != null) pin = match.group(0)!;
      }

      final url = Uri.parse('${RestaurantApiService.apiBaseUrl}/service-areas/check-serviceability');
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'address': addr,
          'pincode': pin,
          'lat': checkLat,
          'lng': checkLng,
        }),
      ).timeout(const Duration(seconds: 3));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _isServiceable = data['isServiceable'] == true;
        _serviceabilityMessage = data['message']?.toString() ?? '';
        if (data['area'] is Map) {
          _serviceArea = Map<String, dynamic>.from(data['area']);
        }
        notifyListeners();
        return _isServiceable;
      }
    } catch (e) {
      debugPrint('Error checking serviceability: $e');
    }
    _isServiceable = true; // Safe fallback
    notifyListeners();
    return true;
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
          await prefs.setString('user_sub_address', _subAddress);
          await prefs.setDouble('user_lat', lat!);
          await prefs.setDouble('user_lng', lng!);
        } catch (_) {}

        await checkServiceability();
        _logLocationState();
        notifyListeners();
      }
    } catch (_) {}
  }

  void _logLocationState() {
    debugPrint('USER_LOCATION\naddress = $_location\nlat = $lat\nlng = $lng\nserviceable = $_isServiceable');
  }
}

import 'package:flutter/foundation.dart' show kIsWeb, defaultTargetPlatform, TargetPlatform, kReleaseMode;

class AppConstants {
  static const String appName = 'ECDKART';
  static const String appTagline = 'Food Delivery App';
  
  // Pass --dart-define=LOCAL_IP=192.168.x.x or --dart-define=USE_LOCAL=true for local dev testing
  static const String _customLocalIp = String.fromEnvironment('LOCAL_IP', defaultValue: '');
  static const bool _useLocal = bool.fromEnvironment('USE_LOCAL', defaultValue: false);
  static const String _prodBaseUrl = 'https://ecd-kart-backend.onrender.com/api/v1';

  static String get baseUrl {
    if (kReleaseMode) {
      return _prodBaseUrl;
    }
    if (_useLocal || _customLocalIp.isNotEmpty) {
      if (_customLocalIp.isNotEmpty) {
        return 'http://$_customLocalIp:5000/api/v1';
      }
      if (kIsWeb) return 'http://localhost:5000/api/v1';
      if (defaultTargetPlatform == TargetPlatform.android) {
        return 'http://10.0.2.2:5000/api/v1';
      }
      return 'http://localhost:5000/api/v1';
    }
    return _prodBaseUrl;
  }
  
  static const Duration splashDuration = Duration(seconds: 3);
  
  static const double defaultPadding = 16.0;
  static const double defaultRadius = 12.0;
  
  static const List<String> categories = [
    'Pizza',
    'Burger',
    'Noodles',
    'Pasta',
    'Chinese',
    'Indian',
    'Desserts',
    'Beverages',
  ];
}

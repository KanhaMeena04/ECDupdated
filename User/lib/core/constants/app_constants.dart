import 'package:flutter/foundation.dart' show kIsWeb, defaultTargetPlatform, TargetPlatform;

class AppConstants {
  static const String appName = 'ECDKART';
  static const String appTagline = 'Food Delivery App';
  
  static String get baseUrl {
    if (kIsWeb) return 'http://localhost:5000/api';
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5000/api';
    }
    return 'http://localhost:5000/api';
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

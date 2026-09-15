import 'dart:ui';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'firebase_options.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'screens/splash_screen.dart';
import 'api_constants.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  if (!kIsWeb) {
    await FirebaseCrashlytics.instance
        .setCrashlyticsCollectionEnabled(kReleaseMode);

    FlutterError.onError = (FlutterErrorDetails details) {
      FlutterError.presentError(details);
      FirebaseCrashlytics.instance.recordFlutterFatalError(details);
    };

    PlatformDispatcher.instance.onError = (error, stack) {
      FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
      return true;
    };
  }

  final prefs = await SharedPreferences.getInstance();
  final savedId = prefs.getString('restaurantId');
  final savedToken = prefs.getString('token');

  final hasSession = savedId?.isNotEmpty == true && savedToken?.isNotEmpty == true;
  if (hasSession) {
    ApiConstants.setAuthenticatedSession(
      restaurantId: savedId!,
      authToken: savedToken!,
    );
  } else {
    await prefs.remove('restaurantId');
    await prefs.remove('token');
  }

  runApp(RestaurantApp(hasToken: hasSession));
}

class RestaurantApp extends StatelessWidget {
  final bool hasToken;
  const RestaurantApp({super.key, required this.hasToken});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ECD Restaurant',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF248C70),
          primary: const Color(0xFF248C70),
          secondary: const Color(0xFFE89D1E),
          surface: Colors.white,
        ),
        scaffoldBackgroundColor: const Color(0xFFF5FAF8),
        useMaterial3: true,
      ),
      home: SplashScreen(hasToken: hasToken),
    );
  }
}

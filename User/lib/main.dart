import 'dart:ui';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:ecdkart_app/services/notification_service.dart';
import 'package:ecdkart_app/providers/theme_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'firebase_options.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'routes/app_routes.dart';
import 'providers/cart_provider.dart';
import 'providers/wishlist_provider.dart';
import 'providers/address_provider.dart';
import 'providers/user_provider.dart';
import 'providers/location_provider.dart';
import 'package:ecdkart_app/services/socket_service.dart';
import 'providers/order_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
    await NotificationService.initialize();

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
  } catch (e) {
    debugPrint('Firebase initialization failed: $e');
  }

  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  SystemChrome.setEnabledSystemUIMode(
    SystemUiMode.immersiveSticky,
  );
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  runApp(ChangeNotifierProvider(
    create: (_) => ThemeProvider(),
    child: const ECDKartApp(),
  ));
}

class ECDKartApp extends StatefulWidget {
  const ECDKartApp({super.key});

  @override
  State<ECDKartApp> createState() => _ECDKartAppState();
}

class _ECDKartAppState extends State<ECDKartApp> {
  Function(dynamic)? _globalSocketCallback;

  @override
  void initState() {
    super.initState();
    _setupGlobalSocketListener();
  }

  void _setupGlobalSocketListener() {
    SocketService.init();
    _globalSocketCallback = (data) {
      if (data != null && data['status'] == 'cancelled') {
        final message = data['message'] ?? 'Order was cancelled.';
        final context = AppRoutes.rootNavigatorKey.currentContext;
        if (context != null && mounted) {
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              title: const Row(
                children: [
                  Icon(Icons.cancel, color: Colors.red),
                  SizedBox(width: 8),
                  Text('Order Cancelled'),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    message,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'We sincerely apologize for the inconvenience. Sometimes unforeseen circumstances arise at the restaurant. We highly value you as a customer and deeply appreciate your understanding!',
                    style: TextStyle(fontSize: 13, color: Colors.black87),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('OK'),
                ),
              ],
            ),
          );
        }
      } else if (data != null && data['status'] == 'picked_up') {
        final context = AppRoutes.rootNavigatorKey.currentContext;
        final driverName = data['driverName'] ?? 'Rider';
        final driverPhone = data['driverPhone'] ?? '';

        if (context != null && mounted) {
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              title: const Row(
                children: [
                  Icon(Icons.moped, color: Colors.blue),
                  SizedBox(width: 8),
                  Text('Order Picked Up!'),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'This rider $driverName ($driverPhone) picked up your order.',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'You will be ready to deliver your order.',
                    style: TextStyle(fontSize: 13, color: Colors.black87),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('OK'),
                ),
              ],
            ),
          );
        }
      }
    };
    SocketService.onOrderStatusUpdated(_globalSocketCallback!);
  }

  @override
  void dispose() {
    if (_globalSocketCallback != null) {
      SocketService.offOrderStatusUpdated(_globalSocketCallback);
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => CartProvider()),
        ChangeNotifierProvider(create: (_) => WishlistProvider()),
        ChangeNotifierProvider(create: (_) => LocationProvider()),
        ChangeNotifierProvider(create: (_) => UserProvider()),
        ChangeNotifierProvider(create: (_) => OrderProvider()),
        ChangeNotifierProvider(create: (_) => AddressProvider()),
      ],
     child: MaterialApp.router(
        title: 'ECDKART',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: context.watch<ThemeProvider>().themeMode,
       
  routerConfig: AppRoutes.router,
        builder: (context, child) {
          return MediaQuery(
            data: MediaQuery.of(context).copyWith(
              textScaler: TextScaler.linear(1.0),
            ),
            child: child!,
          );
        },
      ),
    );
  }
}

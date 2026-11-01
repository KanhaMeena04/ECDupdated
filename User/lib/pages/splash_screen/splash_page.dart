import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../routes/app_routes.dart';
import '../../services/auth_service.dart';
import '../../providers/user_provider.dart';

class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {
  Timer? _timer;
  bool _navigated = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        try {
          context.read<UserProvider>().fetchProfile();
        } catch (e) {
          debugPrint('Splash prefetch profile error: $e');
        }
      }
    });

    _timer = Timer(const Duration(milliseconds: 1200), () {
      if (mounted && !_navigated) {
        _navigate();
      }
    });

    // Failsafe timer: after 2.5s maximum, force navigation so app NEVER gets stuck
    Future.delayed(const Duration(milliseconds: 2500), () {
      if (mounted && !_navigated) {
        _navigate();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _navigate() async {
    if (_navigated) return;
    _navigated = true;

    try {
      final pref = await SharedPreferences.getInstance().timeout(
        const Duration(seconds: 2),
        onTimeout: () => throw TimeoutException('Prefs timeout'),
      );
      final onboardDone = pref.getBool('onboardStatus') ?? false;

      if (!mounted) return;

      if (!onboardDone) {
        context.go(AppRoutes.onboarding);
      } else {
        context.go(AppRoutes.home);
      }
    } catch (e, stack) {
      debugPrint('Splash navigation error: $e\n$stack');
      if (mounted) {
        // Safe fallback - default to home
        context.go(AppRoutes.home);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Logo centered in top half
          Positioned(
            top: size.height * 0.2,
            left: 0,
            right: 0,
            child: Center(
              child: Image.asset(
                'assets/logo.png', // Assuming this is the Waseeny logo
                width: 250,
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) => const SizedBox(),
              ),
            ),
          ),
          // Red curve and food at bottom
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: SizedBox(
              height: size.height * 0.55,
              child: Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.bottomCenter,
                children: [
                  // Red semi circle
                  Positioned(
                    bottom: -size.width * 0.2,
                    child: Container(
                      width: size.width * 1.4,
                      height: size.width * 1.4,
                      decoration: const BoxDecoration(
                        color: Color(0xFF248C70), // Teal Green
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  // Food image
                  Positioned(
                    bottom: -10,
                    right: -40,
                    width: size.width * 1.15,
                    child: Image.asset(
                      'assets/delicious-pasta.png',
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => const SizedBox(),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

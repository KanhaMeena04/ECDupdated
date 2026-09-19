import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'login_screen.dart';
import 'dashboard_screen.dart';

class SplashScreen extends StatefulWidget {
  final bool hasToken;
  const SplashScreen({super.key, required this.hasToken});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with TickerProviderStateMixin {
  late AnimationController _mainController;
  late AnimationController _particleController;

  late Animation<double> _logoScaleUp;
  late Animation<double> _logoScaleSettle;
  late Animation<double> _logoOpacity;

  late Animation<double> _textOpacity;
  late Animation<double> _textSlideProgress;

  final List<Particle> _particles = [];

  @override
  void initState() {
    super.initState();

    // 1. Core Timeline: 3.0 seconds duration, 60fps ultra smooth
    _mainController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3000), 
    );

    _particleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3000),
    );

    _setupAnimations();
    _generateParticles();

    _mainController.forward();
    _particleController.forward();

    // 2. Final Hold: 1 second hold after 3 seconds animation, then transition
    Timer(const Duration(milliseconds: 4000), () {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            transitionDuration: const Duration(milliseconds: 800),
            pageBuilder: (context, animation, secondaryAnimation) => 
                widget.hasToken ? const DashboardScreen() : const LoginScreen(),
            transitionsBuilder: (context, animation, secondaryAnimation, child) {
              return FadeTransition(
                opacity: CurveTween(curve: Curves.easeInOutCubic).animate(animation), 
                child: child,
              );
            },
          ),
        );
      }
    });
  }

  void _setupAnimations() {
    // Logo Scale: 0.90 -> 1.03 (Subtle overshoot)
    _logoScaleUp = Tween<double>(begin: 0.90, end: 1.03).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.10, 0.50, curve: Curves.easeOutCubic),
      ),
    );

    // Logo Scale Settle: 1.03 -> 1.00
    _logoScaleSettle = Tween<double>(begin: 1.03, end: 1.00).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.50, 0.80, curve: Curves.easeInOutCubic),
      ),
    );

    // Logo Fade In
    _logoOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.10, 0.40, curve: Curves.easeOut),
      ),
    );

    // Text Slide Up (using a 0.0 to 1.0 progress to map to an exact 12px shift)
    _textSlideProgress = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.40, 0.85, curve: Curves.easeOutCubic),
      ),
    );

    // Text Fade In
    _textOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.45, 0.85, curve: Curves.easeOut),
      ),
    );
  }

  void _generateParticles() {
    final random = math.Random();
    // 16 elegant branded particles for the organic burst
    for (int i = 0; i < 16; i++) {
      // Even spread around the circle + slight randomness
      final angle = (i * math.pi * 2) / 16 + (random.nextDouble() - 0.5) * 0.5;
      
      // Float outward by 40-90 pixels
      final distance = 40.0 + random.nextDouble() * 50.0; 
      
      // Tiny subtle dots (3-6px)
      final size = 3.0 + random.nextDouble() * 3.0; 
      
      // Brand colors
      final color = i % 2 == 0 ? const Color(0xFF248C70) : Colors.orange.shade400;
      
      _particles.add(Particle(
        angle: angle,
        distance: distance,
        size: size,
        color: color,
        delay: random.nextDouble() * 0.15, // Slight stagger for organic feel
      ));
    }
  }

  @override
  void dispose() {
    _mainController.dispose();
    _particleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFFFFF), // 3. Pure white (#FFFFFF), no gradients
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Spacer(flex: 3),
            SizedBox(
              width: 250,
              height: 250,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // 4. Organic Particle Burst Reveal
                  ..._particles.map((p) {
                    return AnimatedBuilder(
                      animation: _particleController,
                      builder: (context, child) {
                        double progress = (_particleController.value - p.delay) / (1.0 - p.delay);
                        if (progress < 0.0) progress = 0.0;
                        if (progress > 1.0) progress = 1.0;
                        
                        // Ultra smooth ease-out for particle motion
                        final curvedProgress = Curves.easeOutCubic.transform(progress);
                        
                        // Fade in quickly, hold, then fade out softly
                        double opacity = 0.0;
                        if (progress < 0.15) {
                          opacity = progress / 0.15; // Fade in
                        } else {
                          opacity = 1.0 - ((progress - 0.15) / 0.85); // Fade out
                        }
                        
                        // Start near center (20px) and float out
                        final currentDist = 20.0 + (p.distance * curvedProgress);

                        return Positioned(
                          child: Transform.translate(
                            offset: Offset(
                              math.cos(p.angle) * currentDist,
                              math.sin(p.angle) * currentDist,
                            ),
                            child: Opacity(
                              opacity: opacity,
                              child: Container(
                                width: p.size,
                                height: p.size,
                                decoration: BoxDecoration(
                                  color: p.color,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    );
                  }),
                  
                  // 5. Official Logo (Exactly as uploaded)
                  AnimatedBuilder(
                    animation: _mainController,
                    builder: (context, child) {
                      double scale = _logoScaleUp.value;
                      if (_mainController.value > 0.50) {
                        scale = _logoScaleSettle.value;
                      }
                      return Opacity(
                        opacity: _logoOpacity.value,
                        child: Transform.scale(
                          scale: scale,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(24),
                              boxShadow: const [
                                BoxShadow(
                                  color: Colors.black12,
                                  blurRadius: 16,
                                  offset: Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Image.asset(
                              'splash_logo.png',
                              height: 120,
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, stackTrace) => Image.asset(
                                'assets/images/splash_logo.png',
                                height: 120,
                                fit: BoxFit.contain,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24), // Perfect spacing
            
            // 6. App Name (Smooth Opacity + 12px Slide Up)
            AnimatedBuilder(
              animation: _mainController,
              builder: (context, child) {
                // Exact 12px upward movement specification
                final yOffset = 12.0 * (1.0 - _textSlideProgress.value);
                
                return Transform.translate(
                  offset: Offset(0, yOffset),
                  child: Opacity(
                    opacity: _textOpacity.value,
                    child: Column(
                      children: [
                        Text(
                          'ECD KART',
                          style: GoogleFonts.poppins(
                            fontSize: 34,
                            fontWeight: FontWeight.w900, 
                            color: const Color(0xFF222222), 
                            letterSpacing: 1.5,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'RESTAURANT',
                          style: GoogleFonts.poppins(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF248C70),
                            letterSpacing: 8.0,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }
            ),
            const Spacer(flex: 4),
          ],
        ),
      ),
    );
  }
}

// Particle data model for clean generation
class Particle {
  final double angle;
  final double distance;
  final double size;
  final Color color;
  final double delay;

  Particle({
    required this.angle,
    required this.distance,
    required this.size,
    required this.color,
    required this.delay,
  });
}

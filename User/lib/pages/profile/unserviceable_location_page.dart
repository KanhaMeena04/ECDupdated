import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/cart_provider.dart';
import '../../providers/location_provider.dart';
import '../../routes/app_routes.dart';
import '../cart/cart_page.dart';

class UnserviceableLocationPage extends StatelessWidget {
  const UnserviceableLocationPage({super.key});

  void _openLocationPicker(BuildContext context) {
    context.push('/location-setup');
  }

  @override
  Widget build(BuildContext context) {
    final locationProvider = context.watch<LocationProvider>();
    final cart = context.watch<CartProvider>();
    final hasCartItems = cart.items.isNotEmpty;
    final firstItem = hasCartItems ? cart.items.first : null;

    return Scaffold(
      backgroundColor: const Color(0xFF0F2027),
      body: Stack(
        children: [
          // 1. Fullscreen Background Image (assets/chef_high_demand.jpg)
          Positioned.fill(
            child: Image.asset(
              'assets/chef_high_demand.jpg',
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Image.asset(
                'assets/order.jpg',
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(color: const Color(0xFF0F2027)),
              ),
            ),
          ),

          // 2. Light Blue Blur Overlay Effect (Light Blur & Subtle Blue Tint)
          Positioned.fill(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 3, sigmaY: 3),
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      const Color(0xFF0F2027).withOpacity(0.60),
                      const Color(0xFF203A43).withOpacity(0.55),
                      const Color(0xFF2C5364).withOpacity(0.65),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // 3. Main Content Layer
          SafeArea(
            child: Column(
              children: [
                // Top Location Bar
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Location Compass Button
                      GestureDetector(
                        onTap: () => _openLocationPicker(context),
                        child: Container(
                          width: 38,
                          height: 38,
                          decoration: const BoxDecoration(
                            color: Color(0xFFE89D1E),
                            shape: BoxShape.circle,
                          ),
                          child: const Center(
                            child: Icon(Icons.near_me_rounded, color: Colors.black, size: 20),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),

                      // Location Title & Subtext
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            GestureDetector(
                              onTap: () => _openLocationPicker(context),
                              child: Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      locationProvider.location,
                                      style: const TextStyle(
                                        fontSize: 17,
                                        fontWeight: FontWeight.w900,
                                        color: Colors.white,
                                        shadows: [Shadow(color: Colors.black45, blurRadius: 4)],
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  const Icon(Icons.keyboard_arrow_down_rounded, color: Colors.white, size: 22),
                                ],
                              ),
                            ),
                            Text(
                              locationProvider.subAddress,
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.white.withOpacity(0.85),
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),

                            Row(
                              children: const [
                                Icon(Icons.north_west_rounded, size: 14, color: Color(0xFFF472B6)),
                                SizedBox(width: 4),
                                Text(
                                  'Tap here to change your location',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    fontStyle: FontStyle.italic,
                                    color: Color(0xFFF472B6),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      IconButton(
                        icon: const Icon(Icons.menu_rounded, color: Colors.white, size: 26),
                        onPressed: () => context.push(AppRoutes.home),
                      ),
                    ],
                  ),
                ),

                // Center Content: Bigger Brand Logo, Native Text Card & Status
                Expanded(
                  child: Center(
                    child: SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          // 1. BIGGER BRAND LOGO
                          Image.asset(
                            'assets/splash_logo.png',
                            height: 90,
                            fit: BoxFit.contain,
                            errorBuilder: (_, __, ___) => const Text(
                              'ECDKART',
                              style: TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                letterSpacing: 1.5,
                              ),
                            ),
                          ),

                          const SizedBox(height: 28),

                          // 2. NATIVE FLUTTER TEXT BANNER (TEXT FROM UNABLE.PNG)
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 22),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFF8E7),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: const Color(0xFF8B1E1E), width: 2),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.35),
                                  blurRadius: 16,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(Icons.campaign_rounded, color: Color(0xFF8B1E1E), size: 26),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        'WE ARE NOT ACCEPTING\nORDERS ON YOUR LOCATION',
                                        textAlign: TextAlign.center,
                                        style: const TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w900,
                                          color: Color(0xFF8B1E1E),
                                          height: 1.25,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    const Icon(Icons.campaign_rounded, color: Color(0xFF8B1E1E), size: 26),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Container(
                                  height: 1.5,
                                  width: 140,
                                  color: const Color(0xFF8B1E1E).withOpacity(0.4),
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: const [
                                    Icon(Icons.star_rounded, color: Color(0xFFE89D1E), size: 16),
                                    SizedBox(width: 6),
                                    Text(
                                      'WE ARE COMING SOON',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w800,
                                        color: Colors.black87,
                                        letterSpacing: 0.8,
                                      ),
                                    ),
                                    SizedBox(width: 6),
                                    Icon(Icons.star_rounded, color: Color(0xFFE89D1E), size: 16),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                const Text(
                                  'IN YOUR LOCATION',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF555555),
                                    letterSpacing: 1.0,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 28),

                          // 3. THANK YOU MESSAGE
                          const Text(
                            'Thank you for Choosing Us',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              letterSpacing: 0.2,
                              shadows: [Shadow(color: Colors.black54, blurRadius: 6)],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                if (hasCartItems && firstItem != null) const SizedBox(height: 70),
              ],
            ),
          ),

          // ── FLOATING BOTTOM CART BAR IF CART HAS ITEMS ────────────────
          if (hasCartItems && firstItem != null)
            Positioned(
              left: 16,
              right: 16,
              bottom: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.25),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                  border: Border.all(color: const Color(0xFFE0E0E0)),
                ),
                child: Row(
                  children: [
                    // Item Image/Icon
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        width: 40,
                        height: 40,
                        color: const Color(0xFFFFF3E0),
                        child: const Icon(Icons.lunch_dining, color: Color(0xFFE89D1E), size: 24),
                      ),
                    ),
                    const SizedBox(width: 10),

                    // Item title & menu subtext
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            firstItem.product.name,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              color: Colors.black,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                          const Text(
                            'View full menu',
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.grey,
                              decoration: TextDecoration.underline,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Green Checkout Button
                    ElevatedButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const CartPage()),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF248C70),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                        elevation: 0,
                      ),
                      child: Text(
                        'Checkout\n${cart.itemCount} item | ₹${cart.finalAmount.toInt()}',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          height: 1.1,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),

                    // Dismiss 'x' button
                    GestureDetector(
                      onTap: () => cart.clear(),
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade200,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.close, size: 16, color: Colors.black87),
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


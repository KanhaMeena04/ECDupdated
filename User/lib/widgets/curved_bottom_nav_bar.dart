import 'package:flutter/material.dart';

class CurvedBottomNavBar extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onItemTapped;
  final VoidCallback onPlusTapped;
  final bool isDark;

  const CurvedBottomNavBar({
    super.key,
    required this.selectedIndex,
    required this.onItemTapped,
    required this.onPlusTapped,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFF248C70);
    const accentOrange = Color(0xFFE89D1E);
    final barBgColor = isDark ? const Color(0xFF1E1E1E) : Colors.white;

    return SizedBox(
      height: 80,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.bottomCenter,
        children: [
          // Curved notched bar background
          CustomPaint(
            size: Size(MediaQuery.of(context).size.width, 70),
            painter: _CurvedNavPainter(
              color: barBgColor,
              shadowColor: isDark
                  ? Colors.black.withValues(alpha: 0.5)
                  : Colors.black.withValues(alpha: 0.1),
            ),
          ),

          // Navigation icons row
          Positioned.fill(
            top: 10,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                // 0: Home
                _NavBarIcon(
                  icon: Icons.home_rounded,
                  label: 'Home',
                  isSelected: selectedIndex == 0,
                  activeColor: primaryColor,
                  inactiveColor: isDark ? Colors.grey.shade500 : const Color(0xFF9CA3AF),
                  onTap: () => onItemTapped(0),
                ),
                // 1: Categories
                _NavBarIcon(
                  icon: Icons.grid_view_rounded,
                  label: 'Categories',
                  isSelected: selectedIndex == 1,
                  activeColor: primaryColor,
                  inactiveColor: isDark ? Colors.grey.shade500 : const Color(0xFF9CA3AF),
                  onTap: () => onItemTapped(1),
                ),
                // Spacer for center Floating PLUS button
                const SizedBox(width: 56),
                // 2: Orders
                _NavBarIcon(
                  icon: Icons.receipt_long_rounded,
                  label: 'Orders',
                  isSelected: selectedIndex == 2,
                  activeColor: primaryColor,
                  inactiveColor: isDark ? Colors.grey.shade500 : const Color(0xFF9CA3AF),
                  onTap: () => onItemTapped(2),
                ),
                // 3: Profile
                _NavBarIcon(
                  icon: Icons.person_rounded,
                  label: 'Profile',
                  isSelected: selectedIndex == 3,
                  activeColor: primaryColor,
                  inactiveColor: isDark ? Colors.grey.shade500 : const Color(0xFF9CA3AF),
                  onTap: () => onItemTapped(3),
                ),
              ],
            ),
          ),

          // Center floating PLUS button
          Positioned(
            top: -5,
            child: GestureDetector(
              onTap: onPlusTapped,
              child: Container(
                width: 58,
                height: 58,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: const Color(0xFFE89D1E),
                    width: 2.0,
                  ),
                  gradient: const LinearGradient(
                    colors: [Color(0xFF248C70), Color(0xFF1E755D)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF248C70).withValues(alpha: 0.4),
                      blurRadius: 12,
                      spreadRadius: 2,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.add_rounded,
                  color: Colors.white,
                  size: 32,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _NavBarIcon extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final Color activeColor;
  final Color inactiveColor;
  final VoidCallback onTap;

  const _NavBarIcon({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.activeColor,
    required this.inactiveColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: const Color(0xFFE89D1E),
                  width: 1.5,
                ),
                color: isSelected
                    ? activeColor.withValues(alpha: 0.08)
                    : Colors.transparent,
              ),
              child: Icon(
                icon,
                size: 22,
                color: isSelected ? activeColor : inactiveColor,
              ),
            ),
            const SizedBox(height: 2),
            if (isSelected)
              Container(
                width: 5,
                height: 5,
                decoration: BoxDecoration(
                  color: activeColor,
                  shape: BoxShape.circle,
                ),
              )
            else
              Text(
                label,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: inactiveColor,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _CurvedNavPainter extends CustomPainter {
  final Color color;
  final Color shadowColor;

  _CurvedNavPainter({required this.color, required this.shadowColor});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final path = Path();
    const radius = 24.0;
    const notchRadius = 36.0;
    final center = size.width / 2;

    path.moveTo(0, radius);
    path.quadraticBezierTo(0, 0, radius, 0);

    // Left side straight line before notch
    path.lineTo(center - notchRadius - 12, 0);

    // Smooth concave curve for center notch
    path.cubicTo(
      center - notchRadius + 4, 0,
      center - notchRadius + 6, notchRadius - 4,
      center, notchRadius - 4,
    );
    path.cubicTo(
      center + notchRadius - 6, notchRadius - 4,
      center + notchRadius - 4, 0,
      center + notchRadius + 12, 0,
    );

    // Right side straight line after notch
    path.lineTo(size.width - radius, 0);
    path.quadraticBezierTo(size.width, 0, size.width, radius);
    path.lineTo(size.width, size.height);
    path.lineTo(0, size.height);
    path.close();

    // Draw shadow
    canvas.drawShadow(path, shadowColor, 8.0, false);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

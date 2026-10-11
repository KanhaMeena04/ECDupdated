import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/models/restaurant_models.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/safe_image.dart';

class RestaurantProfileScreen extends StatelessWidget {
  final Restaurant restaurant;

  const RestaurantProfileScreen({super.key, required this.restaurant});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    const primaryColor = AppColors.primary;
    const accentOrange = AppColors.accentOrange;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF121212) : const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        foregroundColor: isDark ? Colors.white : Colors.black87,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, size: 22),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Restaurant Profile',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            letterSpacing: -0.3,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Top Cover Header Image Slider
            Stack(
              clipBehavior: Clip.none,
              children: [
                SafeImage(
                  restaurant.imageUrl,
                  height: 220,
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
                // Image slider indicator dots overlay
                Positioned(
                  bottom: 30,
                  left: 0,
                  right: 0,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      5,
                      (index) => Container(
                        margin: const EdgeInsets.symmetric(horizontal: 2),
                        width: index == 0 ? 12 : 5,
                        height: 5,
                        decoration: BoxDecoration(
                          color: index == 0
                              ? Colors.white
                              : Colors.white.withValues(alpha: 0.5),
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),

            // Main Info Content Card Overlay
            Transform.translate(
              offset: const Offset(0, -20),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1F2937) : Colors.white,
                  borderRadius:
                      const BorderRadius.vertical(top: Radius.circular(28)),
                  boxShadow: [
                    if (!isDark)
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 15,
                        offset: const Offset(0, -5),
                      ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Restaurant Name
                    Text(
                      restaurant.name,
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: isDark ? Colors.white : const Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 4),

                    // Cuisines
                    Text(
                      restaurant.cuisine,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(height: 6),

                    // Service Tagline
                    const Text(
                      'Delivery | Pickup Services',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFFEF4444), // Coral Red
                      ),
                    ),
                    const SizedBox(height: 20),

                    // About Restaurant
                    const Text(
                      'About Restaurant',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.2,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'We serve delicious ${restaurant.cuisine} made with fresh ingredients and quality recipes. Our focus is on great taste, quick preparation, and hygienic cooking to ensure every order is satisfying and delivered on time.',
                      style: TextStyle(
                        fontSize: 12,
                        height: 1.5,
                        color: isDark ? Colors.grey.shade300 : const Color(0xFF4B5563),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Contact Information
                    // Contact Information
                    const Text(
                      'Contact Information',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.2,
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Phone & Email Row
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Phone',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                restaurant.phone.trim().isNotEmpty ? restaurant.phone.trim() : 'Not Available',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Email',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                restaurant.email.trim().isNotEmpty ? restaurant.email.trim() : 'Not Available',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Address
                    Text(
                      'Address',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      restaurant.address.trim().isNotEmpty ? restaurant.address.trim() : 'Address not specified',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Order & Service Details
                    const Text(
                      'Order & Service Details',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.2,
                      ),
                    ),
                    const SizedBox(height: 12),
                    _buildInfoRow('Current Status', restaurant.isOpen ? 'Open Now' : 'Closed', isDark, isHighlight: true, isClosed: !restaurant.isOpen),
                    _buildInfoRow('Estimated Prep Time', '${restaurant.estimatedPreparationTime} mins', isDark),
                    _buildInfoRow('Minimum Order Value', restaurant.minOrderValue > 0 ? '₹${restaurant.minOrderValue.toInt()}' : 'No Minimum Order', isDark),
                    _buildInfoRow('Order Modes', restaurant.isSelfPickupEnabled ? 'Delivery & Self-Pickup' : 'Delivery Only', isDark),
                    _buildInfoRow('Payment Methods', restaurant.paymentMethods, isDark),

                    const SizedBox(height: 20),

                    // Operational Hours
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Operational Hours',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.2,
                          ),
                        ),
                        if (restaurant.timing['isHoliday'] == true)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text('Holiday Closed', style: TextStyle(color: Color(0xFFEF4444), fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    ..._buildScheduleRows(isDark),

                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildScheduleRows(bool isDark) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.map((day) {
      final dayKey = day.toLowerCase();
      final dayData = restaurant.timing[dayKey];
      String hours = '09:00 AM - 11:00 PM';
      bool isClosed = false;

      if (dayData is Map) {
        if (dayData['isClosed'] == true) {
          isClosed = true;
          hours = 'Closed';
        } else if (dayData['open'] != null && dayData['close'] != null) {
          hours = '${dayData['open']} - ${dayData['close']}';
        }
      }

      return _buildHourRow(day, hours, isDark, isClosed: isClosed);
    }).toList();
  }

  Widget _buildInfoRow(String label, String value, bool isDark, {bool isHighlight = false, bool isClosed = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.grey.shade400 : const Color(0xFF6B7280),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: isClosed
                  ? const Color(0xFFEF4444)
                  : (isHighlight
                      ? const Color(0xFF10B981)
                      : (isDark ? Colors.white : const Color(0xFF111827))),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHourRow(String day, String hours, bool isDark,
      {bool isClosed = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            day,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.grey.shade300 : const Color(0xFF374151),
            ),
          ),
          Text(
            hours,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: isClosed
                  ? const Color(0xFFEF4444)
                  : (isDark ? Colors.white : const Color(0xFF111827)),
            ),
          ),
        ],
      ),
    );
  }
}

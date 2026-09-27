import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../providers/cart_provider.dart';
import '../../providers/theme_provider.dart';
import '../../providers/address_provider.dart';
import '../../providers/user_provider.dart';
import '../../routes/app_routes.dart';
import '../../services/location_service.dart';
import '../../services/notification_api_service.dart';
import '../../widgets/safe_image.dart';
import '../payment/address_selection_page.dart';
import '../profile/profile_page.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../providers/location_provider.dart';

class CustomAppBar extends StatelessWidget {
  final bool showBottomRadius;
  const CustomAppBar({super.key, this.showBottomRadius = true});

  @override
  Widget build(BuildContext context) {
    final cartCount = context.watch<CartProvider>().itemCount;
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    final defaultAddress = context.watch<AddressProvider>().defaultAddress;
    final location = defaultAddress?.fullAddress ?? context.watch<LocationProvider>().location;
    final userProvider = context.watch<UserProvider>();
    final userName = userProvider.name;
    final userAvatar = userProvider.avatar;
    final firstChar = userName.isNotEmpty ? userName[0].toUpperCase() : 'U';

    return Container(
      decoration: BoxDecoration(
        color: isDark ? Colors.black : const Color(0xFF248C70),
        borderRadius: showBottomRadius
            ? const BorderRadius.only(
                bottomLeft: Radius.circular(24.0),
                bottomRight: Radius.circular(24.0),
              )
            : BorderRadius.zero,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: SafeArea(
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () {
                      context.push(AppRoutes.locationSetup);
                    },
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        const Icon(Icons.location_on, color: Colors.white, size: 20),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Delivering to',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.white70,
                                  fontWeight: FontWeight.w400,
                                  height: 1.2,
                                ),
                              ),
                              Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      location,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w700,
                                        color: Colors.white,
                                        height: 1.2,
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  const Icon(Icons.keyboard_arrow_down,
                                      color: Colors.white, size: 16),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // ── 3 Circular Action Icons matching Screenshot 1 ────────────
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // 1. User Profile Circle Avatar
                    _buildProfileCircle(
                      avatarUrl: userAvatar,
                      firstChar: firstChar,
                      isDark: isDark,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const ProfileTab()),
                        );
                      },
                    ),
                    const SizedBox(width: 8),

                    // 2. Cart Circle Button
                    _buildTopCircleButton(
                      isDark: isDark,
                      onTap: () => context.push(AppRoutes.cart),
                      icon: Icons.shopping_cart_outlined,
                      badge: cartCount > 0
                          ? Container(
                              padding: const EdgeInsets.all(4),
                              decoration: const BoxDecoration(
                                color: Colors.red,
                                shape: BoxShape.circle,
                              ),
                              constraints: const BoxConstraints(
                                  minWidth: 16, minHeight: 16),
                              child: Text(
                                '$cartCount',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            )
                          : null,
                    ),
                    const SizedBox(width: 8),

                    // 3. Notification Bell Circle Button
                    _buildTopCircleButton(
                      isDark: isDark,
                      onTap: () => _showNotificationsSheet(context),
                      icon: Icons.notifications_none_rounded,
                      badge: Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            GestureDetector(
              onTap: () => context.push(AppRoutes.search),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withOpacity(0.15) : Colors.white,
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(color: isDark ? Colors.grey[800]! : Colors.grey.shade300),
                ),
                child: Row(
                  children: [
                    Icon(Icons.search, color: isDark ? Colors.white70 : Colors.black54, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Search for restaurants, dishes...',
                        style: TextStyle(color: isDark ? Colors.white70 : Colors.black54, fontSize: 14),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showLocationSheet(BuildContext context) {
    final locationProvider = context.read<LocationProvider>();
    final controller = TextEditingController(text: locationProvider.location);

    const presets = [
      'Vijay Nagar, Indore',
      'Palasia, Indore',
      'Bhawarkuwa, Indore',
      'Sapna Sangeeta, Indore',
      'Scheme 54, Indore',
      'MG Road, Indore',
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            LatLng? currentCenter;
            
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(ctx).viewInsets.bottom,
              ),
              child: Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                ),
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE5E7EB),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    const Text(
                      'Change Location',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF2C2C2C),
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Enter your delivery address',
                      style: TextStyle(
                        fontSize: 13,
                        color: Color(0xFF9CA3AF),
                      ),
                    ),
                    const SizedBox(height: 16),

                    Container(
                      height: 160,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFE5E7EB)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Stack(
                        children: [
                          GoogleMap(
                            initialCameraPosition: CameraPosition(
                              target: LatLng(
                                locationProvider.lat ?? 22.7196,
                                locationProvider.lng ?? 75.8577,
                              ),
                              zoom: 16.0,
                            ),
                            myLocationEnabled: false,
                            myLocationButtonEnabled: false,
                            zoomControlsEnabled: false,
                            onCameraMove: (CameraPosition position) {
                              currentCenter = position.target;
                            },
                            onCameraIdle: () async {
                              if (currentCenter != null) {
                                try {
                                  String newAddr = await reverseGeocode(
                                    currentCenter!.latitude,
                                    currentCenter!.longitude
                                  );
                                  setModalState(() {
                                    controller.text = newAddr;
                                  });
                                } catch (_) {}
                              }
                            },
                          ),
                          const Center(
                            child: Padding(
                              padding: EdgeInsets.only(bottom: 35),
                              child: Icon(
                                Icons.location_on,
                                color: AppColors.primary,
                                size: 42,
                              ),
                            ),
                          ),
                          Positioned.fill(
                            child: Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  colors: [
                                    Colors.black.withValues(alpha: 0.1),
                                    Colors.transparent,
                                    Colors.transparent,
                                    Colors.black.withValues(alpha: 0.05),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    TextField(
                      controller: controller,
                      autofocus: true,
                      decoration: InputDecoration(
                        hintText: 'Type your location...',
                        prefixIcon: const Icon(Icons.location_on, color: AppColors.primary),
                        suffixIcon: IconButton(
                          icon: const Icon(Icons.clear, color: Color(0xFF9CA3AF)),
                          onPressed: () => controller.clear(),
                        ),
                        filled: true,
                        fillColor: const Color(0xFFF5FAF8),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.primary, width: 2),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    Flexible(
                      child: SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            GestureDetector(
                              onTap: () async {
                                final nav = Navigator.of(ctx);
                                controller.text = "Locating...";
                                String realLocation = await getCurrentLocationName();
                                locationProvider.updateLocation(realLocation);
                                nav.pop();
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withValues(alpha: 0.08),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Row(
                                  children: [
                                    Icon(Icons.my_location, color: AppColors.primary, size: 18),
                                    SizedBox(width: 10),
                                    Text(
                                      'Use current location',
                                      style: TextStyle(
                                        color: AppColors.primary,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),

                            const Text(
                              'Popular areas',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF6B7280),
                              ),
                            ),
                            const SizedBox(height: 10),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: presets.map((loc) {
                                final isSelected = loc == locationProvider.location;
                                return GestureDetector(
                                  onTap: () {
                                    locationProvider.updateLocation(loc);
                                    Navigator.pop(ctx);
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                    decoration: BoxDecoration(
                                      color: isSelected ? AppColors.primary : const Color(0xFFF3F4F6),
                                      borderRadius: BorderRadius.circular(20),
                                      border: isSelected ? null : Border.all(color: const Color(0xFFE5E7EB)),
                                    ),
                                    child: Text(
                                      loc,
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w500,
                                        color: isSelected ? Colors.white : const Color(0xFF374151),
                                      ),
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                            const SizedBox(height: 20),
                          ],
                        ),
                      ),
                    ),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          final text = controller.text.trim();
                          if (text.isNotEmpty) {
                            locationProvider.updateLocation(text);
                          }
                          Navigator.pop(ctx);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.black,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                        child: const Text(
                          'Confirm Location',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildProfileCircle({
    required String avatarUrl,
    required String firstChar,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(
            color: Colors.white,
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.15),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: ClipOval(
          child: avatarUrl.isNotEmpty
              ? SafeImage(avatarUrl, width: 38, height: 38, fit: BoxFit.cover)
              : Container(
                  color: const Color(0xFFE89D1E),
                  child: Center(
                    child: Text(
                      firstChar,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
        ),
      ),
    );
  }

  Widget _buildTopCircleButton({
    required bool isDark,
    required VoidCallback onTap,
    required IconData icon,
    Widget? badge,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isDark ? Colors.white.withValues(alpha: 0.18) : Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.12),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Center(
              child: Icon(
                icon,
                color: isDark ? Colors.white : AppColors.primary,
                size: 20,
              ),
            ),
          ),
          if (badge != null)
            Positioned(
              top: -2,
              right: -2,
              child: badge,
            ),
        ],
      ),
    );
  }

  void _showNotificationsSheet(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        List<Map<String, dynamic>> notifications = [];
        bool isLoading = true;

        return StatefulBuilder(
          builder: (modalCtx, setModalState) {
            void loadData() async {
              final list = await NotificationApiService.getNotifications();
              if (modalCtx.mounted) {
                setModalState(() {
                  notifications = list;
                  isLoading = false;
                });
              }
            }

            if (isLoading && notifications.isEmpty) {
              loadData();
            }

            return Container(
              height: MediaQuery.of(modalCtx).size.height * 0.65,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 36,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.notifications, color: AppColors.primary, size: 22),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            'Notifications',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: isDark ? Colors.white : const Color(0xFF2C2C2C),
                            ),
                          ),
                        ],
                      ),
                      if (notifications.isNotEmpty)
                        TextButton(
                          onPressed: () async {
                            await NotificationApiService.markAllAsRead();
                            loadData();
                          },
                          child: const Text('Mark all read', style: TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Expanded(
                    child: isLoading
                        ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                        : (notifications.isEmpty
                            ? Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.notifications_none, size: 48, color: Colors.grey.shade400),
                                    const SizedBox(height: 12),
                                    Text(
                                      'No notifications yet',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: isDark ? Colors.grey[400] : Colors.grey[600],
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Your order updates & promo offers will appear here',
                                      style: TextStyle(fontSize: 12, color: Colors.grey.shade400),
                                    ),
                                  ],
                                ),
                              )
                            : ListView.separated(
                                itemCount: notifications.length,
                                separatorBuilder: (_, __) => const SizedBox(height: 10),
                                itemBuilder: (_, idx) {
                                  final item = notifications[idx];
                                  final type = item['type']?.toString() ?? 'general';
                                  final title = item['title']?.toString() ?? 'Notification';
                                  final message = item['message']?.toString() ?? '';
                                  final createdAtStr = item['createdAt']?.toString();
                                  final createdAt = createdAtStr != null ? DateTime.tryParse(createdAtStr) : null;
                                  final timeAgo = createdAt != null ? _formatTimeAgo(createdAt) : 'Just now';

                                  IconData iconData = Icons.notifications_active_outlined;
                                  if (type == 'promo_offer' || title.toLowerCase().contains('offer')) {
                                    iconData = Icons.local_offer;
                                  } else if (type == 'order_status' || title.toLowerCase().contains('order')) {
                                    iconData = Icons.delivery_dining;
                                  }

                                  return _buildNotificationTile(
                                    icon: iconData,
                                    title: title,
                                    time: timeAgo,
                                    subtitle: message,
                                    isDark: isDark,
                                  );
                                },
                              )),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(ctx),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Close', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  static String _formatTimeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes} mins ago';
    if (diff.inHours < 24) return '${diff.inHours} hrs ago';
    return '${diff.inDays} days ago';
  }

  Widget _buildNotificationTile({
    required IconData icon,
    required String title,
    required String time,
    required String subtitle,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.05) : const Color(0xFFF8FAF9),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFE5E7EB)),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppColors.primary, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                    ),
                    Text(
                      time,
                      style: TextStyle(fontSize: 10, color: Colors.grey[500]),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark ? Colors.white70 : Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

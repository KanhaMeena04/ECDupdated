import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/models/restaurant_models.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/theme_provider.dart';
import '../../providers/wishlist_provider.dart';
import '../../services/restaurant_api_service.dart';
import '../../widgets/safe_image.dart';
import 'restaurant_detail_screen.dart';
import 'widgets/filters_bottom_sheet.dart';

class RecommendedRestaurantsPage extends StatefulWidget {
  const RecommendedRestaurantsPage({super.key});

  @override
  State<RecommendedRestaurantsPage> createState() =>
      _RecommendedRestaurantsPageState();
}

class _RecommendedRestaurantsPageState
    extends State<RecommendedRestaurantsPage> {
  List<Restaurant> _restaurants = [];
  bool _isLoading = true;
  String _selectedFilter = 'All';
  Map<String, String> _appliedFilters = {};
  final Set<String> _favorites = {};

  @override
  void initState() {
    super.initState();
    _fetchRestaurants();
  }

  Future<void> _fetchRestaurants() async {
    try {
      final list = await RestaurantApiService.getRestaurants();
      setState(() {
        _restaurants = list;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _openFilterModal() async {
    final filters = await showModalBottomSheet<Map<String, String>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => SizedBox(
        height: MediaQuery.of(context).size.height * 0.75,
        child: const FiltersBottomSheet(),
      ),
    );

    if (filters != null) {
      setState(() {
        _appliedFilters = filters;
      });
    }
  }

  List<Restaurant> get _filteredRestaurants {
    List<Restaurant> list = List.from(_restaurants);

    if (_selectedFilter == 'Ratings') {
      list = list.where((r) => r.rating >= 4.5).toList();
    } else if (_selectedFilter == 'Offers') {
      list = list.where((r) => r.deliveryCharge == 0).toList();
    } else if (_selectedFilter == 'Food Type') {
      list = list.where((r) => r.cuisine.toLowerCase().contains('pizza') || r.cuisine.toLowerCase().contains('veg')).toList();
    }

    if (_appliedFilters.containsKey('minRating')) {
      final minR = double.tryParse(_appliedFilters['minRating']!) ?? 0.0;
      list = list.where((r) => r.rating >= minR).toList();
    }
    if (_appliedFilters.containsKey('maxDistance')) {
      final maxD = double.tryParse(_appliedFilters['maxDistance']!) ?? 999.0;
      list = list.where((r) => r.distanceKm <= maxD).toList();
    }
    if (_appliedFilters.containsKey('status') &&
        _appliedFilters['status'] == 'Open Now') {
      list = list.where((r) => r.isOnline).toList();
    }

    return list;
  }

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
          'Recommended',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            letterSpacing: -0.3,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.tune_rounded, size: 22),
            onPressed: _openFilterModal,
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips Bar (Matching Screenshot 2 style)
          Container(
            color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('Sort', isDark, primaryColor, icon: Icons.swap_vert_rounded),
                  const SizedBox(width: 8),
                  _buildFilterChip('Ratings', isDark, primaryColor),
                  const SizedBox(width: 8),
                  _buildFilterChip('Offers', isDark, primaryColor),
                  const SizedBox(width: 8),
                  _buildFilterChip('Food Type', isDark, primaryColor),
                ],
              ),
            ),
          ),

          // Recommended Restaurants List
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: primaryColor))
                : _filteredRestaurants.isEmpty
                    ? Center(
                        child: Text(
                          'No recommended restaurants match your criteria',
                          style: TextStyle(
                            color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 12),
                        itemCount: _filteredRestaurants.length,
                        itemBuilder: (context, index) {
                          final r = _filteredRestaurants[index];
                          final isFav = context.watch<WishlistProvider>().isRestaurantFavorite(r.id);

                          return GestureDetector(
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) =>
                                    RestaurantDetailScreen(restaurant: r),
                              ),
                            ),
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 16),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? const Color(0xFF1F2937)
                                    : Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: [
                                  if (!isDark)
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.05),
                                      blurRadius: 10,
                                      offset: const Offset(0, 4),
                                    ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Card Image Header with Carousel dots & Favorite Heart
                                  Stack(
                                    children: [
                                      ClipRRect(
                                        borderRadius: const BorderRadius.vertical(
                                            top: Radius.circular(20)),
                                        child: SafeImage(
                                          r.imageUrl,
                                          height: 170,
                                          width: double.infinity,
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                      // Favorite Heart Button
                                      Positioned(
                                        top: 12,
                                        right: 12,
                                        child: GestureDetector(
                                          onTap: () {
                                            final wishlist = context.read<WishlistProvider>();
                                            wishlist.toggleRestaurantFavorite(r.id);
                                            final isNowFav = wishlist.isRestaurantFavorite(r.id);
                                            ScaffoldMessenger.of(context).hideCurrentSnackBar();
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              SnackBar(
                                                content: Text(
                                                  isNowFav
                                                      ? '❤️ Added ${r.name} to Favourites!'
                                                      : 'Removed ${r.name} from Favourites',
                                                ),
                                                duration: const Duration(seconds: 1),
                                                backgroundColor: isNowFav ? const Color(0xFF248C70) : Colors.grey.shade800,
                                              ),
                                            );
                                          },
                                          child: Container(
                                            padding: const EdgeInsets.all(7),
                                            decoration: BoxDecoration(
                                              color: Colors.white.withValues(alpha: 0.9),
                                              shape: BoxShape.circle,
                                              boxShadow: [
                                                BoxShadow(
                                                  color: Colors.black.withValues(alpha: 0.15),
                                                  blurRadius: 6,
                                                  offset: const Offset(0, 2),
                                                ),
                                              ],
                                            ),
                                            child: Icon(
                                              isFav
                                                  ? Icons.favorite_rounded
                                                  : Icons.favorite_border_rounded,
                                              size: 18,
                                              color: isFav ? const Color(0xFFEF4444) : Colors.black87,
                                            ),
                                          ),
                                        ),
                                      ),
                                      // Best Seller Tag Overlay
                                      Positioned(
                                        left: 12,
                                        bottom: 12,
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFFDE8E8),
                                            borderRadius:
                                                BorderRadius.circular(12),
                                          ),
                                          child: const Text(
                                            'Best Seller: Cheese Burst Pizza',
                                            style: TextStyle(
                                              color: Color(0xFFE02424),
                                              fontSize: 10,
                                              fontWeight: FontWeight.w800,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),

                                  // Card Info Footer
                                  Padding(
                                    padding: const EdgeInsets.all(14),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceBetween,
                                          children: [
                                            Expanded(
                                              child: Text(
                                                r.name,
                                                style: TextStyle(
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.w800,
                                                  color: isDark
                                                      ? Colors.white
                                                      : const Color(0xFF111827),
                                                ),
                                              ),
                                            ),
                                            Row(
                                              children: [
                                                const Icon(
                                                  Icons.star_rounded,
                                                  size: 16,
                                                  color: accentOrange,
                                                ),
                                                const SizedBox(width: 3),
                                                Text(
                                                  '${r.rating.toStringAsFixed(1)} (${_formatReviews(r.reviewCount)})',
                                                  style: TextStyle(
                                                    fontSize: 13,
                                                    fontWeight: FontWeight.w800,
                                                    color: isDark
                                                        ? Colors.white
                                                        : Colors.black87,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          r.cuisine,
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w500,
                                            color: isDark
                                                ? Colors.grey.shade400
                                                : const Color(0xFF6B7280),
                                          ),
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          '${r.distanceKm} km away   |   ${r.deliveryTimeMin}-${r.deliveryTimeMin + 10} minutes',
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w500,
                                            color: isDark
                                                ? Colors.grey.shade400
                                                : const Color(0xFF6B7280),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, bool isDark, Color primaryColor,
      {IconData? icon}) {
    final isSelected = _selectedFilter == label;
    return GestureDetector(
      onTap: () {
        if (label == 'Sort') {
          _openFilterModal();
        } else {
          setState(() {
            _selectedFilter = isSelected ? 'All' : label;
          });
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected
              ? primaryColor
              : (isDark ? const Color(0xFF2D2D2D) : Colors.white),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? primaryColor
                : (isDark ? Colors.grey.shade700 : const Color(0xFFD1D5DB)),
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(
                icon,
                size: 14,
                color: isSelected
                    ? Colors.white
                    : (isDark ? Colors.white70 : Colors.black87),
              ),
              const SizedBox(width: 4),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected
                    ? Colors.white
                    : (isDark ? Colors.white70 : const Color(0xFF374151)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatReviews(int count) {
    if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}k';
    }
    return '$count';
  }
}

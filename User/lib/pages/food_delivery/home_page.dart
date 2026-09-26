import 'dart:async';
import 'package:ecdkart_app/widgets/safe_image.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:ecdkart_app/core/models/restaurant_models.dart';
import 'package:ecdkart_app/core/models/product.dart';
import 'package:ecdkart_app/core/models/banner.dart';
import 'package:ecdkart_app/pages/food_delivery/dish_restaurants_page.dart';
import 'package:ecdkart_app/pages/food_delivery/restaurant_detail_screen.dart';
import 'package:ecdkart_app/pages/order/my_orders_page.dart';
import 'package:ecdkart_app/pages/profile/profile_page.dart';
import 'package:ecdkart_app/pages/category_selection/categories_page.dart';
import 'package:ecdkart_app/pages/category_selection/food_preferences_page.dart';
import 'package:ecdkart_app/pages/widgets/app_bar.dart';
import 'package:ecdkart_app/pages/widgets/category_card.dart';
import 'package:ecdkart_app/widgets/curved_bottom_nav_bar.dart';
import 'package:ecdkart_app/widgets/quick_order_sheet.dart';
import 'package:ecdkart_app/widgets/coupons_bottom_sheet.dart';
import 'package:flutter/material.dart' hide Category;
import 'package:provider/provider.dart';
import '../../core/models/category.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../providers/theme_provider.dart';
import 'widgets/filters_bottom_sheet.dart';
import '../../services/popular_dish_data.dart';
import '../../services/restaurant_api_service.dart';
import '../../providers/cart_provider.dart';
import '../../providers/user_provider.dart';
import '../../providers/location_provider.dart';
import '../../providers/wishlist_provider.dart';
import '../../providers/order_provider.dart';
import '../../services/socket_service.dart';

import 'recommended_restaurants_page.dart';
import '../cart/cart_page.dart';
import '../wishlist/wishlist_tab.dart';
import '../profile/unserviceable_location_page.dart';

class HomePage extends StatefulWidget {
  final int initialIndex;
  
  const HomePage({super.key, this.initialIndex = 0});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  late int _selectedIndex;
  List<String> _selectedPreferences = [];

  @override
  void initState() {
    super.initState();
    _selectedIndex = widget.initialIndex;
  }

  void _onPreferencesSelected(List<String> prefs) {
    setState(() {
      _selectedPreferences = prefs;
      _selectedIndex = 0; // Return to Main Home tab
    });
  }

  void _onSkipPreferences() {
    setState(() {
      _selectedIndex = 0; // Return to Main Home tab
    });
  }

  void _onClearPreferences() {
    setState(() {
      _selectedPreferences = [];
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    return Scaffold(
      resizeToAvoidBottomInset: false,
      backgroundColor: isDark ? Colors.black : const Color(0xFFF5FAF8),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 350),
        switchInCurve: Curves.easeOutCubic,
        switchOutCurve: Curves.easeInCubic,
        transitionBuilder: (Widget child, Animation<double> animation) {
          final flipAnimation = Tween<double>(begin: -0.3, end: 0.0).animate(animation);
          return AnimatedBuilder(
            animation: animation,
            builder: (context, child) {
              return Transform(
                transform: Matrix4.identity()
                  ..setEntry(3, 2, 0.001)
                  ..rotateY(flipAnimation.value),
                alignment: Alignment.center,
                child: FadeTransition(
                  opacity: animation,
                  child: child,
                ),
              );
            },
            child: child,
          );
        },
        child: KeyedSubtree(
          key: ValueKey<int>(_selectedIndex),
          child: [
            _HomeTab(
              selectedPreferences: _selectedPreferences,
              onClearPreferences: _onClearPreferences,
            ),
            CategoriesPage(
              onPreferencesSelected: _onPreferencesSelected,
              onSkip: _onSkipPreferences,
            ),
            const MyOrdersPage(),
            ProfileTab(),
          ][_selectedIndex],
        ),
      ),
      bottomNavigationBar: CurvedBottomNavBar(
        selectedIndex: _selectedIndex,
        isDark: isDark,
        onItemTapped: (index) => setState(() => _selectedIndex = index),
        onPlusTapped: () => QuickOrderSheet.show(context),
      ),
    );
  }
}

// â”€â”€ Custom bottom nav bar item â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Active: green icon + bold green label
// Inactive: gray icon + regular gray label
class _NavBarItem extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _NavBarItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  static const Color _activeColor = Color(0xFF248C70); // Primary Green
  static const Color _inactiveColor = Color(0xFF9CA3AF); // gray

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 72,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isActive ? activeIcon : icon,
              color: isActive ? _activeColor : _inactiveColor,
              size: 26,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isActive ? FontWeight.w700 : FontWeight.w400,
                color: isActive ? _activeColor : _inactiveColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HomeTab extends StatefulWidget {
  final List<String> selectedPreferences;
  final VoidCallback? onClearPreferences;

  const _HomeTab({
    this.selectedPreferences = const [],
    this.onClearPreferences,
  });

  @override
  State<_HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<_HomeTab> {
  List<Restaurant> _restaurants = [];
  bool _isLoadingRestaurants = true;
  bool _hasInitialized = false; // guard against repeated API calls
  Function(dynamic)? _restaurantSocketCallback;
  Timer? _shuffleTimer;
  int _shuffleSeed = 0;
  double? _lastLat;
  double? _lastLng;
  int _fetchCounter = 0;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final loc = context.watch<LocationProvider>();
    if (_lastLat != loc.lat || _lastLng != loc.lng) {
      _lastLat = loc.lat;
      _lastLng = loc.lng;
      _fetchRestaurants();
    }
  }

  @override
  void initState() {
    super.initState();
    _fetchHomeSections();
    _fetchBanners();
    _fetchCategories();
    _fetchPopularDishes();

    // 10-second periodic shuffle for Recommended For You items/restaurants
    _shuffleTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
      if (mounted && _restaurants.isNotEmpty) {
        setState(() {
          _shuffleSeed++;
          _restaurants.shuffle();
        });
      }
    });
    // Sync cart + profile only once
    if (!_hasInitialized) {
      _hasInitialized = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!context.read<LocationProvider>().isLocationSet) {
          context.read<LocationProvider>().refreshLocation();
        }
        context.read<CartProvider>().fetchCart();
        context.read<UserProvider>().fetchProfile();
      });
    }

    _restaurantSocketCallback = (data) {
      debugPrint('HomePage received restaurantStatusUpdated: $data');
      if (mounted && data != null) {
        // Handle case where socket.io might wrap in array
        final Map<String, dynamic>? payload = (data is List && data.isNotEmpty) 
            ? (data.first as Map<String, dynamic>?) 
            : (data is Map<String, dynamic> ? data : (data is Map ? Map<String, dynamic>.from(data) : null));
            
        if (payload != null && payload['restaurantId'] != null && payload['isOnline'] != null) {
          final restaurantId = payload['restaurantId'].toString();
          final isOnline = payload['isOnline'] == true || payload['isOnline'] == 'true';
          
          debugPrint('Updating restaurant $restaurantId to online: $isOnline');
          
          setState(() {
            for (var i = 0; i < _restaurants.length; i++) {
              if (_restaurants[i].id == restaurantId) {
                _restaurants[i] = _restaurants[i].copyWith(isOnline: isOnline);
                debugPrint('Found and updated restaurant in list!');
              }
            }
          });
        }
      }
    };
    SocketService.onRestaurantStatusUpdated(_restaurantSocketCallback!);
  }

  @override
  void dispose() {
    _shuffleTimer?.cancel();
    if (_restaurantSocketCallback != null) {
      SocketService.offRestaurantStatusUpdated(_restaurantSocketCallback);
    }
    super.dispose();
  }

  Future<void> _refreshData() async {
    await Future.wait([
      _fetchHomeSections(),
      _fetchBanners(),
      _fetchCategories(),
      _fetchPopularDishes(),
      _fetchRestaurants(),
    ]);
  }

  bool _hasFetchedCms = false;
  List<Map<String, dynamic>> _cmsSections = [];

  Future<void> _fetchHomeSections() async {
    try {
      final sections = await RestaurantApiService.getHomeScreenSections();
      if (mounted) {
        setState(() {
          _cmsSections = sections;
          _hasFetchedCms = true;
        });
      }
    } catch (e) {
      debugPrint('Error fetching home CMS sections: $e');
    }
  }

  bool _isSectionActive(String key) {
    if (!_hasFetchedCms) return true; // Default visible while loading
    final sec = _cmsSections.firstWhere((s) => s['sectionKey'] == key, orElse: () => {});
    if (sec.isEmpty) return false; // Not in active CMS sections list -> inactive
    return sec['isActive'] == true || sec['isActive'] == null;
  }

  String _getSectionTitle(String key, String defaultTitle) {
    if (_cmsSections.isEmpty) return defaultTitle;
    final sec = _cmsSections.firstWhere((s) => s['sectionKey'] == key, orElse: () => {});
    if (sec.isEmpty || sec['title'] == null || (sec['title'] as String).isEmpty) return defaultTitle;
    return sec['title'] as String;
  }

  List<Category> _categories = [];
  List<PopularDish> _popularDishes = [];
  List<BannerModel> _banners = [];
  bool _isLoadingCategories = true;
  bool _isLoadingPopularDishes = true;
  bool _isLoadingBanners = true;

  Future<void> _fetchBanners() async {
    try {
      final banners = await RestaurantApiService.getBanners();
      setState(() {
        _banners = banners;
        _isLoadingBanners = false;
      });
    } catch (e) {
      setState(() => _isLoadingBanners = false);
    }
  }

  Future<void> _fetchCategories() async {
    try {
      final categories = await RestaurantApiService.getCategories();
      setState(() {
        _categories = categories;
        _isLoadingCategories = false;
      });
    } catch (e) {
      setState(() => _isLoadingCategories = false);
    }
  }

  Future<void> _fetchPopularDishes() async {
    try {
      final dishes = await RestaurantApiService.getPopularDishes();
      setState(() {
        _popularDishes = dishes;
        _isLoadingPopularDishes = false;
      });
    } catch (e) {
      setState(() => _isLoadingPopularDishes = false);
    }
  }

  Map<String, String>? _appliedFiltersMap;
  String _selectedSort = 'Popular';
  int _selectedCategoryIndex = 0;
  bool _lowerPricesFilterActive = false;
  String _dietaryFilter = 'All';

  Future<void> _fetchRestaurants({Map<String, String>? filters}) async {
    final currentFetchId = ++_fetchCounter;
    final locProvider = context.read<LocationProvider>();
    final reqLat = locProvider.lat;
    final reqLng = locProvider.lng;

    if (mounted) {
      setState(() {
        _appliedFiltersMap = filters;
        if (filters == null) {
          _selectedCategoryIndex = 0;
        }
        _restaurants = [];
        _isLoadingRestaurants = true;
      });
    }

    try {
      final reqAddress = locProvider.location;
      final restaurants = await RestaurantApiService.getRestaurants(
        filters: filters,
        lat: reqLat,
        lng: reqLng,
        city: reqAddress,
        address: reqAddress,
      );

      if (currentFetchId == _fetchCounter && mounted) {
        setState(() {
          _restaurants = restaurants;
          _isLoadingRestaurants = false;
        });

        debugPrint('RESTAURANT_PARSE_LOG\nbackend count = ${restaurants.length}\nparsed count = ${restaurants.length}\nstate count = ${_restaurants.length}\nUI count = ${_displayRestaurants.length}');
      }
    } catch (e) {
      if (currentFetchId == _fetchCounter && mounted) {
        setState(() {
          _restaurants = [];
          _isLoadingRestaurants = false;
        });
      }
    }
  }

  List<Category> get _categoriesWithAll {
    final allCategory = Category(
      id: 'cat_all',
      title: 'All',
      image: 'assets/static/c5.png',
    );
    if (_categories.isEmpty) return [allCategory];
    if (_categories.first.title.toLowerCase() == 'all') return _categories;
    return [allCategory, ..._categories];
  }

  List<String> _getCategoryKeywords(String cat) {
    final c = cat.toLowerCase().trim();
    if (c == 'momos' || c == 'momo') return ['momo', 'momos'];
    if (c == 'burger' || c == 'burgers') return ['burger', 'burgers'];
    if (c == 'pizza' || c == 'pizzas') return ['pizza', 'pizzas'];
    if (c == 'biryani' || c == 'biriyani') return ['biryani', 'biriyani', 'pulao', 'dum biryani'];
    if (c == 'sandwich' || c == 'sandwiches') return ['sandwich', 'sandwiches'];
    if (c == 'chinese' || c == 'asian') return ['chinese', 'noodle', 'noodles', 'manchurian', 'chowmein', 'fried rice', 'chilli'];
    if (c == 'cake' || c == 'cakes' || c == 'dessert' || c == 'desserts' || c == 'sweet' || c == 'sweets') return ['cake', 'pastry', 'dessert', 'brownie', 'ice cream', 'gulab jamun', 'halwa', 'pastries'];
    if (c.contains('north indian')) return ['north indian', 'thali', 'dal makhani', 'paneer butter', 'chur chur naan', 'naan', 'roti', 'paratha', 'chole'];
    if (c.contains('main course') || c == 'main') return ['main course', 'thali', 'curry', 'gravy', 'paneer lababdar', 'butter chicken'];
    if (c.contains('beverage') || c.contains('drink') || c.contains('coffee')) return ['beverage', 'beverages', 'shake', 'juice', 'coffee', 'tea', 'cold drink', 'soda', 'drink', 'drinks', 'smoothie', 'lassi'];
    
    final stem = c.replaceAll(RegExp(r's$'), '');
    final set = <String>{c};
    if (stem.length >= 3) set.add(stem);
    return set.toList();
  }

  bool _dishMatchesCategory(MenuItem m, List<String> keywords) {
    final mCat = m.category.toLowerCase();
    final mSub = m.subcategory.toLowerCase();
    final mName = m.name.toLowerCase();

    for (final k in keywords) {
      final kLow = k.toLowerCase();
      // 1. Direct dish category or subcategory match
      if (mCat.contains(kLow) || mSub.contains(kLow)) return true;

      // 2. Dish name check with word boundary for short keywords (e.g. 'tea')
      if (kLow.length <= 3) {
        final regex = RegExp('(^|[\\s/,.-])' + RegExp.escape(kLow) + '(\$|[\\s/,.-])', caseSensitive: false);
        if (regex.hasMatch(mName)) return true;
      } else {
        if (mName.contains(kLow)) return true;
      }
    }
    return false;
  }

  List<Restaurant> get _displayRestaurants {
    List<Restaurant> list = List.from(_restaurants);

    // 1. In-place Category Filter (Strict matching on dishes and cuisine)
    final cats = _categoriesWithAll;
    if (_selectedCategoryIndex > 0 && _selectedCategoryIndex < cats.length) {
      final selectedCat = cats[_selectedCategoryIndex];
      final selectedCatTitle = selectedCat.title.toLowerCase().trim();
      final keywords = _getCategoryKeywords(selectedCatTitle);

      final List<Restaurant> filtered = [];

      for (final r in list) {
        // Find matching dishes and non-matching dishes
        final matchingDishes = <MenuItem>[];
        final otherDishes = <MenuItem>[];

        for (final m in r.menu) {
          if (_dishMatchesCategory(m, keywords)) {
            matchingDishes.add(m);
          } else {
            otherDishes.add(m);
          }
        }

        // Direct match on restaurant cuisine/name
        final cuisineLower = r.cuisine.toLowerCase();
        final nameLower = r.name.toLowerCase();
        final cuisineMatches = keywords.any((k) {
          final kLow = k.toLowerCase();
          return cuisineLower == kLow || (kLow.length > 3 && (cuisineLower.contains(kLow) || nameLower.contains(kLow)));
        });

        if (matchingDishes.isNotEmpty || cuisineMatches) {
          // Reorder menu items so matching dishes appear at the front of the restaurant preview card
          final reorderedMenu = [...matchingDishes, ...otherDishes];
          filtered.add(r.copyWith(menu: reorderedMenu));
        }
      }

      list = filtered;
    }

    // 2. Active Preference Filter
    if (widget.selectedPreferences.isNotEmpty) {
      final lowerPrefs = widget.selectedPreferences.map((p) => p.toLowerCase()).toSet();
      final matched = list.where((r) {
        final c = r.cuisine.toLowerCase();
        final name = r.name.toLowerCase();
        return lowerPrefs.any((pref) => c.contains(pref) || pref.contains(c) || name.contains(pref));
      }).toList();
      if (matched.isNotEmpty) list = matched;
    }

    // 3. Lower Prices Filter Chip (40-60% Lower Prices)
    if (_lowerPricesFilterActive) {
      list = list.where((r) => r.deliveryCharge == 0 || r.rating >= 4.4 || r.menu.any((m) => (m.comparisonTag != null))).toList();
    }

    // 4. Dietary Filter Chip (Veg / Non-Veg)
    String effectiveDietary = _dietaryFilter;
    if (_appliedFiltersMap != null && _appliedFiltersMap!.containsKey('dietary')) {
      effectiveDietary = _appliedFiltersMap!['dietary']!;
    }
    if (effectiveDietary == 'Veg') {
      list = list.where((r) => r.cuisine.toLowerCase().contains('veg') || r.menu.any((m) => m.isVeg)).toList();
    } else if (effectiveDietary == 'Non-Veg') {
      list = list.where((r) => r.menu.any((m) => !m.isVeg)).toList();
    }

    // 5. Applied Bottom Sheet Filters (minRating, maxDistance, status, minPrice, maxPrice)
    if (_appliedFiltersMap != null) {
      final f = _appliedFiltersMap!;

      // Rating filter
      if (f.containsKey('minRating')) {
        final minR = double.tryParse(f['minRating']!) ?? 0;
        list = list.where((r) => r.rating >= minR).toList();
      }

      // Distance filter
      if (f.containsKey('maxDistance')) {
        final maxD = double.tryParse(f['maxDistance']!) ?? 999;
        list = list.where((r) => r.distanceKm <= maxD).toList();
      }

      // Status filter (Open Now / Closed)
      if (f.containsKey('status')) {
        if (f['status'] == 'Open Now') {
          list = list.where((r) => r.isOnline).toList();
        } else if (f['status'] == 'Closed') {
          list = list.where((r) => !r.isOnline).toList();
        }
      }

      // Price filter
      if (f.containsKey('minPrice') || f.containsKey('maxPrice')) {
        final minP = double.tryParse(f['minPrice'] ?? '0') ?? 0;
        final maxP = double.tryParse(f['maxPrice'] ?? '999999') ?? 999999;
        list = list.where((r) => r.menu.any((m) => m.price >= minP && m.price <= maxP)).toList();
      }
    }

    // 6. Sorting
    if (_selectedSort == 'Rating: High to Low') {
      list.sort((a, b) => b.rating.compareTo(a.rating));
    } else if (_selectedSort == 'Delivery Time') {
      list.sort((a, b) => a.deliveryTimeMin.compareTo(b.deliveryTimeMin));
    } else if (_selectedSort == 'Popular') {
      list.sort((a, b) => b.rating.compareTo(a.rating));
    }

    return list;
  }

  void _showSortOptionsSheet(BuildContext context, bool isDark) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade400,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Sort Restaurants By',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
              const SizedBox(height: 16),
              ...[
                {'title': 'Popular', 'subtitle': 'Most ordered & highest rated'},
                {'title': 'Rating: High to Low', 'subtitle': 'Top rated restaurants first'},
                {'title': 'Delivery Time', 'subtitle': 'Fastest delivery first'},
              ].map((opt) {
                final isSelected = _selectedSort == opt['title'];
                return InkWell(
                  onTap: () {
                    setState(() {
                      _selectedSort = opt['title']!;
                    });
                    Navigator.pop(context);
                  },
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? const Color(0xFFE89D1E).withValues(alpha: 0.12)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected ? const Color(0xFFE89D1E) : Colors.grey.shade300,
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                opt['title']!,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: isSelected
                                      ? const Color(0xFFE89D1E)
                                      : (isDark ? Colors.white : Colors.black87),
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                opt['subtitle']!,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: isDark ? Colors.white60 : Colors.grey.shade600,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (isSelected)
                          const Icon(Icons.check_circle_rounded, color: Color(0xFFE89D1E), size: 20),
                      ],
                    ),
                  ),
                );
              }),
              const SizedBox(height: 10),
            ],
          ),
        );
      },
    );
  }

  Widget _buildServiceUnavailableCard(BuildContext context, bool isDark) {
    final locProvider = context.watch<LocationProvider>();
    final currentLocationName = locProvider.location;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: const Color(0xFFEF4444).withValues(alpha: 0.3),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: Color(0xFFFEF2F2),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.location_off_rounded,
              color: Color(0xFFEF4444),
              size: 36,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            'Service Currently Unavailable',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: isDark ? Colors.white : Colors.black87,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            'We are not delivering to $currentLocationName at the moment. Please select another delivery address or check back later!',
            style: TextStyle(
              fontSize: 12,
              color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
              height: 1.4,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () {
              context.read<LocationProvider>().refreshLocation();
              _refreshData();
            },
            icon: const Icon(Icons.my_location_rounded, size: 18, color: Colors.white),
            label: const Text(
              'Use Live GPS Location',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF248C70),
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }

  int _activeTopTab = 0;


  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    final locProvider = context.watch<LocationProvider>();

    if (!locProvider.isServiceable) {
      return const UnserviceableLocationPage();
    }

    return Scaffold(
      backgroundColor: isDark ? Colors.black : const Color(0xFFF5FAF8),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: _refreshData,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // ── 1. Top Section: Unified Green Header + Banners ──
            SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    decoration: BoxDecoration(
                      color: isDark ? Colors.black : const Color(0xFF248C70),
                      borderRadius: const BorderRadius.only(
                        bottomLeft: Radius.circular(28.0),
                        bottomRight: Radius.circular(28.0),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: isDark ? Colors.transparent : const Color(0xFF248C70).withValues(alpha: 0.25),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const CustomAppBar(showBottomRadius: false),
                        const SizedBox(height: 4),
                        _AnimatedDeliveryPickupToggle(
                          isDelivery: context.watch<CartProvider>().orderType != 'pickup',
                          onChanged: (isDeliv) {
                            setState(() {
                              _activeTopTab = isDeliv ? 0 : 2;
                            });
                            context.read<CartProvider>().setOrderType(isDeliv ? 'delivery' : 'pickup');
                          },
                        ),
                        const SizedBox(height: 6),
                        if (widget.selectedPreferences.isNotEmpty) ...[
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.18),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.tune_rounded, color: Colors.white, size: 18),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Filtered by: ${widget.selectedPreferences.join(', ')}',
                                      style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  if (widget.onClearPreferences != null)
                                    GestureDetector(
                                      onTap: widget.onClearPreferences,
                                      child: const Icon(Icons.close_rounded, color: Colors.white, size: 18),
                                    ),
                                ],
                              ),
                            ),
                          ),
                        ],
                        if (_isSectionActive('banners_carousel')) ...[
                          _isLoadingBanners 
                              ? const Padding(
                                  padding: EdgeInsets.symmetric(vertical: 24),
                                  child: Center(child: CircularProgressIndicator(color: Colors.white)),
                                )
                              : _banners.isEmpty
                                  ? const SizedBox(height: 12)
                                  : Padding(
                                      padding: const EdgeInsets.only(bottom: 16.0),
                                      child: CarouselSlider.builder(
                                        itemCount: _banners.length,
                                        itemBuilder: (context, index, realIndex) {
                                          return Container(
                                            margin: const EdgeInsets.symmetric(horizontal: 4.0, vertical: 4.0),
                                            decoration: BoxDecoration(
                                              image: DecorationImage(
                                                image: safeImageProvider(_banners[index].imageUrl),
                                                fit: BoxFit.cover,
                                              ),
                                              borderRadius: BorderRadius.circular(18),
                                              boxShadow: [
                                                BoxShadow(
                                                  color: Colors.black.withValues(alpha: 0.25),
                                                  blurRadius: 6,
                                                  offset: const Offset(0, 3),
                                                ),
                                              ],
                                            ),
                                          );
                                        },
                                        options: CarouselOptions(
                                          height: 180,
                                          viewportFraction: 0.93,
                                          autoPlay: true,
                                        ),
                                      ),
                                    ),
                        ] else ...[
                          const SizedBox(height: 12),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 6),
                ],
              ),
            ),

            // ── 2. Sticky Category Header Section ("Swipe krne par categorise upar reh jaye") ──
            if (_isSectionActive('food_categories'))
              SliverPersistentHeader(
                pinned: true,
                delegate: _SliverCategoryHeaderDelegate(
                height: 142.0,
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E3A32) : AppColors.primary,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.25),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Padding(
                        padding: const EdgeInsets.fromLTRB(18, 12, 18, 6),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              _getSectionTitle('food_categories', "What's on your mind?"),
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                                letterSpacing: 0.2,
                              ),
                            ),
                            GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => const FoodPreferencesPage(showBackButton: true),
                                  ),
                                );
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Text(
                                  'Tap to Switch',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      SizedBox(
                        height: 92,
                        child: _isLoadingCategories
                            ? const Center(child: CircularProgressIndicator(color: Colors.white))
                            : ListView.builder(
                                scrollDirection: Axis.horizontal,
                                padding: const EdgeInsets.symmetric(horizontal: 8),
                                itemCount: _categoriesWithAll.length,
                                itemBuilder: (context, index) {
                                  Category category = _categoriesWithAll[index];
                                  final isSelected = index == _selectedCategoryIndex;
                                  final tabBgColor = isDark
                                      ? const Color(0xFF121212)
                                      : const Color(0xFFF5FAF8);
                                  final isAll = category.title.toLowerCase() == 'all';

                                  final itemWidget = Padding(
                                    padding: EdgeInsets.fromLTRB(
                                      isSelected ? 14 : 8,
                                      isSelected ? 8 : 10,
                                      isSelected ? 14 : 8,
                                      isSelected ? 4 : 6,
                                    ),
                                    child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Stack(
                                          clipBehavior: Clip.none,
                                          alignment: Alignment.center,
                                          children: [
                                            Container(
                                              width: 46,
                                              height: 46,
                                              padding: const EdgeInsets.all(2.5),
                                              decoration: BoxDecoration(
                                                color: isSelected
                                                    ? const Color(0xFFFFE8A3)
                                                    : Colors.white,
                                                shape: BoxShape.circle,
                                                boxShadow: [
                                                  BoxShadow(
                                                    color: Colors.black.withValues(alpha: 0.1),
                                                    blurRadius: 6,
                                                    offset: const Offset(0, 2),
                                                  ),
                                                ],
                                              ),
                                              child: ClipOval(
                                                child: isAll
                                                    ? Container(
                                                        color: AppColors.primary,
                                                        child: const Icon(
                                                          Icons.restaurant_menu_rounded,
                                                          color: Colors.white,
                                                          size: 26,
                                                        ),
                                                      )
                                                    : SafeImage(
                                                        category.image,
                                                        fit: BoxFit.cover,
                                                      ),
                                              ),
                                            ),
                                            if (!isAll)
                                              Positioned(
                                                top: -6,
                                                child: Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                                  decoration: BoxDecoration(
                                                    color: AppColors.primary,
                                                    borderRadius: BorderRadius.circular(8),
                                                    border: Border.all(color: Colors.white, width: 1),
                                                  ),
                                                  child: Text(
                                                    _getCategoryPriceTag(category),
                                                    style: const TextStyle(
                                                      color: Colors.white,
                                                      fontSize: 8,
                                                      fontWeight: FontWeight.w900,
                                                    ),
                                                  ),
                                                ),
                                              ),
                                          ],
                                        ),
                                        const SizedBox(height: 5),
                                        Text(
                                          category.title,
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                            color: isSelected
                                                ? (isDark ? Colors.white : AppColors.primary)
                                                : Colors.white,
                                          ),
                                        ),
                                      ],
                                    ),
                                  );

                                  return GestureDetector(
                                    behavior: HitTestBehavior.opaque,
                                    onTap: () {
                                      setState(() {
                                        _selectedCategoryIndex = index;
                                      });
                                    },
                                    child: isSelected
                                        ? CustomPaint(
                                            painter: ArchTabShape(color: tabBgColor),
                                            child: itemWidget,
                                          )
                                        : Container(
                                            margin: const EdgeInsets.symmetric(horizontal: 2),
                                            child: itemWidget,
                                          ),
                                  );
                                },
                              ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // ── 3. Remaining Page Content: Filters, Recommended, Comparison Banner, Explore Restaurants ──
            SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Sort By & Filter Sub-Header Bar
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        InkWell(
                          onTap: () => _showSortOptionsSheet(context, isDark),
                          borderRadius: BorderRadius.circular(8),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                            child: Row(
                              children: [
                                Text(
                                  'Sort By ',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: isDark ? Colors.grey.shade400 : const Color(0xFF6B7280),
                                  ),
                                ),
                                Text(
                                  _selectedSort,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFFE89D1E),
                                  ),
                                ),
                                const Icon(
                                  Icons.keyboard_arrow_down_rounded,
                                  size: 18,
                                  color: Color(0xFFE89D1E),
                                ),
                              ],
                            ),
                          ),
                        ),
                        InkWell(
                          onTap: () async {
                            final filters = await showModalBottomSheet<Map<String, String>>(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (context) => SizedBox(
                                height: MediaQuery.of(context).size.height * 0.7,
                                child: const FiltersBottomSheet(),
                              ),
                            );

                            if (filters != null) {
                              _fetchRestaurants(filters: filters);
                            }
                          },
                          borderRadius: BorderRadius.circular(20),
                          child: Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: const Color(0xFFE89D1E),
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFFE89D1E).withValues(alpha: 0.35),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.tune_rounded,
                              size: 18,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Recommended For You
                  if (_isSectionActive('recommended_dishes')) ...[
                    Padding(
                      padding: const EdgeInsets.only(
                          left: 16, top: 12, right: 16, bottom: 10),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            _getSectionTitle('recommended_dishes', 'Recommended For You'),
                            style: isDark
                                ? const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                    height: 1.4,
                                  )
                                : const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.black87,
                                    height: 1.4,
                                  ),
                          ),
                          GestureDetector(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => const RecommendedRestaurantsPage(),
                                ),
                              );
                            },
                            child: const Text(
                              'View All',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFFE89D1E),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    _isLoadingRestaurants
                        ? const SizedBox(
                            height: 240,
                            child: Center(
                              child: CircularProgressIndicator(color: AppColors.primary),
                            ),
                          )
                        : _restaurants.isEmpty
                            ? const SizedBox.shrink()
                            : AnimatedSwitcher(
                                duration: const Duration(milliseconds: 600),
                                switchInCurve: Curves.easeOutCubic,
                                switchOutCurve: Curves.easeInCubic,
                                transitionBuilder: (child, animation) {
                                  return FadeTransition(
                                    opacity: animation,
                                    child: SlideTransition(
                                      position: Tween<Offset>(
                                        begin: const Offset(0.04, 0.0),
                                        end: Offset.zero,
                                      ).animate(animation),
                                      child: child,
                                    ),
                                  );
                                },
                                child: SizedBox(
                                  key: ValueKey('recommended_shuffle_$_shuffleSeed'),
                                  height: 240,
                                  child: ListView.builder(
                                    scrollDirection: Axis.horizontal,
                                    padding: const EdgeInsets.symmetric(horizontal: 16),
                                    itemCount: _restaurants.length > 6 ? 6 : _restaurants.length,
                                    itemBuilder: (context, index) {
                                      return _RecommendedRestaurantCard(
                                        restaurant: _restaurants[index],
                                      );
                                    },
                                  ),
                                ),
                              ),
                  ],

                  // Favourites Section
                  if (_isSectionActive('favourites_section'))
                    const _FavouritesSection(),

                  // Recent Orders Section
                  if (_isSectionActive('recent_orders_section'))
                    const _RecentOrdersSection(),

                  // ── ECDkart vs OTHER APPS Section ──
                  if (_isSectionActive('ecdkart_comparison'))
                    _EcdkartComparisonSection(
                      restaurants: _displayRestaurants,
                      isDark: isDark,
                    ),

                  // ── Explore Section Top Filter Bar (Matching Screenshots 1 & 2) ──
                  if (_isSectionActive('explore_restaurants')) ...[
                    Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Horizontal Swipable Filter Chips Bar
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: [
                              // 1. Round Filter Button
                              GestureDetector(
                                onTap: () async {
                                  final filters = await showModalBottomSheet<Map<String, String>>(
                                    context: context,
                                    isScrollControlled: true,
                                    backgroundColor: Colors.transparent,
                                    builder: (context) => SizedBox(
                                      height: MediaQuery.of(context).size.height * 0.7,
                                      child: const FiltersBottomSheet(),
                                    ),
                                  );
                                  if (filters != null) {
                                    _fetchRestaurants(filters: filters);
                                  }
                                },
                                child: Container(
                                  width: 36,
                                  height: 36,
                                  decoration: BoxDecoration(
                                    color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: isDark ? Colors.grey.shade700 : Colors.grey.shade300,
                                      width: 1,
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.05),
                                        blurRadius: 4,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: Icon(
                                    Icons.tune_rounded,
                                    size: 18,
                                    color: isDark ? Colors.white : const Color(0xFF374151),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),

                              // 2. 40-60% Lower Prices Filter Chip
                              GestureDetector(
                                onTap: () {
                                  setState(() {
                                    _lowerPricesFilterActive = !_lowerPricesFilterActive;
                                  });
                                },
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: _lowerPricesFilterActive
                                        ? (isDark ? const Color(0xFF1E3A32) : const Color(0xFFE8F5E9))
                                        : (isDark ? const Color(0xFF1E1E1E) : Colors.white),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                      color: _lowerPricesFilterActive
                                          ? AppColors.primary
                                          : (isDark ? Colors.grey.shade700 : Colors.grey.shade300),
                                      width: 1,
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.04),
                                        blurRadius: 4,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(
                                        Icons.discount_rounded,
                                        size: 16,
                                        color: AppColors.primary,
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        '40-60% Lower Prices',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700,
                                          color: _lowerPricesFilterActive
                                              ? AppColors.primary
                                              : (isDark ? Colors.white : const Color(0xFF374151)),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),

                              // 3. Veg / Non-Veg Dropdown Filter Chip
                              PopupMenuButton<String>(
                                initialValue: _dietaryFilter,
                                onSelected: (val) {
                                  setState(() {
                                    _dietaryFilter = val;
                                  });
                                },
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                itemBuilder: (context) => [
                                  const PopupMenuItem(value: 'All', child: Text('All Foods')),
                                  const PopupMenuItem(value: 'Veg', child: Text('Pure Veg Only')),
                                  const PopupMenuItem(value: 'Non-Veg', child: Text('Non-Veg Only')),
                                ],
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: _dietaryFilter != 'All'
                                        ? (isDark ? const Color(0xFF1E3A32) : const Color(0xFFE8F5E9))
                                        : (isDark ? const Color(0xFF1E1E1E) : Colors.white),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                      color: _dietaryFilter != 'All'
                                          ? AppColors.primary
                                          : (isDark ? Colors.grey.shade700 : Colors.grey.shade300),
                                      width: 1,
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.04),
                                        blurRadius: 4,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        _dietaryFilter == 'All' ? 'Veg / Non-Veg' : 'Dietary: $_dietaryFilter',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700,
                                          color: _dietaryFilter != 'All'
                                              ? AppColors.primary
                                              : (isDark ? Colors.white : const Color(0xFF374151)),
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      Icon(
                                        Icons.keyboard_arrow_down_rounded,
                                        size: 18,
                                        color: isDark ? Colors.white : const Color(0xFF374151),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),

                              // 4. Sort Button Chip
                              GestureDetector(
                                onTap: () => _showSortOptionsSheet(context, isDark),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                      color: isDark ? Colors.grey.shade700 : Colors.grey.shade300,
                                      width: 1,
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        'Sort: $_selectedSort',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700,
                                          color: isDark ? Colors.white : const Color(0xFF374151),
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      Icon(
                                        Icons.keyboard_arrow_down_rounded,
                                        size: 18,
                                        color: isDark ? Colors.white : const Color(0xFF374151),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Section Title & Subtitle (Dynamic based on selected category)
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _selectedCategoryIndex == 0
                                      ? 'Explore all restaurants'
                                      : '${_categoriesWithAll[_selectedCategoryIndex].title} Restaurants',
                                  style: TextStyle(
                                    fontSize: 19,
                                    fontWeight: FontWeight.w900,
                                    color: isDark ? Colors.white : const Color(0xFF1F2937),
                                    letterSpacing: -0.3,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  _selectedCategoryIndex == 0
                                      ? 'Featured Restaurants'
                                      : '${_displayRestaurants.length} top-rated restaurants nearby',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: isDark ? Colors.grey.shade400 : const Color(0xFF6B7280),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Redesigned Restaurant List Cards or Service Unavailable Card
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: _isLoadingRestaurants
                        ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                        : (!context.watch<LocationProvider>().isServiceable && _restaurants.isEmpty)
                            ? _buildServiceUnavailableCard(context, isDark)
                            : _displayRestaurants.isEmpty
                                ? Container(
                                    padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 16),
                                    alignment: Alignment.center,
                                    child: Column(
                                      children: [
                                        Icon(Icons.restaurant_rounded, size: 48, color: isDark ? Colors.grey.shade600 : Colors.grey.shade400),
                                        const SizedBox(height: 12),
                                        Text(
                                          'No restaurants found in this category',
                                          style: TextStyle(
                                            fontSize: 15,
                                            fontWeight: FontWeight.bold,
                                            color: isDark ? Colors.white : Colors.black87,
                                          ),
                                        ),
                                        const SizedBox(height: 10),
                                        ElevatedButton(
                                          onPressed: () {
                                            setState(() {
                                              _selectedCategoryIndex = 0;
                                            });
                                          },
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: AppColors.primary,
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                          ),
                                          child: const Text('View All Restaurants', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                        ),
                                      ],
                                    ),
                                  )
                                : ListView.builder(
                                    itemCount: _displayRestaurants.length,
                                    physics: const NeverScrollableScrollPhysics(),
                                    shrinkWrap: true,
                                    padding: EdgeInsets.zero,
                                    itemBuilder: (context, index) {
                                      final r = _displayRestaurants[index];
                                      return _RestaurantListCard(restaurant: r);
                                    },
                                  ),
                  ),
                ],

                const SizedBox(height: 16),
                  const RotatingThaliWidget(),
                  const SizedBox(height: 30),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getCategoryPriceTag(Category category) {
    final double sp = category.startingPrice;
    if (sp > 0) {
      return 'FROM ₹${sp.toInt()}';
    }
    final name = category.title.toLowerCase();
    if (name.contains('poha')) return 'FROM ₹14';
    if (name.contains('jalebi')) return 'FROM ₹17';
    if (name.contains('sandwich')) return 'FROM ₹56';
    if (name.contains('coffee')) return 'FROM ₹70';
    if (name.contains('thali')) return 'FROM ₹129';
    if (name.contains('dosa')) return 'FROM ₹89';
    if (name.contains('burger')) return 'FROM ₹49';
    if (name.contains('pizza')) return 'FROM ₹99';
    if (name.contains('cake') || name.contains('dessert')) return 'FROM ₹39';
    if (name.contains('biryani')) return 'FROM ₹119';
    return 'FROM ₹28';
  }

  Widget _buildTab(BuildContext context, String title, bool isActive, bool isDark, int index) {
    return Expanded(
      child: GestureDetector(
        onTap: () {
          if (index == 1) {
            CouponsBottomSheet.show(context);
          } else {
            setState(() {
              _activeTopTab = index;
            });
          }
        },
        child: Container(
          padding: const EdgeInsets.only(bottom: 8),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: isActive ? const Color(0xFFE89D1E) : Colors.transparent,
                width: 2,
              ),
            ),
          ),
          child: Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              fontWeight: isActive ? FontWeight.bold : FontWeight.w600,
              color: isDark ? Colors.white : (isActive ? Colors.black : Colors.grey.shade600),
            ),
          ),
        ),
      ),
    );
  }
}



class _RecommendedRestaurantCard extends StatelessWidget {
  final Restaurant restaurant;

  const _RecommendedRestaurantCard({required this.restaurant});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => RestaurantDetailScreen(restaurant: restaurant),
          ),
        );
      },
      child: Container(
        width: 160, // Fixed width for horizontal scroll
        margin: const EdgeInsets.only(right: 14, bottom: 4),
        decoration: BoxDecoration(
          color: isDark ? Colors.black : Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // â”€â”€ Restaurant image â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            Expanded(
              flex: 5,
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    SafeImage(
                      restaurant.imageUrl,
                      fit: BoxFit.cover,
                      loadingBuilder: (_, child, progress) => progress == null
                          ? child
                          : Container(
                              color: AppColors.primary.withValues(alpha: 0.08),
                              child: const Center(
                                child: CircularProgressIndicator(
                                    color: AppColors.primary, strokeWidth: 2),
                              ),
                            ),
                      errorBuilder: (_, __, ___) => Container(
                        color: AppColors.primary.withValues(alpha: 0.08),
                        child: const Icon(Icons.fastfood,
                            size: 40, color: AppColors.primary),
                      ),
                    ),
                    // Heart icon
                    Positioned(
                      top: 8,
                      right: 8,
                      child: GestureDetector(
                        onTap: () {
                          final wishlist = context.read<WishlistProvider>();
                          wishlist.toggleRestaurantFavorite(restaurant.id);
                          final isFav = wishlist.isRestaurantFavorite(restaurant.id);
                          ScaffoldMessenger.of(context).hideCurrentSnackBar();
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                isFav
                                    ? '❤️ Added ${restaurant.name} to Favourites!'
                                    : 'Removed ${restaurant.name} from Favourites',
                              ),
                              duration: const Duration(seconds: 1),
                              backgroundColor: isFav ? const Color(0xFF248C70) : Colors.grey.shade800,
                            ),
                          );
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.all(5),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.12),
                                blurRadius: 4,
                                offset: const Offset(0, 1),
                              ),
                            ],
                          ),
                          child: Icon(
                            context.watch<WishlistProvider>().isRestaurantFavorite(restaurant.id)
                                ? Icons.favorite_rounded
                                : Icons.favorite_border_rounded,
                            size: 15,
                            color: context.watch<WishlistProvider>().isRestaurantFavorite(restaurant.id)
                                ? const Color(0xFFEF4444)
                                : Colors.black54,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // â”€â”€ Info â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            Expanded(
              flex: 5,
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            restaurant.name,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: isDark ? Colors.white : Colors.black87,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Row(
                          children: [
                            const Icon(Icons.star, color: Colors.orange, size: 12),
                            const SizedBox(width: 2),
                            Text(
                              restaurant.rating.toStringAsFixed(1),
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: isDark ? Colors.white70 : Colors.black87,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      restaurant.cuisine,
                      style: TextStyle(
                        fontSize: 9,
                        color: Colors.grey.shade600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '1.2 km away  |  20-30 minutes',
                      style: TextStyle(
                        fontSize: 9,
                        color: Colors.grey.shade600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFDF4F4),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'Best Seller: Cheese Burst Pizza',
                        style: TextStyle(
                          fontSize: 8,
                          color: Colors.black87,
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
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
}

// ─────────────────────────────────────────────
// Premium ECDkart vs OTHER APPS Section (Matching Screenshot 2)
// ─────────────────────────────────────────────
class _EcdkartComparisonSection extends StatelessWidget {
  final List<Restaurant> restaurants;
  final bool isDark;

  const _EcdkartComparisonSection({
    required this.restaurants,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    if (restaurants.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.fromLTRB(14, 16, 14, 12),
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isDark
              ? [const Color(0xFF1B382F), const Color(0xFF122820)]
              : [const Color(0xFFE8F5E9), const Color(0xFFF4FBF7)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: isDark ? 0.4 : 0.25),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: isDark ? 0.3 : 0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header Section (Double Heart Logo + Brand Title) ──
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(5),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Icon(Icons.favorite_rounded, color: AppColors.primary, size: 14),
                          Icon(Icons.favorite_rounded, color: AppColors.primary, size: 14),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'ECDKART',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w900,
                        color: AppColors.primary,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'vs OTHER APPS',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.grey.shade300 : const Color(0xFF0F8A5F),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                const Text(
                  '40-60% LOWER PRICES',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: AppColors.primary,
                    letterSpacing: -0.2,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),

          // ── Horizontal Swipable Cards (Matching Screenshot 2 layout) ──
          SizedBox(
            height: 222,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              itemCount: restaurants.length > 8 ? 8 : restaurants.length,
              itemBuilder: (context, index) {
                final restaurant = restaurants[index];
                final startingPrice = index % 2 == 0 ? 29 : (index % 3 == 0 ? 49 : 59);
                final lowerPercent = 40 + (index * 5) % 25; // 40%, 45%, 50%, 55%, 60%

                return GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => RestaurantDetailScreen(restaurant: restaurant),
                      ),
                    );
                  },
                  child: Container(
                    width: 140,
                    margin: const EdgeInsets.only(right: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Food/Dish Image with Dark Bottom Gradient
                        Stack(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(16),
                              child: SafeImage(
                                restaurant.imageUrl,
                                width: 140,
                                height: 125,
                                fit: BoxFit.cover,
                              ),
                            ),
                            // Dark Gradient Bottom Overlay
                            Positioned(
                              bottom: 0,
                              left: 0,
                              right: 0,
                              child: Container(
                                padding: const EdgeInsets.fromLTRB(8, 14, 8, 6),
                                decoration: BoxDecoration(
                                  borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
                                  gradient: LinearGradient(
                                    colors: [
                                      Colors.transparent,
                                      Colors.black.withValues(alpha: 0.85),
                                    ],
                                    begin: Alignment.topCenter,
                                    end: Alignment.bottomCenter,
                                  ),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Text(
                                          'ITEMS',
                                          style: TextStyle(
                                            fontSize: 9,
                                            fontWeight: FontWeight.w800,
                                            color: Colors.white70,
                                            letterSpacing: 0.5,
                                            height: 1.0,
                                          ),
                                        ),
                                        Text(
                                          'AT ₹$startingPrice',
                                          style: const TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w900,
                                            color: Colors.white,
                                            height: 1.1,
                                          ),
                                        ),
                                      ],
                                    ),
                                    if (index % 3 == 0)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withValues(alpha: 0.2),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: const Text(
                                          'AD',
                                          style: TextStyle(
                                            fontSize: 8,
                                            fontWeight: FontWeight.w700,
                                            color: Colors.white70,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 6),

                        // Restaurant Title
                        Text(
                          restaurant.name,
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : const Color(0xFF1F2937),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),

                        const SizedBox(height: 2),

                        // Rating & Delivery Time Row
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(1.5),
                              decoration: const BoxDecoration(
                                color: Color(0xFF0F8A5F),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.star_rounded, color: Colors.white, size: 10),
                            ),
                            const SizedBox(width: 3),
                            Text(
                              '${restaurant.rating.toStringAsFixed(1)} • ${restaurant.deliveryTimeMin}-${restaurant.deliveryTimeMin + 5} mins',
                              style: TextStyle(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w600,
                                color: isDark ? Colors.grey.shade400 : const Color(0xFF4B5563),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 2),

                        // Cuisine Subtitle
                        Text(
                          restaurant.cuisine,
                          style: TextStyle(
                            fontSize: 10,
                            color: isDark ? Colors.grey.shade500 : Colors.grey.shade600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),

                        const SizedBox(height: 3),

                        // Comparison Tag with Icon
                        Row(
                          children: [
                            const Icon(Icons.favorite_rounded, size: 11, color: AppColors.primary),
                            const SizedBox(width: 3),
                            Expanded(
                              child: Text(
                                'Our app: $lowerPercent% lower',
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.primary,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
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
}

// ─────────────────────────────────────────────
// Redesigned Restaurant List Card (Brand Theme Color & Thin Border)
// ─────────────────────────────────────────────
class _RestaurantListCard extends StatelessWidget {
  final Restaurant restaurant;
  const _RestaurantListCard({required this.restaurant});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    final isFree = restaurant.deliveryCharge == 0;

    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => RestaurantDetailScreen(restaurant: restaurant),
        ),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 18),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: AppColors.primary.withValues(alpha: isDark ? 0.4 : 0.25),
            width: 1.0, // Very thin patli brand theme border
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.05),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Top Header Section with Offer Banner & Stamp Badge ──
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Brand Discount Header
                        const Text(
                          '20% LOWER PRICES',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            color: AppColors.primary,
                            letterSpacing: 0.3,
                          ),
                        ),
                        const SizedBox(height: 3),
                        // Restaurant Name
                        Text(
                          restaurant.name,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: isDark ? Colors.white : const Color(0xFF1F2937),
                            letterSpacing: -0.2,
                          ),
                        ),
                        const SizedBox(height: 4),
                        // Rating & Info Row
                        Row(
                          children: [
                            // Green Star Rating Pill
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFF0F8A5F),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.star_rounded, color: Colors.white, size: 13),
                                  const SizedBox(width: 2),
                                  Text(
                                    restaurant.rating.toStringAsFixed(1),
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w800,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                '•  ${restaurant.deliveryTimeMin}-${restaurant.deliveryTimeMin + 5} mins  •  ${restaurant.cuisine}',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: isDark ? Colors.grey.shade400 : const Color(0xFF6B7280),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        // Offer Tag
                        Row(
                          children: [
                            const Icon(Icons.local_offer_rounded, size: 14, color: Color(0xFF0F8A5F)),
                            const SizedBox(width: 4),
                            Text(
                              isFree ? 'Items At ₹49  •  Free Delivery' : 'Items At ₹49  •  ₹${restaurant.deliveryCharge.toInt()} Delivery',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF0F8A5F),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  // "EVERYDAY LOWEST PRICE" Stamp Badge (Brand Theme Colors)
                  Transform.rotate(
                    angle: -0.1,
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E3A32) : const Color(0xFFE8F5E9),
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.primary.withValues(alpha: 0.5), width: 1.2),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.15),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Text(
                            'EVERYDAY',
                            style: TextStyle(
                              fontSize: 6.5,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF1B5E20),
                              letterSpacing: 0.4,
                            ),
                          ),
                          Text(
                            'LOWEST PRICE',
                            style: TextStyle(
                              fontSize: 7.5,
                              fontWeight: FontWeight.w900,
                              color: AppColors.primary,
                              height: 1.1,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          Text(
                            'EVERYDAY',
                            style: TextStyle(
                              fontSize: 6,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF1B5E20),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 10),

            // ── Horizontal Swipable Dishes Row ──
            if (restaurant.menu.isNotEmpty)
              SizedBox(
                height: 190,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  itemCount: restaurant.menu.length,
                  itemBuilder: (context, index) {
                    final item = restaurant.menu[index];
                    return _RestaurantDishItemTile(
                      item: item,
                      restaurant: restaurant,
                      isDark: isDark,
                    );
                  },
                ),
              ),

            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// Dish Item Tile inside Restaurant Box Card
// ─────────────────────────────────────────────
class _RestaurantDishItemTile extends StatelessWidget {
  final MenuItem item;
  final Restaurant restaurant;
  final bool isDark;

  const _RestaurantDishItemTile({
    required this.item,
    required this.restaurant,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 130,
      margin: const EdgeInsets.only(right: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Dish Image with (+) Add Button
          Stack(
            clipBehavior: Clip.none,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: SafeImage(
                  item.imageUrl,
                  height: 105,
                  width: 130,
                  fit: BoxFit.cover,
                ),
              ),
              // Floating (+) Add to Cart Button (Bottom Right of Image)
              Positioned(
                bottom: 6,
                right: 6,
                child: GestureDetector(
                  onTap: () {
                    final cart = context.read<CartProvider>();
                    cart.addItem(
                      item.toProduct(),
                      restaurantId: restaurant.id,
                      restaurantName: restaurant.name,
                      restaurantImageUrl: restaurant.imageUrl,
                      imageUrl: item.imageUrl,
                    );
                    ScaffoldMessenger.of(context).hideCurrentSnackBar();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Row(
                          children: [
                            const Icon(Icons.shopping_bag_rounded, color: Colors.white, size: 18),
                            const SizedBox(width: 8),
                            Expanded(child: Text('Added ${item.name} to cart!')),
                          ],
                        ),
                        backgroundColor: AppColors.primary,
                        duration: const Duration(seconds: 1),
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    );
                  },
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.25),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.add_rounded,
                      color: AppColors.primary,
                      size: 24,
                    ),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 6),

          // Veg / Non-Veg Dot + Dish Name
          Row(
            children: [
              Container(
                width: 12,
                height: 12,
                padding: const EdgeInsets.all(1.5),
                decoration: BoxDecoration(
                  border: Border.all(
                    color: item.isVeg ? const Color(0xFF0F8A5F) : const Color(0xFFE53935),
                    width: 1.2,
                  ),
                  borderRadius: BorderRadius.circular(2),
                ),
                child: Container(
                  decoration: BoxDecoration(
                    color: item.isVeg ? const Color(0xFF0F8A5F) : const Color(0xFFE53935),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  item.name,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : const Color(0xFF1F2937),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),

          const SizedBox(height: 2),

          // Price Row (Offer Price + Strikethrough Original Price)
          Row(
            children: [
              Text(
                '₹${item.price.toInt()}',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : const Color(0xFF111827),
                ),
              ),
              const SizedBox(width: 5),
              Text(
                '₹${item.effectiveOriginalPrice.toInt()}',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey.shade500,
                  decoration: TextDecoration.lineThrough,
                ),
              ),
            ],
          ),

          // Comparison Tag (Brand Theme Color)
          Text(
            'Our app: ${item.comparisonTag ?? "40% lower"}',
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              color: AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }
}

class ArchTabShape extends CustomPainter {
  final Color color;
  ArchTabShape({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final path = Path();
    final w = size.width;
    final h = size.height;
    final topR = 26.0;
    final botR = 12.0;

    path.moveTo(0, h);

    path.cubicTo(
      botR * 0.4, h,
      botR, h - botR * 0.4,
      botR, h - botR,
    );

    path.lineTo(botR, topR);

    path.quadraticBezierTo(botR, 0, botR + topR, 0);

    path.lineTo(w - botR - topR, 0);

    path.quadraticBezierTo(w - botR, 0, w - botR, topR);

    path.lineTo(w - botR, h - botR);

    path.cubicTo(
      w - botR, h - botR * 0.4,
      w - botR * 0.4, h,
      w, h,
    );

    path.lineTo(0, h);
    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant ArchTabShape oldDelegate) =>
      oldDelegate.color != color;
}

// ── 3. Smooth Animated Delivery / Self Pickup Toggle Switch ──────────────────
class _AnimatedDeliveryPickupToggle extends StatelessWidget {
  final bool isDelivery;
  final ValueChanged<bool> onChanged;

  const _AnimatedDeliveryPickupToggle({
    required this.isDelivery,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      height: 48,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE89D1E).withValues(alpha: 0.3)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.12),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Stack(
        children: [
          AnimatedAlign(
            duration: const Duration(milliseconds: 280),
            curve: Curves.easeOutBack,
            alignment: isDelivery ? Alignment.centerLeft : Alignment.centerRight,
            child: Container(
              width: (MediaQuery.of(context).size.width - 34) / 2,
              height: 48,
              decoration: BoxDecoration(
                color: const Color(0xFFE89D1E), // Yellow Accent Color from Screenshot 2
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFE89D1E).withValues(alpha: 0.4),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
            ),
          ),
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => onChanged(true),
                  behavior: HitTestBehavior.opaque,
                  child: Center(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.delivery_dining_rounded,
                          size: 20,
                          color: isDelivery ? Colors.white : const Color(0xFF248C70),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Delivery',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: isDelivery ? Colors.white : (isDark ? Colors.white70 : const Color(0xFF248C70)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              Expanded(
                child: GestureDetector(
                  onTap: () => onChanged(false),
                  behavior: HitTestBehavior.opaque,
                  child: Center(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.storefront_rounded,
                          size: 20,
                          color: !isDelivery ? Colors.white : const Color(0xFF248C70),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Self Pickup',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: !isDelivery ? Colors.white : (isDark ? Colors.white70 : const Color(0xFF248C70)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── 9. Favourites Section Widget ──────────────────────────────────────────────
class _FavouritesSection extends StatelessWidget {
  const _FavouritesSection();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final wishlist = context.watch<WishlistProvider>();
    final favIds = wishlist.favoriteRestaurantIds;

    if (favIds.isEmpty) {
      return const SizedBox.shrink(); // Hide section cleanly if user has no favourites yet
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.favorite_rounded, color: Colors.red, size: 20),
                  const SizedBox(width: 6),
                  Text(
                    'Your Favourites',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                  ),
                ],
              ),
              InkWell(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const WishlistTab()),
                  );
                },
                borderRadius: BorderRadius.circular(8),
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                  child: Text(
                    'View All',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFFE89D1E),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 100,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: favIds.length,
            itemBuilder: (context, index) {
              final id = favIds.elementAt(index);
              return Container(
                margin: const EdgeInsets.only(right: 10),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.favorite, color: Colors.red, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Saved Restaurant #$id',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

// ── 10. Recent Orders Section Widget ──────────────────────────────────────────
class _RecentOrdersSection extends StatefulWidget {
  const _RecentOrdersSection();

  @override
  State<_RecentOrdersSection> createState() => _RecentOrdersSectionState();
}

class _RecentOrdersSectionState extends State<_RecentOrdersSection> {
  int? _reorderSuccessIndex;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final orderProvider = context.watch<OrderProvider>();
    final pastOrders = [...orderProvider.activeOrders, ...orderProvider.pastOrders];

    if (pastOrders.isEmpty) {
      return const SizedBox.shrink(); // Hide section cleanly if user has no past orders
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.history_rounded, color: Color(0xFF248C70), size: 22),
                  const SizedBox(width: 6),
                  Text(
                    'Recent Orders',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                  ),
                ],
              ),
              GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const Scaffold(
                        body: SafeArea(child: MyOrdersPage()),
                      ),
                    ),
                  );
                },
                child: const Text(
                  'View History',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFFE89D1E),
                  ),
                ),
              ),
            ],
          ),
        ),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: pastOrders.length > 3 ? 3 : pastOrders.length,
          itemBuilder: (context, index) {
            final order = pastOrders[index];
            final restName = order['restaurant']?['name'] ?? 'ECDKART Order';
            final totalAmt = order['totalAmount'] ?? 0;
            final statusStr = order['status'] ?? 'processing';
            final isReordered = _reorderSuccessIndex == index;

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFE5E7EB)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: const Color(0xFF248C70).withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.receipt_long_rounded, color: Color(0xFF248C70), size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          restName.toString(),
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 13,
                            color: isDark ? Colors.white : Colors.black87,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Status: $statusStr • Total: ₹$totalAmt',
                          style: const TextStyle(fontSize: 11, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                    onPressed: () {
                      setState(() {
                        _reorderSuccessIndex = index;
                      });
                      ScaffoldMessenger.of(context).hideCurrentSnackBar();
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Reordered from $restName!'),
                          duration: const Duration(seconds: 2),
                          backgroundColor: const Color(0xFF248C70),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      );
                      Future.delayed(const Duration(seconds: 2), () {
                        if (mounted) setState(() => _reorderSuccessIndex = null);
                      });
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isReordered ? Colors.green : const Color(0xFF248C70),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                    icon: Icon(
                      isReordered ? Icons.check_circle : Icons.replay_rounded,
                      size: 16,
                    ),
                    label: Text(
                      isReordered ? 'Added!' : 'Reorder',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}

class RotatingThaliWidget extends StatefulWidget {
  const RotatingThaliWidget({super.key});

  @override
  State<RotatingThaliWidget> createState() => _RotatingThaliWidgetState();
}

class _RotatingThaliWidgetState extends State<RotatingThaliWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 18),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const double thaliSize = 250.0;

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 24.0),
        child: Container(
          width: thaliSize,
          height: thaliSize,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.white,
            border: Border.all(
              color: const Color(0xFFE89D1E),
              width: 5,
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFE89D1E).withValues(alpha: 0.3),
                blurRadius: 16,
                spreadRadius: 2,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: RotationTransition(
            turns: Tween<double>(begin: 1.0, end: 0.0).animate(_controller),
            child: ClipOval(
              child: Transform.scale(
                scale: 1.38,
                child: Image.asset(
                  'assets/thali.jpg',
                  width: thaliSize,
                  height: thaliSize,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => const Icon(
                    Icons.restaurant,
                    size: 100,
                    color: Color(0xFF248C70),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// Sticky Category Header Persistent Delegate
// ─────────────────────────────────────────────
class _SliverCategoryHeaderDelegate extends SliverPersistentHeaderDelegate {
  final Widget child;
  final double height;

  _SliverCategoryHeaderDelegate({required this.child, this.height = 142.0});

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      color: isDark ? Colors.black : const Color(0xFFF5FAF8),
      alignment: Alignment.center,
      child: child,
    );
  }

  @override
  double get maxExtent => height;

  @override
  double get minExtent => height;

  @override
  bool shouldRebuild(covariant _SliverCategoryHeaderDelegate oldDelegate) {
    return true;
  }
}



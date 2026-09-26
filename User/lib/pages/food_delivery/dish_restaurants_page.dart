import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../core/models/category.dart';
import '../../core/models/product.dart';
import '../../core/models/restaurant_models.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/cart_provider.dart';
import '../../providers/theme_provider.dart';
import '../../routes/app_routes.dart';
import '../../services/restaurant_api_service.dart';
import '../../services/socket_service.dart';
import '../../widgets/safe_image.dart';
import '../category_selection/food_preferences_page.dart';
import 'restaurant_detail_screen.dart';
import 'widgets/filters_bottom_sheet.dart';

class DishRestaurantsPage extends StatefulWidget {
  final PopularDish dish;

  const DishRestaurantsPage({super.key, required this.dish});

  @override
  State<DishRestaurantsPage> createState() => _DishRestaurantsPageState();
}

class _DishRestaurantsPageState extends State<DishRestaurantsPage> {
  late List<Category> _categories;
  int _selectedCategoryIndex = 0;
  List<Restaurant> _restaurants = [];
  List<Product> _categoryProducts = [];
  bool _isLoading = true;
  Function(dynamic)? _restaurantSocketCallback;
  String _selectedFilter = 'All';
  Map<String, String> _appliedFilters = {};

  @override
  void initState() {
    super.initState();
    _initCategories();
    _fetchData();

    _restaurantSocketCallback = (data) {
      debugPrint('DishPage received restaurantStatusUpdated: $data');
      if (mounted && data != null) {
        final Map<String, dynamic>? payload = (data is List && data.isNotEmpty)
            ? (data.first as Map<String, dynamic>?)
            : (data is Map<String, dynamic>
                ? data
                : (data is Map ? Map<String, dynamic>.from(data) : null));

        if (payload != null &&
            payload['restaurantId'] != null &&
            payload['isOnline'] != null) {
          final restaurantId = payload['restaurantId'].toString();
          final isOnline =
              payload['isOnline'] == true || payload['isOnline'] == 'true';

          setState(() {
            for (var i = 0; i < _restaurants.length; i++) {
              if (_restaurants[i].id == restaurantId) {
                _restaurants[i] =
                    _restaurants[i].copyWith(isOnline: isOnline);
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
    if (_restaurantSocketCallback != null) {
      SocketService.offRestaurantStatusUpdated(_restaurantSocketCallback);
    }
    super.dispose();
  }

  void _initCategories() {
    _categories = [
      Category(id: 'c3', title: 'Pizza', image: 'assets/static/c3.png'),
      Category(id: 'c2', title: 'Burgers', image: 'assets/static/c2.png'),
      Category(id: 'c5', title: 'Biryani', image: 'assets/static/c5.png'),
      Category(id: 'c1', title: 'Cakes', image: 'assets/static/c1.png'),
      Category(id: 'c4', title: 'Chicken', image: 'assets/static/c4.png'),
      Category(id: 'c6', title: 'Sandwich', image: 'assets/static/c6.png'),
      Category(id: 'c7', title: 'Chinese', image: 'assets/static/b3.jpg'),
      Category(id: 'c8', title: 'Desserts', image: 'assets/static/cake5.jpg'),
      Category(id: 'c9', title: 'Beverages', image: 'assets/static/b4.jpg'),
    ];

    final dishNameLower = widget.dish.name.toLowerCase();
    final dishCatLower = widget.dish.category.toLowerCase();

    for (int i = 0; i < _categories.length; i++) {
      final titleLower = _categories[i].title.toLowerCase();
      if (dishNameLower.contains(titleLower) ||
          titleLower.contains(dishNameLower) ||
          dishCatLower.contains(titleLower) ||
          titleLower.contains(dishCatLower)) {
        _selectedCategoryIndex = i;
        break;
      }
    }
  }

  String get _currentCategoryTitle => _categories.isNotEmpty
      ? _categories[_selectedCategoryIndex].title
      : widget.dish.name;

  String get _currentCategoryImage => _categories.isNotEmpty
      ? _categories[_selectedCategoryIndex].image
      : widget.dish.imageUrl;

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    final categoryName = _currentCategoryTitle;

    try {
      final results = await RestaurantApiService.searchRestaurants(categoryName);
      final popularDishes = await RestaurantApiService.getPopularDishes();
      final allProducts = popularDishes.map((d) => Product(
        id: d.id,
        name: d.name,
        description: d.description,
        price: d.price > 0 ? d.price : 149.0,
        image: d.imageUrl,
        category: d.category.isNotEmpty ? d.category : 'General',
        rating: 4.5,
        isVeg: true,
      )).toList();

      final filteredProducts = allProducts.where((p) {
        final catLower = categoryName.toLowerCase();
        return p.category.toLowerCase().contains(catLower) ||
            p.name.toLowerCase().contains(catLower) ||
            catLower.contains(p.category.toLowerCase());
      }).toList();

      setState(() {
        _restaurants = results;
        _categoryProducts = filteredProducts.isNotEmpty
            ? filteredProducts
            : allProducts.take(4).toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  void _onCategorySelected(int index) {
    if (_selectedCategoryIndex == index) return;
    setState(() {
      _selectedCategoryIndex = index;
    });
    _fetchData();
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

    if (_selectedFilter == 'Free Delivery') {
      list = list.where((r) => r.deliveryCharge == 0).toList();
    } else if (_selectedFilter == 'Rating 4.5+') {
      list = list.where((r) => r.rating >= 4.5).toList();
    } else if (_selectedFilter == 'Fastest') {
      list.sort((a, b) => a.deliveryTimeMin.compareTo(b.deliveryTimeMin));
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
    if (_appliedFilters.containsKey('dietary')) {
      final d = _appliedFilters['dietary']!;
      if (d == 'Veg') {
        list = list
            .where((r) =>
                r.cuisine.toLowerCase().contains('veg') ||
                r.menu.any((m) => m.isVeg))
            .toList();
      } else if (d == 'Non-Veg') {
        list = list.where((r) => r.menu.any((m) => !m.isVeg)).toList();
      }
    }

    return list;
  }

  List<Product> get _filteredProductsList {
    List<Product> list = List.from(_categoryProducts);

    if (_appliedFilters.containsKey('dietary')) {
      final d = _appliedFilters['dietary']!;
      if (d == 'Veg') {
        list = list.where((p) => p.isVeg).toList();
      } else if (d == 'Non-Veg') {
        list = list.where((p) => !p.isVeg).toList();
      }
    }

    if (_appliedFilters.containsKey('minPrice')) {
      final minP = double.tryParse(_appliedFilters['minPrice']!) ?? 0.0;
      list = list.where((p) => p.price >= minP).toList();
    }
    if (_appliedFilters.containsKey('maxPrice')) {
      final maxP = double.tryParse(_appliedFilters['maxPrice']!) ?? 9999.0;
      list = list.where((p) => p.price <= maxP).toList();
    }

    return list;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    final cart = context.watch<CartProvider>();
    const primaryColor = AppColors.primary;
    const accentOrange = AppColors.accentOrange;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF121212) : const Color(0xFFF5FAF8),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        foregroundColor: isDark ? Colors.white : Colors.black87,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          children: [
            Text(
              _currentCategoryTitle,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.2,
              ),
            ),
            Text(
              'Switch categories & order nearby',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: isDark ? Colors.grey.shade400 : AppColors.primary,
              ),
            ),
          ],
        ),
        centerTitle: true,
        actions: [
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.tune_rounded, size: 22),
                onPressed: _openFilterModal,
              ),
              if (_appliedFilters.isNotEmpty)
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: accentOrange,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: CustomScrollView(
              slivers: [
                // ── Top Curved Category Switcher Section ("What's on your mind?") ──
                SliverToBoxAdapter(
                  child: Container(
                    margin: const EdgeInsets.fromLTRB(14, 12, 14, 14),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E3A32) : primaryColor,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: primaryColor.withValues(alpha: 0.25),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Section Header
                        Padding(
                          padding: const EdgeInsets.fromLTRB(18, 14, 18, 10),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                "What's on your mind?",
                                style: TextStyle(
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
                                      builder: (_) => const FoodPreferencesPage(
                                          showBackButton: true),
                                    ),
                                  );
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Row(
                                    children: [
                                      Text(
                                        'View All',
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: Colors.white,
                                        ),
                                      ),
                                      Icon(Icons.chevron_right_rounded,
                                          size: 16, color: Colors.white),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Horizontal Categories Selector
                        SizedBox(
                          height: 115,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            itemCount: _categories.length,
                            itemBuilder: (context, index) {
                              Category category = _categories[index];
                              final isSelected = index == _selectedCategoryIndex;
                              final tabBgColor = isDark
                                  ? const Color(0xFF121212)
                                  : const Color(0xFFF5FAF8);

                              final itemWidget = Padding(
                                padding: EdgeInsets.fromLTRB(
                                  isSelected ? 16 : 10,
                                  isSelected ? 10 : 12,
                                  isSelected ? 16 : 10,
                                  isSelected ? 4 : 8,
                                ),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      width: 48,
                                      height: 48,
                                      padding: const EdgeInsets.all(3),
                                      decoration: BoxDecoration(
                                        color: isSelected
                                            ? const Color(0xFFFFE8A3)
                                            : Colors.white,
                                        shape: BoxShape.circle,
                                        boxShadow: [
                                          BoxShadow(
                                            color: Colors.black
                                                .withValues(alpha: 0.1),
                                            blurRadius: 6,
                                            offset: const Offset(0, 2),
                                          ),
                                        ],
                                      ),
                                      child: ClipOval(
                                        child: SafeImage(
                                          category.image,
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      category.title,
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: isSelected
                                            ? FontWeight.w800
                                            : FontWeight.w600,
                                        color: isSelected
                                            ? (isDark
                                                ? Colors.white
                                                : primaryColor)
                                            : Colors.white,
                                      ),
                                    ),
                                  ],
                                ),
                              );

                              return GestureDetector(
                                onTap: () => _onCategorySelected(index),
                                child: isSelected
                                    ? CustomPaint(
                                        painter: ArchTabShape(color: tabBgColor),
                                        child: itemWidget,
                                      )
                                    : Container(
                                        margin:
                                            const EdgeInsets.symmetric(horizontal: 2),
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

                // ── Category Info Banner & Filters Bar ──
                SliverToBoxAdapter(
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        if (!isDark)
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(10),
                              child: SafeImage(
                                _currentCategoryImage,
                                width: 44,
                                height: 44,
                                fit: BoxFit.cover,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '$_currentCategoryTitle Delights',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                      color: isDark ? Colors.white : const Color(0xFF1F2937),
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${_filteredRestaurants.length} top-rated restaurants nearby',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                      color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: accentOrange.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Text(
                                'ACTIVE',
                                style: TextStyle(
                                  color: accentOrange,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // Quick Filter Chips + Filter Popup Button
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: [
                              // Filter Selection Popup Trigger Button
                              GestureDetector(
                                onTap: _openFilterModal,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: _appliedFilters.isNotEmpty
                                        ? accentOrange
                                        : (isDark
                                            ? const Color(0xFF2D2D2D)
                                            : const Color(0xFFE8F5E9)),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                      color: _appliedFilters.isNotEmpty
                                          ? accentOrange
                                          : primaryColor.withValues(alpha: 0.3),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(
                                        Icons.tune_rounded,
                                        size: 14,
                                        color: _appliedFilters.isNotEmpty
                                            ? Colors.white
                                            : primaryColor,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        _appliedFilters.isNotEmpty
                                            ? 'Filters (${_appliedFilters.length})'
                                            : 'Filter',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w800,
                                          color: _appliedFilters.isNotEmpty
                                              ? Colors.white
                                              : primaryColor,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              _buildFilterChip('All', isDark, primaryColor),
                              const SizedBox(width: 8),
                              _buildFilterChip('Free Delivery', isDark, primaryColor),
                              const SizedBox(width: 8),
                              _buildFilterChip('Rating 4.5+', isDark, primaryColor),
                              const SizedBox(width: 8),
                              _buildFilterChip('Fastest', isDark, primaryColor),
                              if (_appliedFilters.isNotEmpty) ...[
                                const SizedBox(width: 8),
                                GestureDetector(
                                  onTap: () => setState(() => _appliedFilters.clear()),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 10, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: Colors.red.withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(
                                          color: Colors.red.withValues(alpha: 0.3)),
                                    ),
                                    child: const Row(
                                      children: [
                                        Icon(Icons.close_rounded,
                                            size: 14, color: Colors.red),
                                        SizedBox(width: 3),
                                        Text(
                                          'Clear',
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w700,
                                            color: Colors.red,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SliverToBoxAdapter(child: SizedBox(height: 16)),

                // ── Direct Item Order Section ──
                if (_filteredProductsList.isNotEmpty)
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Quick Order $_currentCategoryTitle',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: isDark ? Colors.white : const Color(0xFF1F2937),
                                ),
                              ),
                              const Text(
                                '1-Tap Add',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: accentOrange,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          SizedBox(
                            height: 180,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount: _filteredProductsList.length,
                              itemBuilder: (context, index) {
                                final item = _filteredProductsList[index];
                                final cartIndex = cart.items.indexWhere(
                                    (ci) => ci.product.id == item.id);
                                final qty = cartIndex >= 0
                                    ? cart.items[cartIndex].quantity
                                    : 0;

                                return Container(
                                  width: 140,
                                  margin: const EdgeInsets.only(right: 12),
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? const Color(0xFF1F2937)
                                        : Colors.white,
                                    borderRadius: BorderRadius.circular(16),
                                    boxShadow: [
                                      if (!isDark)
                                        BoxShadow(
                                          color: Colors.black.withValues(alpha: 0.04),
                                          blurRadius: 6,
                                          offset: const Offset(0, 2),
                                        ),
                                    ],
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(12),
                                        child: SafeImage(
                                          item.image,
                                          width: double.infinity,
                                          height: 80,
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        item.name,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w800,
                                          color: isDark ? Colors.white : Colors.black87,
                                        ),
                                      ),
                                      const Spacer(),
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            '₹${item.price.toInt()}',
                                            style: const TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w800,
                                              color: primaryColor,
                                            ),
                                          ),
                                          GestureDetector(
                                            onTap: () {
                                              if (qty == 0) {
                                                cart.addItem(
                                                  item,
                                                  restaurantId: 'rest_1',
                                                  restaurantName:
                                                      'Gourmet Kitchen',
                                                  restaurantImageUrl:
                                                      item.image,
                                                  imageUrl: item.image,
                                                );
                                              } else {
                                                cart.updateQuantity(
                                                    item.id, qty + 1);
                                              }
                                            },
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(
                                                  horizontal: 10, vertical: 4),
                                              decoration: BoxDecoration(
                                                color: primaryColor,
                                                borderRadius:
                                                    BorderRadius.circular(8),
                                              ),
                                              child: Text(
                                                qty > 0 ? '$qty' : 'ADD',
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.w800,
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                const SliverToBoxAdapter(child: SizedBox(height: 16)),

                // ── Section Header for Restaurants ──
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    child: Text(
                      'Restaurants Serving $_currentCategoryTitle',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : const Color(0xFF1F2937),
                      ),
                    ),
                  ),
                ),

                // ── Restaurant Cards List ──
                _isLoading
                    ? const SliverFillRemaining(
                        child: Center(
                            child: CircularProgressIndicator(color: primaryColor)),
                      )
                    : _filteredRestaurants.isEmpty
                        ? SliverToBoxAdapter(
                            child: Padding(
                              padding: const EdgeInsets.all(32.0),
                              child: Center(
                                child: Text(
                                  'No restaurants available for this category filter',
                                  style: TextStyle(
                                    color: isDark ? Colors.grey : Colors.black54,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ),
                          )
                        : SliverList(
                            delegate: SliverChildBuilderDelegate(
                              (context, index) {
                                final sorted = [..._filteredRestaurants]
                                  ..sort((a, b) => b.rating.compareTo(a.rating));
                                return _RestaurantCard(restaurant: sorted[index]);
                              },
                              childCount: _filteredRestaurants.length,
                            ),
                          ),

                const SliverToBoxAdapter(child: SizedBox(height: 32)),
              ],
            ),
          ),

          // ── Sticky Bottom Cart Summary Bar ──
          if (cart.itemCount > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 10,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: SafeArea(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${cart.itemCount} ITEMS ADDED',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: isDark
                                ? Colors.grey.shade400
                                : Colors.grey.shade600,
                          ),
                        ),
                        Text(
                          '₹${cart.totalAmount.toStringAsFixed(0)}',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: primaryColor,
                          ),
                        ),
                      ],
                    ),
                    ElevatedButton(
                      onPressed: () => context.push(AppRoutes.cart),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: accentOrange,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 24, vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 2,
                      ),
                      child: const Row(
                        children: [
                          Text(
                            'View Cart',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          SizedBox(width: 6),
                          Icon(Icons.arrow_forward_rounded, size: 18),
                        ],
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

  Widget _buildFilterChip(String label, bool isDark, Color primaryColor) {
    final isSelected = _selectedFilter == label;
    return GestureDetector(
      onTap: () => setState(() => _selectedFilter = label),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? primaryColor
              : (isDark ? const Color(0xFF2D2D2D) : const Color(0xFFF3F4F6)),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
            color: isSelected
                ? Colors.white
                : (isDark ? Colors.grey.shade300 : const Color(0xFF4B5563)),
          ),
        ),
      ),
    );
  }
}

// ── Restaurant Card ──
class _RestaurantCard extends StatefulWidget {
  final Restaurant restaurant;
  const _RestaurantCard({required this.restaurant});

  @override
  State<_RestaurantCard> createState() => _RestaurantCardState();
}

class _RestaurantCardState extends State<_RestaurantCard> {
  bool _menuExpanded = false;

  @override
  Widget build(BuildContext context) {
    final r = widget.restaurant;
    final isFree = r.deliveryCharge == 0;
    final isDark = context.watch<ThemeProvider>().isDarkMode;

    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => RestaurantDetailScreen(restaurant: r),
        ),
      ),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: isDark
                  ? Colors.white.withValues(alpha: 0.04)
                  : Colors.black.withValues(alpha: 0.06),
              blurRadius: 14,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Restaurant Banner
            ClipRRect(
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(18)),
              child: Stack(
                children: [
                  SafeImage(
                    r.imageUrl,
                    height: 150,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  ),
                  if (r.isOnline)
                    Positioned(
                      top: 12,
                      left: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: isFree
                              ? AppColors.primary
                              : AppColors.accentOrange,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          isFree
                              ? 'FREE DELIVERY'
                              : '₹${r.deliveryCharge.toInt()} Delivery',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                  if (!r.isOnline)
                    Positioned.fill(
                      child: Container(
                        color: Colors.white.withValues(alpha: 0.6),
                        child: Center(
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.black87,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Text(
                              'CURRENTLY OFFLINE',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                  letterSpacing: 1.0),
                            ),
                          ),
                        ),
                      ),
                    ),
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.65),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.access_time,
                              color: Colors.white, size: 12),
                          const SizedBox(width: 4),
                          Text(
                            '${r.deliveryTimeMin} min',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Restaurant Meta Info
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          r.name,
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            color:
                                isDark ? Colors.white : const Color(0xFF2C2C2C),
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.star,
                                color: Colors.white, size: 13),
                            const SizedBox(width: 3),
                            Text(
                              r.rating.toStringAsFixed(1),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    r.cuisine,
                    style: const TextStyle(
                      fontSize: 13,
                      color: Color(0xFF6B7280),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined,
                          size: 14, color: Color(0xFF9CA3AF)),
                      const SizedBox(width: 3),
                      Text(
                        '${r.distanceKm} km away',
                        style: const TextStyle(
                            fontSize: 12, color: Color(0xFF9CA3AF)),
                      ),
                      const SizedBox(width: 14),
                      const Icon(Icons.people_outline,
                          size: 14, color: Color(0xFF9CA3AF)),
                      const SizedBox(width: 3),
                      Text(
                        '${r.reviewCount} reviews',
                        style: const TextStyle(
                            fontSize: 12, color: Color(0xFF9CA3AF)),
                      ),
                    ],
                  ),
                  const Divider(height: 20, color: Color(0xFFF3F4F6)),
                  GestureDetector(
                    onTap: () =>
                        setState(() => _menuExpanded = !_menuExpanded),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Menu  •  ${r.menu.length} items',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primary,
                          ),
                        ),
                        AnimatedRotation(
                          turns: _menuExpanded ? 0.5 : 0,
                          duration: const Duration(milliseconds: 200),
                          child: const Icon(Icons.keyboard_arrow_down,
                              color: AppColors.primary, size: 22),
                        ),
                      ],
                    ),
                  ),
                  AnimatedCrossFade(
                    firstChild: const SizedBox.shrink(),
                    secondChild: Column(
                      children: [
                        const SizedBox(height: 10),
                        ...r.menu.map((item) => _MenuItemTile(
                            item: item,
                            restaurantName: r.name,
                            isRestaurantOnline: r.isOnline)),
                      ],
                    ),
                    crossFadeState: _menuExpanded
                        ? CrossFadeState.showSecond
                        : CrossFadeState.showFirst,
                    duration: const Duration(milliseconds: 250),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Menu Item Tile ──
class _MenuItemTile extends StatelessWidget {
  final MenuItem item;
  final String restaurantName;
  final bool isRestaurantOnline;

  const _MenuItemTile({
    required this.item,
    required this.restaurantName,
    required this.isRestaurantOnline,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    final cart = context.watch<CartProvider>();

    final product = Product(
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.imageUrl,
      category: item.category,
      rating: item.rating,
      isVeg: item.isVeg,
    );

    final cartIndex = cart.items.indexWhere((ci) => ci.product.id == item.id);
    final qty = cartIndex >= 0 ? cart.items[cartIndex].quantity : 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF292929) : const Color(0xFFF5FAF8),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
            color: isDark ? Colors.grey[800]! : const Color(0xFFE5E7EB)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: SafeImage(
              item.imageUrl,
              width: 72,
              height: 72,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: item.isVeg ? Colors.green : Colors.red,
                          width: 1.5,
                        ),
                        borderRadius: BorderRadius.circular(2),
                      ),
                      child: Center(
                        child: Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: item.isVeg ? Colors.green : Colors.red,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        item.name,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color:
                              isDark ? Colors.white : const Color(0xFF2C2C2C),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  item.description,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF9CA3AF),
                    height: 1.4,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.star, color: Colors.amber, size: 12),
                    const SizedBox(width: 3),
                    Text(
                      item.rating.toStringAsFixed(1),
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF6B7280),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '₹${item.price.toInt()}',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : const Color(0xFF2C2C2C),
                ),
              ),
              const SizedBox(height: 6),
              GestureDetector(
                onTap: isRestaurantOnline ? () {} : null,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                  decoration: BoxDecoration(
                    color: isRestaurantOnline ? AppColors.primary : Colors.grey[400],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    isRestaurantOnline ? 'ADD' : 'DISABLED',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
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


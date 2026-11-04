import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/models/category.dart';
import '../../core/models/product.dart';
import '../../core/models/restaurant_models.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/cart_provider.dart';
import '../../providers/location_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/restaurant_api_service.dart';
import '../../services/socket_service.dart';
import '../../widgets/safe_image.dart';
import '../category_selection/food_preferences_page.dart';
import '../cart/cart_page.dart';
import 'widgets/filters_bottom_sheet.dart';

class DishRestaurantsPage extends StatefulWidget {
  final PopularDish? dish;
  final String? dishName;
  final Category? category;
  final String? categoryId;
  final String? categoryTitle;

  const DishRestaurantsPage({
    super.key,
    this.dish,
    this.dishName,
    this.category,
    this.categoryId,
    this.categoryTitle,
  });

  @override
  State<DishRestaurantsPage> createState() => _DishRestaurantsPageState();
}

class _DishRestaurantsPageState extends State<DishRestaurantsPage> {
  List<Category> _categories = [];
  int _selectedCategoryIndex = 0;
  String? _currentCategoryId;
  List<Product> _categoryProducts = [];
  bool _isLoading = true;
  String _selectedFilter = 'All';
  Map<String, String> _appliedFilters = {};

  @override
  void initState() {
    super.initState();
    _initCategories();
    _fetchData();
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

    if (widget.category != null) {
      final exists = _categories.indexWhere((c) => c.title.toLowerCase() == widget.category!.title.toLowerCase());
      if (exists >= 0) {
        _selectedCategoryIndex = exists;
      } else {
        _categories.insert(0, widget.category!);
        _selectedCategoryIndex = 0;
      }
      _currentCategoryId = widget.category!.id;
    } else {
      final query = (widget.categoryTitle ?? widget.dishName ?? widget.dish?.category ?? widget.dish?.name ?? '').toLowerCase();
      if (query.isNotEmpty) {
        for (int i = 0; i < _categories.length; i++) {
          final titleLower = _categories[i].title.toLowerCase();
          if (query.contains(titleLower) || titleLower.contains(query)) {
            _selectedCategoryIndex = i;
            break;
          }
        }
      }
      _currentCategoryId = widget.categoryId;
    }

    _loadDynamicCategories();
  }

  Future<void> _loadDynamicCategories() async {
    try {
      final dynamicCats = await RestaurantApiService.getCategories();
      if (dynamicCats.isNotEmpty && mounted) {
        setState(() {
          final currentTargetTitle = _currentCategoryTitle.toLowerCase();
          _categories = dynamicCats;
          int foundIdx = _categories.indexWhere((c) => c.title.toLowerCase() == currentTargetTitle);
          if (foundIdx >= 0) {
            _selectedCategoryIndex = foundIdx;
            _currentCategoryId = _categories[foundIdx].id;
          } else {
            if (widget.category != null) {
              _categories.insert(0, widget.category!);
              _selectedCategoryIndex = 0;
            }
          }
        });
      }
    } catch (_) {}
  }

  PopularDish get _effectiveDish => widget.dish ?? PopularDish(
    id: 'custom',
    name: widget.categoryTitle ?? widget.dishName ?? 'Dish',
    slug: (widget.categoryTitle ?? widget.dishName ?? 'dish').toLowerCase().replaceAll(' ', '-'),
    imageUrl: '',
    category: widget.categoryTitle ?? widget.dishName ?? 'General',
  );

  String get _currentCategoryTitle {
    if (_categories.isNotEmpty && _selectedCategoryIndex < _categories.length) {
      return _categories[_selectedCategoryIndex].title;
    }
    return widget.categoryTitle ?? widget.dishName ?? _effectiveDish.name;
  }

  String get _currentCategoryImage {
    if (_categories.isNotEmpty && _selectedCategoryIndex < _categories.length) {
      return _categories[_selectedCategoryIndex].image;
    }
    return _effectiveDish.imageUrl;
  }

  // Clean restaurant name (e.g. "{en: Rishu ka Dabha}" -> "Rishu ka Dabha")
  String _formatRestaurantName(String? raw) {
    if (raw == null || raw.trim().isEmpty) return 'Available Nearby';
    var s = raw.trim();
    if (s.contains('en:')) {
      final parts = s.split('en:');
      if (parts.length > 1) {
        s = parts[1].split(',')[0].split('}')[0];
      }
    } else if (s.contains('"en":')) {
      final parts = s.split('"en":');
      if (parts.length > 1) {
        s = parts[1].split(',')[0].split('}')[0];
      }
    }
    s = s.replaceAll('{', '')
         .replaceAll('}', '')
         .replaceAll('"', '')
         .replaceAll("'", '')
         .trim();
    return s.isNotEmpty ? s : 'Available Nearby';
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    final categoryName = _currentCategoryTitle;
    final catId = _currentCategoryId ?? (_categories.isNotEmpty && _selectedCategoryIndex < _categories.length ? _categories[_selectedCategoryIndex].id : null);

    try {
      final loc = context.read<LocationProvider>();
      
      // Dynamic backend fetch by GPS radius
      final result = await RestaurantApiService.getCategoryItemsAndRestaurants(
        category: categoryName,
        categoryId: catId,
        lat: loc.lat,
        lng: loc.lng,
      );

      List<Product> fetchedItems = [];
      if (result['success'] == true) {
        final rawList = List<Product>.from(result['items'] ?? []);
        // Format restaurant names cleanly on all items
        fetchedItems = rawList.map((p) => Product(
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          image: p.image,
          category: p.category,
          rating: p.rating,
          isVeg: p.isVeg,
          restaurantId: p.restaurantId,
          restaurantName: _formatRestaurantName(p.restaurantName),
          restaurantImageUrl: p.restaurantImageUrl,
        )).toList();
      }

      if (mounted) {
        setState(() {
          _categoryProducts = fetchedItems;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _onCategorySelected(int index) {
    if (_selectedCategoryIndex == index) return;
    setState(() {
      _selectedCategoryIndex = index;
      _currentCategoryId = index < _categories.length ? _categories[index].id : null;
    });
    _fetchData();
  }

  void _handleCartAdd({
    required BuildContext context,
    required CartProvider cart,
    required Product product,
    required String restaurantId,
    required String restaurantName,
    required String restaurantImageUrl,
  }) {
    final effectiveRestId = restaurantId.isNotEmpty ? restaurantId : (product.restaurantId ?? 'rest_1');
    final effectiveRestName = _formatRestaurantName(restaurantName.isNotEmpty ? restaurantName : product.restaurantName);
    final effectiveRestImg = restaurantImageUrl.isNotEmpty ? restaurantImageUrl : (product.restaurantImageUrl ?? product.image);

    // Cart Conflict Dialog if cart has items from different restaurant
    if (cart.itemCount > 0 && cart.restaurantId != null && cart.restaurantId != effectiveRestId) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Replace cart items?', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
          content: Text(
            'Your cart contains dishes from "${cart.restaurantName ?? 'another restaurant'}". Would you like to discard them and add this dish from "$effectiveRestName"?',
            style: const TextStyle(fontSize: 13),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w600)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.accentOrange,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: () {
                Navigator.pop(ctx);
                cart.switchRestaurantAndAdd(
                  product,
                  restaurantId: effectiveRestId,
                  restaurantName: effectiveRestName,
                  restaurantImageUrl: effectiveRestImg,
                  imageUrl: product.image,
                );
              },
              child: const Text('Replace & Add', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      );
      return;
    }

    // Normal Add to Cart
    cart.addItem(
      product,
      restaurantId: effectiveRestId,
      restaurantName: effectiveRestName,
      restaurantImageUrl: effectiveRestImg,
      imageUrl: product.image,
    );
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

  List<Product> get _filteredProductsList {
    List<Product> list = List.from(_categoryProducts);

    // Quick filter chips
    if (_selectedFilter == 'Veg') {
      list = list.where((p) => p.isVeg).toList();
    } else if (_selectedFilter == 'Non-Veg') {
      list = list.where((p) => !p.isVeg).toList();
    } else if (_selectedFilter == 'Rating 4.5+') {
      list = list.where((p) => p.rating >= 4.5).toList();
    }

    // Modal filters
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
              'Dishes from nearby restaurants',
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
            child: RefreshIndicator(
              onRefresh: _fetchData,
              child: CustomScrollView(
                slivers: [
                  // ── Top Category Switcher Section ("What's on your mind?") ──
                  SliverToBoxAdapter(
                    child: Container(
                      margin: const EdgeInsets.fromLTRB(14, 12, 14, 14),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E3A32) : primaryColor,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: primaryColor.withOpacity(0.25),
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
                                        builder: (_) => const FoodPreferencesPage(showBackButton: true),
                                      ),
                                    );
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.2),
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
                                        Icon(Icons.chevron_right_rounded, size: 16, color: Colors.white),
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
                                          color: isSelected ? const Color(0xFFFFE8A3) : Colors.white,
                                          shape: BoxShape.circle,
                                          boxShadow: [
                                            BoxShadow(
                                              color: Colors.black.withOpacity(0.1),
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
                                          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                          color: isSelected
                                              ? (isDark ? Colors.white : primaryColor)
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
                              color: Colors.black.withOpacity(0.04),
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
                                      '${_filteredProductsList.length} items available nearby',
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
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: accentOrange.withOpacity(0.15),
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

                          // Quick Filter Chips
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: [
                                GestureDetector(
                                  onTap: _openFilterModal,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: _appliedFilters.isNotEmpty
                                          ? accentOrange
                                          : (isDark ? const Color(0xFF2D2D2D) : const Color(0xFFE8F5E9)),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(
                                        color: _appliedFilters.isNotEmpty
                                            ? accentOrange
                                            : primaryColor.withOpacity(0.3),
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(
                                          Icons.tune_rounded,
                                          size: 14,
                                          color: _appliedFilters.isNotEmpty ? Colors.white : primaryColor,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          _appliedFilters.isNotEmpty
                                              ? 'Filters (${_appliedFilters.length})'
                                              : 'Filter',
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w800,
                                            color: _appliedFilters.isNotEmpty ? Colors.white : primaryColor,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                _buildFilterChip('All', isDark, primaryColor),
                                const SizedBox(width: 8),
                                _buildFilterChip('Veg', isDark, primaryColor),
                                const SizedBox(width: 8),
                                _buildFilterChip('Non-Veg', isDark, primaryColor),
                                const SizedBox(width: 8),
                                _buildFilterChip('Rating 4.5+', isDark, primaryColor),
                                if (_appliedFilters.isNotEmpty) ...[
                                  const SizedBox(width: 8),
                                  GestureDetector(
                                    onTap: () => setState(() => _appliedFilters.clear()),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: Colors.red.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(20),
                                        border: Border.all(color: Colors.red.withOpacity(0.3)),
                                      ),
                                      child: const Row(
                                        children: [
                                          Icon(Icons.close_rounded, size: 14, color: Colors.red),
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

                  // ── Full-Screen Items Grid Section ──
                  if (_isLoading)
                    const SliverFillRemaining(
                      child: Center(
                        child: CircularProgressIndicator(color: primaryColor),
                      ),
                    )
                  else if (_filteredProductsList.isEmpty)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32.0),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(
                                  color: primaryColor.withOpacity(0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.fastfood_outlined, size: 54, color: primaryColor),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'No $_currentCategoryTitle items found nearby',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: isDark ? Colors.white : const Color(0xFF1F2937),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Restaurants in your delivery radius do not have this category right now. Please select another category above!',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                                  height: 1.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      sliver: SliverGrid(
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.70,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 14,
                        ),
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final item = _filteredProductsList[index];
                            final cartIndex = cart.items.indexWhere((ci) => ci.product.id == item.id);
                            final qty = cartIndex >= 0 ? cart.items[cartIndex].quantity : 0;
                            final cleanRestName = _formatRestaurantName(item.restaurantName);

                            return Container(
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                                borderRadius: BorderRadius.circular(18),
                                boxShadow: [
                                  BoxShadow(
                                    color: isDark ? Colors.black38 : Colors.black.withOpacity(0.06),
                                    blurRadius: 8,
                                    offset: const Offset(0, 3),
                                  ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Image Stack
                                  Stack(
                                    children: [
                                      ClipRRect(
                                        borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
                                        child: SafeImage(
                                          item.image,
                                          width: double.infinity,
                                          height: 110,
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                      // Veg / Non-Veg Icon Badge
                                      Positioned(
                                        top: 8,
                                        left: 8,
                                        child: Container(
                                          padding: const EdgeInsets.all(3),
                                          decoration: BoxDecoration(
                                            color: Colors.white,
                                            borderRadius: BorderRadius.circular(4),
                                            boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 2)],
                                          ),
                                          child: Icon(
                                            Icons.circle,
                                            size: 9,
                                            color: item.isVeg ? Colors.green : Colors.red,
                                          ),
                                        ),
                                      ),
                                      // Rating Badge
                                      if (item.rating > 0)
                                        Positioned(
                                          top: 8,
                                          right: 8,
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: Colors.black.withOpacity(0.7),
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                const Icon(Icons.star, color: Colors.amber, size: 10),
                                                const SizedBox(width: 2),
                                                Text(
                                                  item.rating.toStringAsFixed(1),
                                                  style: const TextStyle(
                                                    color: Colors.white,
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.w700,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),

                                  // Details Area
                                  Expanded(
                                    child: Padding(
                                      padding: const EdgeInsets.all(10),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          // Dish Name
                                          Text(
                                            item.name,
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                            style: TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w800,
                                              color: isDark ? Colors.white : const Color(0xFF1F2937),
                                              height: 1.2,
                                            ),
                                          ),
                                          const SizedBox(height: 4),

                                          // Clean Simple Restaurant Name Only (No {en: ...})
                                          Row(
                                            children: [
                                              const Icon(Icons.storefront_outlined, size: 12, color: primaryColor),
                                              const SizedBox(width: 3),
                                              Expanded(
                                                child: Text(
                                                  cleanRestName,
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                  style: const TextStyle(
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.w600,
                                                    color: primaryColor,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),

                                          const Spacer(),

                                          // Price & Add Button Row
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text(
                                                '₹${item.price.toInt()}',
                                                style: const TextStyle(
                                                  fontSize: 15,
                                                  fontWeight: FontWeight.w900,
                                                  color: primaryColor,
                                                ),
                                              ),
                                              if (qty > 0)
                                                Container(
                                                  decoration: BoxDecoration(
                                                    color: primaryColor,
                                                    borderRadius: BorderRadius.circular(8),
                                                  ),
                                                  child: Row(
                                                    mainAxisSize: MainAxisSize.min,
                                                    children: [
                                                      GestureDetector(
                                                        onTap: () {
                                                          if (qty == 1) {
                                                            cart.removeItem(item.id);
                                                          } else {
                                                            cart.updateQuantity(item.id, qty - 1);
                                                          }
                                                        },
                                                        child: const Padding(
                                                          padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                                                          child: Icon(Icons.remove, size: 14, color: Colors.white),
                                                        ),
                                                      ),
                                                      Text(
                                                        '$qty',
                                                        style: const TextStyle(
                                                          color: Colors.white,
                                                          fontSize: 11,
                                                          fontWeight: FontWeight.w800,
                                                        ),
                                                      ),
                                                      GestureDetector(
                                                        onTap: () => _handleCartAdd(
                                                          context: context,
                                                          cart: cart,
                                                          product: item,
                                                          restaurantId: item.restaurantId ?? '',
                                                          restaurantName: cleanRestName,
                                                          restaurantImageUrl: item.restaurantImageUrl ?? item.image,
                                                        ),
                                                        child: const Padding(
                                                          padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                                                          child: Icon(Icons.add, size: 14, color: Colors.white),
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                )
                                              else
                                                GestureDetector(
                                                  onTap: () => _handleCartAdd(
                                                    context: context,
                                                    cart: cart,
                                                    product: item,
                                                    restaurantId: item.restaurantId ?? '',
                                                    restaurantName: cleanRestName,
                                                    restaurantImageUrl: item.restaurantImageUrl ?? item.image,
                                                  ),
                                                  child: Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                                                    decoration: BoxDecoration(
                                                      color: primaryColor,
                                                      borderRadius: BorderRadius.circular(8),
                                                    ),
                                                    child: const Row(
                                                      mainAxisSize: MainAxisSize.min,
                                                      children: [
                                                        Icon(Icons.add, size: 12, color: Colors.white),
                                                        SizedBox(width: 2),
                                                        Text(
                                                          'ADD',
                                                          style: TextStyle(
                                                            color: Colors.white,
                                                            fontSize: 11,
                                                            fontWeight: FontWeight.w800,
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                          childCount: _filteredProductsList.length,
                        ),
                      ),
                    ),

                  const SliverToBoxAdapter(child: SizedBox(height: 32)),
                ],
              ),
            ),
          ),

          // ── Sticky Bottom Cart Summary Bar & View Cart Button ──
          if (cart.itemCount > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
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
                          '${cart.itemCount} ${cart.itemCount == 1 ? 'ITEM' : 'ITEMS'}',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                          ),
                        ),
                        Text(
                          '₹${cart.totalAmount.toStringAsFixed(0)}',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: primaryColor,
                          ),
                        ),
                      ],
                    ),
                    ElevatedButton(
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const CartPage()),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: accentOrange,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
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
          border: Border.all(
            color: isSelected
                ? primaryColor
                : (isDark ? Colors.grey[800]! : const Color(0xFFE5E7EB)),
          ),
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

    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

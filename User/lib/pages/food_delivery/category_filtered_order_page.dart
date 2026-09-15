import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../core/models/product.dart';
import '../../providers/cart_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/dummy_data.dart';
import '../../services/restaurant_api_service.dart';
import '../../routes/app_routes.dart';
import '../../widgets/safe_image.dart';
import 'widgets/filters_bottom_sheet.dart';

class CategoryFilteredOrderPage extends StatefulWidget {
  final List<String> selectedCategories;

  const CategoryFilteredOrderPage({
    super.key,
    required this.selectedCategories,
  });

  @override
  State<CategoryFilteredOrderPage> createState() =>
      _CategoryFilteredOrderPageState();
}

class _CategoryFilteredOrderPageState
    extends State<CategoryFilteredOrderPage> {
  late List<String> _activeCategories;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  List<Product> _allProducts = [];
  bool _isLoading = true;
  Map<String, String> _appliedFilters = {};

  @override
  void initState() {
    super.initState();
    _activeCategories = List.from(widget.selectedCategories);
    _loadProducts();
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

  Future<void> _loadProducts() async {
    try {
      final menuItems =
          await RestaurantApiService.getRestaurantMenu('gourmet-kitchen');
      if (menuItems.isNotEmpty) {
        _allProducts = menuItems
            .map((item) => Product(
                  id: item.id,
                  name: item.name,
                  description: item.description,
                  price: item.price.toDouble(),
                  image: item.imageUrl,
                  category: item.category,
                  rating: item.rating,
                  isVeg: item.isVeg,
                ))
            .toList();
      } else {
        _allProducts = DummyData.getProducts();
      }
    } catch (_) {
      _allProducts = DummyData.getProducts();
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  List<Product> get _filteredProducts {
    return _allProducts.where((p) {
      final matchesSearch = _searchQuery.isEmpty ||
          p.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          p.category.toLowerCase().contains(_searchQuery.toLowerCase());

      final matchesCategory = _activeCategories.isEmpty ||
          _activeCategories.any((cat) {
            final catLower = cat.toLowerCase();
            final itemCatLower = p.category.toLowerCase();

            if (catLower == 'vegetarian' || catLower == 'veg') {
              return p.isVeg;
            }
            if (catLower == 'non-veg') {
              return !p.isVeg;
            }
            return itemCatLower.contains(catLower) ||
                catLower.contains(itemCatLower) ||
                p.name.toLowerCase().contains(catLower);
          });

      bool matchesDietary = true;
      if (_appliedFilters.containsKey('dietary')) {
        final d = _appliedFilters['dietary']!;
        if (d == 'Veg') matchesDietary = p.isVeg;
        if (d == 'Non-Veg') matchesDietary = !p.isVeg;
      }

      bool matchesPrice = true;
      if (_appliedFilters.containsKey('minPrice')) {
        final minP = double.tryParse(_appliedFilters['minPrice']!) ?? 0;
        matchesPrice = matchesPrice && p.price >= minP;
      }
      if (_appliedFilters.containsKey('maxPrice')) {
        final maxP = double.tryParse(_appliedFilters['maxPrice']!) ?? 9999;
        matchesPrice = matchesPrice && p.price <= maxP;
      }

      bool matchesRating = true;
      if (_appliedFilters.containsKey('minRating')) {
        final minR = double.tryParse(_appliedFilters['minRating']!) ?? 0;
        matchesRating = p.rating >= minR;
      }

      return matchesSearch && matchesCategory && matchesDietary && matchesPrice && matchesRating;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    const primaryColor = Color(0xFF248C70);
    const accentOrange = Color(0xFFE89D1E);
    final cart = context.watch<CartProvider>();

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF121212) : const Color(0xFFF5FAF8),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        foregroundColor: isDark ? Colors.white : Colors.black,
        elevation: 0,
        centerTitle: true,
        title: Column(
          children: [
            const Text(
              'Selected Food Menu',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),
            if (_activeCategories.isNotEmpty)
              Text(
                _activeCategories.join(' • '),
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: primaryColor,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
          ],
        ),
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
          // Search Bar & Filter Summary Header
          Container(
            color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 14),
            child: Column(
              children: [
                // Top Curved Category Banner ("What's on your mind?")
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E3A32) : primaryColor,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: primaryColor.withValues(alpha: 0.25),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              "What's on your mind?",
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                                letterSpacing: 0.2,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Text(
                                'Tap to Switch',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
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
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          itemCount: DummyData.getCategories().length,
                          itemBuilder: (context, index) {
                            final cat = DummyData.getCategories()[index];
                            final isSelected = _activeCategories.any((c) =>
                                c.toLowerCase().contains(cat.title.toLowerCase()) ||
                                cat.title.toLowerCase().contains(c.toLowerCase()));

                            final tabBgColor = isDark
                                ? const Color(0xFF121212)
                                : const Color(0xFFF5FAF8);

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
                                  Container(
                                    width: 44,
                                    height: 44,
                                    padding: const EdgeInsets.all(3),
                                    decoration: BoxDecoration(
                                      color: isSelected
                                          ? const Color(0xFFFFE8A3)
                                          : Colors.white,
                                      shape: BoxShape.circle,
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withValues(alpha: 0.1),
                                          blurRadius: 4,
                                          offset: const Offset(0, 2),
                                        ),
                                      ],
                                    ),
                                    child: ClipOval(
                                      child: SafeImage(
                                        cat.image,
                                        fit: BoxFit.cover,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    cat.title,
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: isSelected
                                          ? FontWeight.w800
                                          : FontWeight.w600,
                                      color: isSelected
                                          ? (isDark ? Colors.white : primaryColor)
                                          : Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                            );

                            return GestureDetector(
                              onTap: () {
                                setState(() {
                                  if (isSelected) {
                                    if (_activeCategories.length > 1) {
                                      _activeCategories.removeWhere((c) =>
                                          c.toLowerCase().contains(cat.title.toLowerCase()) ||
                                          cat.title.toLowerCase().contains(c.toLowerCase()));
                                    }
                                  } else {
                                    _activeCategories.add(cat.title);
                                  }
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

                // Search Field
                TextField(
                  controller: _searchController,
                  onChanged: (val) => setState(() => _searchQuery = val),
                  style: TextStyle(color: isDark ? Colors.white : Colors.black),
                  decoration: InputDecoration(
                    hintText: 'Search inside selected preferences...',
                    hintStyle: TextStyle(
                      color: isDark ? Colors.grey.shade500 : const Color(0xFF9CA3AF),
                      fontSize: 13,
                    ),
                    prefixIcon: const Icon(Icons.search_rounded, color: primaryColor),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear_rounded, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _searchQuery = '');
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: isDark ? const Color(0xFF2D2D2D) : const Color(0xFFF3F4F6),
                    contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 10),

                // Active Category Filter Chips & Filter Popup Trigger
                SizedBox(
                  height: 32,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      GestureDetector(
                        onTap: _openFilterModal,
                        child: Container(
                          margin: const EdgeInsets.only(right: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: _appliedFilters.isNotEmpty
                                ? accentOrange
                                : primaryColor.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
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
                                    ? 'Filter (${_appliedFilters.length})'
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
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: Chip(
                          backgroundColor: primaryColor.withValues(alpha: 0.12),
                          side: BorderSide.none,
                          padding: EdgeInsets.zero,
                          label: Text(
                            '${_filteredProducts.length} Items Found',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: primaryColor,
                            ),
                          ),
                        ),
                      ),
                      ..._activeCategories.map(
                        (cat) => Container(
                          margin: const EdgeInsets.only(right: 6),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: primaryColor,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                cat,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(width: 4),
                              GestureDetector(
                                onTap: () {
                                  if (_activeCategories.length > 1) {
                                    setState(() => _activeCategories.remove(cat));
                                  }
                                },
                                child: const Icon(
                                  Icons.close_rounded,
                                  size: 14,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Items List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: primaryColor))
                : _filteredProducts.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.restaurant_outlined,
                              size: 64,
                              color: isDark ? Colors.grey.shade700 : Colors.grey.shade300,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'No food items match your criteria',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
                        itemCount: _filteredProducts.length,
                        itemBuilder: (context, index) {
                          final item = _filteredProducts[index];
                          final cartItemIndex = cart.items.indexWhere(
                            (ci) => ci.product.id == item.id,
                          );
                          final qtyInCart = cartItemIndex >= 0
                              ? cart.items[cartItemIndex].quantity
                              : 0;

                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF1F2937) : Colors.white,
                              borderRadius: BorderRadius.circular(18),
                              boxShadow: [
                                if (!isDark)
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.04),
                                    blurRadius: 10,
                                    offset: const Offset(0, 2),
                                  ),
                              ],
                            ),
                            child: Row(
                              children: [
                                // Thumbnail Image
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(14),
                                  child: SafeImage(
                                    item.image,
                                    width: 85,
                                    height: 85,
                                    fit: BoxFit.cover,
                                  ),
                                ),
                                const SizedBox(width: 14),

                                // Food details
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Icon(
                                            Icons.circle,
                                            size: 10,
                                            color: item.isVeg ? Colors.green : Colors.red,
                                          ),
                                          const SizedBox(width: 6),
                                          Icon(
                                            Icons.star_rounded,
                                            size: 14,
                                            color: accentOrange,
                                          ),
                                          const SizedBox(width: 2),
                                          Text(
                                            '${item.rating}',
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w700,
                                              color: isDark ? Colors.grey.shade300 : Colors.black87,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        item.name,
                                        style: TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w800,
                                          color: isDark ? Colors.white : const Color(0xFF1F2937),
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        item.description,
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        '₹${item.price.toInt()}',
                                        style: const TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w800,
                                          color: primaryColor,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                                // Add / Quantity Controller
                                qtyInCart == 0
                                    ? ElevatedButton(
                                        onPressed: () {
                                          cart.addItem(
                                            item,
                                            restaurantId: 'rest_1',
                                            restaurantName: 'The Gourmet Kitchen',
                                            restaurantImageUrl: 'assets/static/restraunt.jpg',
                                            imageUrl: item.image,
                                          );
                                        },
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: primaryColor,
                                          foregroundColor: Colors.white,
                                          elevation: 0,
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 18, vertical: 10),
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                        ),
                                        child: const Text(
                                          'ADD',
                                          style: TextStyle(
                                            fontWeight: FontWeight.w800,
                                            fontSize: 13,
                                          ),
                                        ),
                                      )
                                    : Container(
                                        height: 36,
                                        decoration: BoxDecoration(
                                          color: primaryColor,
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Row(
                                          children: [
                                            IconButton(
                                              icon: const Icon(Icons.remove, size: 16, color: Colors.white),
                                              constraints: const BoxConstraints(minWidth: 32, minHeight: 36),
                                              padding: EdgeInsets.zero,
                                              onPressed: () {
                                                cart.updateQuantity(item.id, qtyInCart - 1);
                                              },
                                            ),
                                            Text(
                                              '$qtyInCart',
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.w800,
                                                fontSize: 13,
                                              ),
                                            ),
                                            IconButton(
                                              icon: const Icon(Icons.add, size: 16, color: Colors.white),
                                              constraints: const BoxConstraints(minWidth: 32, minHeight: 36),
                                              padding: EdgeInsets.zero,
                                              onPressed: () {
                                                cart.updateQuantity(item.id, qtyInCart + 1);
                                              },
                                            ),
                                          ],
                                        ),
                                      ),
                              ],
                            ),
                          );
                        },
                      ),
          ),

          // Bottom View Cart Summary Bar
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
                          '${cart.itemCount} ITEMS',
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
                      onPressed: () => context.push(AppRoutes.cart),
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


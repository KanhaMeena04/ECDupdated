import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../core/models/product.dart';
import '../core/models/restaurant_models.dart';
import '../providers/cart_provider.dart';
import '../providers/theme_provider.dart';
import '../providers/location_provider.dart';
import '../services/restaurant_api_service.dart';
import '../services/category_service.dart';
import '../services/location_service.dart';
import '../routes/app_routes.dart';
import 'safe_image.dart';

class QuickOrderSheet extends StatefulWidget {
  const QuickOrderSheet({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const QuickOrderSheet(),
    );
  }

  @override
  State<QuickOrderSheet> createState() => _QuickOrderSheetState();
}

class _QuickOrderSheetState extends State<QuickOrderSheet> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _selectedCategory = 'All';
  List<Product> _allProducts = [];
  List<String> _categories = ['All'];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadProducts();
    });
  }

  Future<void> _loadProducts() async {
    try {
      // 1. Fetch dynamic categories from DB
      final catTree = await CategoryService.getCategoryTree(forceRefresh: true);
      final dynamicCats = catTree
          .map((c) => c.name.trim())
          .where((n) => n.isNotEmpty)
          .toList();
      if (mounted) {
        setState(() {
          _categories = ['All', ...dynamicCats];
        });
      }

      // 2. Fetch restaurants strictly within 25km radius of user location
      final locProvider = Provider.of<LocationProvider>(context, listen: false);
      double? lat = locProvider.lat;
      double? lng = locProvider.lng;

      if (lat == null || lng == null || (lat == 0 && lng == 0)) {
        if (locProvider.location.isNotEmpty && locProvider.location != 'Select Location') {
          final coords = await getCoordinatesFromAddress(locProvider.location);
          if (coords != null) {
            lat = coords['lat'];
            lng = coords['lng'];
          }
        }
      }

      final nearbyRestaurants = await RestaurantApiService.getRestaurants(
        lat: lat,
        lng: lng,
        city: locProvider.location,
        address: locProvider.subAddress,
      );

      List<Product> items = [];

      for (final rest in nearbyRestaurants) {
        var menu = rest.menu;
        if (menu.isEmpty) {
          try {
            menu = await RestaurantApiService.getRestaurantMenu(rest.id);
          } catch (_) {}
        }

        for (final menuItem in menu) {
          if (menuItem.outOfStock) continue;
          items.add(Product(
            id: menuItem.id,
            name: menuItem.name,
            description: menuItem.description,
            price: menuItem.price > 0 ? menuItem.price : 149.0,
            image: menuItem.imageUrl,
            category: menuItem.category.isNotEmpty ? menuItem.category : 'General',
            rating: menuItem.rating > 0 ? menuItem.rating : (rest.rating > 0 ? rest.rating : 4.5),
            isVeg: menuItem.isVeg,
            restaurantId: rest.id,
            restaurantName: rest.name,
            restaurantImageUrl: rest.imageUrl,
          ));
        }
      }

      // 3. Shuffle nearby dishes randomly for real-time recommendation variety
      items.shuffle();

      if (mounted) {
        setState(() {
          _allProducts = items;
        });
      }
    } catch (e) {
      debugPrint('Error loading quick search products: $e');
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
      final matchesCat = _selectedCategory == 'All' ||
          p.category.toLowerCase() == _selectedCategory.toLowerCase();
      return matchesSearch && matchesCat;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    final primaryColor = const Color(0xFF248C70);
    final accentOrange = const Color(0xFFE89D1E);
    final cart = context.watch<CartProvider>();

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 20,
            spreadRadius: 5,
          ),
        ],
      ),
      child: Column(
        children: [
          // Drag handle
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 5,
            decoration: BoxDecoration(
              color: isDark ? Colors.grey.shade700 : Colors.grey.shade300,
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          const SizedBox(height: 12),

          // Header Title & Close Button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Quick Food Search',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : const Color(0xFF1F2937),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Order your favorite dish instantly',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? Colors.grey.shade400 : const Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(
                    Icons.close_rounded,
                    color: isDark ? Colors.grey.shade300 : Colors.grey.shade700,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),

          // Search Input Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: TextField(
              controller: _searchController,
              onChanged: (val) => setState(() => _searchQuery = val),
              style: TextStyle(color: isDark ? Colors.white : Colors.black),
              decoration: InputDecoration(
                hintText: 'Search food items, pizzas, burgers...',
                hintStyle: TextStyle(
                  color: isDark ? Colors.grey.shade500 : const Color(0xFF9CA3AF),
                  fontSize: 14,
                ),
                prefixIcon: Icon(
                  Icons.search_rounded,
                  color: primaryColor,
                ),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded, size: 20),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
                filled: true,
                fillColor: isDark ? const Color(0xFF2D2D2D) : const Color(0xFFF3F4F6),
                contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),

          const SizedBox(height: 14),

          // Category Filter Pills
          SizedBox(
            height: 38,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _categories.length,
              itemBuilder: (context, index) {
                final cat = _categories[index];
                final isSelected = _selectedCategory == cat;
                return GestureDetector(
                  onTap: () => setState(() => _selectedCategory = cat),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? primaryColor
                          : (isDark ? const Color(0xFF2D2D2D) : const Color(0xFFF3F4F6)),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      cat,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        color: isSelected
                            ? Colors.white
                            : (isDark ? Colors.grey.shade300 : const Color(0xFF4B5563)),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 16),

          // Food items list
          Expanded(
            child: _isLoading
                ? Center(child: CircularProgressIndicator(color: primaryColor))
                : _filteredProducts.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.fastfood_outlined,
                              size: 56,
                              color: isDark ? Colors.grey.shade700 : Colors.grey.shade300,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              _allProducts.isEmpty
                                  ? 'No dishes available from nearby restaurants\n(within 25 km radius)'
                                  : 'No dishes found matching search',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        itemCount: _filteredProducts.length,
                        itemBuilder: (context, index) {
                          final item = _filteredProducts[index];
                          final cartItemIndex = cart.items.indexWhere(
                            (ci) => ci.product.id == item.id,
                          );
                          final qtyInCart = cartItemIndex >= 0
                              ? cart.items[cartItemIndex].quantity
                              : 0;

                          return InkWell(
                            onTap: () {
                              final restId = item.restaurantId;
                              if (restId != null && restId.isNotEmpty) {
                                Navigator.pop(context);
                                context.push(
                                  '${AppRoutes.restaurantDetail}/$restId',
                                  extra: Restaurant(
                                    id: restId,
                                    slug: restId,
                                    name: item.restaurantName ?? 'Restaurant',
                                    imageUrl: item.restaurantImageUrl ?? item.image,
                                    rating: item.rating,
                                    reviewCount: 0,
                                    distanceKm: 2.5,
                                    deliveryTimeMin: 30,
                                    deliveryCharge: 0.0,
                                    cuisine: 'Fast Food',
                                    menu: const [],
                                  ),
                                );
                              }
                            },
                            borderRadius: BorderRadius.circular(18),
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 14),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF2A2A2A) : const Color(0xFFFAFAFA),
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(
                                  color: isDark
                                      ? Colors.grey.shade800
                                      : const Color(0xFFE5E7EB),
                                ),
                              ),
                              child: Row(
                                children: [
                                  // Thumbnail Image
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(14),
                                    child: SafeImage(
                                      item.image,
                                      width: 80,
                                      height: 80,
                                      fit: BoxFit.cover,
                                    ),
                                  ),

                                  const SizedBox(width: 14),

                                  // Food details
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        // Veg Tag & Rating
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

                                        // Item Name
                                        Text(
                                          item.name,
                                          style: TextStyle(
                                            fontSize: 15,
                                            fontWeight: FontWeight.w700,
                                            color: isDark ? Colors.white : const Color(0xFF1F2937),
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 2),
                                        // Restaurant Name Tag
                                        if (item.restaurantName != null && item.restaurantName!.isNotEmpty)
                                          Text(
                                            item.restaurantName!,
                                            style: TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w500,
                                              color: primaryColor,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        const SizedBox(height: 4),

                                        // Price
                                        Text(
                                          '₹${item.price}',
                                          style: TextStyle(
                                            fontSize: 15,
                                            fontWeight: FontWeight.w800,
                                            color: primaryColor,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),

                                  // Add / Quantity Controller Button
                                  qtyInCart == 0
                                      ? ElevatedButton(
                                          onPressed: () {
                                            cart.addItem(
                                              item,
                                              restaurantId: item.restaurantId ?? 'rest_main',
                                              restaurantName: item.restaurantName ?? 'Restaurant',
                                              restaurantImageUrl: item.restaurantImageUrl ?? item.image,
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
                            ),
                          );
                        },
                      ),
          ),

          // Cart Floating Footer Bar inside Sheet
          if (cart.itemCount > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF2D2D2D) : Colors.white,
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
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: primaryColor,
                          ),
                        ),
                      ],
                    ),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        context.push(AppRoutes.cart);
                      },
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

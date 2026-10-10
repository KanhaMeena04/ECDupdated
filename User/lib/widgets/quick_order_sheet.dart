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
  Map<String, Restaurant> _restaurantMap = {};
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
      final Map<String, String> catIdToNameMap = {};
      final Set<String> dynamicCats = {};

      for (final c in catTree) {
        final cName = c.name.trim();
        if (cName.isNotEmpty) {
          dynamicCats.add(cName);
          if (c.id.isNotEmpty) catIdToNameMap[c.id.toLowerCase()] = cName;
          if (c.slug.isNotEmpty) catIdToNameMap[c.slug.toLowerCase()] = cName;
        }
        for (final sub in c.subcategories) {
          final sName = sub.name.trim();
          if (sName.isNotEmpty) {
            dynamicCats.add(sName);
            if (sub.id.isNotEmpty) catIdToNameMap[sub.id.toLowerCase()] = sName;
            if (sub.slug.isNotEmpty) catIdToNameMap[sub.slug.toLowerCase()] = sName;
          }
        }
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
      final Map<String, Restaurant> restMap = {};

      for (final rest in nearbyRestaurants) {
        restMap[rest.id] = rest;
        var menu = rest.menu;
        if (menu.isEmpty) {
          try {
            menu = await RestaurantApiService.getRestaurantMenu(rest.id);
          } catch (_) {}
        }

        for (final menuItem in menu) {
          if (menuItem.outOfStock) continue;

          String resolvedCat = menuItem.category.trim();
          final isHexId = resolvedCat.length == 24 && RegExp(r'^[0-9a-fA-F]{24}$').hasMatch(resolvedCat);
          if (catIdToNameMap.containsKey(resolvedCat.toLowerCase())) {
            resolvedCat = catIdToNameMap[resolvedCat.toLowerCase()]!;
          } else if (catIdToNameMap.containsKey(menuItem.subcategory.toLowerCase())) {
            resolvedCat = catIdToNameMap[menuItem.subcategory.toLowerCase()]!;
          }

          if (resolvedCat.isEmpty || resolvedCat == 'General' || isHexId) {
            if (menuItem.subcategory.trim().isNotEmpty && menuItem.subcategory.length != 24) {
              resolvedCat = menuItem.subcategory.trim();
            } else {
              for (final c in dynamicCats) {
                if (menuItem.name.toLowerCase().contains(c.toLowerCase())) {
                  resolvedCat = c;
                  break;
                }
              }
            }
          }
          if (resolvedCat.isEmpty) resolvedCat = 'General';

          items.add(Product(
            id: menuItem.id,
            name: menuItem.name,
            description: menuItem.description,
            price: menuItem.price > 0 ? menuItem.price : 149.0,
            image: menuItem.imageUrl,
            category: resolvedCat,
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

      // Collect all dynamic categories:
      // Include all categories from DB category tree plus any unique categories from loaded dishes
      final Map<String, String> deduplicatedCats = {};
      void addCategory(String rawCat) {
        final trimmed = rawCat.trim();
        if (trimmed.isEmpty || trimmed == 'General' || (trimmed.length == 24 && RegExp(r'^[0-9a-fA-F]{24}$').hasMatch(trimmed))) return;
        final stemKey = _stem(trimmed);
        if (!deduplicatedCats.containsKey(stemKey)) {
          final titleCased = trimmed.split(' ').map((w) {
            if (w.isEmpty) return '';
            return '${w[0].toUpperCase()}${w.substring(1).toLowerCase()}';
          }).join(' ');
          deduplicatedCats[stemKey] = titleCased;
        }
      }

      for (final c in dynamicCats) {
        addCategory(c);
      }
      for (final p in items) {
        addCategory(p.category);
      }

      // Prioritize categories that actually have matching dishes so clicking them immediately shows results
      final List<String> matchingCategories = [];
      final List<String> otherCategories = [];

      for (final catName in deduplicatedCats.values) {
        final hasDishes = items.any((p) => _matchesCategory(p, catName));
        if (hasDishes) {
          matchingCategories.add(catName);
        } else {
          otherCategories.add(catName);
        }
      }

      final List<String> finalCategoryList = [
        'All',
        ...matchingCategories,
        ...otherCategories,
      ];

      if (mounted) {
        setState(() {
          _allProducts = items;
          _restaurantMap = restMap;
          _categories = finalCategoryList;
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

  static String _stem(String s) {
    var lower = s.trim().toLowerCase();
    if (lower.endsWith('ies') && lower.length > 4) {
      return lower.substring(0, lower.length - 3) + 'y';
    }
    if (lower.endsWith('es') && lower.length > 3) {
      return lower.substring(0, lower.length - 2);
    }
    if (lower.endsWith('s') && !lower.endsWith('ss') && lower.length > 2) {
      return lower.substring(0, lower.length - 1);
    }
    return lower;
  }

  bool _matchesCategory(Product p, String selectedCat) {
    if (selectedCat == 'All') return true;

    final target = selectedCat.trim().toLowerCase();
    final targetStem = _stem(target);

    final pCat = p.category.trim().toLowerCase();
    final pCatStem = _stem(pCat);

    final pName = p.name.trim().toLowerCase();
    final pDesc = p.description.trim().toLowerCase();

    // 1. Direct or substring category match
    if (pCat == target || pCat.contains(target) || target.contains(pCat)) {
      return true;
    }

    // 2. Stem match on category (e.g. "burgers" <-> "burger", "pizzas" <-> "pizza")
    if (pCatStem == targetStem || pCat.contains(targetStem) || targetStem.contains(pCatStem)) {
      return true;
    }

    // 3. Name match on target keyword or stem
    if (pName.contains(target) || pName.contains(targetStem)) {
      return true;
    }

    // 4. Description match on target keyword or stem
    if (targetStem.length >= 3 && (pDesc.contains(target) || pDesc.contains(targetStem))) {
      return true;
    }

    // 5. Semantic keyword mapping for popular food groups:
    if (targetStem.contains('burger') && (pName.contains('burger') || pCat.contains('burger') || pName.contains('patty') || pCat.contains('patty'))) {
      return true;
    }
    if (targetStem.contains('pizza') && (pName.contains('pizza') || pCat.contains('pizza') || pCat.contains('italian'))) {
      return true;
    }
    if (targetStem.contains('biryani') && (pName.contains('biryani') || pCat.contains('biryani') || pName.contains('pulao') || pCat.contains('pulao'))) {
      return true;
    }
    if (targetStem.contains('sandwich') && (pName.contains('sandwich') || pCat.contains('sandwich') || pName.contains('toast'))) {
      return true;
    }
    if (targetStem.contains('roll') && (pName.contains('roll') || pCat.contains('roll') || pName.contains('wrap') || pName.contains('kathi') || pName.contains('frankie'))) {
      return true;
    }
    if (targetStem.contains('noodle') || targetStem.contains('chowmein') || targetStem.contains('chinese')) {
      if (pName.contains('noodle') || pName.contains('chowmein') || pName.contains('manchurian') || pCat.contains('chinese') || pCat.contains('noodle')) {
        return true;
      }
    }
    if (targetStem.contains('beverage') || targetStem.contains('drink') || targetStem.contains('shake')) {
      if (pCat.contains('beverage') || pCat.contains('drink') || pCat.contains('shake') ||
          pName.contains('shake') || pName.contains('coffee') || pName.contains('juice') || pName.contains('mojito') || pName.contains('coke') || pName.contains('pepsi') || pName.contains('tea')) {
        return true;
      }
    }
    if (targetStem.contains('dessert') || targetStem.contains('sweet')) {
      if (pCat.contains('dessert') || pCat.contains('sweet') || pCat.contains('ice cream') || pCat.contains('bakery') ||
          pName.contains('cake') || pName.contains('pastry') || pName.contains('ice cream') || pName.contains('gulab jamun') || pName.contains('brownie') || pName.contains('halwa')) {
        return true;
      }
    }
    if (targetStem.contains('thali') || targetStem.contains('meal')) {
      if (pName.contains('thali') || pCat.contains('thali') || pName.contains('meal') || pCat.contains('meal')) {
        return true;
      }
    }
    if (targetStem.contains('momo')) {
      if (pName.contains('momo') || pCat.contains('momo') || pName.contains('dimsum')) {
        return true;
      }
    }
    if (targetStem.contains('chicken') && (pName.contains('chicken') || pCat.contains('chicken'))) {
      return true;
    }
    if (targetStem.contains('paneer') && (pName.contains('paneer') || pCat.contains('paneer'))) {
      return true;
    }
    if (targetStem.contains('dosa') || targetStem.contains('south')) {
      if (pName.contains('dosa') || pName.contains('idli') || pName.contains('uttapam') || pCat.contains('south')) {
        return true;
      }
    }

    return false;
  }

  List<Product> get _filteredProducts {
    return _allProducts.where((p) {
      final query = _searchQuery.trim().toLowerCase();
      final matchesSearch = query.isEmpty ||
          p.name.toLowerCase().contains(query) ||
          p.category.toLowerCase().contains(query) ||
          p.description.toLowerCase().contains(query) ||
          (p.restaurantName != null && p.restaurantName!.toLowerCase().contains(query));

      final matchesCat = _matchesCategory(p, _selectedCategory);

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
                                final rest = _restaurantMap[restId];
                                context.push(
                                  '${AppRoutes.restaurantDetail}/$restId',
                                  extra: rest ?? Restaurant(
                                    id: restId,
                                    slug: restId,
                                    name: item.restaurantName ?? 'Restaurant',
                                    imageUrl: item.restaurantImageUrl ?? item.image,
                                    rating: item.rating,
                                    reviewCount: 0,
                                    distanceKm: 0.0,
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

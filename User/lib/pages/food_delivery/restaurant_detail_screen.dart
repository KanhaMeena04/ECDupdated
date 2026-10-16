import 'dart:async';
import 'package:ecdkart_app/widgets/safe_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/models/restaurant_models.dart';
import '../../core/models/product.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/cart_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/restaurant_api_service.dart';
import '../cart/cart_page.dart';
import 'restaurant_profile_screen.dart';

class RestaurantDetailScreen extends StatefulWidget {
  final Restaurant? restaurant;
  final String? slug;
  final String? restaurantId;

  const RestaurantDetailScreen({
    super.key,
    this.restaurant,
    this.slug,
    this.restaurantId,
  });

  @override
  State<RestaurantDetailScreen> createState() => _RestaurantDetailScreenState();
}

class _RestaurantDetailScreenState extends State<RestaurantDetailScreen> {
  Restaurant? _restaurant;
  bool _isLoadingRestaurant = true;
  String _selectedCategory = 'All';
  List<MenuItem> _menu = [];
  bool _isLoadingMenu = true;
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();
  Timer? _recommendationTimer;
  int _recommendationSeed = 0;

  @override
  void initState() {
    super.initState();
    if (widget.restaurant != null) {
      _restaurant = widget.restaurant;
      _isLoadingRestaurant = false;
      _menu = widget.restaurant!.menu;
      if (_menu.isEmpty) {
        _fetchMenu();
      } else {
        _isLoadingMenu = false;
      }
    } else {
      _fetchRestaurantAndMenu();
    }

    // Periodic shuffle for recommendations (price, offer, reorders, rating)
    _recommendationTimer = Timer.periodic(const Duration(seconds: 8), (timer) {
      if (mounted && _menu.isNotEmpty) {
        setState(() {
          _recommendationSeed++;
        });
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _recommendationTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchRestaurantAndMenu() async {
    try {
      final identifier = (widget.slug != null && widget.slug!.isNotEmpty)
          ? widget.slug!
          : ((widget.restaurantId != null && widget.restaurantId!.isNotEmpty) ? widget.restaurantId! : '');
      if (identifier.isEmpty) {
        setState(() {
          _isLoadingRestaurant = false;
          _isLoadingMenu = false;
        });
        return;
      }

      final restaurant = await RestaurantApiService.getRestaurantDetails(identifier);
      final menu = await RestaurantApiService.getRestaurantMenu(restaurant.id.isNotEmpty ? restaurant.id : identifier);
      if (mounted) {
        setState(() {
          _restaurant = restaurant;
          _isLoadingRestaurant = false;
          _menu = menu;
          _isLoadingMenu = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching restaurant details: $e');
      if (mounted) {
        setState(() {
          _isLoadingRestaurant = false;
          _isLoadingMenu = false;
        });
      }
    }
  }

  Future<void> _fetchMenu() async {
    if (_restaurant == null) return;
    try {
      final identifier = _restaurant!.id.isNotEmpty ? _restaurant!.id : _restaurant!.slug;
      final menu = await RestaurantApiService.getRestaurantMenu(identifier);
      if (mounted) {
        setState(() {
          _menu = menu;
          _isLoadingMenu = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingMenu = false);
      }
    }
  }

  List<String> get _categories {
    final cats = _menu.map((m) => m.category.trim()).where((c) => c.isNotEmpty).toSet().toList();
    // Also include distinct subcategories (e.g. Cold Drinks) so user can filter them directly
    final subcats = _menu.map((m) => m.subcategory.trim()).where((s) => s.isNotEmpty).toSet().toList();
    cats.addAll(subcats);
    cats.sort();
    return ['All', ...cats];
  }

  List<MenuItem> get _filteredMenu {
    List<MenuItem> list = List.from(_menu);
    if (_selectedCategory != 'All') {
      final sel = _selectedCategory.toLowerCase().trim();
      list = list.where((m) =>
        m.category.toLowerCase().trim() == sel ||
        m.subcategory.toLowerCase().trim() == sel
      ).toList();
    }
    if (_searchQuery.trim().isNotEmpty) {
      final query = _searchQuery.toLowerCase().trim();
      list = list.where((m) =>
        m.name.toLowerCase().contains(query) ||
        m.category.toLowerCase().contains(query) ||
        m.subcategory.toLowerCase().contains(query) ||
        m.description.toLowerCase().contains(query)
      ).toList();
    }
    return list;
  }

  List<MenuItem> get _recommendedMenu {
    if (_menu.isEmpty) return [];
    List<MenuItem> list = List.from(_menu);
    // Score based on rating, offer price, and popularity
    list.sort((a, b) {
      final scoreA = (a.rating * 2) + (a.comparisonTag != null ? 5 : 0) + (a.originalPrice != null ? 3 : 0);
      final scoreB = (b.rating * 2) + (b.comparisonTag != null ? 5 : 0) + (b.originalPrice != null ? 3 : 0);
      return scoreB.compareTo(scoreA);
    });

    List<MenuItem> topPicks = list.take(6).toList();
    if (_recommendationSeed > 0) {
      topPicks = List.from(topPicks)..shuffle();
    }
    return topPicks;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;

    if (_isLoadingRestaurant) {
      return Scaffold(
        backgroundColor: isDark ? Colors.black : Colors.white,
        body: const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }

    if (_restaurant == null) {
      return Scaffold(
        backgroundColor: isDark ? Colors.black : Colors.white,
        appBar: AppBar(
          leading: IconButton(
            icon: Icon(Icons.arrow_back, color: isDark ? Colors.white : Colors.black),
            onPressed: () => Navigator.pop(context),
          ),
          backgroundColor: isDark ? Colors.black : Colors.white,
          elevation: 0,
        ),
        body: const Center(
          child: Text(
            'Restaurant not found or is currently unavailable',
            style: TextStyle(fontSize: 16, color: Colors.grey),
          ),
        ),
      );
    }

    final r = _restaurant!;
    final cartProvider = context.watch<CartProvider>();
    final cartCount = cartProvider.itemCount;
    final isFree = r.deliveryCharge == 0;

    return Scaffold(
      backgroundColor: isDark ? Colors.black : const Color(0xFFF5FAF8),
      body: CustomScrollView(
        slivers: [
          // ── Collapsible restaurant header ─────────────────────────────────
          SliverAppBar(
            expandedHeight: 260,
            pinned: true,
            backgroundColor: AppColors.primary,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new,
                  color: Colors.white, size: 20),
              onPressed: () => Navigator.pop(context),
            ),
            actions: [
              // Cart icon with badge
              Stack(
                alignment: Alignment.center,
                children: [
                  IconButton(
                    icon: const Icon(Icons.shopping_cart_outlined,
                        color: Colors.white, size: 24),
                    onPressed: () => _showCartSheet(context, cartProvider),
                  ),
                  if (cartCount > 0)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        width: 16,
                        height: 16,
                        decoration: const BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            '$cartCount',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 8),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  SafeImage(
                    r.imageUrl,
                    fit: BoxFit.cover,
                    loadingBuilder: (_, child, progress) => progress == null
                        ? child
                        : Container(
                            color: AppColors.primary.withValues(alpha: 0.15),
                            child: const Center(
                              child: CircularProgressIndicator(
                                  color: Colors.white),
                            ),
                          ),
                    errorBuilder: (_, __, ___) => Container(
                      color: AppColors.primary.withValues(alpha: 0.2),
                      child: const Icon(Icons.store,
                          size: 80, color: Colors.white54),
                    ),
                  ),
                  // Gradient
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Colors.black87],
                      ),
                    ),
                  ),
                  // Restaurant info overlay (Clicking opens RestaurantProfileScreen)
                  Positioned(
                    left: 16,
                    right: 16,
                    bottom: 16,
                    child: GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) =>
                                RestaurantProfileScreen(restaurant: r),
                          ),
                        );
                      },
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (!r.isActive)
                            Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                  color: Colors.red,
                                  borderRadius: BorderRadius.circular(20)),
                              child: const Text('Currently Offline',
                                  style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold)),
                            ),
                          Text(
                            r.name,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 24,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            r.cuisine,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                            ),
                          ),
                          if (r.address.trim().isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.location_on_outlined, color: Colors.white70, size: 13),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    r.address.trim(),
                                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ],
                          const SizedBox(height: 10),
                          // Stats row
                          Wrap(
                            spacing: 8,
                            runSpacing: 6,
                            children: [
                              _StatChip(
                                icon: Icons.star_rounded,
                                iconColor: Colors.amber,
                                label: '${r.rating > 0 ? r.rating.toStringAsFixed(1) : "New"} (${_fmt(r.reviewCount)} reviews) >',
                                onTap: () => _showReviewsSheet(context, r.id),
                              ),
                              _StatChip(
                                icon: Icons.access_time_rounded,
                                iconColor: Colors.white,
                                label: '${r.estimatedPreparationTime} mins',
                              ),
                              _StatChip(
                                icon: Icons.near_me_outlined,
                                iconColor: Colors.white,
                                label: '${r.distanceKm.toStringAsFixed(1)} km',
                              ),
                              _StatChip(
                                icon: Icons.circle,
                                iconColor: (r.isOpen && r.isActive) ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                                label: (r.isOpen && r.isActive) ? 'Open' : 'Closed',
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Closed Restaurant Warning Banner ──────────────────────────────
          if (!r.isOpen || !r.isActive)
            SliverToBoxAdapter(
              child: Container(
                width: double.infinity,
                color: const Color(0xFFFEE2E2),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    const Icon(Icons.warning_amber_rounded, color: Color(0xFFDC2626), size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        r.isTemporarilyClosed && r.kitchenBusyReason.isNotEmpty
                            ? 'Kitchen Busy: ${r.kitchenBusyReason}. Currently not accepting orders.'
                            : 'This restaurant is currently closed. You can explore the menu, but order placement is disabled.',
                        style: const TextStyle(
                          color: Color(0xFF991B1B),
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // ── Delivery / Self Pickup Switcher ────────────────────────────────
          SliverToBoxAdapter(
            child: Container(
              color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: r.isSelfPickupEnabled
                  ? Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.grey[850] : Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isDark ? Colors.grey[700]! : Colors.grey.shade300,
                        ),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () {
                                cartProvider.setOrderType('delivery');
                              },
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                decoration: BoxDecoration(
                                  color: !cartProvider.isSelfPickup ? AppColors.primary : Colors.transparent,
                                  borderRadius: BorderRadius.circular(8),
                                  boxShadow: !cartProvider.isSelfPickup
                                      ? [BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 4, offset: const Offset(0, 2))]
                                      : null,
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.delivery_dining,
                                      size: 18,
                                      color: !cartProvider.isSelfPickup ? Colors.white : (isDark ? Colors.grey[400] : Colors.grey[700]),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Delivery',
                                      style: TextStyle(
                                        color: !cartProvider.isSelfPickup ? Colors.white : (isDark ? Colors.grey[400] : Colors.grey[700]),
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: GestureDetector(
                              onTap: () {
                                cartProvider.setOrderType('pickup');
                              },
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                decoration: BoxDecoration(
                                  color: cartProvider.isSelfPickup ? AppColors.primary : Colors.transparent,
                                  borderRadius: BorderRadius.circular(8),
                                  boxShadow: cartProvider.isSelfPickup
                                      ? [BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 4, offset: const Offset(0, 2))]
                                      : null,
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.shopping_bag_outlined,
                                      size: 18,
                                      color: cartProvider.isSelfPickup ? Colors.white : (isDark ? Colors.grey[400] : Colors.grey[700]),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Self Pickup 🛍️',
                                      style: TextStyle(
                                        color: cartProvider.isSelfPickup ? Colors.white : (isDark ? Colors.grey[400] : Colors.grey[700]),
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    )
                  : Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.grey[850] : Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.delivery_dining, size: 18, color: AppColors.primary),
                          const SizedBox(width: 8),
                          Text(
                            'Home Delivery Available (Self-Pickup Not Supported)',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: isDark ? Colors.white70 : const Color(0xFF374151),
                            ),
                          ),
                        ],
                      ),
                    ),
            ),
          ),

          // ── Pinned Item Search Bar ───────────────────────────────────────
          SliverPersistentHeader(
            pinned: true,
            delegate: _SearchBarHeaderDelegate(
              controller: _searchController,
              onChanged: (val) => setState(() => _searchQuery = val),
              searchQuery: _searchQuery,
              restaurantName: r.name,
              isDark: isDark,
            ),
          ),

          // ── Dynamic Recommendation Section (Price, Offer, Last Order, Rating Shuffle) ──
          if (_searchQuery.isEmpty && _recommendedMenu.isNotEmpty)
            SliverToBoxAdapter(
              child: _RecommendedDishesSection(
                items: _recommendedMenu,
                restaurant: r,
                isDark: isDark,
                seed: _recommendationSeed,
              ),
            ),

          // ── Category filter chips ─────────────────────────────────
          SliverPersistentHeader(
            pinned: true,
            delegate: _CategoryHeaderDelegate(
              categories: _categories,
              selected: _selectedCategory,
              onSelect: (cat) => setState(() => _selectedCategory = cat),
            ),
          ),

          // â”€â”€ Menu items â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          _isLoadingMenu
              ? const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
                )
              : SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        return _MenuItemCard(
                          item: _filteredMenu[index],
                          cartProvider: cartProvider,
                          restaurantId: r.id,
                          restaurantName: r.name,
                          restaurantImageUrl: r.imageUrl,
                          restaurantAddress: r.address,
                          minOrderValue: r.minOrderValue,
                          restaurantIsOnline: r.isOnline && r.isOpen && !r.isTemporarilyClosed && r.isActive,
                          deliveryTimeMin: r.deliveryTimeMin,
                        );
                      },
                      childCount: _filteredMenu.length,
                    ),
                  ),
                ),
        ],
      ),

      // Sticky bottom cart bar
      bottomNavigationBar: cartCount > 0
          ? SafeArea(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _SavingsBar(cartProvider: cartProvider),
                  _CartBar(
                    cartProvider: cartProvider,
                    onViewCart: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => CartPage(restaurant: r),
                      ),
                    ),
                  ),
                ],
              ),
            )
          : null,

      // â”€â”€ Menu FAB â€” Rounded pill on the right â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      floatingActionButton: GestureDetector(
        onTap: () => _showMenuSheet(context),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0xFF2C2C2C),
            borderRadius: BorderRadius.circular(30),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.35),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.restaurant_menu, color: AppColors.primary, size: 18),
              SizedBox(width: 8),
              Text(
                'MENU',
                style: TextStyle(
                  color: AppColors.primary,
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
    );
  }

  String _fmt(int n) => n >= 1000 ? '${(n / 1000).toStringAsFixed(1)}k' : '$n';

  void _showCartSheet(BuildContext context, CartProvider cart) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _CartSheet(cart: cart),
    );
  }

  void _showReviewsSheet(BuildContext context, String restaurantId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final isDark = ctx.watch<ThemeProvider>().isDarkMode;
        return Container(
          height: MediaQuery.of(ctx).size.height * 0.7,
          padding: const EdgeInsets.only(top: 24, left: 16, right: 16),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1F2937) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              const Text('Customer Reviews', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              Expanded(
                child: FutureBuilder<List<dynamic>>(
                  future: RestaurantApiService.getRestaurantReviews(restaurantId),
                  builder: (ctx, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    if (!snapshot.hasData || snapshot.data!.isEmpty) {
                      return const Center(child: Text('No reviews yet.'));
                    }
                    final reviews = snapshot.data!;
                    return ListView.builder(
                      itemCount: reviews.length,
                      itemBuilder: (ctx, index) {
                        final rev = reviews[index];
                        final user = rev['user'] ?? {};
                        final name = user['name'] ?? 'User';
                        final rating = rev['rating']?.toString() ?? '5';
                        final comment = rev['comment'] ?? '';
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.grey[800] : Colors.grey[100],
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  CircleAvatar(
                                    radius: 16,
                                    backgroundColor: AppColors.primary,
                                    child: Text(name[0].toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 12)),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(child: Text(name, style: const TextStyle(fontWeight: FontWeight.bold))),
                                  const Icon(Icons.star, color: Colors.amber, size: 16),
                                  const SizedBox(width: 4),
                                  Text(rating, style: const TextStyle(fontWeight: FontWeight.bold)),
                                ],
                              ),
                              if (comment.isNotEmpty) ...[
                                const SizedBox(height: 8),
                                Text(comment, style: TextStyle(color: isDark ? Colors.white70 : Colors.black87, fontSize: 13)),
                              ]
                            ],
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // â”€â”€ Menu sheet â€” custom floating overlay matching the reference â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  void _showMenuSheet(BuildContext context) {
    final Map<String, int> catCounts = {};
    for (final item in _menu) {
      catCounts[item.category] = (catCounts[item.category] ?? 0) + 1;
    }
    final int totalItems = _menu.length;
    final isDark = context.read<ThemeProvider>().isDarkMode;

    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Menu',
      barrierColor: Colors.black.withValues(alpha: 0.6),
      transitionDuration: const Duration(milliseconds: 250),
      pageBuilder: (_, __, ___) => const SizedBox.shrink(),
      transitionBuilder: (ctx, anim, _, __) {
        final scale = Tween<double>(begin: 0.9, end: 1.0).animate(
          CurvedAnimation(parent: anim, curve: Curves.easeOutBack),
        );
        final opacity = Tween<double>(begin: 0.0, end: 1.0).animate(
          CurvedAnimation(parent: anim, curve: Curves.easeInOut),
        );

        return FadeTransition(
          opacity: opacity,
          child: ScaleTransition(
            scale: scale,
            child: Stack(
              children: [
                // â”€â”€ The white category box â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 40),
                    child: Material(
                      color: Colors.transparent,
                      child: Container(
                        constraints: BoxConstraints(
                          maxHeight: MediaQuery.of(context).size.height * 0.7,
                          maxWidth: 320,
                        ),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.grey[900] : Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(
                              color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.15),
                              blurRadius: 30,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(24),
                          child: SingleChildScrollView(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 24, vertical: 12),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                // Header (All items)
                                _MenuSheetRow(
                                  label: 'All Menu Categories',
                                  count: totalItems,
                                  isHeader: true,
                                  onTap: () {
                                    Navigator.pop(ctx);
                                    setState(() => _selectedCategory = 'All');
                                  },
                                ),
                                // Category list
                                ...catCounts.entries.map((e) {
                                  // Add "+" for some categories to match UI
                                  final bool hasAddIcon =
                                      e.key.contains('Meals') ||
                                          e.key.contains('Course');
                                  return _MenuSheetRow(
                                    label: e.key,
                                    count: e.value,
                                    isHeader: false,
                                    hasPlus: hasAddIcon,
                                    onTap: () {
                                      Navigator.pop(ctx);
                                      setState(() => _selectedCategory = e.key);
                                    },
                                  );
                                }),
                                const SizedBox(height: 8),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),

                // â”€â”€ Floating Close Button at bottom-right (Matches FAB) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                Positioned(
                  right: 16,
                  bottom: 16,
                  child: SafeArea(
                    child: Material(
                      color: Colors.transparent,
                      child: GestureDetector(
                        onTap: () => Navigator.pop(ctx),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 18, vertical: 12),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(30),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.35),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.close, color: Colors.white, size: 18),
                              SizedBox(width: 8),
                              Text(
                                'CLOSE',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

// â”€â”€ Stat chip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _StatChip extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label;
  final VoidCallback? onTap;

  const _StatChip({
    required this.icon,
    required this.iconColor,
    required this.label,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final chip = Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: iconColor, size: 13),
          const SizedBox(width: 4),
          Text(label,
              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
        ],
      ),
    );

    if (onTap != null) {
      return GestureDetector(onTap: onTap, child: chip);
    }
    return chip;
  }
}

// â”€â”€ Category filter header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _CategoryHeaderDelegate extends SliverPersistentHeaderDelegate {
  final List<String> categories;
  final String selected;
  final ValueChanged<String> onSelect;

  _CategoryHeaderDelegate({
    required this.categories,
    required this.selected,
    required this.onSelect,
  });

  @override
  double get minExtent => 52;
  @override
  double get maxExtent => 52;

  @override
  Widget build(
      BuildContext context, double shrinkOffset, bool overlapsContent) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    return Container(
      color: isDark ? Colors.black : Colors.white,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: categories.length,
        itemBuilder: (_, i) {
          final cat = categories[i];
          final isActive = cat == selected;
          return GestureDetector(
            onTap: () => onSelect(cat),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: isActive ? const Color(0xFFE89D1E) : (isDark ? Colors.grey[800] : const Color(0xFFF3F4F6)),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                cat,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                  color: isActive ? Colors.white : (isDark ? Colors.white70 : const Color(0xFF6B7280)),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  bool shouldRebuild(_CategoryHeaderDelegate old) =>
      old.selected != selected || old.categories != categories;
}

// ── Pinned Search Bar Header Delegate ────────────────────────────────────────
class _SearchBarHeaderDelegate extends SliverPersistentHeaderDelegate {
  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final String searchQuery;
  final String restaurantName;
  final bool isDark;

  _SearchBarHeaderDelegate({
    required this.controller,
    required this.onChanged,
    required this.searchQuery,
    required this.restaurantName,
    required this.isDark,
  });

  @override
  double get minExtent => 60.0;

  @override
  double get maxExtent => 60.0;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: isDark ? Colors.black : const Color(0xFFF5FAF8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      alignment: Alignment.center,
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: AppColors.primary.withValues(alpha: isDark ? 0.4 : 0.25),
            width: 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: TextField(
          controller: controller,
          onChanged: onChanged,
          style: TextStyle(fontSize: 14, color: isDark ? Colors.white : const Color(0xFF1F2937)),
          decoration: InputDecoration(
            hintText: 'Search dishes in $restaurantName...',
            hintStyle: TextStyle(
              fontSize: 13,
              color: isDark ? Colors.grey.shade500 : const Color(0xFF9CA3AF),
            ),
            prefixIcon: const Icon(Icons.search_rounded, color: AppColors.primary, size: 20),
            suffixIcon: searchQuery.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear_rounded, size: 18),
                    onPressed: () {
                      controller.clear();
                      onChanged('');
                    },
                  )
                : null,
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(vertical: 11),
          ),
        ),
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _SearchBarHeaderDelegate oldDelegate) {
    return oldDelegate.searchQuery != searchQuery ||
        oldDelegate.isDark != isDark ||
        oldDelegate.restaurantName != restaurantName;
  }
}

// â”€â”€ Menu item card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _MenuItemCard extends StatelessWidget {
  final MenuItem item;
  final CartProvider cartProvider;
  final String restaurantId;
  final String restaurantName;
  final String restaurantImageUrl;
  final String? restaurantAddress;
  final double minOrderValue;
  final bool restaurantIsOnline;
  final int deliveryTimeMin;

  const _MenuItemCard({
    required this.item,
    required this.cartProvider,
    required this.restaurantId,
    required this.restaurantName,
    required this.restaurantImageUrl,
    this.restaurantAddress,
    this.minOrderValue = 0.0,
    required this.restaurantIsOnline,
    this.deliveryTimeMin = 25,
  });

  // ── Extract only valid non-zero portions ──────────────────────────────────
  List<Map<String, dynamic>> _getAvailablePortions() {
    final List<Map<String, dynamic>> options = [];
    if (item.portionType == 'half_full' && item.portions != null) {
      final half = item.portions!['half'];
      final full = item.portions!['full'];
      if (half is Map) {
        final sp = (half['sellingPrice'] as num?)?.toDouble() ?? 0.0;
        final mrp = (half['mrp'] as num?)?.toDouble() ?? 0.0;
        if (sp > 0) {
          options.add({
            'key': 'half',
            'label': 'Half Plate',
            'price': sp,
            'mrp': mrp > sp ? mrp : null,
          });
        }
      }
      if (full is Map) {
        final sp = (full['sellingPrice'] as num?)?.toDouble() ?? 0.0;
        final mrp = (full['mrp'] as num?)?.toDouble() ?? 0.0;
        if (sp > 0) {
          options.add({
            'key': 'full',
            'label': 'Full Plate',
            'price': sp,
            'mrp': mrp > sp ? mrp : null,
          });
        }
      }
    } else if (item.portionType == 'size' && item.portions != null) {
      final s = item.portions!['small'];
      final m = item.portions!['medium'];
      final l = item.portions!['large'];
      if (s is Map) {
        final sp = (s['sellingPrice'] as num?)?.toDouble() ?? 0.0;
        final mrp = (s['mrp'] as num?)?.toDouble() ?? 0.0;
        if (sp > 0) options.add({'key': 'small', 'label': 'Small', 'price': sp, 'mrp': mrp > sp ? mrp : null});
      }
      if (m is Map) {
        final sp = (m['sellingPrice'] as num?)?.toDouble() ?? 0.0;
        final mrp = (m['mrp'] as num?)?.toDouble() ?? 0.0;
        if (sp > 0) options.add({'key': 'medium', 'label': 'Medium', 'price': sp, 'mrp': mrp > sp ? mrp : null});
      }
      if (l is Map) {
        final sp = (l['sellingPrice'] as num?)?.toDouble() ?? 0.0;
        final mrp = (l['mrp'] as num?)?.toDouble() ?? 0.0;
        if (sp > 0) options.add({'key': 'large', 'label': 'Large', 'price': sp, 'mrp': mrp > sp ? mrp : null});
      }
    } else if (item.variations.isNotEmpty) {
      for (var v in item.variations) {
        final vName = v['name'] is Map ? (v['name']['en'] ?? v['name'].values.first ?? 'Option') : (v['name'] ?? 'Option');
        final vPrice = (v['price'] as num?)?.toDouble() ?? 0.0;
        if (vPrice > 0 || item.price > 0) {
          options.add({
            'key': v['_id']?.toString() ?? vName.toString(),
            'label': vName.toString(),
            'price': vPrice > 0 ? vPrice : item.price,
            'mrp': null,
          });
        }
      }
    }

    if (options.isEmpty) {
      options.add({
        'key': 'standard',
        'label': 'Standard',
        'price': item.price,
        'mrp': item.originalPrice,
      });
    }
    return options;
  }

  // ── Show bottom sheet modal for portions & add-ons ────────────────────────
  void _showCustomizationBottomSheet(BuildContext context) {
    final availablePortions = _getAvailablePortions();
    String selectedPortionKey = availablePortions.first['key'] as String;
    final List<Map<String, dynamic>> selectedAddOns = [];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        return StatefulBuilder(
          builder: (context, setModalState) {
            final activePortion = availablePortions.firstWhere(
              (p) => p['key'] == selectedPortionKey,
              orElse: () => availablePortions.first,
            );
            final double portionPrice = (activePortion['price'] as num).toDouble();
            final double addOnsTotal = selectedAddOns.fold(0.0, (sum, a) => sum + ((a['price'] as num?)?.toDouble() ?? 0.0));
            final double grandTotal = portionPrice + addOnsTotal;

            return Container(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.82,
              ),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1F2937) : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Drag handle
                  Center(
                    child: Container(
                      margin: const EdgeInsets.only(top: 10, bottom: 6),
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade400,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),

                  // Header with item info & close button
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: SafeImage(
                            item.imageUrl,
                            width: 56,
                            height: 56,
                            fit: BoxFit.cover,
                          ),
                        ),
                        const SizedBox(width: 12),
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
                                        fontSize: 16,
                                        fontWeight: FontWeight.w800,
                                        color: isDark ? Colors.white : const Color(0xFF111827),
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 3),
                              Text(
                                'Customize your order',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? Colors.white60 : Colors.grey.shade600,
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: () => Navigator.pop(ctx),
                          icon: Icon(Icons.close, color: isDark ? Colors.white70 : Colors.grey.shade700),
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1),

                  // Scrollable Portion & Add-on list
                  Flexible(
                    child: ListView(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      shrinkWrap: true,
                      children: [
                        // Portion selection section
                        if (availablePortions.length > 1) ...[
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                item.portionType == 'size' ? 'SELECT SIZE' : 'SELECT PORTION',
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.5,
                                  color: Color(0xFF4B5563),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text(
                                  'REQUIRED',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.dark,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Container(
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF111827) : const Color(0xFFF9FAFB),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: isDark ? Colors.grey.shade800 : Colors.grey.shade200),
                            ),
                            child: Column(
                              children: availablePortions.map((portion) {
                                final isSelected = portion['key'] == selectedPortionKey;
                                final pPrice = (portion['price'] as num).toDouble();
                                final pMrp = portion['mrp'] as double?;

                                return InkWell(
                                  onTap: () {
                                    setModalState(() {
                                      selectedPortionKey = portion['key'] as String;
                                    });
                                  },
                                  borderRadius: BorderRadius.circular(12),
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                    child: Row(
                                      children: [
                                        Icon(
                                          isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
                                          color: isSelected ? AppColors.primary : Colors.grey.shade400,
                                          size: 20,
                                        ),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Text(
                                            portion['label'] as String,
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                              color: isDark ? Colors.white : const Color(0xFF1F2937),
                                            ),
                                          ),
                                        ),
                                        if (pMrp != null && pMrp > pPrice) ...[
                                          Text(
                                            '₹${pMrp.toInt()}',
                                            style: TextStyle(
                                              fontSize: 12,
                                              decoration: TextDecoration.lineThrough,
                                              color: Colors.grey.shade400,
                                            ),
                                          ),
                                          const SizedBox(width: 6),
                                        ],
                                        Text(
                                          '₹${pPrice.toInt()}',
                                          style: TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w800,
                                            color: isDark ? Colors.white : const Color(0xFF111827),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                          ),
                          const SizedBox(height: 18),
                        ],

                        // Add-ons / Flavors section
                        if (item.addOns.isNotEmpty) ...[
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'ADD-ONS & EXTRAS',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.5,
                                  color: Color(0xFF4B5563),
                                ),
                              ),
                              Text(
                                'OPTIONAL',
                                style: TextStyle(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.grey.shade500,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Container(
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF111827) : const Color(0xFFF9FAFB),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: isDark ? Colors.grey.shade800 : Colors.grey.shade200),
                            ),
                            child: Column(
                              children: item.addOns.map((addOn) {
                                final aName = addOn['name']?.toString() ?? '';
                                final aPrice = (addOn['price'] as num?)?.toDouble() ?? 0.0;
                                final isChecked = selectedAddOns.any((a) => a['name'] == aName);

                                return InkWell(
                                  onTap: () {
                                    setModalState(() {
                                      if (isChecked) {
                                        selectedAddOns.removeWhere((a) => a['name'] == aName);
                                      } else {
                                        selectedAddOns.add({'name': aName, 'price': aPrice});
                                      }
                                    });
                                  },
                                  borderRadius: BorderRadius.circular(12),
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                    child: Row(
                                      children: [
                                        Icon(
                                          isChecked ? Icons.check_box : Icons.check_box_outline_blank,
                                          color: isChecked ? AppColors.primary : Colors.grey.shade400,
                                          size: 20,
                                        ),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Text(
                                            aName,
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: isChecked ? FontWeight.w700 : FontWeight.w500,
                                              color: isDark ? Colors.white : const Color(0xFF1F2937),
                                            ),
                                          ),
                                        ),
                                        Text(
                                          '+₹${aPrice.toInt()}',
                                          style: TextStyle(
                                            fontSize: 13.5,
                                            fontWeight: FontWeight.w700,
                                            color: isDark ? Colors.greenAccent : const Color(0xFF15803D),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),

                  // Bottom Action Footer
                  Container(
                    padding: EdgeInsets.only(
                      left: 16,
                      right: 16,
                      top: 12,
                      bottom: MediaQuery.of(context).padding.bottom + 12,
                    ),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF111827) : Colors.white,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.08),
                          blurRadius: 10,
                          offset: const Offset(0, -3),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'TOTAL PRICE',
                              style: TextStyle(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w700,
                                color: Colors.grey.shade500,
                              ),
                            ),
                            Text(
                              '₹${grandTotal.toInt()}',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                                color: isDark ? Colors.white : const Color(0xFF111827),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              Navigator.pop(ctx);

                              final String pLabel = activePortion['label'] as String;
                              final String customName = availablePortions.length > 1
                                  ? '${item.name} ($pLabel)'
                                  : item.name;

                              final addOnSuffix = selectedAddOns.isNotEmpty
                                  ? ' + ${selectedAddOns.map((a) => a['name']).join(', ')}'
                                  : '';
                              final fullDisplayName = '$customName$addOnSuffix';

                              final customProductId = '${item.id}::${activePortion['key']}::${selectedAddOns.map((a) => a['name']).join('_')}';

                              final customProduct = Product(
                                id: customProductId,
                                name: fullDisplayName,
                                description: item.description,
                                price: grandTotal,
                                image: item.imageUrl,
                                category: item.category,
                                rating: item.rating,
                                isVeg: item.isVeg,
                              );

                              _directAddToCart(
                                context,
                                customProduct,
                                portion: activePortion['key'] == 'standard' ? null : (activePortion['key'] as String),
                                portionName: pLabel,
                                addOns: selectedAddOns,
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: AppColors.dark,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              elevation: 0,
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.shopping_bag_outlined, size: 18, color: AppColors.dark),
                                SizedBox(width: 8),
                                Text(
                                  'Add Item to Cart',
                                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
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
            );
          },
        );
      },
    );
  }

  // ── Direct add item with conflict detection ───────────────────────────────
  void _directAddToCart(
    BuildContext context,
    Product product, {
    String? portion,
    String? portionName,
    List<Map<String, dynamic>>? addOns,
  }) {
    if (cartProvider.isFromDifferentRestaurant(restaurantId)) {
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text(
            'Start new cart?',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
          ),
          content: RichText(
            text: TextSpan(
              style: const TextStyle(fontSize: 14, color: Color(0xFF374151), height: 1.5),
              children: [
                const TextSpan(text: 'Your cart has items from '),
                TextSpan(
                  text: cartProvider.restaurantName ?? 'another restaurant',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const TextSpan(
                    text: '.\n\nAdding items from a different restaurant will clear your current cart.'),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Keep current', style: TextStyle(color: Color(0xFF6B7280))),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                cartProvider.switchRestaurantAndAdd(
                  product,
                  restaurantId: restaurantId,
                  restaurantName: restaurantName,
                  restaurantImageUrl: restaurantImageUrl,
                  restaurantAddress: restaurantAddress,
                  deliveryTimeMin: deliveryTimeMin,
                  minOrderValue: minOrderValue,
                  imageUrl: item.imageUrl,
                  baseProductId: item.id,
                  portion: portion,
                  portionName: portionName,
                  addOns: addOns,
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.dark,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                elevation: 0,
              ),
              child: const Text('Start new cart', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      );
    } else {
      cartProvider.addItem(
        product,
        restaurantId: restaurantId,
        restaurantName: restaurantName,
        restaurantImageUrl: restaurantImageUrl,
        restaurantAddress: restaurantAddress,
        deliveryTimeMin: deliveryTimeMin,
        minOrderValue: minOrderValue,
        imageUrl: item.imageUrl,
        baseProductId: item.id,
        portion: portion,
        portionName: portionName,
        addOns: addOns,
      );
    }
  }

  // ── Handle Add click (Routes to customizer if customizable) ────────────────
  void _handleAdd(BuildContext context) {
    if (!restaurantIsOnline) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('⚠️ Restaurant is currently closed and not accepting orders.'),
          backgroundColor: Color(0xFFDC2626),
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }
    if (item.outOfStock) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('⚠️ Sorry, this item is currently out of stock / unavailable!'),
          backgroundColor: Color(0xFFDC2626),
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }

    if (item.hasCustomizations) {
      _showCustomizationBottomSheet(context);
    } else {
      _directAddToCart(context, item.toProduct());
    }
  }

  // ── Build formatted price display for portions / sizes ────────────────────
  Widget _buildPriceDisplay(bool isDark) {
    if (item.portionType == 'half_full' && item.portions != null) {
      final fullPrice = (item.portions!['full']?['sellingPrice'] as num?)?.toInt();
      final halfPrice = (item.portions!['half']?['sellingPrice'] as num?)?.toInt();
      if (fullPrice != null && fullPrice > 0 && halfPrice != null && halfPrice > 0) {
        return RichText(
          text: TextSpan(
            style: TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w800,
              color: isDark ? Colors.white : const Color(0xFF2C2C2C),
            ),
            children: [
              TextSpan(text: 'Full: ₹$fullPrice '),
              TextSpan(text: '• ', style: TextStyle(color: Colors.grey.shade400, fontWeight: FontWeight.normal)),
              TextSpan(text: 'Half: ₹$halfPrice'),
            ],
          ),
        );
      } else if (fullPrice != null && fullPrice > 0) {
        return Text('Full: ₹$fullPrice', style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800, color: isDark ? Colors.white : const Color(0xFF2C2C2C)));
      } else if (halfPrice != null && halfPrice > 0) {
        return Text('Half: ₹$halfPrice', style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800, color: isDark ? Colors.white : const Color(0xFF2C2C2C)));
      }
    } else if (item.portionType == 'size' && item.portions != null) {
      final s = (item.portions!['small']?['sellingPrice'] as num?)?.toInt();
      final m = (item.portions!['medium']?['sellingPrice'] as num?)?.toInt();
      final l = (item.portions!['large']?['sellingPrice'] as num?)?.toInt();
      final List<String> sizes = [];
      if (s != null && s > 0) sizes.add('S: ₹$s');
      if (m != null && m > 0) sizes.add('M: ₹$m');
      if (l != null && l > 0) sizes.add('L: ₹$l');
      if (sizes.isNotEmpty) {
        return Text(
          sizes.join(' • '),
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: isDark ? Colors.white : const Color(0xFF2C2C2C),
          ),
        );
      }
    }
    return Text(
      '₹${item.sellingPrice}',
      style: TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w800,
        color: isDark ? Colors.white : const Color(0xFF2C2C2C),
      ),
    );
  }

  Widget _buildPortionBadges(bool isDark) {
    if (!item.hasCustomizations) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Wrap(
        spacing: 6,
        runSpacing: 4,
        children: [
          if (item.portionType == 'half_full')
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: isDark ? Colors.grey[800] : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                'Half / Full available',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.grey[300] : const Color(0xFF475569),
                ),
              ),
            ),
          if (item.portionType == 'size')
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: isDark ? Colors.grey[800] : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                'Sizes available',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.grey[300] : const Color(0xFF475569),
                ),
              ),
            ),
          if (item.hasAddOns)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: isDark ? Colors.grey[800] : const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Text(
                '+ Add-ons',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF2563EB),
                ),
              ),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    final matchingItems = cartProvider.items.where((ci) => ci.product.id == item.id || ci.product.id.startsWith('${item.id}::')).toList();
    final inCart = matchingItems.isNotEmpty;
    final qty = matchingItems.fold(0, (sum, ci) => sum + ci.quantity);
    final bool hasImage = item.imageUrl.trim().isNotEmpty && item.imageUrl.trim() != 'null';

    Widget buildActionControl() {
      if (!restaurantIsOnline) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            color: Colors.grey[400],
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Text(
            'CLOSED',
            style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800),
          ),
        );
      }
      if (item.outOfStock) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF3B1F20) : const Color(0xFFFEE2E2),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.5)),
          ),
          child: const Text(
            'OUT OF STOCK',
            style: TextStyle(
              color: Color(0xFFEF4444),
              fontSize: 9.5,
              fontWeight: FontWeight.w800,
            ),
          ),
        );
      }
      if (inCart) {
        return _QtyControl(
          qty: qty,
          onAdd: () => _handleAdd(context),
          onRemove: () {
            if (matchingItems.isNotEmpty) {
              final lastItem = matchingItems.last;
              cartProvider.updateQuantity(lastItem.product.id, lastItem.quantity - 1);
            }
          },
        );
      }
      return _AddButton(
        onTap: () => _handleAdd(context),
        isCustomizable: item.hasCustomizations,
      );
    }

    Widget rightSide;
    if (hasImage) {
      rightSide = SizedBox(
        width: 124,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            SizedBox(
              height: 118,
              child: Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.topCenter,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: SafeImage(
                      item.imageUrl,
                      width: 124,
                      height: 100,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const SizedBox(width: 124, height: 100),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    child: buildActionControl(),
                  ),
                ],
              ),
            ),
            if (item.hasCustomizations) ...[
              const SizedBox(height: 4),
              Text(
                'customisable',
                style: TextStyle(
                  color: Colors.grey.shade500,
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ],
        ),
      );
    } else {
      // Exactly matching Screenshot 4 ("Simple Thali"):
      // No dummy/placeholder image at all; clean empty space with only ADD button on the right!
      rightSide = SizedBox(
        width: 105,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            buildActionControl(),
            if (item.hasCustomizations) ...[
              const SizedBox(height: 4),
              Text(
                'customisable',
                style: TextStyle(
                  color: Colors.grey.shade500,
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ],
        ),
      );
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey[900] : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border(
          bottom: BorderSide(
            color: isDark ? Colors.grey[800]! : const Color(0xFFF1F5F9),
            width: 1,
          ),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Left side: Details (Expanded) ─────────────────────────────────
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Veg / Non-Veg icon
                  Container(
                    width: 14,
                    height: 14,
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: item.isVeg ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                        width: 1.4,
                      ),
                      borderRadius: BorderRadius.circular(3),
                    ),
                    child: Center(
                      child: Container(
                        width: 6.5,
                        height: 6.5,
                        decoration: BoxDecoration(
                          color: item.isVeg ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 5),

                  // Item Name
                  Text(
                    item.name,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white : const Color(0xFF1F2937),
                    ),
                  ),

                  // Highly reordered or rating badge (matching Screenshot 4)
                  if (item.isRareOrSpecial || item.rating >= 4.0) ...[
                    const SizedBox(height: 4),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 22,
                          height: 5,
                          decoration: BoxDecoration(
                            color: const Color(0xFF16A34A),
                            borderRadius: BorderRadius.circular(2.5),
                          ),
                        ),
                        const SizedBox(width: 5),
                        Text(
                          'Highly reordered',
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.grey.shade600,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],

                  // Price
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: _buildPriceDisplay(isDark),
                  ),

                  // Portions & Addons Badges
                  _buildPortionBadges(isDark),

                  // Description
                  if (item.description.trim().isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      item.description,
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? Colors.white60 : Colors.grey.shade600,
                        height: 1.35,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
          ),

          // ── Right side: Image (if present) + ADD Button ───────────────────
          rightSide,
        ],
      ),
    );
  }
}

// ── Add button (Screenshot 4 style) ──────────────────────────────────────────
class _AddButton extends StatelessWidget {
  final VoidCallback onTap;
  final bool isCustomizable;
  const _AddButton({required this.onTap, this.isCustomizable = false});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 38,
        padding: const EdgeInsets.symmetric(horizontal: 18),
        decoration: BoxDecoration(
          color: const Color(0xFFF0FDF4),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFF15803D), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        alignment: Alignment.center,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Text(
              'ADD',
              style: TextStyle(
                color: Color(0xFF15803D),
                fontSize: 13.5,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.5,
              ),
            ),
            SizedBox(width: 4),
            Icon(Icons.add, size: 16, color: Color(0xFF15803D)),
          ],
        ),
      ),
    );
  }
}

// ── Quantity stepper (Screenshot 4 style) ────────────────────────────────────
class _QtyControl extends StatelessWidget {
  final int qty;
  final VoidCallback onAdd;
  final VoidCallback onRemove;

  const _QtyControl({required this.qty, required this.onAdd, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 38,
      decoration: BoxDecoration(
        color: const Color(0xFFF0FDF4),
        border: Border.all(color: const Color(0xFF15803D), width: 1.2),
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          GestureDetector(
            onTap: onRemove,
            child: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              child: Icon(Icons.remove, color: Color(0xFF15803D), size: 16),
            ),
          ),
          Text(
            '$qty',
            style: const TextStyle(
              color: Color(0xFF15803D),
              fontSize: 14,
              fontWeight: FontWeight.w800,
            ),
          ),
          GestureDetector(
            onTap: onAdd,
            child: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              child: Icon(Icons.add, color: Color(0xFF15803D), size: 16),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Sticky cart bar ────────────────────────────────────────────────────────
class _CartBar extends StatelessWidget {
  final CartProvider cartProvider;
  final VoidCallback onViewCart;

  const _CartBar({required this.cartProvider, required this.onViewCart});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 24),
      decoration: BoxDecoration(
        color: const Color(0xFF2C2C2C),
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.4),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onViewCart,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            child: Row(
              children: [
                if (cartProvider.items.isNotEmpty) ...[
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: cartProvider.items.last.product.image.isEmpty
                        ? Container(
                            width: 40,
                            height: 40,
                            color: Colors.grey[800],
                            child: const Icon(Icons.fastfood, color: Colors.white54, size: 20),
                          )
                        : SafeImage(
                            cartProvider.items.last.product.image,
                            width: 40,
                            height: 40,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                              width: 40,
                              height: 40,
                              color: Colors.grey[800],
                              child: const Icon(Icons.fastfood, color: Colors.white54, size: 20),
                            ),
                          ),
                  ),
                  const SizedBox(width: 12),
                ],
                Expanded(
                  child: Text(
                    '${cartProvider.itemCount} ${cartProvider.itemCount == 1 ? 'item' : 'items'} added',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const Text(
                  'View cart',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(width: 4),
                const Icon(Icons.arrow_forward,
                    color: AppColors.primary, size: 18),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// â”€â”€ Cart bottom sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _CartSheet extends StatelessWidget {
  final CartProvider cart;
  const _CartSheet({required this.cart});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    return Container(
      decoration: BoxDecoration(
        color: isDark ? Colors.grey[900] : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: const Color(0xFFE5E7EB),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Your Cart',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: isDark ? Colors.white : const Color(0xFF2C2C2C),
            ),
          ),
          const SizedBox(height: 16),
          // Cart items
          ConstrainedBox(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.4,
            ),
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: cart.items.length,
              itemBuilder: (_, i) {
                final ci = cart.items[i];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              ci.product.name,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: isDark ? Colors.white : const Color(0xFF2C2C2C),
                              ),
                            ),
                            Text(
                              '₹${ci.product.price.toInt()} × ${ci.quantity}',
                              style: const TextStyle(
                                fontSize: 12,
                                color: Color(0xFF9CA3AF),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '₹${ci.totalPrice.toInt()}',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white : const Color(0xFF2C2C2C),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          const Divider(),
          // Total
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Total',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : const Color(0xFF2C2C2C),
                ),
              ),
              Text(
                '₹${cart.totalAmount.toInt()}',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF248C70),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Checkout button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Proceeding to checkout...'),
                    backgroundColor: Colors.black,
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.black,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
              ),
              child: const Text(
                'Proceed to Checkout',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// â”€â”€ Savings Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _SavingsBar extends StatelessWidget {
  final CartProvider cartProvider;

  const _SavingsBar({required this.cartProvider});

  @override
  Widget build(BuildContext context) {
    final discount = cartProvider.discountAmount;
    final isFreeDelivery = cartProvider.deliveryFee == 0.0;
    if (discount <= 0 && !isFreeDelivery) return const SizedBox.shrink();

    final String savingsText = discount > 0
        ? 'You are saving ₹${discount.toStringAsFixed(0)} on this order!'
        : 'Free Delivery unlocked on this order!';

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF), // Light blue background
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFFDBEAFE), // Subtly darker blue border
          width: 1,
        ),
      ),
      child: Row(
        children: [
          // Blue percent badge icon
          Container(
            padding: const EdgeInsets.all(4),
            decoration: const BoxDecoration(
              color: Color(0xFF2563EB), // Rich blue
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.percent,
              color: Colors.white,
              size: 14,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              savingsText,
              style: const TextStyle(
                color: Color(0xFF1E40AF), // Darker blue for text
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// â”€â”€ Menu sheet row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Matches the reference: category name on left, item count on right.
// "Most loved" row is bold green; all others are regular black.
class _MenuSheetRow extends StatelessWidget {
  final String label;
  final int count;
  final bool isHeader;
  final bool hasPlus;
  final VoidCallback onTap;

  const _MenuSheetRow({
    required this.label,
    required this.count,
    required this.isHeader,
    this.hasPlus = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    const Color green = Color(0xFF248C70);
    final isDark = context.watch<ThemeProvider>().isDarkMode;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Row(
          children: [
            Expanded(
              child: Row(
                children: [
                  Flexible(
                    child: Text(
                      label,
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight:
                            isHeader ? FontWeight.w700 : FontWeight.w500,
                        color: isHeader ? green : (isDark ? Colors.white70 : const Color(0xFF4B5563)),
                        letterSpacing: -0.3,
                      ),
                    ),
                  ),
                  if (hasPlus) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        color: green.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.add, color: green, size: 14),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 12),
            Text(
              '$count',
              style: TextStyle(
                fontSize: 17,
                fontWeight: isHeader ? FontWeight.w700 : FontWeight.w500,
                color: isHeader ? green : (isDark ? Colors.grey[400] : const Color(0xFF6B7280)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// Dynamic Recommendation Section Widget (Periodic Shuffle: Price, Offer, Reorders, Rating)
// ─────────────────────────────────────────────
class _RecommendedDishesSection extends StatelessWidget {
  final List<MenuItem> items;
  final Restaurant restaurant;
  final bool isDark;
  final int seed;

  const _RecommendedDishesSection({
    required this.items,
    required this.restaurant,
    required this.isDark,
    required this.seed,
  });

  String _getRecommendationBadge(int index, MenuItem item) {
    final badges = [
      '🔥 Bestseller',
      '⭐ ${item.rating} Top Rated',
      '💰 Everyday Low Price',
      '🛒 Reordered 50+ times',
      '⚡ 40% Lower Price',
    ];
    return badges[(index + seed) % badges.length];
  }

  @override
  Widget build(BuildContext context) {
    final cartProvider = context.watch<CartProvider>();

    return Container(
      margin: const EdgeInsets.only(top: 8, bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.auto_awesome_rounded,
                        color: AppColors.primary,
                        size: 16,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Recommended For You',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: isDark ? Colors.white : const Color(0xFF1F2937),
                        letterSpacing: -0.2,
                      ),
                    ),
                  ],
                ),
                Text(
                  'Live Shuffling',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary.withValues(alpha: 0.8),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 2),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'Top picks based on price, offers, ratings & reorders',
              style: TextStyle(
                fontSize: 11,
                color: isDark ? Colors.grey.shade400 : const Color(0xFF6B7280),
              ),
            ),
          ),
          const SizedBox(height: 10),

          // Horizontal Dishes Cards
          SizedBox(
            height: 195,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: items.length,
              itemBuilder: (context, index) {
                final item = items[index];
                final badgeText = _getRecommendationBadge(index, item);

                return Container(
                  width: 140,
                  margin: const EdgeInsets.only(right: 12),
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: isDark ? 0.3 : 0.18),
                      width: 1.0,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Dish Image with Badge Tag
                      Stack(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: SafeImage(
                              item.imageUrl,
                              width: 124,
                              height: 90,
                              fit: BoxFit.cover,
                            ),
                          ),
                          // Top Recommendation Badge
                          Positioned(
                            top: 4,
                            left: 4,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                badgeText,
                                style: const TextStyle(
                                  fontSize: 8,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),

                      // Veg / Non-Veg dot + Title
                      Row(
                        children: [
                          Container(
                            width: 10,
                            height: 10,
                            padding: const EdgeInsets.all(1),
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: item.isVeg ? const Color(0xFF0F8A5F) : const Color(0xFFE53935),
                                width: 1,
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
                                fontSize: 11.5,
                                fontWeight: FontWeight.w800,
                                color: isDark ? Colors.white : const Color(0xFF1F2937),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),

                      const Spacer(),

                      // Price Row + Add Button
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                '₹${item.price.toInt()}',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w900,
                                  color: isDark ? Colors.white : const Color(0xFF111827),
                                ),
                              ),
                              Text(
                                '₹${item.effectiveOriginalPrice.toInt()}',
                                style: TextStyle(
                                  fontSize: 9.5,
                                  color: Colors.grey.shade500,
                                  decoration: TextDecoration.lineThrough,
                                ),
                              ),
                            ],
                          ),

                          // Add Button
                          Builder(
                            builder: (context) {
                              final bool isRestaurantOpen = restaurant.isOnline && restaurant.isOpen && !restaurant.isTemporarilyClosed && restaurant.isActive;
                              return GestureDetector(
                                onTap: () {
                                  if (!isRestaurantOpen) {
                                    ScaffoldMessenger.of(context).hideCurrentSnackBar();
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text('⚠️ Restaurant is currently closed and not accepting orders.'),
                                        backgroundColor: Color(0xFFDC2626),
                                        duration: Duration(seconds: 2),
                                      ),
                                    );
                                    return;
                                  }
                                  if (item.outOfStock) {
                                    ScaffoldMessenger.of(context).hideCurrentSnackBar();
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text('⚠️ Sorry, this item is currently out of stock!'),
                                        backgroundColor: Color(0xFFDC2626),
                                        duration: Duration(seconds: 2),
                                      ),
                                    );
                                    return;
                                  }
                                  if (cartProvider.isFromDifferentRestaurant(restaurant.id)) {
                                    showDialog(
                                      context: context,
                                      builder: (_) => AlertDialog(
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                        title: const Text('Start new cart?', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
                                        content: RichText(
                                          text: TextSpan(
                                            style: const TextStyle(fontSize: 14, color: Color(0xFF374151), height: 1.5),
                                            children: [
                                              const TextSpan(text: 'Your cart has items from '),
                                              TextSpan(text: cartProvider.restaurantName ?? 'another restaurant', style: const TextStyle(fontWeight: FontWeight.w700)),
                                              const TextSpan(text: '.\n\nAdding items from a different restaurant will clear your current cart.'),
                                            ],
                                          ),
                                        ),
                                        actions: [
                                          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Keep current', style: TextStyle(color: Color(0xFF6B7280)))),
                                          ElevatedButton(
                                            onPressed: () {
                                              Navigator.pop(context);
                                              cartProvider.switchRestaurantAndAdd(
                                                item.toProduct(),
                                                restaurantId: restaurant.id,
                                                restaurantName: restaurant.name,
                                                restaurantImageUrl: restaurant.imageUrl,
                                                restaurantAddress: restaurant.address,
                                                deliveryTimeMin: restaurant.deliveryTimeMin,
                                                minOrderValue: restaurant.minOrderValue,
                                                imageUrl: item.imageUrl,
                                              );
                                            },
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: AppColors.primary,
                                              foregroundColor: AppColors.dark,
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                              elevation: 0,
                                            ),
                                            child: const Text('Start new cart', style: TextStyle(fontWeight: FontWeight.w700)),
                                          ),
                                        ],
                                      ),
                                    );
                                    return;
                                  }

                                  cartProvider.addItem(
                                    item.toProduct(),
                                    restaurantId: restaurant.id,
                                    restaurantName: restaurant.name,
                                    restaurantImageUrl: restaurant.imageUrl,
                                    restaurantAddress: restaurant.address,
                                    deliveryTimeMin: restaurant.deliveryTimeMin,
                                    minOrderValue: restaurant.minOrderValue,
                                    imageUrl: item.imageUrl,
                                  );
                                  ScaffoldMessenger.of(context).hideCurrentSnackBar();
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text('Added ${item.name} to cart!'),
                                      backgroundColor: AppColors.primary,
                                      duration: const Duration(seconds: 1),
                                      behavior: SnackBarBehavior.floating,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                    ),
                                  );
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: !isRestaurantOpen
                                        ? Colors.grey.shade400
                                        : (item.outOfStock ? Colors.red.shade400 : AppColors.primary),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    !isRestaurantOpen
                                        ? 'CLOSED'
                                        : (item.outOfStock ? 'UNAVAIL' : 'ADD'),
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w900,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              );
                            },
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
    );
  }
}

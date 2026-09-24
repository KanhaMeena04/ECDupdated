import 'package:ecdkart_app/widgets/safe_image.dart';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../services/restaurant_api_service.dart';
import '../../core/models/restaurant_models.dart';
import '../../routes/app_routes.dart';
import '../food_delivery/restaurant_detail_screen.dart';
import '../../providers/theme_provider.dart';
import 'package:provider/provider.dart';

class SearchPage extends StatefulWidget {
  const SearchPage({super.key});

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final _searchController = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  
  List<Restaurant> _searchResults = [];
  List<String> _suggestions = [];
  List<String> _recentSearches = [];
  
  bool _isLoading = false;
  bool _isSearching = false;
  Timer? _debounce;
  String _selectedFilter = 'All';

  final List<String> _popularCuisines = ['Biryani', 'Pizza', 'Burger', 'Chinese', 'Thali', 'Desserts', 'South Indian'];
  final List<String> _filters = ['All', 'Veg Only', 'Rating 4.0+', 'Fast Delivery'];

  @override
  void initState() {
    super.initState();
    _loadRecentSearches();
    _focusNode.requestFocus();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _focusNode.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _loadRecentSearches() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _recentSearches = prefs.getStringList('recent_searches') ?? [];
    });
  }

  Future<void> _saveSearch(String query) async {
    if (query.trim().isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    _recentSearches.remove(query);
    _recentSearches.insert(0, query);
    if (_recentSearches.length > 5) _recentSearches.removeLast();
    await prefs.setStringList('recent_searches', _recentSearches);
    setState(() {});
  }

  void _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce?.cancel();
    
    if (query.isEmpty) {
      setState(() {
        _suggestions = [];
        _isSearching = false;
      });
      return;
    }

    setState(() => _isSearching = true);

    _debounce = Timer(const Duration(milliseconds: 300), () async {
      final suggestions = await RestaurantApiService.getSuggestions(query);
      if (mounted) {
        setState(() {
          _suggestions = suggestions;
        });
      }
    });
  }

  Future<void> _performSearch(String query) async {
    if (query.trim().isEmpty) return;
    
    _focusNode.unfocus();
    _saveSearch(query);
    
    setState(() {
      _isLoading = true;
      _isSearching = true;
      _suggestions = [];
    });

    final results = await RestaurantApiService.searchRestaurants(query);
    
    if (mounted) {
      setState(() {
        _searchResults = results;
        _isLoading = false;
      });
    }
  }

  List<Restaurant> get _filteredResults {
    if (_selectedFilter == 'All') return _searchResults;
    if (_selectedFilter == 'Veg Only') {
       return _searchResults.where((r) => r.cuisine.toLowerCase().contains('veg')).toList();
    }
    if (_selectedFilter == 'Rating 4.0+') {
      return _searchResults.where((r) => r.rating >= 4.0).toList();
    }
    if (_selectedFilter == 'Fast Delivery') {
      return _searchResults.where((r) => r.deliveryTimeMin <= 30).toList();
    }
    return _searchResults;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    return Scaffold(
      backgroundColor: isDark ? Colors.black : Colors.white,
      appBar: AppBar(
        backgroundColor: isDark ? Colors.black : Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, color: isDark ? Colors.white : Colors.black, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Container(
          height: 45,
          decoration: BoxDecoration(
            color: isDark ? Colors.white10 : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE89D1E)),
          ),
          child: TextField(
            controller: _searchController,
            focusNode: _focusNode,
            onChanged: _onSearchChanged,
            onSubmitted: _performSearch,
            style: TextStyle(color: isDark ? Colors.white : Colors.black),
            decoration: InputDecoration(
              hintText: 'Search for biryani, pizza...',
              hintStyle: TextStyle(color: isDark ? Colors.grey[400] : Colors.grey[500], fontSize: 14),
              prefixIcon: const Icon(Icons.search, color: Color(0xFFE89D1E), size: 20),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.cancel, color: Colors.grey, size: 18),
                      onPressed: () {
                        _searchController.clear();
                        setState(() {
                          _searchResults = [];
                          _suggestions = [];
                          _isSearching = false;
                        });
                        _focusNode.requestFocus();
                      },
                    )
                  : null,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
            ),
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : Column(
              children: [
                if (_searchResults.isNotEmpty) _buildFilterBar(),
                Expanded(child: _buildContent()),
              ],
            ),
    );
  }

  Widget _buildFilterBar() {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _filters.length,
        itemBuilder: (context, index) {
          final filter = _filters[index];
          final isSelected = _selectedFilter == filter;
          return Padding(
            padding: const EdgeInsets.only(right: 10),
            child: ChoiceChip(
              label: Text(filter),
              selected: isSelected,
              onSelected: (selected) {
                setState(() => _selectedFilter = filter);
              },
              selectedColor: AppColors.primary,
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : (isDark ? Colors.white : Colors.black),
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
              backgroundColor: isDark ? Colors.black : Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(color: isSelected ? AppColors.primary : (isDark ? Colors.grey[800]! : Colors.grey[300]!)),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildContent() {
    if (!_isSearching && _searchController.text.isEmpty) {
      return _buildInitialState();
    }
    
    if (_suggestions.isNotEmpty && _searchResults.isEmpty) {
      return _buildSuggestionsList();
    }

    if (_searchResults.isEmpty && _searchController.text.isNotEmpty && !_isLoading) {
      return _buildEmptyResults();
    }

    return _buildResultsList();
  }

  Widget _buildInitialState() {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_recentSearches.isNotEmpty) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Recent Searches', style: AppTextStyles.h4.copyWith(color: isDark ? Colors.white : Colors.black)),
                TextButton(
                  onPressed: () async {
                    final prefs = await SharedPreferences.getInstance();
                    await prefs.remove('recent_searches');
                    setState(() => _recentSearches = []);
                  },
                  child: const Text('Clear All', style: TextStyle(color: Colors.grey, fontSize: 12)),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: _recentSearches.map((s) => _buildChip(s, isRecent: true)).toList(),
            ),
            const SizedBox(height: 30),
          ],
          Text('Popular Cuisines', style: AppTextStyles.h4.copyWith(color: isDark ? Colors.white : Colors.black)),
          const SizedBox(height: 15),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 4,
              mainAxisSpacing: 15,
              crossAxisSpacing: 15,
              childAspectRatio: 0.75, // fixed bottom overflow by giving more vertical space
            ),
            itemCount: _popularCuisines.length,
            itemBuilder: (context, index) {
              final cuisine = _popularCuisines[index];
              return GestureDetector(
                onTap: () {
                  _searchController.text = cuisine;
                  _performSearch(cuisine);
                },
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE89D1E).withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.fastfood, color: Color(0xFFE89D1E), size: 24),
                    ),
                    const SizedBox(height: 8),
                    Text(cuisine, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: isDark ? Colors.white : Colors.black), textAlign: TextAlign.center),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildChip(String label, {bool isRecent = false}) {
    final isDark = context.read<ThemeProvider>().isDarkMode;
    return GestureDetector(
      onTap: () {
        _searchController.text = label;
        _performSearch(label);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isDark ? Colors.white10 : Colors.white,
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: isDark ? Colors.grey[800]! : Colors.grey[200]!),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isRecent) const Icon(Icons.history, size: 14, color: Colors.grey),
            if (isRecent) const SizedBox(width: 6),
            Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: isDark ? Colors.white : Colors.black)),
          ],
        ),
      ),
    );
  }

  Widget _buildSuggestionsList() {
    final isDark = context.read<ThemeProvider>().isDarkMode;
    return ListView.builder(
      itemCount: _suggestions.length,
      itemBuilder: (context, index) {
        final s = _suggestions[index];
        return ListTile(
          leading: Icon(Icons.search, color: isDark ? Colors.grey[600] : Colors.grey[400], size: 18),
          title: Text(s, style: TextStyle(fontSize: 14, color: isDark ? Colors.white : Colors.black)),
          trailing: const Icon(Icons.north_west, color: Colors.grey, size: 16),
          onTap: () {
            _searchController.text = s;
            _performSearch(s);
          },
        );
      },
    );
  }

  Widget _buildEmptyResults() {
    final isDark = context.read<ThemeProvider>().isDarkMode;
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off_rounded, size: 100, color: isDark ? Colors.grey[800] : Colors.grey[200]),
          const SizedBox(height: 20),
          Text('No matching restaurants', style: AppTextStyles.h3.copyWith(color: isDark ? Colors.white : Colors.black)),
          const SizedBox(height: 10),
          Text('Try a different search term', style: TextStyle(color: Colors.grey[500])),
        ],
      ),
    );
  }

  Widget _buildResultsList() {
    final isDark = context.read<ThemeProvider>().isDarkMode;
    final results = _filteredResults;
    if (results.isEmpty) {
       return Center(child: Text('No results match your filters', style: TextStyle(color: Colors.grey)));
    }

    final query = _searchController.text.toLowerCase();
    List<Map<String, dynamic>> matchingItems = [];
    for (var r in results) {
      for (var item in r.menu) {
        if (item.name.toLowerCase().contains(query)) {
          matchingItems.add({'item': item, 'restaurant': r});
        }
      }
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (matchingItems.isNotEmpty) ...[
          Text('Food Items', style: AppTextStyles.h3.copyWith(color: isDark ? Colors.white : Colors.black)),
          const SizedBox(height: 10),
          ...matchingItems.map((data) => _buildFoodItemCard(data['item'] as MenuItem, data['restaurant'] as Restaurant, isDark)),
          const SizedBox(height: 20),
        ],
        if (results.isNotEmpty) ...[
          Text('Restaurants', style: AppTextStyles.h3.copyWith(color: isDark ? Colors.white : Colors.black)),
          const SizedBox(height: 10),
          ...results.map((r) => _buildRestaurantCard(r, isDark)),
        ]
      ],
    );
  }

  Widget _buildFoodItemCard(MenuItem item, Restaurant restaurant, bool isDark) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => RestaurantDetailScreen(restaurant: restaurant),
        ),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1F2937) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            if (isDark)
              BoxShadow(
                color: AppColors.primary.withOpacity(0.15),
                blurRadius: 10,
                spreadRadius: 1,
                offset: const Offset(0, 4),
              )
            else
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Left Image
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Stack(
                  children: [
                    SafeImage(
                      item.imageUrl,
                      width: 110,
                      height: 110,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        width: 110,
                        height: 110,
                        color: Colors.grey[200],
                        child: const Icon(Icons.fastfood, color: Colors.grey, size: 40),
                      ),
                    ),
                    if (!restaurant.isActive)
                      Positioned.fill(
                        child: Container(
                          color: Colors.white.withValues(alpha: 0.6),
                          child: Center(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.black87,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text(
                                'OFFLINE',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10),
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            const SizedBox(width: 16),
            // Right Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Veg/Non-veg & Title
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        margin: const EdgeInsets.only(top: 4, right: 8),
                        width: 14,
                        height: 14,
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
                      Expanded(
                        child: Text(
                          item.name,
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                            color: isDark ? Colors.white : Colors.black87,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  // Description
                  Text(
                    item.description.isNotEmpty ? item.description : 'Delicious and freshly prepared ${item.name}',
                    style: TextStyle(color: isDark ? Colors.grey[400] : Colors.grey[500], fontSize: 13, height: 1.4),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  // Rating & Category
                  Row(
                    children: [
                      const Icon(Icons.star, color: Colors.orange, size: 16),
                      const SizedBox(width: 4),
                      Text(
                        item.rating > 0 ? item.rating.toStringAsFixed(1) : '4.0',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: isDark ? Colors.white : Colors.black),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white10 : Colors.grey[100],
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          item.category.isNotEmpty ? item.category : 'General',
                          style: TextStyle(color: isDark ? Colors.grey[400] : Colors.grey[600], fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Price & Add Button
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '₹${item.price.toInt()}',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                          color: isDark ? Colors.white : Colors.black,
                        ),
                      ),
                      ElevatedButton(
                        onPressed: !restaurant.isActive
                            ? null
                            : () => Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => RestaurantDetailScreen(restaurant: restaurant),
                                  ),
                                ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: restaurant.isActive ? const Color(0xFF248C70) : Colors.grey[400],
                          foregroundColor: Colors.white,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: Text(restaurant.isActive ? 'ADD' : 'DISABLED', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRestaurantCard(Restaurant restaurant, bool isDark) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => RestaurantDetailScreen(restaurant: restaurant),
        ),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 20),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1F2937) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            if (isDark)
              BoxShadow(color: AppColors.primary.withOpacity(0.15), blurRadius: 10, spreadRadius: 1, offset: const Offset(0, 4))
            else
              BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              child: Stack(
                children: [
                  SafeImage(
                    restaurant.imageUrl,
                    height: 160,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      height: 160,
                      width: double.infinity,
                      color: Colors.grey[100],
                      child: const Icon(Icons.restaurant, size: 40, color: Colors.grey),
                    ),
                  ),
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.star, color: Colors.orange, size: 14),
                          const SizedBox(width: 4),
                          Text(restaurant.rating.toString(),
                              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),
                  if (!restaurant.isActive)
                    Positioned.fill(
                      child: Container(
                        color: Colors.white.withValues(alpha: 0.6),
                        child: Center(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.black87,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Text(
                              'CURRENTLY OFFLINE',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.0),
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(15),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(restaurant.name, style: AppTextStyles.h4.copyWith(color: isDark ? Colors.white : Colors.black)),
                      ),
                      Text('${restaurant.deliveryTimeMin} mins',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.primary)),
                    ],
                  ),
                  const SizedBox(height: 5),
                  Text(restaurant.cuisine, style: TextStyle(color: isDark ? Colors.grey[400] : Colors.grey[600], fontSize: 13)),
                  const SizedBox(height: 10),
                  Divider(height: 1, color: isDark ? Colors.grey[800] : Colors.grey[300]),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Icon(Icons.local_offer_outlined, color: Colors.orange[700], size: 16),
                      const SizedBox(width: 6),
                      Text('40% OFF up to ₹80', style: TextStyle(color: Colors.orange[700], fontSize: 12, fontWeight: FontWeight.w600)),
                    ],
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

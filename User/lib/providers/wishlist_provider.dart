import 'dart:convert';
import 'package:ecdkart_app/core/models/product.dart';
import 'package:ecdkart_app/core/models/restaurant_models.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/restaurant_api_service.dart';

class WishlistProvider with ChangeNotifier {
  final List<Product> _items = [];
  final Set<String> _favoriteRestaurantIds = {};
  final List<Restaurant> _favoriteRestaurants = [];
  bool _isLoaded = false;

  List<Product> get items => _items;
  Set<String> get favoriteRestaurantIds => _favoriteRestaurantIds;
  List<Restaurant> get favoriteRestaurants => _favoriteRestaurants;
  bool get isLoaded => _isLoaded;

  WishlistProvider() {
    _loadFromPrefs();
  }

  Future<void> _loadFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final restIds = prefs.getStringList('user_fav_restaurant_ids') ?? [];
      _favoriteRestaurantIds.addAll(restIds);

      final restStrings = prefs.getStringList('user_fav_restaurants') ?? [];
      _favoriteRestaurants.clear();
      for (final str in restStrings) {
        try {
          final map = jsonDecode(str);
          if (map is Map<String, dynamic>) {
            _favoriteRestaurants.add(Restaurant.fromJson(map));
          }
        } catch (_) {}
      }

      final productStrings = prefs.getStringList('user_fav_products') ?? [];
      _items.clear();
      for (final str in productStrings) {
        try {
          final map = jsonDecode(str);
          if (map is Map<String, dynamic>) {
            _items.add(Product.fromJson(map));
          }
        } catch (_) {}
      }
      _isLoaded = true;
      notifyListeners();

      // Hydrate any restaurant IDs that don't have objects yet
      syncFavoriteRestaurants();
    } catch (e) {
      debugPrint('Error loading wishlist from prefs: $e');
    }
  }

  Future<void> syncFavoriteRestaurants() async {
    if (_favoriteRestaurantIds.isEmpty) return;
    final missingIds = _favoriteRestaurantIds
        .where((id) => !_favoriteRestaurants.any((r) => r.id == id))
        .toList();
    if (missingIds.isEmpty) return;

    try {
      final all = await RestaurantApiService.getRestaurants();
      bool changed = false;
      for (final id in missingIds) {
        final match = all.where((r) => r.id == id).firstOrNull;
        if (match != null) {
          _favoriteRestaurants.add(match);
          changed = true;
        }
      }
      if (changed) {
        _saveToPrefs();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error syncing missing favorite restaurants: $e');
    }
  }

  Future<void> _saveToPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(
        'user_fav_restaurant_ids',
        _favoriteRestaurantIds.toList(),
      );
      final restStrings = _favoriteRestaurants.map((r) => jsonEncode(r.toJson())).toList();
      await prefs.setStringList('user_fav_restaurants', restStrings);

      final productStrings = _items.map((p) => jsonEncode(p.toJson())).toList();
      await prefs.setStringList('user_fav_products', productStrings);
    } catch (e) {
      debugPrint('Error saving wishlist to prefs: $e');
    }
  }

  bool isInWishlist(String productId) {
    return _items.any((item) => item.id == productId);
  }

  void toggleWishlist(Product product) {
    if (isInWishlist(product.id)) {
      _items.removeWhere((item) => item.id == product.id);
    } else {
      _items.add(product);
    }
    _saveToPrefs();
    notifyListeners();
  }

  bool isRestaurantFavorite(String restaurantId) {
    return _favoriteRestaurantIds.contains(restaurantId);
  }

  void toggleRestaurantFavorite(String restaurantId, {Restaurant? restaurant}) {
    if (_favoriteRestaurantIds.contains(restaurantId)) {
      _favoriteRestaurantIds.remove(restaurantId);
      _favoriteRestaurants.removeWhere((r) => r.id == restaurantId);
    } else {
      _favoriteRestaurantIds.add(restaurantId);
      if (restaurant != null) {
        _favoriteRestaurants.removeWhere((r) => r.id == restaurantId);
        _favoriteRestaurants.add(restaurant);
      } else {
        // Fetch and hydrate this restaurant object asynchronously
        _hydrateRestaurant(restaurantId);
      }
    }
    _saveToPrefs();
    notifyListeners();
  }

  Future<void> _hydrateRestaurant(String restaurantId) async {
    try {
      final r = await RestaurantApiService.getRestaurantDetails(restaurantId);
      if (_favoriteRestaurantIds.contains(restaurantId) &&
          !_favoriteRestaurants.any((item) => item.id == restaurantId)) {
        _favoriteRestaurants.add(r);
        _saveToPrefs();
        notifyListeners();
      }
    } catch (_) {}
  }

  void removeItem(String productId) {
    _items.removeWhere((item) => item.id == productId);
    _saveToPrefs();
    notifyListeners();
  }

  void clear() {
    _items.clear();
    _favoriteRestaurantIds.clear();
    _favoriteRestaurants.clear();
    _saveToPrefs();
    notifyListeners();
  }
}

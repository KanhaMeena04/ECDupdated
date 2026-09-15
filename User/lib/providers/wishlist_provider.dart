import 'package:ecdkart_app/core/models/product.dart';
import 'package:flutter/foundation.dart';

class WishlistProvider with ChangeNotifier {
  final List<Product> _items = [];
  final Set<String> _favoriteRestaurantIds = {};

  List<Product> get items => _items;
  Set<String> get favoriteRestaurantIds => _favoriteRestaurantIds;

  bool isInWishlist(String productId) {
    return _items.any((item) => item.id == productId);
  }

  void toggleWishlist(Product product) {
    if (isInWishlist(product.id)) {
      _items.removeWhere((item) => item.id == product.id);
    } else {
      _items.add(product);
    }
    notifyListeners();
  }

  bool isRestaurantFavorite(String restaurantId) {
    return _favoriteRestaurantIds.contains(restaurantId);
  }

  void toggleRestaurantFavorite(String restaurantId) {
    if (_favoriteRestaurantIds.contains(restaurantId)) {
      _favoriteRestaurantIds.remove(restaurantId);
    } else {
      _favoriteRestaurantIds.add(restaurantId);
    }
    notifyListeners();
  }

  void removeItem(String productId) {
    _items.removeWhere((item) => item.id == productId);
    notifyListeners();
  }

  void clear() {
    _items.clear();
    _favoriteRestaurantIds.clear();
    notifyListeners();
  }
}

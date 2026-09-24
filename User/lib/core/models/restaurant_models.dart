// ─────────────────────────────────────────────
// MODEL: MenuItem (used inside Restaurant)
// ─────────────────────────────────────────────
import 'product.dart';

class MenuItem {
  final String id;
  final String name;
  final String imageUrl;
  final double price;
  final double? originalPrice;
  final String? comparisonTag;
  final String category;
  final double rating;
  final bool isVeg;
  final String description;
  final bool outOfStock;
  final int preparationTime;
  final String subcategory;
  final bool isFeatured;
  final bool adminPriceOverridden;

  const MenuItem({
    required this.id,
    required this.name,
    required this.imageUrl,
    required this.price,
    this.originalPrice,
    this.comparisonTag,
    required this.category,
    required this.rating,
    required this.isVeg,
    required this.description,
    this.outOfStock = false,
    this.preparationTime = 15,
    this.subcategory = '',
    this.isFeatured = false,
    this.adminPriceOverridden = false,
  });

  /// Get effective original price (if not explicitly provided, returns ~40% higher price)
  double get effectiveOriginalPrice => originalPrice ?? (price * 1.4).roundToDouble();

  /// Convert to Product so CartProvider can handle it
  Product toProduct() => Product(
        id: id,
        name: name,
        description: description,
        price: price,
        image: imageUrl,
        category: category,
        rating: rating,
        isVeg: isVeg,
      );
}

// ─────────────────────────────────────────────
// MODEL: Restaurant
// ─────────────────────────────────────────────
class Restaurant {
  final String id;
  final String slug;
  final String name;
  final String imageUrl;
  final double rating;
  final int reviewCount;
  final double distanceKm;
  final int deliveryTimeMin;
  final double deliveryCharge;
  final String cuisine;
  final List<MenuItem> menu;
  final bool isActive;
  final bool isOnline;

  const Restaurant({
    required this.id,
    required this.slug,
    required this.name,
    required this.imageUrl,
    required this.rating,
    required this.reviewCount,
    required this.distanceKm,
    required this.deliveryTimeMin,
    required this.deliveryCharge,
    required this.cuisine,
    required this.menu,
    this.isActive = true,
    this.isOnline = false,
  });

  Restaurant copyWith({
    String? id,
    String? slug,
    String? name,
    String? imageUrl,
    double? rating,
    int? reviewCount,
    double? distanceKm,
    int? deliveryTimeMin,
    double? deliveryCharge,
    String? cuisine,
    List<MenuItem>? menu,
    bool? isActive,
    bool? isOnline,
  }) {
    return Restaurant(
      id: id ?? this.id,
      slug: slug ?? this.slug,
      name: name ?? this.name,
      imageUrl: imageUrl ?? this.imageUrl,
      rating: rating ?? this.rating,
      reviewCount: reviewCount ?? this.reviewCount,
      distanceKm: distanceKm ?? this.distanceKm,
      deliveryTimeMin: deliveryTimeMin ?? this.deliveryTimeMin,
      deliveryCharge: deliveryCharge ?? this.deliveryCharge,
      cuisine: cuisine ?? this.cuisine,
      menu: menu ?? this.menu,
      isActive: isActive ?? this.isActive,
      isOnline: isOnline ?? this.isOnline,
    );
  }
}

// ─────────────────────────────────────────────
// MODEL: PopularDish
// ─────────────────────────────────────────────
class PopularDish {
  final String id;
  final String name;
  final String slug;
  final String imageUrl;
  final String category;
  final double price;
  final String description;
  final bool isVeg;
  final double rating;

  const PopularDish({
    required this.id,
    required this.name,
    required this.slug,
    required this.imageUrl,
    required this.category,
    this.price = 149.0,
    this.description = '',
    this.isVeg = true,
    this.rating = 4.5,
  });
}

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
  final String portionType;
  final Map<String, dynamic>? portions;
  final List<Map<String, dynamic>> variations;
  final List<Map<String, dynamic>> addOns;
  final String restaurantId;
  final String restaurantName;
  final String restaurantSlug;

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
    this.portionType = 'none',
    this.portions,
    this.variations = const [],
    this.addOns = const [],
    this.restaurantId = '',
    this.restaurantName = '',
    this.restaurantSlug = '',
  });

  /// Whether item has portions (Half/Full or Sizes)
  bool get hasPortions =>
      (portionType == 'half_full' || portionType == 'size') &&
      portions != null &&
      portions!.isNotEmpty;

  /// Whether item has optional add-ons
  bool get hasAddOns => addOns.isNotEmpty;

  /// Whether item has any customizable options
  bool get hasCustomizations => hasPortions || hasAddOns;

  /// Get effective original price (if not explicitly provided, returns ~40% higher price)
  double get effectiveOriginalPrice => originalPrice ?? (price * 1.4).roundToDouble();

  /// Selling price alias for consistency
  double get sellingPrice => price;

  /// Whether item is in stock & available
  bool get isAvailable => !outOfStock;

  /// Check if item is marked as special / rare / featured
  bool get isRareOrSpecial =>
      isFeatured ||
      category.toLowerCase().contains('special') ||
      subcategory.toLowerCase().contains('special') ||
      name.toLowerCase().contains('special');

  /// Convert to Product so CartProvider can handle it
  Product toProduct({String? customName, double? customPrice, String? restId, String? restName}) => Product(
        id: id,
        name: customName ?? name,
        description: description,
        price: customPrice ?? price,
        image: imageUrl,
        category: category,
        rating: rating,
        isVeg: isVeg,
        restaurantId: restId ?? (restaurantId.isNotEmpty ? restaurantId : null),
        restaurantName: restName ?? (restaurantName.isNotEmpty ? restaurantName : null),
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
  final double? geofenceRadius;
  final bool isServiceable;
  final String address;
  final String phone;
  final String email;
  final double minOrderValue;
  final int estimatedPreparationTime;
  final bool isSelfPickupEnabled;
  final String paymentMethods;
  final bool isOpen;
  final Map<String, dynamic> timing;
  final bool isTemporarilyClosed;
  final String kitchenBusyReason;
  final bool isFeatured;
  final double startingPrice;
  final int savingPercent;

  /// Lowest price of items in the menu (Rule: min price of available items or startingPrice from backend)
  double get lowestPrice {
    final validPrices = menu.where((m) => m.price > 0 && !m.outOfStock).map((m) => m.price).toList();
    if (validPrices.isNotEmpty) {
      return validPrices.reduce((a, b) => a < b ? a : b);
    }
    final allPrices = menu.where((m) => m.price > 0).map((m) => m.price).toList();
    if (allPrices.isNotEmpty) {
      return allPrices.reduce((a, b) => a < b ? a : b);
    }
    if (startingPrice > 0) return startingPrice;
    return 999999.0;
  }

  /// Average menu price for pricing comparison
  double get averagePrice {
    if (menu.isEmpty) return 0.0;
    final validPrices = menu.where((m) => m.price > 0).map((m) => m.price).toList();
    if (validPrices.isEmpty) return 0.0;
    return validPrices.reduce((a, b) => a + b) / validPrices.length;
  }

  /// Real comparative saving percentage compared to market/MRP
  int get effectiveSavingPercent {
    if (savingPercent > 0) return savingPercent;
    int totalDiscount = 0;
    int count = 0;
    for (final m in menu) {
      final orig = m.originalPrice ?? (m.price * 1.4);
      if (orig > m.price && orig > 0) {
        totalDiscount += (((orig - m.price) / orig) * 100).round();
        count++;
      }
    }
    if (count > 0) return (totalDiscount / count).round();
    return 40;
  }

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
    this.geofenceRadius,
    this.isServiceable = true,
    this.address = '',
    this.phone = '',
    this.email = '',
    this.minOrderValue = 0.0,
    this.estimatedPreparationTime = 15,
    this.isSelfPickupEnabled = true,
    this.paymentMethods = 'Both',
    this.isOpen = true,
    this.timing = const {},
    this.isTemporarilyClosed = false,
    this.kitchenBusyReason = '',
    this.isFeatured = false,
    this.startingPrice = 0.0,
    this.savingPercent = 0,
  });

  double get distance => distanceKm;

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
    double? geofenceRadius,
    bool? isServiceable,
    String? address,
    String? phone,
    String? email,
    double? minOrderValue,
    int? estimatedPreparationTime,
    bool? isSelfPickupEnabled,
    String? paymentMethods,
    bool? isOpen,
    Map<String, dynamic>? timing,
    bool? isTemporarilyClosed,
    String? kitchenBusyReason,
    bool? isFeatured,
    double? startingPrice,
    int? savingPercent,
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
      geofenceRadius: geofenceRadius ?? this.geofenceRadius,
      isServiceable: isServiceable ?? this.isServiceable,
      address: address ?? this.address,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      minOrderValue: minOrderValue ?? this.minOrderValue,
      estimatedPreparationTime: estimatedPreparationTime ?? this.estimatedPreparationTime,
      isSelfPickupEnabled: isSelfPickupEnabled ?? this.isSelfPickupEnabled,
      paymentMethods: paymentMethods ?? this.paymentMethods,
      isOpen: isOpen ?? this.isOpen,
      timing: timing ?? this.timing,
      isTemporarilyClosed: isTemporarilyClosed ?? this.isTemporarilyClosed,
      kitchenBusyReason: kitchenBusyReason ?? this.kitchenBusyReason,
      isFeatured: isFeatured ?? this.isFeatured,
      startingPrice: startingPrice ?? this.startingPrice,
      savingPercent: savingPercent ?? this.savingPercent,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'slug': slug,
    'name': name,
    'imageUrl': imageUrl,
    'rating': rating,
    'reviewCount': reviewCount,
    'distanceKm': distanceKm,
    'deliveryTimeMin': deliveryTimeMin,
    'deliveryCharge': deliveryCharge,
    'cuisine': cuisine,
    'isActive': isActive,
    'isOnline': isOnline,
    'isOpen': isOpen,
    'isFeatured': isFeatured,
    'startingPrice': startingPrice,
    'savingPercent': savingPercent,
    'address': address,
  };

  factory Restaurant.fromJson(Map<String, dynamic> json) {
    return Restaurant(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Restaurant',
      imageUrl: json['imageUrl']?.toString() ?? json['image']?.toString() ?? '',
      rating: (json['rating'] is num) ? (json['rating'] as num).toDouble() : 4.5,
      reviewCount: (json['reviewCount'] is num) ? (json['reviewCount'] as num).toInt() : 0,
      distanceKm: (json['distanceKm'] is num) ? (json['distanceKm'] as num).toDouble() : 0.0,
      deliveryTimeMin: (json['deliveryTimeMin'] is num) ? (json['deliveryTimeMin'] as num).toInt() : 25,
      deliveryCharge: (json['deliveryCharge'] is num) ? (json['deliveryCharge'] as num).toDouble() : 0.0,
      cuisine: json['cuisine']?.toString() ?? '',
      menu: const [],
      isActive: json['isActive'] != false,
      isOnline: json['isOnline'] == true,
      isOpen: json['isOpen'] != false,
      isFeatured: json['isFeatured'] == true,
      startingPrice: (json['startingPrice'] is num) ? (json['startingPrice'] as num).toDouble() : 0.0,
      savingPercent: (json['savingPercent'] is num) ? (json['savingPercent'] as num).toInt() : 0,
      address: json['address']?.toString() ?? '',
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
  final String restaurantId;
  final String restaurantName;

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
    this.restaurantId = '',
    this.restaurantName = '',
  });

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

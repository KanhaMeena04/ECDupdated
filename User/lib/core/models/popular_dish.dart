/// A menu item offered by a restaurant
class RestaurantMenuItem {
  final String name;
  final double price;
  final bool isVeg;
  final String description;

  const RestaurantMenuItem({
    required this.name,
    required this.price,
    required this.isVeg,
    required this.description,
  });
}

/// A restaurant that serves a particular popular dish
class DishRestaurant {
  final String id;
  final String name;
  final double rating;
  final int ratingCount;
  final String deliveryTime;
  final String location;
  final String cuisineTypes;
  final bool freeDelivery;
  final double deliveryFee;
  final String imageUrl; // HTTPS network image
  final List<RestaurantMenuItem> menuItems;

  const DishRestaurant({
    required this.id,
    required this.name,
    required this.rating,
    required this.ratingCount,
    required this.deliveryTime,
    required this.location,
    required this.cuisineTypes,
    required this.freeDelivery,
    required this.deliveryFee,
    required this.imageUrl,
    required this.menuItems,
  });
}

/// A popular dish shown on the home page grid
class PopularDish {
  final String id;
  final String name;
  final String category;
  final double price;
  final bool isVeg;
  final double rating;
  final String imageUrl; // HTTPS network image
  final String description;
  final List<DishRestaurant> restaurants;

  const PopularDish({
    required this.id,
    required this.name,
    required this.category,
    required this.price,
    required this.isVeg,
    required this.rating,
    required this.imageUrl,
    required this.description,
    required this.restaurants,
  });
}

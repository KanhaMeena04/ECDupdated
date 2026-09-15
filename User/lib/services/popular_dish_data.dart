import '../core/models/restaurant_models.dart';

// Mock restaurants removed since we are using real API data.

// =============================================
// POPULAR DISHES (linked to restaurants)
// =============================================
final List<PopularDish> mockPopularDishes = [
  PopularDish(id: 'pd1', name: 'Pizza',    slug: 'pizza',    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', category: 'Pizza'),
  PopularDish(id: 'pd2', name: 'Biryani',  slug: 'biryani',  imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400', category: 'Biryani'),
  PopularDish(id: 'pd3', name: 'Burger',   slug: 'burger',   imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', category: 'Burger'),
  PopularDish(id: 'pd4', name: 'Chinese',  slug: 'chinese',  imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400', category: 'Chinese'),
  PopularDish(id: 'pd5', name: 'Cake',     slug: 'cake',     imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400', category: 'Cake'),
  PopularDish(id: 'pd6', name: 'Sandwich', slug: 'sandwich', imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400', category: 'Sandwich'),
  PopularDish(id: 'pd7', name: 'Momos',    slug: 'momos',    imageUrl: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=400', category: 'Momos'),
  PopularDish(id: 'pd8', name: 'Noodles',  slug: 'noodles',  imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400', category: 'Noodles'),
];

List<Restaurant> getRestaurantsForDish(PopularDish dish, List<Restaurant> allRestaurants) {
  // First, try to find restaurants where the cuisine or name matches the dish category or name
  final dishKeywords = [dish.category.toLowerCase(), ...dish.name.toLowerCase().split(' ')];
  
  var matched = allRestaurants.where((r) {
    final rText = '${r.name} ${r.cuisine}'.toLowerCase();
    return dishKeywords.any((keyword) => keyword.length > 2 && rText.contains(keyword));
  }).toList();

  // If no restaurants perfectly match the keywords, just return a few restaurants so the screen isn't empty
  if (matched.isEmpty && allRestaurants.isNotEmpty) {
    matched = allRestaurants.take(3).toList(); // Temporary fallback
  }
  
  return matched;
}

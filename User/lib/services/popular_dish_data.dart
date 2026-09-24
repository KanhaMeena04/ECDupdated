import '../core/models/restaurant_models.dart';

// Mock restaurants removed since we are using real API data.

// =============================================
// POPULAR DISHES (linked to restaurants)
// =============================================
final List<PopularDish> mockPopularDishes = [];

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

import '../core/constants/app_constants.dart';
import '../core/config/app_mode.dart';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb, debugPrint;
import 'package:http/http.dart' as http;
import '../core/models/restaurant_models.dart';
import '../core/models/category.dart';
import '../core/models/banner.dart';
import 'popular_dish_data.dart';
import 'auth_service.dart';

class RestaurantApiService {
  static String get apiBaseUrl {
    // return AppConstants.baseUrl;
    return AppConstants.baseUrl;
  }

  static String get restaurantsUrl => '$apiBaseUrl/restaurants';
  static String get categoriesUrl => '$apiBaseUrl/categories';
  static String get popularDishesUrl => '$apiBaseUrl/popular-dishes';
  static String get bannersUrl => '$apiBaseUrl/banners';

  static Future<Map<String, String>> _getHeaders() async {
    final token = await AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<bool> submitRestaurantReview(String orderId, String restaurantId, double rating, String comment) async {
    if (kFrontendPreviewMode) return true;
    try {
      final response = await http.post(
        Uri.parse('$apiBaseUrl/reviews/restaurant'),
        headers: await _getHeaders(),
        body: jsonEncode({
          'orderId': orderId,
          'restaurantId': restaurantId,
          'rating': rating,
          'comment': comment,
        }),
      );
      return response.statusCode == 201;
    } catch (e) {
      debugPrint('Error submitting review: $e');
      return false;
    }
  }

  static Future<List<dynamic>> getRestaurantReviews(String restaurantId) async {
    if (kFrontendPreviewMode) {
      return [
        {
          'userName': 'Amit Sharma',
          'rating': 5.0,
          'comment': 'Delicious food and fast delivery! Super hot pizza.',
          'createdAt': '2026-03-01T12:00:00Z',
        },
        {
          'userName': 'Priya Verma',
          'rating': 4.5,
          'comment': 'Great taste, portion size was very generous.',
          'createdAt': '2026-02-28T14:30:00Z',
        }
      ];
    }
    try {
      final response = await http.get(Uri.parse('$apiBaseUrl/reviews/restaurant/$restaurantId'));
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching reviews: $e');
      return [];
    }
  }

  static Future<List<BannerModel>> getBanners() async {
    if (kFrontendPreviewMode) {
      return [
        BannerModel(
          id: 'b1',
          imageUrl: 'assets/static/bb.png',
          isActive: true,
        ),
        BannerModel(
          id: 'b2',
          imageUrl: 'assets/static/grocery.jpg',
          isActive: true,
        ),
      ];
    }
    try {
      final response = await http.get(Uri.parse(bannersUrl));
      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse['banners'] ?? [];
        return data.map((json) => BannerModel.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching banners: $e');
      return [];
    }
  }

  static Future<List<Restaurant>> getRestaurants({Map<String, String>? filters}) async {
    if (kFrontendPreviewMode) {
      final list = _getMockRestaurants();
      if (filters != null && filters.containsKey('search')) {
        final q = filters['search']!.toLowerCase();
        return list.where((r) => r.name.toLowerCase().contains(q) || r.cuisine.toLowerCase().contains(q)).toList();
      }
      return list;
    }
    try {
      var uri = Uri.parse('$restaurantsUrl/list');
      final queryParams = {'limit': '100'};
      if (filters != null) {
        queryParams.addAll(filters);
      }
      uri = uri.replace(queryParameters: queryParams);
      
      final response = await http.get(uri);
      debugPrint('API Response [getRestaurants]: ${response.statusCode} - ${response.body.length} bytes');
      
      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> restaurantsJson = jsonResponse['restaurants'] ?? [];
        return restaurantsJson.map((json) => _fromJsonToRestaurant(json)).toList();
      } else {
        throw Exception('Failed to load restaurants: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error fetching restaurants: $e');
      return [];
    }
  }

  static Future<Restaurant> getRestaurantDetails(String slug) async {
    if (kFrontendPreviewMode) {
      final list = _getMockRestaurants();
      return list.firstWhere(
        (r) => r.slug == slug || r.id == slug,
        orElse: () => list.first,
      );
    }
    try {
      final response = await http.get(Uri.parse('$restaurantsUrl/details/$slug'));
      debugPrint('API Response [getRestaurantDetails]: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final data = jsonResponse['restaurant'] ?? jsonResponse;
        return _fromJsonToRestaurant(data);
      } else {
        throw Exception('Failed to load restaurant details');
      }
    } catch (e) {
      debugPrint('Error fetching restaurant details: $e');
      rethrow;
    }
  }

  static Future<List<MenuItem>> getRestaurantMenu(String slug) async {
    if (kFrontendPreviewMode) {
      return _getMockMenuItems();
    }
    try {
      final response = await http.get(Uri.parse('$restaurantsUrl/menu/$slug'));
      debugPrint('API Response [getRestaurantMenu]: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        List<dynamic> menuJson = [];
        if (jsonResponse is List) {
          menuJson = jsonResponse;
        } else if (jsonResponse is Map) {
          menuJson = jsonResponse['menu'] ?? jsonResponse['data'] ?? [];
        }
        return menuJson.map((json) => _fromJsonToMenuItem(json)).toList();
      } else {
        throw Exception('Failed to load menu');
      }
    } catch (e) {
      debugPrint('Error fetching menu: $e');
      return [];
    }
  }

  static Future<List<Restaurant>> searchRestaurants(String query) async {
    if (kFrontendPreviewMode) {
      final q = query.toLowerCase();
      return _getMockRestaurants().where((r) {
        final rName = r.name.toLowerCase();
        final rCuisine = r.cuisine.toLowerCase();
        final matchMenu = r.menu.any((item) => item.name.toLowerCase().contains(q));
        return rName.contains(q) || rCuisine.contains(q) || matchMenu;
      }).toList();
    }
    try {
      final response = await http.get(Uri.parse('$restaurantsUrl/search?query=$query'));
      debugPrint('API Response [searchRestaurants]: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> restaurantsJson = jsonResponse['restaurants'] ?? [];
        return restaurantsJson.map((json) => _fromJsonToRestaurant(json)).toList();
      } else {
        throw Exception('Failed to search restaurants: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error searching restaurants: $e');
      return [];
    }
  }

  static Future<List<String>> getSuggestions(String query) async {
    if (kFrontendPreviewMode) {
      final q = query.toLowerCase();
      final allNames = [
        ..._getMockRestaurants().map((r) => r.name),
        ..._getMockMenuItems().map((m) => m.name),
      ];
      return allNames.where((n) => n.toLowerCase().contains(q)).toList();
    }
    try {
      final response = await http.get(Uri.parse('$restaurantsUrl/suggestions?query=$query'));
      debugPrint('API Response [getSuggestions]: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final suggestionsRaw = jsonResponse['suggestions'] ?? [];
        
        if (suggestionsRaw is List) {
          return suggestionsRaw.map((s) {
            if (s is Map) return s['name']?.toString() ?? s['title']?.toString() ?? '';
            return s.toString();
          }).where((s) => s.isNotEmpty).toList();
        }
        return [];
      } else {
        throw Exception('Failed to get suggestions: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error fetching suggestions: $e');
      return [];
    }
  }

  static Future<List<Category>> getCategories() async {
    if (kFrontendPreviewMode) {
      return [
        Category(id: 'cat_1', title: 'Pizza', image: 'assets/static/c3.png'),
        Category(id: 'cat_2', title: 'Burgers', image: 'assets/static/c2.png'),
        Category(id: 'cat_3', title: 'Biryani', image: 'assets/static/c5.png'),
        Category(id: 'cat_4', title: 'Cakes', image: 'assets/static/c1.png'),
        Category(id: 'cat_5', title: 'Chicken', image: 'assets/static/c4.png'),
        Category(id: 'cat_6', title: 'Sandwich', image: 'assets/static/c6.png'),
      ];
    }
    try {
      final response = await http.get(Uri.parse(categoriesUrl));
      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse['categories'] ?? [];
        return data.map((json) => Category(
          id: json['_id']?.toString() ?? json['slug']?.toString() ?? '',
          title: json['name']?.toString() ?? '',
          image: json['image']?.toString() ?? 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
        )).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching categories: $e');
      return [];
    }
  }

  static Future<List<PopularDish>> getPopularDishes() async {
    if (kFrontendPreviewMode) {
      return mockPopularDishes;
    }
    try {
      final response = await http.get(Uri.parse(popularDishesUrl));
      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse['dishes'] ?? [];
        return data.map((json) => PopularDish(
          id: json['_id']?.toString() ?? '',
          name: json['name']?.toString() ?? '',
          slug: json['slug']?.toString() ?? '',
          imageUrl: json['image']?.toString() ?? 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
          category: json['category']?.toString() ?? '',
        )).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching popular dishes: $e');
      return [];
    }
  }

  static Future<List<Restaurant>> getRestaurantsByCategory(String slug) async {
    if (kFrontendPreviewMode) {
      return _getMockRestaurants();
    }
    try {
      final response = await http.get(Uri.parse('$restaurantsUrl/by-category/$slug'));
      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> restaurantsJson = jsonResponse['restaurants'] ?? [];
        return restaurantsJson.map((json) => _fromJsonToRestaurant(json)).toList();
      } else {
        throw Exception('Failed to load restaurants for category');
      }
    } catch (e) {
      debugPrint('Error fetching restaurants by category: $e');
      return [];
    }
  }

  static Restaurant _fromJsonToRestaurant(Map<String, dynamic> json) {
    List<MenuItem> menuItems = [];
    if (json['menu'] != null) {
      menuItems = (json['menu'] as List).map((i) => _fromJsonToMenuItem(i)).toList();
    }

    // Robust mapping with fallbacks for every field
    return Restaurant(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Unknown Restaurant',
      imageUrl: json['coverImage']?.toString() ?? json['logo']?.toString() ?? json['image']?.toString() ?? 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
      rating: _parseDouble((json['avgRating'] != null && json['avgRating'] > 0) ? json['avgRating'] : (json['adminRating'] ?? json['rating'] ?? json['avgRating']), 4.0),
      reviewCount: _parseInt(json['totalReviews'] != null && json['totalReviews'] > 0 ? json['totalReviews'] : (json['orderCount'] ?? json['reviewCount'] ?? json['totalReviews']), 100),
      distanceKm: _parseDouble(json['distance'] ?? json['distanceKm'], 2.5),
      deliveryTimeMin: _parseInt(json['deliveryTime'] ?? json['deliveryTimeMin'] ?? json['prepTime'], 30),
      deliveryCharge: _parseDouble(json['deliveryCharge'] ?? json['shippingFee'], 0.0),
      cuisine: json['storeType']?.toString() ?? json['cuisine']?.toString() ?? json['description']?.toString() ?? 'Food',
      menu: menuItems,
      isActive: json['isActive'] == true,
      isOnline: json['isOnline'] == true,
    );
  }

  static double _parseDouble(dynamic value, double defaultVal) {
    if (value == null) return defaultVal;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? defaultVal;
    return defaultVal;
  }

  static int _parseInt(dynamic value, int defaultVal) {
    if (value == null) return defaultVal;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value) ?? defaultVal;
    return defaultVal;
  }

  static MenuItem _fromJsonToMenuItem(Map<String, dynamic> json) {
    return MenuItem(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Item',
      imageUrl: json['image']?.toString() ?? json['imageUrl']?.toString() ?? 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
      price: _parseDouble(json['price'], 0.0),
      category: json['category']?.toString() ?? 'General',
      rating: _parseDouble(json['rating'], 4.0),
      isVeg: json['isVeg'] == true || json['isVegetarian'] == true || json['veg'] == true,
      description: json['description']?.toString() ?? '',
    );
  }

  static List<Restaurant> _getMockRestaurants() {
    return [
      Restaurant(
        id: 'rest_apna',
        slug: 'apna-sweets',
        name: 'Apna Sweets',
        imageUrl: 'assets/static/restraunt.jpg',
        rating: 4.4,
        reviewCount: 310,
        distanceKm: 1.5,
        deliveryTimeMin: 20,
        deliveryCharge: 0.0,
        cuisine: 'North Indian, Sweets, Snacks',
        isActive: true,
        isOnline: true,
        menu: [
          const MenuItem(
            id: 'apna_1',
            name: 'Indori Poha',
            description: 'Steamed poha topped with ratlami sev & fresh pomegranate',
            price: 25.0,
            originalPrice: 45.0,
            comparisonTag: '45% lower',
            imageUrl: 'assets/static/c6.png',
            category: 'Snacks',
            rating: 4.8,
            isVeg: true,
          ),
          const MenuItem(
            id: 'apna_2',
            name: 'Crispy Samosa',
            description: 'Golden spiced potato stuffed samosa served with chutney',
            price: 25.0,
            originalPrice: 40.0,
            comparisonTag: '38% lower',
            imageUrl: 'assets/static/c5.png',
            category: 'Snacks',
            rating: 4.7,
            isVeg: true,
          ),
          const MenuItem(
            id: 'apna_3',
            name: 'Uttapam',
            description: 'South Indian rice pancake loaded with fresh onion & tomato',
            price: 35.0,
            originalPrice: 65.0,
            comparisonTag: '46% lower',
            imageUrl: 'assets/static/c2.png',
            category: 'South Indian',
            rating: 4.6,
            isVeg: true,
          ),
          const MenuItem(
            id: 'apna_4',
            name: 'Desi Ghee Jalebi',
            description: 'Crispy hot jalebis dipped in saffron sugar syrup',
            price: 49.0,
            originalPrice: 90.0,
            comparisonTag: '45% lower',
            imageUrl: 'assets/static/c1.png',
            category: 'Sweets',
            rating: 4.9,
            isVeg: true,
          ),
        ],
      ),
      Restaurant(
        id: 'rest_haldiram',
        slug: 'haldirams-restaurant',
        name: "Haldiram's Restaurant",
        imageUrl: 'assets/static/b1.jpg',
        rating: 4.3,
        reviewCount: 420,
        distanceKm: 2.0,
        deliveryTimeMin: 25,
        deliveryCharge: 20.0,
        cuisine: 'North Indian, Chaat, Thali',
        isActive: true,
        isOnline: true,
        menu: [
          const MenuItem(
            id: 'hald_1',
            name: 'Masala Dosa',
            description: 'Crispy rice crepe filled with spiced potato masala',
            price: 69.0,
            originalPrice: 120.0,
            comparisonTag: '42% lower',
            imageUrl: 'assets/static/c2.png',
            category: 'South Indian',
            rating: 4.6,
            isVeg: true,
          ),
          const MenuItem(
            id: 'hald_2',
            name: 'Grilled Sandwich',
            description: 'Cheese & vegetable multi-grain grilled sandwich',
            price: 56.0,
            originalPrice: 99.0,
            comparisonTag: '43% lower',
            imageUrl: 'assets/static/c6.png',
            category: 'Snacks',
            rating: 4.5,
            isVeg: true,
          ),
          const MenuItem(
            id: 'hald_3',
            name: 'Special North Thali',
            description: 'Paneer, dal makhani, 2 naan, rice, raita & sweet dish',
            price: 129.0,
            originalPrice: 220.0,
            comparisonTag: '41% lower',
            imageUrl: 'assets/static/c5.png',
            category: 'Thali',
            rating: 4.8,
            isVeg: true,
          ),
          const MenuItem(
            id: 'hald_4',
            name: 'Raj Kachori',
            description: 'Crispy sphere filled with sprouts, curd & sweet chutney',
            price: 79.0,
            originalPrice: 135.0,
            comparisonTag: '41% lower',
            imageUrl: 'assets/static/b4.jpg',
            category: 'Chaat',
            rating: 4.7,
            isVeg: true,
          ),
        ],
      ),
      Restaurant(
        id: 'rest_1',
        slug: 'gourmet-kitchen',
        name: 'The Gourmet Kitchen',
        imageUrl: 'assets/static/restraunt.jpg',
        rating: 4.8,
        reviewCount: 245,
        distanceKm: 1.8,
        deliveryTimeMin: 25,
        deliveryCharge: 30.0,
        cuisine: 'North Indian, Biryani, Thali',
        isActive: true,
        isOnline: true,
        menu: _getMockMenuItems(),
      ),
      Restaurant(
        id: 'rest_2',
        slug: 'pizza-perfection',
        name: 'Pizza Perfection',
        imageUrl: 'assets/static/pizza.jpg',
        rating: 4.6,
        reviewCount: 180,
        distanceKm: 2.2,
        deliveryTimeMin: 30,
        deliveryCharge: 25.0,
        cuisine: 'Pizza, Italian, Desserts',
        isActive: true,
        isOnline: true,
        menu: _getMockMenuItems(),
      ),
      Restaurant(
        id: 'rest_3',
        slug: 'burger-heights',
        name: 'Burger Heights',
        imageUrl: 'assets/static/b2.jpg',
        rating: 4.4,
        reviewCount: 120,
        distanceKm: 3.0,
        deliveryTimeMin: 20,
        deliveryCharge: 20.0,
        cuisine: 'Burger, Fast Food, Beverages',
        isActive: true,
        isOnline: true,
        menu: _getMockMenuItems(),
      ),
      Restaurant(
        id: 'rest_4',
        slug: 'wok-and-roll',
        name: 'Wok & Roll Chinese',
        imageUrl: 'assets/static/b3.jpg',
        rating: 4.5,
        reviewCount: 95,
        distanceKm: 2.5,
        deliveryTimeMin: 35,
        deliveryCharge: 35.0,
        cuisine: 'Chinese, Asian, Noodles',
        isActive: true,
        isOnline: true,
        menu: _getMockMenuItems(),
      ),
    ];
  }

  static List<MenuItem> _getMockMenuItems() {
    return [
      const MenuItem(
        id: 'item_1',
        name: 'Margherita Pizza',
        description: 'Classic cheese pizza with rich tomato sauce & fresh basil',
        price: 199.0,
        originalPrice: 349.0,
        comparisonTag: '43% lower',
        imageUrl: 'assets/static/pizza.jpg',
        category: 'Pizza',
        rating: 4.8,
        isVeg: true,
      ),
      const MenuItem(
        id: 'item_2',
        name: 'Double Cheeseburger',
        description: 'Juicy patty with double cheese, lettuce, tomato & spicy mayo',
        price: 129.0,
        originalPrice: 220.0,
        comparisonTag: '41% lower',
        imageUrl: 'assets/static/b2.jpg',
        category: 'Burger',
        rating: 4.5,
        isVeg: false,
      ),
      const MenuItem(
        id: 'item_3',
        name: 'Schezwan Hakka Noodles',
        description: 'Spicy wok-tossed noodles loaded with fresh veggies & garlic',
        price: 119.0,
        originalPrice: 199.0,
        comparisonTag: '40% lower',
        imageUrl: 'assets/static/b3.jpg',
        category: 'Chinese',
        rating: 4.3,
        isVeg: true,
      ),
      const MenuItem(
        id: 'item_4',
        name: 'Creamy White Pasta',
        description: 'Penne pasta tossed in rich parmesan sauce with Italian herbs',
        price: 149.0,
        originalPrice: 260.0,
        comparisonTag: '42% lower',
        imageUrl: 'assets/static/b1.jpg',
        category: 'Pasta',
        rating: 4.6,
        isVeg: true,
      ),
      const MenuItem(
        id: 'item_5',
        name: 'Paneer Butter Masala',
        description: 'Rich creamy paneer gravy served with aromatic spices',
        price: 169.0,
        originalPrice: 280.0,
        comparisonTag: '40% lower',
        imageUrl: 'assets/static/b4.jpg',
        category: 'Indian',
        rating: 4.7,
        isVeg: true,
      ),
      const MenuItem(
        id: 'item_6',
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with molten chocolate core',
        price: 89.0,
        originalPrice: 150.0,
        comparisonTag: '40% lower',
        imageUrl: 'assets/static/cake5.jpg',
        category: 'Desserts',
        rating: 4.9,
        isVeg: true,
      ),
    ];
  }
}

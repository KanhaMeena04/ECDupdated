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
  static String get homeSectionsUrl => '$apiBaseUrl/home/sections';

  static Future<List<Map<String, dynamic>>> getHomeScreenSections() async {
    if (kFrontendPreviewMode) {
      return [];
    }
    try {
      final response = await http.get(Uri.parse(homeSectionsUrl));
      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse['sections'] ?? [];
        return data.cast<Map<String, dynamic>>();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching home screen sections: $e');
      return [];
    }
  }

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
      return _getMockBanners();
    }
    try {
      final response = await http.get(Uri.parse(bannersUrl)).timeout(const Duration(seconds: 4));
      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse['banners'] ?? [];
        final list = data.map((json) => BannerModel.fromJson(json)).toList();
        if (list.isNotEmpty) return list;
      }
    } catch (e) {
      debugPrint('Error fetching banners: $e');
    }
    return _getMockBanners();
  }

  static List<BannerModel> _getMockBanners() {
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

  static Future<List<Restaurant>> getRestaurants({
    Map<String, String>? filters,
    double? lat,
    double? lng,
    String? city,
    String? address,
  }) async {
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
      final queryParams = <String, String>{'limit': '100'};
      if (lat != null && lng != null) {
        queryParams['lat'] = lat.toString();
        queryParams['lng'] = lng.toString();
      }
      if (city != null && city.isNotEmpty) {
        queryParams['city'] = city;
      }
      if (address != null && address.isNotEmpty) {
        queryParams['address'] = address;
      }
      if (filters != null) {
        queryParams.addAll(filters);
      }
      uri = uri.replace(queryParameters: queryParams);
      
      debugPrint('RESTAURANT_API_REQUEST\nGET ${uri.toString()}');
      
      final response = await http.get(uri).timeout(const Duration(seconds: 4));
      
      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        List<dynamic> restaurantsJson = [];
        if (jsonResponse is List) {
          restaurantsJson = jsonResponse;
        } else if (jsonResponse is Map) {
          restaurantsJson = jsonResponse['restaurants'] ?? jsonResponse['data'] ?? [];
        }
        debugPrint('RESTAURANT_API_RESPONSE\nstatus = ${response.statusCode}\ncount = ${restaurantsJson.length}');
        final list = restaurantsJson.map((json) => _fromJsonToRestaurant(json)).toList();
        if (list.isNotEmpty) return list;
      }
    } catch (e) {
      debugPrint('Error fetching restaurants: $e');
    }
    final mockList = _getMockRestaurants();
    if (filters != null && filters.containsKey('search')) {
      final q = filters['search']!.toLowerCase();
      return mockList.where((r) => r.name.toLowerCase().contains(q) || r.cuisine.toLowerCase().contains(q)).toList();
    }
    return mockList;
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
      final list = _getMockRestaurants();
      return list.firstWhere(
        (r) => r.slug == slug || r.id == slug,
        orElse: () => list.first,
      );
    }
  }

  static Future<List<MenuItem>> getRestaurantMenu(String identifier) async {
    if (kFrontendPreviewMode) {
      return _getMockMenuItems();
    }
    try {
      var url = '$apiBaseUrl/menu/$identifier';
      var response = await http.get(Uri.parse(url)).timeout(const Duration(seconds: 4));
      if (response.statusCode != 200) {
        url = '$restaurantsUrl/menu/$identifier';
        response = await http.get(Uri.parse(url)).timeout(const Duration(seconds: 4));
      }
      debugPrint('API Response [getRestaurantMenu]: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        List<dynamic> menuJson = [];
        if (jsonResponse is List) {
          menuJson = jsonResponse;
        } else if (jsonResponse is Map) {
          if (jsonResponse['items'] is List) {
            menuJson = jsonResponse['items'];
          } else if (jsonResponse['products'] is List) {
            menuJson = jsonResponse['products'];
          } else if (jsonResponse['menu'] is List) {
            menuJson = jsonResponse['menu'];
          } else if (jsonResponse['menu'] is Map) {
            final Map<String, dynamic> catMap = jsonResponse['menu'];
            for (var items in catMap.values) {
              if (items is List) {
                menuJson.addAll(items);
              }
            }
          } else if (jsonResponse['data'] is List) {
            menuJson = jsonResponse['data'];
          }
        }
        return menuJson.map((json) => _fromJsonToMenuItem(Map<String, dynamic>.from(json))).toList();
      }
    } catch (e) {
      debugPrint('Error fetching menu: $e');
    }
    return _getMockMenuItems();
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
            return s?.toString() ?? '';
          }).where((s) => s.trim().isNotEmpty).toList();
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
      return _getMockCategories();
    }
    try {
      final response = await http.get(Uri.parse(categoriesUrl)).timeout(const Duration(seconds: 4));
      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse is Map
            ? (jsonResponse['categories'] ?? jsonResponse['data'] ?? [])
            : (jsonResponse is List ? jsonResponse : []);

        final list = data.where((e) => e != null && e is Map).map((item) {
          final json = item as Map;
          String catTitle = '';
          if (json['title'] != null && json['title'].toString().trim().isNotEmpty) {
            catTitle = json['title'].toString().trim();
          } else if (json['name'] != null) {
            if (json['name'] is Map) {
              catTitle = json['name']['en']?.toString() ?? json['name'].values.firstOrNull?.toString() ?? 'Category';
            } else {
              catTitle = json['name'].toString().trim();
            }
          }
          final priceVal = _parseDouble(json['startingPrice'] ?? json['price'] ?? json['fromPrice'], 28.0);

          String rawImg = (json['image'] ?? json['imageUrl'] ?? '').toString().trim();
          if (rawImg.isEmpty || rawImg == 'null') {
            final n = catTitle.toLowerCase();
            if (n.contains('course') || n.contains('main') || n.contains('north indian') || n.contains('thali')) {
              rawImg = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400';
            } else if (n.contains('pizza')) {
              rawImg = 'https://ik.imagekit.io/ECDKART/categories/category_pizza_E7N648fSr6.png';
            } else if (n.contains('burger')) {
              rawImg = 'https://ik.imagekit.io/ECDKART/categories/category_burger__Jc6jUvwy.png';
            } else if (n.contains('biryani')) {
              rawImg = 'https://ik.imagekit.io/ECDKART/c5%20(1).png';
            } else if (n.contains('chinese') || n.contains('noodle')) {
              rawImg = 'https://ik.imagekit.io/ECDKART/categories/category_chinese_XVc494o0A.png';
            } else if (n.contains('momo')) {
              rawImg = 'https://ik.imagekit.io/ECDKART/c7%20(1).png';
            } else if (n.contains('sandwich')) {
              rawImg = 'https://ik.imagekit.io/ECDKART/c6%20(1).png';
            } else if (n.contains('cake') || n.contains('sweet')) {
              rawImg = 'https://ik.imagekit.io/ECDKART/categories/category_cake_VALLdDFpTj.png';
            } else if (n.contains('beverage') || n.contains('drink')) {
              rawImg = 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400';
            } else {
              rawImg = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400';
            }
          }

          return Category(
            id: json['_id']?.toString() ?? json['slug']?.toString() ?? '',
            title: catTitle.isNotEmpty ? catTitle : 'Category',
            image: rawImg,
            startingPrice: priceVal,
          );
        }).toList();

        if (list.isNotEmpty) return list;
      }
    } catch (e) {
      debugPrint('Error fetching categories: $e');
    }
    return _getMockCategories();
  }

  static List<Category> _getMockCategories() {
    return [
      Category(id: 'cat_1', title: 'Pizza', image: 'https://ik.imagekit.io/ECDKART/categories/category_pizza_E7N648fSr6.png', startingPrice: 49.0),
      Category(id: 'cat_2', title: 'Burgers', image: 'https://ik.imagekit.io/ECDKART/categories/category_burger__Jc6jUvwy.png', startingPrice: 39.0),
      Category(id: 'cat_3', title: 'Biryani', image: 'https://ik.imagekit.io/ECDKART/c5%20(1).png', startingPrice: 99.0),
      Category(id: 'cat_4', title: 'Chinese', image: 'https://ik.imagekit.io/ECDKART/categories/category_chinese_XVc494o0A.png', startingPrice: 49.0),
      Category(id: 'cat_5', title: 'Momos', image: 'https://ik.imagekit.io/ECDKART/c7%20(1).png', startingPrice: 29.0),
      Category(id: 'cat_6', title: 'Cakes', image: 'https://ik.imagekit.io/ECDKART/categories/category_cake_VALLdDFpTj.png', startingPrice: 99.0),
      Category(id: 'cat_7', title: 'North Indian', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400', startingPrice: 89.0),
      Category(id: 'cat_8', title: 'Beverages', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', startingPrice: 20.0),
    ];
  }

  static Future<List<PopularDish>> getPopularDishes() async {
    if (kFrontendPreviewMode) {
      return mockPopularDishes;
    }
    try {
      final response = await http.get(Uri.parse(popularDishesUrl)).timeout(const Duration(seconds: 4));
      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse is List
            ? jsonResponse
            : (jsonResponse['dishes'] ?? jsonResponse['products'] ?? jsonResponse['data'] ?? []);
        final list = data.map((json) {
          final rawPrice = _parseDouble(json['price'] ?? json['sellingPrice'] ?? json['basePrice'], 149.0);
          final rawName = json['name'] is Map ? (json['name']['en']?.toString() ?? json['name'].values.first?.toString() ?? 'Dish') : (json['name']?.toString() ?? 'Dish');
          final rawDesc = json['description'] is Map ? (json['description']['en']?.toString() ?? json['description'].values.first?.toString() ?? '') : (json['description']?.toString() ?? '');
          final rawCat = json['category'] is Map ? (json['category']['name']?.toString() ?? 'General') : (json['category']?.toString() ?? 'General');

          return PopularDish(
            id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
            name: rawName,
            slug: json['slug']?.toString() ?? '',
            imageUrl: json['image']?.toString() ?? json['imageUrl']?.toString() ?? 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
            category: rawCat,
            price: rawPrice,
            description: rawDesc,
            isVeg: json['isVeg'] == true || json['foodType'] == 'veg',
            rating: _parseDouble(json['rating'], 0.0),
          );
        }).toList();
        if (list.isNotEmpty) return list;
      }
    } catch (e) {
      debugPrint('Error fetching popular dishes: $e');
    }
    return mockPopularDishes;
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
    if (json['menu'] != null && json['menu'] is List) {
      menuItems = (json['menu'] as List).map((i) => _fromJsonToMenuItem(i)).toList();
    }

    String rName = 'Unknown Restaurant';
    if (json['name'] != null) {
      if (json['name'] is Map) {
        rName = json['name']['en']?.toString() ?? json['name']['de']?.toString() ?? json['name'].values.first?.toString() ?? 'Unknown Restaurant';
      } else {
        rName = json['name'].toString();
      }
    }

    double parsedRating = 0.0;
    if (json['rating'] != null) {
      if (json['rating'] is Map) {
        parsedRating = _parseDouble(json['rating']['average'] ?? json['rating']['avgRating'] ?? json['adminRating'], 0.0);
      } else {
        parsedRating = _parseDouble(json['rating'], 0.0);
      }
    } else if (json['avgRating'] != null) {
      parsedRating = _parseDouble(json['avgRating'], 0.0);
    } else if (json['adminRating'] != null) {
      parsedRating = _parseDouble(json['adminRating'], 0.0);
    }

    String parsedCuisine = '';
    if (json['cuisine'] is List && (json['cuisine'] as List).isNotEmpty) {
      parsedCuisine = (json['cuisine'] as List).map((e) => e.toString()).where((s) => s.isNotEmpty).join(', ');
    } else if (json['cuisine'] is String && (json['cuisine'] as String).trim().isNotEmpty) {
      parsedCuisine = json['cuisine'].toString().trim();
    } else if (json['storeType'] != null && json['storeType'].toString().trim().isNotEmpty) {
      parsedCuisine = json['storeType'].toString().trim();
    }

    if (parsedCuisine.isEmpty) {
      final n = rName.toLowerCase();
      if (n.contains('cafe')) {
        parsedCuisine = 'Cafe, Fast Food, Beverages, Burger, Sandwich';
      } else if (n.contains('momo')) {
        parsedCuisine = 'Chinese, Momos, Fast Food';
      } else if (n.contains('biryani')) {
        parsedCuisine = 'Biryani, North Indian, Main Course';
      } else if (n.contains('pizza') || n.contains('cheesey')) {
        parsedCuisine = 'Pizza, Fast Food, Italian, Burger';
      } else if (n.contains('naan') || n.contains('rasoi') || n.contains('dhaba') || n.contains('chulha') || n.contains('rajput') || n.contains('sohna') || n.contains('pandit')) {
        parsedCuisine = 'North Indian, Main Course, Thali';
      } else if (n.contains('cake') || n.contains('sweet') || n.contains('baker')) {
        parsedCuisine = 'Cake, Bakery, Desserts';
      } else {
        parsedCuisine = 'North Indian, Fast Food, Chinese, Pizza, Burger, Biryani, Momos, Sandwich';
      }
    }

    return Restaurant(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      name: rName,
      imageUrl: json['coverImage']?.toString() ?? json['logo']?.toString() ?? json['image']?.toString() ?? 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
      rating: parsedRating,
      reviewCount: _parseInt(json['totalReviews'] != null && json['totalReviews'] > 0 ? json['totalReviews'] : (json['orderCount'] ?? json['reviewCount'] ?? json['totalReviews']), 120),
      distanceKm: _parseDouble(json['distanceKm'] ?? json['distance'], 1.8),
      deliveryTimeMin: _parseInt(json['deliveryTime'] ?? json['deliveryTimeMin'] ?? json['prepTime'], 25),
      deliveryCharge: _parseDouble(json['deliveryCharge'] ?? json['shippingFee'], 0.0),
      cuisine: parsedCuisine,
      menu: menuItems,
      isActive: json['isActive'] != false,
      isOnline: json['isOnline'] != false,
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
    final rawPrice = _parseDouble(json['price'] ?? json['sellingPrice'] ?? json['basePrice'] ?? json['b2cPrice'], 0.0);
    final rawMrp = _parseDouble(json['mrp'] ?? json['originalBasePrice'] ?? json['originalPrice'], rawPrice > 0 ? rawPrice : 0.0);
    final rawDiscount = _parseDouble(json['discountPercent'], rawMrp > rawPrice ? ((rawMrp - rawPrice) / rawMrp * 100) : 0.0);
    final isOut = json['outOfStock'] == true || json['available'] == false;

    String pName = 'Item';
    if (json['name'] != null) {
      if (json['name'] is Map) {
        pName = json['name']['en']?.toString() ?? json['name']['de']?.toString() ?? json['name'].values.first?.toString() ?? 'Item';
      } else {
        pName = json['name'].toString();
      }
    }

    String pDesc = '';
    if (json['description'] != null) {
      if (json['description'] is Map) {
        pDesc = json['description']['en']?.toString() ?? json['description']['de']?.toString() ?? json['description'].values.first?.toString() ?? '';
      } else {
        pDesc = json['description'].toString();
      }
    }

    String pCategory = 'General';
    if (json['category'] != null) {
      if (json['category'] is Map) {
        pCategory = json['category']['name'] is Map
            ? (json['category']['name']['en']?.toString() ?? json['category']['name'].values.first?.toString() ?? 'General')
            : (json['category']['name']?.toString() ?? json['category']['title']?.toString() ?? 'General');
      } else {
        pCategory = json['category'].toString();
      }
    }

    return MenuItem(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      name: pName,
      imageUrl: json['image']?.toString() ?? json['imageUrl']?.toString() ?? 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
      price: rawPrice,
      originalPrice: rawMrp > rawPrice ? rawMrp : null,
      comparisonTag: rawDiscount > 0 ? '${rawDiscount.toInt()}% OFF' : null,
      category: pCategory,
      rating: _parseDouble(json['rating'], 0.0),
      isVeg: json['isVeg'] == true || json['isVegetarian'] == true || json['foodType'] == 'veg' || json['veg'] == true,
      description: pDesc,
      outOfStock: isOut,
      preparationTime: _parseInt(json['preparationTime'], 15),
      subcategory: json['subcategory'] is Map ? (json['subcategory']['name']?.toString() ?? '') : (json['subcategory']?.toString() ?? ''),
      isFeatured: json['isFeatured'] == true,
      adminPriceOverridden: json['adminPriceOverride']?['isOverridden'] == true,
    );
  }

  static List<Restaurant> _getMockRestaurants() => [];
  static List<MenuItem> _getMockMenuItems() => [];
}

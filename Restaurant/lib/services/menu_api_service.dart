import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../api_constants.dart';
import 'category_api_service.dart';

class MenuApiService {
  static Future<List<Map<String, dynamic>>> fetchRestaurantMenu([String? restaurantId]) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      String restId = restaurantId ?? ApiConstants.restaurantId;
      if (restId.isEmpty) {
        restId = prefs.getString('restaurantId') ?? '';
      }
      if (restId.isEmpty) {
        restId = prefs.getString('userPhone') ?? 'me';
      }
      final token = prefs.getString('token') ?? ApiConstants.authToken;
      final effectiveRestId = restId.isNotEmpty ? restId : 'me';
      final url = '${ApiConstants.baseUrl}/menu/$effectiveRestId?includePending=true';
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          if (token.isNotEmpty) 'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 10));

      List<dynamic> itemsList = [];
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['items'] is List) {
          itemsList = data['items'];
        } else if (data['data'] is List) {
          itemsList = data['data'];
        }
      }

      if (itemsList.isNotEmpty) {

        return itemsList.map((item) {
          final Map<String, dynamic> itemMap = Map<String, dynamic>.from(item);
          final p = double.tryParse((itemMap['pricing']?['b2c']?['sellingPrice'] ?? itemMap['sellingPrice'] ?? itemMap['price'] ?? itemMap['basePrice'] ?? 0).toString()) ?? 0.0;
          final mrp = double.tryParse((itemMap['pricing']?['b2c']?['mrp'] ?? itemMap['mrp'] ?? p).toString()) ?? p;
          final b2bP = double.tryParse((itemMap['pricing']?['b2b']?['sellingPrice'] ?? itemMap['b2bPrice'] ?? p).toString()) ?? p;

          final rawFlavors = itemMap['flavors'] ?? itemMap['variations'] ?? itemMap['variants'] ?? [];
          final List<String> normalizedFlavors = [];
          if (rawFlavors is List) {
            for (var f in rawFlavors) {
              if (f is String && f.isNotEmpty) {
                normalizedFlavors.add(f);
              } else if (f is Map) {
                final n = f['name'];
                if (n is String && n.isNotEmpty) {
                  normalizedFlavors.add(n);
                } else if (n is Map) {
                  final s = n['en']?.toString() ?? (n.values.isNotEmpty ? n.values.first.toString() : '');
                  if (s.isNotEmpty) normalizedFlavors.add(s);
                }
              }
            }
          }

          final rawAddOns = itemMap['addOns'] ?? [];
          final List<Map<String, dynamic>> normalizedAddOns = [];
          if (rawAddOns is List) {
            for (var a in rawAddOns) {
              if (a is Map) {
                final n = a['name'];
                String aName = '';
                if (n is String) {
                  aName = n;
                } else if (n is Map) {
                  aName = n['en']?.toString() ?? (n.values.isNotEmpty ? n.values.first.toString() : '');
                }
                normalizedAddOns.add({
                  'name': aName.isNotEmpty ? aName : 'Add-on',
                  'price': double.tryParse((a['price'] ?? 0).toString()) ?? 0.0,
                  'image': a['image']?.toString() ?? 'assets/images/restaurant_chicken_item.jpg',
                });
              } else if (a is String && a.isNotEmpty) {
                normalizedAddOns.add({'name': a, 'price': 0.0, 'image': 'assets/images/restaurant_chicken_item.jpg'});
              }
            }
          }

          return {
            '_id': itemMap['_id'] ?? itemMap['id'] ?? '',
            'name': itemMap['name'] is Map ? (itemMap['name']['en'] ?? (itemMap['name'].values.isNotEmpty ? itemMap['name'].values.first.toString() : '')) : (itemMap['name'] ?? ''),
            'description': itemMap['description'] is Map ? (itemMap['description']['en'] ?? '') : (itemMap['description'] ?? ''),
            'category': itemMap['category'] is Map ? (itemMap['category']['name'] ?? '') : (itemMap['category'] ?? 'Main Course'),
            'categoryId': itemMap['categoryId'] is Map ? itemMap['categoryId']['_id'] : (itemMap['categoryId'] ?? ''),
            'subcategory': itemMap['subcategory'] is Map ? (itemMap['subcategory']['name'] ?? '') : (itemMap['subcategory'] ?? ''),
            'subcategoryId': itemMap['subcategoryId'] is Map ? itemMap['subcategoryId']['_id'] : (itemMap['subcategoryId'] ?? ''),
            'basePrice': p,
            'price': p,
            'b2cMrp': mrp,
            'mrp': mrp,
            'b2cSellingPrice': p,
            'sellingPrice': p,
            'b2bPrice': b2bP,
            'foodType': itemMap['foodType'] ?? (itemMap['isVeg'] == false ? 'non-veg' : 'veg'),
            'isVeg': itemMap['isVeg'] ?? (itemMap['foodType'] == 'veg'),
            'preparationTime': int.tryParse((itemMap['preparationTime'] ?? 15).toString()) ?? 15,
            'isAvailable': itemMap['available'] ?? itemMap['isAvailable'] ?? true,
            'available': itemMap['available'] ?? itemMap['isAvailable'] ?? true,
            'approvalStatus': itemMap['approvalStatus'] ?? (itemMap['isApproved'] == true ? 'approved' : (itemMap['isRejected'] == true ? 'rejected' : 'pending')),
            'isApproved': itemMap['isApproved'] == true,
            'isPublished': itemMap['isPublished'] == true,
            'isRejected': itemMap['isRejected'] == true,
            'rejectionReason': itemMap['rejectionReason'] ?? '',
            'changeRequest': itemMap['changeRequest'] ?? '',
            'image': itemMap['image'] ?? '',
            'flavors': normalizedFlavors,
            'variants': normalizedFlavors,
            'variations': normalizedFlavors,
            'addOns': normalizedAddOns,
          };
        }).toList();
      }
    } catch (e) {
      debugPrint('Error fetching menu items: $e');
    }
    return [];
  }

  static Future<Map<String, dynamic>?> addMenuItem(String restaurantId, Map<String, dynamic> itemData) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token') ?? ApiConstants.authToken;
      final effectiveRestId = restaurantId.isNotEmpty ? restaurantId : (prefs.getString('restaurantId') ?? 'me');
      final url = '${ApiConstants.baseUrl}/restaurants/vendor/menu/add/$effectiveRestId';

      final response = await http.post(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          if (token.isNotEmpty) 'Authorization': 'Bearer $token',
        },
        body: json.encode(itemData),
      ).timeout(const Duration(seconds: 12));

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['product'] != null ? Map<String, dynamic>.from(data['product']) : data;
      }
    } catch (e) {
      debugPrint('Error adding menu item: $e');
    }
    return null;
  }

  static Future<List<Map<String, dynamic>>> bulkImportMenuItems(String restaurantId, List<Map<String, dynamic>> items) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token') ?? ApiConstants.authToken;
      final effectiveRestId = restaurantId.isNotEmpty ? restaurantId : (prefs.getString('restaurantId') ?? 'me');
      final url = '${ApiConstants.baseUrl}/restaurants/vendor/menu/bulk-import/$effectiveRestId';

      final response = await http.post(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          if (token.isNotEmpty) 'Authorization': 'Bearer $token',
        },
        body: json.encode({'items': items}),
      ).timeout(const Duration(seconds: 20));

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['products'] is List) {
          return List<Map<String, dynamic>>.from(data['products']);
        }
      }
    } catch (e) {
      debugPrint('Error bulk importing menu items: $e');
    }
    return [];
  }

  static Future<bool> updateMenuItem(String restaurantId, String itemId, Map<String, dynamic> itemData) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token') ?? ApiConstants.authToken;
      final url = '${ApiConstants.baseUrl}/restaurants/vendor/menu/edit/$restaurantId/$itemId';

      final response = await http.put(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          if (token.isNotEmpty) 'Authorization': 'Bearer $token',
        },
        body: json.encode(itemData),
      ).timeout(const Duration(seconds: 12));

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error updating menu item: $e');
      return false;
    }
  }

  static Future<bool> deleteMenuItem(String restaurantId, String itemId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token') ?? ApiConstants.authToken;
      final url = '${ApiConstants.baseUrl}/restaurants/$restaurantId/menu/$itemId/request-delete';

      final response = await http.post(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          if (token.isNotEmpty) 'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 8));

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error deleting menu item: $e');
      return false;
    }
  }

  static Future<bool> toggleAvailability(String restaurantId, String itemId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token') ?? ApiConstants.authToken;
      final url = '${ApiConstants.baseUrl}/restaurants/vendor/menu/toggle/$restaurantId/$itemId';

      final response = await http.patch(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          if (token.isNotEmpty) 'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 8));

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error toggling availability: $e');
      return false;
    }
  }
}

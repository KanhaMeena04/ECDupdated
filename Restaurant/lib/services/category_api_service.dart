import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../api_constants.dart';

class MasterCategoryItem {
  final String id;
  final String name;
  final String slug;
  final List<MasterSubcategoryItem> subcategories;

  MasterCategoryItem({
    required this.id,
    required this.name,
    required this.slug,
    required this.subcategories,
  });

  factory MasterCategoryItem.fromJson(Map<String, dynamic> json) {
    var subs = <MasterSubcategoryItem>[];
    if (json['subcategories'] != null && json['subcategories'] is List) {
      subs = (json['subcategories'] as List)
          .map((s) => MasterSubcategoryItem.fromJson(s))
          .toList();
    }
    return MasterCategoryItem(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      subcategories: subs,
    );
  }
}

class MasterSubcategoryItem {
  final String id;
  final String name;
  final String slug;

  MasterSubcategoryItem({
    required this.id,
    required this.name,
    required this.slug,
  });

  factory MasterSubcategoryItem.fromJson(Map<String, dynamic> json) {
    return MasterSubcategoryItem(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
    );
  }
}

class CategoryApiService {
  static List<MasterCategoryItem> _cachedTree = [];

  static Future<List<MasterCategoryItem>> fetchCategoryTree({bool forceRefresh = false}) async {
    if (!forceRefresh && _cachedTree.isNotEmpty) {
      return _cachedTree;
    }

    try {
      final response = await http
          .get(Uri.parse('${ApiConstants.baseUrl}/categories/tree'))
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final list = (data['data'] as List?) ?? (data as List?);
        if (list != null) {
          _cachedTree = list.map((c) => MasterCategoryItem.fromJson(c)).toList();
          return _cachedTree;
        }
      }
    } catch (e) {
      debugPrint('Error fetching master category tree for restaurant app: $e');
    }

    return _cachedTree;
  }
}

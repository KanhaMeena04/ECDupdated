import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../core/constants/app_constants.dart';

class CategoryItemModel {
  final String id;
  final String name;
  final String slug;
  final String description;
  final String image;
  final int position;
  final bool isFeatured;
  final List<SubcategoryItemModel> subcategories;

  CategoryItemModel({
    required this.id,
    required this.name,
    required this.slug,
    required this.description,
    required this.image,
    required this.position,
    required this.isFeatured,
    required this.subcategories,
  });

  factory CategoryItemModel.fromJson(Map<String, dynamic> json) {
    var subs = <SubcategoryItemModel>[];
    if (json['subcategories'] != null && json['subcategories'] is List) {
      subs = (json['subcategories'] as List)
          .map((s) => SubcategoryItemModel.fromJson(s))
          .toList();
    }
    return CategoryItemModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? 'Category',
      slug: json['slug'] ?? '',
      description: json['description'] ?? '',
      image: (json['image'] != null && json['image'].toString().startsWith('http'))
          ? json['image']
          : 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
      position: json['position'] ?? 0,
      isFeatured: json['isFeatured'] ?? false,
      subcategories: subs,
    );
  }
}

class SubcategoryItemModel {
  final String id;
  final String name;
  final String slug;
  final String description;
  final String image;
  final int position;

  SubcategoryItemModel({
    required this.id,
    required this.name,
    required this.slug,
    required this.description,
    required this.image,
    required this.position,
  });

  factory SubcategoryItemModel.fromJson(Map<String, dynamic> json) {
    return SubcategoryItemModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      description: json['description'] ?? '',
      image: (json['image'] != null && json['image'].toString().startsWith('http'))
          ? json['image']
          : 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
      position: json['position'] ?? 0,
    );
  }
}

class CategoryService {
  static List<CategoryItemModel> _cachedCategoryTree = [];

  static String get apiBaseUrl => AppConstants.baseUrl;

  /// Fetches dynamic category tree from backend API
  static Future<List<CategoryItemModel>> getCategoryTree({bool forceRefresh = false}) async {
    if (!forceRefresh && _cachedCategoryTree.isNotEmpty) {
      return _cachedCategoryTree;
    }

    try {
      final response = await http
          .get(Uri.parse('$apiBaseUrl/categories/tree'))
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final list = (data['data'] as List?) ?? (data as List?);
        if (list != null) {
          _cachedCategoryTree =
              list.map((item) => CategoryItemModel.fromJson(item)).toList();
          return _cachedCategoryTree;
        }
      }
    } catch (e) {
      debugPrint('Error fetching category tree: $e');
    }

    // Return local cache if available on failure, otherwise empty list
    return _cachedCategoryTree;
  }
}

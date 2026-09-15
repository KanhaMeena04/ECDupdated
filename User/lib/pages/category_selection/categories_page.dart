import 'package:flutter/material.dart';
import 'food_preferences_page.dart';

class CategoriesPage extends StatefulWidget {
  final ValueChanged<List<String>>? onPreferencesSelected;
  final VoidCallback? onSkip;

  const CategoriesPage({
    super.key,
    this.onPreferencesSelected,
    this.onSkip,
  });

  @override
  State<CategoriesPage> createState() => _CategoriesPageState();
}

class _CategoriesPageState extends State<CategoriesPage> {
  @override
  Widget build(BuildContext context) {
    return FoodPreferencesPage(
      showBackButton: false,
      onCompleted: widget.onPreferencesSelected,
      onSkip: widget.onSkip,
    );
  }
}

import 'package:ecdkart_app/core/models/category.dart';
import 'package:flutter/material.dart' hide Category;
import 'package:provider/provider.dart';

import '../../providers/theme_provider.dart';

class CategoryCard extends StatelessWidget {
  final Category category;
  const CategoryCard({super.key, required this.category});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    return Container(
      margin: const EdgeInsets.only(right: 12),
      width: 86,
      decoration: BoxDecoration(
        color: isDark ? Colors.grey[850] : const Color(0xFFE89D1E).withValues(alpha: 0.1), // Accent Orange tint
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: 8),
          Container(
            height: 54,
            width: 54,
            decoration: BoxDecoration(
              image: DecorationImage(
                image: category.image.startsWith('http')
                    ? NetworkImage(category.image) as ImageProvider
                    : AssetImage(category.image),
                fit: BoxFit.contain,
              ),
            ),
          ),
          const SizedBox(height: 6),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(
              category.title,
              style: TextStyle(
                  fontSize: 13,
                  color: isDark ? Colors.white : Colors.black87,
                  fontWeight: FontWeight.w600
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}


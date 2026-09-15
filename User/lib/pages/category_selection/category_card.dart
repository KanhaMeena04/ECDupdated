import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_text_styles.dart';
import '../../providers/theme_provider.dart';

class CategoryCard extends StatefulWidget {
  final String title;
  final String subTitle;
  final String image;
  final VoidCallback onTap;

  const CategoryCard({
    super.key,
    required this.title,
    required this.subTitle,
    required this.image,
    required this.onTap,
  });

  @override
  State<CategoryCard> createState() => _CategoryCardState();
}

class _CategoryCardState extends State<CategoryCard> {
  double scale = 1.0;

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    return GestureDetector(
      onTapDown: (_) {
        setState(() => scale = 0.8); // Pressed effect
      },
      onTapUp: (_) {
        setState(() => scale = 1.0);
        widget.onTap();
      },
      onTapCancel: () {
        setState(() => scale = 1.0);
      },
      child: AnimatedScale(
        scale: scale,
        duration: const Duration(milliseconds: 120),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            color: isDark ? Colors.black.withOpacity(0.5) :Colors.white,
            border:isDark ? Border.all(
              color: Colors.grey.withOpacity(0.4)
            ): null,
            boxShadow: isDark ?  [] :[
              BoxShadow(
                color: Colors.grey.withOpacity(0.3),
                blurRadius: 10
              )
            ]
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.title, style: isDark ?  TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                      height: 1.4,
                    ) : AppTextStyles.h4),
                    Text(widget.subTitle, style: isDark ? TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.normal,
                      color: Colors.grey,
                      height: 1.3,
                    ) :AppTextStyles.caption),
                  ],
                ),
              ),
              Align(
                alignment: Alignment.bottomRight,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.asset(
                    widget.image,
                    height: MediaQuery.of(context).size.width * 0.25,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../providers/cart_provider.dart';
import '../../providers/theme_provider.dart';

class StoreCard extends StatelessWidget {

  final String image;
  final String storeName;
  final String rating;
  final String ratingCount;
  final String location;

  const StoreCard({super.key, 
    required this.image,
    required this.storeName,
    required this.rating,
    required this.ratingCount,
    required this.location
});

  @override
  Widget build(BuildContext context) {
    final cartProvider = context.watch<CartProvider>();
    final isInCart = false;
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    return GestureDetector(
      // onTap: () => context.push('${AppRoutes.productDetail}/${product.id}'),
      child: Container(
        margin: EdgeInsets.only(bottom: 12.0),
        decoration: BoxDecoration(
          color: isDark ? Colors.black.withOpacity(0.9) : Colors.white,
          borderRadius: BorderRadius.circular(8),
          boxShadow: [
            if (isDark)
              BoxShadow(
                color: AppColors.primary.withOpacity(0.15),
                blurRadius: 8,
                spreadRadius: 1,
                offset: const Offset(0, 4),
              )
            else
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
          ],
        ),
        child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: MediaQuery.of(context).size.height*0.2,
                decoration: BoxDecoration(
                  image: DecorationImage(image: AssetImage(image), fit: BoxFit.cover),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      storeName,
                      style: isDark ? TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                        height: 1.4,
                      ) : AppTextStyles.h3,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.star, size: 14, color: AppColors.secondary),
                        const SizedBox(width: 4),
                        Text('$rating ($ratingCount)', style: isDark? TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.normal,
                          color: Colors.grey,
                          height: 1.5,
                        ) : AppTextStyles.bodySmall),
                        const SizedBox(width: 8),
                        Text(location, style: isDark? TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.normal,
                          color: Colors.grey,
                          height: 1.5,
                        ) : AppTextStyles.caption,)
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
    );
  }
}

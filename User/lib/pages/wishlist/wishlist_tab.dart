import 'package:ecdkart_app/core/models/product.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../providers/theme_provider.dart';
import '../../providers/wishlist_provider.dart';
import '../widgets/product_card.dart';

class WishlistTab extends StatelessWidget {
  const WishlistTab({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    final wishlistProvider = context.watch<WishlistProvider>();

    final List<Product> favList = [
      Product(
        id: 'fav_1',
        name: 'Paneer Butter Masala',
        description: 'Rich creamy Paneer gravy from Royal Punjab',
        price: 240,
        image: 'assets/food.png',
        category: 'Indian',
        rating: 4.8,
      ),
      Product(
        id: 'fav_2',
        name: 'Special Italian Pizza',
        description: 'Delicious hot pizza with extra cheese from Pizza Express',
        price: 320,
        image: 'assets/Group 2072750484.jpg',
        category: 'Italian',
        rating: 4.9,
      ),
      Product(
        id: 'fav_3',
        name: 'Crispy Veg Burger',
        description: 'Fresh crispy patty burger from Burger Hub',
        price: 140,
        image: 'assets/food.png',
        category: 'Fast Food',
        rating: 4.7,
      ),
      ...wishlistProvider.items,
    ];

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF121212) : const Color(0xFFF5FAF8),
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          '❤️ Your Favourites',
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: Colors.white),
        ),
      ),
      body: favList.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.favorite_outline_rounded,
                    size: 80,
                    color: Colors.grey.shade400,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No Favourite Items Yet',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Tap the heart icon on items to save them here',
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                  ),
                ],
              ),
            )
          : GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 14,
                crossAxisSpacing: 14,
                childAspectRatio: 0.72,
              ),
              itemCount: favList.length,
              itemBuilder: (context, index) {
                return ProductCard(
                  product: favList[index],
                );
              },
            ),
    );
  }
}

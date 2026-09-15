import 'package:ecdkart_app/core/models/product.dart';
import 'package:ecdkart_app/core/theme/app_text_styles.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../providers/theme_provider.dart';
import '../../services/restaurant_api_service.dart';
import '../widgets/product_card.dart';

class CategoryProducts extends StatefulWidget {
  final String cat;
  const CategoryProducts({super.key, required this.cat});

  @override
  State<CategoryProducts> createState() => _CategoryProductsState();
}

class _CategoryProductsState extends State<CategoryProducts> {
  List<Product> _products = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchProducts();
  }

  Future<void> _fetchProducts() async {
    try {
      // We'll use the search API or filter all restaurants
      // For now, let's fetch all restaurants and filter their menus
      final restaurants = await RestaurantApiService.getRestaurants();
      List<Product> matchingProducts = [];
      
      for (var r in restaurants) {
        for (var item in r.menu) {
          if (item.category.toLowerCase() == widget.cat.toLowerCase() || 
              r.cuisine.toLowerCase() == widget.cat.toLowerCase()) {
            matchingProducts.add(item.toProduct());
          }
        }
      }
      
      if (mounted) {
        setState(() {
          _products = matchingProducts;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.cat, style: AppTextStyles.h4.copyWith(color: isDark ? Colors.white : Colors.black),),
        actions: [
          GestureDetector(
            onTap: (){
              showFilterBottomSheet(context);
            },
            child: Row(children: [
                Icon(Icons.filter_alt_outlined, size: 20,),
              SizedBox(width: 8,),
              Text('Sort', style: AppTextStyles.h4.copyWith(color: isDark? Colors.white : Colors.black),)
            ],),
          ),
          SizedBox(width: 20,)
        ],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
        : _products.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.fastfood_outlined, size: 64, color: Colors.grey.shade400),
                  const SizedBox(height: 16),
                  Text('No items found in this category', 
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 16)),
                ],
              ),
            )
          : GridView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                childAspectRatio: 0.75,
              ),
              itemCount: _products.length,
              itemBuilder: (context, index) {
                return ProductCard(product: _products[index]);
              },
            ),
    );
  }


  void showFilterBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Container(
          padding: EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [

              Text(
                "Sort By",
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),

              SizedBox(height: 20),

              ListTile(
                leading: Icon(Icons.arrow_upward),
                title: Text("Price: Low to High"),
                onTap: () {
                  Navigator.pop(context);
                  // sortLowToHigh();
                },
              ),

              ListTile(
                leading: Icon(Icons.arrow_downward),
                title: Text("Price: High to Low"),
                onTap: () {
                  Navigator.pop(context);
                  // sortHighToLow();
                },
              ),
            ],
          ),
        );
      },
    );
  }

}


class _ProductCard extends StatelessWidget {
  final int index;
  const _ProductCard({required this.index});
  @override
  Widget build(BuildContext context) {
    // final cartProvider = context.watch<CartProvider>();
    final isInCart = false;

    return GestureDetector(
      onTap: () {
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (context) => ProductDetailSheet(),
        );
      },
      child: Card(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                ),
                child: Stack(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                          borderRadius: BorderRadius.only(
                            topRight: Radius.circular(12),
                            topLeft: Radius.circular(12),
                          ),
                          image: DecorationImage(image: AssetImage('assets/static/cake${index+1}.jpg'), fit: BoxFit.cover)
                      ),
                    ),
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color:  Colors.green,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                           'VEG' ,
                          style: const TextStyle(color: Colors.white, fontSize: 8),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Chocolate Cake',
                    style: TextStyle(
                        fontSize: 16.0,
                        fontWeight: FontWeight.bold
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.star, size: 14, color: AppColors.secondary),
                      const SizedBox(width: 4),
                      Text('${4.5} (250)', style: AppTextStyles.bodySmall),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('₹${150}', style: AppTextStyles.price),
                      GestureDetector(
                        onTap: () {
                          // context.read<CartProvider>().addItem(product);
                          // ScaffoldMessenger.of(context).showSnackBar(
                          //   const SnackBar(
                          //     content: Text('Added to cart'),
                          //     duration: Duration(seconds: 1),
                          //   ),
                          // );
                        },
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: isInCart ? AppColors.secondary : AppColors.primary,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Icon(
                            isInCart ? Icons.check : Icons.add,
                            color: AppColors.white,
                            size: 20,
                          ),
                        ),
                      ),
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


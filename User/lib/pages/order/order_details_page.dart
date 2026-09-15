import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../providers/theme_provider.dart';

class OrderDetailsPage extends StatelessWidget {
  final String orderId;

  const OrderDetailsPage({super.key, required this.orderId});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    return Scaffold(
      appBar: AppBar(title: const Text('Order Details')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            color: Colors.white,
            child: Card(
              margin: EdgeInsets.zero,
              color: isDark ? Colors.black.withOpacity(0.9) : Colors.white,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Order #1001', style: AppTextStyles.h3.copyWith(color: isDark ? Colors.white : Colors.black)),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.success.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            'Delivered',
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.success,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text('Placed on ${DateTime.now().toString().split(' ')[0]}', style: AppTextStyles.bodySmall.copyWith(color: Colors.grey)),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text('Items', style: AppTextStyles.h4.copyWith(color: isDark?Colors.white :Colors.black)),
          const SizedBox(height: 12),
          ...List.generate(2, (index) {
            return Card(
              color: Colors.white,
              margin: const EdgeInsets.only(bottom: 12),
              child: Card(
                color: isDark ? Colors.black.withOpacity(0.9) : Colors.white,
                margin: EdgeInsets.zero,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.fastfood, color: AppColors.primary),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Product ${index + 1}', style: AppTextStyles.h4.copyWith(color: isDark? Colors.white : Colors.black)),
                            Text('Qty: 1', style: AppTextStyles.bodySmall.copyWith(color: Colors.grey)),
                            Text('₹${(index + 1) * 100}', style: AppTextStyles.price),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
          const SizedBox(height: 16),
          Text('Delivery Address', style: AppTextStyles.h4.copyWith(color: isDark?Colors.white:Colors.black)),
          const SizedBox(height: 12),
          Card(
            color: Colors.white,
            child: Card(
              color: isDark? Colors.black.withOpacity(0.9): Colors.white,
              margin: EdgeInsets.zero,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Home', style: AppTextStyles.h4.copyWith(color: isDark? Colors.white : Colors.black)),
                    const SizedBox(height: 8),
                    Text('123 Main St, City, State - 123456', style: AppTextStyles.bodyMedium.copyWith(color: isDark?Colors.white : Colors.black)),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

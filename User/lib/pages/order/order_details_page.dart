import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../providers/order_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/safe_image.dart';

class OrderDetailsPage extends StatefulWidget {
  final String orderId;
  final Map<String, dynamic>? initialOrder;

  const OrderDetailsPage({
    super.key,
    required this.orderId,
    this.initialOrder,
  });

  @override
  State<OrderDetailsPage> createState() => _OrderDetailsPageState();
}

class _OrderDetailsPageState extends State<OrderDetailsPage> {
  Map<String, dynamic>? _orderData;

  @override
  void initState() {
    super.initState();
    _orderData = widget.initialOrder;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadOrderData();
    });
  }

  void _loadOrderData() {
    final orderProvider = context.read<OrderProvider>();
    final found = orderProvider.orders.firstWhere(
      (o) => o['_id']?.toString() == widget.orderId || o['orderNumber']?.toString() == widget.orderId,
      orElse: () => widget.initialOrder ?? {},
    );

    if (found.isNotEmpty) {
      setState(() {
        _orderData = Map<String, dynamic>.from(found);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    final order = _orderData ?? {};

    if (order.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Order Details')),
        body: const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    final backendId = order['_id']?.toString() ?? widget.orderId;
    final orderNumber = order['orderNumber']?.toString().toUpperCase() ?? backendId.toUpperCase();
    final status = order['status']?.toString().toLowerCase() ?? 'placed';
    final restaurant = order['restaurant'] is Map ? order['restaurant'] : (order['store'] is Map ? order['store'] : {});
    final restaurantName = restaurant['name']?.toString() ?? 'Restaurant';
    final restaurantImage = restaurant['image']?.toString() ?? restaurant['coverImage']?.toString() ?? '';

    final rawItems = (order['items'] as List? ?? []);
    final itemsList = rawItems.map((i) {
      if (i is Map) {
        final name = i['name']?.toString() ?? i['product']?['name']?.toString() ?? 'Food Item';
        final image = i['image']?.toString() ?? i['product']?['image']?.toString() ?? '';
        final price = (i['price'] as num?)?.toDouble() ?? (i['product']?['price'] as num?)?.toDouble() ?? 0.0;
        final qty = (i['quantity'] as num? ?? i['qty'] as num? ?? 1).toInt();
        final variant = i['variant']?.toString() ?? i['variation']?['name']?.toString() ?? 'Standard';
        return {
          'name': name,
          'image': image,
          'price': price,
          'quantity': qty,
          'variant': variant,
        };
      }
      return {'name': i.toString(), 'image': '', 'price': 0.0, 'quantity': 1, 'variant': 'Standard'};
    }).toList();

    final double calculatedSubtotal = itemsList.fold<double>(0.0, (sum, i) => sum + ((i['price'] as double) * (i['quantity'] as int)));
    final double totalAmount = (order['totalAmount'] as num? ?? order['payableAmount'] as num? ?? calculatedSubtotal).toDouble();
    final double deliveryFee = (order['deliveryFee'] as num? ?? 0).toDouble();
    final double tax = (order['tax'] as num? ?? 0).toDouble();
    final String address = order['address']?['fullAddress']?.toString() ?? order['deliveryAddress']?['addressLine']?.toString() ?? 'Indore, MP';

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF111827) : const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: Text('Order #$orderNumber'),
        backgroundColor: isDark ? const Color(0xFF1F2937) : Colors.white,
        foregroundColor: isDark ? Colors.white : Colors.black,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Restaurant Info Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1F2937) : Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: SafeImage(
                    restaurantImage,
                    width: 50,
                    height: 50,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      width: 50,
                      height: 50,
                      color: AppColors.primary.withValues(alpha: 0.1),
                      child: const Icon(Icons.store, color: AppColors.primary),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        restaurantName,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white : Colors.black,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Order ID: #$orderNumber',
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    status.toUpperCase(),
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Items List
          Text('Items Ordered (${itemsList.length})', style: AppTextStyles.h4.copyWith(color: isDark ? Colors.white : Colors.black)),
          const SizedBox(height: 12),
          ...itemsList.map((item) {
            final String name = item['name'] as String;
            final String img = item['image'] as String;
            final double pr = item['price'] as double;
            final int qty = item['quantity'] as int;
            final String varName = item['variant'] as String;

            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1F2937) : Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: SafeImage(
                      img,
                      width: 44,
                      height: 44,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        width: 44,
                        height: 44,
                        color: Colors.grey[200],
                        child: const Icon(Icons.fastfood, color: AppColors.primary),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: isDark ? Colors.white : Colors.black)),
                        Text('$varName • Qty: $qty', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                      ],
                    ),
                  ),
                  Text('₹${(pr * qty).toStringAsFixed(0)}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: isDark ? Colors.white : Colors.black)),
                ],
              ),
            );
          }),

          const SizedBox(height: 16),
          // Bill Breakdown
          Text('Invoice Details', style: AppTextStyles.h4.copyWith(color: isDark ? Colors.white : Colors.black)),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1F2937) : Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                _buildBillRow('Item Subtotal', '₹${calculatedSubtotal.toStringAsFixed(2)}', isDark),
                const SizedBox(height: 8),
                _buildBillRow('Delivery Fee', deliveryFee > 0 ? '₹${deliveryFee.toStringAsFixed(2)}' : 'Free', isDark),
                if (tax > 0) ...[
                  const SizedBox(height: 8),
                  _buildBillRow('Taxes & Charges', '₹${tax.toStringAsFixed(2)}', isDark),
                ],
                const Divider(height: 20),
                _buildBillRow('Total Amount', '₹${totalAmount.toStringAsFixed(2)}', isDark, isBold: true),
              ],
            ),
          ),

          const SizedBox(height: 16),
          // Delivery Address
          Text('Delivery Address', style: AppTextStyles.h4.copyWith(color: isDark ? Colors.white : Colors.black)),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1F2937) : Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                const Icon(Icons.location_on, color: AppColors.primary),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    address,
                    style: TextStyle(fontSize: 13, color: isDark ? Colors.white : Colors.black87),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBillRow(String label, String value, bool isDark, {bool isBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(fontSize: isBold ? 14 : 13, fontWeight: isBold ? FontWeight.bold : FontWeight.normal, color: isDark ? Colors.grey[300] : Colors.grey[700])),
        Text(value, style: TextStyle(fontSize: isBold ? 15 : 13, fontWeight: isBold ? FontWeight.bold : FontWeight.w600, color: isBold ? AppColors.primary : (isDark ? Colors.white : Colors.black))),
      ],
    );
  }
}

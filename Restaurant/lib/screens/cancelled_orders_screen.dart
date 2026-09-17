import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/order_model.dart';
import '../theme/app_colors.dart';
import 'order_details_screen.dart';

class CancelledOrdersScreen extends StatefulWidget {
  const CancelledOrdersScreen({super.key});

  @override
  State<CancelledOrdersScreen> createState() => _CancelledOrdersScreenState();
}

class _CancelledOrdersScreenState extends State<CancelledOrdersScreen> {
  String _selectedTypeFilter = 'All'; // 'All', 'Pickup', 'Delivery'
  List<Order> _cancelledOrders = [];

  @override
  void initState() {
    super.initState();
    _loadMockCancelledOrders();
  }

  void _loadMockCancelledOrders() {
    final now = DateTime.now();
    _cancelledOrders = [
      Order(
        id: '2006',
        backendId: 'mock_pickup_cancel_1',
        customerName: 'Aman Sharma',
        address: '22 Park Street, Block C',
        orderName: 'Margherita Pizza + Cold Coffee',
        quantity: 2,
        items: [
          {
            'name': 'Margherita Pizza',
            'variant': 'Regular',
            'quantity': 1,
            'price': 180.0,
            'image': 'assets/images/restaurant_pizza_item.jpg',
          },
          {
            'name': 'Cold Coffee',
            'variant': 'Large',
            'quantity': 1,
            'price': 100.0,
          },
        ],
        totalAmount: 280.0,
        status: 'Cancelled',
        createdAt: now.subtract(const Duration(minutes: 25)),
        cancelledAt: now.subtract(const Duration(minutes: 22)),
        cancellationReason: 'Customer requested cancellation (within 5-min pickup window)',
        orderType: 'pickup',
      ),
      Order(
        id: '2007',
        backendId: 'mock_pickup_cancel_2',
        customerName: 'Priya Verma',
        address: '14 Connaught Place',
        orderName: '6 pcs chicken Wings',
        quantity: 1,
        items: [
          {
            'name': '6 pcs chicken Wings',
            'variant': 'Original Spicy',
            'quantity': 1,
            'price': 220.0,
            'image': 'assets/images/restaurant_chicken_item.jpg',
          },
        ],
        totalAmount: 220.0,
        status: 'Cancelled',
        createdAt: now.subtract(const Duration(hours: 2)),
        cancelledAt: now.subtract(const Duration(hours: 1, minutes: 58)),
        cancellationReason: 'Item out of stock',
        orderType: 'pickup',
      ),
      Order(
        id: '1092',
        backendId: 'mock_delivery_cancel_1',
        customerName: 'Rohan Gupta',
        address: '55 Green Park Main',
        orderName: 'Veg Thali + Gulab Jamun',
        quantity: 2,
        items: [
          {
            'name': 'Veg Thali',
            'variant': 'Special',
            'quantity': 1,
            'price': 250.0,
          },
        ],
        totalAmount: 310.0,
        status: 'Cancelled',
        createdAt: now.subtract(const Duration(hours: 5)),
        cancelledAt: now.subtract(const Duration(hours: 4, minutes: 50)),
        cancellationReason: 'Kitchen overloaded',
        orderType: 'delivery',
      ),
    ];
  }

  double get _totalRefundedAmount {
    return _cancelledOrders.fold(0.0, (sum, order) => sum + order.totalAmount);
  }

  @override
  Widget build(BuildContext context) {
    final filteredList = _cancelledOrders.where((o) {
      if (_selectedTypeFilter == 'All') return true;
      if (_selectedTypeFilter == 'Pickup') return o.isSelfPickup;
      if (_selectedTypeFilter == 'Delivery') return !o.isSelfPickup;
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: Text(
          'Cancelled Orders',
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.bold,
            fontSize: 20,
            color: Colors.black87,
          ),
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          // Revenue/Refund Summary Header Banner
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.redAccent.withValues(alpha: 0.3), width: 1.2),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.cancel_outlined, color: Colors.redAccent, size: 18),
                        const SizedBox(width: 6),
                        Text(
                          'Total Cancelled Orders',
                          style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[700]),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${_cancelledOrders.length} Orders Refunded',
                      style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('Total Refunded', style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[600])),
                    Text(
                      '₹${_totalRefundedAmount.toStringAsFixed(2)}',
                      style: GoogleFonts.poppins(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.redAccent,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Filter Segmented Buttons (All / Self Pickup / Delivery)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                _buildTypeFilterChip('All', _cancelledOrders.length),
                const SizedBox(width: 8),
                _buildTypeFilterChip('Pickup', _cancelledOrders.where((o) => o.isSelfPickup).length),
                const SizedBox(width: 8),
                _buildTypeFilterChip('Delivery', _cancelledOrders.where((o) => !o.isSelfPickup).length),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Cancelled Orders List
          Expanded(
            child: filteredList.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.remove_shopping_cart_outlined, size: 54, color: Colors.grey[400]),
                        const SizedBox(height: 12),
                        Text(
                          'No cancelled orders found',
                          style: GoogleFonts.poppins(color: Colors.grey[600], fontSize: 14),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: filteredList.length,
                    itemBuilder: (context, index) {
                      final order = filteredList[index];
                      return _buildCancelledCard(order);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypeFilterChip(String type, int count) {
    final isSelected = _selectedTypeFilter == type;
    return ChoiceChip(
      label: Text(
        '$type ($count)',
        style: GoogleFonts.poppins(
          fontSize: 12,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          color: isSelected ? Colors.white : Colors.black87,
        ),
      ),
      selected: isSelected,
      selectedColor: Colors.redAccent,
      backgroundColor: Colors.grey[200],
      onSelected: (val) {
        if (val) setState(() => _selectedTypeFilter = type);
      },
    );
  }

  Widget _buildCancelledCard(Order order) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.redAccent.withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => OrderDetailsScreen(order: order)),
          );
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Row: Order ID, Type Badge & Refund Badge
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Text('#${order.id}', style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.black87)),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: order.isSelfPickup ? Colors.orange.withValues(alpha: 0.15) : AppColors.primaryGreen.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          order.isSelfPickup ? 'SELF PICKUP' : 'DELIVERY',
                          style: GoogleFonts.poppins(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: order.isSelfPickup ? Colors.orange[800] : AppColors.primaryGreen,
                          ),
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: Colors.redAccent.withValues(alpha: 0.3)),
                    ),
                    child: Text(
                      'CANCELLED',
                      style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.redAccent),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 10),
              Text('Customer: ${order.customerName}', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.black87)),
              Text(order.orderName, maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600])),
              
              const Divider(height: 20),

              // Reason Callout
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7ED),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, color: Colors.orange, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Reason: ${order.cancellationReason ?? 'Cancelled within window'}',
                        style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w500, color: Colors.orange[900]),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // Bottom Amount & Refund Status
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.check_circle_outline, color: AppColors.primaryGreen, size: 16),
                      const SizedBox(width: 4),
                      Text('Full Refund Processed', style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.primaryGreen)),
                    ],
                  ),
                  Text('₹${order.totalAmount.toStringAsFixed(2)}', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

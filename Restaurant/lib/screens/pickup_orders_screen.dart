import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/order_model.dart';
import '../theme/app_colors.dart';
import 'order_details_screen.dart';

class PickupOrdersScreen extends StatefulWidget {
  const PickupOrdersScreen({super.key});

  @override
  State<PickupOrdersScreen> createState() => _PickupOrdersScreenState();
}

class _PickupOrdersScreenState extends State<PickupOrdersScreen> {
  String _selectedStatusFilter = 'All'; // 'All', 'Placed', 'Preparing', 'Ready', 'Picked Up'
  List<Order> _pickupOrders = [];

  @override
  void initState() {
    super.initState();
    _loadMockPickupOrders();
  }

  void _loadMockPickupOrders() {
    final now = DateTime.now();
    _pickupOrders = [
      Order(
        id: '2001',
        backendId: 'mock_pickup_1',
        customerName: 'Rohit',
        address: '13 Amsterdam st',
        orderName: '6 pcs chicken + Margherita Pizza + 2 more',
        quantity: 4,
        items: [
          {
            'name': '6 pcs chicken ...',
            'variant': 'Original',
            'quantity': 1,
            'price': 120.0,
            'image': 'assets/images/restaurant_chicken_item.jpg',
          },
          {
            'name': 'Margherita Pizza',
            'variant': 'Regular',
            'quantity': 1,
            'price': 120.0,
            'image': 'assets/images/restaurant_pizza_item.jpg',
          },
        ],
        totalAmount: 240.0,
        status: 'Placed',
        createdAt: now.subtract(const Duration(minutes: 5)),
        orderType: 'pickup',
      ),
      Order(
        id: '2002',
        backendId: 'mock_pickup_2',
        customerName: 'Rohit',
        address: '13 Amsterdam st',
        orderName: '6 pcs chicken + Margherita Pizza',
        quantity: 2,
        items: [
          {
            'name': '6 pcs chicken ...',
            'variant': 'Original',
            'quantity': 1,
            'price': 120.0,
            'image': 'assets/images/restaurant_chicken_item.jpg',
          },
          {
            'name': 'Margherita Pizza',
            'variant': 'Regular',
            'quantity': 1,
            'price': 120.0,
            'image': 'assets/images/restaurant_pizza_item.jpg',
          },
        ],
        totalAmount: 240.0,
        status: 'Placed',
        createdAt: now.subtract(const Duration(minutes: 12)),
        orderType: 'pickup',
      ),
      Order(
        id: '2003',
        backendId: 'mock_pickup_3',
        customerName: 'Rohit',
        address: '13 Amsterdam st',
        orderName: '6 pcs chicken + Margherita Pizza',
        quantity: 2,
        items: [
          {
            'name': '6 pcs chicken ...',
            'variant': 'Original',
            'quantity': 1,
            'price': 120.0,
            'image': 'assets/images/restaurant_chicken_item.jpg',
          },
          {
            'name': 'Margherita Pizza',
            'variant': 'Regular',
            'quantity': 1,
            'price': 120.0,
            'image': 'assets/images/restaurant_pizza_item.jpg',
          },
        ],
        totalAmount: 240.0,
        status: 'Preparing',
        createdAt: now.subtract(const Duration(minutes: 22)),
        orderType: 'pickup',
      ),
      Order(
        id: '2004',
        backendId: 'mock_pickup_4',
        customerName: 'Rohit',
        address: '13 Amsterdam st',
        orderName: '6 pcs chicken + Margherita Pizza',
        quantity: 2,
        items: [
          {
            'name': '6 pcs chicken ...',
            'variant': 'Original',
            'quantity': 1,
            'price': 120.0,
            'image': 'assets/images/restaurant_chicken_item.jpg',
          },
          {
            'name': 'Margherita Pizza',
            'variant': 'Regular',
            'quantity': 1,
            'price': 120.0,
            'image': 'assets/images/restaurant_pizza_item.jpg',
          },
        ],
        totalAmount: 240.0,
        status: 'Ready',
        createdAt: now.subtract(const Duration(minutes: 35)),
        orderType: 'pickup',
      ),
      Order(
        id: '2005',
        backendId: 'mock_pickup_5',
        customerName: 'Rohit',
        address: '13 Amsterdam st',
        orderName: '6 pcs chicken + Margherita Pizza',
        quantity: 2,
        items: [
          {
            'name': '6 pcs chicken ...',
            'variant': 'Original',
            'quantity': 1,
            'price': 120.0,
            'image': 'assets/images/restaurant_chicken_item.jpg',
          },
          {
            'name': 'Margherita Pizza',
            'variant': 'Regular',
            'quantity': 1,
            'price': 120.0,
            'image': 'assets/images/restaurant_pizza_item.jpg',
          },
        ],
        totalAmount: 240.0,
        status: 'Picked Up',
        createdAt: now.subtract(const Duration(minutes: 50)),
        orderType: 'pickup',
      ),
    ];
  }

  int _getCountForStatus(String status) {
    return _pickupOrders.where((o) => o.status == status).length;
  }

  void _acceptOrder(Order order) {
    setState(() {
      order.status = 'Preparing';
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Pick-up Order accepted! Moved to Preparing.'),
        backgroundColor: AppColors.primaryGreen,
      ),
    );
  }

  void _rejectOrder(Order order) {
    setState(() {
      _pickupOrders.removeWhere((o) => o.id == order.id);
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Pick-up Order rejected.'),
        backgroundColor: Colors.redAccent,
      ),
    );
  }

  void _handlePickup(Order order) {
    setState(() {
      order.status = 'Picked Up';
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Order marked as Picked Up!'),
        backgroundColor: AppColors.primaryGreen,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filteredOrders = _pickupOrders.where((o) {
      if (_selectedStatusFilter == 'All') return true;
      return o.status == _selectedStatusFilter;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: Text(
          'Pick-up Orders',
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
          // Top Earning Summary Card matching Reference Image
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFBEB),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFFDE68A), width: 1.2),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Earning',
                      style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600]),
                    ),
                    Text(
                      'January',
                      style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                  ],
                ),
                Text(
                  '₹2300.00',
                  style: GoogleFonts.poppins(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primaryGreen,
                  ),
                ),
              ],
            ),
          ),

          // Filter Pills Row matching Reference Image
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              child: Row(
                children: [
                  _buildFilterPill('Placed', const Color(0xFF6C757D)),
                  _buildFilterPill('Preparing', const Color(0xFFE89D1E)),
                  _buildFilterPill('Ready', const Color(0xFF4A90E2)),
                  _buildFilterPill('Picked Up', const Color(0xFF8E44AD)),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Pick-up Orders List
          Expanded(
            child: filteredOrders.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.shopping_bag_outlined, size: 48, color: Colors.grey[400]),
                        const SizedBox(height: 10),
                        Text(
                          'No Pick-up orders found',
                          style: GoogleFonts.poppins(color: Colors.grey[600], fontSize: 14),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: filteredOrders.length,
                    itemBuilder: (context, index) {
                      final order = filteredOrders[index];
                      return _buildPickupOrderCard(order);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterPill(String name, Color color) {
    final count = _getCountForStatus(name);
    final isSelected = _selectedStatusFilter == name;

    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedStatusFilter = isSelected ? 'All' : name;
          });
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primaryGreen : color,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            '$name ($count)',
            style: GoogleFonts.poppins(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPickupOrderCard(Order order) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!, width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Customer Row matching Reference Image
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      order.customerName,
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                    Text(
                      order.address,
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: Colors.grey[500],
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_right, color: Colors.black87),
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => OrderDetailsScreen(order: order)),
                  ),
                ),
              ],
            ),
            const Divider(height: 20, color: Color(0xFFF0F0F0)),

            // Items Horizontal Preview Row
            Row(
              children: [
                Expanded(
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.asset(
                          'assets/images/restaurant_chicken_item.jpg',
                          width: 44,
                          height: 44,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) => Container(
                            width: 44,
                            height: 44,
                            color: Colors.grey[300],
                            child: const Icon(Icons.fastfood, size: 20, color: Colors.grey),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '6 pcs chicken ...',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
                            ),
                            Text(
                              'Original',
                              style: GoogleFonts.poppins(fontSize: 10, color: Colors.grey[500]),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.asset(
                          'assets/images/restaurant_pizza_item.jpg',
                          width: 44,
                          height: 44,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) => Container(
                            width: 44,
                            height: 44,
                            color: Colors.grey[300],
                            child: const Icon(Icons.local_pizza, size: 20, color: Colors.grey),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Margherita Pizza',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
                            ),
                            Text(
                              'Regular',
                              style: GoogleFonts.poppins(fontSize: 10, color: Colors.grey[500]),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  '+2 More',
                  style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.grey[600]),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Date & Amount Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Order placed on 24, May, 11:59PM',
                      style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      order.status,
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: _getStatusColor(order.status),
                      ),
                    ),
                  ],
                ),
                Text(
                  '₹${order.totalAmount.toStringAsFixed(2)}',
                  style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Card Actions based on state matching Reference Image
            _buildActionArea(order),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Placed':
        return Colors.grey[700]!;
      case 'Preparing':
        return const Color(0xFFE89D1E);
      case 'Ready':
        return const Color(0xFF4A90E2);
      case 'Picked Up':
        return const Color(0xFF8E44AD);
      default:
        return AppColors.primaryGreen;
    }
  }

  Widget _buildActionArea(Order order) {
    if (order.status == 'Placed') {
      return Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: () => _rejectOrder(order),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.primaryGreen, width: 1.5),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: Text(
                'Reject',
                style: GoogleFonts.poppins(color: AppColors.primaryGreen, fontWeight: FontWeight.bold, fontSize: 14),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton(
              onPressed: () => _acceptOrder(order),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryGreen,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: Text(
                'Accept',
                style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
              ),
            ),
          ),
        ],
      );
    } else if (order.status == 'Ready') {
      return Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Has the rider picked\nup your food?',
            style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black),
          ),
          ElevatedButton(
            onPressed: () => _handlePickup(order),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryGreen,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
            child: Text(
              'Pick up',
              style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
            ),
          ),
        ],
      );
    } else if (order.status == 'Picked Up') {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFFFFFBEB),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFFDE68A), width: 1),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Your order is almost there!',
              style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w500, color: Colors.black87),
            ),
            const Icon(Icons.two_wheeler_rounded, color: AppColors.primaryGreen, size: 20),
          ],
        ),
      );
    } else {
      return const SizedBox.shrink();
    }
  }
}

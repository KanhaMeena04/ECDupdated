import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/order_model.dart';
import '../services/restaurant_api_service.dart';
import '../theme/app_colors.dart';
import 'order_details_screen.dart';
import 'cancelled_orders_screen.dart';

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
    _fetchLivePickupOrders();
  }

  Future<void> _fetchLivePickupOrders() async {
    try {
      final res = await RestaurantApiService.getRestaurantOrders();
      if (res['success'] == true && res['orders'] is List && mounted) {
        final List list = res['orders'];
        final List<Order> parsed = [];
        for (var raw in list) {
          final isPickup = raw['orderType'] == 'pickup' || raw['isPickup'] == true || (raw['deliveryType'] ?? '').toString().toLowerCase().contains('pickup');
          if (isPickup) {
            final orderId = (raw['_id'] ?? raw['id'] ?? '').toString();
            final shortId = orderId.length > 4 ? orderId.substring(orderId.length - 4) : orderId;
            final itemsList = (raw['items'] as List?)?.map((i) => {
              'name': i['name'] ?? i['title'] ?? 'Item',
              'variant': i['variant'] ?? '',
              'quantity': i['quantity'] ?? 1,
              'price': (i['price'] as num?)?.toDouble() ?? 0.0,
            }).toList() ?? [];

            parsed.add(
              Order(
                id: shortId.isNotEmpty ? shortId : '1001',
                backendId: orderId,
                customerName: raw['customerName'] ?? raw['user']?['name'] ?? 'Customer',
                address: raw['address'] ?? raw['deliveryAddress']?['address'] ?? 'Counter Pickup',
                orderName: itemsList.isNotEmpty ? itemsList.first['name'] : 'Order Items',
                quantity: itemsList.length,
                items: itemsList,
                totalAmount: (raw['totalAmount'] as num?)?.toDouble() ?? (raw['grandTotal'] as num?)?.toDouble() ?? 0.0,
                status: raw['orderStatus'] == 'confirmed' ? 'Placed' : (raw['orderStatus'] == 'preparing' ? 'Preparing' : (raw['orderStatus'] == 'ready' ? 'Ready' : (raw['orderStatus'] == 'completed' ? 'Picked Up' : 'Placed'))),
                createdAt: raw['createdAt'] != null ? DateTime.tryParse(raw['createdAt']) ?? DateTime.now() : DateTime.now(),
                orderType: 'pickup',
              ),
            );
          }
        }
        if (parsed.isNotEmpty) {
          setState(() {
            _pickupOrders = parsed;
          });
        }
      }
    } catch (_) {}
  }

  void _loadMockPickupOrders() {
    final now = DateTime.now();
    _pickupOrders = [
      Order(
        id: '2009',
        backendId: 'mock_pickup_fresh_2',
        customerName: 'Karan Malhotra',
        address: '15 Civil Lines, Counter Pickup',
        orderName: 'Special Thali + Cold Coffee',
        quantity: 2,
        items: [
          {
            'name': 'Special Thali',
            'variant': 'Deluxe',
            'quantity': 1,
            'price': 250.0,
            'image': 'assets/images/restaurant_chicken_item.jpg',
          },
          {
            'name': 'Cold Coffee',
            'variant': 'Large',
            'quantity': 1,
            'price': 100.0,
            'image': 'assets/images/restaurant_pizza_item.jpg',
          },
        ],
        totalAmount: 350.0,
        status: 'Placed',
        createdAt: now, // Placed JUST NOW
        orderType: 'pickup',
      ),
      Order(
        id: '2000',
        backendId: 'mock_pickup_new_1',
        customerName: 'Amit Patel',
        address: '88 MG Road, Counter Pickup',
        orderName: 'Farmhouse Pizza + Chocolate Lava Cake',
        quantity: 2,
        items: [
          {
            'name': 'Farmhouse Pizza',
            'variant': 'Medium',
            'quantity': 1,
            'price': 250.0,
            'image': 'assets/images/restaurant_pizza_item.jpg',
          },
        ],
        totalAmount: 320.0,
        status: 'Placed',
        createdAt: now, // Placed JUST NOW (Full 5 min cancellation window active)
        orderType: 'pickup',
      ),
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
      Order(
        id: '2006',
        backendId: 'mock_pickup_6',
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
        ],
        totalAmount: 280.0,
        status: 'Cancelled',
        createdAt: now.subtract(const Duration(minutes: 25)),
        cancelledAt: now.subtract(const Duration(minutes: 22)),
        cancellationReason: 'Customer requested cancellation (within 5-min window)',
        orderType: 'pickup',
      ),
    ];
  }

  int _getCountForStatus(String status) {
    if (status == 'Arrived 🔔') {
      return _pickupOrders.where((o) => o.customerArrived && o.status != 'Handed Over' && o.status != 'Picked Up').length;
    }
    return _pickupOrders.where((o) => o.status == status).length;
  }

  void _acceptOrder(Order order) {
    int selectedTime = 15;
    int selectedBuffer = 0;
    final TextEditingController bufferReasonCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final int totalTime = selectedTime + selectedBuffer;

            return Container(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
                top: 20,
                left: 20,
                right: 20,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text('Accept Pickup Order #${order.id}', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold)),
                    Text('Select Preparation Time, Buffer & Reason', style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600])),
                    const SizedBox(height: 16),

                    // 1. Prep Time
                    Text('Estimated Prep Time', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [10, 15, 20, 25, 30, 45].map((mins) {
                        final isSelected = selectedTime == mins;
                        return ChoiceChip(
                          label: Text('$mins Mins', style: GoogleFonts.poppins(color: isSelected ? Colors.white : Colors.black87)),
                          selected: isSelected,
                          selectedColor: AppColors.primaryGreen,
                          onSelected: (val) => setModalState(() => selectedTime = mins),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 16),

                    // 2. Preparation Buffer Time (Optional)
                    Row(
                      children: [
                        Text('Preparation Buffer Time ', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600)),
                        Text('(Optional)', style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[500])),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [0, 5, 10, 15, 20].map((mins) {
                        final isSelected = selectedBuffer == mins;
                        return ChoiceChip(
                          label: Text(mins == 0 ? 'No Buffer (+0m)' : '+$mins Mins Buffer', style: GoogleFonts.poppins(color: isSelected ? Colors.white : Colors.black87)),
                          selected: isSelected,
                          selectedColor: Colors.orange,
                          backgroundColor: const Color(0xFFF3F4F6),
                          onSelected: (val) => setModalState(() => selectedBuffer = mins),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 14),

                    // 3. Buffer Reason Description Box
                    if (selectedBuffer > 0) ...[
                      Text('Why is buffer time required? (Optional)', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.orange[900])),
                      const SizedBox(height: 6),
                      TextField(
                        controller: bufferReasonCtrl,
                        maxLines: 2,
                        style: GoogleFonts.poppins(fontSize: 12),
                        decoration: InputDecoration(
                          hintText: 'e.g. Peak hour rush in kitchen',
                          hintStyle: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[400]),
                          contentPadding: const EdgeInsets.all(12),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.orange, width: 2)),
                        ),
                      ),
                      const SizedBox(height: 14),
                    ],

                    // Total Pickup Time Card
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(color: const Color(0xFFFFFBEB), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.amber)),
                      child: Row(
                        children: [
                          const Icon(Icons.av_timer, color: Colors.amber, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              '⏱️ Total Pickup Time: $totalTime Mins ($selectedTime mins prep + $selectedBuffer mins buffer)',
                              style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.amber[900]),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () async {
                          Navigator.pop(context);
                          setState(() {
                            order.prepTimeMinutes = selectedTime;
                            order.bufferTimeMinutes = selectedBuffer;
                            order.bufferReason = bufferReasonCtrl.text.trim();
                            order.status = 'Preparing';
                          });
                          try {
                            await RestaurantApiService.prepareOrder(order.backendId.isNotEmpty ? order.backendId : order.id);
                          } catch (_) {}
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Order #${order.id} accepted! Total pickup time: $totalTime mins.'),
                                backgroundColor: AppColors.primaryGreen,
                              ),
                            );
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryGreen,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text('Confirm & Start Preparing', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white)),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
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
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => OrderDetailsScreen(order: order)),
    ).then((_) => setState(() {}));
  }

  @override
  Widget build(BuildContext context) {
    final filteredOrders = _pickupOrders.where((o) {
      if (_selectedStatusFilter == 'All') return true;
      if (_selectedStatusFilter == 'Arrived 🔔') return o.customerArrived && o.status != 'Handed Over' && o.status != 'Picked Up';
      return o.status == _selectedStatusFilter;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: Text(
          'Self Pickup Orders',
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
        actions: [
          IconButton(
            tooltip: 'View Cancelled Orders',
            icon: const Icon(Icons.cancel_outlined, color: Colors.redAccent),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const CancelledOrdersScreen()),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Top Earning Summary Card
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
                    Text('Self Pickup Revenue', style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600])),
                    Text('Active Counter', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black87)),
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

          // Filter Pills Row
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
                  _buildFilterPill('Arrived 🔔', Colors.orange),
                  _buildFilterPill('Picked Up', const Color(0xFF8E44AD)),
                  _buildFilterPill('Cancelled', Colors.redAccent),
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
                          'No Self Pickup orders found',
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
    final bool isArrived = order.customerArrived;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isArrived ? Colors.orange : Colors.grey[200]!, width: isArrived ? 1.5 : 1),
        boxShadow: [
          BoxShadow(
            color: isArrived ? Colors.orange.withValues(alpha: 0.1) : Colors.black.withValues(alpha: 0.04),
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
            if (isArrived) ...[
              Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(color: const Color(0xFFFFF7ED), borderRadius: BorderRadius.circular(8)),
                child: Row(
                  children: [
                    const Icon(Icons.notifications_active, color: Colors.orange, size: 16),
                    const SizedBox(width: 6),
                    Text('Customer Arrived at Counter! ("I\'m Here")', style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.orange[900])),
                  ],
                ),
              ),
            ],

            // Top Customer Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(order.customerName, style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black)),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(color: Colors.grey[100], borderRadius: BorderRadius.circular(4), border: Border.all(color: Colors.grey[300]!)),
                          child: Text('OTP: ${order.pickupOtp ?? '4892'}', style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black87)),
                        ),
                      ],
                    ),
                    Text('Self Pickup • Counter Collection', style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[500])),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_right, color: Colors.black87),
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => OrderDetailsScreen(order: order)),
                  ).then((_) => setState(() {})),
                ),
              ],
            ),
            const Divider(height: 20, color: Color(0xFFF0F0F0)),

            // Items Preview Row
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
                          errorBuilder: (context, error, stackTrace) => Container(width: 44, height: 44, color: Colors.grey[300], child: const Icon(Icons.fastfood, size: 20, color: Colors.grey)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(order.orderName, maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87)),
                            Text('Standard', style: GoogleFonts.poppins(fontSize: 10, color: Colors.grey[500])),
                          ],
                        ),
                      ),
                    ],
                  ),
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
                    Text('Order ID #${order.id}', style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[600])),
                    Text(order.status, style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600, color: _getStatusColor(order.status))),
                  ],
                ),
                Text('₹${order.totalAmount.toStringAsFixed(2)}', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black)),
              ],
            ),
            const SizedBox(height: 14),

            // Card Actions
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
      case 'Ready for Pickup':
        return const Color(0xFF4A90E2);
      case 'Picked Up':
      case 'Handed Over':
        return const Color(0xFF8E44AD);
      default:
        return AppColors.primaryGreen;
    }
  }

  Widget _buildActionArea(Order order) {
    if (order.status == 'Placed' || order.status == 'Pending') {
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
              child: Text('Reject', style: GoogleFonts.poppins(color: AppColors.primaryGreen, fontWeight: FontWeight.bold, fontSize: 14)),
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
              child: Text('Accept Order', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
            ),
          ),
        ],
      );
    } else if (order.status == 'Preparing' || order.status == 'Ready' || order.status == 'Ready for Pickup') {
      return Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(order.customerArrived ? '🔔 Customer at Counter!' : 'Pickup Verification', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black)),
          ElevatedButton(
            onPressed: () => _handlePickup(order),
            style: ElevatedButton.styleFrom(
              backgroundColor: order.customerArrived ? Colors.orange : AppColors.primaryGreen,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            ),
            child: Text(order.customerArrived ? 'Verify OTP' : 'View / Handover', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
          ),
        ],
      );
    } else if (order.status == 'Cancelled') {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(color: const Color(0xFFFEF2F2), borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.redAccent.withValues(alpha: 0.3))),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                '❌ Cancelled (${order.cancellationReason ?? 'Full Refund'})',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.redAccent),
              ),
            ),
            const Icon(Icons.cancel, color: Colors.redAccent, size: 18),
          ],
        ),
      );
    } else {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(color: const Color(0xFFF3F4F6), borderRadius: BorderRadius.circular(10)),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Food Handed Over & Order Completed', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w500, color: Colors.black87)),
            const Icon(Icons.check_circle, color: AppColors.primaryGreen, size: 20),
          ],
        ),
      );
    }
  }
}

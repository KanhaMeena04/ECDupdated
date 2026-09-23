import 'package:flutter/material.dart';
import 'dart:async';
import 'package:google_fonts/google_fonts.dart';
import 'package:audioplayers/audioplayers.dart';
import '../models/order_model.dart';
import '../services/restaurant_api_service.dart';
import '../theme/app_colors.dart';
import 'menu_management_screen.dart';
import 'restaurant_dashboard_screen.dart';
import 'profile_screen.dart';
import 'order_details_screen.dart';
import 'cancelled_orders_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentBottomNavIndex = 0;
  bool _isOnline = true;
  String _selectedOrderType = 'delivery'; // 'delivery' or 'pickup'
  String _selectedStatusFilter = 'All'; // 'All', 'Placed', 'Preparing', 'Ready', 'Picked Up', 'Delivered'

  List<Order> _orders = [];
  final Map<String, TextEditingController> _otpControllers = {};
  Timer? _timer;
  final AudioPlayer _audioPlayer = AudioPlayer();

  @override
  void initState() {
    super.initState();
    _loadInitialMockData();
    _fetchLiveOrders();
  }

  Future<void> _fetchLiveOrders() async {
    try {
      final res = await RestaurantApiService.getRestaurantOrders();
      if (res['success'] == true && res['orders'] is List && (res['orders'] as List).isNotEmpty) {
        final List<dynamic> list = res['orders'];
        final List<Order> loaded = [];
        for (var item in list) {
          try {
            if (item is Map<String, dynamic>) {
              loaded.add(Order.fromJson(item));
            }
          } catch (e) {
            debugPrint('Error parsing order: $e');
          }
        }
        if (loaded.isNotEmpty && mounted) {
          setState(() {
            _orders = loaded;
            for (var order in _orders) {
              if (order.status == 'Ready' && !_otpControllers.containsKey(order.id)) {
                _otpControllers[order.id] = TextEditingController(text: order.pickupOtp ?? '1234');
              }
            }
          });
        }
      }
    } catch (e) {
      debugPrint('Error loading live orders: $e');
    }
  }

  void _loadInitialMockData() {
    final now = DateTime.now();
    _orders = [
      Order(
        id: '1000',
        backendId: 'mock_ord_new_1',
        customerName: 'Rahul Sharma',
        address: '42 Park Avenue, Flat 3B',
        orderName: 'Butter Chicken + 2 Butter Naan',
        quantity: 2,
        items: [
          {
            'name': 'Butter Chicken',
            'variant': 'Half',
            'quantity': 1,
            'price': 260.0,
            'image': 'assets/images/restaurant_chicken_item.jpg',
          },
          {
            'name': 'Butter Naan',
            'variant': 'Standard',
            'quantity': 2,
            'price': 100.0,
            'image': 'assets/images/restaurant_pizza_item.jpg',
          },
        ],
        totalAmount: 360.0,
        status: 'Placed',
        createdAt: now, // Placed JUST NOW (Full 5 min cancellation window active)
        orderType: 'delivery',
      ),
      Order(
        id: '1001',
        backendId: 'mock_ord_1',
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
        createdAt: now.subtract(const Duration(minutes: 1)),
        orderType: 'delivery',
      ),
      Order(
        id: '1002',
        backendId: 'mock_ord_2',
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
        createdAt: now.subtract(const Duration(minutes: 18)),
        orderType: 'delivery',
      ),
      Order(
        id: '1003',
        backendId: 'mock_ord_3',
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
        createdAt: now.subtract(const Duration(minutes: 32)),
        orderType: 'delivery',
      ),
      Order(
        id: '1004',
        backendId: 'mock_ord_4',
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
        createdAt: now.subtract(const Duration(minutes: 45)),
        orderType: 'delivery',
      ),
      Order(
        id: '1005',
        backendId: 'mock_ord_5',
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
        status: 'Delivered',
        createdAt: now.subtract(const Duration(hours: 1, minutes: 10)),
        orderType: 'delivery',
      ),
      Order(
        id: '1006',
        backendId: 'mock_ord_6',
        customerName: 'Priya Verma',
        address: '55 Green Park Main',
        orderName: 'Paneer Tikka + Garlic Naan',
        quantity: 2,
        items: [
          {
            'name': 'Paneer Tikka',
            'variant': 'Special',
            'quantity': 1,
            'price': 220.0,
            'image': 'assets/images/restaurant_chicken_item.jpg',
          },
        ],
        totalAmount: 310.0,
        status: 'Cancelled',
        createdAt: now.subtract(const Duration(minutes: 15)),
        cancelledAt: now.subtract(const Duration(minutes: 12)),
        cancellationReason: 'Customer requested cancellation (within 5-min window)',
        orderType: 'delivery',
      ),

      // --- Pick-up Orders (Matching Reference Image) ---
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
        createdAt: now.subtract(const Duration(minutes: 2)),
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
        createdAt: now.subtract(const Duration(minutes: 8)),
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
        createdAt: now.subtract(const Duration(minutes: 15)),
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
        createdAt: now.subtract(const Duration(minutes: 25)),
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
        createdAt: now.subtract(const Duration(minutes: 40)),
        orderType: 'pickup',
      ),
    ];

    for (var order in _orders) {
      if (order.status == 'Ready' && !_otpControllers.containsKey(order.id)) {
        _otpControllers[order.id] = TextEditingController(text: '1234');
      }
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _audioPlayer.dispose();
    for (var controller in _otpControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  void _acceptOrder(Order order) {
    setState(() {
      order.status = 'Preparing';
    });
    RestaurantApiService.prepareOrder(order.backendId.isNotEmpty ? order.backendId : order.id);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Order accepted! Moved to Preparing state.'),
        backgroundColor: AppColors.primaryGreen,
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _rejectOrder(Order order) {
    setState(() {
      _orders.removeWhere((o) => o.id == order.id);
    });
    RestaurantApiService.cancelOrder(order.backendId.isNotEmpty ? order.backendId : order.id, "Order rejected by restaurant");
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Order rejected.'),
        backgroundColor: Colors.redAccent,
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _markSearchingRider(Order order) {
    RestaurantApiService.markOrderReady(order.backendId.isNotEmpty ? order.backendId : order.id);
    _showSearchingRiderModal(order);
  }

  void _showSearchingRiderModal(Order order) {
    Timer? searchTimer;
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (dialogContext) {
        // Auto assign rider after 3 seconds simulation
        searchTimer = Timer(const Duration(seconds: 3), () {
          if (Navigator.canPop(dialogContext)) {
            Navigator.pop(dialogContext);
          }
          if (mounted) {
            setState(() {
              order.status = 'Ready';
              order.riderName = 'Ramesh Kumar (Rider)';
              order.riderPhone = '+91 98765 43210';
              if (!_otpControllers.containsKey(order.id)) {
                _otpControllers[order.id] = TextEditingController(text: '1234');
              }
            });
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Rider Found! Assigned nearby rider Ramesh Kumar'),
                backgroundColor: AppColors.primaryGreen,
                duration: Duration(seconds: 3),
              ),
            );
          }
        });

        return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          elevation: 10,
          backgroundColor: Colors.white,
          child: Container(
            width: 270,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Searching Rider...',
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 28),

                // Animated Circular Progress with Scooter Icon matching Reference Image
                SizedBox(
                  width: 124,
                  height: 124,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Inner circular background tint
                      Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.primaryGreen.withValues(alpha: 0.12),
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.delivery_dining_rounded,
                            size: 54,
                            color: AppColors.primaryGreen,
                          ),
                        ),
                      ),

                      // Outer circular progress spinner ring
                      const SizedBox(
                        width: 120,
                        height: 120,
                        child: CircularProgressIndicator(
                          strokeWidth: 4.5,
                          valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryGreen),
                          backgroundColor: Color(0xFFE8F5E9),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                Text(
                  'Connecting to nearby riders...',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        );
      },
    ).then((_) {
      searchTimer?.cancel();
    });
  }

  void _handlePickup(Order order) {
    setState(() {
      order.status = 'Picked Up';
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Order picked up by rider!'),
        backgroundColor: AppColors.primaryGreen,
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _markDelivered(Order order) {
    setState(() {
      order.status = 'Delivered';
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Order marked as Delivered successfully!'),
        backgroundColor: AppColors.primaryGreen,
        duration: Duration(seconds: 2),
      ),
    );
  }

  int _getCountForStatus(String status) {
    return _orders.where((o) => o.orderType == _selectedOrderType && o.status == status).length;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: IndexedStack(
          index: _currentBottomNavIndex,
          children: [
            _buildHomeScreenContent(),
            const MenuManagementScreen(),
            const RestaurantDashboardScreen(),
            const ProfileScreen(),
          ],
        ),
      ),
      bottomNavigationBar: _buildReferenceBottomNavBar(),
    );
  }

  Widget _buildHomeScreenContent() {
    // Filter orders based on status filter & order type
    final filteredOrders = _orders.where((o) {
      final matchesType = o.orderType == _selectedOrderType;
      if (_selectedStatusFilter == 'All') return matchesType;
      return matchesType && o.status == _selectedStatusFilter;
    }).toList();

    return Column(
      children: [
        // Top Header Section
        _buildHeaderSection(),

        // Scrollable Body
        Expanded(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 12),
                // Earnings Card Banner
                _buildEarningsCard(),
                const SizedBox(height: 16),

                // Order Type Selector (Delivery / Pick-up)
                _buildOrderTypeTabs(),
                const SizedBox(height: 16),

                // Horizontal Filter Pills Row
                _buildFilterPillsRow(),
                const SizedBox(height: 12),

                if (_selectedStatusFilter == 'Cancelled') ...[
                  InkWell(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const CancelledOrdersScreen()),
                      );
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF2F2),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.redAccent.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.analytics_outlined, color: Colors.redAccent, size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Cancelled & Refunded Report', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87)),
                                Text('Tap to view full cancellation log and store refund details', style: GoogleFonts.poppins(fontSize: 10, color: Colors.grey[600])),
                              ],
                            ),
                          ),
                          const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.redAccent),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],

                // Orders List
                if (filteredOrders.isEmpty)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 40),
                    alignment: Alignment.center,
                    child: Column(
                      children: [
                        Icon(Icons.inbox_outlined, size: 48, color: Colors.grey[400]),
                        const SizedBox(height: 10),
                        Text(
                          'No orders in this status',
                          style: GoogleFonts.poppins(color: Colors.grey[600], fontSize: 14),
                        ),
                      ],
                    ),
                  )
                else
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: filteredOrders.length,
                    itemBuilder: (context, index) {
                      final order = filteredOrders[index];
                      return _buildReferenceOrderCard(order);
                    },
                  ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // Header Section matching Reference Image 1 with generated gourmet background image & safe error handling
  Widget _buildHeaderSection() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Background Header Image with safe errorBuilder fallback
          Positioned.fill(
            child: Image.asset(
              'assets/images/restaurant_top_header_bg.jpg',
              fit: BoxFit.cover,
              color: Colors.white.withValues(alpha: 0.92),
              colorBlendMode: BlendMode.srcOver,
              errorBuilder: (context, error, stackTrace) => Container(
                color: Colors.white,
              ),
            ),
          ),

          // Header Content
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
            child: Row(
              children: [
                // Restaurant Profile Avatar with safe fallback
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.primaryGreen, width: 2),
                    color: Colors.white,
                  ),
                  child: ClipOval(
                    child: Image.asset(
                      'assets/images/restaurant_login_header.jpg',
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
                        color: AppColors.primaryGreen.withValues(alpha: 0.1),
                        child: const Icon(Icons.restaurant, color: AppColors.primaryGreen, size: 24),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),

                // Restaurant Name & Edit Profile Link
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'ECDKART Partner Restaurant',
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.black,
                        ),
                      ),
                      GestureDetector(
                        onTap: () {
                          setState(() => _currentBottomNavIndex = 3); // Switch to Profile
                        },
                        child: Text(
                          'Edit Restaurant Profile',
                          style: GoogleFonts.poppins(
                            fontSize: 11,
                            color: AppColors.primaryGreen,
                            fontWeight: FontWeight.w600,
                            decoration: TextDecoration.underline,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Online / Offline Switch
                Switch(
                  value: _isOnline,
                  onChanged: (val) {
                    setState(() => _isOnline = val);
                    RestaurantApiService.toggleActiveStatus(val);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(_isOnline ? 'Restaurant is now Online' : 'Restaurant is Offline'),
                        backgroundColor: _isOnline ? AppColors.primaryGreen : Colors.red,
                        duration: const Duration(seconds: 2),
                      ),
                    );
                  },
                  activeThumbColor: AppColors.primaryGreen,
                ),
                const SizedBox(width: 4),

                // Notification Bell Button
                GestureDetector(
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('No new notifications')),
                    );
                  },
                  child: Container(
                    width: 38,
                    height: 38,
                    decoration: const BoxDecoration(
                      color: AppColors.primaryGreen,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.notifications_active_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Earnings Banner Card matching Reference Image 1 with yellow background
  Widget _buildEarningsCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB), // Soft elegant yellow card background
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
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  color: Colors.grey[700],
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                'January',
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
            ],
          ),
          Text(
            '₹2300.00',
            style: GoogleFonts.poppins(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: AppColors.primaryGreen, // Primary Green Text
            ),
          ),
        ],
      ),
    );
  }

  // Order Type Tabs (Delivery / Pick-up)
  Widget _buildOrderTypeTabs() {
    return Container(
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0xFFEEEEEE), width: 1.5)),
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _selectedOrderType = 'delivery'),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: _selectedOrderType == 'delivery' ? AppColors.primaryGreen : Colors.transparent,
                      width: 2.5,
                    ),
                  ),
                ),
                child: Text(
                  'Delivery',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(
                    fontSize: 15,
                    fontWeight: _selectedOrderType == 'delivery' ? FontWeight.bold : FontWeight.w500,
                    color: _selectedOrderType == 'delivery' ? Colors.black : Colors.grey[600],
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _selectedOrderType = 'pickup'),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: _selectedOrderType == 'pickup' ? AppColors.primaryGreen : Colors.transparent,
                      width: 2.5,
                    ),
                  ),
                ),
                child: Text(
                  'Pick-up',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(
                    fontSize: 15,
                    fontWeight: _selectedOrderType == 'pickup' ? FontWeight.bold : FontWeight.w500,
                    color: _selectedOrderType == 'pickup' ? Colors.black : Colors.grey[600],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Filter Pills Row matching Reference Image 1 & 2
  Widget _buildFilterPillsRow() {
    final filters = [
      {'name': 'Placed', 'count': _getCountForStatus('Placed'), 'color': const Color(0xFF6C757D)},
      {'name': 'Preparing', 'count': _getCountForStatus('Preparing'), 'color': const Color(0xFFE89D1E)},
      {'name': 'Ready', 'count': _getCountForStatus('Ready'), 'color': const Color(0xFF4A90E2)},
      {'name': 'Picked Up', 'count': _getCountForStatus('Picked Up'), 'color': const Color(0xFF8E44AD)},
      {'name': 'Delivered', 'count': _getCountForStatus('Delivered'), 'color': AppColors.primaryGreen},
      {'name': 'Cancelled', 'count': _getCountForStatus('Cancelled'), 'color': Colors.redAccent},
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: filters.map((f) {
          final String name = f['name'] as String;
          final int count = f['count'] as int;
          final Color pillColor = f['color'] as Color;
          final bool isSelected = _selectedStatusFilter == name;

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
                  color: isSelected ? AppColors.primaryGreen : pillColor,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: isSelected
                      ? [
                          BoxShadow(
                            color: AppColors.primaryGreen.withValues(alpha: 0.3),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          )
                        ]
                      : [],
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
        }).toList(),
      ),
    );
  }

  // Order Card Component matching Reference UI strictly
  Widget _buildReferenceOrderCard(Order order) {
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
            // Top Customer Header Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
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

            // Items Horizontal Preview Row
            Row(
              children: [
                // Item 1
                Expanded(
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.asset(
                          order.items.isNotEmpty && order.items[0]['image'] != null
                              ? order.items[0]['image']
                              : 'assets/images/restaurant_chicken_item.jpg',
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
                              order.items.isNotEmpty ? order.items[0]['name'] : '6 pcs chicken ...',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
                            ),
                            Text(
                              order.items.isNotEmpty ? (order.items[0]['variant'] ?? 'Original') : 'Original',
                              style: GoogleFonts.poppins(
                                fontSize: 10,
                                color: Colors.grey[500],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),

                // Item 2
                Expanded(
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.asset(
                          order.items.length > 1 && order.items[1]['image'] != null
                              ? order.items[1]['image']
                              : 'assets/images/restaurant_pizza_item.jpg',
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
                              order.items.length > 1 ? order.items[1]['name'] : 'Margherita Pizza',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
                            ),
                            Text(
                              order.items.length > 1 ? (order.items[1]['variant'] ?? 'Regular') : 'Regular',
                              style: GoogleFonts.poppins(
                                fontSize: 10,
                                color: Colors.grey[500],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  '+2 More',
                  style: GoogleFonts.poppins(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Order Date & Price Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Order placed on 24, May, 11:59PM',
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      order.status,
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: _getStatusTextColor(order.status),
                      ),
                    ),
                  ],
                ),
                Text(
                  '₹${order.totalAmount.toStringAsFixed(2)}',
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Bottom Action Area matching each state
            _buildCardActionArea(order),
          ],
        ),
      ),
    );
  }

  // State Action Section matching exact reference images
  Widget _buildCardActionArea(Order order) {
    if (order.isSelfPickup) {
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
                child: Text(
                  'Reject',
                  style: GoogleFonts.poppins(color: AppColors.primaryGreen, fontWeight: FontWeight.bold, fontSize: 14),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => OrderDetailsScreen(order: order))).then((_) => setState(() {})),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryGreen,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: Text(
                  'Accept Order',
                  style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                ),
              ),
            ),
          ],
        );
      } else if (order.status == 'Preparing' || order.status == 'Ready' || order.status == 'Ready for Pickup') {
        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              order.customerArrived ? '🔔 Customer at Counter!' : 'Self Pickup Verification',
              style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black),
            ),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => OrderDetailsScreen(order: order))).then((_) => setState(() {})),
              style: ElevatedButton.styleFrom(
                backgroundColor: order.customerArrived ? Colors.orange : AppColors.primaryGreen,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
              ),
              child: Text(
                order.customerArrived ? 'Verify OTP' : 'View / Handover',
                style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
          ],
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
                style: GoogleFonts.poppins(
                  color: AppColors.primaryGreen,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton(
              onPressed: () => _acceptOrder(order),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryGreen, // Primary Green Theme
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: Text(
                'Accept',
                style: GoogleFonts.poppins(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),
          ),
        ],
      );
    } else if (order.status == 'Preparing') {
      return Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Food is ready for\npickup',
            style: GoogleFonts.poppins(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: Colors.black,
            ),
          ),
          ElevatedButton(
            onPressed: () => _markSearchingRider(order),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryGreen, // Solid green theme button
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
            ),
            child: Text(
              'Searching Rider',
              style: GoogleFonts.poppins(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 13,
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
            style: GoogleFonts.poppins(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: Colors.black,
            ),
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
              style: GoogleFonts.poppins(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
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
              style: GoogleFonts.poppins(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: Colors.black87,
              ),
            ),
            GestureDetector(
              onTap: () => _markDelivered(order),
              child: const Icon(
                Icons.two_wheeler_rounded,
                color: AppColors.primaryGreen,
                size: 24,
              ),
            ),
          ],
        ),
      );
    } else if (order.status == 'Delivered') {
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
            Expanded(
              child: Text(
                'Your order has been delivered successfully.\nOrder completed.',
                style: GoogleFonts.poppins(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: Colors.black87,
                ),
              ),
            ),
            const Icon(
              Icons.delivery_dining_rounded,
              color: AppColors.primaryGreen,
              size: 26,
            ),
          ],
        ),
      );
    } else if (order.status == 'Cancelled') {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFFFEF2F2),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.redAccent.withValues(alpha: 0.3)),
        ),
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
    }
    return const SizedBox.shrink();
  }

  Color _getStatusTextColor(String status) {
    switch (status) {
      case 'Placed':
        return Colors.grey[600]!;
      case 'Preparing':
        return const Color(0xFFE89D1E);
      case 'Ready':
        return const Color(0xFF4A90E2);
      case 'Picked Up':
        return const Color(0xFF8E44AD);
      case 'Delivered':
        return AppColors.primaryGreen;
      case 'Cancelled':
        return Colors.redAccent;
      default:
        return Colors.black;
    }
  }

  // Custom Bottom Navigation Bar with active indicator line matching Reference Image 3
  Widget _buildReferenceBottomNavBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildNavItem(0, Icons.home_rounded, 'Home'),
          _buildNavItem(1, Icons.assignment_outlined, 'Menu'),
          _buildNavItem(2, Icons.space_dashboard_outlined, 'Dashboard'),
          _buildNavItem(3, Icons.person_outline_rounded, 'Profile'),
        ],
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    final isSelected = _currentBottomNavIndex == index;

    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _currentBottomNavIndex = index),
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Active top line indicator matching Reference Image 3
            Container(
              height: 3,
              width: double.infinity,
              color: isSelected ? AppColors.primaryGreen : Colors.transparent,
            ),
            const SizedBox(height: 8),
            Icon(
              icon,
              color: isSelected ? AppColors.primaryGreen : Colors.grey[500],
              size: 22,
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: GoogleFonts.poppins(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                color: isSelected ? AppColors.primaryGreen : Colors.grey[500],
              ),
            ),
            const SizedBox(height: 6),
          ],
        ),
      ),
    );
  }
}

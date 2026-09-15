import 'package:flutter/material.dart';
import 'dart:async';
import 'package:google_fonts/google_fonts.dart';
import 'package:audioplayers/audioplayers.dart';
import '../models/order_model.dart';
import 'menu_management_screen.dart';
import 'order_history_screen.dart';
import 'profile_screen.dart';
import 'restaurant_wallet_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentBottomNavIndex = 0;
  bool _isOnline = true;
  final Map<String, TextEditingController> _otpControllers = {};
  List<Order> _orders = [];
  Timer? _timer;
  final AudioPlayer _audioPlayer = AudioPlayer();

  String _selectedFilter = 'today'; // Default to today
  int _totalOrders = 12;
  double _totalEarnings = 3480.00;
  bool _isLoadingStats = false;

  @override
  void initState() {
    super.initState();
    _loadInitialMockData();
  }

  void _loadInitialMockData() {
    final now = DateTime.now();
    _orders = [
      Order(
        id: '1001',
        backendId: 'mock_ord_1',
        customerName: 'Rahul Sharma',
        orderName: 'Paneer Butter Masala + 1 more',
        quantity: 2,
        items: [
          {'name': 'Paneer Butter Masala', 'quantity': 2, 'price': 240.0},
          {'name': 'Butter Naan', 'quantity': 4, 'price': 40.0},
        ],
        totalAmount: 640.0,
        status: 'Accepted',
        createdAt: now.subtract(const Duration(minutes: 10)),
        orderType: 'delivery',
      ),
      Order(
        id: '1002',
        backendId: 'mock_ord_2',
        customerName: 'Priya Singh',
        orderName: 'Veg Biryani + 1 more',
        quantity: 1,
        items: [
          {'name': 'Veg Biryani', 'quantity': 1, 'price': 220.0},
          {'name': 'Raita', 'quantity': 1, 'price': 40.0},
        ],
        totalAmount: 260.0,
        status: 'Preparing',
        createdAt: now.subtract(const Duration(minutes: 25)),
        orderType: 'delivery',
      ),
      Order(
        id: '1003',
        backendId: 'mock_ord_3',
        customerName: 'Amit Verma',
        orderName: 'Chole Bhature',
        quantity: 2,
        items: [
          {'name': 'Chole Bhature', 'quantity': 2, 'price': 150.0},
        ],
        totalAmount: 300.0,
        status: 'Rider Assigned',
        createdAt: now.subtract(const Duration(minutes: 40)),
        orderType: 'delivery',
      ),
    ];

    for (var order in _orders) {
      if (order.status == 'Rider Assigned' && !_otpControllers.containsKey(order.id)) {
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

  void _toggleOnlineStatus(bool value) {
    setState(() {
      _isOnline = value;
    });

    if (_isOnline) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('You are now online. Restaurant is receiving orders.'),
          backgroundColor: Color(0xFF248C70),
          duration: Duration(seconds: 2),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('You are offline. Food is no longer purchasable.'),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  void _prepareOrder(Order order) {
    setState(() {
      final index = _orders.indexWhere((o) => o.id == order.id);
      if (index != -1) {
        _orders[index] = Order(
          id: order.id,
          backendId: order.backendId,
          customerName: order.customerName,
          orderName: order.orderName,
          quantity: order.quantity,
          items: order.items,
          totalAmount: order.totalAmount,
          status: 'Preparing',
          createdAt: order.createdAt,
          orderType: order.orderType,
        );
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Order is now being prepared.'), backgroundColor: Colors.orange),
    );
  }

  void _assignToRider(Order order) {
    setState(() {
      final index = _orders.indexWhere((o) => o.id == order.id);
      if (index != -1) {
        _orders[index] = Order(
          id: order.id,
          backendId: order.backendId,
          customerName: order.customerName,
          orderName: order.orderName,
          quantity: order.quantity,
          items: order.items,
          totalAmount: order.totalAmount,
          status: 'Rider Assigned',
          createdAt: order.createdAt,
          orderType: order.orderType,
        );
        _otpControllers[order.id] = TextEditingController(text: '1234');
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Order marked ready! Waiting for rider (OTP: 1234)'), backgroundColor: Colors.blue),
    );
  }

  void _verifyAndHandover(Order order) {
    final otp = _otpControllers[order.id]?.text ?? '';

    if (otp.length == 4) {
      setState(() {
        _orders.removeWhere((o) => o.id == order.id);
        _otpControllers.remove(order.id);
        _totalOrders += 1;
        _totalEarnings += order.totalAmount;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('OTP Verified! Order handed over to rider.'), backgroundColor: Color(0xFF248C70)),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 4-digit OTP.'), backgroundColor: Colors.red),
      );
    }
  }

  void _fetchDashboardStats({bool showLoading = false}) {
    if (showLoading) {
      setState(() => _isLoadingStats = true);
    }

    Future.delayed(const Duration(milliseconds: 200), () {
      if (mounted) {
        setState(() {
          if (_selectedFilter == 'today') {
            _totalOrders = 12;
            _totalEarnings = 3480.00;
          } else if (_selectedFilter == 'weekly') {
            _totalOrders = 84;
            _totalEarnings = 24360.00;
          } else {
            _totalOrders = 360;
            _totalEarnings = 104400.00;
          }
          if (showLoading) _isLoadingStats = false;
        });
      }
    });
  }

  void _showCancelDialog(Order order) {
    String? selectedReason;
    final TextEditingController noteController = TextEditingController();

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (dialogContext, setStateDialog) {
            return AlertDialog(
              title: const Text('Cancel Order', style: TextStyle(fontWeight: FontWeight.bold)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Please select a reason for cancellation:', style: TextStyle(fontSize: 14)),
                    const SizedBox(height: 10),
                    RadioGroup<String>(
                      groupValue: selectedReason,
                      onChanged: (value) => setStateDialog(() => selectedReason = value),
                      child: const Column(
                        children: [
                          RadioListTile<String>(
                            title: Text('We have no ingredients', style: TextStyle(fontSize: 14)),
                            value: 'We have no ingredients',
                            contentPadding: EdgeInsets.zero,
                          ),
                          RadioListTile<String>(
                            title: Text('Supplier issue / Not able to service this order', style: TextStyle(fontSize: 14)),
                            value: 'Supplier issue / Not able to service this order',
                            contentPadding: EdgeInsets.zero,
                          ),
                          RadioListTile<String>(
                            title: Text('Others', style: TextStyle(fontSize: 14)),
                            value: 'Others',
                            contentPadding: EdgeInsets.zero,
                          ),
                        ],
                      ),
                    ),
                    if (selectedReason == 'Others') ...[
                      const SizedBox(height: 10),
                      TextField(
                        controller: noteController,
                        decoration: const InputDecoration(
                          hintText: 'Enter cancellation note...',
                          border: OutlineInputBorder(),
                        ),
                        maxLines: 2,
                      ),
                    ],
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogContext),
                  child: const Text('Back', style: TextStyle(color: Colors.grey)),
                ),
                ElevatedButton(
                  onPressed: () {
                    if (selectedReason == null) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Please select a reason')),
                      );
                      return;
                    }
                    final finalReason = selectedReason == 'Others'
                        ? (noteController.text.trim().isEmpty ? 'Others' : noteController.text.trim())
                        : selectedReason!;
                    Navigator.pop(dialogContext);
                    _cancelOrder(order, finalReason);
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                  child: const Text('Confirm Cancel', style: TextStyle(color: Colors.white)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _cancelOrder(Order order, String reason) {
    setState(() {
      _orders.removeWhere((o) => o.id == order.id);
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Order cancelled.'), backgroundColor: Colors.orange),
    );
  }

  String _formatDate(DateTime? date) {
    if (date == null) return '';
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${date.day} ${months[date.month - 1]}, ${date.hour > 12 ? date.hour - 12 : (date.hour == 0 ? 12 : date.hour)}:${date.minute.toString().padLeft(2, '0')} ${date.hour >= 12 ? 'PM' : 'AM'}';
  }

  @override
  Widget build(BuildContext context) {
    final activeOrdersCount = _orders.where((o) => o.status != 'Delivered' && o.status != 'Cancelled').length;

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        backgroundColor: const Color(0xFFF5FAF8),
        appBar: _currentBottomNavIndex == 0
            ? AppBar(
                backgroundColor: Colors.white,
                elevation: 0.5,
                title: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFF248C70), width: 1.5),
                        color: Colors.white,
                      ),
                      child: ClipOval(
                        child: Image.asset(
                          'splash_logo.png',
                          width: 32,
                          height: 32,
                          fit: BoxFit.contain,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'ECDKART Restaurant',
                          style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 16, color: const Color(0xFF2C2C2C)),
                        ),
                        Text(
                          _isOnline ? 'Online • Receiving Orders' : 'Offline • Not Accepting Orders',
                          style: TextStyle(
                            fontSize: 11,
                            color: _isOnline ? const Color(0xFF248C70) : Colors.red,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                actions: [
                  Row(
                    children: [
                      Text(
                        _isOnline ? 'ONLINE' : 'OFFLINE',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: _isOnline ? const Color(0xFF248C70) : Colors.red,
                        ),
                      ),
                      Switch(
                        value: _isOnline,
                        onChanged: _toggleOnlineStatus,
                        activeThumbColor: const Color(0xFF248C70),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.account_circle, color: Color(0xFF2C2C2C)),
                    onPressed: () {
                      setState(() {
                        _currentBottomNavIndex = 4;
                      });
                    },
                  ),
                ],
                bottom: const TabBar(
                  labelColor: Color(0xFF248C70),
                  unselectedLabelColor: Colors.grey,
                  indicatorColor: Color(0xFF248C70),
                  tabs: [
                    Tab(text: 'Orders Overview'),
                    Tab(text: 'Analytics & Revenue'),
                  ],
                ),
              )
            : null,
        body: IndexedStack(
          index: _currentBottomNavIndex,
          children: [
            TabBarView(
              children: [
                _buildOrdersTab(),
                _buildAnalyticsTab(),
              ],
            ),
            const MenuManagementScreen(),
            const OrderHistoryScreen(),
            const RestaurantWalletScreen(),
            const ProfileScreen(),
          ],
        ),
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 10,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: NavigationBar(
            selectedIndex: _currentBottomNavIndex,
            onDestinationSelected: (index) {
              setState(() {
                _currentBottomNavIndex = index;
              });
            },
            backgroundColor: Colors.white,
            indicatorColor: const Color(0xFF248C70).withValues(alpha: 0.15),
            elevation: 0,
            destinations: [
              NavigationDestination(
                icon: Badge(
                  label: Text('$activeOrdersCount'),
                  isLabelVisible: activeOrdersCount > 0,
                  backgroundColor: const Color(0xFFE89D1E),
                  child: const Icon(Icons.dashboard_outlined),
                ),
                selectedIcon: Badge(
                  label: Text('$activeOrdersCount'),
                  isLabelVisible: activeOrdersCount > 0,
                  backgroundColor: const Color(0xFFE89D1E),
                  child: const Icon(Icons.dashboard_rounded, color: Color(0xFF248C70)),
                ),
                label: 'Orders',
              ),
              const NavigationDestination(
                icon: Icon(Icons.restaurant_menu_outlined),
                selectedIcon: Icon(Icons.restaurant_menu_rounded, color: Color(0xFF248C70)),
                label: 'Menu',
              ),
              const NavigationDestination(
                icon: Icon(Icons.history_outlined),
                selectedIcon: Icon(Icons.history_rounded, color: Color(0xFF248C70)),
                label: 'History',
              ),
              const NavigationDestination(
                icon: Icon(Icons.account_balance_wallet_outlined),
                selectedIcon: Icon(Icons.account_balance_wallet_rounded, color: Color(0xFF248C70)),
                label: 'Wallet',
              ),
              const NavigationDestination(
                icon: Icon(Icons.person_outline_rounded),
                selectedIcon: Icon(Icons.person_rounded, color: Color(0xFF248C70)),
                label: 'Profile',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOrdersTab() {
    final activeOrders = _orders.where((o) => o.status != 'Delivered' && o.status != 'Cancelled').toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Live Orders (${activeOrders.length})',
                style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF2C2C2C)),
              ),
              ElevatedButton.icon(
                onPressed: () {
                  setState(() {
                    _loadInitialMockData();
                  });
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Orders Refreshed!'), backgroundColor: Color(0xFF248C70)),
                  );
                },
                icon: const Icon(Icons.refresh, size: 16),
                label: const Text('Refresh'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF248C70),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (activeOrders.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(30),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Column(
                children: [
                  Icon(Icons.inbox, size: 48, color: Colors.grey),
                  SizedBox(height: 12),
                  Text('No active orders right now', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w500)),
                ],
              ),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: activeOrders.length,
              itemBuilder: (context, index) {
                final order = activeOrders[index];
                return _buildOrderCard(order);
              },
            ),
        ],
      ),
    );
  }

  Widget _buildOrderCard(Order order) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Order #${order.id}', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(order.status).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    order.status,
                    style: TextStyle(color: _getStatusColor(order.status), fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text('Customer: ${order.customerName}', style: const TextStyle(fontSize: 13, color: Colors.grey)),
            Text('Placed at: ${_formatDate(order.createdAt)}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
            const Divider(height: 20),
            Column(
              children: order.items.map((item) {
                final Map<String, dynamic> itemMap = item is Map<String, dynamic>
                    ? item
                    : {'name': 'Item', 'quantity': 1, 'price': 0.0};
                final name = itemMap['name'] ?? 'Item';
                final qty = itemMap['quantity'] ?? 1;
                final price = (itemMap['price'] ?? 0.0).toDouble();

                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('${qty}x $name', style: const TextStyle(fontWeight: FontWeight.w500)),
                      Text('₹${(price * qty).toStringAsFixed(0)}'),
                    ],
                  ),
                );
              }).toList(),
            ),
            const Divider(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Total Amount', style: TextStyle(fontWeight: FontWeight.bold)),
                Text('₹${order.totalAmount.toStringAsFixed(0)}', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF248C70))),
              ],
            ),
            const SizedBox(height: 12),
            _buildOrderActions(order),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderActions(Order order) {
    if (order.status == 'Accepted') {
      return Row(
        children: [
          Expanded(
            child: ElevatedButton(
              onPressed: () => _prepareOrder(order),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
              child: const Text('Start Preparing', style: TextStyle(color: Colors.white)),
            ),
          ),
          const SizedBox(width: 8),
          OutlinedButton(
            onPressed: () => _showCancelDialog(order),
            style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Cancel'),
          ),
        ],
      );
    } else if (order.status == 'Preparing') {
      return Row(
        children: [
          Expanded(
            child: ElevatedButton(
              onPressed: () => _assignToRider(order),
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF248C70)),
              child: const Text('Mark Food Ready', style: TextStyle(color: Colors.white)),
            ),
          ),
        ],
      );
    } else if (order.status == 'Rider Assigned') {
      final controller = _otpControllers[order.id];
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Enter 4-Digit Rider Handover OTP:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: controller,
                  keyboardType: TextInputType.number,
                  maxLength: 4,
                  decoration: const InputDecoration(
                    hintText: 'OTP (e.g. 1234)',
                    counterText: '',
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: () => _verifyAndHandover(order),
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF248C70)),
                child: const Text('Verify & Handover', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ],
      );
    }
    return const SizedBox.shrink();
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Accepted':
        return Colors.blue;
      case 'Preparing':
        return Colors.orange;
      case 'Rider Assigned':
        return Colors.purple;
      case 'Delivered':
        return const Color(0xFF248C70);
      default:
        return Colors.grey;
    }
  }

  Widget _buildAnalyticsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Performance Overview', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold)),
              DropdownButton<String>(
                value: _selectedFilter,
                items: const [
                  DropdownMenuItem(value: 'today', child: Text('Today')),
                  DropdownMenuItem(value: 'weekly', child: Text('This Week')),
                  DropdownMenuItem(value: 'monthly', child: Text('This Month')),
                ],
                onChanged: (val) {
                  if (val != null) {
                    setState(() => _selectedFilter = val);
                    _fetchDashboardStats(showLoading: true);
                  }
                },
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_isLoadingStats)
            const Center(child: CircularProgressIndicator(color: Color(0xFF248C70)))
          else
            Row(
              children: [
                Expanded(
                  child: _buildStatCard('Total Orders', '$_totalOrders', Icons.shopping_bag, Colors.blue),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildStatCard('Total Revenue', '₹${_totalEarnings.toStringAsFixed(0)}', Icons.account_balance_wallet, const Color(0xFF248C70)),
                ),
              ],
            ),
          const SizedBox(height: 20),
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: ListTile(
              leading: const Icon(Icons.wallet, color: Color(0xFFE89D1E), size: 32),
              title: const Text('View Wallet & Payout Details', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: const Text('Check commission, pending payouts, and bank transfers'),
              trailing: const Icon(Icons.arrow_forward_ios, size: 16),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const RestaurantWalletScreen()),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 3))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(backgroundColor: color.withValues(alpha: 0.15), child: Icon(icon, color: color)),
          const SizedBox(height: 12),
          Text(title, style: const TextStyle(color: Colors.grey, fontSize: 13)),
          const SizedBox(height: 4),
          Text(value, style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF2C2C2C))),
        ],
      ),
    );
  }
}

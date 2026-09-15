import 'package:ecd_restaurant/widgets/safe_image.dart';
import 'package:flutter/material.dart';
import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:google_fonts/google_fonts.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:audioplayers/audioplayers.dart';
import '../api_constants.dart';
import '../models/order_model.dart';
import 'profile_screen.dart';
import 'restaurant_wallet_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _isOnline = false;
  final Map<String, TextEditingController> _otpControllers = {};
  List<Order> _orders = [];
  Timer? _timer;
  IO.Socket? _socket;
  final AudioPlayer _audioPlayer = AudioPlayer();

  String _selectedFilter = 'today'; // Default to today
  int _totalOrders = 0;
  double _totalEarnings = 0;
  bool _isLoadingStats = false;

  @override
  void initState() {
    super.initState();
    _fetchProfile();
    _fetchDashboardStats(showLoading: true);
    _fetchOrders();
    _initSocket();
    
    // Fallback polling just in case, but slower since we have websockets now
    _timer = Timer.periodic(const Duration(seconds: 15), (timer) {
      if (_isOnline) _fetchOrders();
    });
  }

  void _initSocket() {
    try {
      // Assuming base url format: http://10.0.2.2:5000/api/v1 -> we need the base domain for socket
      String socketUrl = ApiConstants.baseUrl.replaceAll('/api/v1', '');
      
      _socket = IO.io(socketUrl, IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .build());

      _socket?.connect();

      _socket?.onConnect((_) {
        debugPrint('Connected to Socket');
        _socket?.emit('joinRestaurant', ApiConstants.restaurantId);
      });

      _socket?.on('newOrder', (data) {
        debugPrint('New order received via socket!');
        if (_isOnline) {
          _playNotificationSound();
          _fetchOrders();
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('New Order Arrived!', style: TextStyle(fontWeight: FontWeight.bold)),
                backgroundColor: const Color(0xFF248C70),
                duration: Duration(seconds: 3),
              ),
            );
          }
        }
      });

      _socket?.onDisconnect((_) => debugPrint('Disconnected from Socket'));
    } catch (e) {
      debugPrint('Socket init error: $e');
    }
  }

  void _playNotificationSound() async {
    try {
      await _audioPlayer.play(AssetSource('audio/notification.ogg'));
    } catch (e) {
      debugPrint('Error playing sound: $e');
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _socket?.disconnect();
    _socket?.dispose();
    _audioPlayer.dispose();
    for (var controller in _otpControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _fetchProfile() async {
    try {
      final response = await http.get(
        Uri.parse(ApiConstants.getProfile(ApiConstants.restaurantId)),
        headers: {'Authorization': 'Bearer ${ApiConstants.authToken}'},
      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (mounted) {
          setState(() {
            _isOnline = data['restaurant']['isOnline'] ?? false;
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching profile: $e');
    }
  }

  Future<void> _fetchOrders() async {
    try {
      final response = await http.get(
        Uri.parse(ApiConstants.getRestaurantOrders(ApiConstants.restaurantId)),
        headers: {'Authorization': 'Bearer ${ApiConstants.authToken}'},
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        if (mounted) {
          setState(() {
            _orders = data.map((json) => Order.fromJson(json)).toList();
            // Initialize OTP controllers for any order that has a rider assigned
            for (var order in _orders) {
              if (order.status == 'Rider Assigned' && !_otpControllers.containsKey(order.id)) {
                _otpControllers[order.id] = TextEditingController();
              }
            }
          });
        }
        _fetchDashboardStats();
      }
    } catch (e) {
      debugPrint('Error fetching orders: $e');
    }
  }

  Future<void> _toggleOnlineStatus(bool value) async {
    final previousState = _isOnline;
    setState(() {
      _isOnline = value;
    });
    
    try {
      final response = await http.patch(
        Uri.parse(ApiConstants.toggleActive(ApiConstants.restaurantId)),
        headers: {
          'Authorization': 'Bearer ${ApiConstants.authToken}',
          'Content-Type': 'application/json',
        },
        body: json.encode({'isOnline': value}),
      );
      if (response.statusCode == 200) {
        if (_isOnline) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('You are now online. Restaurant is receiving orders.'),
              backgroundColor: const Color(0xFF248C70),
              duration: Duration(seconds: 2),
            ),
          );
          _fetchOrders();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('You are offline. Food is no longer purchasable.'),
              backgroundColor: Colors.red,
              duration: Duration(seconds: 2),
            ),
          );
        }
      } else {
        setState(() { _isOnline = previousState; });
      }
    } catch (e) {
      setState(() { _isOnline = previousState; });
      debugPrint('Error toggling status: $e');
    }
  }

  Future<void> _prepareOrder(Order order) async {
    try {
      final response = await http.patch(
        Uri.parse(ApiConstants.prepareOrder(order.backendId)),
        headers: {'Authorization': 'Bearer ${ApiConstants.authToken}'},
      );
      if (response.statusCode == 200) {
        _fetchOrders();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Order is now being prepared.'), backgroundColor: Colors.orange),
        );
      }
    } catch (e) {
      debugPrint('Error preparing order: $e');
    }
  }

  Future<void> _assignToRider(Order order) async {
    try {
      final response = await http.patch(
        Uri.parse(ApiConstants.assignRider(order.backendId)),
        headers: {'Authorization': 'Bearer ${ApiConstants.authToken}'},
      );
      if (response.statusCode == 200) {
        _fetchOrders();
        final body = jsonDecode(response.body);
        if (body['driverNotFound'] == true) {
          if (mounted) {
            showDialog(
              context: context,
              builder: (_) => AlertDialog(
                title: const Text('No Rider Available'),
                content: const Text('Rider is offline or none are available right now. Please try assigning again later.'),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('OK'),
                  ),
                ],
              ),
            );
          }
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Order marked ready! Waiting for rider...'), backgroundColor: Colors.blue),
            );
          }
        }
      }
    } catch (e) {
      debugPrint('Error assigning rider: $e');
    }
  }

  Future<void> _verifyAndHandover(Order order) async {
    final otp = _otpControllers[order.id]?.text ?? '';
    
    if (otp.length == 4) {
      try {
        final response = await http.post(
          Uri.parse(ApiConstants.verifyPickup(order.backendId)),
          headers: {
            'Authorization': 'Bearer ${ApiConstants.authToken}',
            'Content-Type': 'application/json',
          },
          body: json.encode({'otp': otp}),
        );
        if (response.statusCode == 200) {
          _fetchOrders();
          _otpControllers.remove(order.id);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('OTP Verified! Order handed over to rider.'), backgroundColor: const Color(0xFF248C70)),
          );
        } else {
          final err = json.decode(response.body)['message'] ?? 'Invalid OTP';
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(err), backgroundColor: Colors.red),
          );
        }
      } catch (e) {
        debugPrint('Error verifying OTP: $e');
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 4-digit OTP.'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _verifySelfPickupOTP(Order order, String otp) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConstants.baseUrl}/orders/${order.backendId}/verify-self-pickup'),
        headers: {
          'Authorization': 'Bearer ${ApiConstants.authToken}',
          'Content-Type': 'application/json',
        },
        body: json.encode({'orderId': order.backendId, 'selfPickupCode': otp}),
      );
      if (response.statusCode == 200) {
        _fetchOrders();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Self-Pickup Verified! Order Completed ðŸŽ‰'), backgroundColor: Color(0xFF248C70)),
        );
      } else {
        final err = json.decode(response.body)['message'] ?? 'Invalid Pickup OTP';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(err), backgroundColor: Colors.red),
        );
      }
    } catch (e) {
      debugPrint('Error verifying self-pickup: $e');
    }
  }

  Future<void> _markPickupCompleted(Order order) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConstants.completePickup(order.backendId)),
        headers: {'Authorization': 'Bearer ${ApiConstants.authToken}'},
      );
      if (response.statusCode == 200) {
        _fetchOrders();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Takeaway Order Completed!'), backgroundColor: const Color(0xFF248C70)),
        );
      } else {
        final err = json.decode(response.body)['message'] ?? 'Error completing order';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(err), backgroundColor: Colors.red),
        );
      }
    } catch (e) {
      debugPrint('Error completing pickup: $e');
    }
  }

  Future<void> _fetchDashboardStats({bool showLoading = false}) async {
    if (showLoading) {
      setState(() => _isLoadingStats = true);
    }
    try {
      final response = await http.get(
        Uri.parse(ApiConstants.getDashboardStats(ApiConstants.restaurantId, _selectedFilter)),
        headers: {'Authorization': 'Bearer ${ApiConstants.authToken}'},
      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (mounted) {
          setState(() {
            _totalOrders = data['totalOrders'] ?? 0;
            _totalEarnings = (data['totalEarnings'] ?? 0).toDouble();
            if (showLoading) _isLoadingStats = false;
          });
        }
      } else {
        if (mounted && showLoading) setState(() => _isLoadingStats = false);
      }
    } catch (e) {
      debugPrint('Error fetching stats: $e');
      if (mounted && showLoading) setState(() => _isLoadingStats = false);
    }
  }

  void _showCancelDialog(Order order) {
    String? selectedReason;
    final TextEditingController _noteController = TextEditingController();

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: const Text('Cancel Order', style: TextStyle(fontWeight: FontWeight.bold)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Please select a reason for cancellation:', style: TextStyle(fontSize: 14)),
                    const SizedBox(height: 10),
                    RadioListTile<String>(
                      title: const Text('We have no ingredients', style: TextStyle(fontSize: 14)),
                      value: 'We have no ingredients',
                      groupValue: selectedReason,
                      onChanged: (value) => setState(() => selectedReason = value),
                      contentPadding: EdgeInsets.zero,
                    ),
                    RadioListTile<String>(
                      title: const Text('Supplier issue / Not able to service this order', style: TextStyle(fontSize: 14)),
                      value: 'Supplier issue / Not able to service this order',
                      groupValue: selectedReason,
                      onChanged: (value) => setState(() => selectedReason = value),
                      contentPadding: EdgeInsets.zero,
                    ),
                    RadioListTile<String>(
                      title: const Text('Others', style: TextStyle(fontSize: 14)),
                      value: 'Others',
                      groupValue: selectedReason,
                      onChanged: (value) => setState(() => selectedReason = value),
                      contentPadding: EdgeInsets.zero,
                    ),
                    if (selectedReason == 'Others') ...[
                      const SizedBox(height: 10),
                      TextField(
                        controller: _noteController,
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
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Close'),
                ),
                ElevatedButton(
                  onPressed: selectedReason == null
                      ? null
                      : () {
                          String finalReason = selectedReason!;
                          if (selectedReason == 'Others') {
                            if (_noteController.text.trim().isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Please enter a note.'), backgroundColor: Colors.red),
                              );
                              return;
                            }
                            finalReason = 'Others: ${_noteController.text.trim()}';
                          }
                          Navigator.pop(context);
                          _cancelOrder(order, finalReason);
                        },
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                  child: const Text('Cancel Order', style: TextStyle(color: Colors.white)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _cancelOrder(Order order, String reason) async {
    try {
      final response = await http.patch(
        Uri.parse(ApiConstants.cancelOrder(order.backendId)),
        headers: {
          'Authorization': 'Bearer ${ApiConstants.authToken}',
          'Content-Type': 'application/json',
        },
        body: json.encode({'reason': reason}),
      );
      if (response.statusCode == 200) {
        _fetchOrders();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Order cancelled. Auto-refund initiated.'), backgroundColor: Colors.orange),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to cancel: ${json.decode(response.body)['message'] ?? 'Error'}'), backgroundColor: Colors.red),
        );
      }
    } catch (e) {
      debugPrint('Error cancelling order: $e');
    }
  }

  String _formatDate(DateTime? date) {
    if (date == null) return '';
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${date.day} ${months[date.month - 1]}, ${date.hour > 12 ? date.hour - 12 : (date.hour == 0 ? 12 : date.hour)}:${date.minute.toString().padLeft(2, '0')} ${date.hour >= 12 ? 'PM' : 'AM'}';
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        backgroundColor: const Color(0xFFF5FAF8),
        appBar: AppBar(
          elevation: 2,
          shadowColor: Colors.black45,
          titleSpacing: 8,
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: const [
                    BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: Image.asset('splash_logo.png', height: 34, width: 34, fit: BoxFit.contain),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'ECD KART',
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w800,
                          fontSize: 17,
                          letterSpacing: 0.5,
                          color: Colors.black,
                        ),
                      ),
                    ),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'RESTAURANT',
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w900,
                          fontSize: 9,
                          letterSpacing: 1.5,
                          color: Colors.black87,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          backgroundColor: const Color(0xFF9EF01A),
          foregroundColor: Colors.black,
          actions: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _isOnline ? const Color(0xFF248C70) : Colors.redAccent.withOpacity(0.8),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 8, height: 8,
                        decoration: BoxDecoration(
                          color: _isOnline ? Colors.white : Colors.white70,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(_isOnline ? 'ONLINE' : 'OFFLINE', 
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w700,
                          fontSize: 11,
                          color: Colors.white, // Kept white because it is on red/dark background
                          letterSpacing: 0.5,
                        )
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                GestureDetector(
                  onTap: () => _toggleOnlineStatus(!_isOnline),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    width: 48,
                    height: 26,
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      color: _isOnline ? Colors.white : Colors.red[400],
                      borderRadius: BorderRadius.circular(13),
                    ),
                    child: AnimatedAlign(
                      duration: const Duration(milliseconds: 300),
                      alignment: _isOnline ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        width: 22,
                        height: 22,
                        decoration: BoxDecoration(
                          color: _isOnline ? const Color(0xFF248C70) : Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 1))],
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const ProfileScreen()),
                    );
                  },
                  child: Container(
                    margin: const EdgeInsets.only(right: 16),
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white60, width: 2),
                    ),
                    child: const CircleAvatar(
                      radius: 15,
                      backgroundColor: Colors.white,
                      child: Icon(Icons.person_rounded, color: Color(0xFF248C70), size: 20),
                    ),
                  ),
                ),
              ],
            )
          ],
          bottom: const TabBar(
            labelColor: Colors.black,
            unselectedLabelColor: Colors.black54,
            indicatorColor: Color(0xFFE89D1E),
            tabs: [
              Tab(text: 'Active'),
              Tab(text: 'Completed'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            // Active Tab
            Column(
              children: [
                _buildDashboardStats(showFilter: true), // Show filter in Active Tab
                Expanded(
                  child: !_isOnline
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.store_outlined, size: 120, color: Colors.grey[400]),
                              const SizedBox(height: 24),
                              Text(
                                'You are currently offline',
                                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.grey[700]),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                'Go online to receive new orders',
                                style: TextStyle(fontSize: 16, color: Colors.grey[500]),
                              ),
                            ],
                          ),
                        )
                      : _buildOrderList(_orders.where((o) => ['Pending', 'Preparing', 'Ready for Pickup', 'Assigning Rider', 'Rider Not Found', 'Rider Assigned'].contains(o.status)).toList()),
                ),
              ],
            ),
            // Completed Tab
            Column(
              children: [
                _buildDashboardStats(showFilter: true),
                Expanded(
                  child: _buildOrderList(_orders.where((o) => !['Pending', 'Preparing', 'Ready for Pickup', 'Assigning Rider', 'Rider Not Found', 'Rider Assigned'].contains(o.status)).toList()),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDashboardStats({bool showFilter = true}) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Progress Overview', 
                style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold)
              ),
              if (showFilter)
                DropdownButton<String>(
                  value: _selectedFilter,
                  underline: const SizedBox(),
                  icon: const Icon(Icons.arrow_drop_down, color: Color(0xFF248C70)),
                  style: const TextStyle(color: Color(0xFF248C70), fontWeight: FontWeight.w600, fontSize: 14),
                  items: const [
                    DropdownMenuItem(value: 'today', child: Text('Today')),
                    DropdownMenuItem(value: '7_days', child: Text('7 Days Past')),
                    DropdownMenuItem(value: '1_month', child: Text('1 Month Past')),
                  ],
                  onChanged: (value) {
                    if (value != null) {
                      setState(() => _selectedFilter = value);
                      _fetchDashboardStats(showLoading: true);
                    }
                  },
                ),
            ],
          ),
          const SizedBox(height: 16),
          _isLoadingStats
              ? const Center(child: CircularProgressIndicator())
              : Row(
                  children: [
                    Expanded(
                      child: _buildStatCard('Total Orders', _totalOrders.toString(), Icons.shopping_bag_outlined, Colors.blue),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: InkWell(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const RestaurantWalletScreen()),
                          );
                        },
                        borderRadius: BorderRadius.circular(12),
                        child: _buildStatCard('Total Earnings', 'â‚¹${_totalEarnings.toStringAsFixed(2)}', Icons.account_balance_wallet_outlined, const Color(0xFF248C70)),
                      ),
                    ),
                  ],
                ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 12),
          Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
          const SizedBox(height: 4),
          Text(title, style: TextStyle(fontSize: 12, color: Colors.grey[700])),
        ],
      ),
    );
  }

  Widget _buildOrderList(List<Order> tabOrders) {
    if (tabOrders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.done_all, size: 100, color: const Color(0xFF248C70).withOpacity(0.2)),
            const SizedBox(height: 20),
            Text(
              'All caught up!',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.grey[700]),
            ),
            const SizedBox(height: 8),
            Text(
              'Waiting for new orders...',
              style: TextStyle(fontSize: 16, color: Colors.grey[500]),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: tabOrders.length,
      itemBuilder: (context, index) {
        final order = tabOrders[index];
        return Card(
          color: order.status == 'Pending' ? const Color(0xFF248C70).withOpacity(0.05) : Colors.white,
          margin: const EdgeInsets.only(bottom: 20),
          elevation: 4,
          shadowColor: Colors.black26,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          const Icon(Icons.receipt_long, color: Color(0xFF248C70)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  order.id,
                                  style: GoogleFonts.poppins(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFF2C2C2C),
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                                if (order.orderType == 'pickup') ...[
                                  const SizedBox(height: 4),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: Colors.purple.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(4),
                                      border: Border.all(color: Colors.purple.withOpacity(0.3)),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Text('ðŸƒâ€â™‚ï¸ TAKEAWAY', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.purple)),
                                        if (order.pickupTime != null)
                                          Text(' â€¢ ${order.pickupTime}', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.purple)),
                                      ],
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: (order.status == 'Assigning Rider' || order.status == 'Rider Assigned') ? Colors.blue[50] :
                                order.status == 'Preparing' ? Colors.orange[50] : 
                                (order.status == 'Completed' || order.status == 'Delivered') ? Colors.green[50] : 
                                (order.status == 'Picked Up') ? Colors.grey[100] : 
                                const Color(0xFF248C70).withOpacity(0.05),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: (order.status == 'Assigning Rider' || order.status == 'Rider Assigned') ? Colors.blue[200]! :
                                 order.status == 'Preparing' ? Colors.orange[200]! : 
                                 (order.status == 'Completed' || order.status == 'Delivered') ? Colors.green[300]! : 
                                 (order.status == 'Picked Up') ? Colors.grey[300]! : 
                                 const Color(0xFF248C70).withOpacity(0.2)
                        ),
                      ),
                      child: Text(
                        (order.status == 'Assigning Rider' || order.status == 'Rider Assigned') ? 'Assigned' :
                        order.status == 'Preparing' ? 'Preparing' : 
                        (order.status == 'Picked Up' || order.status == 'Completed' || order.status == 'Delivered') ? order.status : 
                        'New Order',
                        style: TextStyle(
                          color: (order.status == 'Assigning Rider' || order.status == 'Rider Assigned') ? Colors.blue[800] :
                                 order.status == 'Preparing' ? Colors.orange[800] : 
                                 (order.status == 'Completed' || order.status == 'Delivered') ? Colors.green[800] : 
                                 (order.status == 'Picked Up') ? Colors.grey[700] : 
                                 const Color(0xFF248C70),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const Divider(height: 32),
                Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: const Color(0xFF248C70).withOpacity(0.1),
                      child: Text(
                        order.customerName.substring(0, 1),
                        style: TextStyle(color: const Color(0xFF248C70).withOpacity(0.8), fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          order.customerName,
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                        ),
                        Text(
                          order.createdAt != null ? 'Customer â€¢ ${_formatDate(order.createdAt)}' : 'Customer',
                          style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                        )
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.grey[50],
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey[200]!),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (order.items.isNotEmpty)
                        ...order.items.map((item) {
                          final imgUrl = item['image']?.toString() ?? item['coverImage']?.toString() ?? '';
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8.0),
                            child: Row(
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: imgUrl.isNotEmpty
                                      ? SafeImage(
                                          imgUrl,
                                          width: 40,
                                          height: 40,
                                          fit: BoxFit.cover,
                                          errorBuilder: (_, __, ___) => Container(
                                            width: 40,
                                            height: 40,
                                            color: Colors.grey[200],
                                            child: const Icon(Icons.fastfood, size: 20, color: Colors.grey),
                                          ),
                                        )
                                      : Container(
                                          width: 40,
                                          height: 40,
                                          color: Colors.grey[200],
                                          child: const Icon(Icons.fastfood, size: 20, color: Colors.grey),
                                        ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    item['name'] ?? 'Item',
                                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                                  ),
                                ),
                                Text(
                                  'x${item['qty'] ?? 1}',
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          );
                        }).toList()
                      else
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                order.orderName,
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                              ),
                            ),
                            Text(
                              'x${order.quantity}',
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      if (order.notes.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.amber[50],
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.amber[200]!),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.info_outline, size: 18, color: Colors.amber),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Note: ${order.notes}',
                                  style: TextStyle(
                                    fontStyle: FontStyle.italic,
                                    color: Colors.amber[900],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                if (order.status == 'Rider Assigned') ...[
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF248C70).withOpacity(0.05),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF248C70).withOpacity(0.3)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            const CircleAvatar(backgroundColor: Color(0xFF248C70), child: Icon(Icons.person, color: Colors.white)),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(order.riderName ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                  Text('Rider ID: ${order.riderId}', style: TextStyle(color: Colors.grey[700], fontSize: 12)),
                                ],
                              ),
                            ),
                            if (order.riderPhone != null)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(color: const Color(0xFF248C70).withOpacity(0.5)),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.phone, size: 14, color: Color(0xFF248C70)),
                                    const SizedBox(width: 4),
                                    Text(order.riderPhone!, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF248C70))),
                                  ],
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _otpControllers[order.id],
                                keyboardType: TextInputType.number,
                                maxLength: 4,
                                decoration: const InputDecoration(
                                  labelText: "Enter Rider's OTP",
                                  counterText: '',
                                  border: OutlineInputBorder(),
                                  contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  filled: true,
                                  fillColor: Colors.white,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            ElevatedButton(
                              onPressed: () => _verifyAndHandover(order),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF248C70),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              child: const Text('Verify'),
                            ),
                            const SizedBox(width: 8),
                            ElevatedButton(
                              onPressed: () async {
                                try {
                                  await http.post(
                                    Uri.parse('${ApiConstants.baseUrl}/orders/restaurant/send-pickup-otp/${order.backendId}'),
                                    headers: {'Authorization': 'Bearer ${ApiConstants.authToken}'},
                                  );
                                  if (mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('OTP sent to rider number'), backgroundColor: const Color(0xFF248C70)),
                                    );
                                  }
                                } catch (e) {
                                  debugPrint('Error sending OTP: $e');
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFE89D1E),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              child: const Text('OTP'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Order Total: â‚¹${order.totalAmount.toStringAsFixed(0)}',
                            style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Your Deal (50%)',
                            style: TextStyle(fontSize: 12, color: Colors.blue, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            'â‚¹${(order.restaurantEarning ?? (order.totalAmount / 2)).toStringAsFixed(0)}',
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF248C70),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        alignment: WrapAlignment.end,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          if (order.status == 'Pending') ...[
                            OutlinedButton(
                              onPressed: () => _showCancelDialog(order),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Colors.red,
                                side: const BorderSide(color: Colors.red),
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.bold)),
                            ),
                            ElevatedButton.icon(
                              onPressed: () => _prepareOrder(order),
                              icon: const Icon(Icons.restaurant_menu),
                              label: const Text('Prepare', style: TextStyle(fontWeight: FontWeight.bold)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.orange,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                            ),
                          ] else if (order.status == 'Preparing') ...[
                            ElevatedButton.icon(
                              onPressed: () => _assignToRider(order),
                              icon: Icon(order.orderType == 'pickup' ? Icons.check_circle : Icons.moped),
                              label: Text(order.orderType == 'pickup' ? 'Mark Ready for Pickup' : 'Assign to Rider', style: const TextStyle(fontWeight: FontWeight.bold)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF248C70),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                            ),
                          ] else if (order.status == 'Assigning Rider') ...[
                            OutlinedButton(
                              onPressed: () => _showCancelDialog(order),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Colors.red,
                                side: const BorderSide(color: Colors.red),
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.bold)),
                            ),
                            const SizedBox(
                              height: 20, width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                            const Text('Finding Rider...', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue)),
                          ] else if (order.status == 'Rider Not Found') ...[
                            ElevatedButton.icon(
                              onPressed: () => _assignToRider(order),
                              icon: const Icon(Icons.refresh),
                              label: const Text('Re-assign', style: TextStyle(fontWeight: FontWeight.bold)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.redAccent,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                            ),
                          ] else if (order.status == 'Rider Assigned') ...[
                            const Text('Waiting for Handover', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue)),
                          ] else if (order.status == 'Ready for Pickup') ...[
                            ElevatedButton.icon(
                              onPressed: () => _markPickupCompleted(order),
                              icon: const Icon(Icons.done_all),
                              label: const Text('Mark as Collected', style: TextStyle(fontWeight: FontWeight.bold)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF248C70),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                            ),
                          ] else ...[
                            Text(order.status, style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey[600])),
                          ]
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../api_constants.dart';
import '../models/order_model.dart';
import '../services/restaurant_api_service.dart';
import '../theme/app_colors.dart';
import 'menu_management_screen.dart';
import 'restaurant_dashboard_screen.dart';
import 'profile_screen.dart';
import 'order_details_screen.dart';
import 'cancelled_orders_screen.dart';
import '../services/restaurant_socket_service.dart';

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
  Timer? _livePollingTimer;
  final AudioPlayer _audioPlayer = AudioPlayer();
  final Set<String> _knownOrderIds = {};
  bool _isFirstFetch = true;
  bool _isRingtonePlaying = false;
  Function(dynamic)? _newOrderSocketCallback;

  // Dynamic Restaurant Profile & Stats
  String _restaurantName = 'Loading...';
  String _restaurantImage = '';
  double _monthlyEarning = 0.0;
  String _currentMonth = 'Current Month';
  bool _isLoadingOrders = false;
  String _restaurantId = '';

  @override
  void initState() {
    super.initState();
    _initCurrentMonth();
    _loadLiveDashboardData();
    _setupSocketListener();
    // Live polling for incoming real customer orders every 5 seconds
    _livePollingTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted) {
        _fetchLiveOrders(isSilent: true);
      }
    });
  }

  @override
  void dispose() {
    if (_newOrderSocketCallback != null) {
      RestaurantSocketService.offNewOrder(_newOrderSocketCallback!);
    }
    _stopOrderRingtone();
    _timer?.cancel();
    _livePollingTimer?.cancel();
    _audioPlayer.dispose();
    for (var controller in _otpControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  void _initCurrentMonth() {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    _currentMonth = months[DateTime.now().month - 1];
  }

  Future<void> _loadLiveDashboardData() async {
    final prefs = await SharedPreferences.getInstance();
    _restaurantId = prefs.getString('restaurantId') ?? '';
    final savedPhone = prefs.getString('userPhone') ?? '';
    final storedName = prefs.getString('restaurantName') ?? '';
    final token = prefs.getString('token') ?? '';

    if (mounted && storedName.isNotEmpty && storedName != 'null') {
      setState(() {
        _restaurantName = storedName;
      });
    }

    // 1. Fetch live Restaurant Profile from Backend
    try {
      String profileUrl = '';
      if (_restaurantId.isNotEmpty) {
        profileUrl = ApiConstants.getApprovalStatus(_restaurantId);
      } else if (savedPhone.isNotEmpty) {
        profileUrl = ApiConstants.checkApprovalStatusByMobile(savedPhone);
      } else if (token.isNotEmpty) {
        profileUrl = '${ApiConstants.baseUrl}/restaurants/profile';
      }

      if (profileUrl.isNotEmpty) {
        http.Response res = await http.get(
          Uri.parse(profileUrl),
          headers: {
            'Content-Type': 'application/json',
            if (token.isNotEmpty) 'Authorization': 'Bearer $token',
          },
        ).timeout(const Duration(seconds: 6));

        if (res.statusCode != 200 && token.isNotEmpty && !profileUrl.endsWith('/profile')) {
          try {
            res = await http.get(
              Uri.parse('${ApiConstants.baseUrl}/restaurants/profile'),
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer $token',
              },
            ).timeout(const Duration(seconds: 6));
          } catch (_) {}
        }

        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          String resolvedName = '';
          if (data['name'] != null && data['name'].toString().isNotEmpty) {
            final n = data['name'];
            resolvedName = (n is Map ? (n['en'] ?? '') : n).toString();
          } else if (data['restaurant'] != null && data['restaurant']['name'] != null) {
            final n = data['restaurant']['name'];
            resolvedName = (n is Map ? (n['en'] ?? '') : n).toString();
          }

          if (mounted) {
            setState(() {
              if (resolvedName.isNotEmpty && resolvedName != 'null') {
                _restaurantName = resolvedName;
                prefs.setString('restaurantName', resolvedName);
              } else if (_restaurantName == 'Loading...') {
                _restaurantName = storedName.isNotEmpty ? storedName : 'My Restaurant';
              }
              _isOnline = data['isActive'] ?? true;
              if (data['restaurantId'] != null) {
                _restaurantId = data['restaurantId'].toString();
                prefs.setString('restaurantId', _restaurantId);
              }
            });
          }
        }
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          if (_restaurantName == 'Loading...') {
            _restaurantName = storedName.isNotEmpty ? storedName : 'My Restaurant';
          }
        });
      }
    }

    // 2. Fetch live Orders from Backend
    await _fetchLiveOrders();
  }

  Future<void> _fetchLiveOrders({bool isSilent = false}) async {
    if (!isSilent) {
      setState(() => _isLoadingOrders = true);
    }
    final prefs = await SharedPreferences.getInstance();
    var restId = _restaurantId.isNotEmpty ? _restaurantId : (prefs.getString('restaurantId') ?? '');
    final savedPhone = prefs.getString('userPhone') ?? '8305370330';
    if (restId.isEmpty) restId = savedPhone;
    final token = prefs.getString('token') ?? '';

    if (restId.isEmpty) {
      if (mounted) setState(() => _isLoadingOrders = false);
      return;
    }

    try {
      final ordersUrl = '${ApiConstants.baseUrl}/orders/restaurant/$restId';
      final res = await http.get(
        Uri.parse(ordersUrl),
        headers: {
          'Content-Type': 'application/json',
          if (token.isNotEmpty) 'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        List<dynamic> ordersList = [];
        if (data is List) {
          ordersList = data;
        } else if (data['orders'] is List) {
          ordersList = data['orders'];
        }

        final parsedOrders = ordersList.map<Order>((json) => Order.fromJson(json)).toList();

        double computedRevenue = 0.0;
        for (var o in parsedOrders) {
          if (o.status != 'Cancelled' && o.status != 'Failed') {
            computedRevenue += o.totalAmount;
          }
        }

        // Detect new incoming orders for ringtone & alert popup
        if (_isFirstFetch) {
          for (var o in parsedOrders) {
            _knownOrderIds.add(o.id);
          }
          _isFirstFetch = false;
        } else {
          final newIncoming = parsedOrders.where((o) => (o.status == 'Placed' || o.status == 'Pending') && !_knownOrderIds.contains(o.id)).toList();
          if (newIncoming.isNotEmpty) {
            for (var o in newIncoming) {
              _knownOrderIds.add(o.id);
              _showNewOrderAlertDialog(o);
            }
          }
        }

        if (mounted) {
          setState(() {
            _orders = parsedOrders;
            _monthlyEarning = computedRevenue;
            _isLoadingOrders = false;
          });
        }
      } else {
        if (mounted) setState(() => _isLoadingOrders = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingOrders = false);
    }
  }

  Future<void> _toggleOnlineStatus(bool val) async {
    setState(() => _isOnline = val);
    final prefs = await SharedPreferences.getInstance();
    final restId = _restaurantId.isNotEmpty ? _restaurantId : (prefs.getString('restaurantId') ?? '');
    final token = prefs.getString('token') ?? '';

    try {
      if (restId.isNotEmpty) {
        await http.put(
          Uri.parse(ApiConstants.toggleActive(restId)),
          headers: {
            'Content-Type': 'application/json',
            if (token.isNotEmpty) 'Authorization': 'Bearer $token',
          },
        ).timeout(const Duration(seconds: 5));
      }
    } catch (_) {}

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_isOnline ? '$_restaurantName is now Online' : '$_restaurantName is now Offline'),
          backgroundColor: _isOnline ? AppColors.primaryGreen : Colors.red,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }
  void _setupSocketListener() async {
    final prefs = await SharedPreferences.getInstance();
    final restId = _restaurantId.isNotEmpty ? _restaurantId : (prefs.getString('restaurantId') ?? '');
    final token = prefs.getString('token') ?? '';
    if (restId.isNotEmpty) {
      await RestaurantSocketService.init(restId, token);
      _newOrderSocketCallback = (data) {
        if (mounted) {
          debugPrint('Dashboard received live new order socket event!');
          _fetchLiveOrders(isSilent: true);
        }
      };
      RestaurantSocketService.onNewOrder(_newOrderSocketCallback!);
    }
  }

  void _playOrderRingtone() async {
    try {
      if (_isRingtonePlaying) return;
      _isRingtonePlaying = true;
      await _audioPlayer.setReleaseMode(ReleaseMode.loop);
      await _audioPlayer.play(AssetSource('audio/notification.ogg'));
    } catch (e) {
      debugPrint('Error playing ringtone: $e');
    }
  }

  void _stopOrderRingtone() async {
    try {
      _isRingtonePlaying = false;
      await _audioPlayer.stop();
    } catch (e) {
      debugPrint('Error stopping ringtone: $e');
    }
  }

  void _showNewOrderAlertDialog(Order newOrder) {
    _playOrderRingtone();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (alertContext) {
        return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          elevation: 12,
          backgroundColor: Colors.white,
          child: Container(
            width: 320,
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Pulsing Bell Icon Header
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.orange.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.notifications_active_rounded,
                    size: 48,
                    color: Colors.orange,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  '🔔 NEW ORDER RECEIVED!',
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                  textAlign: TextAlign.center,
                ),
                Text(
                  'Order #${newOrder.id}',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primaryGreen,
                  ),
                ),
                const SizedBox(height: 12),
                const Divider(),
                const SizedBox(height: 12),

                // Customer Info
                Row(
                  children: [
                    const Icon(Icons.person, size: 18, color: Colors.grey),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        newOrder.customerName,
                        style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.location_on, size: 18, color: Colors.grey),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        newOrder.address,
                        style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600]),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Amount
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0FDF4),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Total Bill:', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w500)),
                      Text(
                        '₹${newOrder.totalAmount.toStringAsFixed(2)}',
                        style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Action Buttons: Accept & Decline
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          _stopOrderRingtone();
                          Navigator.pop(alertContext);
                          _rejectOrder(newOrder);
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.redAccent,
                          side: const BorderSide(color: Colors.redAccent, width: 1.5),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text('Reject', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 13)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          _stopOrderRingtone();
                          Navigator.pop(alertContext);
                          _acceptOrder(newOrder);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryGreen,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                        child: Text('ACCEPT ORDER', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    ).then((_) {
      _stopOrderRingtone();
    });
  }

  void _acceptOrder(Order order) async {
    setState(() {
      order.status = 'Preparing';
    });
    await RestaurantApiService.prepareOrder(order.id);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Order accepted! Moved to Preparing state.'),
          backgroundColor: AppColors.primaryGreen,
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  void _rejectOrder(Order order) async {
    setState(() {
      _orders.removeWhere((o) => o.id == order.id);
    });
    await RestaurantApiService.cancelOrder(order.id, 'Rejected by restaurant');
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Order rejected.'),
          backgroundColor: Colors.redAccent,
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  void _markSearchingRider(Order order) {
    _showSearchingRiderModal(order);
  }

  void _showSearchingRiderModal(Order order) {
    Timer? searchTimer;
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (dialogContext) {
        // Auto assign rider after 3 seconds simulation
        searchTimer = Timer(const Duration(seconds: 3), () async {
          if (Navigator.canPop(dialogContext)) {
            Navigator.pop(dialogContext);
          }
          await RestaurantApiService.markOrderReady(order.id);
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

  void _handlePickup(Order order) async {
    setState(() {
      order.status = 'Picked Up';
    });
    await RestaurantApiService.verifyPickup(order.id, '1234');
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Order picked up by rider!'),
          backgroundColor: AppColors.primaryGreen,
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  void _markDelivered(Order order) async {
    setState(() {
      order.status = 'Delivered';
    });
    try {
      final token = ApiConstants.authToken;
      await http.put(
        Uri.parse('${ApiConstants.baseUrl}/orders/${order.id}/status'),
        headers: {
          'Content-Type': 'application/json',
          if (token.isNotEmpty) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'status': 'delivered'}),
      );
    } catch (_) {}
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Order marked as Delivered successfully!'),
          backgroundColor: AppColors.primaryGreen,
          duration: Duration(seconds: 2),
        ),
      );
    }
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
                if (_isLoadingOrders)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 50),
                    alignment: Alignment.center,
                    child: const CircularProgressIndicator(color: AppColors.primaryGreen),
                  )
                else if (filteredOrders.isEmpty)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
                    margin: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey[200]!),
                    ),
                    alignment: Alignment.center,
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.primaryGreen.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.restaurant_menu_rounded, size: 40, color: AppColors.primaryGreen),
                        ),
                        const SizedBox(height: 14),
                        Text(
                          _selectedStatusFilter == 'All' ? 'No live orders right now' : 'No $_selectedStatusFilter orders',
                          style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black87),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Incoming customer orders for $_restaurantName will appear here in real-time.',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.poppins(color: Colors.grey[600], fontSize: 12),
                        ),
                        const SizedBox(height: 16),
                        OutlinedButton.icon(
                          onPressed: () => setState(() => _currentBottomNavIndex = 1),
                          icon: const Icon(Icons.menu_book_rounded, size: 18, color: AppColors.primaryGreen),
                          label: Text('Manage / Add Menu Items', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.primaryGreen)),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: AppColors.primaryGreen),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
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
                        _restaurantName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
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
                  onChanged: (val) => _toggleOnlineStatus(val),
                  activeThumbColor: AppColors.primaryGreen,
                ),
                const SizedBox(width: 4),

                // Notification Bell Button / Test Ringtone
                GestureDetector(
                  onTap: () {
                    if (_isRingtonePlaying) {
                      _stopOrderRingtone();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('🔊 Order ringtone stopped')),
                      );
                    } else {
                      _playOrderRingtone();
                      if (_orders.isNotEmpty) {
                        _showNewOrderAlertDialog(_orders.first);
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('🔊 Ringtone Test Active (Tap bell again to stop)')),
                        );
                      }
                    }
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
                (_currentMonth.isNotEmpty) ? _currentMonth : 'Current Month',
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
            ],
          ),
          Text(
            '₹${_monthlyEarning.toStringAsFixed(2)}',
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
                        child: _buildOrderItemImage(
                          (order.items.isNotEmpty && order.items[0] is Map)
                              ? (order.items[0]['image'] ?? (order.items[0]['product'] is Map ? order.items[0]['product']['image'] : null))
                              : null,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              (order.items.isNotEmpty && order.items[0] is Map)
                                  ? (order.items[0]['name']?.toString() ?? (order.items[0]['product'] is Map ? order.items[0]['product']['name']?.toString() : 'Item') ?? 'Item')
                                  : (order.orderName.isNotEmpty ? order.orderName : 'Item'),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
                            ),
                            Text(
                              (order.items.isNotEmpty && order.items[0] is Map)
                                  ? (order.items[0]['variant']?.toString() ?? (order.items[0]['isVeg'] == false ? 'Non-Veg' : 'Veg'))
                                  : 'Standard',
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
                if (order.items.length > 1)
                  Expanded(
                    child: Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: _buildOrderItemImage(
                            (order.items[1] is Map)
                                ? (order.items[1]['image'] ?? (order.items[1]['product'] is Map ? order.items[1]['product']['image'] : null))
                                : null,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                (order.items[1] is Map)
                                    ? (order.items[1]['name']?.toString() ?? (order.items[1]['product'] is Map ? order.items[1]['product']['name']?.toString() : 'Dish') ?? 'Dish')
                                    : 'Dish',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black87,
                                ),
                              ),
                              Text(
                                (order.items[1] is Map)
                                    ? (order.items[1]['variant']?.toString() ?? 'Regular')
                                    : 'Regular',
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
                if (order.items.length > 2)
                  Text(
                    '+${order.items.length - 2} More',
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
                      _formatOrderTime(order.createdAt),
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

  Widget _buildOrderItemImage(String? imagePath) {
    if (imagePath != null && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
      return Image.network(
        imagePath,
        width: 44,
        height: 44,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => Container(
          width: 44,
          height: 44,
          color: Colors.grey[200],
          child: const Icon(Icons.fastfood_rounded, size: 20, color: Colors.grey),
        ),
      );
    }

    return Image.asset(
      (imagePath != null && imagePath.isNotEmpty) ? imagePath : 'assets/images/restaurant_chicken_item.jpg',
      width: 44,
      height: 44,
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) => Container(
        width: 44,
        height: 44,
        color: Colors.grey[200],
        child: const Icon(Icons.fastfood_rounded, size: 20, color: Colors.grey),
      ),
    );
  }

  String _formatOrderTime(DateTime? date) {
    if (date == null) return 'Placed recently';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final m = months[date.month - 1];
    final d = date.day;
    final hour = date.hour > 12 ? date.hour - 12 : (date.hour == 0 ? 12 : date.hour);
    final min = date.minute.toString().padLeft(2, '0');
    final period = date.hour >= 12 ? 'PM' : 'AM';
    return 'Order placed on $d $m, $hour:$min $period';
  }
}

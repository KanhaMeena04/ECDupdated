import 'package:ecdkart_app/widgets/safe_image.dart';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/order_provider.dart';
import 'order_tracking_page.dart';
import 'order_cancellation_page.dart';
import '../../services/socket_service.dart';
import '../../providers/theme_provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../profile/policy_page.dart';
import '../../services/restaurant_api_service.dart';
import '../../services/issue_api_service.dart';

// â”€â”€ Order status enum â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
enum OrderStatus { delivered, onTheWay, preparing, cancelled }

// â”€â”€ Order model (mock) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _Order {
  final String id;
  final String restaurantName;
  final String restaurantImage;
  final List<String> items;
  final double total;
  final OrderStatus status;
  final DateTime placedAt;
  final String deliveryAddress;
  final int itemCount;

  const _Order({
    required this.id,
    required this.restaurantName,
    required this.restaurantImage,
    required this.items,
    required this.total,
    required this.status,
    required this.placedAt,
    required this.deliveryAddress,
    required this.itemCount,
  });
}

// â”€â”€ Mock orders data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
final List<_Order> _mockOrders = [
  _Order(
    id: 'ORD-2024-001',
    restaurantName: 'Pizza Palace',
    restaurantImage:
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
    items: ['Margherita Pizza (Regular)', 'Garlic Bread', 'Coke 500ml'],
    total: 328,
    status: OrderStatus.onTheWay,
    placedAt: DateTime.now().subtract(const Duration(minutes: 22)),
    deliveryAddress: 'Vijay Nagar, Indore',
    itemCount: 3,
  ),
  _Order(
    id: 'ORD-2024-002',
    restaurantName: 'Spice Garden',
    restaurantImage:
        'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
    items: ['Butter Chicken', 'Naan Ã— 2', 'Paneer Tikka'],
    total: 546,
    status: OrderStatus.delivered,
    placedAt: DateTime.now().subtract(const Duration(days: 1, hours: 3)),
    deliveryAddress: 'Palasia, Indore',
    itemCount: 4,
  ),
  _Order(
    id: 'ORD-2024-003',
    restaurantName: 'Burger Barn',
    restaurantImage:
        'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400',
    items: ['Classic Beef Burger', 'French Fries', 'Chocolate Shake'],
    total: 387,
    status: OrderStatus.delivered,
    placedAt: DateTime.now().subtract(const Duration(days: 3)),
    deliveryAddress: 'Bhawarkuwa, Indore',
    itemCount: 3,
  ),
  _Order(
    id: 'ORD-2024-004',
    restaurantName: 'Noodle Nest',
    restaurantImage:
        'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
    items: ['Veg Hakka Noodles', 'Spring Rolls'],
    total: 248,
    status: OrderStatus.preparing,
    placedAt: DateTime.now().subtract(const Duration(minutes: 8)),
    deliveryAddress: 'Vijay Nagar, Indore',
    itemCount: 2,
  ),
  _Order(
    id: 'ORD-2024-005',
    restaurantName: 'Fresh Bakes',
    restaurantImage:
        'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
    items: ['Chocolate Cake', 'Blueberry Muffin Ã— 2', 'Croissant'],
    total: 596,
    status: OrderStatus.cancelled,
    placedAt: DateTime.now().subtract(const Duration(days: 5)),
    deliveryAddress: 'Scheme 54, Indore',
    itemCount: 4,
  ),
  _Order(
    id: 'ORD-2024-006',
    restaurantName: 'Desi Dhaba',
    restaurantImage:
        'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
    items: ['Dal Makhani', 'Chole Bhature', 'Lassi'],
    total: 337,
    status: OrderStatus.delivered,
    placedAt: DateTime.now().subtract(const Duration(days: 7)),
    deliveryAddress: 'Sapna Sangeeta, Indore',
    itemCount: 3,
  ),
];

// â”€â”€ My Orders Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class MyOrdersPage extends StatefulWidget {
  final int initialIndex;
  const MyOrdersPage({super.key, this.initialIndex = 0});

  @override
  State<MyOrdersPage> createState() => _MyOrdersPageState();
}

class _MyOrdersPageState extends State<MyOrdersPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Function(dynamic)? _socketCallback;
  late OrderProvider _orderProvider;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this, initialIndex: widget.initialIndex);
    _orderProvider = context.read<OrderProvider>();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await _orderProvider.fetchOrders();
      _setupSocketListeners();
    });
  }

  void _setupSocketListeners() {
    SocketService.init();
    final activeOrders = _orderProvider.activeOrders;
    for (var order in activeOrders) {
      if (order['_id'] != null) {
        SocketService.joinOrder(order['_id']);
      }
    }
    
    _socketCallback = (data) {
      debugPrint('MyOrders received live update: $data');
      if (mounted) {
        if (data is Map && data['orderId'] != null && data['status'] != null) {
          _orderProvider.updateOrderStatusOptimistically(
            data['orderId'], 
            data['status']
          );
        }
        
        // Add a small delay to ensure backend database commit is fully propagated
        Future.delayed(const Duration(milliseconds: 500), () {
          if (mounted) {
            _orderProvider.fetchOrders().then((_) {
              // Re-join any new active orders that might have appeared
              final updatedOrders = _orderProvider.activeOrders;
              for (var order in updatedOrders) {
                if (order['_id'] != null) {
                  SocketService.joinOrder(order['_id']);
                }
              }
            });
          }
        });
      }
    };
    
    SocketService.onOrderStatusUpdated(_socketCallback!);
  }

  @override
  void dispose() {
    _tabController.dispose();
    if (_socketCallback != null) {
      SocketService.offOrderStatusUpdated(_socketCallback);
    }
    final activeOrders = _orderProvider.activeOrders;
    for (var order in activeOrders) {
      if (order['_id'] != null) {
        SocketService.leaveOrder(order['_id']);
      }
    }
    super.dispose();
  }

  List<dynamic> get _activeOrders => context.watch<OrderProvider>().activeOrders.where((o) => o['status']?.toString().toLowerCase() != 'cancelled').toList();
  List<dynamic> get _pastOrders => context.watch<OrderProvider>().pastOrders;
  List<dynamic> get _cancelledOrders {
    final provider = context.watch<OrderProvider>();
    final fromCancelled = provider.cancelledOrders;
    final fromActive = provider.activeOrders.where((o) => o['status']?.toString().toLowerCase() == 'cancelled').toList();
    final fromPast = provider.pastOrders.where((o) => o['status']?.toString().toLowerCase() == 'cancelled').toList();
    
    final allCancelled = [...fromCancelled, ...fromActive, ...fromPast];
    final seen = <String>{};
    return allCancelled.where((o) {
      final id = o['_id']?.toString() ?? '';
      if (seen.contains(id)) return false;
      seen.add(id);
      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    const accentOrange = Color(0xFFE89D1E);

    return Scaffold(
      resizeToAvoidBottomInset: false,
      backgroundColor: isDark ? Colors.black : const Color(0xFFF5FAF8),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        foregroundColor: isDark ? Colors.white : Colors.black,
        elevation: 0,
        centerTitle: true,
        automaticallyImplyLeading: Navigator.canPop(context),
        title: Text(
          'My Orders',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : const Color(0xFF1F2937),
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(54),
          child: Container(
            margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF2A2A2A) : const Color(0xFFF3F4F6),
              borderRadius: BorderRadius.circular(25),
            ),
            child: TabBar(
              controller: _tabController,
              indicator: BoxDecoration(
                color: accentOrange,
                borderRadius: BorderRadius.circular(20),
              ),
              indicatorSize: TabBarIndicatorSize.tab,
              labelColor: Colors.white,
              unselectedLabelColor:
                  isDark ? Colors.grey.shade400 : const Color(0xFF6B7280),
              labelStyle:
                  const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
              unselectedLabelStyle:
                  const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              dividerColor: Colors.transparent,
              tabs: const [
                Tab(text: 'Active'),
                Tab(text: 'Completed'),
                Tab(text: 'Cancelled'),
              ],
            ),
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _OrderList(
            orders: _activeOrders,
            emptyMessage: 'No active orders',
            emptyIcon: Icons.delivery_dining_outlined,
            onCancelSuccess: () {
              _tabController.animateTo(2);
            },
          ),
          _OrderList(
            orders: _pastOrders,
            emptyMessage: 'No past orders yet',
            emptyIcon: Icons.receipt_long_outlined,
          ),
          _OrderList(
            orders: _cancelledOrders,
            emptyMessage: 'No cancelled orders',
            emptyIcon: Icons.cancel_outlined,
          ),
        ],
      ),
    );
  }
}

// â”€â”€ Order list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _OrderList extends StatelessWidget {
  final List<dynamic> orders;
  final String emptyMessage;
  final IconData emptyIcon;
  final VoidCallback? onCancelSuccess;

  const _OrderList({
    required this.orders,
    required this.emptyMessage,
    required this.emptyIcon,
    this.onCancelSuccess,
  });

  @override
  Widget build(BuildContext context) {
    if (orders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(emptyIcon, size: 72, color: const Color(0xFFD1D5DB)),
            const SizedBox(height: 16),
            Text(
              emptyMessage,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Color(0xFF9CA3AF),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Your orders will appear here',
              style: TextStyle(fontSize: 13, color: Color(0xFFD1D5DB)),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () async {
        await context.read<OrderProvider>().fetchOrders();
      },
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        itemCount: orders.length,
        itemBuilder: (_, i) {
          final order = orders[i];
          final backendId = order['_id']?.toString() ?? i.toString();
          return _OrderCard(
            key: ValueKey(backendId),
            order: order,
            onCancelSuccess: onCancelSuccess,
          );
        },
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final dynamic order;
  final VoidCallback? onCancelSuccess;
  const _OrderCard({super.key, required this.order, this.onCancelSuccess});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    final restaurant = order['store'] ?? {};
    final restaurantName = restaurant['name']?.toString() ?? 'Restaurant';
    final restaurantImage = restaurant['coverImage']?.toString() ?? restaurant['logo']?.toString() ?? 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600';
    final items = (order['items'] as List? ?? []).map((i) => i['name']?.toString() ?? 'Item').toList();
    final total = (order['payableAmount'] as num? ?? order['totalAmount'] as num? ?? 0).toDouble();
    final status = order['status']?.toString().toLowerCase() ?? 'pending';
    final placedAt = DateTime.tryParse(order['createdAt']?.toString() ?? '') ?? DateTime.now();
    final address = order['address']?['fullAddress']?.toString() ?? 'Address';
    final backendId = order['_id']?.toString() ?? '';
    final orderNumber = order['orderNumber']?.toString().toUpperCase() ?? backendId.toUpperCase();

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1F2937) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          if (!isDark)
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: SafeImage(
                    restaurantImage,
                    width: 56,
                    height: 56,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      width: 56,
                      height: 56,
                      color: AppColors.primary.withValues(alpha: 0.1),
                      child: const Icon(Icons.store, color: AppColors.primary, size: 28),
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
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : const Color(0xFF2C2C2C),
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        _formatDate(placedAt),
                        style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(order['orderType'] == 'pickup' ? Icons.storefront : Icons.location_on_outlined, size: 12, color: const Color(0xFF9CA3AF)),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              order['orderType'] == 'pickup' ? 'Self-Pickup' : address,
                              style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF)),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                _StatusBadge(status: status),
              ],
            ),
          ),
          Divider(height: 1, color: isDark ? Colors.white12 : const Color(0xFFF3F4F6)),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Items ordered', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: isDark ? Colors.grey[400] : const Color(0xFF6B7280))),
                const SizedBox(height: 6),
                ...items.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 3),
                  child: Row(
                    children: [
                      const Icon(Icons.circle, size: 5, color: Color(0xFF9CA3AF)),
                      const SizedBox(width: 8),
                      Text(item, style: TextStyle(fontSize: 13, color: isDark ? Colors.white : const Color(0xFF374151))),
                    ],
                  ),
                )),
              ],
            ),
          ),
          if (status != 'cancelled' && status != 'failed')
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 0),
              child: _OrderTracker(status: status, deliveryStatus: order['deliveryStatus']?.toString() ?? '', orderType: order['orderType']?.toString() ?? ''),
            ),
          
          if (order['assignedDriver'] != null && order['assignedDriver'] is Map && order['orderType'] != 'pickup')
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 0),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.orange.withOpacity(0.2)),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 18,
                          backgroundColor: Colors.orange.withOpacity(0.2),
                          backgroundImage: order['assignedDriver']['avatar'] != null ? NetworkImage(order['assignedDriver']['avatar']) : null,
                          child: order['assignedDriver']['avatar'] == null ? const Icon(Icons.person, color: Colors.orange, size: 20) : null,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(order['assignedDriver']['name'] ?? 'Rider', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: isDark ? Colors.white : Colors.black)),
                              const SizedBox(height: 2),
                              Text(order['assignedDriver']['phone'] ?? '', style: TextStyle(color: isDark ? Colors.grey[400] : Colors.grey[600], fontSize: 11)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(orderNumber, style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF), fontWeight: FontWeight.w500)),
                          const SizedBox(height: 2),
                          Text('${items.length} items  •  ₹${total.toInt()}', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: isDark ? Colors.white : const Color(0xFF2C2C2C))),
                        ],
                      ),
                    ),
                    if (status == 'delivered')
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.check_circle, size: 16, color: AppColors.primary),
                            SizedBox(width: 6),
                            Text(
                              'Completed',
                              style: TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
                if (status == 'cancelled' || status == 'failed')
                  Padding(
                    padding: const EdgeInsets.only(top: 16),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.red.withOpacity(0.2)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline, color: Colors.red, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  order['cancelledBy'] == 'restaurant' 
                                      ? 'Cancelled by Restaurant' 
                                      : 'Order Cancelled',
                                  style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.red, fontSize: 13),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  order['cancellationReason']?.toString() ?? 'No reason provided',
                                  style: TextStyle(color: isDark ? Colors.red[300] : Colors.red[700], fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                if (status == 'delivered')
                  Padding(
                    padding: const EdgeInsets.only(top: 16),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.primary.withValues(alpha: 0.1)),
                      ),
                      child: Column(
                        children: [
                          Text(
                            'For any query contact to ECDkart',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? Colors.grey[400] : Colors.grey[600],
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Expanded(
                                child: SizedBox(
                                  height: 36,
                                  child: ElevatedButton(
                                    onPressed: () {
                                      final restId = order['store']?['_id'] ?? order['store']?['id'] ?? '';
                                      _showRatingDialog(context, backendId, restId.toString());
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.amber.shade600,
                                      foregroundColor: Colors.white,
                                      elevation: 0,
                                      padding: const EdgeInsets.symmetric(horizontal: 4),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                    ),
                                    child: const FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.star_border, size: 16),
                                          SizedBox(width: 6),
                                          Text('Rate Food', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: SizedBox(
                                  height: 36,
                                  child: ElevatedButton(
                                    onPressed: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(builder: (_) => const SupportPage()),
                                      );
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.black,
                                      foregroundColor: Colors.white,
                                      elevation: 0,
                                      padding: const EdgeInsets.symmetric(horizontal: 4),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                    ),
                                    child: const FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.headset_mic, size: 16),
                                          SizedBox(width: 6),
                                          Text('Support', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          SizedBox(
                            width: double.infinity,
                            height: 36,
                            child: ElevatedButton(
                              onPressed: () {
                                _showReportIssueDialog(context, backendId, orderNumber);
                              },
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                                backgroundColor: isDark ? const Color(0xFF374151) : Colors.grey[200],
                                foregroundColor: isDark ? Colors.white : Colors.black87,
                                elevation: 0,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              child: FittedBox(
                                fit: BoxFit.scaleDown,
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(Icons.report_problem, size: 16, color: AppColors.primary),
                                    const SizedBox(width: 6),
                                    const Text('Report Issue', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                if (['pending', 'preparing', 'ready', 'accepted'].contains(status))
                  _CancelOrTrackButton(
                    order: order,
                    orderId: backendId, // Changed to backendId
                    restaurantName: restaurantName,
                    address: address,
                    onCancel: () async {
                      final result = await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => OrderCancellationPage(
                            orderId: backendId,
                            isCOD: order['paymentMethod']?.toString().toLowerCase() == 'cod',
                          ),
                        ),
                      );
                      if (result == true) {
                        onCancelSuccess?.call();
                      }
                    },
                  )
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays == 1) return 'Yesterday';
    return '${diff.inDays} days ago';
  }

  void _showSnack(BuildContext context, String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: AppColors.primary,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  void _showRatingDialog(BuildContext context, String orderId, String restaurantId) {
    double selectedRating = 5.0;
    final commentController = TextEditingController();
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final isDark = ctx.watch<ThemeProvider>().isDarkMode;
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Container(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
                top: 24,
                left: 20,
                right: 20,
              ),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1F2937) : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Rate your Food', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(5, (index) {
                      return IconButton(
                        icon: Icon(
                          index < selectedRating ? Icons.star : Icons.star_border,
                          color: Colors.amber,
                          size: 32,
                        ),
                        onPressed: () {
                          setModalState(() {
                            selectedRating = index + 1.0;
                          });
                        },
                      );
                    }),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: commentController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      hintText: 'Add a comment (optional)',
                      filled: true,
                      fillColor: isDark ? Colors.white10 : Colors.grey[100],
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: isSubmitting ? null : () async {
                        setModalState(() => isSubmitting = true);
                        final success = await RestaurantApiService.submitRestaurantReview(
                          orderId,
                          restaurantId,
                          selectedRating,
                          commentController.text.trim(),
                        );
                        setModalState(() => isSubmitting = false);
                        Navigator.pop(ctx);
                        if (success) {
                          _showSnack(context, 'Thank you for your feedback!');
                        } else {
                          _showSnack(context, 'Failed to submit review.');
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: isSubmitting
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('Submit Review', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

void _showReportIssueDialog(BuildContext context, String orderId, String orderNumber) {
  final issueController = TextEditingController();
  bool isSubmitting = false;

  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) {
      final isDark = ctx.watch<ThemeProvider>().isDarkMode;
      return StatefulBuilder(
        builder: (ctx, setModalState) {
          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
            child: Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1F2937) : Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 20, offset: const Offset(0, 10)),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Report an Issue', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: isDark ? Colors.white : Colors.black)),
                      IconButton(
                        onPressed: () => Navigator.pop(ctx),
                        icon: Icon(Icons.close, color: isDark ? Colors.grey[400] : Colors.grey[600]),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text('Order ID: $orderNumber', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
                  const SizedBox(height: 16),
                  TextField(
                    controller: issueController,
                    maxLines: 4,
                    style: TextStyle(color: isDark ? Colors.white : Colors.black),
                    decoration: InputDecoration(
                      hintText: 'Describe the issue with your order (e.g., refund not received)',
                      hintStyle: TextStyle(color: isDark ? Colors.grey[500] : Colors.grey[400]),
                      filled: true,
                      fillColor: isDark ? const Color(0xFF374151) : Colors.grey[50],
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: isDark ? Colors.grey[700]! : Colors.grey[300]!)),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: isDark ? Colors.grey[700]! : Colors.grey[300]!)),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primary)),
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: isSubmitting
                          ? null
                          : () async {
                              final text = issueController.text.trim();
                              if (text.isEmpty) {
                                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter issue description')));
                                return;
                              }
                              setModalState(() => isSubmitting = true);
                              final res = await IssueApiService.reportIssue(orderId, text);
                              setModalState(() => isSubmitting = false);
                              if (!context.mounted) return;
                              if (res['success'] == true) {
                                Navigator.of(context).pop();
                                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Issue reported successfully')));
                              } else {
                                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'] ?? 'Failed to report issue')));
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      child: isSubmitting
                          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('Submit Issue', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
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

// â”€â”€ NEW: Cancel or Track Button with Timer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _CancelOrTrackButton extends StatefulWidget {
  final dynamic order;
  final String orderId;
  final String restaurantName;
  final String address;
  final Future<void> Function() onCancel;

  const _CancelOrTrackButton({
    required this.order,
    required this.orderId,
    required this.restaurantName,
    required this.address,
    required this.onCancel,
  });

  @override
  State<_CancelOrTrackButton> createState() => _CancelOrTrackButtonState();
}

class _CancelOrTrackButtonState extends State<_CancelOrTrackButton> {
  late DateTime _placedAt;
  bool _canCancel = false;
  bool _isCancelling = false;
  String _timeLeft = "";
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _placedAt = DateTime.tryParse(widget.order['createdAt']?.toString() ?? '') ?? DateTime.now();
    _startTimer();
  }

  void _startTimer() {
    _updateTimer();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return;
      _updateTimer();
    });
  }

  void _updateTimer() {
    final now = DateTime.now();
    final diff = now.difference(_placedAt);
    final remaining = const Duration(minutes: 5) - diff;

    if (remaining.isNegative) {
      if (_canCancel) {
        setState(() {
          _canCancel = false;
          _timer?.cancel();
        });
      }
    } else {
      setState(() {
        _canCancel = true;
        final mins = remaining.inMinutes;
        final secs = remaining.inSeconds % 60;
        _timeLeft = "${mins}:${secs.toString().padLeft(2, '0')}";
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final status = widget.order['status']?.toString().toLowerCase() ?? '';
    final isCancelableStatus = status == 'pending' || status == 'preparing';
    const primaryGreen = Color(0xFF248C70);
    
    final bool showTrack = ['pending', 'preparing', 'ready', 'accepted', 'on the way', 'out for delivery'].contains(status);
    final bool showCancel = isCancelableStatus && _canCancel;

    return Padding(
      padding: const EdgeInsets.only(top: 14),
      child: Column(
        children: [
          Row(
            children: [
              if (showCancel) ...[
                Expanded(
                  child: SizedBox(
                    height: 38,
                    child: OutlinedButton.icon(
                      onPressed: widget.onCancel,
                      icon: const Icon(Icons.close_rounded, size: 16),
                      label: const FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text('Cancel Order'),
                      ),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red.shade600,
                        side: BorderSide(color: Colors.red.shade300),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                        textStyle: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
              ],
              if (showTrack) ...[
                Expanded(
                  child: SizedBox(
                    height: 38,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        final rawItems = (widget.order['items'] as List? ?? []);
                        final itemsList = rawItems.map((i) {
                          if (i is Map<String, dynamic>) return i;
                          if (i is Map) return Map<String, dynamic>.from(i);
                          return {'name': i.toString(), 'quantity': 1};
                        }).toList();
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => OrderTrackingPage(
                              orderId: widget.orderId,
                              restaurantName: widget.restaurantName,
                              deliveryAddress: widget.address,
                              items: itemsList,
                              orderType: widget.order['orderType']?.toString() ?? 'delivery',
                            ),
                          ),
                        );
                      },
                      icon: const Icon(Icons.near_me_rounded, size: 16),
                      label: const FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text('Track Driver'),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryGreen,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                        textStyle: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
          if (showCancel) ...[
            const SizedBox(height: 4),
            Text(
              '$_timeLeft left to cancel',
              style: TextStyle(
                fontSize: 11,
                color: Colors.red.shade600,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// Removed dummy _DriverInfo

// â”€â”€ Status badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final (label, color, bg) = switch (status.toLowerCase()) {
      'on the way' || 'out for delivery' => ('On the way', Colors.orange, const Color(0xFFFFF3E0)),
      'preparing' || 'accepted' => ('Preparing', Colors.blue, const Color(0xFFE3F2FD)),
      'ready' => ('Ready', Colors.purple, Colors.purple.shade50),
      'delivered' => ('Complete', AppColors.primary, const Color(0xFFE8F5E9)),
      'cancelled' => ('Cancelled', Colors.red, const Color(0xFFFFEBEE)),
      'failed' => ('Payment Failed', Colors.red, const Color(0xFFFFEBEE)),
      _ => ('Pending', Colors.grey, const Color(0xFFF3F4F6)),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700)),
    );
  }
}

// â”€â”€ Order progress tracker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _OrderTracker extends StatelessWidget {
  final String status;
  final String deliveryStatus;
  final String orderType;
  const _OrderTracker({required this.status, required this.deliveryStatus, this.orderType = ''});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    final steps = orderType == 'pickup' 
        ? ['Placed', 'Preparing', 'Ready', 'Collected']
        : ['Placed', 'Preparing', 'Picked Up', 'Delivered'];
        
    final s = status.toLowerCase();
    final ds = deliveryStatus.toLowerCase();
    
    int activeStep = 0; // Placed
    if (s == 'preparing' || s == 'ready' || ds == 'accepted' || ds == 'reached_store') activeStep = 1; // Preparing
    if (s == 'picked_up' || ds == 'picked_up' || ds == 'out_for_delivery' || s == 'on the way') activeStep = 2; // Picked Up
    if (s == 'delivered' || ds == 'delivered') activeStep = 3; // Delivered
    
    if (orderType == 'pickup' && s == 'ready') activeStep = 2;
    if (orderType == 'pickup' && s == 'delivered') activeStep = 3;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFF5FAF8), borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: List.generate(steps.length, (i) {
          final isDone = i <= activeStep;
          final isActive = i == activeStep;
          return Expanded(
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    children: [
                      Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          color: isDone ? AppColors.primary : const Color(0xFFE5E7EB),
                          shape: BoxShape.circle,
                          border: isActive ? Border.all(color: AppColors.primary, width: 2) : null,
                        ),
                        child: Center(child: isDone ? const Icon(Icons.check, color: Colors.white, size: 13) : null),
                      ),
                      const SizedBox(height: 4),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(steps[i], textAlign: TextAlign.center, style: TextStyle(fontSize: 10, fontWeight: isActive ? FontWeight.w700 : FontWeight.w500, color: isDone ? AppColors.primary : const Color(0xFF9CA3AF))),
                      ),
                    ],
                  ),
                ),
                if (i < steps.length - 1)
                  Expanded(
                    child: Container(height: 2, margin: const EdgeInsets.only(bottom: 18), color: i < activeStep ? AppColors.primary : const Color(0xFFE5E7EB)),
                  ),
              ],
            ),
          );
        }),
      ),
    );
  }
}

// â”€â”€ Action button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _ActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  final bool isLoading;

  const _ActionButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isLoading ? null : onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isLoading)
              const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            else
              Icon(icon, color: Colors.white, size: 14),
            const SizedBox(width: 5),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

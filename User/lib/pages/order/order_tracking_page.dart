import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/theme/app_colors.dart';
import '../../services/order_api_service.dart';
import '../../services/restaurant_api_service.dart';
import '../../services/socket_service.dart';
import 'contact_support_page.dart';

/// 2-Stage Order Tracking Page with Realistic Google Maps Vector Painter

class OrderTrackingPage extends StatefulWidget {
  final String orderId;
  final String restaurantName;
  final String deliveryAddress;
  final List<Map<String, dynamic>> items;
  final String orderType;
  final String pickupDate;
  final String pickupTimeSlot;
  final String pickupOtp;

  const OrderTrackingPage({
    super.key,
    required this.orderId,
    this.restaurantName = '',
    this.deliveryAddress = '',
    this.items = const [],
    this.orderType = 'delivery',
    this.pickupDate = '',
    this.pickupTimeSlot = '',
    this.pickupOtp = '',
  });

  @override
  State<OrderTrackingPage> createState() => _OrderTrackingPageState();
}

class _OrderTrackingPageState extends State<OrderTrackingPage>
    with SingleTickerProviderStateMixin {
  GoogleMapController? _mapController;
  Map<String, dynamic>? _trackingData;
  Function(dynamic)? _socketCallback;
  bool _isFindingDriver = false; // Never true by default to avoid false driver UI for self pickup
  bool _hasShownRatingModal = false;
  int _currentStep = 1; // 0=Placed, 1=Preparing, 2=Out for Delivery, 3=Delivered
  Timer? _searchTimer;
  Timer? _mockTimer;

  bool get _isSelfPickup {
    final wType = widget.orderType.toLowerCase();
    if (wType == 'pickup' || wType == 'self_pickup' || wType == 'self-pickup' || wType == 'takeaway') return true;
    final tType = (_trackingData?['orderType'] ?? _trackingData?['order']?['orderType'] ?? '').toString().toLowerCase();
    if (tType == 'pickup' || tType == 'self_pickup' || tType == 'self-pickup' || tType == 'takeaway') return true;
    if (_trackingData?['isSelfPickup'] == true || _trackingData?['order']?['isSelfPickup'] == true) return true;
    return false;
  }

  String get _displayOrderNumber {
    final ordNum = _trackingData?['orderNumber'] ??
        _trackingData?['orderId'] ??
        _trackingData?['order']?['orderNumber'] ??
        _trackingData?['order']?['orderId'];
    if (ordNum != null && ordNum.toString().isNotEmpty && !ordNum.toString().contains('ObjectId')) {
      final s = ordNum.toString();
      if (s.startsWith('ORD')) return s;
      if (s.length < 15) return s;
    }
    if (widget.orderId.startsWith('ORD')) return widget.orderId;
    if (widget.orderId.length == 24) {
      return 'ORD${widget.orderId.substring(widget.orderId.length - 4).toUpperCase()}';
    }
    return widget.orderId;
  }

  AnimationController? _pulseController;

  AnimationController _getPulseController() {
    if (_pulseController == null) {
      _pulseController = AnimationController(
        vsync: this,
        duration: const Duration(seconds: 2),
      )..repeat();
    }
    return _pulseController!;
  }

  Timer? _pollingTimer;

  String _cleanRestaurantName(dynamic rawName) {
    if (rawName == null) return 'Restaurant';
    final str = rawName.toString().trim();
    if (str.isEmpty) return 'Restaurant';
    if (str.contains('{en:')) {
      final match = RegExp(r'\{en:\s*([^}]+)\}').firstMatch(str);
      if (match != null) return match.group(1)?.trim() ?? str;
    }
    if (str.startsWith('{') && str.endsWith('}')) {
      try {
        final decoded = jsonDecode(str);
        if (decoded is Map && decoded.containsKey('en')) return decoded['en'].toString();
      } catch (_) {}
    }
    return str;
  }

  @override
  void initState() {
    super.initState();

    SharedPreferences.getInstance().then((prefs) {
      if (prefs.getBool('rated_${widget.orderId}') == true) {
        if (mounted) {
          setState(() {
            _hasShownRatingModal = true;
          });
        }
      }
    }).catchError((_) {});

    _getPulseController();
    _fetchTracking();

    _pollingTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted) {
        _fetchTracking();
      }
    });

    SocketService.init();
    SocketService.joinOrder(widget.orderId);

    _socketCallback = (data) {
      debugPrint('Order Tracking live update: $data');
      if (mounted) {
        Future.delayed(const Duration(milliseconds: 300), () {
          if (mounted) {
            _fetchTracking();
          }
        });
      }
    };
    SocketService.onOrderStatusUpdated(_socketCallback!);
    SocketService.on('order:status', _socketCallback!);
    SocketService.on('order:location_update', _socketCallback!);
    SocketService.on('rider:location_update', _socketCallback!);
    SocketService.on('rider:location_updated', _socketCallback!);
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _searchTimer?.cancel();
    _mockTimer?.cancel();
    _pulseController?.dispose();
    _mapController?.dispose();
    SocketService.leaveOrder(widget.orderId);
    if (_socketCallback != null) {
      SocketService.offOrderStatusUpdated(_socketCallback);
      SocketService.off('order:status', _socketCallback);
      SocketService.off('order:location_update', _socketCallback);
      SocketService.off('rider:location_update', _socketCallback);
      SocketService.off('rider:location_updated', _socketCallback);
    }
    super.dispose();
  }

  Future<void> _fetchTracking() async {
    try {
      final data = await OrderApiService.getOrderTracking(widget.orderId);
      if (data != null && (data['success'] == true || data['status'] != null)) {
        if (mounted) {
          setState(() {
            _trackingData = data;
            final status = (data['status'] ?? data['order']?['status'] ?? 'pending').toString().toLowerCase();
            final isSelf = _isSelfPickup;
            final rider = data['rider'] ?? data['order']?['rider'];

            if (!isSelf && (status == 'ready' || status == 'ready_for_pickup' || status == 'searching_for_rider') && rider == null) {
              _isFindingDriver = true;
            } else {
              _isFindingDriver = false;
            }

            final rawCustomerArrived = _trackingData?['customerArrived'] == true ||
                _trackingData?['order']?['customerArrived'] == true ||
                _isArrivedNotified;

            if (status == 'delivered' || status == 'completed' || status == 'handovered' || status == 'handed_over') {
              _pickupStage = 4;
              if (!_hasShownRatingModal && data['isRated'] != true && data['order']?['isRated'] != true) {
                _hasShownRatingModal = true;
                _markOrderAsRatedLocally();
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (mounted) {
                    _showDualRatingModal();
                  }
                });
              }
            } else if (rawCustomerArrived || status == 'customer_arrived' || status == 'arrived') {
              _pickupStage = 3;
              _isArrivedNotified = true;
            } else if (status == 'ready' || status == 'ready_for_pickup') {
              _pickupStage = 2;
            } else if (status == 'confirmed' || status == 'accepted' || status == 'preparing' || status == 'in_kitchen') {
              _pickupStage = 1;
            } else {
              _pickupStage = 0;
            }
          });
        }
      }
    } catch (e) {
      debugPrint('Tracking fetch error: $e');
    }
  }

  Future<void> _markOrderAsRatedLocally() async {
    _hasShownRatingModal = true;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('rated_${widget.orderId}', true);
    } catch (_) {}
  }

  void _showDualRatingModal() {
    double restaurantRating = 5.0;
    double riderRating = 5.0;
    final restCommentController = TextEditingController();
    final riderCommentController = TextEditingController();
    bool isSubmitting = false;

    final restName = _cleanRestaurantName(_trackingData?['restaurant']?['name'] ?? widget.restaurantName);
    final riderName = (_trackingData?['driverName'] ?? _trackingData?['rider']?['name'] ?? 'Delivery Partner').toString();
    final bool isDeliveryOrder = !_isSelfPickup;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      isDismissible: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
              ),
              child: Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.grey[300],
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF16A34A).withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.check_circle, color: Color(0xFF16A34A), size: 36),
                      ),
                      const SizedBox(height: 10),
                      const Text(
                        'Order Delivered Successfully!',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Rate your experience with restaurant and delivery partner',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                      const SizedBox(height: 20),

                      // Section 1: Restaurant Rating
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF9FAFB),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE5E7EB)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.restaurant, color: AppColors.primary, size: 20),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    restName,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF1F2937)),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Center(
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: List.generate(5, (index) {
                                  final starIndex = index + 1;
                                  return IconButton(
                                    onPressed: () {
                                      setModalState(() {
                                        restaurantRating = starIndex.toDouble();
                                      });
                                    },
                                    icon: Icon(
                                      starIndex <= restaurantRating ? Icons.star_rounded : Icons.star_border_rounded,
                                      color: const Color(0xFFF59E0B),
                                      size: 36,
                                    ),
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(),
                                  );
                                }),
                              ),
                            ),
                            const SizedBox(height: 10),
                            TextField(
                              controller: restCommentController,
                              maxLines: 2,
                              decoration: InputDecoration(
                                hintText: 'How was the food quality, taste, and packaging?',
                                hintStyle: TextStyle(color: Colors.grey[400], fontSize: 12),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                filled: true,
                                fillColor: Colors.white,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                  borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                  borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                                ),
                              ),
                              style: const TextStyle(fontSize: 12),
                            ),
                          ],
                        ),
                      ),

                      // Section 2: Delivery Partner Rating (If delivery)
                      if (isDeliveryOrder) ...[
                        const SizedBox(height: 14),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF9FAFB),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE5E7EB)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.two_wheeler, color: Colors.blue, size: 20),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Rider: $riderName',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF1F2937)),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Center(
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: List.generate(5, (index) {
                                    final starIndex = index + 1;
                                    return IconButton(
                                      onPressed: () {
                                        setModalState(() {
                                          riderRating = starIndex.toDouble();
                                        });
                                      },
                                      icon: Icon(
                                        starIndex <= riderRating ? Icons.star_rounded : Icons.star_border_rounded,
                                        color: const Color(0xFFF59E0B),
                                        size: 36,
                                      ),
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(),
                                    );
                                  }),
                                ),
                              ),
                              const SizedBox(height: 10),
                              TextField(
                                controller: riderCommentController,
                                maxLines: 2,
                                decoration: InputDecoration(
                                  hintText: 'How was the rider service & delivery punctuality?',
                                  hintStyle: TextStyle(color: Colors.grey[400], fontSize: 12),
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  filled: true,
                                  fillColor: Colors.white,
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(10),
                                    borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(10),
                                    borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                                  ),
                                ),
                                style: const TextStyle(fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                      ],

                      const SizedBox(height: 20),

                      // Submit button
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: isSubmitting
                              ? null
                              : () async {
                                  setModalState(() => isSubmitting = true);
                                  final restId = (_trackingData?['restaurantId'] ??
                                          _trackingData?['restaurant']?['_id'] ??
                                          _trackingData?['restaurant']?['id'] ??
                                          '')
                                      .toString();
                                  final success = await RestaurantApiService.submitDualReview(
                                    orderId: widget.orderId,
                                    restaurantId: restId,
                                    restaurantRating: restaurantRating,
                                    riderRating: isDeliveryOrder ? riderRating : null,
                                    comment: restCommentController.text.trim(),
                                    riderComment: riderCommentController.text.trim(),
                                  );

                                  if (mounted) {
                                    Navigator.pop(ctx);
                                    await _markOrderAsRatedLocally();
                                    setState(() {
                                      _hasShownRatingModal = true;
                                      if (_trackingData != null) {
                                        _trackingData!['isRated'] = true;
                                      }
                                    });
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(success
                                            ? '🌟 Thank you for your rating & review!'
                                            : 'Review submitted successfully!'),
                                        backgroundColor: const Color(0xFF16A34A),
                                      ),
                                    );
                                  }
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          child: isSubmitting
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                )
                              : const Text(
                                  'Submit Ratings & Reviews',
                                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                                ),
                        ),
                      ),
                      const SizedBox(height: 10),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  String get _effectiveStatus {
    final s1 = _trackingData?['deliveryStatus']?.toString().toLowerCase();
    final s2 = _trackingData?['status']?.toString().toLowerCase();
    final s3 = _trackingData?['order']?['deliveryStatus']?.toString().toLowerCase();
    final s4 = _trackingData?['order']?['status']?.toString().toLowerCase();

    final candidates = [s1, s2, s3, s4].where((s) => s != null && s.isNotEmpty).toList();
    if (candidates.contains('delivered') || candidates.contains('completed')) return 'delivered';
    if (candidates.contains('out_for_delivery') || candidates.contains('on_the_way') || candidates.contains('reached_customer_location') || candidates.contains('delivery_arrived')) return 'out_for_delivery';
    if (candidates.contains('picked_up') || candidates.contains('partner_picked')) return 'picked_up';
    if (candidates.contains('ready') || candidates.contains('ready_for_pickup')) return 'ready';
    if (candidates.contains('preparing') || candidates.contains('in_kitchen')) return 'preparing';
    if (candidates.contains('confirmed') || candidates.contains('accepted') || candidates.contains('assigned') || candidates.contains('reached_restaurant') || candidates.contains('reached_store')) return 'accepted';
    return candidates.isNotEmpty ? candidates.first! : 'pending';
  }

  int get _stepFromStatus {
    final status = _effectiveStatus;

    if (_isSelfPickup) {
      if (status == 'delivered' || status == 'completed' || status == 'handovered' || status == 'handed_over') return 4;
      if (status == 'customer_arrived' || status == 'arrived' || _isArrivedNotified) return 3;
      if (status == 'ready' || status == 'ready_for_pickup') return 2;
      if (status == 'confirmed' || status == 'accepted' || status == 'preparing' || status == 'in_kitchen') return 1;
      return 0; // scheduled/placed
    } else {
      if (status == 'delivered' || status == 'completed') return 6;
      if (status == 'out_for_delivery' || status == 'on_the_way' || status == 'reached_customer_location' || status == 'delivery_arrived') return 5;
      if (status == 'picked_up' || status == 'partner_picked') return 4;
      if (status == 'ready' || status == 'ready_for_pickup') return 3;
      if (status == 'preparing' || status == 'in_kitchen') return 2;
      if (status == 'confirmed' || status == 'accepted' || status == 'assigned' || status == 'reached_restaurant' || status == 'reached_store') return 1;
      return 0; // placed/pending
    }
  }

  String _formatETA(dynamic rawEta) {
    if (rawEta == null) return '15-20 mins';
    final str = rawEta.toString().trim();
    if (str.isEmpty) return '15-20 mins';

    if (RegExp(r'^\d+\s*mins?$', caseSensitive: false).hasMatch(str)) {
      return str;
    }
    if (RegExp(r'^\d+-\d+\s*mins?$', caseSensitive: false).hasMatch(str)) {
      return str;
    }

    try {
      final etaDate = DateTime.tryParse(str);
      if (etaDate != null) {
        final now = DateTime.now();
        final diff = etaDate.difference(now).inMinutes;
        if (diff <= 0) return '5-10 mins';
        if (diff > 120) return '15-20 mins';
        return '$diff mins';
      }
    } catch (_) {}

    final digits = str.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.isNotEmpty) {
      final val = int.tryParse(digits) ?? 15;
      if (val > 120) return '15-20 mins';
      return '$val mins';
    }

    return '15-20 mins';
  }

  String get _statusTitle {
    final status = _effectiveStatus;
    if (status == 'delivered' || status == 'completed' || status == 'handovered') return 'Order Completed!';
    if (status == 'out_for_delivery' || status == 'on_the_way' || status == 'reached_customer_location' || status == 'delivery_arrived') return 'Order is on the way';
    if (status == 'picked_up' || status == 'partner_picked') return 'Partner Picked Order';
    if (status == 'ready' || status == 'ready_for_pickup') return 'Food Prepared & Ready';
    if (status == 'preparing' || status == 'in_kitchen') return 'Order Preparing in Kitchen';
    if (status == 'confirmed' || status == 'accepted' || status == 'assigned' || status == 'reached_restaurant' || status == 'reached_store') return 'Order Accepted & Rider Assigned';
    if (status == 'cancelled') return 'Order Cancelled';
    return 'Waiting for Restaurant Acceptance';
  }

  String get _statusSubtitle {
    final status = _effectiveStatus;
    if (status == 'delivered' || status == 'completed') return 'Thank you! Enjoy your meal!';
    if (status == 'out_for_delivery' || status == 'on_the_way' || status == 'reached_customer_location' || status == 'delivery_arrived') {
      final etaStr = _formatETA(_trackingData?['estimatedDeliveryTime'] ?? _trackingData?['order']?['estimatedDeliveryTime']);
      return 'Arriving in $etaStr';
    }
    if (status == 'picked_up' || status == 'partner_picked') {
      return 'Delivery partner has picked up order from restaurant & starting delivery soon!';
    }
    if (status == 'ready' || status == 'ready_for_pickup') {
      return _isSelfPickup ? 'Food is ready at counter! Show OTP or QR to pickup' : 'Delivery partner is picking up your order';
    }
    if (status == 'confirmed' || status == 'accepted' || status == 'preparing' || status == 'in_kitchen') {
      return 'Kitchen is preparing your fresh meal';
    }
    if (status == 'cancelled') return 'This order was cancelled';
    return 'Restaurant is reviewing your order details';
  }

  Color get _statusBannerColor {
    final status = _effectiveStatus;
    if (status == 'delivered' || status == 'completed') return const Color(0xFF16A34A);
    if (status == 'picked_up' || status == 'out_for_delivery' || status == 'on_the_way' || status == 'reached_customer_location' || status == 'delivery_arrived') return AppColors.primary;
    if (status == 'cancelled') return Colors.red;
    return const Color(0xFFD97706);
  }

  void _callNumber(String phone) async {
    final cleanPhone = phone.replaceAll(RegExp(r'[^0-9+]'), '');
    final Uri telUri = Uri(scheme: 'tel', path: cleanPhone.isNotEmpty ? cleanPhone : '9876543210');
    if (await canLaunchUrl(telUri)) {
      await launchUrl(telUri);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Calling $phone...'),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    }
  }

  void _showSupportChatBottomSheet() {
    final messageController = TextEditingController();
    List<Map<String, String>> chatMessages = [
      {
        'sender': 'support',
        'text': 'Hello! Welcome to ECDKart Support. How can we help you with order #${widget.orderId}?'
      }
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setChatState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
              ),
              child: Container(
                height: 480,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                ),
                child: Column(
                  children: [
                    // Header
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.08),
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 36,
                            height: 36,
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.support_agent, color: Colors.white, size: 20),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: const [
                                Text(
                                  'Support Team Chat',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF1F2937),
                                  ),
                                ),
                                Text(
                                  'Online • Live Help',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close, color: Colors.grey),
                            onPressed: () => Navigator.pop(ctx),
                          ),
                        ],
                      ),
                    ),

                    // Chat messages list
                    Expanded(
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: chatMessages.length,
                        itemBuilder: (context, i) {
                          final msg = chatMessages[i];
                          final isUser = msg['sender'] == 'user';
                          return Align(
                            alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 10),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: isUser ? AppColors.primary : const Color(0xFFF3F4F6),
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: Text(
                                msg['text']!,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: isUser ? Colors.white : const Color(0xFF1F2937),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),

                    // Input bar
                    Container(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        border: Border(top: BorderSide(color: Color(0xFFF3F4F6))),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: messageController,
                              decoration: InputDecoration(
                                hintText: 'Type your message...',
                                hintStyle: TextStyle(color: Colors.grey[400], fontSize: 13),
                                filled: true,
                                fillColor: const Color(0xFFF9FAFB),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(20),
                                  borderSide: BorderSide.none,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          GestureDetector(
                            onTap: () {
                              final text = messageController.text.trim();
                              if (text.isNotEmpty) {
                                setChatState(() {
                                  chatMessages.add({'sender': 'user', 'text': text});
                                  messageController.clear();
                                });
                                // Auto reply
                                Future.delayed(const Duration(milliseconds: 800), () {
                                  if (ctx.mounted) {
                                    setChatState(() {
                                      chatMessages.add({
                                        'sender': 'support',
                                        'text': 'Thanks for reaching out! Agent is reviewing your order details.'
                                      });
                                    });
                                  }
                                });
                              }
                            },
                            child: Container(
                              padding: const EdgeInsets.all(10),
                              decoration: const BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.send, color: Colors.white, size: 18),
                            ),
                          ),
                        ],
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

  void _callRider() async {
    final Uri telUri = Uri(scheme: 'tel', path: '9876543210');
    if (await canLaunchUrl(telUri)) {
      await launchUrl(telUri);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Calling Rahul Sharma (9876543210)...'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    }
  }

  int _pickupStage = 1; // 0=Placed, 1=Preparing, 2=Ready, 3=Arrived, 4=Completed
  int _cancelTimerSeconds = 60;
  Timer? _cancelTimer;
  bool _isArrivedNotified = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF1F2937)),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _isSelfPickup
                  ? 'Self Pickup Tracking'
                  : (_isFindingDriver ? 'Track Order' : 'Tracking Order'),
              style: const TextStyle(
                color: Color(0xFF1F2937),
                fontSize: 16,
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              'ID : #$_displayOrderNumber',
              style: const TextStyle(
                color: Color(0xFF6B7280),
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined, color: Color(0xFF1F2937), size: 20),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Sharing tracking link...')),
              );
            },
          ),
        ],
      ),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 400),
        switchInCurve: Curves.easeOutCubic,
        switchOutCurve: Curves.easeInCubic,
        transitionBuilder: (child, animation) {
          return FadeTransition(
            opacity: animation,
            child: SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(0.0, 0.04),
                end: Offset.zero,
              ).animate(animation),
              child: child,
            ),
          );
        },
        child: _isSelfPickup
            ? KeyedSubtree(
                key: ValueKey('pickup_stage_$_pickupStage'),
                child: _buildSelfPickupTrackingState(),
              )
            : (_isFindingDriver
                ? KeyedSubtree(
                    key: const ValueKey('finding_driver'),
                    child: _buildFindingDriverState(),
                  )
                : KeyedSubtree(
                    key: const ValueKey('active_tracking'),
                    child: _buildActiveTrackingState(),
                  )),
      ),
    );
  }

  // ── State 3: Self Pickup Flow UI ───────────────────────────────────────────
  Widget _buildSelfPickupTrackingState() {
    String statusTitle;
    String statusSubtitle;
    Color statusColor;

    switch (_pickupStage) {
      case 0:
        statusTitle = 'Order Confirmed';
        statusSubtitle = 'Restaurant received your self pickup order';
        statusColor = const Color(0xFF2563EB);
        break;
      case 1:
        statusTitle = 'Kitchen is Preparing';
        statusSubtitle = 'Smart Prep Buffer: ~15 mins remaining';
        statusColor = const Color(0xFFD97706);
        break;
      case 2:
        statusTitle = '🎉 Ready for Pickup!';
        statusSubtitle = 'Your food is fresh & hot at the counter!';
        statusColor = const Color(0xFF059669);
        break;
      case 3:
        statusTitle = '📍 Customer Arrived at Counter';
        statusSubtitle = 'Staff is serving your order right now';
        statusColor = const Color(0xFF7C3AED);
        break;
      case 4:
      default:
        statusTitle = '✅ Handed Over & Completed';
        statusSubtitle = 'Thank you! Enjoy your meal!';
        statusColor = const Color(0xFF16A34A);
        break;
    }

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Header Banner
          Container(
            width: double.infinity,
            color: statusColor,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: const BoxDecoration(
                        color: Colors.white24,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.storefront_rounded, color: Colors.white, size: 22),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        statusTitle,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  statusSubtitle,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Colors.white70,
                  ),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Cancellation Window Timer Banner
                if (_cancelTimerSeconds > 0 && _pickupStage < 2) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFFCD34D)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.timer_outlined, color: Color(0xFFD97706), size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Free Cancellation Window: 0:${_cancelTimerSeconds.toString().padLeft(2, '0')}s left',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF92400E),
                            ),
                          ),
                        ),
                        InkWell(
                          onTap: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Order cancelled successfully.')),
                            );
                            Navigator.pop(context);
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEF4444),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'Cancel',
                              style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // 2. 5-Stage Step Progress Tracker
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6)],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Self Pickup Live Flow',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          _buildStepCircle(0, 'Placed', Icons.check_circle_outline),
                          _buildStepLine(0),
                          _buildStepCircle(1, 'Preparing', Icons.outdoor_grill),
                          _buildStepLine(1),
                          _buildStepCircle(2, 'Ready', Icons.shopping_bag_outlined),
                          _buildStepLine(2),
                          _buildStepCircle(3, 'Arrived', Icons.front_hand_outlined),
                          _buildStepLine(3),
                          _buildStepCircle(4, 'Done', Icons.verified),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // 3. Pickup Verification Card (OTP & Vector QR Code)
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.08),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Pickup Verification OTP',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF6B7280),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Text(
                                    widget.pickupOtp.isNotEmpty
                                        ? widget.pickupOtp
                                        : (_trackingData?['pickupOtp'] ?? _trackingData?['order']?['pickupOtp'] ?? _trackingData?['selfPickupCode'] ?? '----').toString(),
                                    style: const TextStyle(
                                      fontSize: 28,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 6,
                                      color: Color(0xFF1F2937),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  IconButton(
                                    icon: const Icon(Icons.copy, size: 18, color: AppColors.primary),
                                    onPressed: () {
                                      final otpText = widget.pickupOtp.isNotEmpty
                                          ? widget.pickupOtp
                                          : (_trackingData?['pickupOtp'] ?? _trackingData?['order']?['pickupOtp'] ?? _trackingData?['selfPickupCode'] ?? '----').toString();
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(content: Text('OTP $otpText copied!')),
                                      );
                                    },
                                  ),
                                ],
                              ),
                            ],
                          ),
                          // Custom Painted Vector QR Code Box
                          Container(
                            width: 72,
                            height: 72,
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF9FAFB),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.grey.shade300),
                            ),
                            child: CustomPaint(
                              painter: _QrCodePainter(),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Divider(height: 1),
                      const SizedBox(height: 10),
                      Row(
                        children: const [
                          Icon(Icons.info_outline, size: 16, color: Color(0xFF6B7280)),
                          SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              'Present this 4-Digit OTP or QR code at the restaurant counter for instant verification & handover.',
                              style: TextStyle(
                                fontSize: 11,
                                color: Color(0xFF6B7280),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // 4. "I'M HERE AT THE COUNTER" Action Button
                if (_pickupStage < 4) ...[
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        setState(() {
                          _pickupStage = 3;
                          _isArrivedNotified = true;
                        });
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('📢 Restaurant counter staff notified of your arrival!'),
                            backgroundColor: Color(0xFF059669),
                          ),
                        );
                        await OrderApiService.notifyCustomerArrived(widget.orderId);
                        _fetchTracking();
                      },
                      icon: const Icon(Icons.front_hand_rounded, color: Colors.white, size: 22),
                      label: Text(
                        _isArrivedNotified ? "I'M AT COUNTER (NOTIFIED)" : "I'M HERE AT THE COUNTER",
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF059669), // Emerald Green
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        elevation: 2,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // 5. Smart Ready Time & Grace Period Card
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6)],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.access_time_filled, color: Color(0xFF2563EB), size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Pickup Slot: ${widget.pickupDate} (${widget.pickupTimeSlot})',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF1F2937),
                              ),
                            ),
                            const SizedBox(height: 2),
                            const Text(
                              '⏱️ 15-Mins Grace Period: Order held warm at counter until 10:00 AM',
                              style: TextStyle(
                                fontSize: 11,
                                color: Color(0xFF4B5563),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // 6. Restaurant Location & Directions Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6)],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.storefront_rounded, color: AppColors.primary, size: 22),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _cleanRestaurantName(_trackingData?['restaurant']?['name'] ?? widget.restaurantName),
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF1F2937),
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              '📍 2.1 km',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        widget.deliveryAddress,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF6B7280),
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () async {
                                final url = Uri.parse(
                                    'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(widget.restaurantName + " " + widget.deliveryAddress)}');
                                if (await canLaunchUrl(url)) {
                                  await launchUrl(url, mode: LaunchMode.externalApplication);
                                }
                              },
                              icon: const Icon(Icons.directions, size: 18),
                              label: const Text('Get Directions'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppColors.primary,
                                side: const BorderSide(color: AppColors.primary),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () async {
                                final url = Uri.parse('tel:+919876543210');
                                if (await canLaunchUrl(url)) {
                                  await launchUrl(url);
                                }
                              },
                              icon: const Icon(Icons.call, size: 18),
                              label: const Text('Call Store'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: const Color(0xFF374151),
                                side: BorderSide(color: Colors.grey.shade300),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // 7. Interactive Flow Simulator for Demo Verification
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        '⚡ Flow Live Simulator Controls',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF4B5563),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () => setState(() => _pickupStage = 2),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFD97706),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 8),
                              ),
                              child: const Text('Mark Ready', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () => setState(() => _pickupStage = 4),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF16A34A),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 8),
                              ),
                              child: const Text('Verify OTP & Complete', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 30),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepCircle(int stage, String label, IconData icon) {
    bool isDone = _pickupStage >= stage;
    bool isCurrent = _pickupStage == stage;
    return Expanded(
      child: Column(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: isDone ? const Color(0xFF059669) : Colors.grey.shade200,
              shape: BoxShape.circle,
              border: isCurrent ? Border.all(color: Colors.amber, width: 3) : null,
            ),
            child: Icon(
              icon,
              size: 16,
              color: isDone ? Colors.white : Colors.grey.shade500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 10,
              fontWeight: isCurrent ? FontWeight.w900 : FontWeight.w600,
              color: isDone ? const Color(0xFF059669) : Colors.grey.shade500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepLine(int stage) {
    bool isDone = _pickupStage > stage;
    return Container(
      width: 12,
      height: 2,
      color: isDone ? const Color(0xFF059669) : Colors.grey.shade300,
    );
  }

  // ── State 1: Finding Driver UI (Screenshot 2) ─────────────────────────────
  Widget _buildFindingDriverState() {
    final controller = _getPulseController();
    final realItems = _trackingData?['items'] ?? _trackingData?['order']?['items'] ?? widget.items;
    final firstItem = realItems.isNotEmpty ? realItems.first : null;
    final itemName = firstItem != null 
        ? (firstItem['name'] ?? firstItem['product']?['name'] ?? 'Order Item').toString() 
        : 'Order Item';
    final restName = _cleanRestaurantName(_trackingData?['restaurant']?['name'] ?? widget.restaurantName);

    final status = (_trackingData?['status'] ?? _trackingData?['order']?['status'] ?? 'pending').toString().toLowerCase();
    final isWaitingRestaurant = status == 'pending' || status == 'placed' || status == 'created';
    final bannerTitle = isWaitingRestaurant ? 'Waiting for Restaurant Acceptance' : 'Finding a Driver for Your Order';
    final bannerSubtitle = isWaitingRestaurant 
        ? 'Your order has been sent to the restaurant. Waiting for them to review and accept.' 
        : "We're searching for the best available driver nearby. This usually takes less than a minute.";

    return Stack(
      children: [
        // Background Radar Searching Map Canvas
        Positioned.fill(
          child: AnimatedBuilder(
            animation: controller,
            builder: (context, child) {
              return CustomPaint(
                painter: _RadarSearchMapPainter(progress: controller.value),
              );
            },
          ),
        ),

        // Bottom Overlay Cards (Screenshot 2)
        Positioned(
          left: 16,
          right: 16,
          bottom: 24,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Searching / Waiting Banner Card
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                  boxShadow: const [
                    BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        isWaitingRestaurant ? Icons.hourglass_top_rounded : Icons.search,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            bannerTitle,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            bannerSubtitle,
                            style: const TextStyle(
                              fontSize: 11,
                              color: Color(0xFF4B5563),
                              height: 1.2,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 10),

              // Order Item Preview Card
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: const [
                    BoxShadow(color: Colors.black12, blurRadius: 8)
                  ],
                ),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        width: 52,
                        height: 52,
                        color: AppColors.primary.withValues(alpha: 0.1),
                        child: const Icon(Icons.fastfood, color: AppColors.primary),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Order #$_displayOrderNumber',
                            style: const TextStyle(
                              fontSize: 11,
                              color: Color(0xFF9CA3AF),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            itemName,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF1F2937),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              const Icon(Icons.storefront, size: 12, color: AppColors.primary),
                              const SizedBox(width: 4),
                              Text(
                                restName,
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: Color(0xFF6B7280),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // Cancel Order Button
              SizedBox(
                width: double.infinity,
                height: 46,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFF3F4F6),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Cancel Order',
                    style: TextStyle(
                      color: Color(0xFF374151),
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ── State 2: Active Driver Tracking UI (Screenshot 1 & 3 Combined) ────────
  Widget _buildActiveTrackingState() {
    final restData = _trackingData?['restaurant'] ?? {};
    final restName = (restData['name'] ?? widget.restaurantName).toString();
    final userAddr = (_trackingData?['deliveryLocation']?['address'] ?? _trackingData?['order']?['deliveryAddress']?['address'] ?? widget.deliveryAddress).toString();
    final riderData = _trackingData?['rider'] ?? _trackingData?['driver'];
    final rName = (riderData?['name'] ?? _trackingData?['driverName'] ?? 'Rider').toString();
    final hasRider = riderData != null && (riderData['name'] != null || riderData['phone'] != null || _trackingData?['driverName'] != null);

    double? restLat = restData['lat'] != null ? double.tryParse(restData['lat'].toString()) : null;
    double? restLng = restData['lng'] != null ? double.tryParse(restData['lng'].toString()) : null;
    if (restLat == null && restData['location']?['coordinates']?.length == 2) {
      restLng = double.tryParse(restData['location']['coordinates'][0].toString());
      restLat = double.tryParse(restData['location']['coordinates'][1].toString());
    }

    final userObj = _trackingData?['user'] ?? _trackingData?['deliveryLocation'] ?? _trackingData?['order']?['deliveryAddress'] ?? {};
    double? userLat = (userObj['lat'] ?? userObj['latitude']) != null ? double.tryParse((userObj['lat'] ?? userObj['latitude']).toString()) : null;
    double? userLng = (userObj['lng'] ?? userObj['longitude']) != null ? double.tryParse((userObj['lng'] ?? userObj['longitude']).toString()) : null;
    if (userLat == null && userObj['coordinates'] is List && (userObj['coordinates'] as List).length >= 2) {
      userLng = double.tryParse(userObj['coordinates'][0].toString());
      userLat = double.tryParse(userObj['coordinates'][1].toString());
    }
    if (userLat == null && _trackingData?['order']?['deliveryAddress']?['coordinates'] is List && (_trackingData!['order']['deliveryAddress']['coordinates'] as List).length >= 2) {
      final coords = _trackingData!['order']['deliveryAddress']['coordinates'] as List;
      userLng = double.tryParse(coords[0].toString());
      userLat = double.tryParse(coords[1].toString());
    }

    double? riderLat;
    double? riderLng;
    if (riderData != null && riderData is Map) {
      if (riderData['lat'] != null) riderLat = double.tryParse(riderData['lat'].toString());
      if (riderData['lng'] != null) riderLng = double.tryParse(riderData['lng'].toString());
      if (riderLat == null && riderData['location']?['coordinates']?.length == 2) {
        riderLng = double.tryParse(riderData['location']['coordinates'][0].toString());
        riderLat = double.tryParse(riderData['location']['coordinates'][1].toString());
      }
      if (riderLat == null && riderData['currentLocation']?['coordinates']?.length == 2) {
        riderLng = double.tryParse(riderData['currentLocation']['coordinates'][0].toString());
        riderLat = double.tryParse(riderData['currentLocation']['coordinates'][1].toString());
      }
    }
    if (riderLat == null && _trackingData?['driver']?['lat'] != null) {
      riderLat = double.tryParse(_trackingData!['driver']['lat'].toString());
      riderLng = double.tryParse(_trackingData!['driver']['lng'].toString());
    }

    final double defaultRestLat = restLat ?? 22.7196;
    final double defaultRestLng = restLng ?? 75.8577;
    final double defaultUserLat = userLat ?? (defaultRestLat + 0.015);
    final double defaultUserLng = userLng ?? (defaultRestLng + 0.015);

    final String activeStatus = (_trackingData?['status'] ?? _trackingData?['order']?['status'] ?? 'pending').toString().toLowerCase();
    final bool isOnTheWay = activeStatus == 'out_for_delivery' || activeStatus == 'on_the_way' || activeStatus == 'reached_customer_location' || activeStatus == 'delivery_arrived';

    // Real-time rider location tracking on Google Maps
    final double activeRiderLat = (riderLat != null && riderLat != 0) ? riderLat : defaultRestLat;
    final double activeRiderLng = (riderLng != null && riderLng != 0) ? riderLng : defaultRestLng;

    final Set<Marker> trackingMarkers = {
      Marker(
        markerId: const MarkerId('restaurant'),
        position: LatLng(defaultRestLat, defaultRestLng),
        infoWindow: InfoWindow(title: restName, snippet: 'Restaurant Location'),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange),
      ),
      Marker(
        markerId: const MarkerId('customer'),
        position: LatLng(defaultUserLat, defaultUserLng),
        infoWindow: const InfoWindow(title: 'Delivery Address'),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
      ),
    };

    if (hasRider) {
      trackingMarkers.add(
        Marker(
          markerId: const MarkerId('rider'),
          position: LatLng(activeRiderLat, activeRiderLng),
          infoWindow: InfoWindow(
            title: 'Rider: $rName',
            snippet: !isOnTheWay ? 'At Restaurant (Preparing to leave)' : 'On the way to deliver',
          ),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
        ),
      );
    }

    final Set<Polyline> trackingPolylines = {
      Polyline(
        polylineId: const PolylineId('route_line'),
        color: isOnTheWay ? AppColors.primary : Colors.orange,
        width: 5,
        points: [
          LatLng(defaultRestLat, defaultRestLng),
          LatLng(activeRiderLat, activeRiderLng),
          LatLng(defaultUserLat, defaultUserLng),
        ],
      ),
    };

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Dynamic Status Banner
          Container(
            width: double.infinity,
            color: _statusBannerColor,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _statusTitle,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _statusSubtitle,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Colors.white70,
                  ),
                ),
              ],
            ),
          ),

          // 2. Real Google Map Live Tracking View
          SizedBox(
            height: 250,
            width: double.infinity,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: GoogleMap(
                initialCameraPosition: CameraPosition(
                  target: LatLng((defaultRestLat + defaultUserLat) / 2, (defaultRestLng + defaultUserLng) / 2),
                  zoom: 13.5,
                ),
                markers: trackingMarkers,
                polylines: trackingPolylines,
                myLocationButtonEnabled: false,
                zoomControlsEnabled: false,
                onMapCreated: (controller) => _mapController = controller,
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // 3. Dynamic Driver Or Restaurant Info Card
                _buildDriverOrRestaurantCard(),

                const SizedBox(height: 16),

                // 4. Status Stepper Card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: const [
                      BoxShadow(color: Colors.black12, blurRadius: 6)
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.two_wheeler_rounded,
                              color: AppColors.primary, size: 22),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _statusTitle,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF1F2937),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _buildTimeline(),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // 5. Delivery Address & Real Items Breakdown
                _buildOrderDetails(),

                // 6. Delivered Rating & Review Banner
                if ((_trackingData?['status'] ?? _trackingData?['order']?['status'] ?? '').toString().toLowerCase() == 'delivered' ||
                    (_trackingData?['status'] ?? _trackingData?['order']?['status'] ?? '').toString().toLowerCase() == 'completed') ...[
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0FDF4),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFBBF7D0)),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.stars_rounded, color: Color(0xFF16A34A), size: 28),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _trackingData?['isRated'] == true ? 'Order Rated & Reviewed' : 'Rate Your Delivery Experience',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF14532D)),
                                  ),
                                  Text(
                                    _trackingData?['isRated'] == true
                                        ? 'Thank you! Your feedback helps us serve you better.'
                                        : 'Help us improve by rating restaurant & delivery partner.',
                                    style: const TextStyle(fontSize: 12, color: Color(0xFF15803D)),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        if (_trackingData?['isRated'] != true) ...[
                          const SizedBox(height: 12),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: _showDualRatingModal,
                              icon: const Icon(Icons.rate_review_outlined, color: Colors.white, size: 18),
                              label: const Text('Give Rating & Review', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF16A34A),
                                elevation: 0,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDriverOrRestaurantCard() {
    final status = (_trackingData?['status'] ?? _trackingData?['order']?['status'] ?? 'pending').toString().toLowerCase();
    final rider = _trackingData?['rider'];
    final restaurant = _trackingData?['restaurant'] ?? {};
    final restName = (restaurant['name'] ?? widget.restaurantName).toString();
    final restPhone = (restaurant['phone'] ?? '+919876543210').toString();
    final restAddress = (restaurant['address'] ?? '').toString();

    final hasRider = rider != null && (rider['name'] != null || rider['phone'] != null);

    if (!hasRider || status == 'pending' || status == 'placed') {
      // Show Restaurant Details & Assignment Status Card
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6)],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.storefront_rounded, color: AppColors.primary, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        restName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                      if (restAddress.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          restAddress,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                        ),
                      ],
                    ],
                  ),
                ),
                // Call Restaurant Button
                IconButton(
                  onPressed: () => _callNumber(restPhone),
                  icon: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.phone, color: Colors.white, size: 18),
                  ),
                ),
                // Support Chat Button
                IconButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => ContactSupportPage(orderId: widget.orderId)),
                    );
                  },
                  icon: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.chat_bubble_rounded, color: Colors.white, size: 18),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(height: 1, color: Color(0xFFF3F4F6)),
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(
                  status == 'pending' || status == 'placed'
                      ? Icons.hourglass_top_rounded
                      : Icons.two_wheeler_rounded,
                  size: 16,
                  color: AppColors.primary,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    status == 'pending' || status == 'placed'
                        ? 'Waiting for restaurant to accept order...'
                        : 'Assigning delivery partner...',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF4B5563),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    }

    // Show Real Rider Details Card
    final riderName = (rider['name'] ?? _trackingData?['driverName'] ?? 'Delivery Partner').toString();
    final riderPhone = (rider['phone'] ?? _trackingData?['driverPhone'] ?? '').toString();
    
    String bikeNumber = '';
    if (rider['vehicle'] is Map) {
      bikeNumber = (rider['vehicle']['number'] ?? rider['vehicle']['regNumber'] ?? rider['vehicle']['plateNumber'] ?? '').toString().trim();
    } else if (rider['vehicle'] != null) {
      final vStr = rider['vehicle'].toString();
      if (vStr.contains('number:')) {
        final match = RegExp(r'number:\s*([^,}\s]+)').firstMatch(vStr);
        if (match != null) bikeNumber = match.group(1) ?? '';
      } else if (!vStr.startsWith('{')) {
        bikeNumber = vStr.trim();
      }
    }
    if (bikeNumber.isEmpty && rider['vehicleNumber'] != null) {
      bikeNumber = rider['vehicleNumber'].toString().trim();
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6)],
      ),
      child: Column(
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: Container(
                  width: 48,
                  height: 48,
                  color: AppColors.primary.withValues(alpha: 0.1),
                  child: const Icon(Icons.person, color: AppColors.primary, size: 28),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      riderName,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      bikeNumber.isNotEmpty
                          ? 'Bike No: $bikeNumber'
                          : 'Delivery Partner',
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF6B7280),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              // Call Rider Button
              IconButton(
                onPressed: () => _callNumber(riderPhone),
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.phone, color: Colors.white, size: 18),
                ),
              ),
              // Support Chat Button
              IconButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => ContactSupportPage(orderId: widget.orderId)),
                  );
                },
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.chat_bubble_rounded, color: Colors.white, size: 18),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, color: Color(0xFFF3F4F6)),
          const SizedBox(height: 10),
          Row(
            children: const [
              Icon(Icons.info_outline, size: 16, color: AppColors.primary),
              SizedBox(width: 6),
              Expanded(
                child: Text(
                  'Rider has picked up your order and is on the way!',
                  style: TextStyle(
                    fontSize: 12,
                    color: Color(0xFF4B5563),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTimeline() {
    final step = _stepFromStatus;
    final isPickup = _isSelfPickup;
    final labels = isPickup
        ? ['Placed', 'Accepted', 'Preparing', 'Ready', 'Handed Over']
        : ['Placed', 'Accepted', 'Preparing', 'Ready', 'Partner Picked', 'On the Way', 'Delivered'];

    const double itemWidth = 85.0;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: List.generate(labels.length, (index) {
            final isCompleted = index <= step;
            final isActive = index == step;

            return SizedBox(
              width: itemWidth,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    height: 28,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Horizontal Line connecting steps
                        Positioned(
                          left: index == 0 ? itemWidth / 2 : 0,
                          right: index == labels.length - 1 ? itemWidth / 2 : 0,
                          child: Container(
                            height: 3,
                            color: isCompleted
                                ? (index < step ? AppColors.primary : Colors.grey[200])
                                : Colors.grey[200],
                          ),
                        ),
                        // Node Circle
                        Container(
                          width: 26,
                          height: 26,
                          decoration: BoxDecoration(
                            color: isCompleted ? AppColors.primary : Colors.white,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: isCompleted ? AppColors.primary : Colors.grey[300]!,
                              width: 2,
                            ),
                            boxShadow: isActive
                                ? [
                                    BoxShadow(
                                      color: AppColors.primary.withValues(alpha: 0.35),
                                      blurRadius: 6,
                                      spreadRadius: 2,
                                    )
                                  ]
                                : null,
                          ),
                          child: Center(
                            child: isCompleted
                                ? const Icon(Icons.check, color: Colors.white, size: 14)
                                : Text(
                                    '${index + 1}',
                                    style: TextStyle(
                                      color: Colors.grey[400],
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                    ),
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    labels[index],
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.visible,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: isActive ? FontWeight.w800 : FontWeight.w600,
                      color: isCompleted ? const Color(0xFF1F2937) : Colors.grey[400],
                    ),
                  ),
                ],
              ),
            );
          }),
        ),
      ),
    );
  }

  Widget _buildOrderDetails() {
    final List<dynamic> realItems = _trackingData?['items'] ??
        _trackingData?['order']?['items'] ??
        widget.items;

    final addressStr = _trackingData?['deliveryLocation']?['address'] ??
        _trackingData?['order']?['deliveryAddress']?['formattedAddress'] ??
        _trackingData?['order']?['deliveryAddress']?['address'] ??
        widget.deliveryAddress;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Delivery Address',
              style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF6B7280))),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.location_on, color: AppColors.primary, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  addressStr,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1F2937),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(height: 1, color: Color(0xFFF3F4F6)),
          const SizedBox(height: 16),
          const Text('Items Ordered',
              style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF6B7280))),
          const SizedBox(height: 12),
          if (realItems.isEmpty)
            const Text(
              'No items detailed',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            )
          else
            ...realItems.map((item) {
              final qty = item['quantity'] ?? item['qty'] ?? 1;
              final name = item['name'] ?? item['product']?['name'] ?? 'Item';
              final price = item['price'] ?? item['sellingPrice'] ?? 0;
              return Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF3F4F6),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text('${qty}x',
                          style: const TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 12)),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        name.toString(),
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    Text(
                      '₹${price.toString()}',
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }
}

// ── Custom Painter: Radar Search Map Canvas (Realistic Vector Map - Finding Driver) ──
class _RadarSearchMapPainter extends CustomPainter {
  final double progress;
  _RadarSearchMapPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    // 1. Modern Map Base Color (Google Maps Light Theme)
    final bgPaint = Paint()..color = const Color(0xFFF1F5F9);
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), bgPaint);

    // 2. City Buildings / Blocks Footprints
    final buildingPaint = Paint()..color = const Color(0xFFE2E8F0);
    final buildings = [
      RRect.fromRectAndRadius(Rect.fromLTWH(15, 15, size.width * 0.38, 70), const Radius.circular(8)),
      RRect.fromRectAndRadius(Rect.fromLTWH(size.width * 0.45, 15, size.width * 0.5, 60), const Radius.circular(8)),
      RRect.fromRectAndRadius(Rect.fromLTWH(15, size.height * 0.22, size.width * 0.22, 100), const Radius.circular(8)),
      RRect.fromRectAndRadius(Rect.fromLTWH(size.width * 0.7, size.height * 0.2, size.width * 0.25, 110), const Radius.circular(8)),
      RRect.fromRectAndRadius(Rect.fromLTWH(15, size.height * 0.52, size.width * 0.38, 85), const Radius.circular(8)),
      RRect.fromRectAndRadius(Rect.fromLTWH(size.width * 0.48, size.height * 0.5, size.width * 0.46, 95), const Radius.circular(8)),
    ];
    for (var b in buildings) {
      canvas.drawRRect(b, buildingPaint);
    }

    // 3. Green Parks & Reserves
    final parkPaint = Paint()..color = const Color(0xFFD1FAE5);
    final parkBorderPaint = Paint()
      ..color = const Color(0xFFA7F3D0)
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    final parkPath1 = Path()
      ..moveTo(size.width * 0.32, size.height * 0.12)
      ..quadraticBezierTo(size.width * 0.45, size.height * 0.1, size.width * 0.6, size.height * 0.15)
      ..lineTo(size.width * 0.58, size.height * 0.28)
      ..quadraticBezierTo(size.width * 0.4, size.height * 0.3, size.width * 0.3, size.height * 0.22)
      ..close();
    canvas.drawPath(parkPath1, parkPaint);
    canvas.drawPath(parkPath1, parkBorderPaint);

    final parkPath2 = Path()
      ..moveTo(size.width * 0.05, size.height * 0.42)
      ..lineTo(size.width * 0.26, size.height * 0.44)
      ..lineTo(size.width * 0.2, size.height * 0.51)
      ..lineTo(size.width * 0.02, size.height * 0.49)
      ..close();
    canvas.drawPath(parkPath2, parkPaint);
    canvas.drawPath(parkPath2, parkBorderPaint);

    // 4. Curved River / Water Stream
    final riverPath = Path();
    riverPath.moveTo(0, size.height * 0.72);
    riverPath.cubicTo(size.width * 0.3, size.height * 0.75, size.width * 0.5, size.height * 0.68, size.width, size.height * 0.78);
    final riverPaint = Paint()
      ..color = const Color(0xFFBAE6FD)
      ..strokeWidth = 22
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawPath(riverPath, riverPaint);

    // 5. Road Network Grid (Road Outlines & Crisp Lines)
    final roadBorderPaint = Paint()
      ..color = const Color(0xFFCBD5E1)
      ..strokeWidth = 16
      ..style = PaintingStyle.stroke;

    final localRoadPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = 12
      ..style = PaintingStyle.stroke;

    final mainHighwayBorder = Paint()
      ..color = const Color(0xFFFCD34D)
      ..strokeWidth = 20
      ..style = PaintingStyle.stroke;
    final mainHighwayPaint = Paint()
      ..color = const Color(0xFFFEF08A)
      ..strokeWidth = 16
      ..style = PaintingStyle.stroke;

    final mainRoad1 = Path()
      ..moveTo(0, size.height * 0.35)
      ..cubicTo(size.width * 0.3, size.height * 0.33, size.width * 0.7, size.height * 0.37, size.width, size.height * 0.34);

    final mainRoad2 = Path()
      ..moveTo(0, size.height * 0.62)
      ..lineTo(size.width, size.height * 0.6);

    final vertRoad1 = Path()
      ..moveTo(size.width * 0.3, 0)
      ..cubicTo(size.width * 0.28, size.height * 0.4, size.width * 0.35, size.height * 0.7, size.width * 0.32, size.height);

    final vertRoad2 = Path()
      ..moveTo(size.width * 0.65, 0)
      ..lineTo(size.width * 0.65, size.height);

    canvas.drawPath(mainRoad1, roadBorderPaint); canvas.drawPath(mainRoad1, localRoadPaint);
    canvas.drawPath(mainRoad2, roadBorderPaint); canvas.drawPath(mainRoad2, localRoadPaint);
    canvas.drawPath(vertRoad1, roadBorderPaint); canvas.drawPath(vertRoad1, localRoadPaint);

    canvas.drawPath(vertRoad2, mainHighwayBorder);
    canvas.drawPath(vertRoad2, mainHighwayPaint);

    // 6. Labels
    _drawTextLabel(canvas, "AB ROAD", Offset(size.width * 0.67, size.height * 0.1), 10, const Color(0xFF92400E), isBold: true);
    _drawTextLabel(canvas, "Vijay Nagar Main Rd", Offset(size.width * 0.35, size.height * 0.32), 9, const Color(0xFF64748B));
    _drawTextLabel(canvas, "Scheme 54 Park", Offset(size.width * 0.38, size.height * 0.18), 8, const Color(0xFF047857));
    _drawTextLabel(canvas, "Khan River", Offset(size.width * 0.2, size.height * 0.74), 8, const Color(0xFF0284C7));

    // 7. Radar Search Waves around Center Location
    final center = Offset(size.width * 0.45, size.height * 0.35);

    for (int i = 0; i < 3; i++) {
      double p = (progress + (i * 0.33)) % 1.0;
      double radius = 25.0 + (p * 110.0);
      double opacity = ((1.0 - p) * 0.45).clamp(0.0, 0.45);

      final pulsePaint = Paint()
        ..color = AppColors.primary.withValues(alpha: opacity)
        ..style = PaintingStyle.fill;
      canvas.drawCircle(center, radius, pulsePaint);

      final pulseStroke = Paint()
        ..color = AppColors.primary.withValues(alpha: opacity * 1.2)
        ..strokeWidth = 2.0
        ..style = PaintingStyle.stroke;
      canvas.drawCircle(center, radius, pulseStroke);
    }

    // Glowing User Location Center Marker
    final shadowPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.2)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6);
    canvas.drawCircle(center + const Offset(0, 4), 22, shadowPaint);
    canvas.drawCircle(center, 22, Paint()..color = Colors.white);
    canvas.drawCircle(center, 16, Paint()..color = AppColors.primary);
    canvas.drawCircle(center, 6, Paint()..color = Colors.white);

    // 8. Dynamic Drivers Pins (Yellow/Amber Driver Markers with Pill Tag)
    final driverLocations = [
      Offset(size.width * 0.2, size.height * 0.2),
      Offset(size.width * 0.78, size.height * 0.24),
      Offset(size.width * 0.18, size.height * 0.54),
      Offset(size.width * 0.75, size.height * 0.52),
    ];

    for (var loc in driverLocations) {
      canvas.drawCircle(loc, 16, Paint()..color = const Color(0xFFF59E0B).withValues(alpha: 0.25));
      canvas.drawCircle(loc, 10, Paint()..color = const Color(0xFFF59E0B));
      canvas.drawCircle(loc, 4, Paint()..color = Colors.white);

      final pillRect = RRect.fromRectAndRadius(
        Rect.fromCenter(center: loc + const Offset(0, -22), width: 56, height: 18),
        const Radius.circular(9),
      );
      canvas.drawRRect(pillRect, Paint()..color = Colors.white);
      canvas.drawRRect(pillRect, Paint()..color = const Color(0xFFE2E8F0)..style = PaintingStyle.stroke..strokeWidth = 1);
      _drawTextLabel(canvas, "● 2 min", loc + const Offset(0, -22), 8, const Color(0xFFD97706), isBold: true);
    }
  }

  void _drawTextLabel(Canvas canvas, String text, Offset center, double fontSize, Color color, {bool isBold = false}) {
    final tp = TextPainter(
      text: TextSpan(
        text: text,
        style: TextStyle(
          color: color,
          fontSize: fontSize,
          fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
          letterSpacing: 0.3,
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    tp.layout();
    tp.paint(canvas, center - Offset(tp.width / 2, tp.height / 2));
  }

  @override
  bool shouldRepaint(covariant _RadarSearchMapPainter oldDelegate) => oldDelegate.progress != progress;
}

// ── Custom Painter: Active Route Map Canvas with Brand Logo Marker (Active Tracking)
class _ActiveRouteMapPainter extends CustomPainter {
  final String riderName;
  final String restaurantName;
  final String userAddress;
  final double? riderLat;
  final double? riderLng;
  final double? restLat;
  final double? restLng;
  final double? userLat;
  final double? userLng;
  final bool isRiderAssigned;

  _ActiveRouteMapPainter({
    required this.riderName,
    required this.restaurantName,
    required this.userAddress,
    this.riderLat,
    this.riderLng,
    this.restLat,
    this.restLng,
    this.userLat,
    this.userLng,
    this.isRiderAssigned = false,
  });

  String _cleanRestaurantName(dynamic rawName) {
    if (rawName == null) return 'Restaurant';
    final str = rawName.toString().trim();
    if (str.isEmpty) return 'Restaurant';
    if (str.contains('{en:')) {
      final match = RegExp(r'\{en:\s*([^}]+)\}').firstMatch(str);
      if (match != null) return match.group(1)?.trim() ?? str;
    }
    if (str.startsWith('{') && str.endsWith('}')) {
      try {
        final decoded = jsonDecode(str);
        if (decoded is Map && decoded.containsKey('en')) return decoded['en'].toString();
      } catch (_) {}
    }
    return str;
  }

  @override
  void paint(Canvas canvas, Size size) {
    // 1. Base Map Background
    final bgPaint = Paint()..color = const Color(0xFFF1F5F9);
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), bgPaint);

    // 2. City Buildings / Blocks
    final buildingPaint = Paint()..color = const Color(0xFFE2E8F0);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(15, 10, size.width * 0.38, 55), const Radius.circular(6)), buildingPaint);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(size.width * 0.45, 10, size.width * 0.5, 45), const Radius.circular(6)), buildingPaint);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(15, size.height * 0.55, size.width * 0.3, 65), const Radius.circular(6)), buildingPaint);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(size.width * 0.65, size.height * 0.55, size.width * 0.3, 65), const Radius.circular(6)), buildingPaint);

    // 3. Green Park Area
    final parkPaint = Paint()..color = const Color(0xFFD1FAE5);
    final parkPath = Path()
      ..moveTo(size.width * 0.48, size.height * 0.58)
      ..lineTo(size.width * 0.6, size.height * 0.58)
      ..lineTo(size.width * 0.58, size.height * 0.85)
      ..lineTo(size.width * 0.42, size.height * 0.85)
      ..close();
    canvas.drawPath(parkPath, parkPaint);

    // 4. River Curve
    final riverPath = Path();
    riverPath.moveTo(0, size.height * 0.82);
    riverPath.quadraticBezierTo(size.width * 0.5, size.height * 0.75, size.width, size.height * 0.9);
    canvas.drawPath(riverPath, Paint()..color = const Color(0xFFBAE6FD)..strokeWidth = 18..style = PaintingStyle.stroke);

    // 5. Road Network Grid
    final roadBorder = Paint()..color = const Color(0xFFCBD5E1)..strokeWidth = 14..style = PaintingStyle.stroke;
    final roadFill = Paint()..color = Colors.white..strokeWidth = 10..style = PaintingStyle.stroke;

    final road1 = Path()..moveTo(0, size.height * 0.38)..lineTo(size.width, size.height * 0.35);
    final road2 = Path()..moveTo(0, size.height * 0.75)..lineTo(size.width, size.height * 0.72);
    final vRoad1 = Path()..moveTo(size.width * 0.25, 0)..lineTo(size.width * 0.25, size.height);
    final vRoad2 = Path()..moveTo(size.width * 0.75, 0)..lineTo(size.width * 0.75, size.height);

    canvas.drawPath(road1, roadBorder); canvas.drawPath(road1, roadFill);
    canvas.drawPath(road2, roadBorder); canvas.drawPath(road2, roadFill);
    canvas.drawPath(vRoad1, roadBorder); canvas.drawPath(vRoad1, roadFill);
    canvas.drawPath(vRoad2, roadBorder); canvas.drawPath(vRoad2, roadFill);

    // Dynamic coordinates interpolation or default grid points
    final rLat = restLat ?? 22.7533;
    final rLng = restLng ?? 75.8937;
    final uLat = userLat ?? 22.7196;
    final uLng = userLng ?? 75.8577;
    final dLat = riderLat ?? rLat;
    final dLng = riderLng ?? rLng;

    double minLat = [rLat, uLat, dLat].reduce((a, b) => a < b ? a : b);
    double maxLat = [rLat, uLat, dLat].reduce((a, b) => a > b ? a : b);
    double minLng = [rLng, uLng, dLng].reduce((a, b) => a < b ? a : b);
    double maxLng = [rLng, uLng, dLng].reduce((a, b) => a > b ? a : b);

    if ((maxLat - minLat).abs() < 0.0001) maxLat += 0.01;
    if ((maxLng - minLng).abs() < 0.0001) maxLng += 0.01;

    double pad = 45.0;
    Offset toCanvas(double latVal, double lngVal) {
      double x = pad + ((lngVal - minLng) / (maxLng - minLng)) * (size.width - 2 * pad);
      double y = size.height - pad - ((latVal - minLat) / (maxLat - minLat)) * (size.height - 2 * pad);
      return Offset(x, y);
    }

    final storePos = restLat != null && restLng != null ? toCanvas(rLat, rLng) : Offset(size.width - 50, size.height * 0.22);
    final homePos = userLat != null && userLng != null ? toCanvas(uLat, uLng) : Offset(50, size.height * 0.75);
    final partnerPos = riderLat != null && riderLng != null ? toCanvas(dLat, dLng) : (storePos + homePos) / 2;

    // 6. Navigation Route Polyline (Restaurant -> Rider -> Customer)
    // Completed Leg (Store -> Rider)
    final pathStoreToRider = Path();
    pathStoreToRider.moveTo(storePos.dx, storePos.dy);
    final turn1 = Offset(storePos.dx, (storePos.dy + partnerPos.dy) / 2);
    pathStoreToRider.quadraticBezierTo(turn1.dx, turn1.dy, partnerPos.dx, partnerPos.dy);

    final completedLegPaint = Paint()
      ..color = const Color(0xFF10B981).withValues(alpha: 0.45)
      ..strokeWidth = 6
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    canvas.drawPath(pathStoreToRider, completedLegPaint);

    // Active Delivery Leg (Rider -> Home)
    final pathRiderToHome = Path();
    pathRiderToHome.moveTo(partnerPos.dx, partnerPos.dy);
    final turn2 = Offset((partnerPos.dx + homePos.dx) / 2, partnerPos.dy);
    pathRiderToHome.quadraticBezierTo(turn2.dx, turn2.dy, homePos.dx, homePos.dy);

    final routeGlow = Paint()
      ..color = const Color(0x663B82F6)
      ..strokeWidth = 12
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    canvas.drawPath(pathRiderToHome, routeGlow);

    final routeCore = Paint()
      ..color = const Color(0xFF2563EB)
      ..strokeWidth = 5.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    canvas.drawPath(pathRiderToHome, routeCore);

    // Waypoint dots
    final dotPaint = Paint()..color = Colors.white;
    canvas.drawCircle(homePos, 5, dotPaint);
    canvas.drawCircle(storePos, 5, dotPaint);

    // 7. Store Marker Badge (Top Right / Store Location)
    final cleanRestName = _cleanRestaurantName(restaurantName);
    final storeLabel = cleanRestName.isNotEmpty ? (cleanRestName.length > 14 ? '${cleanRestName.substring(0, 12)}...' : cleanRestName) : "Restaurant";
    _drawMarkerBadge(
      canvas,
      storePos,
      bgColor: const Color(0xFFEF4444),
      subLabel: storeLabel,
    );

    // 8. Customer Home Marker Badge (Bottom Left / Customer Location)
    final homeLabel = userAddress.isNotEmpty ? (userAddress.length > 14 ? '${userAddress.substring(0, 12)}...' : userAddress) : "Home";
    _drawMarkerBadge(
      canvas,
      homePos,
      bgColor: const Color(0xFF10B981),
      subLabel: homeLabel,
      isBottom: true,
    );

    // 9. Live Rider Location Ping Marker with Brand Logo Badge (at partnerPos)
    if (isRiderAssigned) {
      // Outer Pulse Rings at Rider Live Position
      canvas.drawCircle(partnerPos, 26, Paint()..color = AppColors.primary.withValues(alpha: 0.22));
      canvas.drawCircle(partnerPos, 19, Paint()..color = AppColors.primary.withValues(alpha: 0.38));
      canvas.drawCircle(partnerPos + const Offset(0, 3), 16, Paint()..color = Colors.black26..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4));

      // Brand Logo Marker Outer White Circle & Green Border
      canvas.drawCircle(partnerPos, 16, Paint()..color = Colors.white);
      canvas.drawCircle(partnerPos, 16, Paint()..color = AppColors.primary..style = PaintingStyle.stroke..strokeWidth = 3);

      // ECD Brand Logo Circle Core
      canvas.drawCircle(partnerPos, 9, Paint()..color = AppColors.primary);
      canvas.drawCircle(partnerPos, 4, Paint()..color = Colors.white);

      // Tooltip Banner above Rider Live Location
      final rDisplay = riderName.isNotEmpty ? riderName : "Rider";
      final bubbleText = "$rDisplay 🚴";

      final bubbleRect = RRect.fromRectAndRadius(
        Rect.fromCenter(center: partnerPos + const Offset(0, -30), width: 116, height: 24),
        const Radius.circular(12),
      );
      canvas.drawRRect(bubbleRect.shift(const Offset(0, 2)), Paint()..color = Colors.black26..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4));
      canvas.drawRRect(bubbleRect, Paint()..color = AppColors.primary);

      final arrowPath = Path()
        ..moveTo(partnerPos.dx - 5, partnerPos.dy - 18)
        ..lineTo(partnerPos.dx + 5, partnerPos.dy - 18)
        ..lineTo(partnerPos.dx, partnerPos.dy - 12)
        ..close();
      canvas.drawPath(arrowPath, Paint()..color = AppColors.primary);

      _drawTextLabel(canvas, bubbleText, partnerPos + const Offset(0, -30), 10, Colors.white, isBold: true);
    }
  }

  void _drawMarkerBadge(Canvas canvas, Offset pos, {required Color bgColor, required String subLabel, bool isBottom = false}) {
    canvas.drawCircle(pos + const Offset(0, 3), 16, Paint()..color = Colors.black26..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4));
    canvas.drawCircle(pos, 16, Paint()..color = Colors.white);
    canvas.drawCircle(pos, 13, Paint()..color = bgColor);

    final cardOffset = isBottom ? const Offset(0, -32) : const Offset(0, 26);
    final cardRect = RRect.fromRectAndRadius(
      Rect.fromCenter(center: pos + cardOffset, width: 104, height: 22),
      const Radius.circular(6),
    );
    canvas.drawRRect(cardRect.shift(const Offset(0, 2)), Paint()..color = Colors.black12..maskFilter = const MaskFilter.blur(BlurStyle.normal, 2));
    canvas.drawRRect(cardRect, Paint()..color = Colors.white);
    canvas.drawRRect(cardRect, Paint()..color = const Color(0xFFE2E8F0)..style = PaintingStyle.stroke..strokeWidth = 1);

    _drawTextLabel(canvas, subLabel, pos + cardOffset, 9, const Color(0xFF1F2937), isBold: true);
  }

  void _drawTextLabel(Canvas canvas, String text, Offset center, double fontSize, Color color, {bool isBold = false}) {
    final tp = TextPainter(
      text: TextSpan(
        text: text,
        style: TextStyle(
          color: color,
          fontSize: fontSize,
          fontWeight: isBold ? FontWeight.bold : FontWeight.w700,
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    tp.layout();
    tp.paint(canvas, center - Offset(tp.width / 2, tp.height / 2));
  }

  @override
  bool shouldRepaint(covariant _ActiveRouteMapPainter oldDelegate) {
    return oldDelegate.riderLat != riderLat ||
        oldDelegate.riderLng != riderLng ||
        oldDelegate.restLat != restLat ||
        oldDelegate.restLng != restLng ||
        oldDelegate.userLat != userLat ||
        oldDelegate.userLng != userLng ||
        oldDelegate.isRiderAssigned != isRiderAssigned ||
        oldDelegate.riderName != riderName;
  }
}

class _QrCodePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF1F2937)
      ..style = PaintingStyle.fill;

    double step = size.width / 8;

    // Corner Finder Patterns
    canvas.drawRect(Rect.fromLTWH(0, 0, step * 2.5, step * 2.5), paint);
    canvas.drawRect(Rect.fromLTWH(size.width - step * 2.5, 0, step * 2.5, step * 2.5), paint);
    canvas.drawRect(Rect.fromLTWH(0, size.height - step * 2.5, step * 2.5, step * 2.5), paint);

    // Inner White Square Cutouts
    final whitePaint = Paint()..color = Colors.white;
    canvas.drawRect(Rect.fromLTWH(step * 0.5, step * 0.5, step * 1.5, step * 1.5), whitePaint);
    canvas.drawRect(Rect.fromLTWH(size.width - step * 2.0, step * 0.5, step * 1.5, step * 1.5), whitePaint);
    canvas.drawRect(Rect.fromLTWH(step * 0.5, size.height - step * 2.0, step * 1.5, step * 1.5), whitePaint);

    // Inner Solid Centers
    canvas.drawRect(Rect.fromLTWH(step * 0.8, step * 0.8, step * 0.9, step * 0.9), paint);
    canvas.drawRect(Rect.fromLTWH(size.width - step * 1.7, step * 0.8, step * 0.9, step * 0.9), paint);
    canvas.drawRect(Rect.fromLTWH(step * 0.8, size.height - step * 1.7, step * 0.9, step * 0.9), paint);

    // Data Modules Matrix
    canvas.drawRect(Rect.fromLTWH(step * 3.5, step * 0.5, step * 1.2, step * 1.2), paint);
    canvas.drawRect(Rect.fromLTWH(step * 5.5, step * 1.5, step * 1.0, step * 1.0), paint);
    canvas.drawRect(Rect.fromLTWH(step * 0.5, step * 3.5, step * 1.2, step * 1.2), paint);
    canvas.drawRect(Rect.fromLTWH(step * 3.2, step * 3.2, step * 2.0, step * 2.0), paint);
    canvas.drawRect(Rect.fromLTWH(step * 6.0, step * 4.0, step * 1.2, step * 1.2), paint);
    canvas.drawRect(Rect.fromLTWH(step * 3.5, step * 6.0, step * 1.5, step * 1.5), paint);
    canvas.drawRect(Rect.fromLTWH(step * 5.8, step * 6.0, step * 1.5, step * 1.5), paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

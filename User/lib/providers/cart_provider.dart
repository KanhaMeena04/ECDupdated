import 'package:ecdkart_app/core/models/cart_item.dart';
import 'package:ecdkart_app/core/models/product.dart';
import 'package:flutter/foundation.dart';
import '../services/cart_api_service.dart';
import '../services/coupon_api_service.dart';
import '../services/order_api_service.dart';
import '../services/settings_api_service.dart';

class CartProvider with ChangeNotifier {
  List<CartItem> _items = [];
  bool _isLoading = false;

  // ── Active restaurant info ─────────────────────────────────────────────────
  String? _restaurantId;
  String? _restaurantName;
  String? _restaurantImageUrl;
  String? _restaurantAddress;
  int _restaurantDeliveryTimeMin = 25;

  // ── Order Type (Delivery / Pickup) & Slot Selection ────────────────────────
  String _orderType = 'delivery';
  String _pickupDate = '';
  String _pickupTimeSlot = 'ASAP (~15-20 mins prep time)';
  String? _pickupTime;
  String _paymentMethod = 'Cash on Delivery';

  String get orderType => _orderType;
  bool get isSelfPickup => _orderType == 'pickup' || _orderType == 'self_pickup';
  String get pickupDate => _pickupDate.isNotEmpty ? _pickupDate : PickupSlotHelper.getDynamicDates().first;
  String get pickupTimeSlot => _pickupTimeSlot;
  String? get pickupTime => _pickupTime ?? _pickupTimeSlot;
  String get paymentMethod => _paymentMethod;

  void setOrderType(String type) {
    _orderType = type;
    notifyListeners();
  }

  void setPickupTime(String? time) {
    if (time != null) _pickupTimeSlot = time;
    _pickupTime = time;
    notifyListeners();
  }

  void setPickupDetails({required String date, required String timeSlot}) {
    _pickupDate = date;
    _pickupTimeSlot = timeSlot;
    _pickupTime = timeSlot;
    _orderType = 'pickup';
    notifyListeners();
  }

  void setPaymentMethod(String method) {
    _paymentMethod = method;
    notifyListeners();
  }

  // ── Coupon state ───────────────────────────────────────────────────────────
  String? _orderNote;
  String? get orderNote => _orderNote;

  void setOrderNote(String? note) {
    _orderNote = note;
    notifyListeners();
  }

  Map<String, dynamic>? _appliedCoupon;
  double _discountAmount = 0.0;

  Map<String, dynamic>? get appliedCoupon => _appliedCoupon;
  double get discountAmount => _discountAmount;

  String? get restaurantId => _restaurantId;
  String? get restaurantName => _restaurantName;
  String? get restaurantImageUrl => _restaurantImageUrl;
  String? get restaurantAddress => _restaurantAddress;
  int get restaurantDeliveryTimeMin => _restaurantDeliveryTimeMin;
  void setRestaurantDeliveryTime(int mins) {
    _restaurantDeliveryTimeMin = mins;
    notifyListeners();
  }


  double _deliveryFee = 14.0;
  double _platformFee = 5.0;
  double _packagingFee = 10.0;
  double _gstPercent = 5.0;
  double _selectedTip = 0.0;
  List<double> _tipOptions = [5.0, 10.0, 20.0];

  bool _isDeliveryFeeEnabled = true;
  bool _isPlatformFeeEnabled = true;
  bool _isPackagingFeeEnabled = true;
  bool _isTaxEnabled = true;
  bool _isTipEnabled = true;

  double get deliveryFee => (isSelfPickup || !_isDeliveryFeeEnabled) ? 0.0 : _deliveryFee;
  double get platformFee => _isPlatformFeeEnabled ? _platformFee : 0.0;
  double get packagingFee => _isPackagingFeeEnabled ? _packagingFee : 0.0;
  double get gstAmount => _isTaxEnabled ? (totalAmount * (_gstPercent / 100)) : 0.0;
  double get tipAmount => _isTipEnabled ? _selectedTip : 0.0;
  List<double> get tipOptions => _tipOptions;
  bool get isTipEnabled => _isTipEnabled;
  bool get isPlatformFeeEnabled => _isPlatformFeeEnabled;
  bool get isPackagingFeeEnabled => _isPackagingFeeEnabled;
  bool get isTaxEnabled => _isTaxEnabled;
  bool get isDeliveryFeeEnabled => _isDeliveryFeeEnabled;
  double get selectedTip => _selectedTip;

  void setSelectedTip(double tip) {
    _selectedTip = tip;
    notifyListeners();
  }

  List<CartItem> get items => _items;
  bool get isLoading => _isLoading;

  int get itemCount => _items.fold(0, (sum, item) => sum + item.quantity);

  double get totalAmount =>
      _items.fold(0, (sum, item) => sum + item.totalPrice);

  static double safeNum(num? val) {
    if (val == null) return 0.0;
    final d = val.toDouble();
    if (d.isNaN || d.isInfinite) return 0.0;
    return d;
  }

  double get grandTotalRaw {
    final subtotal = safeNum(totalAmount);
    final delivery = safeNum(deliveryFee);
    final platform = safeNum(platformFee);
    final packaging = safeNum(packagingFee);
    final gst = safeNum(gstAmount);
    final tip = safeNum(tipAmount);
    final discount = safeNum(_discountAmount);

    double base = subtotal + delivery + platform + packaging + gst + tip;
    double res = base - discount;
    return safeNum(res < 0 ? 0.0 : res);
  }

  double get cashRoundOff => grandTotalRaw.roundToDouble() - grandTotalRaw;

  double get finalAmount => grandTotalRaw.roundToDouble();

  bool get isEmpty => _items.isEmpty;

  /// Fetch cart from backend
  Future<void> fetchCart() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      final cartData = await CartApiService.getCart();
      if (cartData != null && cartData['items'] != null) {
        final List<dynamic> itemsList = cartData['items'];
        _items = itemsList.map((item) {
          final productData = item['productId'];
          return CartItem(
            product: Product(
              id: productData['_id']?.toString() ?? productData['id']?.toString() ?? '',
              name: productData['name']?.toString() ?? 'Unknown Item',
              description: productData['description']?.toString() ?? '',
              price: (productData['price'] as num?)?.toDouble() ?? 0.0,
              image: productData['image']?.toString() ?? '',
              category: productData['category']?.toString() ?? '',
              rating: (productData['rating'] as num?)?.toDouble() ?? 4.0,
              isVeg: productData['isVeg'] == true,
            ),
            quantity: item['quantity'] ?? 1,
            imageUrl: productData['image']?.toString() ?? '',
          );
        }).toList();
        
        debugPrint('Cart synced with backend: ${_items.length} items');
        
        // Sync restaurantId from first product's store field if available
        if (_items.isNotEmpty && itemsList.first['productId'] != null) {
          final storeId = itemsList.first['productId']['store'];
          if (storeId != null) {
            _restaurantId = storeId.toString();
            debugPrint('Synced RestaurantId from cart: $_restaurantId');
          }
        }
      }
    } catch (e) {
      debugPrint('Error syncing cart: $e');
    } finally {
      await fetchDynamicSettings();
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Fetch dynamic pricing, platform fee, packaging fee, tax, and tip config from Admin Settings API
  Future<void> fetchDynamicSettings() async {
    try {
      final settings = await SettingsApiService.fetchSettings();
      if (settings != null) {
        if (settings['platformFeeConfig'] != null) {
          final p = settings['platformFeeConfig'];
          _isPlatformFeeEnabled = p['enabled'] != false;
          _platformFee = _isPlatformFeeEnabled ? ((p['fee'] as num?)?.toDouble() ?? 5.0) : 0.0;
        }
        if (settings['packagingFeeConfig'] != null) {
          final pk = settings['packagingFeeConfig'];
          _isPackagingFeeEnabled = pk['enabled'] != false;
          _packagingFee = _isPackagingFeeEnabled ? ((pk['globalPackagingFee'] as num?)?.toDouble() ?? 10.0) : 0.0;
        }
        if (settings['deliveryFeeConfig'] != null) {
          final d = settings['deliveryFeeConfig'];
          _isDeliveryFeeEnabled = d['enabled'] != false;
          if (!_isDeliveryFeeEnabled) {
            _deliveryFee = 0.0;
          } else if (d['baseFee'] != null) {
            _deliveryFee = (d['baseFee'] as num).toDouble();
          }
        }
        if (settings['tipConfig'] != null) {
          final t = settings['tipConfig'];
          _isTipEnabled = t['enabled'] != false;
          if (t['options'] != null && t['options'] is List) {
            _tipOptions = (t['options'] as List).map((e) => (e as num).toDouble()).toList();
          }
        }
        if (settings['taxConfig'] != null) {
          final tx = settings['taxConfig'];
          _isTaxEnabled = tx['enabled'] != false;
          _gstPercent = _isTaxEnabled ? ((tx['gstPercent'] as num?)?.toDouble() ?? 5.0) : 0.0;
        }
      }
    } catch (e) {
      debugPrint("Error fetching dynamic cart settings: $e");
    } finally {
      notifyListeners();
    }
  }

  // ── Check if adding from a different restaurant ────────────────────────────
  bool isFromDifferentRestaurant(String restaurantId) {
    return _items.isNotEmpty && _restaurantId != restaurantId;
  }

  // ── Add item (with restaurant context) ────────────────────────────────────
  void addItem(
    Product product, {
    required String restaurantId,
    required String restaurantName,
    required String restaurantImageUrl,
    String? restaurantAddress,
    int deliveryTimeMin = 25,
    String imageUrl = '',
  }) async {
    _restaurantId = restaurantId;
    _restaurantName = restaurantName;
    _restaurantImageUrl = restaurantImageUrl;
    if (restaurantAddress != null) _restaurantAddress = restaurantAddress;
    if (deliveryTimeMin > 0) {
      _restaurantDeliveryTimeMin = deliveryTimeMin;
    }

    final existingIndex =
        _items.indexWhere((item) => item.product.id == product.id);

    if (existingIndex >= 0) {
      _items[existingIndex].quantity++;
      notifyListeners();
      await CartApiService.updateCart(product.id, _items[existingIndex].quantity);
    } else {
      _items.add(CartItem(
        product: product,
        imageUrl: imageUrl,
      ));
      notifyListeners();
      await CartApiService.addToCart(product.id, 1);
    }
  }

  void switchRestaurantAndAdd(
    Product product, {
    required String restaurantId,
    required String restaurantName,
    required String restaurantImageUrl,
    String? restaurantAddress,
    int deliveryTimeMin = 25,
    String imageUrl = '',
  }) async {
    _items.clear();
    
    _restaurantId = restaurantId;
    _restaurantName = restaurantName;
    _restaurantImageUrl = restaurantImageUrl;
    if (restaurantAddress != null) _restaurantAddress = restaurantAddress;
    if (deliveryTimeMin > 0) {
      _restaurantDeliveryTimeMin = deliveryTimeMin;
    }
    
    _items.add(CartItem(product: product, imageUrl: imageUrl));
    notifyListeners();

    await CartApiService.clearCart();
    await CartApiService.addToCart(product.id, 1);
  }

  void removeItem(String productId) async {
    _items.removeWhere((item) => item.product.id == productId);
    if (_items.isEmpty) _clearRestaurantInfo();
    notifyListeners();

    await CartApiService.removeFromCart(productId);
  }

  void updateQuantity(String productId, int quantity) async {
    final index = _items.indexWhere((item) => item.product.id == productId);
    if (index >= 0) {
      if (quantity > 0) {
        _items[index].quantity = quantity;
        notifyListeners();
        await CartApiService.updateCart(productId, quantity);
      } else {
        _items.removeAt(index);
        if (_items.isEmpty) _clearRestaurantInfo();
        notifyListeners();
        await CartApiService.removeFromCart(productId);
      }
    }
  }

  void clear() async {
    _items.clear();
    _clearRestaurantInfo();
    resetSchedule();
    notifyListeners();
    
    await CartApiService.clearCart();
  }

  void resetSchedule() {
    _orderType = 'delivery';
    _pickupDate = PickupSlotHelper.getDynamicDates().first;
    _pickupTimeSlot = 'ASAP (~15-20 mins prep time)';
    _pickupTime = null;
    notifyListeners();
  }

  void _clearRestaurantInfo() {
    _restaurantId = null;
    _restaurantName = null;
    _restaurantImageUrl = null;
    _restaurantAddress = null;
    _restaurantDeliveryTimeMin = 25;
    _orderType = 'delivery';
    _pickupDate = PickupSlotHelper.getDynamicDates().first;
    _pickupTimeSlot = 'ASAP (~15-20 mins prep time)';
    _pickupTime = null;
    removeCoupon();
  }

  // ── Coupon Methods ─────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> applyCoupon(String code) async {
    if (_restaurantId == null) {
       return {'success': false, 'message': 'Cannot apply coupon to empty cart'};
    }

    try {
      final result = await CouponApiService.applyCoupon(
        code: code,
        storeId: _restaurantId!,
        orderAmount: totalAmount,
      );
      
      if (result != null && result['valid'] == true) {
        _appliedCoupon = result['coupon'];
        _discountAmount = (result['discountAmount'] as num).toDouble();
        notifyListeners();
        return {'success': true, 'message': result['message'] ?? 'Coupon applied successfully!'};
      }
      return {'success': false, 'message': result?['message'] ?? 'Failed to apply coupon'};
    } catch (e) {
      return {'success': false, 'message': 'Error applying coupon'};
    }
  }

  void removeCoupon() {
    _appliedCoupon = null;
    _discountAmount = 0.0;
    notifyListeners();
  }

  // ── Delivery Fee ──────────────────────────────────────────────────────────
  Future<void> calculateDeliveryFee(double lat, double lng) async {
    if (_restaurantId == null) return;
    
    try {
      final result = await OrderApiService.calculateDeliveryFee(_restaurantId!, lat, lng);
      if (result != null && result['success'] == true) {
        // Backend returns deliveryCharge
        _deliveryFee = (result['deliveryCharge'] as num?)?.toDouble() ?? 40.0;
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error fetching dynamic delivery fee: $e');
    }
  }
}

class PickupSlotHelper {
  static const List<String> months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  static const List<String> days = [
    'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
  ];

  static String formatDate(DateTime dt) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final target = DateTime(dt.year, dt.month, dt.day);
    final diffDays = target.difference(today).inDays;

    final monthStr = months[dt.month - 1];
    final dayName = days[dt.weekday % 7];

    if (diffDays == 0) {
      return 'Today, $monthStr ${dt.day}';
    } else if (diffDays == 1) {
      return 'Tomorrow, $monthStr ${dt.day}';
    } else {
      return '$dayName, $monthStr ${dt.day}';
    }
  }

  static List<String> getDynamicDates() {
    final List<String> dates = [];
    final now = DateTime.now();

    for (int i = 0; i < 7; i++) {
      final d = now.add(Duration(days: i));
      dates.add(formatDate(d));
    }
    return dates;
  }

  static List<String> get30MinTimeSlots(String selectedDate) {
    final List<String> slots = ['ASAP (~15-20 mins prep time)'];
    final now = DateTime.now();
    final isToday = selectedDate.startsWith('Today');

    // 8:00 AM (480 mins) to 12:30 AM (1470 mins)
    for (int minutes = 8 * 60; minutes < 24.5 * 60; minutes += 30) {
      int startHour = (minutes ~/ 60) % 24;
      int startMin = minutes % 60;

      int endMinutes = minutes + 30;
      int endHour = (endMinutes ~/ 60) % 24;
      int endMin = endMinutes % 60;

      // Filter past time slots if date is Today
      if (isToday) {
        int currentMinutes = now.hour * 60 + now.minute + 15; // 15 mins prep buffer
        if (endMinutes <= currentMinutes) {
          continue;
        }
      }

      String formatTime(int hour, int min) {
        String period = (hour >= 12 && hour < 24) ? 'PM' : 'AM';
        int displayHour = hour % 12;
        if (displayHour == 0) displayHour = 12;
        String minStr = min.toString().padLeft(2, '0');
        return '$displayHour:$minStr $period';
      }

      String startStr = formatTime(startHour, startMin);
      String endStr = formatTime(endHour, endMin);
      slots.add('$startStr - $endStr');
    }

    return slots;
  }
}


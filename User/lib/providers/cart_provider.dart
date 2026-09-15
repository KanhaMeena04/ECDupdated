import 'package:ecdkart_app/core/models/cart_item.dart';
import 'package:ecdkart_app/core/models/product.dart';
import 'package:flutter/foundation.dart';
import '../services/cart_api_service.dart';
import '../services/coupon_api_service.dart';
import '../services/order_api_service.dart';

class CartProvider with ChangeNotifier {
  List<CartItem> _items = [];
  bool _isLoading = false;

  // ── Active restaurant info ─────────────────────────────────────────────────
  String? _restaurantId;
  String? _restaurantName;
  String? _restaurantImageUrl;

  // ── Order Type (Delivery / Pickup) & Slot Selection ────────────────────────
  String _orderType = 'delivery';
  String _pickupDate = 'Today, Sep 14';
  String _pickupTimeSlot = '9:30 AM - 9:45 AM';
  String? _pickupTime;
  String _paymentMethod = 'Cash on Delivery';

  String get orderType => _orderType;
  String get pickupDate => _pickupDate;
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

  double _deliveryFee = 14.0;
  double _platformFee = 6.0;
  double _packagingFee = 10.0;

  double get deliveryFee => _orderType == 'pickup' ? 0.0 : _deliveryFee;
  double get platformFee => _platformFee;
  double get packagingFee => _packagingFee;

  List<CartItem> get items => _items;
  bool get isLoading => _isLoading;

  int get itemCount => _items.fold(0, (sum, item) => sum + item.quantity);

  double get totalAmount =>
      _items.fold(0, (sum, item) => sum + item.totalPrice);

  double get gstAmount => totalAmount * 0.05;

  double get grandTotalRaw {
    double base = totalAmount + deliveryFee + platformFee + packagingFee + gstAmount;
    return (base - _discountAmount) < 0 ? 0 : (base - _discountAmount);
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
      _isLoading = false;
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
    String imageUrl = '',
  }) async {
    _restaurantId = restaurantId;
    _restaurantName = restaurantName;
    _restaurantImageUrl = restaurantImageUrl;

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
    String imageUrl = '',
  }) async {
    _items.clear();
    
    _restaurantId = restaurantId;
    _restaurantName = restaurantName;
    _restaurantImageUrl = restaurantImageUrl;
    
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
    notifyListeners();
    
    await CartApiService.clearCart();
  }

  void _clearRestaurantInfo() {
    _restaurantId = null;
    _restaurantName = null;
    _restaurantImageUrl = null;
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

import 'package:flutter/material.dart';
import '../services/order_api_service.dart';

class OrderProvider with ChangeNotifier {
  Map<String, List<dynamic>> _groupedOrders = {
    'active': [],
    'past': [],
    'cancelled': [],
  };
  bool _isLoading = false;
  String? _error;

  List<dynamic> get activeOrders => _groupedOrders['active'] ?? [];
  List<dynamic> get pastOrders => _groupedOrders['past'] ?? [];
  List<dynamic> get cancelledOrders => _groupedOrders['cancelled'] ?? [];
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchOrders() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await OrderApiService.getMyOrders();
      
      final newActive = List<dynamic>.from(result['active'] ?? []);
      final newPast = List<dynamic>.from(result['past'] ?? []);
      final newCancelled = List<dynamic>.from(result['cancelled'] ?? []);

      _groupedOrders = {
        'active': newActive,
        'past': newPast,
        'cancelled': newCancelled,
      };
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void updateOrderStatusOptimistically(String orderId, String newStatus) {
    bool found = false;
    for (int i = 0; i < _groupedOrders['active']!.length; i++) {
      if (_groupedOrders['active']![i]['_id'] == orderId) {
        var order = Map<String, dynamic>.from(_groupedOrders['active']![i]);
        order['status'] = newStatus;
        
        if (newStatus.toLowerCase() == 'cancelled' || newStatus.toLowerCase() == 'delivered') {
          _groupedOrders['active']!.removeAt(i);
          if (newStatus.toLowerCase() == 'cancelled') {
            _groupedOrders['cancelled']!.insert(0, order);
          } else {
            _groupedOrders['past']!.insert(0, order);
          }
        } else {
          _groupedOrders['active']![i] = order;
        }
        
        found = true;
        break;
      }
    }
    if (found) notifyListeners();
  }

  Future<Map<String, dynamic>> cancelOrder(String orderId, String reason) async {
    final result = await OrderApiService.cancelOrder(orderId, reason);
    if (result['success'] == true) {
      await fetchOrders();
    }
    return result;
  }

  Future<bool> failOrder(String orderId, String reason) async {
    final success = await OrderApiService.failOrder(orderId, reason);
    if (success) {
      await fetchOrders();
    }
    return success;
  }

  Future<Map<String, dynamic>> placeOrder(Map<String, dynamic> orderData) async {
    _isLoading = true;
    notifyListeners();

    final result = await OrderApiService.placeOrder(orderData);
    _isLoading = false;
    notifyListeners();
    
    // Backend returns orderId directly on success
    if (result != null && (result['success'] == true || result['orderId'] != null || result['order'] != null)) {
      await fetchOrders();
      return {
        'success': true, 
        'message': 'Order placed successfully',
        'orderId': result['orderId'] ?? result['order']?['id'],
        'razorpayOrderId': result['razorpayOrderId'] ?? result['order']?['razorpayOrderId'],
      };
    }
    return {'success': false, 'message': result?['message'] ?? 'Failed to place order'};
  }

  Future<bool> verifyPayment(Map<String, dynamic> data) async {
    _isLoading = true;
    notifyListeners();
    final success = await OrderApiService.verifyPayment(data);
    if (success) {
      await fetchOrders();
    }
    _isLoading = false;
    notifyListeners();
    return success;
  }
}

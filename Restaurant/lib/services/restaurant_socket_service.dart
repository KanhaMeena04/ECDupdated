import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../api_constants.dart';

class RestaurantSocketService {
  static IO.Socket? _socket;
  static bool _isInitialized = false;
  static String _currentRestaurantId = '';
  static final List<Function(dynamic)> _newOrderListeners = [];

  static String get _baseUrl {
    final url = ApiConstants.baseUrl;
    return url.replaceAll(RegExp(r'/api(/v1)?/?$'), '');
  }

  static Future<void> init(String restaurantId, String token) async {
    if (restaurantId.isEmpty) return;
    _currentRestaurantId = restaurantId;

    if (_isInitialized && _socket?.connected == true) {
      _joinRoom();
      return;
    }

    try {
      _socket = IO.io(
        _baseUrl,
        IO.OptionBuilder()
            .disableAutoConnect()
            .setTransports(['websocket', 'polling'])
            .setAuth({'token': token})
            .setExtraHeaders({'Authorization': 'Bearer $token'})
            .enableReconnection()
            .setReconnectionAttempts(5)
            .setReconnectionDelay(3000)
            .build(),
      );

      _socket?.onConnect((_) {
        debugPrint('[RestaurantSocket] Connected to WebSocket');
        _joinRoom();
      });

      _socket?.onDisconnect((_) {
        debugPrint('[RestaurantSocket] Disconnected from WebSocket');
      });

      _socket?.onConnectError((err) {
        debugPrint('[RestaurantSocket] Connect Error: $err');
      });

      _socket?.on('newOrder', (data) => _notifyListeners(data));
      _socket?.on('order:new', (data) => _notifyListeners(data));
      _socket?.on('restaurant:new_order', (data) => _notifyListeners(data));

      _socket?.connect();
      _isInitialized = true;
    } catch (e) {
      debugPrint('[RestaurantSocket] Init Error: $e');
    }
  }

  static void _joinRoom() {
    if (_currentRestaurantId.isNotEmpty && _socket?.connected == true) {
      _socket?.emit('joinOrder', 'restaurant_$_currentRestaurantId');
      _socket?.emit('joinRoom', 'restaurant_$_currentRestaurantId');
      debugPrint('[RestaurantSocket] Joined room: restaurant_$_currentRestaurantId');
    }
  }

  static void _notifyListeners(dynamic data) {
    debugPrint('[RestaurantSocket] New order event received: $data');
    final listenersCopy = List<Function(dynamic)>.from(_newOrderListeners);
    for (var listener in listenersCopy) {
      listener(data);
    }
  }

  static void onNewOrder(Function(dynamic) callback) {
    if (!_newOrderListeners.contains(callback)) {
      _newOrderListeners.add(callback);
    }
  }

  static void offNewOrder(Function(dynamic) callback) {
    _newOrderListeners.remove(callback);
  }

  static void dispose() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _isInitialized = false;
    _newOrderListeners.clear();
  }
}

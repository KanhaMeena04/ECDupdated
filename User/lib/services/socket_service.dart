import '../core/constants/app_constants.dart';
import '../core/config/app_mode.dart';
import 'dart:io';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../services/auth_service.dart';
class SocketService {
  static IO.Socket? _socket;
  static bool _isInitialized = false;

  static String get _baseUrl {
    final url = AppConstants.baseUrl;
    return url.replaceAll(RegExp(r'/api(/v1)?/?$'), '');
  }

  static Future<void> init() async {
    if (_isInitialized) return;
    if (kFrontendPreviewMode) {
      _isInitialized = true;
      debugPrint('[PreviewMode] SocketService initialized (No Socket Connection)');
      return;
    }

    String? token = await AuthService.getToken();

    try {
      _socket = IO.io(
        _baseUrl,
        IO.OptionBuilder()
            .disableAutoConnect()
            .setTransports(['websocket', 'polling'])
            .setAuth({'token': token ?? ''})
            .setExtraHeaders({'Authorization': 'Bearer ${token ?? ''}'})
            .enableReconnection()
            .setReconnectionAttempts(3)
            .setReconnectionDelay(5000)
            .build(),
      );

      _socket?.onConnect((_) {
        debugPrint('Connected to WebSocket');
        for (final orderId in _joinedOrders) {
          _socket?.emit('joinOrder', orderId);
        }
      });

      _socket?.onDisconnect((_) {
        debugPrint('Disconnected from WebSocket');
      });

      _socket?.onConnectError((err) {
        debugPrint('WebSocket Connect Notice: Server unavailable or offline.');
      });

      _socket?.onError((err) {
        debugPrint('WebSocket Notice: $err');
      });

      _socket?.connect();
      _isInitialized = true;
    } catch (e) {
      debugPrint('WebSocket init warning: $e');
    }
  }

  static final Set<String> _joinedOrders = {};

  static Future<void> joinOrder(String orderId) async {
    if (!_isInitialized) await init();
    _joinedOrders.add(orderId);
    if (_socket?.connected == true) {
      _socket?.emit('joinOrder', orderId);
    }
  }

  static void leaveOrder(String orderId) {
    _joinedOrders.remove(orderId);
    _socket?.emit('leaveOrder', orderId);
  }

  static final List<Function(dynamic)> _listeners = [];

  static Future<void> onOrderStatusUpdated(Function(dynamic) callback) async {
    if (!_isInitialized) await init();
    
    // Only register the native socket listener once
    if (_listeners.isEmpty) {
      _socket?.on('orderStatusUpdated', (data) {
        final currentListeners = List<Function(dynamic)>.from(_listeners);
        for (var listener in currentListeners) {
          listener(data);
        }
      });
    }
    
    _listeners.add(callback);
  }

  static void offOrderStatusUpdated(Function(dynamic)? callback) {
    if (callback != null) {
      _listeners.remove(callback);
    } else {
      _listeners.clear();
    }
    
    if (_listeners.isEmpty) {
      _socket?.off('orderStatusUpdated');
    }
  }

  static final List<Function(dynamic)> _restaurantListeners = [];

  static Future<void> onRestaurantStatusUpdated(Function(dynamic) callback) async {
    if (!_isInitialized) await init();
    
    if (_restaurantListeners.isEmpty) {
      _socket?.on('restaurantStatusUpdated', (data) {
        final currentListeners = List<Function(dynamic)>.from(_restaurantListeners);
        for (var listener in currentListeners) {
          listener(data);
        }
      });
    }
    
    _restaurantListeners.add(callback);
  }

  static void offRestaurantStatusUpdated(Function(dynamic)? callback) {
    if (callback != null) {
      _restaurantListeners.remove(callback);
    } else {
      _restaurantListeners.clear();
    }
    
    if (_restaurantListeners.isEmpty) {
      _socket?.off('restaurantStatusUpdated');
    }
  }

  static void dispose() {
    _socket?.disconnect();
    _socket?.dispose();
    _isInitialized = false;
  }
}

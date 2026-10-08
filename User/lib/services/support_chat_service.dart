import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/app_constants.dart';
import '../core/config/app_mode.dart';
import 'auth_service.dart';
import 'socket_service.dart';

class SupportChatService {
  static String get baseUrl => '${AppConstants.baseUrl}/support';
  static const String _guestKey = 'guest_support_uuid';

  /// Get or create a persistent guest ID for guest user chats
  static Future<String> getGuestId() async {
    final prefs = await SharedPreferences.getInstance();
    String? gid = prefs.getString(_guestKey);
    if (gid == null || gid.isEmpty) {
      gid = 'guest_${DateTime.now().millisecondsSinceEpoch}_${1000 + (DateTime.now().microsecond % 9000)}';
      await prefs.setString(_guestKey, gid);
    }
    return gid;
  }

  static Future<Map<String, String>> _getHeaders() async {
    final token = await AuthService.getToken();
    final guestId = await getGuestId();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-guest-id': guestId,
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  /// Fetch chat messages and conversation metadata
  static Future<Map<String, dynamic>> getChatMessages({String? orderId}) async {
    if (kFrontendPreviewMode) {
      return {
        'success': true,
        'messages': [],
        'conversation': null,
      };
    }
    try {
      final guestId = await getGuestId();
      final uri = Uri.parse('$baseUrl/chat/messages').replace(
        queryParameters: {
          'guestId': guestId,
          if (orderId != null && orderId.isNotEmpty) 'orderId': orderId,
        },
      );

      final response = await http
          .get(uri, headers: await _getHeaders())
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'messages': data['messages'] ?? [],
          'conversation': data['conversation'],
        };
      }
      return {
        'success': false,
        'message': 'Failed to load support chat (${response.statusCode})',
      };
    } catch (e) {
      debugPrint('SupportChatService.getChatMessages error: $e');
      return {'success': false, 'message': e.toString()};
    }
  }

  /// Send user message to Support
  static Future<Map<String, dynamic>> sendMessage({
    required String message,
    String? orderId,
    String? userName,
    String? userPhone,
  }) async {
    if (kFrontendPreviewMode) {
      return {
        'success': true,
        'message': {
          'sender': 'user',
          'message': message,
          'createdAt': DateTime.now().toIso8601String(),
        },
      };
    }
    try {
      final guestId = await getGuestId();
      final body = {
        'message': message,
        'guestId': guestId,
        if (orderId != null && orderId.isNotEmpty) 'orderId': orderId,
        if (userName != null && userName.isNotEmpty) 'userName': userName,
        if (userPhone != null && userPhone.isNotEmpty) 'userPhone': userPhone,
      };

      final response = await http
          .post(
            Uri.parse('$baseUrl/chat/send'),
            headers: await _getHeaders(),
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'message': data['message'],
          'conversation': data['conversation'],
        };
      }
      return {
        'success': false,
        'message': 'Failed to send message (${response.statusCode})',
      };
    } catch (e) {
      debugPrint('SupportChatService.sendMessage error: $e');
      return {'success': false, 'message': e.toString()};
    }
  }

  /// Join support room via Socket.IO
  static void joinConversation(String conversationId) {
    if (conversationId.isNotEmpty) {
      SocketService.emit('support:join', conversationId);
    }
  }

  /// Leave support room via Socket.IO
  static void leaveConversation(String conversationId) {
    if (conversationId.isNotEmpty) {
      SocketService.emit('support:leave', conversationId);
    }
  }

  /// Listen for real-time admin replies
  static void onAdminReply(Function(dynamic) callback) {
    SocketService.on('support:admin_reply', callback);
    SocketService.on('support:message', callback);
  }

  /// Unregister admin reply listener
  static void offAdminReply([Function(dynamic)? callback]) {
    SocketService.off('support:admin_reply', callback);
    SocketService.off('support:message', callback);
  }
}

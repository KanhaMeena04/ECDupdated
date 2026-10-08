import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../services/socket_service.dart';
import '../../services/support_chat_service.dart';
import '../../services/user_api_service.dart';

class ContactSupportPage extends StatefulWidget {
  final String? orderId;
  const ContactSupportPage({super.key, this.orderId});

  @override
  State<ContactSupportPage> createState() => _ContactSupportPageState();
}

class _ContactSupportPageState extends State<ContactSupportPage> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();

  List<Map<String, dynamic>> _messages = [];
  bool _isLoading = true;
  bool _isSending = false;
  String? _conversationId;
  Timer? _pollingTimer;
  String? _currentUserName;
  String? _currentUserPhone;

  @override
  void initState() {
    super.initState();
    _initChat();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _messageController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    if (_conversationId != null) {
      SupportChatService.leaveConversation(_conversationId!);
    }
    SupportChatService.offAdminReply();
    super.dispose();
  }

  Future<void> _initChat() async {
    // 1. Fetch user profile if available for name and phone
    try {
      final profileData = await UserApiService.getProfile();
      if (profileData != null && profileData['user'] != null) {
        final u = profileData['user'];
        _currentUserName = u['name']?.toString();
        _currentUserPhone = (u['mobile'] ?? u['phone'])?.toString();
      }
    } catch (_) {}

    // 2. Initial fetch of conversation messages
    await _fetchMessages(initial: true);

    // 3. Connect to Socket.IO & listen for real-time replies
    try {
      await SocketService.init();
      SupportChatService.onAdminReply((data) {
        if (!mounted) return;
        _handleIncomingSocketMessage(data);
      });
    } catch (e) {
      debugPrint('Socket init warning in ContactSupport: $e');
    }

    // 4. Polling fallback engine every 3.5 seconds
    _pollingTimer = Timer.periodic(const Duration(milliseconds: 3500), (_) {
      if (mounted) {
        _fetchMessages(silent: true);
      }
    });
  }

  /// Handle incoming real-time socket message
  void _handleIncomingSocketMessage(dynamic data) {
    if (data == null) return;
    try {
      Map<String, dynamic>? msg;
      if (data is Map && data['message'] is Map) {
        msg = Map<String, dynamic>.from(data['message']);
      } else if (data is Map && data['sender'] != null) {
        msg = Map<String, dynamic>.from(data);
      }

      if (msg != null) {
        final text = (msg['message'] ?? msg['text'] ?? '').toString();
        final sender = (msg['sender'] ?? 'admin').toString();
        final id = msg['_id']?.toString() ?? '${DateTime.now().millisecondsSinceEpoch}';

        // Check if message already exists
        final alreadyExists = _messages.any((m) => m['id'] == id || (m['text'] == text && m['sender'] == sender));
        if (!alreadyExists && text.isNotEmpty) {
          setState(() {
            _messages.add({
              'id': id,
              'sender': sender,
              'isUser': sender == 'user',
              'isSystem': sender == 'system',
              'text': text,
              'time': _formatTimestamp(msg['createdAt']),
            });
          });
          _scrollToBottom();
        }
      }
    } catch (e) {
      debugPrint('Error handling incoming socket message: $e');
    }
  }

  /// Fetch messages from backend API
  Future<void> _fetchMessages({bool initial = false, bool silent = false}) async {
    if (initial && mounted) {
      setState(() => _isLoading = true);
    }

    try {
      final res = await SupportChatService.getChatMessages(orderId: widget.orderId);

      if (res['success'] == true && mounted) {
        final conv = res['conversation'];
        if (conv != null && conv['_id'] != null) {
          final newConvId = conv['_id'].toString();
          if (_conversationId != newConvId) {
            _conversationId = newConvId;
            SupportChatService.joinConversation(newConvId);
          }
        }

        final rawMsgs = res['messages'];
        if (rawMsgs is List) {
          final parsed = rawMsgs.map<Map<String, dynamic>>((m) {
            final sender = (m['sender'] ?? 'admin').toString();
            final isUser = sender == 'user';
            final isSystem = sender == 'system';
            return {
              'id': m['_id']?.toString() ?? '',
              'sender': sender,
              'isUser': isUser,
              'isSystem': isSystem,
              'text': (m['message'] ?? m['text'] ?? '').toString(),
              'time': _formatTimestamp(m['createdAt']),
            };
          }).toList();

          final bool hasNewMessages = parsed.length > _messages.length;

          setState(() {
            _messages = parsed;
            _isLoading = false;
          });

          if (initial || hasNewMessages) {
            _scrollToBottom();
          }
        }
      } else if (initial && mounted) {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      debugPrint('Error fetching chat messages: $e');
      if (initial && mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  /// Send user message to Support
  Future<void> _sendMessage([String? quickText]) async {
    final text = (quickText ?? _messageController.text).trim();
    if (text.isEmpty || _isSending) return;

    if (quickText == null) {
      _messageController.clear();
    }

    final String tempId = 'temp_${DateTime.now().millisecondsSinceEpoch}';
    final String nowTime = _formatTimestamp(DateTime.now().toIso8601String());

    // Optimistic UI update
    setState(() {
      _isSending = true;
      _messages.add({
        'id': tempId,
        'sender': 'user',
        'isUser': true,
        'isSystem': false,
        'text': text,
        'time': nowTime,
        'pending': true,
      });
    });

    _scrollToBottom();

    try {
      final res = await SupportChatService.sendMessage(
        message: text,
        orderId: widget.orderId,
        userName: _currentUserName,
        userPhone: _currentUserPhone,
      );

      if (res['success'] == true && mounted) {
        final conv = res['conversation'];
        if (conv != null && conv['_id'] != null) {
          _conversationId = conv['_id'].toString();
          SupportChatService.joinConversation(_conversationId!);
        }

        final savedMsg = res['message'];
        setState(() {
          _isSending = false;
          final idx = _messages.indexWhere((m) => m['id'] == tempId);
          if (idx != -1 && savedMsg != null) {
            _messages[idx] = {
              'id': savedMsg['_id']?.toString() ?? tempId,
              'sender': 'user',
              'isUser': true,
              'isSystem': false,
              'text': text,
              'time': _formatTimestamp(savedMsg['createdAt']),
              'pending': false,
            };
          }
        });
      } else if (mounted) {
        setState(() {
          _isSending = false;
          final idx = _messages.indexWhere((m) => m['id'] == tempId);
          if (idx != -1) {
            _messages[idx]['failed'] = true;
          }
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res['message'] ?? 'Failed to send message'),
            backgroundColor: Colors.redAccent,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSending = false;
          final idx = _messages.indexWhere((m) => m['id'] == tempId);
          if (idx != -1) _messages[idx]['failed'] = true;
        });
      }
    }

    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent + 80,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  String _formatTimestamp(dynamic dateStr) {
    if (dateStr == null) return '';
    try {
      final d = DateTime.parse(dateStr.toString()).toLocal();
      final hour = d.hour > 12 ? d.hour - 12 : (d.hour == 0 ? 12 : d.hour);
      final minute = d.minute.toString().padLeft(2, '0');
      final period = d.hour >= 12 ? 'PM' : 'AM';
      return '$hour:$minute $period';
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF1F2937)),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          children: [
            const Text(
              'Contact Support',
              style: TextStyle(
                color: Color(0xFF1F2937),
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 2),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    color: Color(0xFF10B981),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 4),
                const Text(
                  'Online Support Agent',
                  style: TextStyle(
                    color: Color(0xFF10B981),
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ],
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Optional Order context banner
            if (widget.orderId != null && widget.orderId!.isNotEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: const BoxDecoration(
                  color: Color(0xFFF0FDF4),
                  border: Border(bottom: BorderSide(color: Color(0xFFDCFCE7))),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.receipt_long_rounded, size: 16, color: Color(0xFF16A34A)),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'Support for Order #${widget.orderId!.substring(widget.orderId!.length > 6 ? widget.orderId!.length - 6 : 0).toUpperCase()}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF15803D),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            // Chat Messages Stream
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF248C70)),
                      ),
                    )
                  : SingleChildScrollView(
                      controller: _scrollController,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: Column(
                        children: [
                          const SizedBox(height: 8),
                          // Date separator chip
                          Center(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF3F4F6),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Text(
                                'Today',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF6B7280),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Render list of messages
                          if (_messages.isEmpty)
                            _buildWelcomeBubble()
                          else
                            ..._messages.map((msg) => _buildChatBubble(msg)),

                          if (_isSending)
                            _buildTypingIndicator(),

                          const SizedBox(height: 12),
                        ],
                      ),
                    ),
            ),

            // Quick Query Suggestions Chips
            _buildQuickReplies(),

            // Bottom Message Input Box (Matches User Screenshot)
            Container(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: Color(0xFFF3F4F6))),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        border: Border.all(color: const Color(0xFF10B981), width: 1.5),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: TextField(
                        controller: _messageController,
                        focusNode: _focusNode,
                        textCapitalization: TextCapitalization.sentences,
                        onSubmitted: (_) => _sendMessage(),
                        style: const TextStyle(
                          fontSize: 14,
                          color: Color(0xFF1F2937),
                          fontWeight: FontWeight.w500,
                        ),
                        decoration: const InputDecoration(
                          hintText: 'Type Message...',
                          hintStyle: TextStyle(color: Color(0xFF9CA3AF), fontSize: 13),
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding: EdgeInsets.symmetric(vertical: 10),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () => _sendMessage(),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      child: const Icon(
                        Icons.navigation_rounded,
                        color: Color(0xFFEF4444),
                        size: 26,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Default Welcome Bubble
  Widget _buildWelcomeBubble() {
    return _buildChatBubble({
      'isUser': false,
      'isSystem': true,
      'text': 'Thanks for contacting ECDKart Support! Our agent will assist you shortly.',
      'time': _formatTimestamp(DateTime.now().toIso8601String()),
    });
  }

  /// Quick Suggestion Chips
  Widget _buildQuickReplies() {
    final suggestions = [
      'I have an issue with coupons',
      'Where is my order?',
      'Delay in delivery',
      'Refund status',
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Row(
        children: suggestions.map((text) {
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ActionChip(
              label: Text(text),
              labelStyle: const TextStyle(
                fontSize: 11,
                color: Color(0xFF374151),
                fontWeight: FontWeight.w600,
              ),
              backgroundColor: const Color(0xFFF3F4F6),
              elevation: 0,
              side: BorderSide.none,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              onPressed: () => _sendMessage(text),
            ),
          );
        }).toList(),
      ),
    );
  }

  /// Chat Bubble (Exact Match with Screenshot)
  Widget _buildChatBubble(Map<String, dynamic> msg) {
    final bool isUser = msg['isUser'] == true;
    final bool isSystem = msg['isSystem'] == true;
    final String text = msg['text'] ?? '';
    final String time = msg['time'] ?? '';
    final bool pending = msg['pending'] == true;
    final bool failed = msg['failed'] == true;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.78,
            ),
            decoration: BoxDecoration(
              color: isUser
                  ? const Color(0xFF1F2937) // Dark navy/black for user
                  : (isSystem ? const Color(0xFFF3F4F6) : const Color(0xFFE5E7EB)), // Light grey for admin/system
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(16),
                topRight: const Radius.circular(16),
                bottomLeft: Radius.circular(isUser ? 16 : 4),
                bottomRight: Radius.circular(isUser ? 4 : 16),
              ),
            ),
            child: Column(
              crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                if (!isUser) ...[
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isSystem ? Icons.info_outline_rounded : Icons.support_agent_rounded,
                        size: 13,
                        color: const Color(0xFF248C70),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        isSystem ? 'ECDKart System' : 'ECDKart Support',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF248C70),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                ],
                Text(
                  text,
                  style: TextStyle(
                    fontSize: 13,
                    color: isUser ? Colors.white : const Color(0xFF1F2937),
                    fontWeight: FontWeight.w500,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
          if (time.isNotEmpty || pending || failed) ...[
            const SizedBox(height: 4),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (failed)
                    const Text(
                      'Failed to send  ',
                      style: TextStyle(fontSize: 10, color: Colors.red, fontWeight: FontWeight.bold),
                    ),
                  if (pending)
                    const Text(
                      'Sending...  ',
                      style: TextStyle(fontSize: 10, color: Color(0xFF9CA3AF)),
                    ),
                  if (time.isNotEmpty)
                    Text(
                      time,
                      style: const TextStyle(
                        fontSize: 10,
                        color: Color(0xFF9CA3AF),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  /// Typing indicator bubble
  Widget _buildTypingIndicator() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: const BoxDecoration(
              color: Color(0xFFE5E7EB),
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
                bottomLeft: Radius.circular(4),
                bottomRight: Radius.circular(16),
              ),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 12,
                  height: 12,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF6B7280)),
                  ),
                ),
                SizedBox(width: 8),
                Text(
                  'Delivering message...',
                  style: TextStyle(
                    fontSize: 11,
                    color: Color(0xFF4B5563),
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

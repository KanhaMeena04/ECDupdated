import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import '../../../core/constants/api_constansts.dart';
import '../../../data/services/auth_service.dart';

class RiderSupportChatScreen extends StatefulWidget {
  const RiderSupportChatScreen({super.key});

  @override
  State<RiderSupportChatScreen> createState() => _RiderSupportChatScreenState();
}

class _RiderSupportChatScreenState extends State<RiderSupportChatScreen> {
  final TextEditingController _msgController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();

  List<Map<String, dynamic>> _messages = [];
  bool _isLoading = true;
  bool _isSending = false;
  Timer? _pollTimer;
  String? _conversationId;

  @override
  void initState() {
    super.initState();
    _fetchMessages(initial: true);
    // Poll fallback every 3.5s for live real-time updates
    _pollTimer = Timer.periodic(const Duration(milliseconds: 3500), (_) {
      if (mounted) _fetchMessages(silent: true);
    });
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _msgController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<Map<String, String>> _getHeaders() async {
    final token = await AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  String get _supportBaseUrl {
    final base = ApiConstants.baseUrl.replaceAll(RegExp(r'/api(/v1)?/?$'), '');
    return '$base/api/support';
  }

  Future<void> _fetchMessages({bool initial = false, bool silent = false}) async {
    if (initial && mounted) {
      setState(() => _isLoading = true);
    }
    try {
      final uri = Uri.parse('$_supportBaseUrl/chat/messages');
      final headers = await _getHeaders();
      final res = await http.get(uri, headers: headers).timeout(const Duration(seconds: 12));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true) {
          final List rawMsgs = data['messages'] ?? [];
          final conv = data['conversation'];
          if (conv != null && conv['_id'] != null) {
            _conversationId = conv['_id'].toString();
          }

          final mapped = rawMsgs.map((m) {
            return {
              'id': m['_id']?.toString() ?? '${DateTime.now().millisecondsSinceEpoch}',
              'sender': m['sender'] ?? 'user',
              'senderName': m['senderName'] ?? (m['sender'] == 'admin' ? 'Support' : 'You'),
              'message': m['message'] ?? '',
              'createdAt': m['createdAt'] != null ? DateTime.tryParse(m['createdAt']) : DateTime.now(),
            };
          }).toList();

          if (mounted) {
            final prevCount = _messages.length;
            setState(() {
              _messages = List<Map<String, dynamic>>.from(mapped);
              _isLoading = false;
            });
            if (_messages.length > prevCount) {
              _scrollToBottom();
            }
          }
          return;
        }
      }
    } catch (e) {
      debugPrint('Rider support fetch error: $e');
    } finally {
      if (initial && mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _sendMessage([String? quickText]) async {
    final text = (quickText ?? _msgController.text).trim();
    if (text.isEmpty || _isSending) return;

    if (quickText == null) {
      _msgController.clear();
    }
    setState(() => _isSending = true);

    // Optimistic UI update
    final tempMsg = {
      'id': 'temp_${DateTime.now().millisecondsSinceEpoch}',
      'sender': 'user',
      'senderName': 'You',
      'message': text,
      'createdAt': DateTime.now(),
    };
    setState(() {
      _messages.add(tempMsg);
    });
    _scrollToBottom();

    try {
      final uri = Uri.parse('$_supportBaseUrl/chat/send');
      final headers = await _getHeaders();
      final body = jsonEncode({
        'message': text,
        'userType': 'rider',
      });

      final res = await http.post(uri, headers: headers, body: body).timeout(const Duration(seconds: 12));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true) {
          _fetchMessages(silent: true);
        }
      }
    } catch (e) {
      debugPrint('Rider support send error: $e');
    } finally {
      if (mounted) {
        setState(() => _isSending = false);
      }
    }
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1E293B),
        elevation: 0.5,
        titleSpacing: 0,
        title: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: const Color(0xFF248C70).withOpacity(0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.two_wheeler_rounded, color: Color(0xFF248C70), size: 22),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Rider Support Desk',
                  style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                ),
                Row(
                  children: [
                    Container(width: 7, height: 7, decoration: const BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle)),
                    const SizedBox(width: 5),
                    Text(
                      'Live 24/7 Agent Desk',
                      style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w500, color: const Color(0xFF10B981)),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Messages stream
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF248C70)))
                : _messages.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: const Color(0xFF248C70).withOpacity(0.08),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.support_agent_rounded, color: Color(0xFF248C70), size: 36),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Rider Partner Support',
                              style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF334155)),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Live route, pickup, and cash settlement assistance',
                              style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final msg = _messages[index];
                          final sender = msg['sender'] ?? 'user';
                          final isUser = sender == 'user';
                          final isSystem = sender == 'system';
                          final text = (msg['message'] ?? '').toString();
                          final dt = msg['createdAt'] as DateTime?;
                          final timeStr = dt != null
                              ? '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}'
                              : '';

                          if (isSystem) {
                            return Center(
                              child: Container(
                                margin: const EdgeInsets.symmetric(vertical: 8),
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade200,
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Text(
                                  text,
                                  style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey.shade700, fontWeight: FontWeight.w500),
                                  textAlign: TextAlign.center,
                                ),
                              ),
                            );
                          }

                          return Align(
                            alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
                              child: Column(
                                crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                    decoration: BoxDecoration(
                                      color: isUser ? const Color(0xFF248C70) : Colors.white,
                                      borderRadius: BorderRadius.only(
                                        topLeft: const Radius.circular(16),
                                        topRight: const Radius.circular(16),
                                        bottomLeft: Radius.circular(isUser ? 16 : 4),
                                        bottomRight: Radius.circular(isUser ? 4 : 16),
                                      ),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withOpacity(0.04),
                                          blurRadius: 6,
                                          offset: const Offset(0, 2),
                                        ),
                                      ],
                                      border: isUser ? null : Border.all(color: Colors.grey.shade200),
                                    ),
                                    child: Text(
                                      text,
                                      style: GoogleFonts.poppins(
                                        fontSize: 13,
                                        color: isUser ? Colors.white : const Color(0xFF1E293B),
                                        height: 1.4,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 3),
                                  Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 4),
                                    child: Text(
                                      '${isUser ? 'You' : 'Admin Support'} • $timeStr',
                                      style: GoogleFonts.poppins(fontSize: 10, color: const Color(0xFF94A3B8)),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),

          // Quick Replies
          Container(
            height: 38,
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                _buildQuickChip('Store closed / Not preparing'),
                _buildQuickChip('Customer unreachable'),
                _buildQuickChip('Cash collected issue'),
                _buildQuickChip('Wallet withdrawal inquiry'),
              ],
            ),
          ),

          // Input field
          Container(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -3),
                ),
              ],
            ),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: TextField(
                        controller: _msgController,
                        focusNode: _focusNode,
                        textInputAction: TextInputAction.send,
                        onSubmitted: (_) => _sendMessage(),
                        style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF1E293B)),
                        decoration: InputDecoration(
                          hintText: 'Type message for Support...',
                          hintStyle: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF94A3B8)),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  InkWell(
                    onTap: _isSending ? null : () => _sendMessage(),
                    borderRadius: BorderRadius.circular(24),
                    child: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFF248C70),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF248C70).withOpacity(0.35),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Center(
                        child: _isSending
                            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickChip(String text) {
    return Padding(
      padding: const EdgeInsets.only(right: 6, top: 4, bottom: 4),
      child: ActionChip(
        label: Text(text, style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF475569), fontWeight: FontWeight.w600)),
        backgroundColor: const Color(0xFFF1F5F9),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide.none),
        onPressed: () => _sendMessage(text),
        visualDensity: VisualDensity.compact,
      ),
    );
  }
}

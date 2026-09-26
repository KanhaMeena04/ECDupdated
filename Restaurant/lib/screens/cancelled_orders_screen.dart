import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../api_constants.dart';
import '../models/order_model.dart';
import '../theme/app_colors.dart';
import 'order_details_screen.dart';

class CancelledOrdersScreen extends StatefulWidget {
  const CancelledOrdersScreen({super.key});

  @override
  State<CancelledOrdersScreen> createState() => _CancelledOrdersScreenState();
}

class _CancelledOrdersScreenState extends State<CancelledOrdersScreen> {
  String _selectedTypeFilter = 'All'; // 'All', 'Pickup', 'Delivery'
  List<Order> _cancelledOrders = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _fetchCancelledOrders();
  }

  Future<void> _fetchCancelledOrders() async {
    setState(() => _isLoading = true);
    final prefs = await SharedPreferences.getInstance();
    var restId = ApiConstants.restaurantId.isNotEmpty ? ApiConstants.restaurantId : (prefs.getString('restaurantId') ?? '');
    final phone = prefs.getString('userPhone') ?? '8305370330';
    if (restId.isEmpty) restId = phone;
    final token = prefs.getString('token') ?? '';

    if (restId.isEmpty) {
      if (mounted) setState(() => _isLoading = false);
      return;
    }

    try {
      final ordersUrl = '${ApiConstants.baseUrl}/orders/restaurant/$restId';
      final res = await http.get(
        Uri.parse(ordersUrl),
        headers: {
          'Content-Type': 'application/json',
          if (token.isNotEmpty) 'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        List<dynamic> rawOrders = [];
        if (data is List) rawOrders = data;
        else if (data['orders'] is List) rawOrders = data['orders'];

        final List<Order> parsedList = [];
        for (var o in rawOrders) {
          final ord = Order.fromJson(o);
          if (ord.status.toLowerCase() == 'cancelled' || ord.status.toLowerCase() == 'failed') {
            parsedList.add(ord);
          }
        }

        if (mounted) {
          setState(() {
            _cancelledOrders = parsedList;
            _isLoading = false;
          });
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  double get _totalRefundedAmount {
    return _cancelledOrders.fold(0.0, (sum, order) => sum + order.totalAmount);
  }

  @override
  Widget build(BuildContext context) {
    final filteredList = _cancelledOrders.where((o) {
      if (_selectedTypeFilter == 'All') return true;
      if (_selectedTypeFilter == 'Pickup') return o.isSelfPickup;
      if (_selectedTypeFilter == 'Delivery') return !o.isSelfPickup;
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: Text(
          'Cancelled Orders',
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.bold,
            fontSize: 20,
            color: Colors.black87,
          ),
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          // Revenue/Refund Summary Header Banner
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.redAccent.withValues(alpha: 0.3), width: 1.2),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.cancel_outlined, color: Colors.redAccent, size: 18),
                        const SizedBox(width: 6),
                        Text(
                          'Total Cancelled Orders',
                          style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[700]),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${_cancelledOrders.length} Orders Refunded',
                      style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('Total Refunded', style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[600])),
                    Text(
                      '₹${_totalRefundedAmount.toStringAsFixed(2)}',
                      style: GoogleFonts.poppins(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.redAccent,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Filter Segmented Buttons (All / Self Pickup / Delivery)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                _buildTypeFilterChip('All', _cancelledOrders.length),
                const SizedBox(width: 8),
                _buildTypeFilterChip('Pickup', _cancelledOrders.where((o) => o.isSelfPickup).length),
                const SizedBox(width: 8),
                _buildTypeFilterChip('Delivery', _cancelledOrders.where((o) => !o.isSelfPickup).length),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Cancelled Orders List
          Expanded(
            child: filteredList.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.remove_shopping_cart_outlined, size: 54, color: Colors.grey[400]),
                        const SizedBox(height: 12),
                        Text(
                          'No cancelled orders found',
                          style: GoogleFonts.poppins(color: Colors.grey[600], fontSize: 14),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: filteredList.length,
                    itemBuilder: (context, index) {
                      final order = filteredList[index];
                      return _buildCancelledCard(order);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypeFilterChip(String type, int count) {
    final isSelected = _selectedTypeFilter == type;
    return ChoiceChip(
      label: Text(
        '$type ($count)',
        style: GoogleFonts.poppins(
          fontSize: 12,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          color: isSelected ? Colors.white : Colors.black87,
        ),
      ),
      selected: isSelected,
      selectedColor: Colors.redAccent,
      backgroundColor: Colors.grey[200],
      onSelected: (val) {
        if (val) setState(() => _selectedTypeFilter = type);
      },
    );
  }

  Widget _buildCancelledCard(Order order) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.redAccent.withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => OrderDetailsScreen(order: order)),
          );
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Row: Order ID, Type Badge & Refund Badge
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Text('#${order.id}', style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.black87)),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: order.isSelfPickup ? Colors.orange.withValues(alpha: 0.15) : AppColors.primaryGreen.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          order.isSelfPickup ? 'SELF PICKUP' : 'DELIVERY',
                          style: GoogleFonts.poppins(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: order.isSelfPickup ? Colors.orange[800] : AppColors.primaryGreen,
                          ),
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: Colors.redAccent.withValues(alpha: 0.3)),
                    ),
                    child: Text(
                      'CANCELLED',
                      style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.redAccent),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 10),
              Text('Customer: ${order.customerName}', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.black87)),
              Text(order.orderName, maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600])),
              
              const Divider(height: 20),

              // Reason Callout
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7ED),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, color: Colors.orange, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Reason: ${order.cancellationReason ?? 'Cancelled within window'}',
                        style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w500, color: Colors.orange[900]),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // Bottom Amount & Refund Status
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.check_circle_outline, color: AppColors.primaryGreen, size: 16),
                      const SizedBox(width: 4),
                      Text('Full Refund Processed', style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.primaryGreen)),
                    ],
                  ),
                  Text('₹${order.totalAmount.toStringAsFixed(2)}', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

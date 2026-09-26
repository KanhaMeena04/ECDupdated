import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../api_constants.dart';
import '../theme/app_colors.dart';

class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  State<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen> {
  bool _isLoading = false;
  Map<String, List<dynamic>> _groupedOrders = {};

  @override
  void initState() {
    super.initState();
    _fetchLiveHistory();
  }

  Future<void> _fetchLiveHistory() async {
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
        if (data is List) {
          rawOrders = data;
        } else if (data['orders'] is List) {
          rawOrders = data['orders'];
        }

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        final Map<String, List<dynamic>> grouped = {};

        for (var o in rawOrders) {
          final status = (o['status'] ?? '').toString();
          final deliveryStatus = (o['deliveryStatus'] ?? '').toString();
          final isDelivered = status.toLowerCase() == 'delivered' || deliveryStatus.toLowerCase() == 'delivered';
          if (!isDelivered) continue;

          DateTime orderDate = DateTime.now();
          if (o['createdAt'] != null) {
            orderDate = DateTime.tryParse(o['createdAt'].toString()) ?? DateTime.now();
          }
          final key = '${months[orderDate.month - 1]} ${orderDate.year}';

          if (!grouped.containsKey(key)) {
            grouped[key] = [];
          }

          final cName = (o['customer'] != null && o['customer'] is Map && o['customer']['name'] != null)
              ? o['customer']['name'].toString()
              : 'Customer';

          final amount = double.tryParse((o['payableAmount'] ?? o['totalAmount'] ?? 0).toString()) ?? 0.0;
          final itemsList = (o['items'] is List) ? (o['items'] as List) : [];

          grouped[key]!.add({
            'id': o['orderNumber']?.toString() ?? o['_id']?.toString().substring(0, 6) ?? 'N/A',
            'customerName': cName,
            'totalAmount': amount,
            'status': 'Delivered',
            'createdAt': orderDate.toIso8601String(),
            'items': itemsList.map((it) {
              final iName = (it is Map) ? (it['name']?.toString() ?? (it['product'] is Map ? it['product']['name']?.toString() : 'Item') ?? 'Item') : 'Item';
              final iQty = (it is Map) ? (int.tryParse((it['qty'] ?? it['quantity'] ?? 1).toString()) ?? 1) : 1;
              final iPrice = (it is Map) ? (double.tryParse((it['price'] ?? 0).toString()) ?? 0.0) : 0.0;
              return {'name': iName, 'quantity': iQty, 'price': iPrice};
            }).toList(),
          });
        }

        if (mounted) {
          setState(() {
            _groupedOrders = grouped;
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAF9),
      appBar: AppBar(
        title: Text('Order History', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
        : _groupedOrders.isEmpty 
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.history_toggle_off_rounded, size: 54, color: AppColors.primaryGreen),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'No past orders yet',
                      style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Completed and delivered customer orders will be archived here automatically.',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(fontSize: 13, color: Colors.grey[600]),
                    ),
                  ],
                ),
              ),
            )
          : RefreshIndicator(
              color: AppColors.primaryGreen,
              onRefresh: _fetchLiveHistory,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: _groupedOrders.entries.map((e) {
                  return _buildMonthSection(e.key, e.value.map((o) {
                    return _buildOrderCard(o);
                  }).toList());
                }).toList(),
              ),
            ),
    );
  }

  Widget _buildMonthSection(String month, List<Widget> orders) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          month,
          style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
        ),
        const SizedBox(height: 10),
        ...orders,
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildOrderCard(Map<String, dynamic> o) {
    final List items = o['items'] ?? [];

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: Color(0xFFEEEEEE), width: 1.2),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("Order #${o['id']}", style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 15)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.green.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    o['status'] ?? 'Delivered',
                    style: GoogleFonts.poppins(color: Colors.green[700], fontWeight: FontWeight.bold, fontSize: 11),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text("Customer: ${o['customerName']}", style: GoogleFonts.poppins(color: Colors.grey[600], fontSize: 12)),
            const Divider(height: 20, color: Color(0xFFEEEEEE)),
            ...items.map((i) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text("${i['quantity']}x ${i['name']}", style: GoogleFonts.poppins(fontSize: 13, color: Colors.black87)),
                  Text("₹${(i['price'] * i['quantity']).toStringAsFixed(0)}", style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w500)),
                ],
              ),
            )),
            const Divider(height: 20, color: Color(0xFFEEEEEE)),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("Total Amount", style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 14)),
                Text("₹${(o['totalAmount'] as num).toStringAsFixed(2)}", style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primaryGreen)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

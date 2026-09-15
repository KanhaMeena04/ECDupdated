import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../api_constants.dart';

class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  State<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen> {
  bool _isLoading = true;
  Map<String, List<dynamic>> _groupedOrders = {};

  @override
  void initState() {
    super.initState();
    _fetchHistory();
  }

  Future<void> _fetchHistory() async {
    try {
      final response = await http.get(
        Uri.parse(ApiConstants.getOrderHistory(ApiConstants.restaurantId)),
        headers: {
          'Authorization': 'Bearer ${ApiConstants.authToken}',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List orders = data['orders'] ?? [];
        
        // Group by month
        final Map<String, List<dynamic>> grouped = {};
        for (var o in orders) {
          final dt = DateTime.parse(o['createdAt']);
          final monthStr = _getMonthYear(dt);
          if (!grouped.containsKey(monthStr)) {
            grouped[monthStr] = [];
          }
          grouped[monthStr]!.add(o);
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
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _getMonthYear(DateTime dt) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return "${months[dt.month - 1]} ${dt.year}";
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Order History', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF248C70),
        foregroundColor: Colors.white,
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: const Color(0xFF248C70)))
        : _groupedOrders.isEmpty 
          ? const Center(child: Text("No order history found."))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: _groupedOrders.entries.map((e) {
                return _buildMonthSection(e.key, e.value.map((o) {
                  return _buildOrderCard(o);
                }).toList());
              }).toList(),
            ),
    );
  }

  Widget _buildMonthSection(String month, List<Widget> orders) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          month,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF248C70)),
        ),
        const SizedBox(height: 8),
        ...orders,
        const SizedBox(height: 16),
      ],
    );
  }

  String _formatDateTime(String? dateStr) {
    if (dateStr == null) return 'Unknown Date';
    try {
      final dt = DateTime.parse(dateStr).toLocal();
      final months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      final hour = dt.hour == 0 ? 12 : (dt.hour > 12 ? dt.hour - 12 : dt.hour);
      final amPm = dt.hour >= 12 ? "PM" : "AM";
      final minute = dt.minute.toString().padLeft(2, '0');
      return "${dt.day} ${months[dt.month - 1]} ${dt.year}, $hour:$minute $amPm";
    } catch (e) {
      return 'Unknown Date';
    }
  }

  Widget _buildOrderCard(dynamic order) {
    final String id = order['orderNumber'] ?? 'N/A';
    final String status = (order['deliveryStatus'] ?? order['status'] ?? 'Unknown').toUpperCase();
    final double earnings = (order['restaurantEarnings'] ?? 0).toDouble();
    final String date = _formatDateTime(order['createdAt']);
    
    final customer = order['customer'];
    final String customerName = customer != null ? (customer['name'] ?? 'Unknown') : 'Unknown Customer';
    final String customerPhone = customer != null ? (customer['phone'] ?? '') : '';

    final driver = order['assignedDriver'];
    final String driverName = driver != null ? (driver['name'] ?? 'Unknown') : 'No Rider Assigned';
    final String driverPhone = driver != null ? (driver['phone'] ?? '') : '';

    final List items = order['items'] ?? [];

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Date & Status
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(date, style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: status == 'DELIVERED' ? Colors.green[50] : Colors.orange[50],
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    status, 
                    style: TextStyle(
                      color: status == 'DELIVERED' ? Colors.green[700] : Colors.orange[700], 
                      fontSize: 12, 
                      fontWeight: FontWeight.bold
                    )
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Order ID
            Text('Order $id', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const Divider(height: 24),
            
            // Customer Info
            Row(
              children: [
                const Icon(Icons.person_outline, size: 20, color: Colors.grey),
                const SizedBox(width: 8),
                Expanded(child: Text(customerName, style: const TextStyle(fontWeight: FontWeight.w500))),
                if (customerPhone.isNotEmpty) 
                  Text(customerPhone, style: TextStyle(color: Colors.grey[600], fontSize: 13)),
              ],
            ),
            const SizedBox(height: 8),
            
            // Rider Info
            if (driver != null)
              Row(
                children: [
                  const Icon(Icons.delivery_dining, size: 20, color: Colors.grey),
                  const SizedBox(width: 8),
                  Expanded(child: Text(driverName, style: const TextStyle(fontWeight: FontWeight.w500))),
                  if (driverPhone.isNotEmpty)
                    Text(driverPhone, style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                ],
              ),
            if (driver != null) const SizedBox(height: 12),
            
            // Items
            if (items.isNotEmpty)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: items.map<Widget>((item) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Row(
                        children: [
                          Text('${item['qty']}x', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF248C70))),
                          const SizedBox(width: 8),
                          Expanded(child: Text(item['name'] ?? 'Item', style: const TextStyle(fontSize: 14))),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
            if (items.isNotEmpty) const SizedBox(height: 16),
            
            // Earnings
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Restaurant Earnings', style: TextStyle(fontWeight: FontWeight.w500)),
                Text('â‚¹${earnings.toStringAsFixed(2)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF248C70))),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

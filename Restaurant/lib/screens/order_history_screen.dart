import 'package:flutter/material.dart';

class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  State<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen> {
  final bool _isLoading = false;
  Map<String, List<dynamic>> _groupedOrders = {};

  @override
  void initState() {
    super.initState();
    _loadInitialMockHistory();
  }

  void _loadInitialMockHistory() {
    _groupedOrders = {
      'Sep 2026': [
        {
          'id': '1089',
          'customerName': 'Vikram Malhotra',
          'totalAmount': 540,
          'status': 'Delivered',
          'createdAt': '2026-09-14T14:30:00.000Z',
          'items': [
            {'name': 'Paneer Tikka', 'quantity': 2, 'price': 220},
            {'name': 'Tandoori Roti', 'quantity': 5, 'price': 20},
          ]
        },
        {
          'id': '1074',
          'customerName': 'Sneha Gupta',
          'totalAmount': 320,
          'status': 'Delivered',
          'createdAt': '2026-09-12T20:15:00.000Z',
          'items': [
            {'name': 'Veg Thali', 'quantity': 1, 'price': 320},
          ]
        },
      ],
      'Aug 2026': [
        {
          'id': '0982',
          'customerName': 'Animesh Roy',
          'totalAmount': 890,
          'status': 'Delivered',
          'createdAt': '2026-08-28T19:45:00.000Z',
          'items': [
            {'name': 'Kadai Paneer', 'quantity': 2, 'price': 260},
            {'name': 'Garlic Naan', 'quantity': 4, 'price': 50},
            {'name': 'Jeera Rice', 'quantity': 1, 'price': 170},
          ]
        }
      ]
    };
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
        ? const Center(child: CircularProgressIndicator(color: Color(0xFF248C70)))
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
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF248C70)),
        ),
        const SizedBox(height: 8),
        ...orders,
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildOrderCard(Map<String, dynamic> o) {
    final List items = o['items'] ?? [];

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("Order #${o['id']}", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.green.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    o['status'] ?? 'Delivered',
                    style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text("Customer: ${o['customerName']}", style: const TextStyle(color: Colors.grey, fontSize: 13)),
            const Divider(height: 16),
            ...items.map((i) => Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("${i['quantity']}x ${i['name']}"),
                Text("₹${i['price'] * i['quantity']}"),
              ],
            )),
            const Divider(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text("Total Amount", style: TextStyle(fontWeight: FontWeight.bold)),
                Text("₹${o['totalAmount']}", style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF248C70))),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

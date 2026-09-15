import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class RestaurantWalletScreen extends StatefulWidget {
  const RestaurantWalletScreen({Key? key}) : super(key: key);

  @override
  State<RestaurantWalletScreen> createState() => _RestaurantWalletScreenState();
}

class _RestaurantWalletScreenState extends State<RestaurantWalletScreen> {
  final bool _isLoading = false;
  final double _availableBalance = 12450.00;
  final double _totalEarnings = 48900.00;
  final double _totalCommissionPaid = 4890.00;
  List<dynamic> _transactions = [];

  @override
  void initState() {
    super.initState();
    _loadInitialMockWallet();
  }

  void _loadInitialMockWallet() {
    _transactions = [
      {
        'id': 'TXN_9841',
        'type': 'payout',
        'amount': 5000.0,
        'status': 'completed',
        'createdAt': '2026-09-12T10:00:00.000Z',
        'description': 'Weekly Payout to HDFC Bank **** 4819'
      },
      {
        'id': 'TXN_9810',
        'type': 'credit',
        'amount': 640.0,
        'status': 'completed',
        'createdAt': '2026-09-14T15:30:00.000Z',
        'description': 'Order #1001 Payment Received'
      },
      {
        'id': 'TXN_9799',
        'type': 'commission',
        'amount': 64.0,
        'status': 'completed',
        'createdAt': '2026-09-14T15:30:00.000Z',
        'description': 'Platform Fee (10%) for Order #1001'
      },
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.offWhiteBg,
      appBar: AppBar(
        title: const Text('Restaurant Wallet & Payouts', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: AppTheme.primaryGreen,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Balance Card with Primary Green & Accent Gradient
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppTheme.primaryGreen, AppTheme.accentOrange],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: const [
                        BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Available for Payout', style: TextStyle(color: Colors.white70, fontSize: 14)),
                        const SizedBox(height: 6),
                        Text(
                          '₹${_availableBalance.toStringAsFixed(2)}',
                          style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Payout request of ₹12,450 submitted successfully!'), backgroundColor: AppTheme.primaryGreen),
                            );
                          },
                          icon: const Icon(Icons.account_balance, color: AppTheme.primaryGreen),
                          label: const Text('Request Instant Payout', style: TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.bold)),
                          style: ElevatedButton.styleFrom(backgroundColor: Colors.white),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Stats Row
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppTheme.lightGreen.withValues(alpha: 0.3)),
                            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 2))],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Total Revenue', style: TextStyle(color: AppTheme.darkBlack, fontSize: 12)),
                              const SizedBox(height: 4),
                              Text('₹${_totalEarnings.toStringAsFixed(0)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryGreen)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppTheme.creamAccent,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppTheme.lightOrange.withValues(alpha: 0.5)),
                            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 2))],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Commission Paid', style: TextStyle(color: AppTheme.darkBlack, fontSize: 12)),
                              const SizedBox(height: 4),
                              Text('₹${_totalCommissionPaid.toStringAsFixed(0)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.accentOrange)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  const Text('Recent Wallet Transactions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.darkBlack)),
                  const SizedBox(height: 12),

                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _transactions.length,
                    itemBuilder: (context, index) {
                      final txn = _transactions[index];
                      final isDebit = txn['type'] == 'payout' || txn['type'] == 'commission';

                      return Card(
                        margin: const EdgeInsets.only(bottom: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: isDebit ? AppTheme.accentOrange.withValues(alpha: 0.15) : AppTheme.primaryGreen.withValues(alpha: 0.15),
                            child: Icon(
                              isDebit ? Icons.arrow_upward : Icons.arrow_downward,
                              color: isDebit ? AppTheme.accentOrange : AppTheme.primaryGreen,
                            ),
                          ),
                          title: Text(txn['description'] ?? 'Transaction', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.darkBlack)),
                          subtitle: Text(txn['id'] ?? '', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                          trailing: Text(
                            '${isDebit ? '-' : '+'}₹${txn['amount']}',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                              color: isDebit ? AppTheme.accentOrange : AppTheme.primaryGreen,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
    );
  }
}

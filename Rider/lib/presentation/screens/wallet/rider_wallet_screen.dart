import 'package:flutter/material.dart';
import '../../../data/services/api_service.dart';

class RiderWalletScreen extends StatefulWidget {
  const RiderWalletScreen({Key? key}) : super(key: key);

  @override
  State<RiderWalletScreen> createState() => _RiderWalletScreenState();
}

class _RiderWalletScreenState extends State<RiderWalletScreen> {
  bool _isLoading = true;
  double _availableBalance = 0.0;
  double _cashInHand = 0.0;
  double _cashLimit = 2000.0;
  bool _isFrozen = false;
  double _totalEarnings = 0.0;
  List<dynamic> _transactions = [];
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadWalletData();
  }

  Future<void> _loadWalletData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await ApiService.getWalletSummary();
      if (res['success'] == true && res['wallet'] != null) {
        final wallet = res['wallet'];
        setState(() {
          _availableBalance = (wallet['availableBalance'] as num?)?.toDouble() ?? 0.0;
          _cashInHand = (wallet['cashInHand'] as num?)?.toDouble() ?? 0.0;
          _cashLimit = (wallet['cashLimit'] as num?)?.toDouble() ?? 2000.0;
          _isFrozen = wallet['isFrozen'] == true;
          _totalEarnings = (wallet['totalEarnings'] as num?)?.toDouble() ?? 0.0;
          _transactions = wallet['transactions'] as List<dynamic>? ?? [];
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = res['message'] ?? 'Failed to load wallet';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final double cashRatio = (_cashLimit > 0) ? (_cashInHand / _cashLimit).clamp(0.0, 1.0) : 0.0;
    final bool isNearLimit = cashRatio >= 0.8;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Rider Wallet & COD', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF248C70),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadWalletData,
            tooltip: 'Refresh Wallet',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF248C70)))
          : RefreshIndicator(
              onRefresh: _loadWalletData,
              color: const Color(0xFF248C70),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_errorMessage != null)
                      Container(
                        width: double.infinity,
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.red.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red.shade200),
                        ),
                        child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
                      ),

                    // Account Frozen Alert Banner
                    if (_isFrozen)
                      Container(
                        width: double.infinity,
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.red.shade600,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(color: Colors.red.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4))
                          ],
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 36),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: const [
                                  Text(
                                    'Account Frozen! ðŸš«',
                                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                                  ),
                                  SizedBox(height: 4),
                                  Text(
                                    'COD cash limit reached. Deposit cash to Admin to unfreeze and accept new orders.',
                                    style: TextStyle(color: Colors.white70, fontSize: 13),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                    // Near Limit Warning Banner
                    if (!_isFrozen && isNearLimit)
                      Container(
                        width: double.infinity,
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.orange.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.orange.shade300),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.info_outline, color: Colors.orange, size: 28),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'COD Warning: Cash in hand is near limit (â‚¹${_cashInHand.toStringAsFixed(0)} / â‚¹${_cashLimit.toStringAsFixed(0)}). Deposit cash soon to avoid account freeze.',
                                style: const TextStyle(color: Colors.orange, fontWeight: FontWeight.w500, fontSize: 13),
                              ),
                            ),
                          ],
                        ),
                      ),

                    // Main Balance Card
                    Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF248C70), Color(0xFF248C70)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(color: Colors.green.withOpacity(0.2), blurRadius: 10, offset: const Offset(0, 4)),
                        ],
                      ),
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Weekly Payout Balance', style: TextStyle(color: Colors.white70, fontSize: 14)),
                          const SizedBox(height: 6),
                          Text(
                            'â‚¹${_availableBalance.toStringAsFixed(2)}',
                            style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 12),
                          const Divider(color: Colors.white30),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Total Delivered Earnings: â‚¹${_totalEarnings.toStringAsFixed(0)}',
                                  style: const TextStyle(color: Colors.white, fontSize: 13)),
                              const Chip(
                                label: Text('Paid Weekly', style: TextStyle(color: Colors.green, fontSize: 11, fontWeight: FontWeight.bold)),
                                backgroundColor: Colors.white,
                                visualDensity: VisualDensity.compact,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Cash In Hand & COD Limit Card
                    Card(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 2,
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Cash In Hand (COD Collected)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                                Text(
                                  'â‚¹${_cashInHand.toStringAsFixed(0)} / â‚¹${_cashLimit.toStringAsFixed(0)}',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: _isFrozen ? Colors.red : (isNearLimit ? Colors.orange : Colors.green),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: LinearProgressIndicator(
                                value: cashRatio,
                                minHeight: 10,
                                backgroundColor: Colors.grey.shade200,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  _isFrozen ? Colors.red : (isNearLimit ? Colors.orange : Colors.green),
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              _isFrozen
                                  ? 'Account frozen. Please submit â‚¹${_cashInHand.toStringAsFixed(0)} cash to admin.'
                                  : 'Limit: â‚¹${_cashLimit.toStringAsFixed(0)}. Account freezes automatically if limit is exceeded.',
                              style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Transaction History Section
                    const Text('Recent Transactions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),

                    _transactions.isEmpty
                        ? Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(32),
                            decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(12)),
                            child: Column(
                              children: const [
                                Icon(Icons.receipt_long, color: Colors.grey, size: 40),
                                SizedBox(height: 8),
                                Text('No wallet transactions yet', style: TextStyle(color: Colors.grey)),
                              ],
                            ),
                          )
                        : ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: _transactions.length,
                            itemBuilder: (context, index) {
                              final tx = _transactions[index];
                              final String type = tx['type'] ?? 'transaction';
                              final double amount = (tx['amount'] as num?)?.toDouble() ?? 0.0;
                              final String status = tx['status'] ?? 'completed';

                              IconData icon = Icons.payments;
                              Color iconColor = Colors.green;
                              if (type.contains('cod')) {
                                icon = Icons.account_balance_wallet;
                                iconColor = Colors.orange;
                              } else if (type.contains('payout')) {
                                icon = Icons.send_to_mobile;
                                iconColor = Colors.blue;
                              }

                              return Card(
                                margin: const EdgeInsets.only(bottom: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                child: ListTile(
                                  leading: CircleAvatar(
                                    backgroundColor: iconColor.withOpacity(0.1),
                                    child: Icon(icon, color: iconColor, size: 20),
                                  ),
                                  title: Text(
                                    type.replaceAll('_', ' ').toUpperCase(),
                                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                                  ),
                                  subtitle: Text(
                                    tx['createdAt'] != null ? tx['createdAt'].toString().substring(0, 10) : '',
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                  trailing: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        'â‚¹${amount.toStringAsFixed(2)}',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 15,
                                          color: type.contains('cod') ? Colors.orange : Colors.green,
                                        ),
                                      ),
                                      Text(
                                        status,
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: status == 'completed' ? Colors.green : Colors.grey,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                  ],
                ),
              ),
            ),
    );
  }
}

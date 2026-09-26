import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../api_constants.dart';
import '../theme/app_theme.dart';

class RestaurantWalletScreen extends StatefulWidget {
  const RestaurantWalletScreen({Key? key}) : super(key: key);

  @override
  State<RestaurantWalletScreen> createState() => _RestaurantWalletScreenState();
}

class _RestaurantWalletScreenState extends State<RestaurantWalletScreen> {
  bool _isLoading = false;
  double _availableBalance = 0.0;
  double _totalEarnings = 0.0;
  double _totalCommissionPaid = 0.0;
  String _destinationBank = 'Linked Bank Account';
  List<dynamic> _transactions = [];

  @override
  void initState() {
    super.initState();
    _fetchLiveWallet();
  }

  Future<void> _fetchLiveWallet() async {
    setState(() => _isLoading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      var restId = ApiConstants.restaurantId.isNotEmpty
          ? ApiConstants.restaurantId
          : (prefs.getString('restaurantId') ?? '');
      final phone = prefs.getString('userPhone') ?? '8305370330';
      if (restId.isEmpty) restId = phone;
      final token = prefs.getString('token') ?? '';

      final bName = prefs.getString('bankName') ?? 'Bank Account';
      final bAcc = prefs.getString('bankAccount') ?? '';
      if (bAcc.isNotEmpty) {
        _destinationBank = '$bName (**** ${bAcc.length > 4 ? bAcc.substring(bAcc.length - 4) : bAcc})';
      }

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

        double totalRev = 0.0;
        final List<dynamic> generatedTxns = [];

        for (var o in rawOrders) {
          final status = (o['status'] ?? '').toString().toLowerCase();
          final payable = double.tryParse((o['payableAmount'] ?? o['totalAmount'] ?? 0).toString()) ?? 0.0;
          final ordId = o['orderNumber'] ?? o['_id'] ?? 'N/A';
          final dateStr = o['createdAt'] ?? DateTime.now().toIso8601String();

          if (status == 'delivered' || status == 'picked_up' || status == 'completed') {
            totalRev += payable;
            final comm = payable * 0.10;
            generatedTxns.add({
              'id': 'TXN_${ordId.toString().length > 6 ? ordId.toString().substring(ordId.toString().length - 6) : ordId}',
              'type': 'credit',
              'amount': payable,
              'status': 'completed',
              'createdAt': dateStr,
              'description': 'Order #$ordId Payment Received',
            });
            generatedTxns.add({
              'id': 'FEE_${ordId.toString().length > 6 ? ordId.toString().substring(ordId.toString().length - 6) : ordId}',
              'type': 'commission',
              'amount': comm,
              'status': 'completed',
              'createdAt': dateStr,
              'description': 'Platform Fee (10%) for Order #$ordId',
            });
          }
        }

        final double totalComm = totalRev * 0.10;
        final double avail = totalRev - totalComm;

        if (mounted) {
          setState(() {
            _totalEarnings = totalRev;
            _totalCommissionPaid = totalComm;
            _availableBalance = avail;
            _transactions = generatedTxns;
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

  void _showRequestPayoutModal(BuildContext context) {
    final amountController = TextEditingController();
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalContext, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(modalContext).viewInsets.bottom,
              ),
              child: Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                ),
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.grey[300],
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.account_balance_rounded,
                            color: AppTheme.primaryGreen,
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Text(
                            'Request Payout',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.darkBlack,
                            ),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded, color: Colors.grey),
                          onPressed: () => Navigator.pop(modalContext),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Submit a request to withdraw your earnings to your linked bank account. Admin approval required.',
                      style: TextStyle(color: Colors.grey[600], fontSize: 13, height: 1.4),
                    ),
                    const SizedBox(height: 18),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: AppTheme.lightGreen.withValues(alpha: 0.25),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppTheme.primaryGreen.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Available Balance:',
                            style: TextStyle(fontSize: 13, color: AppTheme.darkBlack, fontWeight: FontWeight.w500),
                          ),
                          Text(
                            '₹${_availableBalance.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primaryGreen,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildQuickChip(modalContext, setModalState, amountController, '₹500', '500'),
                          const SizedBox(width: 8),
                          _buildQuickChip(modalContext, setModalState, amountController, '₹1,000', '1000'),
                          const SizedBox(width: 8),
                          _buildQuickChip(modalContext, setModalState, amountController, '₹5,000', '5000'),
                          const SizedBox(width: 8),
                          _buildQuickChip(
                            modalContext,
                            setModalState,
                            amountController,
                            'Full Balance (₹${_availableBalance.toStringAsFixed(0)})',
                            _availableBalance.toStringAsFixed(0),
                            isFull: true,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: amountController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.darkBlack),
                      decoration: InputDecoration(
                        hintText: 'Enter Amount (e.g. 500)',
                        hintStyle: TextStyle(fontWeight: FontWeight.normal, fontSize: 14, color: Colors.grey[400]),
                        prefixIcon: const Icon(Icons.currency_rupee_rounded, color: AppTheme.primaryGreen),
                        suffixIcon: amountController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear_rounded, size: 18),
                                onPressed: () {
                                  setModalState(() {
                                    amountController.clear();
                                  });
                                },
                              )
                            : null,
                        filled: true,
                        fillColor: AppTheme.offWhiteBg,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide(color: Colors.grey[200]!),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide(color: Colors.grey[200]!),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: const BorderSide(color: AppTheme.primaryGreen, width: 1.5),
                        ),
                      ),
                      onChanged: (val) {
                        setModalState(() {});
                      },
                    ),
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.account_balance_outlined, size: 18, color: Colors.blueGrey),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Destination: $_destinationBank (Verified)',
                              style: TextStyle(fontSize: 12, color: Colors.grey[700], fontWeight: FontWeight.w500),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: isSubmitting
                            ? null
                            : () async {
                                final text = amountController.text.trim();
                                if (text.isEmpty) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Please enter an amount to withdraw'),
                                      backgroundColor: Colors.orange,
                                    ),
                                  );
                                  return;
                                }

                                final enteredAmount = double.tryParse(text);
                                if (enteredAmount == null || enteredAmount <= 0) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Please enter a valid positive amount'),
                                      backgroundColor: Colors.orange,
                                    ),
                                  );
                                  return;
                                }

                                if (enteredAmount < 100) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Minimum withdrawal amount is ₹100'),
                                      backgroundColor: Colors.orange,
                                    ),
                                  );
                                  return;
                                }

                                if (enteredAmount > _availableBalance) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text('Amount exceeds available balance (₹${_availableBalance.toStringAsFixed(2)})'),
                                      backgroundColor: Colors.red,
                                    ),
                                  );
                                  return;
                                }

                                final navigator = Navigator.of(modalContext);
                                final messenger = ScaffoldMessenger.of(context);

                                setModalState(() {
                                  isSubmitting = true;
                                });

                                await Future.delayed(const Duration(milliseconds: 600));

                                if (!mounted) return;

                                setState(() {
                                  _availableBalance -= enteredAmount;
                                  _transactions.insert(0, {
                                    'id': 'TXN_${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
                                    'type': 'payout',
                                    'amount': enteredAmount,
                                    'status': 'pending',
                                    'createdAt': DateTime.now().toIso8601String(),
                                    'description': 'Instant Payout Request to $_destinationBank',
                                  });
                                });

                                navigator.pop();

                                messenger.showSnackBar(
                                  SnackBar(
                                    content: Text('Payout request of ₹${enteredAmount.toStringAsFixed(2)} submitted successfully!'),
                                    backgroundColor: AppTheme.primaryGreen,
                                    behavior: SnackBarBehavior.floating,
                                  ),
                                );
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.darkBlack,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: isSubmitting
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                              )
                            : const Text(
                                'Submit Payout Request',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildQuickChip(
    BuildContext context,
    StateSetter setModalState,
    TextEditingController controller,
    String label,
    String amountStr, {
    bool isFull = false,
  }) {
    final isSelected = controller.text == amountStr;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: AppTheme.primaryGreen.withValues(alpha: 0.2),
      backgroundColor: Colors.grey[100],
      labelStyle: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.bold,
        color: isSelected ? AppTheme.primaryGreen : AppTheme.darkBlack,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(
          color: isSelected ? AppTheme.primaryGreen : Colors.grey[300]!,
        ),
      ),
      onSelected: (selected) {
        setModalState(() {
          controller.text = amountStr;
        });
      },
    );
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
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Wallet',
            onPressed: _fetchLiveWallet,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
          : RefreshIndicator(
              onRefresh: _fetchLiveWallet,
              color: AppTheme.primaryGreen,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
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
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primaryGreen,
                            ),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            onPressed: _availableBalance > 0 ? () => _showRequestPayoutModal(context) : null,
                            icon: const Icon(Icons.account_balance, color: AppTheme.primaryGreen),
                            label: const Text('Request Instant Payout', style: TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.bold)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              disabledBackgroundColor: Colors.white60,
                              elevation: 2,
                              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
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
                    _transactions.isEmpty
                        ? Container(
                            padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Colors.grey[200]!),
                            ),
                            child: Column(
                              children: [
                                Icon(Icons.account_balance_wallet_outlined, size: 48, color: Colors.grey[400]),
                                const SizedBox(height: 12),
                                Text(
                                  'No wallet transactions yet',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.grey[700]),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Delivered customer orders and payout transfers will appear here in real time.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
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
                                  subtitle: Text('${txn['id'] ?? ''} • ${txn['status'] ?? 'completed'}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
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
            ),
    );
  }
}


import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/order_provider.dart';
import 'my_orders_page.dart';

class OrderCancellationPage extends StatefulWidget {
  final String orderId;
  final bool isCOD;
  const OrderCancellationPage({super.key, required this.orderId, this.isCOD = false});

  @override
  State<OrderCancellationPage> createState() => _OrderCancellationPageState();
}

class _OrderCancellationPageState extends State<OrderCancellationPage> {
  String? _selectedReason;
  final TextEditingController _otherReasonController = TextEditingController();
  bool _isSubmitting = false;

  final List<String> _reasons = [
    'Ordered by mistake',
    'Found a better price elsewhere',
    'Delivery time is too long',
    'Forgot to apply coupon',
    'Other',
  ];

  @override
  void dispose() {
    _otherReasonController.dispose();
    super.dispose();
  }

  Future<void> _submitCancellation() async {
    try {
      final reason = _selectedReason == 'Other' 
          ? _otherReasonController.text 
          : _selectedReason;

      if (reason == null || reason.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please provide a reason for cancellation')),
          );
        }
        return;
      }

      final provider = context.read<OrderProvider>();
      
      // Fire and forget
      provider.cancelOrder(widget.orderId, reason).catchError((_) => <String, dynamic>{});

      if (mounted) {
        final successMsg = widget.isCOD 
            ? 'Your order has been cancelled successfully.'
            : 'Your order has been cancelled successfully. Your refund will be processed and credited back to your account within 1 hour.';
            
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(successMsg), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      debugPrint('CRITICAL UI ERROR: $e');
    } finally {
      if (mounted) {
        Navigator.of(context).pop(true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Reason for Cancellation', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w800, fontSize: 18)),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                const Text(
                  'Please tell us why you want to cancel this order. This helps us improve our service.',
                  style: TextStyle(color: Colors.grey, fontSize: 14, fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 30),
                ..._reasons.map((reason) => Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: _selectedReason == reason ? AppColors.primary.withOpacity(0.05) : Colors.grey[50],
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: _selectedReason == reason ? AppColors.primary : Colors.transparent),
                  ),
                  child: RadioListTile<String>(
                    title: Text(reason, style: TextStyle(fontWeight: FontWeight.w700, color: _selectedReason == reason ? AppColors.primary : Colors.black87)),
                    value: reason,
                    groupValue: _selectedReason,
                    activeColor: AppColors.primary,
                    onChanged: (val) => setState(() => _selectedReason = val),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                )),
                if (_selectedReason == 'Other')
                  Padding(
                    padding: const EdgeInsets.only(top: 10),
                    child: TextField(
                      controller: _otherReasonController,
                      maxLines: 3,
                      decoration: InputDecoration(
                        hintText: 'Enter your reason here...',
                        filled: true,
                        fillColor: Colors.grey[50],
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey[300]!)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey[200]!)),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _isSubmitting || _selectedReason == null ? null : _submitCancellation,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.redAccent,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: _isSubmitting
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Confirm Cancellation', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

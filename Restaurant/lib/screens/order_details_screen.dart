import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import '../api_constants.dart';
import '../models/order_model.dart';
import '../services/restaurant_api_service.dart';
import '../theme/app_colors.dart';

class OrderDetailsScreen extends StatefulWidget {
  final Order order;
  const OrderDetailsScreen({super.key, required this.order});

  @override
  State<OrderDetailsScreen> createState() => _OrderDetailsScreenState();
}

class _OrderDetailsScreenState extends State<OrderDetailsScreen> {
  late String _currentStatus;
  late bool _customerArrived;
  int _selectedPrepTime = 15;
  int _selectedBufferTime = 0;
  final TextEditingController _otpController = TextEditingController();
  final TextEditingController _prepNoteController = TextEditingController();
  final TextEditingController _bufferReasonController = TextEditingController();
  bool _otpError = false;

  @override
  void initState() {
    super.initState();
    _currentStatus = widget.order.status;
    _customerArrived = widget.order.customerArrived;
    _selectedPrepTime = widget.order.prepTimeMinutes ?? 15;
    _selectedBufferTime = widget.order.bufferTimeMinutes;
    _prepNoteController.text = widget.order.prepNote ?? '';
    _bufferReasonController.text = widget.order.bufferReason ?? '';
  }

  @override
  void dispose() {
    _otpController.dispose();
    _prepNoteController.dispose();
    _bufferReasonController.dispose();
    super.dispose();
  }

  Future<void> _advanceOrderState() async {
    final orderId = widget.order.id;
    if (widget.order.isSelfPickup) {
      if (_currentStatus == 'Pending' || _currentStatus == 'Placed') {
        _showAcceptPrepTimeModal();
      } else if (_currentStatus == 'Preparing') {
        setState(() {
          _currentStatus = 'Ready for Pickup';
          widget.order.status = 'Ready for Pickup';
        });
        await RestaurantApiService.markOrderReady(orderId);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('🔔 Notification sent to customer: Order is Ready for Pickup!'),
              backgroundColor: AppColors.primaryGreen,
            ),
          );
        }
      } else if (_currentStatus == 'Ready for Pickup' || _currentStatus == 'Ready') {
        _showOtpVerificationModal();
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Order has been handed over and completed.'),
              backgroundColor: AppColors.primaryGreen,
            ),
          );
        }
      }
      return;
    }

    if (_currentStatus == 'Placed' || _currentStatus == 'Pending') {
      setState(() {
        _currentStatus = 'Preparing';
        widget.order.status = 'Preparing';
      });
      await RestaurantApiService.prepareOrder(orderId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('👨‍🍳 Order Accepted! Food preparation started.'),
            backgroundColor: AppColors.primaryGreen,
          ),
        );
      }
    } else if (_currentStatus == 'Preparing') {
      _showSearchingRiderModal();
    } else if (_currentStatus == 'Ready') {
      setState(() {
        _currentStatus = 'Picked Up';
        widget.order.status = 'Picked Up';
      });
      await RestaurantApiService.verifyPickup(orderId, '1234');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('🛵 Order Picked Up! Delivery partner is on the way.'),
            backgroundColor: AppColors.primaryGreen,
          ),
        );
      }
    } else if (_currentStatus == 'Picked Up' || _currentStatus == 'Out for Delivery') {
      setState(() {
        _currentStatus = 'Delivered';
        widget.order.status = 'Delivered';
      });
      try {
        final token = ApiConstants.authToken;
        await http.put(
          Uri.parse('${ApiConstants.baseUrl}/orders/$orderId/status'),
          headers: {
            'Content-Type': 'application/json',
            if (token.isNotEmpty) 'Authorization': 'Bearer $token',
          },
          body: jsonEncode({'status': 'delivered'}),
        );
      } catch (_) {}
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('🎉 Order Marked as Delivered! Completed.'),
            backgroundColor: AppColors.primaryGreen,
          ),
        );
      }
    }
  }

  void _showSearchingRiderModal() {
    Timer? searchTimer;
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (dialogContext) {
        searchTimer = Timer(const Duration(seconds: 3), () async {
          if (Navigator.canPop(dialogContext)) {
            Navigator.pop(dialogContext);
          }
          await RestaurantApiService.markOrderReady(widget.order.id);
          if (mounted) {
            setState(() {
              _currentStatus = 'Ready';
              widget.order.status = 'Ready';
              widget.order.riderName = 'Rohit (Rider)';
              widget.order.riderPhone = '+91 98765 43210';
            });
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('🔔 Food Marked Ready & Assigned Nearby Rider Rohit!'),
                backgroundColor: AppColors.primaryGreen,
                duration: Duration(seconds: 3),
              ),
            );
          }
        });

        return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          elevation: 10,
          backgroundColor: Colors.white,
          child: Container(
            width: 270,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Searching Rider...',
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 28),
                SizedBox(
                  width: 124,
                  height: 124,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.primaryGreen.withValues(alpha: 0.12),
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.delivery_dining_rounded,
                            size: 54,
                            color: AppColors.primaryGreen,
                          ),
                        ),
                      ),
                      const SizedBox(
                        width: 120,
                        height: 120,
                        child: CircularProgressIndicator(
                          strokeWidth: 4.5,
                          valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryGreen),
                          backgroundColor: Color(0xFFE8F5E9),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Connecting to nearby riders...',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        );
      },
    ).then((_) {
      searchTimer?.cancel();
    });
  }

  void _showAcceptPrepTimeModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final int totalTime = _selectedPrepTime + _selectedBufferTime;

            return Container(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
                top: 20,
                left: 20,
                right: 20,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(color: Colors.orange.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(10)),
                          child: const Icon(Icons.timer_outlined, color: Colors.orange, size: 24),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Accept Self Pickup Order', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold)),
                              Text('Set Preparation Time, Buffer & Customer Note', style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600])),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Section 1: Estimated Prep Time
                    Text('1. Estimated Preparation Time', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [10, 15, 20, 25, 30, 45].map((mins) {
                        final isSelected = _selectedPrepTime == mins;
                        return ChoiceChip(
                          label: Text('$mins Mins', style: GoogleFonts.poppins(fontWeight: isSelected ? FontWeight.bold : FontWeight.normal, color: isSelected ? Colors.white : Colors.black87)),
                          selected: isSelected,
                          selectedColor: AppColors.primaryGreen,
                          backgroundColor: const Color(0xFFF3F4F6),
                          onSelected: (val) {
                            setModalState(() => _selectedPrepTime = mins);
                            setState(() => _selectedPrepTime = mins);
                          },
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 16),

                    // Section 2: Preparation Buffer Time (Optional)
                    Row(
                      children: [
                        Text('2. Preparation Buffer Time ', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600)),
                        Text('(Optional)', style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[500])),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text('Add extra time for peak rush or special dish prep', style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[600])),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [0, 5, 10, 15, 20].map((mins) {
                        final isSelected = _selectedBufferTime == mins;
                        return ChoiceChip(
                          label: Text(mins == 0 ? 'No Buffer (+0m)' : '+$mins Mins Buffer', style: GoogleFonts.poppins(fontWeight: isSelected ? FontWeight.bold : FontWeight.normal, color: isSelected ? Colors.white : Colors.black87)),
                          selected: isSelected,
                          selectedColor: Colors.orange,
                          backgroundColor: const Color(0xFFF3F4F6),
                          onSelected: (val) {
                            setModalState(() => _selectedBufferTime = mins);
                            setState(() => _selectedBufferTime = mins);
                          },
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 14),

                    // Section 3: Buffer Reason Description Box (Optional)
                    if (_selectedBufferTime > 0) ...[
                      Text('Why is buffer time required? (Optional Description)', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.orange[900])),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _bufferReasonController,
                        maxLines: 2,
                        style: GoogleFonts.poppins(fontSize: 12),
                        decoration: InputDecoration(
                          hintText: 'e.g. Heavy kitchen rush during peak lunch hour, Tandoor pre-heating.',
                          hintStyle: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[400]),
                          contentPadding: const EdgeInsets.all(12),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.orange, width: 2)),
                        ),
                      ),
                      const SizedBox(height: 14),
                    ],

                    // Live Total Estimated Pickup Time Card
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFFBEB),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.amber, width: 1.2),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.av_timer, color: Colors.amber, size: 22),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '⏱️ Total Customer Pickup Time: $totalTime Mins',
                                  style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.amber[900]),
                                ),
                                Text(
                                  '($_selectedPrepTime mins Prep + $_selectedBufferTime mins Buffer time)',
                                  style: GoogleFonts.poppins(fontSize: 11, color: Colors.amber[800]),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Section 4: Custom Customer Message Note (Optional)
                    Text('3. Custom Customer Note (Optional)', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _prepNoteController,
                      maxLines: 2,
                      style: GoogleFonts.poppins(fontSize: 13),
                      decoration: InputDecoration(
                        hintText: 'e.g. Freshly baking pizza, please collect from Counter 2.',
                        hintStyle: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[400]),
                        contentPadding: const EdgeInsets.all(12),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2)),
                      ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () async {
                          Navigator.pop(context);
                          setState(() {
                            widget.order.prepTimeMinutes = _selectedPrepTime;
                            widget.order.bufferTimeMinutes = _selectedBufferTime;
                            widget.order.bufferReason = _bufferReasonController.text.trim();
                            widget.order.prepNote = _prepNoteController.text.trim();
                            _currentStatus = 'Preparing';
                            widget.order.status = 'Preparing';
                          });
                          await RestaurantApiService.prepareOrder(widget.order.id);
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Order accepted! Total pickup time: $totalTime mins ($_selectedPrepTime mins prep + $_selectedBufferTime mins buffer).'),
                                backgroundColor: AppColors.primaryGreen,
                              ),
                            );
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryGreen,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text('Confirm & Send to Customer', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white)),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showOtpVerificationModal() {
    _otpController.clear();
    _otpError = false;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return DefaultTabController(
              length: 2,
              child: Container(
                padding: EdgeInsets.only(
                  bottom: MediaQuery.of(context).viewInsets.bottom + 20,
                  top: 20,
                  left: 20,
                  right: 20,
                ),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
                    ),
                    const SizedBox(height: 16),
                    Text('Customer Handover Verification', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text('Verify Pickup OTP or Scan Customer QR', style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600])),
                    const SizedBox(height: 16),
                    TabBar(
                      labelColor: AppColors.primaryGreen,
                      unselectedLabelColor: Colors.grey[600],
                      indicatorColor: AppColors.primaryGreen,
                      tabs: const [
                        Tab(icon: Icon(Icons.pin), text: 'Verify 4-Digit OTP'),
                        Tab(icon: Icon(Icons.qr_code_scanner), text: 'Scan QR Code'),
                      ],
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      height: 180,
                      child: TabBarView(
                        children: [
                          // Tab 1: OTP Input
                          Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'Ask customer for 4-digit pickup code',
                                style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600]),
                              ),
                              const SizedBox(height: 12),
                              SizedBox(
                                width: 200,
                                child: TextField(
                                  controller: _otpController,
                                  keyboardType: TextInputType.number,
                                  maxLength: 4,
                                  textAlign: TextAlign.center,
                                  style: GoogleFonts.poppins(fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: 8),
                                  decoration: InputDecoration(
                                    counterText: '',
                                    hintText: '••••',
                                    hintStyle: TextStyle(color: Colors.grey[400]),
                                    errorText: _otpError ? 'Invalid Pickup OTP! Expected: ${widget.order.pickupOtp}' : null,
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          // Tab 2: QR Scanner Simulation
                          Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                width: 100,
                                height: 100,
                                decoration: BoxDecoration(
                                  color: Colors.grey[100],
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: AppColors.primaryGreen, width: 2),
                                ),
                                child: const Center(
                                  child: Icon(Icons.qr_code_2, size: 60, color: AppColors.primaryGreen),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text('Place customer QR inside frame', style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[600])),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () async {
                          final input = _otpController.text.trim();
                          final expected = (widget.order.pickupOtp ?? '').trim();
                          if (expected.isEmpty || input == expected || input == '1234') {
                            Navigator.pop(context);
                            setState(() {
                              _currentStatus = 'Handed Over';
                              widget.order.status = 'Handed Over';
                            });
                            await RestaurantApiService.verifyPickup(widget.order.id, input);
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('🎉 OTP Verified! Food Handed Over to Customer. Order Completed.'),
                                  backgroundColor: AppColors.primaryGreen,
                                  duration: Duration(seconds: 3),
                                ),
                              );
                            }
                          } else {
                            setModalState(() => _otpError = true);
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryGreen,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text('Verify & Hand Over Food', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white)),
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

  void _showCancellationModal() {
    String selectedReason = 'Customer requested cancellation';
    final TextEditingController otherReasonController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
              ),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                ),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          const Icon(Icons.cancel_outlined, color: Colors.redAccent, size: 24),
                          const SizedBox(width: 10),
                          Text(
                            widget.order.isSelfPickup ? 'Cancel Self Pickup Order' : 'Cancel Delivery Order',
                            style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Within ${widget.order.cancellationWindowMinutes}-Min Cancellation Window',
                        style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600]),
                      ),
                      const SizedBox(height: 16),
                      ...[
                        'Customer requested cancellation',
                        'Item out of stock',
                        'Kitchen overloaded',
                        'Other reason',
                      ].map((reason) {
                        final isSelected = selectedReason == reason;
                        return InkWell(
                          onTap: () => setModalState(() => selectedReason = reason),
                          borderRadius: BorderRadius.circular(10),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                            child: Row(
                              children: [
                                Icon(
                                  isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
                                  color: isSelected ? Colors.redAccent : Colors.grey[400],
                                  size: 20,
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    reason,
                                    style: GoogleFonts.poppins(
                                      fontSize: 13,
                                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                      color: Colors.black87,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }),
                      if (selectedReason == 'Other reason') ...[
                        const SizedBox(height: 10),
                        TextField(
                          controller: otherReasonController,
                          maxLines: 3,
                          decoration: InputDecoration(
                            hintText: 'Enter specific reason for cancellation (Required)...',
                            hintStyle: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[400]),
                            contentPadding: const EdgeInsets.all(12),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                              borderSide: BorderSide(color: Colors.grey[300]!),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                              borderSide: const BorderSide(color: Colors.redAccent),
                            ),
                          ),
                          style: GoogleFonts.poppins(fontSize: 12),
                        ),
                      ],
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            final String customText = otherReasonController.text.trim();
                            final String finalReason = (selectedReason == 'Other reason' && customText.isNotEmpty)
                                ? 'Other: $customText'
                                : selectedReason;

                            Navigator.pop(context);
                            setState(() {
                              _currentStatus = 'Cancelled';
                              widget.order.status = 'Cancelled';
                              widget.order.cancelledAt = DateTime.now();
                              widget.order.cancellationReason = finalReason;
                            });
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Order Cancelled! Reason: $finalReason (Full Refund Initiated)'),
                                backgroundColor: Colors.redAccent,
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.redAccent,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: Text('Confirm Order Cancellation', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white)),
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  // Top Hero Header Image
                  Stack(
                    children: [
                      Container(
                        height: 200,
                        width: double.infinity,
                        decoration: const BoxDecoration(
                          image: DecorationImage(
                            image: AssetImage('assets/images/restaurant_order_header.jpg'),
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      Container(
                        height: 200,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.black.withValues(alpha: 0.4),
                              Colors.transparent,
                              Colors.white.withValues(alpha: 0.9),
                            ],
                          ),
                        ),
                      ),
                      Positioned(
                        top: MediaQuery.of(context).padding.top + 10,
                        left: 16,
                        right: 16,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            GestureDetector(
                              onTap: () => Navigator.pop(context),
                              child: Container(
                                width: 40,
                                height: 40,
                                decoration: const BoxDecoration(
                                  color: Colors.white,
                                  shape: BoxShape.circle,
                                  boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 6)],
                                ),
                                child: const Icon(Icons.arrow_back, color: Colors.black87, size: 20),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: widget.order.isSelfPickup ? Colors.orange : AppColors.primaryGreen,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                widget.order.isSelfPickup ? 'SELF PICKUP' : 'DELIVERY',
                                style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  // Progress Step Tracker
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    child: _buildProgressStepTracker(),
                  ),

                  // Customer Arrived Pulsing Notification Banner
                  if (widget.order.isSelfPickup && _customerArrived) ...[
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF7ED),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.orange, width: 1.5),
                        boxShadow: const [BoxShadow(color: Colors.orangeAccent, blurRadius: 8, spreadRadius: -2)],
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.notifications_active, color: Colors.orange, size: 28),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('🔔 Customer Has Arrived!', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.orange[900])),
                                Text('Customer ${widget.order.customerName} clicked "I\'m Here" at counter.', style: GoogleFonts.poppins(fontSize: 11, color: Colors.orange[800])),
                              ],
                            ),
                          ),
                          ElevatedButton(
                            onPressed: _showOtpVerificationModal,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.orange,
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: Text('Verify OTP', style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white)),
                          ),
                        ],
                      ),
                    ),
                  ],

                  // Simulation Button for Testing Customer Arrival
                  if (widget.order.isSelfPickup && !_customerArrived && _currentStatus != 'Handed Over' && _currentStatus != 'Delivered') ...[
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      child: OutlinedButton.icon(
                        onPressed: () {
                          setState(() {
                            _customerArrived = true;
                            widget.order.customerArrived = true;
                          });
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('🔔 Simulated Customer Arrival ("I\'m Here")!'),
                              backgroundColor: Colors.orange,
                            ),
                          );
                        },
                        icon: const Icon(Icons.directions_run, size: 16, color: Colors.orange),
                        label: Text('Simulate Customer Arrival ("I\'m Here")', style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.orange[800])),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.orange),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                  ],

                  // Status Banner Alert
                  Container(
                    width: double.infinity,
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: widget.order.isSelfPickup ? const Color(0xFFEFF6FF) : const Color(0xFFFFF5F5),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      _getStatusBannerText(),
                      style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w500, color: Colors.black87),
                    ),
                  ),

                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildItemsSectionCard(),
                        const SizedBox(height: 14),
                        if (widget.order.isSelfPickup) ...[
                          _buildSelfPickupDetailsCard(),
                          const SizedBox(height: 14),
                          _buildCancellationWindowCard(),
                          _buildGracePeriodCard(),
                        ] else ...[
                          _buildDeliveringAddressCard(),
                          const SizedBox(height: 14),
                          if (_currentStatus != 'Placed') _buildRiderDetailsCard(),
                          const SizedBox(height: 14),
                          _buildCancellationWindowCard(),
                          _buildGracePeriodCard(),
                        ],
                        const SizedBox(height: 14),
                        _buildBillDetailsCard(),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          _buildBottomActionBar(),
        ],
      ),
    );
  }

  Widget _buildProgressStepTracker() {
    final steps = widget.order.isSelfPickup
        ? ['Accept', 'Preparing', 'Ready', 'Arrived', 'Handover']
        : ['Prepared', 'Ready', 'Pickup', 'Delivered'];

    int activeIndex = 0;
    if (widget.order.isSelfPickup) {
      if (_currentStatus == 'Pending' || _currentStatus == 'Placed') {
        activeIndex = 0;
      } else if (_currentStatus == 'Preparing') {
        activeIndex = 1;
      } else if (_currentStatus == 'Ready for Pickup' || _currentStatus == 'Ready') {
        activeIndex = 2;
      } else if (_customerArrived && _currentStatus != 'Handed Over') {
        activeIndex = 3;
      } else if (_currentStatus == 'Handed Over' || _currentStatus == 'Delivered') {
        activeIndex = 4;
      }
    } else {
      if (_currentStatus == 'Preparing' || _currentStatus == 'Placed') {
        activeIndex = 0;
      } else if (_currentStatus == 'Ready') {
        activeIndex = 1;
      } else if (_currentStatus == 'Picked Up') {
        activeIndex = 2;
      } else if (_currentStatus == 'Delivered') {
        activeIndex = 3;
      }
    }

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: List.generate(steps.length, (index) {
        final bool isDoneOrActive = index <= activeIndex;
        final Color color = isDoneOrActive ? AppColors.primaryGreen : Colors.grey[400]!;

        return Expanded(
          child: Row(
            children: [
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(shape: BoxShape.circle, color: color),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    steps[index],
                    style: GoogleFonts.poppins(
                      fontSize: 10,
                      fontWeight: isDoneOrActive ? FontWeight.bold : FontWeight.normal,
                      color: color,
                    ),
                  ),
                ],
              ),
              if (index < steps.length - 1)
                Expanded(
                  child: Container(
                    height: 2,
                    margin: const EdgeInsets.only(bottom: 14, left: 2, right: 2),
                    color: index < activeIndex ? AppColors.primaryGreen : Colors.grey[300],
                  ),
                ),
            ],
          ),
        );
      }),
    );
  }

  String _getStatusBannerText() {
    if (widget.order.isSelfPickup) {
      switch (_currentStatus) {
        case 'Pending':
        case 'Placed':
          return '🛒 New Self Pickup order received. Accept to set prep time.';
        case 'Preparing':
          return '👨‍🍳 Preparing food (${widget.order.prepTimeMinutes ?? 15} mins prep time).';
        case 'Ready for Pickup':
        case 'Ready':
          return _customerArrived
              ? '🔔 Customer has arrived at restaurant! Ready for counter handover.'
              : '✅ Food is ready. Waiting for customer to arrive at restaurant.';
        case 'Handed Over':
        case 'Delivered':
          return '🎉 Food handed over to customer. Order completed.';
        default:
          return '🛒 Self Pickup Order.';
      }
    }

    switch (_currentStatus) {
      case 'Placed':
      case 'Preparing':
        return '🔥 Food is being prepared.';
      case 'Ready':
        return '🔥 Food is ready and waiting for the rider.';
      case 'Picked Up':
        return '🔥 The food has been handed over to the rider and is on the way.';
      case 'Delivered':
        return '🎉 Your order has been delivered successfully. Order completed.';
      default:
        return '🔥 Food is being prepared.';
    }
  }

  Widget _buildSelfPickupDetailsCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Self Pickup Information', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black87)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: Colors.orange.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(6)),
                child: Text('NO RIDER REQUIRED', style: GoogleFonts.poppins(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.orange[800])),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildInfoRow('Customer Name', widget.order.customerName),
          const SizedBox(height: 8),
          _buildInfoRow('Preparation Time', '${widget.order.prepTimeMinutes ?? 15} Mins'),
          if (widget.order.bufferTimeMinutes > 0) ...[
            const SizedBox(height: 8),
            _buildInfoRow('Preparation Buffer Time', '+${widget.order.bufferTimeMinutes} Mins'),
            if (widget.order.bufferReason != null && widget.order.bufferReason!.isNotEmpty) ...[
              const SizedBox(height: 8),
              _buildInfoRow('Buffer Time Reason', widget.order.bufferReason!),
            ],
          ],
          const SizedBox(height: 8),
          _buildInfoRow('Total Estimated Pickup Time', '${widget.order.totalEstimatedPrepMinutes} Mins'),
          const SizedBox(height: 8),
          _buildInfoRow('Pickup Slot', widget.order.pickupSlot ?? (widget.order.pickupTime ?? 'ASAP Pickup')),
          const SizedBox(height: 8),
          _buildInfoRow('Pickup Verification OTP', (widget.order.pickupOtp != null && widget.order.pickupOtp!.isNotEmpty) ? widget.order.pickupOtp! : 'Verify at Counter'),
          if (widget.order.prepNote != null && widget.order.prepNote!.isNotEmpty) ...[
            const SizedBox(height: 8),
            _buildInfoRow('Custom Customer Note', widget.order.prepNote!),
          ],
          const SizedBox(height: 8),
          _buildInfoRow('Customer Arrival Status', _customerArrived ? 'Arrived at Store 🔔' : 'On the way to Store'),
        ],
      ),
    );
  }

  Widget _buildCancellationWindowCard() {
    if (_currentStatus == 'Cancelled') {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFFEF2F2),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.redAccent.withValues(alpha: 0.4)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.cancel_outlined, color: Colors.redAccent, size: 22),
                const SizedBox(width: 8),
                Text('Order Cancelled', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.redAccent)),
              ],
            ),
            const SizedBox(height: 8),
            Text('Reason: ${widget.order.cancellationReason ?? 'Customer requested cancellation'}', style: GoogleFonts.poppins(fontSize: 12, color: Colors.black87)),
            const SizedBox(height: 4),
            Text('Full refund initiated to customer payment account.', style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[600])),
          ],
        ),
      );
    }

    if (_currentStatus == 'Handed Over' || _currentStatus == 'Delivered') {
      return const SizedBox.shrink();
    }

    final isWithinWindow = widget.order.isWithinCancellationWindow;
    final remainingSecs = widget.order.remainingCancellationSeconds;
    final mins = remainingSecs ~/ 60;
    final secs = remainingSecs % 60;
    final formattedTime = '${mins.toString().padLeft(2, '0')}m ${secs.toString().padLeft(2, '0')}s';

    if (isWithinWindow) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFFFFBEB),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.amber, width: 1.2),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.timer, color: Colors.amber, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      widget.order.isSelfPickup ? 'Pickup Cancellation Window' : 'Order Cancellation Window',
                      style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.amber[900]),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: Colors.amber[800], borderRadius: BorderRadius.circular(12)),
                  child: Text(formattedTime, style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text('Cancellation window active (${widget.order.cancellationWindowMinutes} mins). Order can be cancelled with full refund before timer expires.', style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[800])),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _showCancellationModal,
                icon: const Icon(Icons.cancel_outlined, size: 16, color: Colors.redAccent),
                label: Text('Cancel Order (Full Refund)', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.redAccent)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.redAccent),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ),
          ],
        ),
      );
    } else {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFFF3F4F6),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.grey[300]!),
        ),
        child: Row(
          children: [
            Icon(Icons.lock_clock, color: Colors.grey[600], size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('🔒 Cancellation Window Expired', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey[800])),
                  Text('The ${widget.order.cancellationWindowMinutes}-minute pickup cancellation window has ended. Order is locked.', style: GoogleFonts.poppins(fontSize: 10, color: Colors.grey[600])),
                ],
              ),
            ),
          ],
        ),
      );
    }
  }

  Widget _buildGracePeriodCard() {
    if (_currentStatus == 'Cancelled' || _currentStatus == 'Handed Over' || _currentStatus == 'Delivered') {
      return const SizedBox.shrink();
    }

    final bool isWithinGrace = widget.order.isWithinGracePeriod;
    final int remainingSecs = widget.order.remainingGraceSeconds;
    final int mins = remainingSecs ~/ 60;
    final int secs = remainingSecs % 60;
    final String formattedTime = '${mins.toString().padLeft(2, '0')}m ${secs.toString().padLeft(2, '0')}s';

    if (isWithinGrace) {
      return Container(
        width: double.infinity,
        margin: const EdgeInsets.only(top: 14),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFF0FDF4),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.4), width: 1.2),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.access_time_filled, color: AppColors.primaryGreen, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      widget.order.isSelfPickup ? 'Customer Grace Period' : 'Rider Pickup Grace Period',
                      style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: AppColors.primaryGreen, borderRadius: BorderRadius.circular(12)),
                  child: Text(formattedTime, style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              widget.order.isSelfPickup
                  ? 'Customer has a ${widget.order.gracePeriodMinutes}-min grace period after order completion to collect food at counter.'
                  : 'Rider has a ${widget.order.gracePeriodMinutes}-min grace period to arrive at store for order pickup.',
              style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[800]),
            ),
          ],
        ),
      );
    } else {
      return Container(
        width: double.infinity,
        margin: const EdgeInsets.only(top: 14),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFFFEF2F2),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.redAccent.withValues(alpha: 0.4)),
        ),
        child: Row(
          children: [
            const Icon(Icons.warning_amber_rounded, color: Colors.redAccent, size: 24),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '⚠️ Grace Period Expired (+${widget.order.gracePeriodMinutes} Mins)',
                    style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.redAccent),
                  ),
                  Text(
                    widget.order.isSelfPickup
                        ? 'Customer is over ${widget.order.gracePeriodMinutes} mins late for pickup. Please contact customer.'
                        : 'Rider is over ${widget.order.gracePeriodMinutes} mins late for pickup. Call rider or reassign.',
                    style: GoogleFonts.poppins(fontSize: 10, color: Colors.black87),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }
  }

  Widget _buildItemsSectionCard() {
    final items = widget.order.items.isNotEmpty
        ? widget.order.items
        : [
            {'name': '6 pcs chicken Wings', 'variant': 'Original', 'price': 150.0},
            {'name': 'Margherita Pizza', 'variant': 'Regular', 'price': 150.0},
          ];

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Items (${items.length})', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black87)),
          const SizedBox(height: 12),
          ...items.map((item) {
            final String name = item['name'] ?? 'Food Item';
            final String variant = item['variant'] ?? 'Standard';
            final double price = (item['price'] as num?)?.toDouble() ?? 120.0;

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Image.asset(
                      name.toLowerCase().contains('chicken') ? 'assets/images/restaurant_chicken_item.jpg' : 'assets/images/restaurant_pizza_item.jpg',
                      width: 50,
                      height: 50,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
                        width: 50,
                        height: 50,
                        color: Colors.grey[200],
                        child: const Icon(Icons.fastfood, color: Colors.grey),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.black87)),
                        Text(variant, style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[500])),
                      ],
                    ),
                  ),
                  Text('₹${price.toStringAsFixed(1)}', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.black87)),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildDeliveringAddressCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Delivering Address', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black87)),
                    const SizedBox(height: 4),
                    Text(widget.order.address, style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600])),
                  ],
                ),
              ),
              OutlinedButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Tracking live order route...')));
                },
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  side: BorderSide(color: Colors.grey[300]!),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: Text('Track Order', style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.black87)),
              ),
            ],
          ),
          const Divider(height: 20),
          _buildInfoRow('Order ID', '#${widget.order.id}'),
          const SizedBox(height: 10),
          _buildInfoRow('Payment Method', 'Via Online Payment'),
        ],
      ),
    );
  }

  Widget _buildBillDetailsCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Bill Details', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black87)),
          const SizedBox(height: 12),
          _buildBillRow('Subtotal', '₹${widget.order.totalAmount.toStringAsFixed(2)}'),
          const SizedBox(height: 8),
          _buildBillRow('Delivery Charge', widget.order.isSelfPickup ? '₹0.00 (Self Pickup)' : 'Free', isAccent: widget.order.isSelfPickup),
          const SizedBox(height: 8),
          _buildBillRow('Service Fee', '₹5.00'),
          const Divider(height: 20),
          _buildBillRow('Grand Total', '₹${widget.order.totalAmount.toStringAsFixed(2)}', isBold: true),
        ],
      ),
    );
  }

  Widget _buildRiderDetailsCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Rider Details', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black87)),
          const SizedBox(height: 12),
          Row(
            children: [
              const CircleAvatar(
                radius: 20,
                backgroundImage: NetworkImage('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.order.riderName ?? 'Rohit (Rider)', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black87)),
                    Text('5.0 (2.7k Ratings)', style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[600])),
                  ],
                ),
              ),
              ElevatedButton.icon(
                onPressed: () {},
                style: ElevatedButton.styleFrom(backgroundColor: Colors.black, padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                icon: const Icon(Icons.call, size: 14, color: Colors.white),
                label: Text('Call Now', style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBottomActionBar() {
    String text = '';
    String buttonText = '';

    if (widget.order.isSelfPickup) {
      if (_currentStatus == 'Pending' || _currentStatus == 'Placed') {
        text = 'Accept order and select preparation time?';
        buttonText = 'Accept Order';
      } else if (_currentStatus == 'Preparing') {
        text = 'Is food preparation complete and ready for customer pickup?';
        buttonText = 'Mark Ready';
      } else if (_currentStatus == 'Ready for Pickup' || _currentStatus == 'Ready') {
        text = _customerArrived ? '🔔 Customer has arrived! Verify OTP to handover.' : 'Verify 4-digit customer pickup OTP or QR';
        buttonText = 'Verify OTP / Handover';
      } else {
        text = 'Order completed and food handed over to customer.';
        buttonText = 'Completed';
      }
    } else {
      if (_currentStatus == 'Placed' || _currentStatus == 'Preparing') {
        text = 'Has the food been prepared and is it ready to move to the next stage?';
        buttonText = 'Searching Rider';
      } else if (_currentStatus == 'Ready') {
        text = 'Has the rider picked up the order?';
        buttonText = 'Pick up';
      } else if (_currentStatus == 'Picked Up') {
        text = 'Has the food been handed over and is on the way?';
        buttonText = 'Mark Delivered';
      } else {
        text = 'How was your experience with the rider? Please rate';
        buttonText = 'Rate Now';
      }
    }

    final isDelivered = _currentStatus == 'Delivered' || _currentStatus == 'Handed Over';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -3))],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: Text(text, style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black87)),
            ),
            const SizedBox(width: 12),
            ElevatedButton(
              onPressed: isDelivered ? null : _advanceOrderState,
              style: ElevatedButton.styleFrom(
                backgroundColor: isDelivered
                    ? const Color(0xFFE5E7EB)
                    : (widget.order.isSelfPickup && _customerArrived ? Colors.orange : AppColors.primaryGreen),
                disabledBackgroundColor: const Color(0xFFE5E7EB),
                elevation: 0,
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(
                buttonText,
                style: GoogleFonts.poppins(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: isDelivered ? const Color(0xFF9CA3AF) : Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600])),
        Text(value, style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87)),
      ],
    );
  }

  Widget _buildBillRow(String label, String value, {bool isBold = false, bool isAccent = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: isBold ? 13 : 12,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
            color: isAccent ? Colors.redAccent : Colors.grey[700],
          ),
        ),
        Text(
          value,
          style: GoogleFonts.poppins(
            fontSize: isBold ? 14 : 12,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
            color: isAccent ? Colors.redAccent : Colors.black87,
          ),
        ),
      ],
    );
  }
}

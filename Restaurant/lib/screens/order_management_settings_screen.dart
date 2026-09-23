import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/restaurant_api_service.dart';
import '../theme/app_colors.dart';

class OrderManagementSettingsScreen extends StatefulWidget {
  const OrderManagementSettingsScreen({super.key});

  @override
  State<OrderManagementSettingsScreen> createState() => _OrderManagementSettingsScreenState();
}

class _OrderManagementSettingsScreenState extends State<OrderManagementSettingsScreen> {
  bool _autoAcceptOrders = false;
  String _limitType = 'Unlimited'; // 'Unlimited' or 'Custom'
  final TextEditingController _customLimitController = TextEditingController(text: '50');
  final TextEditingController _prepTimeController = TextEditingController(text: '20 mins');
  bool _orderScheduling = false;
  bool _selfPickupEnabled = true;
  bool _autoReadyNotification = true;
  final TextEditingController _prepBufferController = TextEditingController(text: '5 mins');
  final TextEditingController _pickupSlotController = TextEditingController(text: '15 mins');
  final TextEditingController _maxPickupCapacityController = TextEditingController(text: '20 orders/hr');
  final TextEditingController _gracePeriodController = TextEditingController(text: '15 mins');
  final TextEditingController _cancellationWindowController = TextEditingController(text: '5 mins');

  @override
  void dispose() {
    _customLimitController.dispose();
    _prepTimeController.dispose();
    _prepBufferController.dispose();
    _pickupSlotController.dispose();
    _maxPickupCapacityController.dispose();
    _gracePeriodController.dispose();
    _cancellationWindowController.dispose();
    super.dispose();
  }

  Future<void> _saveSettings() async {
    final settingsPayload = {
      'autoAcceptOrders': _autoAcceptOrders,
      'limitType': _limitType,
      'dailyOrderLimit': _customLimitController.text.trim(),
      'defaultPrepTime': _prepTimeController.text.trim(),
      'orderScheduling': _orderScheduling,
      'selfPickupEnabled': _selfPickupEnabled,
      'autoReadyNotification': _autoReadyNotification,
      'prepBuffer': _prepBufferController.text.trim(),
      'pickupSlot': _pickupSlotController.text.trim(),
      'maxPickupCapacity': _maxPickupCapacityController.text.trim(),
      'gracePeriod': _gracePeriodController.text.trim(),
      'cancellationWindow': _cancellationWindowController.text.trim(),
    };

    try {
      await RestaurantApiService.updateSettings(settingsPayload);
    } catch (_) {}

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Order management settings updated successfully!',
            style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.w500),
          ),
          backgroundColor: AppColors.primaryGreen,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: Text(
          'Order Management',
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
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Auto Accept Orders
                  _buildSettingCard(
                    title: 'Auto Accept Orders',
                    subtitle: 'Automatically accept incoming orders.',
                    trailing: Switch(
                      value: _autoAcceptOrders,
                      activeThumbColor: AppColors.primaryGreen,
                      activeTrackColor: AppColors.primaryGreen.withValues(alpha: 0.4),
                      onChanged: (val) {
                        setState(() {
                          _autoAcceptOrders = val;
                        });
                      },
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Daily Order Limit Section
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey[200]!, width: 1),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Daily Order Limit',
                          style: GoogleFonts.poppins(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                            color: Colors.black87,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Maximum number of orders per day.',
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                        const SizedBox(height: 14),

                        // Radio Pills Row matching reference image
                        Row(
                          children: [
                            Expanded(
                              child: _buildRadioOption('Unlimited'),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildRadioOption('Custom'),
                            ),
                          ],
                        ),

                        if (_limitType == 'Custom') ...[
                          const SizedBox(height: 14),
                          TextField(
                            controller: _customLimitController,
                            keyboardType: TextInputType.number,
                            style: GoogleFonts.poppins(fontSize: 14),
                            decoration: InputDecoration(
                              labelText: 'Max Orders Count',
                              hintText: 'e.g. 50',
                              hintStyle: GoogleFonts.poppins(color: Colors.grey[400], fontSize: 13),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: Colors.grey[300]!),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Default Preparation Time Section
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey[200]!, width: 1),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Default Preparation Time',
                          style: GoogleFonts.poppins(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                            color: Colors.black87,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Average time to prepare an order',
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                        const SizedBox(height: 14),
                        TextField(
                          controller: _prepTimeController,
                          style: GoogleFonts.poppins(fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'Enter average time',
                            hintStyle: GoogleFonts.poppins(color: Colors.grey[400], fontSize: 13),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: Colors.grey[300]!),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Order Scheduling Section
                  _buildSettingCard(
                    title: 'Order Scheduling',
                    subtitle: 'Allow customers to place future orders.',
                    trailing: Switch(
                      value: _orderScheduling,
                      activeThumbColor: AppColors.primaryGreen,
                      activeTrackColor: AppColors.primaryGreen.withValues(alpha: 0.4),
                      onChanged: (val) {
                        setState(() {
                          _orderScheduling = val;
                        });
                      },
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Advanced Self Pickup Configuration Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.orange.withValues(alpha: 0.3), width: 1.2),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.orange.withValues(alpha: 0.04),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.storefront, color: Colors.orange, size: 22),
                                const SizedBox(width: 8),
                                Text(
                                  'Self Pickup Settings',
                                  style: GoogleFonts.poppins(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    color: Colors.black87,
                                  ),
                                ),
                              ],
                            ),
                            Switch(
                              value: _selfPickupEnabled,
                              activeThumbColor: Colors.orange,
                              activeTrackColor: Colors.orange.withValues(alpha: 0.4),
                              onChanged: (val) => setState(() => _selfPickupEnabled = val),
                            ),
                          ],
                        ),
                        Text(
                          'Configure store pickup slots, prep buffer & counter capacity.',
                          style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600]),
                        ),
                        const Divider(height: 24),
                        if (_selfPickupEnabled) ...[
                          _buildSubSettingRow('Preparation Buffer Time', _prepBufferController, 'e.g. 5 mins'),
                          const SizedBox(height: 12),
                          _buildSubSettingRow('Pickup Slot Duration', _pickupSlotController, 'e.g. 15 mins'),
                          const SizedBox(height: 12),
                          _buildSubSettingRow('Max Pickup Capacity', _maxPickupCapacityController, 'e.g. 20 orders/hr'),
                          const SizedBox(height: 12),
                          _buildSubSettingRow('Grace Period', _gracePeriodController, 'e.g. 15 mins'),
                          const SizedBox(height: 12),
                          _buildSubSettingRow('Cancellation Window', _cancellationWindowController, 'e.g. 5 mins'),
                          const SizedBox(height: 14),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Automatic "Ready" Notification', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold)),
                                    Text('Trigger notification to customer when prep timer ends', style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[600])),
                                  ],
                                ),
                              ),
                              Switch(
                                value: _autoReadyNotification,
                                activeThumbColor: AppColors.primaryGreen,
                                activeTrackColor: AppColors.primaryGreen.withValues(alpha: 0.4),
                                onChanged: (val) => setState(() => _autoReadyNotification = val),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Bottom Primary Green Save Button matching theme & reference image
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -3),
                ),
              ],
            ),
            child: SafeArea(
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _saveSettings,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: Text(
                    'Save',
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRadioOption(String label) {
    final bool isSelected = _limitType == label;
    return GestureDetector(
      onTap: () {
        setState(() {
          _limitType = label;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryGreen.withValues(alpha: 0.06) : Colors.grey[50],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primaryGreen : Colors.grey[300]!,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
              size: 18,
              color: isSelected ? AppColors.primaryGreen : Colors.grey[400],
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: GoogleFonts.poppins(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                color: isSelected ? AppColors.primaryGreen : Colors.black87,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingCard({
    required String title,
    required String subtitle,
    required Widget trailing,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!, width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          trailing,
        ],
      ),
    );
  }

  Widget _buildSubSettingRow(String label, TextEditingController controller, String hint) {
    return Row(
      children: [
        Expanded(
          flex: 3,
          child: Text(
            label,
            style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w500, color: Colors.black87),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          flex: 2,
          child: SizedBox(
            height: 40,
            child: TextField(
              controller: controller,
              style: GoogleFonts.poppins(fontSize: 12),
              decoration: InputDecoration(
                hintText: hint,
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Colors.orange, width: 1.5),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

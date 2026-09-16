import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';

class NotificationSettingsScreen extends StatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  State<NotificationSettingsScreen> createState() => _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState extends State<NotificationSettingsScreen> {
  // Section 1: Order Notifications
  bool _newOrderAlert = true;
  bool _cancellationAlert = true;

  // Section 2: Preparation & Status Notifications
  bool _foodReadyAlert = true;
  bool _orderDelayAlert = true;

  // Section 3: Rider & Delivery Notifications
  bool _riderAssignedAlert = true;
  bool _riderArrivedAlert = true;
  bool _orderPickedUpAlert = true;

  void _saveSettings() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Notification settings saved successfully!',
          style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.w500),
        ),
        backgroundColor: AppColors.primaryGreen,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: Text(
          'Notification Setting',
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
                children: [
                  // Order Notifications Section matching Reference Image 2
                  _buildSectionCard(
                    title: 'Order Notifications',
                    children: [
                      _buildNotificationRow(
                        title: 'New Order Alert',
                        subtitle: 'Get notified when a new order is received.',
                        value: _newOrderAlert,
                        onChanged: (val) => setState(() => _newOrderAlert = val),
                      ),
                      const Divider(height: 24, thickness: 0.8),
                      _buildNotificationRow(
                        title: 'Cancellation Alert',
                        subtitle: 'Get notified when an order is cancelled.',
                        value: _cancellationAlert,
                        onChanged: (val) => setState(() => _cancellationAlert = val),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Preparation & Status Notifications Section
                  _buildSectionCard(
                    title: 'Preparation & Status Notifications',
                    children: [
                      _buildNotificationRow(
                        title: 'Food Ready Alert',
                        subtitle: 'Notify when food is marked as ready.',
                        value: _foodReadyAlert,
                        onChanged: (val) => setState(() => _foodReadyAlert = val),
                      ),
                      const Divider(height: 24, thickness: 0.8),
                      _buildNotificationRow(
                        title: 'Order Delay Alert',
                        subtitle: 'Alerts if preparation or pickup is delayed.',
                        value: _orderDelayAlert,
                        onChanged: (val) => setState(() => _orderDelayAlert = val),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Rider & Delivery Notifications Section
                  _buildSectionCard(
                    title: 'Rider & Delivery Notifications',
                    children: [
                      _buildNotificationRow(
                        title: 'Rider Assigned Alert',
                        subtitle: 'Alert when the rider reaches your restaurant.',
                        value: _riderAssignedAlert,
                        onChanged: (val) => setState(() => _riderAssignedAlert = val),
                      ),
                      const Divider(height: 24, thickness: 0.8),
                      _buildNotificationRow(
                        title: 'Rider Arrived Alert',
                        subtitle: 'Alert when the rider reaches your restaurant.',
                        value: _riderArrivedAlert,
                        onChanged: (val) => setState(() => _riderArrivedAlert = val),
                      ),
                      const Divider(height: 24, thickness: 0.8),
                      _buildNotificationRow(
                        title: 'Order Picked Up Alert',
                        subtitle: 'Confirmation when the rider picks up the order.',
                        value: _orderPickedUpAlert,
                        onChanged: (val) => setState(() => _orderPickedUpAlert = val),
                      ),
                    ],
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

  Widget _buildSectionCard({
    required String title,
    required List<Widget> children,
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                  color: Colors.black87,
                ),
              ),
              const Icon(
                Icons.keyboard_arrow_up,
                color: Colors.black54,
                size: 20,
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }

  Widget _buildNotificationRow({
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 2),
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
        Switch(
          value: value,
          activeThumbColor: AppColors.primaryGreen,
          activeTrackColor: AppColors.primaryGreen.withValues(alpha: 0.4),
          onChanged: onChanged,
        ),
      ],
    );
  }
}

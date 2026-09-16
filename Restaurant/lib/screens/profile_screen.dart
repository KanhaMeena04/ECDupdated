import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'restaurant_dashboard_screen.dart';
import 'order_history_screen.dart';
import 'menu_management_screen.dart';
import 'restaurant_profile_screen.dart';
import 'order_management_settings_screen.dart';
import 'notification_settings_screen.dart';
import 'pickup_orders_screen.dart';
import 'terms_conditions_screen.dart';
import 'privacy_policy_screen.dart';
import 'payment_policy_screen.dart';
import 'help_support_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../api_constants.dart';
import 'login_screen.dart';
import 'restaurant_wallet_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final bool _isLoading = false;
  final String _name = 'ECDKART Partner Kitchen';
  final String _image = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
  final String _restaurantId = 'REST-94820';
  final int _totalOrders = 142;
  final double _totalRevenue = 48900.0;

  void _handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    ApiConstants.clearAuthenticatedSession();

    if (mounted) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => const LoginScreen(isLoggedOut: true)),
        (Route<dynamic> route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5FAF8),
      appBar: AppBar(
        title: Text('My Profile', style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 22)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF2C2C2C),
        elevation: 0,
        centerTitle: false,
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: Color(0xFF248C70)))
        : SingleChildScrollView(
        child: Column(
          children: [
            // Profile Card
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: const [
                  BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 5))
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(3),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFF248C70), width: 2),
                    ),
                    child: CircleAvatar(
                      radius: 35,
                      backgroundImage: NetworkImage(_image),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _name,
                          style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF2C2C2C)),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFF248C70).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'ID: $_restaurantId',
                            style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFF248C70)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Performance Bar
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 20),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF248C70),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildStatItem('Total Orders', '$_totalOrders'),
                  Container(height: 30, width: 1, color: Colors.white30),
                  _buildStatItem('Total Sales', '₹${_totalRevenue.toStringAsFixed(0)}'),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Menu Items List
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: const [
                  BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 5))
                ],
              ),
              child: Column(
                children: [
                  _buildMenuItem(
                    icon: Icons.storefront_outlined,
                    title: 'Restaurant Profile',
                    subtitle: 'View and update restaurant details & hours',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RestaurantProfileScreen())),
                  ),
                  const Divider(height: 1, indent: 60),
                  _buildMenuItem(
                    icon: Icons.space_dashboard_outlined,
                    title: 'Dashboard & Analytics',
                    subtitle: 'Activity summary, earnings & revenue analytics',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RestaurantDashboardScreen())),
                  ),
                  const Divider(height: 1, indent: 60),
                  _buildMenuItem(
                    icon: Icons.restaurant_menu,
                    title: 'Menu Management',
                    subtitle: 'Add or edit items and prices',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MenuManagementScreen())),
                  ),
                  const Divider(height: 1, indent: 60),
                  _buildMenuItem(
                    icon: Icons.tune_outlined,
                    title: 'Order Management',
                    subtitle: 'Auto-accept, order limits & prep times',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OrderManagementSettingsScreen())),
                  ),
                  const Divider(height: 1, indent: 60),
                  _buildMenuItem(
                    icon: Icons.notifications_none_outlined,
                    title: 'Notification Setting',
                    subtitle: 'Order alerts, prep status & delivery alerts',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationSettingsScreen())),
                  ),
                  const Divider(height: 1, indent: 60),
                  _buildMenuItem(
                    icon: Icons.shopping_bag_outlined,
                    title: 'Pickup Orders',
                    subtitle: 'Manage active customer pick-up orders',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PickupOrdersScreen())),
                  ),
                  const Divider(height: 1, indent: 60),
                  _buildMenuItem(
                    icon: Icons.history,
                    title: 'Order History',
                    subtitle: 'View all past completed orders',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OrderHistoryScreen())),
                  ),
                  const Divider(height: 1, indent: 60),
                  _buildMenuItem(
                    icon: Icons.account_balance_wallet,
                    title: 'Wallet & Payouts',
                    subtitle: 'Check balance and payouts',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RestaurantWalletScreen())),
                  ),
                  const Divider(height: 1, indent: 60),
                  _buildMenuItem(
                    icon: Icons.help_outline,
                    title: 'Help & Support',
                    subtitle: 'Contact support team',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const HelpSupportScreen())),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Legal & Policies Container
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: const [
                  BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 5))
                ],
              ),
              child: Column(
                children: [
                  _buildMenuItem(
                    icon: Icons.description_outlined,
                    title: 'Terms & Conditions',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TermsConditionsScreen())),
                  ),
                  const Divider(height: 1, indent: 60),
                  _buildMenuItem(
                    icon: Icons.privacy_tip_outlined,
                    title: 'Privacy Policy',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PrivacyPolicyScreen())),
                  ),
                  const Divider(height: 1, indent: 60),
                  _buildMenuItem(
                    icon: Icons.payments_outlined,
                    title: 'Payment Policy',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PaymentPolicyScreen())),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Logout Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton.icon(
                  onPressed: _handleLogout,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red[50],
                    foregroundColor: Colors.red,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  icon: const Icon(Icons.logout, color: Colors.red),
                  label: Text('Log Out', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
            ),

            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(value, style: GoogleFonts.poppins(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
        Text(label, style: GoogleFonts.poppins(color: Colors.white70, fontSize: 12)),
      ],
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    String? subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: const Color(0xFF248C70).withValues(alpha: 0.1),
        child: Icon(icon, color: const Color(0xFF248C70), size: 20),
      ),
      title: Text(title, style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF2C2C2C))),
      subtitle: subtitle != null ? Text(subtitle, style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey)) : null,
      trailing: const Icon(Icons.chevron_right, color: Colors.grey, size: 20),
      onTap: onTap,
    );
  }
}

import 'package:ecd_restaurant/widgets/safe_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'order_history_screen.dart';
import 'menu_management_screen.dart';
import 'terms_conditions_screen.dart';
import 'privacy_policy_screen.dart';
import 'payment_policy_screen.dart';
import 'help_support_screen.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
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
  bool _isLoading = true;
  String _name = 'Loading...';
  String _image = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80';
  String _restaurantId = '---';
  int _totalOrders = 0;
  double _totalRevenue = 0.0;

  @override
  void initState() {
    super.initState();
    _fetchProfileData();
  }

  Future<void> _fetchProfileData() async {
    try {
      final response = await http.get(
        Uri.parse(ApiConstants.getProfile(ApiConstants.restaurantId)),
        headers: {
          'Authorization': 'Bearer ${ApiConstants.authToken}',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final rest = data['restaurant'] ?? {};
        if (mounted) {
          setState(() {
            _name = rest['name'] ?? 'Restaurant Partner';
            if (rest['logo'] != null && rest['logo'].toString().isNotEmpty) {
               _image = rest['logo'];
            }
            _restaurantId = rest['restaurantId']?.toString() ?? rest['id']?.toString() ?? 'N/A';
            _totalOrders = data['totalOrders'] ?? 0;
            _totalRevenue = (data['totalRevenue'] ?? 0).toDouble();
            _isLoading = false;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _name = 'Restaurant Partner';
            _isLoading = false;
          });
          if (response.statusCode == 401) {
             ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Session expired. Please log out and log back in.')));
             SharedPreferences.getInstance().then((prefs) {
               prefs.clear();
               ApiConstants.clearAuthenticatedSession();
               Navigator.of(context).pushAndRemoveUntil(
                 MaterialPageRoute(builder: (context) => const LoginScreen()),
                 (Route<dynamic> route) => false,
               );
             });
          }
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
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
        ? const Center(child: CircularProgressIndicator(color: const Color(0xFF248C70)))
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
                      color: Colors.white,
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFF248C70), width: 2),
                    ),
                    child: ClipOval(
                      child: SafeImage(
                        _image,
                        height: 60,
                        width: 60,
                        fit: BoxFit.cover,
                        errorBuilder: (c, e, s) => Container(
                          height: 60, width: 60,
                          color: Colors.grey[200],
                          child: const Icon(Icons.restaurant, size: 30, color: Colors.grey),
                        )
                      ),
                    ),
                  ),
                  const SizedBox(width: 20),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _name,
                          style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF2C2C2C)),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'ID: $_restaurantId',
                          style: GoogleFonts.poppins(fontSize: 14, color: Colors.grey[600], fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Statistics Card (Earnings and Orders)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 20),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF248C70), Color(0xFF248C70)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: const [
                  BoxShadow(color: Color(0x664B9E78), blurRadius: 12, offset: Offset(0, 6))
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildStatColumn('$_totalOrders', 'Total Orders', Icons.shopping_bag_rounded),
                  Container(height: 60, width: 1, color: Colors.white30),
                  InkWell(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const RestaurantWalletScreen()),
                      );
                    },
                    child: _buildStatColumn('â‚¹${_totalRevenue.toInt()}', 'Total Earnings', Icons.account_balance_wallet_rounded),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 30),

            // Menu Options
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: const [
                    BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))
                  ],
                ),
                child: Column(
                  children: [
                    _buildMenuItem(Icons.history_rounded, 'Order History', 'Month by Month', () => Navigator.push(context, MaterialPageRoute(builder: (context) => const OrderHistoryScreen()))),
                    _buildDivider(),
                    _buildMenuItem(Icons.restaurant_menu_rounded, 'Menu Management', 'Edit your items', () => Navigator.push(context, MaterialPageRoute(builder: (context) => const MenuManagementScreen()))),
                    _buildDivider(),
                    _buildMenuItem(Icons.article_rounded, 'Terms & Conditions', 'Read our policies', () => Navigator.push(context, MaterialPageRoute(builder: (context) => const TermsConditionsScreen()))),
                    _buildDivider(),
                    _buildMenuItem(Icons.privacy_tip_rounded, 'Privacy Policy', 'Data security', () => Navigator.push(context, MaterialPageRoute(builder: (context) => const PrivacyPolicyScreen()))),
                    _buildDivider(),
                    _buildMenuItem(Icons.payment_rounded, 'Payment Policy', 'Payouts & fees', () => Navigator.push(context, MaterialPageRoute(builder: (context) => const PaymentPolicyScreen()))),
                    _buildDivider(),
                    _buildMenuItem(Icons.support_agent_rounded, 'Help & Support', 'We are here for you', () => Navigator.push(context, MaterialPageRoute(builder: (context) => const HelpSupportScreen()))),
                    _buildDivider(),
                    ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                      leading: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: Colors.red.withOpacity(0.1), shape: BoxShape.circle),
                        child: const Icon(Icons.logout_rounded, color: Colors.red),
                      ),
                      title: Text('Logout', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: Colors.red, fontSize: 16)),
                      onTap: () async {
                        final prefs = await SharedPreferences.getInstance();
                        await prefs.clear();
                        ApiConstants.clearAuthenticatedSession();
                        if (context.mounted) {
                          Navigator.of(context).pushAndRemoveUntil(
                            MaterialPageRoute(builder: (context) => const LoginScreen()),
                            (Route<dynamic> route) => false,
                          );
                        }
                      },
                    ),
                    _buildDivider(),
                    ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                      leading: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: Colors.red.withOpacity(0.1), shape: BoxShape.circle),
                        child: const Icon(Icons.delete_forever, color: Colors.red),
                      ),
                      title: Text('Delete Account', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: Colors.red, fontSize: 16)),
                      onTap: () {
                        _showDeleteAccountDialog(context);
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Technology Partner: webintegratorz technologies',
              style: GoogleFonts.poppins(color: Colors.grey, fontSize: 12),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  void _showDeleteAccountDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogContext) {
        bool isDeleting = false;
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: const Row(
                children: [
                  Icon(Icons.warning_amber_rounded, color: Colors.red),
                  SizedBox(width: 8),
                  Text('Delete Account'),
                ],
              ),
              content: const Text(
                'Are you sure you want to permanently delete your account? This action cannot be undone.',
              ),
              actions: [
                TextButton(
                  onPressed: isDeleting ? null : () => Navigator.pop(dialogContext),
                  child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
                ),
                TextButton(
                  onPressed: isDeleting
                      ? null
                      : () async {
                          setState(() => isDeleting = true);
                          try {
                            final prefs = await SharedPreferences.getInstance();
                            final token = ApiConstants.authToken;
                            
                            final response = await http.delete(
                              Uri.parse(ApiConstants.deleteAccount),
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer $token',
                              },
                            );
                            
                            if (response.statusCode == 200) {
                              await prefs.clear();
                              ApiConstants.clearAuthenticatedSession();
                              if (context.mounted) {
                                Navigator.pop(dialogContext); // Close dialog
                                Navigator.of(context).pushAndRemoveUntil(
                                  MaterialPageRoute(builder: (context) => const LoginScreen()),
                                  (Route<dynamic> route) => false,
                                );
                              }
                            } else {
                              String err = 'Failed to delete account';
                              try {
                                err = json.decode(response.body)['message'] ?? err;
                              } catch (_) {}
                              if (context.mounted) {
                                Navigator.pop(dialogContext); // Close dialog on error
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text(err)),
                                );
                              }
                            }
                          } catch (e) {
                            if (context.mounted) {
                              Navigator.pop(dialogContext); // Close dialog on error
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Error deleting account')),
                              );
                            }
                          }
                        },
                  child: isDeleting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.red),
                        )
                      : const Text('Delete', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _buildStatColumn(String value, String label, IconData icon) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: const BoxDecoration(color: Colors.white24, shape: BoxShape.circle),
          child: Icon(icon, color: Colors.white, size: 28),
        ),
        const SizedBox(height: 12),
        Text(value, style: GoogleFonts.poppins(fontSize: 26, fontWeight: FontWeight.bold, color: Colors.white)),
        Text(label, style: GoogleFonts.poppins(fontSize: 13, color: Colors.white.withOpacity(0.8))),
      ],
    );
  }

  Widget _buildMenuItem(IconData icon, String title, String subtitle, VoidCallback onTap) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: const Color(0xFF248C70).withOpacity(0.1), shape: BoxShape.circle),
        child: Icon(icon, color: const Color(0xFF248C70)),
      ),
      title: Text(title, style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: const Color(0xFF2C2C2C), fontSize: 16)),
      subtitle: Text(subtitle, style: GoogleFonts.poppins(color: Colors.grey[500], fontSize: 12)),
      trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: Colors.grey),
      onTap: onTap,
    );
  }

  Widget _buildDivider() => const Divider(height: 1, indent: 70, endIndent: 24, color: Color(0xFFEEEEEE));
}

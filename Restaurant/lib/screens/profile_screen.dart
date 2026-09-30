import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../api_constants.dart';
import '../services/restaurant_api_service.dart';
import 'restaurant_dashboard_screen.dart';
import 'order_history_screen.dart';
import 'menu_management_screen.dart';
import 'restaurant_profile_screen.dart';
import 'order_management_settings_screen.dart';
import 'notification_settings_screen.dart';
import 'pickup_orders_screen.dart';
import 'cancelled_orders_screen.dart';
import 'terms_conditions_screen.dart';
import 'privacy_policy_screen.dart';
import 'payment_policy_screen.dart';
import 'help_support_screen.dart';
import 'restaurant_relogin_screen.dart';
import 'restaurant_wallet_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _isLoading = false;
  bool _isUploadingImage = false;
  String _name = 'My Restaurant';
  String _image = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
  String _restaurantId = '';
  int _totalOrders = 0;
  double _totalRevenue = 0.0;

  @override
  void initState() {
    super.initState();
    _loadProfileData();
  }

  Future<void> _loadProfileData() async {
    final prefs = await SharedPreferences.getInstance();
    final restId = prefs.getString('restaurantId') ?? '';
    final phone = prefs.getString('userPhone') ?? '';
    final token = prefs.getString('token') ?? '';
    final storedName = prefs.getString('restaurantName') ?? '';
    final storedImage = prefs.getString('restaurantImage') ?? '';

    setState(() {
      _restaurantId = restId.isNotEmpty ? '#REST-${restId.substring(restId.length > 6 ? restId.length - 6 : 0).toUpperCase()}' : '#REST-PARTNER';
      if (storedName.isNotEmpty && storedName != 'null') {
        _name = storedName;
      }
      if (storedImage.isNotEmpty && storedImage != 'null') {
        _image = storedImage;
      }
    });

    try {
      String profileUrl = '';
      if (restId.isNotEmpty) {
        profileUrl = ApiConstants.getApprovalStatus(restId);
      } else if (phone.isNotEmpty) {
        profileUrl = ApiConstants.checkApprovalStatusByMobile(phone);
      } else if (token.isNotEmpty) {
        profileUrl = '${ApiConstants.baseUrl}/restaurants/profile';
      }

      if (profileUrl.isNotEmpty) {
        http.Response res = await http.get(
          Uri.parse(profileUrl),
          headers: {
            'Content-Type': 'application/json',
            if (token.isNotEmpty) 'Authorization': 'Bearer $token',
          },
        ).timeout(const Duration(seconds: 6));

        if (res.statusCode != 200 && token.isNotEmpty && !profileUrl.endsWith('/profile')) {
          try {
            res = await http.get(
              Uri.parse('${ApiConstants.baseUrl}/restaurants/profile'),
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer $token',
              },
            ).timeout(const Duration(seconds: 6));
          } catch (_) {}
        }

        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          final restObj = data['restaurant'] ?? data;
          String resolvedName = '';
          if (data['name'] != null && data['name'].toString().isNotEmpty) {
            final n = data['name'];
            resolvedName = (n is Map ? (n['en'] ?? '') : n).toString();
          } else if (data['restaurant'] != null && data['restaurant']['name'] != null) {
            final n = data['restaurant']['name'];
            resolvedName = (n is Map ? (n['en'] ?? '') : n).toString();
          }

          final fetchedImg = restObj['image'] ?? restObj['logo'] ?? restObj['profileImage'] ?? restObj['profilePic'];

          if (mounted) {
            setState(() {
              if (resolvedName.isNotEmpty && resolvedName != 'null') {
                _name = resolvedName;
                prefs.setString('restaurantName', resolvedName);
              }
              if (fetchedImg != null && fetchedImg.toString().isNotEmpty) {
                _image = fetchedImg.toString();
                prefs.setString('restaurantImage', _image);
              }
            });
          }
        }
      }
    } catch (_) {}

    try {
      final stats = await RestaurantApiService.getDashboardStats('all');
      if (stats['success'] == true && stats['data'] != null && mounted) {
        final d = stats['data'];
        setState(() {
          if (d['totalOrders'] != null) _totalOrders = (d['totalOrders'] as num).toInt();
          if (d['totalEarnings'] != null) _totalRevenue = (d['totalEarnings'] as num).toDouble();
        });
      }

      // Fetch total orders & revenue
      final effId = restId.isNotEmpty ? restId : phone;
      if (effId.isNotEmpty) {
        final ordersUrl = '${ApiConstants.baseUrl}/orders/restaurant/$effId';
        final oRes = await http.get(
          Uri.parse(ordersUrl),
          headers: {
            'Content-Type': 'application/json',
            if (token.isNotEmpty) 'Authorization': 'Bearer $token',
          },
        ).timeout(const Duration(seconds: 6));
        if (oRes.statusCode == 200) {
          final oData = jsonDecode(oRes.body);
          List<dynamic> list = [];
          if (oData is List) list = oData;
          else if (oData['orders'] is List) list = oData['orders'];

          double rev = 0.0;
          for (var o in list) {
            if (o != null && o is Map && o['status'] != 'cancelled' && o['status'] != 'failed') {
              final val = o['payableAmount'] ?? o['totalAmount'] ?? 0;
              rev += double.tryParse(val.toString()) ?? 0.0;
            }
          }

          if (mounted) {
            setState(() {
              _totalOrders = list.length;
              _totalRevenue = rev;
            });
          }
        }
      }
    } catch (_) {}
  }

  void _handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    ApiConstants.clearAuthenticatedSession();

    if (mounted) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => const RestaurantReloginScreen()),
        (Route<dynamic> route) => false,
      );
    }
  }

  void _showImagePickerModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Change Profile Picture',
              style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            ListTile(
              leading: const Icon(Icons.photo_library, color: Color(0xFF248C70)),
              title: Text('Choose from Gallery', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
              onTap: () {
                Navigator.pop(ctx);
                _pickAndUploadImage(ImageSource.gallery);
              },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt, color: Color(0xFF248C70)),
              title: Text('Take a Photo', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
              onTap: () {
                Navigator.pop(ctx);
                _pickAndUploadImage(ImageSource.camera);
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickAndUploadImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(source: source, imageQuality: 85);
      if (pickedFile == null) return;

      setState(() => _isUploadingImage = true);

      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token') ?? '';
      final restId = prefs.getString('restaurantId') ?? '';

      final request = http.MultipartRequest(
        'POST',
        Uri.parse('${ApiConstants.baseUrl}/upload'),
      );
      if (token.isNotEmpty) {
        request.headers['Authorization'] = 'Bearer $token';
      }
      request.files.add(await http.MultipartFile.fromPath('image', pickedFile.path));

      final streamedResponse = await request.send().timeout(const Duration(seconds: 30));
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final imageUrl = data['url'] ?? data['imageUrl'];
        if (imageUrl != null && imageUrl.toString().isNotEmpty) {
          final newUrl = imageUrl.toString();

          if (restId.isNotEmpty) {
            try {
              await http.put(
                Uri.parse('${ApiConstants.baseUrl}/restaurants/vendor/profile/$restId'),
                headers: {
                  'Content-Type': 'application/json',
                  if (token.isNotEmpty) 'Authorization': 'Bearer $token',
                },
                body: jsonEncode({
                  'image': newUrl,
                  'logo': newUrl,
                  'profilePic': newUrl,
                  'profileImage': newUrl,
                }),
              ).timeout(const Duration(seconds: 8));
            } catch (_) {}
          }

          await prefs.setString('restaurantImage', newUrl);

          if (mounted) {
            setState(() {
              _image = newUrl;
              _isUploadingImage = false;
            });
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('✅ Profile picture updated successfully!'),
                backgroundColor: Color(0xFF248C70),
              ),
            );
          }
          return;
        }
      }

      if (mounted) {
        setState(() => _isUploadingImage = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to upload image. Please try again.')),
        );
      }
    } catch (e) {
      debugPrint('Error uploading profile pic: $e');
      if (mounted) {
        setState(() => _isUploadingImage = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Error uploading profile picture')),
        );
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
                  GestureDetector(
                    onTap: _isUploadingImage ? null : _showImagePickerModal,
                    child: Stack(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(3),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: const Color(0xFF248C70), width: 2),
                          ),
                          child: CircleAvatar(
                            radius: 35,
                            backgroundColor: Colors.grey[200],
                            backgroundImage: _image.startsWith('http')
                                ? NetworkImage(_image)
                                : FileImage(File(_image)) as ImageProvider,
                            child: _isUploadingImage
                                ? const CircularProgressIndicator(color: Color(0xFF248C70), strokeWidth: 3)
                                : null,
                          ),
                        ),
                        Positioned(
                          right: 0,
                          bottom: 0,
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: const BoxDecoration(
                              color: Color(0xFF248C70),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.camera_alt, color: Colors.white, size: 14),
                          ),
                        ),
                      ],
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
                    icon: Icons.cancel_outlined,
                    title: 'Cancelled Orders',
                    subtitle: 'View all cancelled & refunded orders',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CancelledOrdersScreen())),
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

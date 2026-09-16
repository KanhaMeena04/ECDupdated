import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../api_constants.dart';
import '../theme/app_theme.dart';
import 'dashboard_screen.dart';
import 'terms_conditions_screen.dart';
import 'privacy_policy_screen.dart';

enum AuthMode { welcome, phone, otp, welcomeBack, register, registerOtp, restaurantDetails, restaurantLocation, restaurantDocuments, restaurantBankDetails, restaurantOperationalDetails, restaurantAddMenu }

class LoginScreen extends StatefulWidget {
  final bool isLoggedOut;
  const LoginScreen({super.key, this.isLoggedOut = false});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  late AuthMode _currentMode;

  // Login Controllers
  final _emailPhoneController = TextEditingController(text: 'khalid_ai@gmail.com');
  final _passwordController = TextEditingController(text: '12345678');
  final _mobileController = TextEditingController();
  final _otpController = TextEditingController();

  // Register Controllers
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _regEmailController = TextEditingController(text: 'khalid_ai@gmail.com');
  final _regMobileController = TextEditingController();
  final _regPasswordController = TextEditingController();
  final _regConfirmPasswordController = TextEditingController();

  // 6-digit Register OTP Controllers & Focus Nodes
  final List<TextEditingController> _regOtpControllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _regOtpFocusNodes = List.generate(6, (_) => FocusNode());

  // Restaurant Details Controllers
  final _tradeNameController = TextEditingController();
  final _restaurantTypeController = TextEditingController();
  final _cuisineTypeController = TextEditingController();
  final _aboutRestaurantController = TextEditingController();

  // Location Controllers
  final _addressController = TextEditingController(text: 'Shop 12, Main Market, Subhash Chowk');
  final _areaController = TextEditingController(text: 'Subhash Chowk');
  final _cityController = TextEditingController(text: 'Sohna, Gurugram');

  // Documents Controllers (GST replaces VAT per user request)
  final _tradeLicenseController = TextEditingController(text: 'TRD-SO-2026-88492');
  final _gstNumberController = TextEditingController(text: '07AAAAA0000A1Z5');
  String? _uploadedTradeLicenseDoc;
  String? _uploadedGstDoc;

  // Bank Details Controllers
  final _accountHolderController = TextEditingController(text: 'Khalid AI Restaurant');
  final _bankNameController = TextEditingController(text: 'HDFC Bank');
  final _accountNumberController = TextEditingController(text: '50100294819482');
  final _ifscCodeController = TextEditingController(text: 'HDFC0001294');

  // Operational Details State Variables (Step 5)
  bool _masterHoursEnabled = true;
  final List<Map<String, dynamic>> _daysSchedule = [
    {'day': 'Monday', 'enabled': true, 'from': '09:00 AM', 'to': '05:30 PM'},
    {'day': 'Tuesday', 'enabled': true, 'from': '09:00 AM', 'to': '05:30 PM'},
    {'day': 'Wednesday', 'enabled': true, 'from': '09:00 AM', 'to': '05:30 PM'},
    {'day': 'Thursday', 'enabled': true, 'from': '09:00 AM', 'to': '05:30 PM'},
    {'day': 'Friday', 'enabled': true, 'from': '09:00 AM', 'to': '05:30 PM'},
    {'day': 'Saturday', 'enabled': false, 'from': 'Closed', 'to': 'Closed'},
    {'day': 'Sunday', 'enabled': false, 'from': 'Closed', 'to': 'Closed'},
  ];

  // Add Menu Controllers & State (Step 6)
  final _menuItemNameController = TextEditingController(text: 'Special Paneer Tikka');
  final _menuBasePriceController = TextEditingController(text: '260');
  final _menuDescriptionController = TextEditingController(text: 'Cottage cheese marinated in yogurt and Indian spices, grilled to perfection in a tandoor.');
  String _selectedMenuCategory = 'Starters';
  String _selectedFoodType = 'Veg';
  String? _uploadedMenuItemImage;
  final List<String> _flavourVariants = ['Paneer Tikka Special', 'Garlic Butter'];
  final List<String> _addOnsList = ['Extra Mint Chutney'];

  final List<String> _restaurantImages = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500',
    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=500',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=500',
    'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=500',
  ];

  bool _isPasswordObscured = true;
  bool _isRegPasswordObscured = true;
  bool _isRegConfirmPasswordObscured = true;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _currentMode = widget.isLoggedOut ? AuthMode.welcomeBack : AuthMode.welcome;
  }

  @override
  void dispose() {
    _tradeNameController.dispose();
    _restaurantTypeController.dispose();
    _cuisineTypeController.dispose();
    _aboutRestaurantController.dispose();
    _addressController.dispose();
    _areaController.dispose();
    _cityController.dispose();
    _tradeLicenseController.dispose();
    _gstNumberController.dispose();
    _accountHolderController.dispose();
    _bankNameController.dispose();
    _accountNumberController.dispose();
    _ifscCodeController.dispose();
    _menuItemNameController.dispose();
    _menuBasePriceController.dispose();
    _menuDescriptionController.dispose();
    for (var c in _regOtpControllers) {
      c.dispose();
    }
    for (var f in _regOtpFocusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  Future<void> _handlePasswordLogin() async {
    final emailPhone = _emailPhoneController.text.trim();
    if (emailPhone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your email or phone number'), backgroundColor: Colors.red),
      );
      return;
    }

    if (_passwordController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your password'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 400));

    const restaurantId = "mock_restaurant_123";
    const token = "mock_token_123";

    ApiConstants.setAuthenticatedSession(
      restaurantId: restaurantId,
      authToken: token,
    );

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('restaurantId', restaurantId);
    await prefs.setString('token', token);

    if (mounted) {
      setState(() => _isLoading = false);
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const DashboardScreen()),
      );
    }
  }

  Future<void> _handleRegister() async {
    final firstName = _firstNameController.text.trim();
    final lastName = _lastNameController.text.trim();
    final email = _regEmailController.text.trim();
    final mobile = _regMobileController.text.trim();
    final password = _regPasswordController.text.trim();
    final confirmPassword = _regConfirmPasswordController.text.trim();

    if (firstName.isEmpty || lastName.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your First and Last name'), backgroundColor: Colors.red),
      );
      return;
    }

    if (email.isEmpty || !email.contains('@')) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid email address'), backgroundColor: Colors.red),
      );
      return;
    }

    if (mobile.length != 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 10-digit mobile number'), backgroundColor: Colors.red),
      );
      return;
    }

    if (password.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password must be at least 6 characters'), backgroundColor: Colors.red),
      );
      return;
    }

    if (password != confirmPassword) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Passwords do not match'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 300));

    if (mounted) {
      setState(() {
        _isLoading = false;
        _currentMode = AuthMode.registerOtp;
        _regOtpControllers[0].text = '5'; // Match reference image digit 5 in first box
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('6-Digit Verification Code sent to your Email/SMS! (Mock OTP: 512345)'), backgroundColor: AppTheme.primaryGreen),
      );
    }
  }

  Future<void> _handleVerifyRegisterOtp() async {
    final otpCode = _regOtpControllers.map((c) => c.text.trim()).join();
    if (otpCode.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter full 6-digit OTP code'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 300));

    if (mounted) {
      setState(() {
        _isLoading = false;
        _currentMode = AuthMode.restaurantDetails;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('OTP Verified Successfully! Please fill in your Restaurant Details.'), backgroundColor: AppTheme.primaryGreen),
      );
    }
  }

  Future<void> _handleSaveRestaurantDetails() async {
    final tradeName = _tradeNameController.text.trim();
    if (tradeName.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your Restaurant Trade Name'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 300));

    if (mounted) {
      setState(() {
        _isLoading = false;
        _currentMode = AuthMode.restaurantLocation;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Step 1 Saved! Step 2: Please enter your Location details.'), backgroundColor: AppTheme.primaryGreen),
      );
    }
  }

  Future<void> _handleSaveRestaurantLocation() async {
    final address = _addressController.text.trim();
    if (address.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your Restaurant Address'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 300));

    if (mounted) {
      setState(() {
        _isLoading = false;
        _currentMode = AuthMode.restaurantDocuments;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Location Saved! Step 3: Please upload your Restaurant Documents.'), backgroundColor: AppTheme.primaryGreen),
      );
    }
  }

  Future<void> _handleSaveRestaurantDocuments() async {
    final tradeLicense = _tradeLicenseController.text.trim();
    final gst = _gstNumberController.text.trim();

    if (tradeLicense.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your Trade License Number'), backgroundColor: Colors.red),
      );
      return;
    }

    if (gst.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your GST Registration Number'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 300));

    if (mounted) {
      setState(() {
        _isLoading = false;
        _currentMode = AuthMode.restaurantBankDetails;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Documents Saved! Step 4: Please enter your Bank Details.'), backgroundColor: AppTheme.primaryGreen),
      );
    }
  }

  Future<void> _handleSaveRestaurantBankDetails() async {
    final holderName = _accountHolderController.text.trim();
    final bankName = _bankNameController.text.trim();
    final accountNumber = _accountNumberController.text.trim();
    final ifsc = _ifscCodeController.text.trim();

    if (holderName.isEmpty || bankName.isEmpty || accountNumber.isEmpty || ifsc.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all Bank Details fields'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 300));

    if (mounted) {
      setState(() {
        _isLoading = false;
        _currentMode = AuthMode.restaurantOperationalDetails;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Bank Details Saved! Step 5: Please configure Operational Details.'), backgroundColor: AppTheme.primaryGreen),
      );
    }
  }

  Future<void> _handleSaveRestaurantOperationalDetails() async {
    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 300));

    if (mounted) {
      setState(() {
        _isLoading = false;
        _currentMode = AuthMode.restaurantAddMenu;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Operational Details Saved! Step 6: Please add Menu Items.'), backgroundColor: AppTheme.primaryGreen),
      );
    }
  }

  Future<void> _handleSaveRestaurantAddMenu() async {
    final itemName = _menuItemNameController.text.trim();
    final price = _menuBasePriceController.text.trim();

    if (itemName.isEmpty || price.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter Item Name and Price'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 400));

    const restaurantId = "mock_restaurant_reg";
    const token = "mock_token_reg";

    ApiConstants.setAuthenticatedSession(
      restaurantId: restaurantId,
      authToken: token,
    );

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('restaurantId', restaurantId);
    await prefs.setString('token', token);

    if (mounted) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Menu Item Added & Registration Completed Successfully! Welcome to ECDKART Partner.'), backgroundColor: AppTheme.primaryGreen),
      );
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const DashboardScreen()),
      );
    }
  }

  Future<void> _handleSendOtp() async {
    final phone = _mobileController.text.trim();
    if (phone.length != 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Phone number must be exactly 10 digits'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 300));
    if (mounted) {
      setState(() {
        _isLoading = false;
        _currentMode = AuthMode.otp;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('OTP sent successfully! (Mock OTP: 123456)'), backgroundColor: AppTheme.primaryGreen),
      );
    }
  }

  Future<void> _handleVerifyOtp() async {
    final otp = _otpController.text.trim();
    if (otp.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the OTP'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 400));

    const restaurantId = "mock_restaurant_123";
    const token = "mock_token_123";

    ApiConstants.setAuthenticatedSession(
      restaurantId: restaurantId,
      authToken: token,
    );

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('restaurantId', restaurantId);
    await prefs.setString('token', token);

    if (mounted) {
      setState(() => _isLoading = false);
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const DashboardScreen()),
      );
    }
  }

  Future<void> _handleGoogleSignIn() async {
    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 400));
    const restaurantId = "mock_restaurant_google";
    const token = "mock_token_google";

    ApiConstants.setAuthenticatedSession(
      restaurantId: restaurantId,
      authToken: token,
    );

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('restaurantId', restaurantId);
    await prefs.setString('token', token);

    if (mounted) {
      setState(() => _isLoading = false);
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const DashboardScreen()),
      );
    }
  }

  void _showForgotPasswordDialog() {
    final forgotController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Reset Password', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Enter your registered email or phone number to receive a password reset link.', style: GoogleFonts.poppins(fontSize: 13, color: Colors.grey[700])),
            const SizedBox(height: 16),
            TextField(
              controller: forgotController,
              decoration: InputDecoration(
                hintText: 'Enter email or phone...',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Password reset link sent!'), backgroundColor: AppTheme.primaryGreen),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen),
            child: const Text('Send Link', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showImageSourceDialog() {
    if (_restaurantImages.length >= 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maximum 6 photos allowed'), backgroundColor: Colors.red),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Add Restaurant Photo',
                  style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.darkBlack),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, color: Colors.grey),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.camera_alt_rounded, color: AppTheme.primaryGreen),
              ),
              title: Text('Live Capture Image', style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 14)),
              subtitle: Text('Take a live photo using device camera', style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600])),
              onTap: () {
                Navigator.pop(ctx);
                setState(() {
                  _restaurantImages.add('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500');
                });
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Live camera photo captured!'), backgroundColor: AppTheme.primaryGreen),
                );
              },
            ),
            const Divider(),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.photo_library_rounded, color: AppTheme.primaryGreen),
              ),
              title: Text('Upload from Device Gallery', style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 14)),
              subtitle: Text('Pick photo from your device storage', style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600])),
              onTap: () {
                Navigator.pop(ctx);
                setState(() {
                  _restaurantImages.add('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500');
                });
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Photo uploaded from gallery!'), backgroundColor: AppTheme.primaryGreen),
                );
              },
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  void _showAddFlavourVariantBottomSheet() {
    final flavourController = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Floating Circle Close Button 'X' above bottom sheet (Matching reference design!)
              GestureDetector(
                onTap: () => Navigator.pop(ctx),
                child: Container(
                  width: 42,
                  height: 42,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black26,
                        blurRadius: 10,
                        offset: Offset(0, 4),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.close_rounded,
                    color: AppTheme.darkBlack,
                    size: 24,
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // Bottom Sheet Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Add Flavour Variants (Optional)',
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.darkBlack,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Optional: Add flavour options that customers can choose from',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Flavour Name Label
                    _buildFormLabel('Flavour Name'),
                    const SizedBox(height: 6),
                    _buildCustomTextField(
                      controller: flavourController,
                      hintText: 'Enter Flavour name',
                    ),

                    const SizedBox(height: 28),

                    // Primary Green Add Button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: () {
                          final name = flavourController.text.trim();
                          if (name.isNotEmpty) {
                            setState(() {
                              _flavourVariants.add(name);
                            });
                            Navigator.pop(ctx);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Flavour variant "$name" added!'),
                                backgroundColor: AppTheme.primaryGreen,
                              ),
                            );
                          } else {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Please enter a flavour name'),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryGreen,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: Text(
                          'Add',
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showAddAddOnBottomSheet() {
    final addOnNameController = TextEditingController();
    final addOnPriceController = TextEditingController();
    String? uploadedAddOnDoc;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(ctx).viewInsets.bottom,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Floating Circle Close Button 'X' above bottom sheet (Matching reference design!)
                  GestureDetector(
                    onTap: () => Navigator.pop(ctx),
                    child: Container(
                      width: 42,
                      height: 42,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black26,
                            blurRadius: 10,
                            offset: Offset(0, 4),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.close_rounded,
                        color: AppTheme.darkBlack,
                        size: 24,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Bottom Sheet Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Add Add-ons (Optional)',
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.darkBlack,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Optional: Add flavour options that customers can choose from',
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Upload Image Card
                        GestureDetector(
                          onTap: () {
                            setModalState(() {
                              uploadedAddOnDoc = 'addon_image.jpg';
                            });
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Add-on Image Uploaded Successfully!'), backgroundColor: AppTheme.primaryGreen),
                            );
                          },
                          child: Container(
                            width: double.infinity,
                            height: 90,
                            decoration: BoxDecoration(
                              color: const Color(0xFFF9FAFB),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: uploadedAddOnDoc != null ? AppTheme.primaryGreen : Colors.grey[350]!,
                                width: 1.5,
                              ),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  uploadedAddOnDoc != null ? Icons.check_circle_rounded : Icons.upload_outlined,
                                  color: uploadedAddOnDoc != null ? AppTheme.primaryGreen : Colors.grey[600],
                                  size: 24,
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  uploadedAddOnDoc != null ? 'Image Uploaded: $uploadedAddOnDoc' : 'Upload Image',
                                  style: GoogleFonts.poppins(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: uploadedAddOnDoc != null ? AppTheme.primaryGreen : Colors.grey[600],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Add-on Name Label
                        _buildFormLabel('Add-on Name'),
                        const SizedBox(height: 6),
                        _buildCustomTextField(
                          controller: addOnNameController,
                          hintText: 'Enter Flavour name',
                        ),

                        const SizedBox(height: 16),

                        // Base Price Label
                        _buildFormLabel('Base Price'),
                        const SizedBox(height: 6),
                        _buildCustomTextField(
                          controller: addOnPriceController,
                          hintText: 'Enter price',
                          keyboardType: TextInputType.number,
                        ),

                        const SizedBox(height: 28),

                        // Primary Green Add Button
                        SizedBox(
                          width: double.infinity,
                          height: 52,
                          child: ElevatedButton(
                            onPressed: () {
                              final name = addOnNameController.text.trim();
                              final price = addOnPriceController.text.trim();
                              if (name.isNotEmpty) {
                                final label = price.isNotEmpty ? '$name (+₹$price)' : name;
                                setState(() {
                                  _addOnsList.add(label);
                                });
                                Navigator.pop(ctx);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Add-on "$label" added!'),
                                    backgroundColor: AppTheme.primaryGreen,
                                  ),
                                );
                              } else {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Please enter an add-on name'),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                              }
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primaryGreen,
                              foregroundColor: Colors.white,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            child: Text(
                              'Add',
                              style: GoogleFonts.poppins(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  String _getHeaderImageAsset() {
    switch (_currentMode) {
      case AuthMode.phone:
      case AuthMode.otp:
        return 'assets/images/restaurant_otp_header.jpg';
      case AuthMode.welcomeBack:
        return 'assets/images/restaurant_login_header.jpg';
      case AuthMode.restaurantLocation:
        return 'assets/images/restaurant_nonveg_header.jpg';
      case AuthMode.restaurantDocuments:
        return 'assets/images/restaurant_handibiryani_header.jpg';
      case AuthMode.restaurantBankDetails:
        return 'assets/images/restaurant_daltadka_header.jpg';
      case AuthMode.restaurantOperationalDetails:
        return 'assets/images/restaurant_chinese_header.jpg';
      case AuthMode.restaurantAddMenu:
        return 'assets/images/restaurant_paneertikka_header.jpg';
      case AuthMode.register:
      case AuthMode.registerOtp:
      case AuthMode.restaurantDetails:
      case AuthMode.welcome:
        return 'assets/images/restaurant_header_bg.jpg';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Top Header Section
            if (_currentMode == AuthMode.restaurantAddMenu) ...[
              // Restaurant Add Menu Header (Step 6: Leg piece background, back arrow, progress bar with step 1..6 green, title 'Add Menu' & badge '6')
              Stack(
                children: [
                  Container(
                    height: 220,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppTheme.offWhiteBg,
                      image: DecorationImage(
                        image: AssetImage(_getHeaderImageAsset()),
                        fit: BoxFit.cover,
                      ),
                    ),
                    child: Container(
                      padding: const EdgeInsets.fromLTRB(20, 44, 20, 16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          stops: const [0.0, 0.45, 0.80, 1.0],
                          colors: [
                            Colors.black.withValues(alpha: 0.3),
                            Colors.white.withValues(alpha: 0.4),
                            Colors.white,
                            Colors.white,
                          ],
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Back Arrow Button (returns to Step 5: restaurantOperationalDetails)
                          CircleAvatar(
                            backgroundColor: Colors.white,
                            radius: 18,
                            child: IconButton(
                              padding: EdgeInsets.zero,
                              icon: const Icon(Icons.arrow_back_rounded, color: AppTheme.darkBlack, size: 20),
                              onPressed: () {
                                setState(() {
                                  _currentMode = AuthMode.restaurantOperationalDetails;
                                });
                              },
                            ),
                          ),
                          const SizedBox(height: 12),

                          // 6 Step Progress Indicator Bar (ABOVE Title - All 6 Steps Green!)
                          Row(
                            children: List.generate(6, (index) {
                              return Expanded(
                                child: Container(
                                  margin: EdgeInsets.only(right: index == 5 ? 0 : 6),
                                  height: 5,
                                  decoration: BoxDecoration(
                                    color: AppTheme.primaryGreen,
                                    borderRadius: BorderRadius.circular(3),
                                  ),
                                ),
                              );
                            }),
                          ),
                          const SizedBox(height: 14),

                          // Title & Step 6 Badge Circle (BELOW Progress Line)
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Add Menu',
                                style: GoogleFonts.poppins(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.darkBlack,
                                ),
                              ),
                              Container(
                                width: 36,
                                height: 36,
                                decoration: const BoxDecoration(
                                  color: AppTheme.primaryGreen,
                                  shape: BoxShape.circle,
                                ),
                                child: Center(
                                  child: Text(
                                    '6',
                                    style: GoogleFonts.poppins(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ] else if (_currentMode == AuthMode.restaurantOperationalDetails) ...[
              // Restaurant Operational Details Header (Step 5: Chinese food background, back arrow, progress bar with step 1..5 green, title 'Operational Details' & badge '5')
              Stack(
                children: [
                  Container(
                    height: 220,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppTheme.offWhiteBg,
                      image: DecorationImage(
                        image: AssetImage(_getHeaderImageAsset()),
                        fit: BoxFit.cover,
                      ),
                    ),
                    child: Container(
                      padding: const EdgeInsets.fromLTRB(20, 44, 20, 16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          stops: const [0.0, 0.45, 0.80, 1.0],
                          colors: [
                            Colors.black.withValues(alpha: 0.3),
                            Colors.white.withValues(alpha: 0.4),
                            Colors.white,
                            Colors.white,
                          ],
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Back Arrow Button (returns to Step 4: restaurantBankDetails)
                          CircleAvatar(
                            backgroundColor: Colors.white,
                            radius: 18,
                            child: IconButton(
                              padding: EdgeInsets.zero,
                              icon: const Icon(Icons.arrow_back_rounded, color: AppTheme.darkBlack, size: 20),
                              onPressed: () {
                                setState(() {
                                  _currentMode = AuthMode.restaurantBankDetails;
                                });
                              },
                            ),
                          ),
                          const SizedBox(height: 12),

                          // 6 Step Progress Indicator Bar (ABOVE Title - Step 1, 2, 3, 4 & 5 Green!)
                          Row(
                            children: List.generate(6, (index) {
                              return Expanded(
                                child: Container(
                                  margin: EdgeInsets.only(right: index == 5 ? 0 : 6),
                                  height: 5,
                                  decoration: BoxDecoration(
                                    color: (index <= 4) ? AppTheme.primaryGreen : Colors.black.withValues(alpha: 0.8),
                                    borderRadius: BorderRadius.circular(3),
                                  ),
                                ),
                              );
                            }),
                          ),
                          const SizedBox(height: 14),

                          // Title & Step 5 Badge Circle (BELOW Progress Line)
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Operational Details',
                                style: GoogleFonts.poppins(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.darkBlack,
                                ),
                              ),
                              Container(
                                width: 36,
                                height: 36,
                                decoration: const BoxDecoration(
                                  color: AppTheme.primaryGreen,
                                  shape: BoxShape.circle,
                                ),
                                child: Center(
                                  child: Text(
                                    '5',
                                    style: GoogleFonts.poppins(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ] else if (_currentMode == AuthMode.restaurantBankDetails) ...[
              // Restaurant Bank Details Header (Step 4: Dal Tadka background, back arrow, progress bar with step 1, 2, 3 & 4 green, title 'Bank Details' & badge '4')
              Stack(
                children: [
                  Container(
                    height: 220,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppTheme.offWhiteBg,
                      image: DecorationImage(
                        image: AssetImage(_getHeaderImageAsset()),
                        fit: BoxFit.cover,
                      ),
                    ),
                    child: Container(
                      padding: const EdgeInsets.fromLTRB(20, 44, 20, 16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          stops: const [0.0, 0.45, 0.80, 1.0],
                          colors: [
                            Colors.black.withValues(alpha: 0.3),
                            Colors.white.withValues(alpha: 0.4),
                            Colors.white,
                            Colors.white,
                          ],
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Back Arrow Button (returns to Step 3: restaurantDocuments)
                          CircleAvatar(
                            backgroundColor: Colors.white,
                            radius: 18,
                            child: IconButton(
                              padding: EdgeInsets.zero,
                              icon: const Icon(Icons.arrow_back_rounded, color: AppTheme.darkBlack, size: 20),
                              onPressed: () {
                                setState(() {
                                  _currentMode = AuthMode.restaurantDocuments;
                                });
                              },
                            ),
                          ),
                          const SizedBox(height: 12),

                          // 6 Step Progress Indicator Bar (ABOVE Title - Step 1, 2, 3 & 4 Green!)
                          Row(
                            children: List.generate(6, (index) {
                              return Expanded(
                                child: Container(
                                  margin: EdgeInsets.only(right: index == 5 ? 0 : 6),
                                  height: 5,
                                  decoration: BoxDecoration(
                                    color: (index == 0 || index == 1 || index == 2 || index == 3) ? AppTheme.primaryGreen : Colors.black.withValues(alpha: 0.8),
                                    borderRadius: BorderRadius.circular(3),
                                  ),
                                ),
                              );
                            }),
                          ),
                          const SizedBox(height: 14),

                          // Title & Step 4 Badge Circle (BELOW Progress Line)
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Bank Details',
                                style: GoogleFonts.poppins(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.darkBlack,
                                ),
                              ),
                              Container(
                                width: 36,
                                height: 36,
                                decoration: const BoxDecoration(
                                  color: AppTheme.primaryGreen,
                                  shape: BoxShape.circle,
                                ),
                                child: Center(
                                  child: Text(
                                    '4',
                                    style: GoogleFonts.poppins(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ] else if (_currentMode == AuthMode.restaurantDocuments) ...[
              // Restaurant Documents Header (Step 3: Handi Biryani background, back arrow, progress bar with step 1, 2 & 3 green, title 'Documents' & badge '3')
              Stack(
                children: [
                  Container(
                    height: 220,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppTheme.offWhiteBg,
                      image: DecorationImage(
                        image: AssetImage(_getHeaderImageAsset()),
                        fit: BoxFit.cover,
                      ),
                    ),
                    child: Container(
                      padding: const EdgeInsets.fromLTRB(20, 44, 20, 16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          stops: const [0.0, 0.45, 0.80, 1.0],
                          colors: [
                            Colors.black.withValues(alpha: 0.3),
                            Colors.white.withValues(alpha: 0.4),
                            Colors.white,
                            Colors.white,
                          ],
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Back Arrow Button (returns to Step 2: restaurantLocation)
                          CircleAvatar(
                            backgroundColor: Colors.white,
                            radius: 18,
                            child: IconButton(
                              padding: EdgeInsets.zero,
                              icon: const Icon(Icons.arrow_back_rounded, color: AppTheme.darkBlack, size: 20),
                              onPressed: () {
                                setState(() {
                                  _currentMode = AuthMode.restaurantLocation;
                                });
                              },
                            ),
                          ),
                          const SizedBox(height: 12),

                          // 6 Step Progress Indicator Bar (ABOVE Title - Step 1, 2 & 3 Green!)
                          Row(
                            children: List.generate(6, (index) {
                              return Expanded(
                                child: Container(
                                  margin: EdgeInsets.only(right: index == 5 ? 0 : 6),
                                  height: 5,
                                  decoration: BoxDecoration(
                                    color: (index == 0 || index == 1 || index == 2) ? AppTheme.primaryGreen : Colors.black.withValues(alpha: 0.8),
                                    borderRadius: BorderRadius.circular(3),
                                  ),
                                ),
                              );
                            }),
                          ),
                          const SizedBox(height: 14),

                          // Title & Step 3 Badge Circle (BELOW Progress Line)
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Documents',
                                style: GoogleFonts.poppins(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.darkBlack,
                                ),
                              ),
                              Container(
                                width: 36,
                                height: 36,
                                decoration: const BoxDecoration(
                                  color: AppTheme.primaryGreen,
                                  shape: BoxShape.circle,
                                ),
                                child: Center(
                                  child: Text(
                                    '3',
                                    style: GoogleFonts.poppins(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ] else if (_currentMode == AuthMode.restaurantLocation) ...[
              // Restaurant Location Header (Step 2: Non-veg dish background, back arrow, progress bar with step 1 & 2 green, title & badge '2')
              Stack(
                children: [
                  Container(
                    height: 220,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppTheme.offWhiteBg,
                      image: DecorationImage(
                        image: AssetImage(_getHeaderImageAsset()),
                        fit: BoxFit.cover,
                      ),
                    ),
                    child: Container(
                      padding: const EdgeInsets.fromLTRB(20, 44, 20, 16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          stops: const [0.0, 0.45, 0.80, 1.0],
                          colors: [
                            Colors.black.withValues(alpha: 0.3),
                            Colors.white.withValues(alpha: 0.4),
                            Colors.white,
                            Colors.white,
                          ],
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Back Arrow Button (returns to Step 1: restaurantDetails)
                          CircleAvatar(
                            backgroundColor: Colors.white,
                            radius: 18,
                            child: IconButton(
                              padding: EdgeInsets.zero,
                              icon: const Icon(Icons.arrow_back_rounded, color: AppTheme.darkBlack, size: 20),
                              onPressed: () {
                                setState(() {
                                  _currentMode = AuthMode.restaurantDetails;
                                });
                              },
                            ),
                          ),
                          const SizedBox(height: 12),

                          // 6 Step Progress Indicator Bar (ABOVE Title - Step 1 & 2 Green!)
                          Row(
                            children: List.generate(6, (index) {
                              return Expanded(
                                child: Container(
                                  margin: EdgeInsets.only(right: index == 5 ? 0 : 6),
                                  height: 5,
                                  decoration: BoxDecoration(
                                    color: (index == 0 || index == 1) ? AppTheme.primaryGreen : Colors.black.withValues(alpha: 0.8),
                                    borderRadius: BorderRadius.circular(3),
                                  ),
                                ),
                              );
                            }),
                          ),
                          const SizedBox(height: 14),

                          // Title & Step 2 Badge Circle (BELOW Progress Line)
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Location',
                                style: GoogleFonts.poppins(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.darkBlack,
                                ),
                              ),
                              Container(
                                width: 36,
                                height: 36,
                                decoration: const BoxDecoration(
                                  color: AppTheme.primaryGreen,
                                  shape: BoxShape.circle,
                                ),
                                child: Center(
                                  child: Text(
                                    '2',
                                    style: GoogleFonts.poppins(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ] else if (_currentMode == AuthMode.restaurantDetails) ...[
              // Restaurant Details Header (Matching reference design with food background, back arrow, title, step 1 badge & progress bar)
              Stack(
                children: [
                  Container(
                    height: 220,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppTheme.offWhiteBg,
                      image: DecorationImage(
                        image: AssetImage(_getHeaderImageAsset()),
                        fit: BoxFit.cover,
                      ),
                    ),
                    child: Container(
                      padding: const EdgeInsets.fromLTRB(20, 44, 20, 16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          stops: const [0.0, 0.45, 0.80, 1.0],
                          colors: [
                            Colors.black.withValues(alpha: 0.3),
                            Colors.white.withValues(alpha: 0.4),
                            Colors.white,
                            Colors.white,
                          ],
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Back Arrow Button
                          CircleAvatar(
                            backgroundColor: Colors.white,
                            radius: 18,
                            child: IconButton(
                              padding: EdgeInsets.zero,
                              icon: const Icon(Icons.arrow_back_rounded, color: AppTheme.darkBlack, size: 20),
                              onPressed: () {
                                setState(() {
                                  _currentMode = AuthMode.registerOtp;
                                });
                              },
                            ),
                          ),
                          const SizedBox(height: 12),

                          // 6 Step Progress Indicator Bar (ABOVE Title)
                          Row(
                            children: List.generate(6, (index) {
                              return Expanded(
                                child: Container(
                                  margin: EdgeInsets.only(right: index == 5 ? 0 : 6),
                                  height: 5,
                                  decoration: BoxDecoration(
                                    color: index == 0 ? AppTheme.primaryGreen : Colors.black.withValues(alpha: 0.8),
                                    borderRadius: BorderRadius.circular(3),
                                  ),
                                ),
                              );
                            }),
                          ),
                          const SizedBox(height: 14),

                          // Title & Step 1 Badge Circle (BELOW Progress Bar Line)
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Restaurant Details',
                                style: GoogleFonts.poppins(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.darkBlack,
                                ),
                              ),
                              Container(
                                width: 36,
                                height: 36,
                                decoration: const BoxDecoration(
                                  color: AppTheme.primaryGreen,
                                  shape: BoxShape.circle,
                                ),
                                child: Center(
                                  child: Text(
                                    '1',
                                    style: GoogleFonts.poppins(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ] else if (_currentMode == AuthMode.registerOtp) ...[
              // Professional Security / OTP Graphic Header (Non-food, sleek security theme)
              Container(
                height: 220,
                width: double.infinity,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFF1E3A34),
                      Color(0xFF248C70),
                      Color(0xFF1A5A4A),
                    ],
                  ),
                ),
                child: Stack(
                  children: [
                    // Security Grid Graphic Accents
                    Positioned(
                      top: -40,
                      right: -40,
                      child: Container(
                        width: 180,
                        height: 180,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withValues(alpha: 0.05),
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: -30,
                      left: -20,
                      child: Container(
                        width: 140,
                        height: 140,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppTheme.primaryGreen.withValues(alpha: 0.15),
                        ),
                      ),
                    ),

                    // Back Arrow Button (matching reference UI top left)
                    Positioned(
                      top: 44,
                      left: 16,
                      child: CircleAvatar(
                        backgroundColor: Colors.white,
                        radius: 20,
                        child: IconButton(
                          icon: const Icon(Icons.arrow_back_rounded, color: AppTheme.darkBlack, size: 20),
                          onPressed: () {
                            setState(() {
                              _currentMode = AuthMode.register;
                            });
                          },
                        ),
                      ),
                    ),

                    // Floating 3D Professional Security Shield & Lock Badge
                    Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const SizedBox(height: 20),
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.15),
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white.withValues(alpha: 0.3), width: 2),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.2),
                                  blurRadius: 20,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            child: Container(
                              padding: const EdgeInsets.all(14),
                              decoration: const BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.verified_user_rounded,
                                color: AppTheme.primaryGreen,
                                size: 42,
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryGreen,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              'ENCRYPTED VERIFICATION',
                              style: GoogleFonts.poppins(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                                letterSpacing: 1.2,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ] else ...[
              // Standard Food/Brand Header with Overlay Badge
              Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.bottomCenter,
                children: [
                  Container(
                    height: 220,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppTheme.offWhiteBg,
                      image: DecorationImage(
                        image: AssetImage(_getHeaderImageAsset()),
                        fit: BoxFit.cover,
                      ),
                    ),
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          stops: const [0.0, 0.45, 0.80, 1.0],
                          colors: [
                            Colors.black.withValues(alpha: 0.15),
                            Colors.white.withValues(alpha: 0.4),
                            Colors.white,
                            Colors.white,
                          ],
                        ),
                      ),
                    ),
                  ),

                  // Back Button
                  if (_currentMode == AuthMode.phone || _currentMode == AuthMode.otp || _currentMode == AuthMode.register)
                    Positioned(
                      top: 40,
                      left: 16,
                      child: CircleAvatar(
                        backgroundColor: Colors.white,
                        child: IconButton(
                          icon: const Icon(Icons.arrow_back_rounded, color: AppTheme.darkBlack),
                          onPressed: () {
                            setState(() {
                              if (_currentMode == AuthMode.otp) {
                                _currentMode = AuthMode.phone;
                                _otpController.clear();
                              } else if (_currentMode == AuthMode.register) {
                                _currentMode = AuthMode.welcomeBack;
                              } else {
                                _currentMode = AuthMode.welcome;
                              }
                            });
                          },
                        ),
                      ),
                    ),

                  // Official Loading Page Logo Badge (splash_logo.png)
                  Positioned(
                    bottom: -28,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppTheme.primaryGreen, width: 2),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.12),
                            blurRadius: 16,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: _buildEcdkartLogoText(fontSize: 22),
                    ),
                  ),
                ],
              ),
            ],

            const SizedBox(height: 44),

            // Form Section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // MODE 12: RESTAURANT ONBOARDING STEP 6 - ADD MENU (MATCHING REFERENCE UI)
                  if (_currentMode == AuthMode.restaurantAddMenu) ...[
                    // Item Name Field
                    _buildFormLabel('Item Name'),
                    const SizedBox(height: 6),
                    _buildCustomTextField(
                      controller: _menuItemNameController,
                      hintText: 'Enter Item Name',
                    ),

                    const SizedBox(height: 16),

                    // Upload Item Image Card (Dashed Border Card with Upload Icon)
                    GestureDetector(
                      onTap: () {
                        setState(() {
                          _uploadedMenuItemImage = 'legpiece_item.jpg';
                        });
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Item Image Uploaded Successfully!'), backgroundColor: AppTheme.primaryGreen),
                        );
                      },
                      child: Container(
                        width: double.infinity,
                        height: 100,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF9FAFB),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: _uploadedMenuItemImage != null ? AppTheme.primaryGreen : Colors.grey[350]!,
                            width: 1.5,
                          ),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              _uploadedMenuItemImage != null ? Icons.check_circle_rounded : Icons.upload_outlined,
                              color: _uploadedMenuItemImage != null ? AppTheme.primaryGreen : Colors.grey[600],
                              size: 26,
                            ),
                            const SizedBox(height: 6),
                            Text(
                              _uploadedMenuItemImage != null ? 'Image Uploaded: $_uploadedMenuItemImage' : 'Upload Item Image',
                              style: GoogleFonts.poppins(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: _uploadedMenuItemImage != null ? AppTheme.primaryGreen : Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Category Dropdown/Selector
                    _buildFormLabel('Category'),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey[300]!),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedMenuCategory,
                          isExpanded: true,
                          icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppTheme.darkBlack),
                          items: ['Starters', 'Main Course', 'Fast Food', 'Beverages', 'Desserts'].map((String cat) {
                            return DropdownMenuItem<String>(
                              value: cat,
                              child: Text(cat, style: GoogleFonts.poppins(fontSize: 14, color: AppTheme.darkBlack)),
                            );
                          }).toList(),
                          onChanged: (String? val) {
                            if (val != null) {
                              setState(() => _selectedMenuCategory = val);
                            }
                          },
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Food Type (Veg vs Non-Veg Pill Toggle with Green Active State)
                    Row(
                      children: [
                        Text('Food Type', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.darkBlack)),
                        const Spacer(),
                        // Veg Button
                        InkWell(
                          onTap: () => setState(() => _selectedFoodType = 'Veg'),
                          borderRadius: BorderRadius.circular(10),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: _selectedFoodType == 'Veg' ? AppTheme.primaryGreen.withValues(alpha: 0.08) : Colors.white,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: _selectedFoodType == 'Veg' ? AppTheme.primaryGreen : Colors.grey[350]!,
                                width: 1.5,
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  _selectedFoodType == 'Veg' ? Icons.radio_button_checked : Icons.radio_button_off,
                                  color: AppTheme.primaryGreen,
                                  size: 16,
                                ),
                                const SizedBox(width: 6),
                                Text('Veg', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.darkBlack)),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        // Non-Veg Button
                        InkWell(
                          onTap: () => setState(() => _selectedFoodType = 'Non-Veg'),
                          borderRadius: BorderRadius.circular(10),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: _selectedFoodType == 'Non-Veg' ? AppTheme.primaryGreen.withValues(alpha: 0.08) : Colors.white,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: _selectedFoodType == 'Non-Veg' ? AppTheme.primaryGreen : Colors.grey[350]!,
                                width: 1.5,
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  _selectedFoodType == 'Non-Veg' ? Icons.radio_button_checked : Icons.radio_button_off,
                                  color: AppTheme.primaryGreen,
                                  size: 16,
                                ),
                                const SizedBox(width: 6),
                                Text('Non-Veg', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.darkBlack)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Base Price
                    _buildFormLabel('Base Price'),
                    const SizedBox(height: 6),
                    _buildCustomTextField(
                      controller: _menuBasePriceController,
                      hintText: 'Enter price',
                      keyboardType: TextInputType.number,
                    ),

                    const SizedBox(height: 16),

                    // Description
                    _buildFormLabel('Description'),
                    const SizedBox(height: 6),
                    _buildCustomTextField(
                      controller: _menuDescriptionController,
                      hintText: 'Enter description',
                      maxLines: 3,
                    ),

                    const SizedBox(height: 20),

                    // Add Flavour Variants (Optional)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Add Flavour Variants (Optional)',
                                style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.darkBlack),
                              ),
                              Text(
                                'Optional: Add flavour options that customers can choose from',
                                style: GoogleFonts.poppins(fontSize: 10, color: Colors.grey[600]),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.add_circle_outline_rounded, color: AppTheme.darkBlack, size: 24),
                          onPressed: _showAddFlavourVariantBottomSheet,
                        ),
                      ],
                    ),

                    if (_flavourVariants.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 8,
                        runSpacing: 6,
                        children: _flavourVariants.map((flavour) {
                          return Chip(
                            backgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.1),
                            side: const BorderSide(color: AppTheme.primaryGreen, width: 1),
                            label: Text(
                              flavour,
                              style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.primaryGreen),
                            ),
                            deleteIcon: const Icon(Icons.cancel_rounded, size: 16, color: AppTheme.primaryGreen),
                            onDeleted: () {
                              setState(() {
                                _flavourVariants.remove(flavour);
                              });
                            },
                          );
                        }).toList(),
                      ),
                    ],

                    const SizedBox(height: 16),

                    // Add Add-ons (Optional)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Add Add-ons (Optional)',
                                style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.darkBlack),
                              ),
                              Text(
                                'Optional: Add addon options that customers can choose from',
                                style: GoogleFonts.poppins(fontSize: 10, color: Colors.grey[600]),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.add_circle_outline_rounded, color: AppTheme.darkBlack, size: 24),
                          onPressed: _showAddAddOnBottomSheet,
                        ),
                      ],
                    ),

                    if (_addOnsList.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 8,
                        runSpacing: 6,
                        children: _addOnsList.map((addon) {
                          return Chip(
                            backgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.1),
                            side: const BorderSide(color: AppTheme.primaryGreen, width: 1),
                            label: Text(
                              addon,
                              style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.primaryGreen),
                            ),
                            deleteIcon: const Icon(Icons.cancel_rounded, size: 16, color: AppTheme.primaryGreen),
                            onDeleted: () {
                              setState(() {
                                _addOnsList.remove(addon);
                              });
                            },
                          );
                        }).toList(),
                      ),
                    ],

                    const SizedBox(height: 28),

                    // Next Primary CTA Button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleSaveRestaurantAddMenu,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryGreen,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: _isLoading
                            ? const CircularProgressIndicator(color: Colors.white)
                            : Text(
                                'Next',
                                style: GoogleFonts.poppins(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),
                  ]

                  // MODE 11: RESTAURANT ONBOARDING STEP 5 - OPERATIONAL DETAILS (MATCHING REFERENCE UI)
                  else if (_currentMode == AuthMode.restaurantOperationalDetails) ...[
                    // Master Enable Card
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF9FAFB),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.grey[300]!),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Enable',
                                  style: GoogleFonts.poppins(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.darkBlack,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Quikly enable or disable business hours',
                                  style: GoogleFonts.poppins(
                                    fontSize: 12,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Switch(
                            value: _masterHoursEnabled,
                            activeThumbColor: AppTheme.primaryGreen,
                            activeTrackColor: AppTheme.primaryGreen.withValues(alpha: 0.4),
                            onChanged: (val) {
                              setState(() {
                                _masterHoursEnabled = val;
                                for (var day in _daysSchedule) {
                                  day['enabled'] = val;
                                  if (val) {
                                    if (day['from'] == 'Closed') day['from'] = '09:00 AM';
                                    if (day['to'] == 'Closed') day['to'] = '05:30 PM';
                                  } else {
                                    day['from'] = 'Closed';
                                    day['to'] = 'Closed';
                                  }
                                }
                              });
                            },
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // 7 Days Operational Schedule Rows (Monday to Sunday)
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _daysSchedule.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final item = _daysSchedule[index];
                        final bool isEnabled = item['enabled'] as bool;
                        final String dayName = item['day'] as String;
                        final String fromTime = item['from'] as String;
                        final String toTime = item['to'] as String;

                        return Row(
                          children: [
                            // Day Enable Switch
                            SizedBox(
                              width: 44,
                              child: Transform.scale(
                                scale: 0.85,
                                child: Switch(
                                  value: isEnabled,
                                  activeThumbColor: AppTheme.primaryGreen,
                            activeTrackColor: AppTheme.primaryGreen.withValues(alpha: 0.4),
                                  onChanged: (val) {
                                    setState(() {
                                      item['enabled'] = val;
                                      if (val) {
                                        item['from'] = '09:00 AM';
                                        item['to'] = '05:30 PM';
                                      } else {
                                        item['from'] = 'Closed';
                                        item['to'] = 'Closed';
                                      }
                                    });
                                  },
                                ),
                              ),
                            ),
                            const SizedBox(height: 4),

                            // Day Label
                            Expanded(
                              flex: 3,
                              child: Text(
                                dayName,
                                style: GoogleFonts.poppins(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.darkBlack,
                                ),
                              ),
                            ),

                            // 'From' Time Box Button
                            Expanded(
                              flex: 4,
                              child: InkWell(
                                onTap: () async {
                                  if (!isEnabled) return;
                                  final picked = await showTimePicker(
                                    context: context,
                                    initialTime: const TimeOfDay(hour: 9, minute: 0),
                                  );
                                  if (picked != null) {
                                    setState(() {
                                      item['from'] = picked.format(context);
                                    });
                                  }
                                },
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF3F4F6),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: Colors.grey[350]!),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        'From',
                                        style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[600], fontWeight: FontWeight.w500),
                                      ),
                                      Text(
                                        fromTime,
                                        style: GoogleFonts.poppins(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700,
                                          color: AppTheme.darkBlack,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),

                            const SizedBox(width: 8),

                            // 'To' Time Box Button
                            Expanded(
                              flex: 4,
                              child: InkWell(
                                onTap: () async {
                                  if (!isEnabled) return;
                                  final picked = await showTimePicker(
                                    context: context,
                                    initialTime: const TimeOfDay(hour: 17, minute: 30),
                                  );
                                  if (picked != null) {
                                    setState(() {
                                      item['to'] = picked.format(context);
                                    });
                                  }
                                },
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF3F4F6),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: Colors.grey[350]!),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        'To',
                                        style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[600], fontWeight: FontWeight.w500),
                                      ),
                                      Text(
                                        toTime,
                                        style: GoogleFonts.poppins(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700,
                                          color: AppTheme.darkBlack,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                    ),

                    const SizedBox(height: 32),

                    // Next Primary CTA Button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleSaveRestaurantOperationalDetails,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryGreen,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: _isLoading
                            ? const CircularProgressIndicator(color: Colors.white)
                            : Text(
                                'Next',
                                style: GoogleFonts.poppins(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),
                  ]

                  // MODE 10: RESTAURANT ONBOARDING STEP 4 - BANK DETAILS (MATCHING REFERENCE UI)
                  else if (_currentMode == AuthMode.restaurantBankDetails) ...[
                    // Account Holder Name
                    _buildFormLabel('Account Holder Name'),
                    const SizedBox(height: 6),
                    _buildCustomTextField(
                      controller: _accountHolderController,
                      hintText: 'Enter Account Holder Name',
                      keyboardType: TextInputType.name,
                    ),

                    const SizedBox(height: 16),

                    // Bank Name
                    _buildFormLabel('Bank Name'),
                    const SizedBox(height: 6),
                    _buildCustomTextField(
                      controller: _bankNameController,
                      hintText: 'Enter Bank Name',
                    ),

                    const SizedBox(height: 16),

                    // Account Number
                    _buildFormLabel('Account Number'),
                    const SizedBox(height: 6),
                    _buildCustomTextField(
                      controller: _accountNumberController,
                      hintText: 'Enter Account Number',
                      keyboardType: TextInputType.number,
                    ),

                    const SizedBox(height: 16),

                    // IFSC Code
                    _buildFormLabel('IFSC Code'),
                    const SizedBox(height: 6),
                    _buildCustomTextField(
                      controller: _ifscCodeController,
                      hintText: 'Enter IFSC Code (e.g. HDFC0001294)',
                    ),

                    const SizedBox(height: 32),

                    // Next Primary CTA Button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleSaveRestaurantBankDetails,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryGreen,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: _isLoading
                            ? const CircularProgressIndicator(color: Colors.white)
                            : Text(
                                'Next',
                                style: GoogleFonts.poppins(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),
                  ]

                  // MODE 9: RESTAURANT ONBOARDING STEP 3 - DOCUMENTS (MATCHING REFERENCE UI)
                  else if (_currentMode == AuthMode.restaurantDocuments) ...[
                    // Trade License Number
                    _buildFormLabel('Trade License Number'),
                    const SizedBox(height: 6),
                    _buildCustomTextField(
                      controller: _tradeLicenseController,
                      hintText: 'Enter Trade License Number',
                    ),

                    const SizedBox(height: 12),

                    // Upload Trade License Document Card
                    GestureDetector(
                      onTap: () {
                        setState(() {
                          _uploadedTradeLicenseDoc = 'trade_license_doc.pdf';
                        });
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Trade License Document Uploaded Successfully!'), backgroundColor: AppTheme.primaryGreen),
                        );
                      },
                      child: Container(
                        width: double.infinity,
                        height: 90,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF9FAFB),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: _uploadedTradeLicenseDoc != null ? AppTheme.primaryGreen : Colors.grey[350]!,
                            width: 1.5,
                          ),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              _uploadedTradeLicenseDoc != null ? Icons.check_circle_rounded : Icons.upload_file_rounded,
                              color: AppTheme.primaryGreen,
                              size: 26,
                            ),
                            const SizedBox(height: 6),
                            Text(
                              _uploadedTradeLicenseDoc != null ? 'Trade License Uploaded: $_uploadedTradeLicenseDoc' : 'Upload Trade Licence Document',
                              style: GoogleFonts.poppins(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: _uploadedTradeLicenseDoc != null ? AppTheme.primaryGreen : Colors.grey[700],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    // GST Registration Number (Replaces VAT Number per user request!)
                    _buildFormLabel('GST Registration Number'),
                    const SizedBox(height: 6),
                    _buildCustomTextField(
                      controller: _gstNumberController,
                      hintText: 'Enter GST Number (e.g. 07AAAAA0000A1Z5)',
                    ),

                    const SizedBox(height: 12),

                    // Upload GST Document Card
                    GestureDetector(
                      onTap: () {
                        setState(() {
                          _uploadedGstDoc = 'gst_certificate.pdf';
                        });
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('GST Certificate Document Uploaded Successfully!'), backgroundColor: AppTheme.primaryGreen),
                        );
                      },
                      child: Container(
                        width: double.infinity,
                        height: 90,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF9FAFB),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: _uploadedGstDoc != null ? AppTheme.primaryGreen : Colors.grey[350]!,
                            width: 1.5,
                          ),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              _uploadedGstDoc != null ? Icons.check_circle_rounded : Icons.upload_file_rounded,
                              color: AppTheme.primaryGreen,
                              size: 26,
                            ),
                            const SizedBox(height: 6),
                            Text(
                              _uploadedGstDoc != null ? 'GST Certificate Uploaded: $_uploadedGstDoc' : 'Upload GST Certificate Document',
                              style: GoogleFonts.poppins(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: _uploadedGstDoc != null ? AppTheme.primaryGreen : Colors.grey[700],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Next Primary CTA Button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleSaveRestaurantDocuments,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryGreen,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: _isLoading
                            ? const CircularProgressIndicator(color: Colors.white)
                            : Text(
                                'Next',
                                style: GoogleFonts.poppins(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),
                  ]

                  // MODE 8: RESTAURANT ONBOARDING STEP 2 - LOCATION (MATCHING REFERENCE UI)
                  else if (_currentMode == AuthMode.restaurantLocation) ...[
                    // Restaurant Address
                    _buildFormLabel('Restaurant Address'),
                    const SizedBox(height: 6),
                    _buildCustomTextField(
                      controller: _addressController,
                      hintText: 'Enter Address',
                    ),

                    const SizedBox(height: 16),

                    // Area
                    _buildFormLabel('Area'),
                    const SizedBox(height: 6),
                    _buildCustomTextField(
                      controller: _areaController,
                      hintText: 'Enter Name',
                    ),

                    const SizedBox(height: 16),

                    // City
                    _buildFormLabel('City'),
                    const SizedBox(height: 6),
                    _buildCustomTextField(
                      controller: _cityController,
                      hintText: 'Enter Name',
                    ),

                    const SizedBox(height: 20),

                    // Interactive Map Picker Container
                    Container(
                      height: 200,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: const Color(0xFFE8F3EE),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.primaryGreen.withValues(alpha: 0.3), width: 1.5),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Stack(
                          children: [
                            // Custom Stylized Map Graphic Simulation
                            CustomPaint(
                              size: Size.infinite,
                              painter: _MapPainter(),
                            ),

                            // Floating Location Pin Card
                            Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                    decoration: BoxDecoration(
                                      color: AppTheme.darkBlack,
                                      borderRadius: BorderRadius.circular(20),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withValues(alpha: 0.2),
                                          blurRadius: 12,
                                          offset: const Offset(0, 4),
                                        ),
                                      ],
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.location_on_rounded, color: AppTheme.primaryGreen, size: 18),
                                        const SizedBox(width: 6),
                                        Text(
                                          'SUBHASH CHOWK, SOHNA',
                                          style: GoogleFonts.poppins(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.white,
                                            letterSpacing: 0.5,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  const Icon(Icons.arrow_drop_down_rounded, color: AppTheme.darkBlack, size: 28),
                                ],
                              ),
                            ),

                            // Map Control Action Button (Bottom Right)
                            Positioned(
                              bottom: 12,
                              right: 12,
                              child: ElevatedButton.icon(
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Pin Updated! Lat: 28.2478° N, Long: 77.0624° E'),
                                      backgroundColor: AppTheme.primaryGreen,
                                    ),
                                  );
                                },
                                icon: const Icon(Icons.my_location_rounded, size: 16, color: Colors.white),
                                label: Text(
                                  'Set Pin on Map',
                                  style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                                ),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.primaryGreen,
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Next Primary CTA Button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleSaveRestaurantLocation,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryGreen,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: _isLoading
                            ? const CircularProgressIndicator(color: Colors.white)
                            : Text(
                                'Next',
                                style: GoogleFonts.poppins(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),
                  ]

                  // MODE 7: RESTAURANT ONBOARDING STEP 1 - RESTAURANT DETAILS (MATCHING REFERENCE UI)
                  else if (_currentMode == AuthMode.restaurantDetails) ...[
                    // Restaurant Trade Name
                    _buildFormLabel('Restaurant Trade Name'),
                    const SizedBox(height: 6),
                    _buildCustomTextField(
                      controller: _tradeNameController,
                      hintText: 'Enter Name',
                      keyboardType: TextInputType.name,
                    ),

                    const SizedBox(height: 16),

                    // Restaurant Type
                    _buildFormLabel('Restaurant Type'),
                    const SizedBox(height: 6),
                    _buildCustomTextField(
                      controller: _restaurantTypeController,
                      hintText: 'Enter Name',
                    ),

                    const SizedBox(height: 16),

                    // Cuisine Type
                    _buildFormLabel('Cuisine Type'),
                    const SizedBox(height: 6),
                    _buildCustomTextField(
                      controller: _cuisineTypeController,
                      hintText: 'Enter Name',
                    ),

                    const SizedBox(height: 16),

                    // About Restaurant
                    _buildFormLabel('About Restaurant'),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _aboutRestaurantController,
                      maxLines: 4,
                      style: GoogleFonts.poppins(fontSize: 14, color: AppTheme.darkBlack),
                      decoration: InputDecoration(
                        hintText: 'Enter Name',
                        hintStyle: GoogleFonts.poppins(color: Colors.grey[400]),
                        contentPadding: const EdgeInsets.all(16),
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: Colors.grey[300]!),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: Colors.grey[300]!),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppTheme.primaryGreen, width: 2),
                        ),
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Restaurant Images Section Header
                    _buildFormLabel('Restaurant Images'),
                    const SizedBox(height: 2),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Upload at least 1 photo (up to 6 photos)',
                        style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w500, color: Colors.grey[600]),
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Quick Action Buttons for Live Capture & Upload
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _showImageSourceDialog,
                            icon: const Icon(Icons.camera_alt_rounded, size: 18, color: AppTheme.primaryGreen),
                            label: Text('Live Capture', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.primaryGreen)),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: AppTheme.primaryGreen, width: 1.5),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              padding: const EdgeInsets.symmetric(vertical: 10),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _showImageSourceDialog,
                            icon: const Icon(Icons.upload_file_rounded, size: 18, color: AppTheme.primaryGreen),
                            label: Text('Upload Image', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.primaryGreen)),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: AppTheme.primaryGreen, width: 1.5),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              padding: const EdgeInsets.symmetric(vertical: 10),
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 14),

                    // 6 Image Grid (3 per row)
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: 6,
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 3,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                        childAspectRatio: 1.1,
                      ),
                      itemBuilder: (context, index) {
                        if (index < _restaurantImages.length) {
                          return Stack(
                            children: [
                              Container(
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                  image: DecorationImage(
                                    image: NetworkImage(_restaurantImages[index]),
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              ),
                              Positioned(
                                top: 4,
                                right: 4,
                                child: GestureDetector(
                                  onTap: () {
                                    setState(() {
                                      _restaurantImages.removeAt(index);
                                    });
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.all(3),
                                    decoration: const BoxDecoration(
                                      color: Colors.black,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.close, color: Colors.white, size: 14),
                                  ),
                                ),
                              ),
                            ],
                          );
                        } else {
                          // Camera upload box
                          return GestureDetector(
                            onTap: _showImageSourceDialog,
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.grey[400]!, width: 1.2),
                              ),
                              child: const Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.camera_alt_outlined, color: AppTheme.darkBlack, size: 24),
                                  SizedBox(height: 2),
                                  Icon(Icons.add_circle_outline, color: AppTheme.primaryGreen, size: 16),
                                ],
                              ),
                            ),
                          );
                        }
                      },
                    ),

                    const SizedBox(height: 32),

                    // Next Primary CTA Button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleSaveRestaurantDetails,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryGreen,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: _isLoading
                            ? const CircularProgressIndicator(color: Colors.white)
                            : Text(
                                'Next',
                                style: GoogleFonts.poppins(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),
                  ]

                  // MODE 6: REGISTER OTP VERIFICATION SCREEN (MATCHING REFERENCE UI)
                  else if (_currentMode == AuthMode.registerOtp) ...[
                    Text(
                      'OTP Verification',
                      style: GoogleFonts.poppins(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.darkBlack,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'We sent an sms with a 6-digit code to your registered Email. Please enter it so we can be sure that this Email belongs to you.',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Colors.grey[600],
                        height: 1.4,
                      ),
                    ),

                    const SizedBox(height: 32),

                    // 6 Individual Square OTP Input Boxes
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: List.generate(6, (index) {
                        final isFirst = index == 0;
                        return SizedBox(
                          width: 44,
                          height: 52,
                          child: TextField(
                            controller: _regOtpControllers[index],
                            focusNode: _regOtpFocusNodes[index],
                            keyboardType: TextInputType.number,
                            textAlign: TextAlign.center,
                            maxLength: 1,
                            style: GoogleFonts.poppins(
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.primaryGreen,
                            ),
                            decoration: InputDecoration(
                              counterText: '',
                              contentPadding: EdgeInsets.zero,
                              filled: true,
                              fillColor: const Color(0xFFF9FAFB),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: BorderSide(
                                  color: isFirst ? AppTheme.primaryGreen : Colors.grey[300]!,
                                  width: isFirst ? 1.8 : 1,
                                ),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: BorderSide(
                                  color: isFirst ? AppTheme.primaryGreen : Colors.grey[300]!,
                                  width: isFirst ? 1.8 : 1,
                                ),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: const BorderSide(color: AppTheme.primaryGreen, width: 2),
                              ),
                            ),
                            onChanged: (val) {
                              if (val.isNotEmpty && index < 5) {
                                FocusScope.of(context).requestFocus(_regOtpFocusNodes[index + 1]);
                              } else if (val.isEmpty && index > 0) {
                                FocusScope.of(context).requestFocus(_regOtpFocusNodes[index - 1]);
                              }
                            },
                          ),
                        );
                      }),
                    ),

                    const SizedBox(height: 32),

                    // Get Started / Verify Button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleVerifyRegisterOtp,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryGreen,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: _isLoading
                            ? const CircularProgressIndicator(color: Colors.white)
                            : Text(
                                'Get Started',
                                style: GoogleFonts.poppins(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Resend OTP Link
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Didn\'t recieve the OTP? ',
                          style: GoogleFonts.poppins(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: Colors.grey[700],
                          ),
                        ),
                        GestureDetector(
                          onTap: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('OTP Resent to your email/mobile! (Mock OTP: 512345)'), backgroundColor: AppTheme.primaryGreen),
                            );
                          },
                          child: Text(
                            'Resend',
                            style: GoogleFonts.poppins(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primaryGreen,
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // Change Email Link
                    GestureDetector(
                      onTap: () => setState(() => _currentMode = AuthMode.register),
                      child: Text(
                        'Change Email',
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF1E3A34),
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),
                  ]

                  // MODE 5: REGISTER SCREEN (Matching Reference UI)
                  else if (_currentMode == AuthMode.register) ...[
                    Text(
                      'Create Your Account',
                      style: GoogleFonts.poppins(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.darkBlack,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Sign up to explore delicious meals and get them delivered to your location',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Colors.grey[600],
                        height: 1.3,
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Owner First Name
                    _buildFormLabel('Owner First Name'),
                    const SizedBox(height: 6),
                    _buildCustomTextField(
                      controller: _firstNameController,
                      hintText: 'Enter Name',
                      keyboardType: TextInputType.name,
                    ),

                    const SizedBox(height: 14),

                    // Owner Last Name
                    _buildFormLabel('Owner Last Name'),
                    const SizedBox(height: 6),
                    _buildCustomTextField(
                      controller: _lastNameController,
                      hintText: 'Enter Name',
                      keyboardType: TextInputType.name,
                    ),

                    const SizedBox(height: 14),

                    // Email
                    _buildFormLabel('Email'),
                    const SizedBox(height: 6),
                    _buildCustomTextField(
                      controller: _regEmailController,
                      hintText: 'khalid_ai@gmail.com',
                      keyboardType: TextInputType.emailAddress,
                    ),

                    const SizedBox(height: 14),

                    // Mobile Number
                    _buildFormLabel('Mobile Number'),
                    const SizedBox(height: 6),
                    _buildCustomTextField(
                      controller: _regMobileController,
                      hintText: 'Enter 10-digit mobile number',
                      keyboardType: TextInputType.phone,
                      maxLength: 10,
                    ),

                    const SizedBox(height: 14),

                    // Password
                    _buildFormLabel('Password'),
                    const SizedBox(height: 6),
                    _buildCustomTextField(
                      controller: _regPasswordController,
                      hintText: '.........',
                      obscureText: _isRegPasswordObscured,
                      suffixIcon: IconButton(
                        icon: Icon(
                          _isRegPasswordObscured ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                          color: Colors.grey[500],
                          size: 20,
                        ),
                        onPressed: () {
                          setState(() {
                            _isRegPasswordObscured = !_isRegPasswordObscured;
                          });
                        },
                      ),
                    ),

                    const SizedBox(height: 14),

                    // Confirm Password
                    _buildFormLabel('Confirm Password'),
                    const SizedBox(height: 6),
                    _buildCustomTextField(
                      controller: _regConfirmPasswordController,
                      hintText: '.........',
                      obscureText: _isRegConfirmPasswordObscured,
                      suffixIcon: IconButton(
                        icon: Icon(
                          _isRegConfirmPasswordObscured ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                          color: Colors.grey[500],
                          size: 20,
                        ),
                        onPressed: () {
                          setState(() {
                            _isRegConfirmPasswordObscured = !_isRegConfirmPasswordObscured;
                          });
                        },
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Create Account Primary CTA Button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleRegister,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryGreen,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: _isLoading
                            ? const CircularProgressIndicator(color: Colors.white)
                            : Text(
                                'Create Account',
                                style: GoogleFonts.poppins(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),

                    const SizedBox(height: 18),

                    // Terms & Conditions and Privacy Policy line
                    Wrap(
                      alignment: WrapAlignment.center,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Text(
                          'I agree to the ',
                          style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600]),
                        ),
                        GestureDetector(
                          onTap: () {
                            Navigator.push(context, MaterialPageRoute(builder: (_) => const TermsConditionsScreen()));
                          },
                          child: Text(
                            'Terms & Conditions',
                            style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primaryGreen),
                          ),
                        ),
                        Text(
                          ' and ',
                          style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600]),
                        ),
                        GestureDetector(
                          onTap: () {
                            Navigator.push(context, MaterialPageRoute(builder: (_) => const PrivacyPolicyScreen()));
                          },
                          child: Text(
                            'Privacy Policy',
                            style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primaryGreen),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 20),

                    // Already have an account? Login
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Already have an account? ',
                          style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w500, color: Colors.grey[600]),
                        ),
                        GestureDetector(
                          onTap: () => setState(() => _currentMode = AuthMode.welcomeBack),
                          child: Text(
                            'Login',
                            style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.primaryGreen),
                          ),
                        ),
                      ],
                    ),
                  ]

                  // MODE 1: WELCOME SCREEN (INITIAL LANDING)
                  else if (_currentMode == AuthMode.welcome) ...[
                    Text(
                      'Welcome',
                      style: GoogleFonts.poppins(fontSize: 28, fontWeight: FontWeight.w800, color: AppTheme.darkBlack),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Sohna\'s premier online food ordering & restaurant partner platform.',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.lightGreen, height: 1.4),
                    ),
                    const SizedBox(height: 24),

                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: () => setState(() => _currentMode = AuthMode.welcomeBack),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryGreen,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: Text('Get Started', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: () => setState(() => _currentMode = AuthMode.welcomeBack),
                      child: Text(
                        'Already have an account? Log In',
                        style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.primaryGreen),
                      ),
                    ),

                    const SizedBox(height: 30),

                    // Website Feature Cards
                    Row(
                      children: [
                        const Expanded(child: Divider(color: AppTheme.creamAccent, thickness: 1.5)),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Text(
                            'WHY PARTNER WITH ECD KART',
                            style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.primaryGreen, letterSpacing: 1.2),
                          ),
                        ),
                        const Expanded(child: Divider(color: AppTheme.creamAccent, thickness: 1.5)),
                      ],
                    ),
                    const SizedBox(height: 18),
                    _buildFeatureCard(
                      icon: Icons.electric_bolt_rounded,
                      title: 'Superfast Local Delivery',
                      description: 'Deliver hot & fresh meals across Sohna with our rider fleet.',
                    ),
                    const SizedBox(height: 10),
                    _buildFeatureCard(
                      icon: Icons.account_balance_wallet_rounded,
                      title: 'Transparent Weekly Payouts',
                      description: 'Automated Sunday payouts directly into your bank account.',
                    ),
                    const SizedBox(height: 10),
                    _buildFeatureCard(
                      icon: Icons.speed_rounded,
                      title: 'Real-time Order Control',
                      description: 'Live order notifications, preparation status and menu controls.',
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'www.ecdkart.co.in • Sohna, Haryana',
                      style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.lightGreen),
                    ),
                  ]

                  // MODE 2: PHONE NUMBER ENTRY
                  else if (_currentMode == AuthMode.phone) ...[
                    Text(
                      'Get Started',
                      style: GoogleFonts.poppins(fontSize: 26, fontWeight: FontWeight.w800, color: AppTheme.darkBlack),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Add your restaurant details and mobile number to begin accepting orders.',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.lightGreen),
                    ),
                    const SizedBox(height: 24),

                    TextField(
                      controller: _mobileController,
                      keyboardType: TextInputType.phone,
                      maxLength: 10,
                      decoration: InputDecoration(
                        labelText: 'Phone Number',
                        hintText: 'Enter 10-digit mobile number',
                        prefixIcon: const Icon(Icons.phone_android_rounded, color: AppTheme.primaryGreen),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.primaryGreen, width: 2)),
                      ),
                    ),
                    const SizedBox(height: 20),

                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleSendOtp,
                        style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                        child: _isLoading ? const CircularProgressIndicator(color: Colors.white) : Text('Send OTP', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                      ),
                    ),
                  ]

                  // MODE 3: OTP VERIFICATION
                  else if (_currentMode == AuthMode.otp) ...[
                    Text(
                      'Enter OTP',
                      style: GoogleFonts.poppins(fontSize: 26, fontWeight: FontWeight.w800, color: AppTheme.darkBlack),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Enter 6-digit verification code sent to your phone number.',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.lightGreen),
                    ),
                    const SizedBox(height: 24),

                    TextField(
                      controller: _otpController,
                      keyboardType: TextInputType.number,
                      maxLength: 6,
                      style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 6),
                      textAlign: TextAlign.center,
                      decoration: InputDecoration(
                        hintText: '123456',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.primaryGreen, width: 2)),
                      ),
                    ),
                    const SizedBox(height: 20),

                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleVerifyOtp,
                        style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                        child: _isLoading ? const CircularProgressIndicator(color: Colors.white) : Text('Verify & Login', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextButton(
                      onPressed: () => setState(() => _currentMode = AuthMode.phone),
                      child: Text('Change Phone Number', style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 13, color: AppTheme.primaryGreen)),
                    ),
                  ]

                  // MODE 4: WELCOME BACK SCREEN (MATCHING REFERENCE IMAGE)
                  else if (_currentMode == AuthMode.welcomeBack) ...[
                    Text(
                      'Welcome Back!',
                      style: GoogleFonts.poppins(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.darkBlack,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Log in to continue your meal journey',
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: Colors.grey[600],
                      ),
                    ),

                    const SizedBox(height: 28),

                    // Email Input
                    _buildFormLabel('Email'),
                    const SizedBox(height: 6),
                    _buildCustomTextField(
                      controller: _emailPhoneController,
                      hintText: 'khalid_ai@gmail.com',
                      keyboardType: TextInputType.emailAddress,
                    ),

                    const SizedBox(height: 18),

                    // Password Input
                    _buildFormLabel('Password'),
                    const SizedBox(height: 6),
                    _buildCustomTextField(
                      controller: _passwordController,
                      hintText: '.........',
                      obscureText: _isPasswordObscured,
                      suffixIcon: IconButton(
                        icon: Icon(
                          _isPasswordObscured ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                          color: Colors.grey[500],
                          size: 20,
                        ),
                        onPressed: () {
                          setState(() {
                            _isPasswordObscured = !_isPasswordObscured;
                          });
                        },
                      ),
                    ),

                    // Forgot Password
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: _showForgotPasswordDialog,
                        style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 4), minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                        child: Text('Forgot password?', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.darkBlack)),
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Get Started Button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handlePasswordLogin,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryGreen,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: _isLoading ? const CircularProgressIndicator(color: Colors.white) : Text('Get Started', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    ),

                    const SizedBox(height: 22),

                    // - or -
                    Row(
                      children: [
                        Expanded(child: Divider(color: Colors.grey[300], thickness: 1)),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                          child: Text('or', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w500, color: Colors.grey[500])),
                        ),
                        Expanded(child: Divider(color: Colors.grey[300], thickness: 1)),
                      ],
                    ),

                    const SizedBox(height: 22),

                    // Continue with Google
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: OutlinedButton(
                        onPressed: _isLoading ? null : _handleGoogleSignIn,
                        style: OutlinedButton.styleFrom(
                          backgroundColor: Colors.white,
                          side: BorderSide(color: Colors.grey[300]!, width: 1.2),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: 20,
                              height: 20,
                              decoration: const BoxDecoration(shape: BoxShape.circle, color: Colors.white),
                              child: Center(
                                child: Text('G', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.blue[600])),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Text('Continue with Google', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.grey[700])),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Login with Phone Number Button
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: OutlinedButton.icon(
                        onPressed: () => setState(() => _currentMode = AuthMode.phone),
                        style: OutlinedButton.styleFrom(
                          backgroundColor: Colors.white,
                          side: const BorderSide(color: AppTheme.primaryGreen, width: 1.5),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        icon: const Icon(Icons.phone_android_rounded, color: AppTheme.primaryGreen, size: 20),
                        label: Text(
                          'Login with Phone Number',
                          style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.primaryGreen),
                        ),
                      ),
                    ),

                    const SizedBox(height: 28),

                    // Footer Link -> Register Now
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('Don\'t have an account? ', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w500, color: Colors.grey[600])),
                        GestureDetector(
                          onTap: () => setState(() => _currentMode = AuthMode.register),
                          child: Text('Register Now', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.primaryGreen)),
                        ),
                      ],
                    ),
                  ],

                  const SizedBox(height: 30),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFormLabel(String label) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(
        label,
        style: GoogleFonts.poppins(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: AppTheme.darkBlack,
        ),
      ),
    );
  }

  Widget _buildCustomTextField({
    required TextEditingController controller,
    required String hintText,
    TextInputType keyboardType = TextInputType.text,
    bool obscureText = false,
    Widget? suffixIcon,
    int? maxLength,
    int maxLines = 1,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      maxLength: maxLength,
      maxLines: maxLines,
      style: GoogleFonts.poppins(fontSize: 14, color: AppTheme.darkBlack),
      decoration: InputDecoration(
        hintText: hintText,
        counterText: '',
        hintStyle: GoogleFonts.poppins(color: Colors.grey[400]),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey[300]!),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey[300]!),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.primaryGreen, width: 2),
        ),
        suffixIcon: suffixIcon,
      ),
    );
  }

  Widget _buildFeatureCard({
    required IconData icon,
    required String title,
    required String description,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.creamAccent, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: AppTheme.darkBlack.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.primaryGreen.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AppTheme.primaryGreen, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.darkBlack),
                ),
                const SizedBox(height: 2),
                Text(
                  description,
                  style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w500, color: AppTheme.lightGreen, height: 1.3),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEcdkartLogoText({double fontSize = 22}) {
    return RichText(
      textAlign: TextAlign.center,
      text: TextSpan(
        style: GoogleFonts.poppins(
          fontSize: fontSize,
          fontWeight: FontWeight.w900,
          letterSpacing: 1.0,
        ),
        children: const [
          TextSpan(
            text: 'ECD',
            style: TextStyle(color: Color(0xFF2C2C2C)),
          ),
          TextSpan(
            text: 'K',
            style: TextStyle(color: Color(0xFF248C70)),
          ),
          TextSpan(
            text: 'A',
            style: TextStyle(color: Color(0xFFE89D1E)),
          ),
          TextSpan(
            text: 'RT',
            style: TextStyle(color: Color(0xFF2C2C2C)),
          ),
        ],
      ),
    );
  }
}

class _MapPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final bgPaint = Paint()..color = const Color(0xFFE5EFE9);
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), bgPaint);

    final greenAreaPaint = Paint()
      ..color = const Color(0xFFCDE8DA)
      ..style = PaintingStyle.fill;

    canvas.drawCircle(Offset(size.width * 0.2, size.height * 0.3), 60, greenAreaPaint);
    canvas.drawCircle(Offset(size.width * 0.8, size.height * 0.7), 80, greenAreaPaint);

    final roadPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = 14
      ..style = PaintingStyle.stroke;

    final roadPath = Path();
    roadPath.moveTo(0, size.height * 0.4);
    roadPath.cubicTo(size.width * 0.3, size.height * 0.2, size.width * 0.6, size.height * 0.8, size.width, size.height * 0.5);
    canvas.drawPath(roadPath, roadPaint);

    final waterPaint = Paint()
      ..color = const Color(0xFFAED8F2)
      ..strokeWidth = 10
      ..style = PaintingStyle.stroke;

    final riverPath = Path();
    riverPath.moveTo(size.width * 0.5, 0);
    riverPath.cubicTo(size.width * 0.7, size.height * 0.3, size.width * 0.4, size.height * 0.7, size.width * 0.8, size.height);
    canvas.drawPath(riverPath, waterPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

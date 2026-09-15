import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../api_constants.dart';
import 'dashboard_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();

  bool _isLoading = false;
  bool _isOtpSent = false;

  Future<void> _sendOtp() async {
    final phone = _phoneController.text.trim();
    if (phone.length != 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Phone number must be exactly 10 digits'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final response = await http.post(
        Uri.parse(ApiConstants.sendOtp),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'phone': phone}),
      );

      if (response.statusCode == 200) {
        setState(() => _isOtpSent = true);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('OTP sent successfully!'), backgroundColor: Color(0xFF248C70)),
          );
        }
      } else {
        String err = 'Failed to send OTP';
        try {
          err = json.decode(response.body)['message'] ?? err;
        } catch (_) {
          err = 'Some issue is on server side.';
        }
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err), backgroundColor: Colors.red));
        }
      }
    } catch (e) {
      if (mounted) {
        String errorMsg = e.toString();
        if (errorMsg.contains('ClientException') || errorMsg.contains('Failed to fetch') || errorMsg.contains('SocketException')) {
          errorMsg = 'Network connection failed. Please check your internet connection.';
        } else {
          errorMsg = 'An unexpected error occurred.';
        }
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(errorMsg), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _verifyOtp() async {
    final phone = _phoneController.text.trim();
    final otp = _otpController.text.trim();
    
    if (otp.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the OTP'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final response = await http.post(
        Uri.parse(ApiConstants.verifyOtp),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'phone': phone, 'otp': otp}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final restaurantId = data['_id']?.toString() ?? "";
        final token = data['token']?.toString() ?? "";

        if (restaurantId.isEmpty || token.isEmpty) {
          throw const FormatException(
            'Login response is missing the restaurant ID or auth token',
          );
        }

        ApiConstants.setAuthenticatedSession(
          restaurantId: restaurantId,
          authToken: token,
        );

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('restaurantId', restaurantId);
        await prefs.setString('token', token);

        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const DashboardScreen()),
          );
        }
      } else {
        String err = 'Invalid OTP';
        try {
          err = json.decode(response.body)['message'] ?? err;
        } catch (_) {
          err = 'Some issue is on server side.';
        }
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err), backgroundColor: Colors.red));
        }
      }
    } catch (e) {
      if (mounted) {
        String errorMsg = e.toString();
        if (errorMsg.contains('ClientException') || errorMsg.contains('Failed to fetch') || errorMsg.contains('SocketException')) {
          errorMsg = 'Network connection failed. Please check your internet connection.';
        } else {
          errorMsg = 'An unexpected error occurred.';
        }
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(errorMsg), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isKeyboardOpen = MediaQuery.of(context).viewInsets.bottom > 0;

    return Scaffold(
      backgroundColor: const Color(0xFF248C70), // Top half brand green background
      body: Column(
        children: [
          // TOP HALF: Branding & Food Graphics
          Expanded(
            key: const ValueKey('top_half_login'),
            flex: 4, // Slightly less flex to give the bottom card more room
            child: SafeArea(
              bottom: false,
              child: Stack(
                children: [
                  // Optional: A placeholder for a food background pattern or image
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: Opacity(
                      opacity: 0.9,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          Icon(Icons.fastfood, size: 80, color: Colors.white.withOpacity(0.2)),
                          Icon(Icons.local_pizza, size: 60, color: Colors.white.withOpacity(0.2)),
                          Icon(Icons.ramen_dining, size: 90, color: Colors.white.withOpacity(0.2)),
                        ],
                      ),
                    ),
                  ),
                  
                  // Brand Logo & Title
                  Align(
                    alignment: Alignment.topCenter,
                    child: AnimatedPadding(
                      duration: const Duration(milliseconds: 300),
                      padding: EdgeInsets.only(top: isKeyboardOpen ? 10.0 : 40.0),
                      child: SingleChildScrollView(
                        physics: const NeverScrollableScrollPhysics(),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Logo in a premium white squircle
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 300),
                              width: isKeyboardOpen ? 50 : 90,
                              height: isKeyboardOpen ? 50 : 90,
                              padding: EdgeInsets.all(isKeyboardOpen ? 8 : 12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(isKeyboardOpen ? 16 : 24),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.1),
                                    blurRadius: 15,
                                    offset: const Offset(0, 5),
                                  ),
                                ],
                              ),
                              child: Image.asset(
                                'splash_logo.png',
                                fit: BoxFit.contain,
                                errorBuilder: (context, error, stackTrace) => const Icon(Icons.storefront, size: 40, color: Color(0xFF248C70)),
                              ),
                            ),
                            SizedBox(height: isKeyboardOpen ? 8 : 16),
                            // Specific ECD KART RESTAURANT Text
                            AnimatedDefaultTextStyle(
                              duration: const Duration(milliseconds: 300),
                              style: GoogleFonts.poppins(
                                fontSize: isKeyboardOpen ? 24 : 32,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                                letterSpacing: 1.0,
                              ),
                              child: const Text('ECD KART'),
                            ),
                            AnimatedDefaultTextStyle(
                              duration: const Duration(milliseconds: 300),
                              style: GoogleFonts.poppins(
                                fontSize: isKeyboardOpen ? 12 : 14,
                                fontWeight: FontWeight.w900,
                                color: Colors.white70,
                                letterSpacing: 8.0,
                              ),
                              child: const Text('RESTAURANT'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // BOTTOM HALF: The curved white login card
          Expanded(
            key: const ValueKey('bottom_half_login'),
            flex: 5, // Slightly more flex to guarantee no scrolling is needed
            child: Container(
              width: double.infinity,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(32)), // The "crop/band" curve
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 20,
                    offset: Offset(0, -5),
                  ),
                ],
              ),
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'Welcome Back',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontFamily: 'Montserrat',
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF2C2C2C),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Login to manage your restaurant orders',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: Colors.grey.shade500,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Premium Input Fields (Directly in the card)
                    if (!_isOtpSent) ...[
                      _buildPremiumTextField(
                        controller: _phoneController,
                        label: 'Phone Number',
                        icon: Icons.phone_outlined,
                        keyboardType: TextInputType.phone,
                        maxLength: 10,
                      ),
                      const SizedBox(height: 20),
                      _buildPremiumButton(
                        text: 'Send OTP',
                        onPressed: _sendOtp,
                        isLoading: _isLoading,
                      ),
                    ] else ...[
                      _buildPremiumTextField(
                        controller: _phoneController,
                        label: 'Phone Number',
                        icon: Icons.phone_outlined,
                        enabled: false,
                      ),
                      const SizedBox(height: 12),
                      _buildPremiumTextField(
                        controller: _otpController,
                        label: 'Enter OTP',
                        icon: Icons.lock_outline,
                        keyboardType: TextInputType.number,
                        maxLength: 6,
                      ),
                      const SizedBox(height: 16),
                      _buildPremiumButton(
                        text: 'Verify & Login',
                        onPressed: _verifyOtp,
                        isLoading: _isLoading,
                      ),
                      const SizedBox(height: 4),
                      Center(
                        child: TextButton(
                          style: TextButton.styleFrom(
                            foregroundColor: const Color(0xFF248C70),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          onPressed: () => setState(() {
                            _isOtpSent = false;
                            _otpController.clear();
                          }),
                          child: const Text(
                            'Change Phone Number',
                            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Helper method for ultra-premium text fields
  Widget _buildPremiumTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool enabled = true,
    TextInputType? keyboardType,
    int? maxLength,
  }) {
    return TextField(
      controller: controller,
      enabled: enabled,
      keyboardType: keyboardType,
      maxLength: maxLength,
      style: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: enabled ? const Color(0xFF2C2C2C) : Colors.grey.shade600,
      ),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(
          color: Colors.grey.shade500,
          fontWeight: FontWeight.w500,
        ),
        prefixIcon: Icon(icon, color: enabled ? const Color(0xFF248C70) : Colors.grey.shade400, size: 22),
        filled: true,
        fillColor: enabled ? const Color(0xFFF5FAF8) : const Color(0xFFF0F2F5),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        counterText: '', // Hide length counter
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: const BorderSide(color: Colors.transparent, width: 1.5),
        ),
        disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: BorderSide(color: Colors.grey.shade200, width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: const BorderSide(color: Color(0xFF248C70), width: 1.5),
        ),
      ),
    );
  }

  // Helper method for ultra-premium buttons
  Widget _buildPremiumButton({
    required String text,
    required VoidCallback onPressed,
    required bool isLoading,
  }) {
    return Container(
      height: 48,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF2C2C2C).withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF2C2C2C),
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
        ),
        child: isLoading
            ? const SizedBox(
                height: 24,
                width: 24,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
              )
            : Text(
                text,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
      ),
    );
  }
}

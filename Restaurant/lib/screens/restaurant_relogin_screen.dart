import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../api_constants.dart';
import '../theme/app_theme.dart';
import '../widgets/ecdkart_logo.dart';
import '../widgets/welcome_back_logo.dart';
import 'dashboard_screen.dart';
import 'login_screen.dart';
import 'privacy_policy_screen.dart';
import 'terms_conditions_screen.dart';
import 'waiting_for_approval_screen.dart';

class RestaurantReloginScreen extends StatefulWidget {
  final String? initialPhone;
  const RestaurantReloginScreen({super.key, this.initialPhone});

  @override
  State<RestaurantReloginScreen> createState() => _RestaurantReloginScreenState();
}

class _RestaurantReloginScreenState extends State<RestaurantReloginScreen> {
  late final TextEditingController _mobileController;
  final List<TextEditingController> _otpControllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocusNodes = List.generate(6, (_) => FocusNode());

  final List<TextEditingController> _pinControllers = List.generate(4, (_) => TextEditingController());
  final List<FocusNode> _pinFocusNodes = List.generate(4, (_) => FocusNode());

  bool _isLoading = false;
  bool _termsAccepted = true;
  bool _isOtpMode = false;

  static const Color primaryGreen = AppTheme.primaryGreen;

  @override
  void initState() {
    super.initState();
    _mobileController = TextEditingController(text: widget.initialPhone ?? '');
  }

  @override
  void dispose() {
    _mobileController.dispose();
    for (var c in _otpControllers) {
      c.dispose();
    }
    for (var f in _otpFocusNodes) {
      f.dispose();
    }
    for (var c in _pinControllers) {
      c.dispose();
    }
    for (var f in _pinFocusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  bool _validateInput() {
    final phone = _mobileController.text.trim().replaceAll(RegExp(r'\D'), '');
    if (phone.length != 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a valid 10-digit mobile number'),
          backgroundColor: Colors.red,
        ),
      );
      return false;
    }

    if (!_termsAccepted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please accept the Terms & Conditions and Privacy Policy to continue.'),
          backgroundColor: Colors.red,
        ),
      );
      return false;
    }

    return true;
  }

  void _onLoginWithOtp() {
    if (!_validateInput()) return;

    setState(() => _isLoading = true);
    Future.delayed(const Duration(milliseconds: 300), () {
      if (!mounted) return;
      for (var c in _otpControllers) {
        c.clear();
      }
      _otpControllers[0].text = '1';
      _otpControllers[1].text = '2';
      _otpControllers[2].text = '3';
      _otpControllers[3].text = '4';
      _otpControllers[4].text = '5';
      _otpControllers[5].text = '6';

      setState(() {
        _isLoading = false;
        _isOtpMode = true;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('OTP sent successfully! Demo OTP: 123456'),
          backgroundColor: primaryGreen,
        ),
      );
    });
  }

  Future<void> _verifyOtpAndLogin() async {
    final otpCode = _otpControllers.map((c) => c.text.trim()).join();
    if (otpCode.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter full 6-digit OTP code'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    final phone = _mobileController.text.trim().replaceAll(RegExp(r'\D'), '');

    try {
      final sRes = await http.get(Uri.parse(ApiConstants.checkApprovalStatusByMobile(phone))).timeout(const Duration(seconds: 8));
      if (sRes.statusCode == 200) {
        final data = jsonDecode(sRes.body);
        final restId = (data['restaurantId'] ?? '').toString();
        final token = (data['token'] ?? '').toString();
        final isApproved = data['restaurantApproved'] == true || data['verificationStatus'] == 'verified';

        String resolvedName = '';
        if (data['name'] != null && data['name'].toString().isNotEmpty) {
          final n = data['name'];
          resolvedName = (n is Map ? (n['en'] ?? '') : n).toString();
        } else if (data['restaurant'] != null && data['restaurant']['name'] != null) {
          final n = data['restaurant']['name'];
          resolvedName = (n is Map ? (n['en'] ?? '') : n).toString();
        }

        ApiConstants.setAuthenticatedSession(
          restaurantId: restId,
          authToken: token,
        );

        final prefs = await SharedPreferences.getInstance();
        if (restId.isNotEmpty) await prefs.setString('restaurantId', restId);
        if (token.isNotEmpty) await prefs.setString('token', token);
        await prefs.setString('userPhone', phone);
        if (resolvedName.isNotEmpty && resolvedName != 'null') {
          await prefs.setString('restaurantName', resolvedName);
        }

        if (!mounted) return;
        setState(() => _isLoading = false);

        if (isApproved) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Welcome Back, Partner! Logged in successfully.'),
              backgroundColor: primaryGreen,
            ),
          );
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const DashboardScreen()),
          );
        } else {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => WaitingForApprovalScreen(
                applicationId: restId.isNotEmpty ? restId : 'APP-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
                restaurantName: resolvedName.isNotEmpty ? resolvedName : 'Your Restaurant',
                city: 'Indore',
                appliedDate: DateTime.now().toIso8601String().substring(0, 10),
                mobileNumber: phone,
              ),
            ),
          );
        }
      } else {
        if (!mounted) return;
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No registered restaurant found with this mobile number.'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Connection error: $e'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  Future<void> _handlePinLogin(BuildContext sheetContext, String pin) async {
    Navigator.pop(sheetContext);
    setState(() => _isLoading = true);
    final mobile = _mobileController.text.trim().replaceAll(RegExp(r'\D'), '');

    try {
      final res = await http.post(
        Uri.parse('${ApiConstants.baseUrl}/restaurants/login-with-pin'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'mobile': mobile,
          'pin': pin,
        }),
      ).timeout(const Duration(seconds: 10));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final token = data['token'] ?? data['authToken'] ?? '';
        final restId = data['restaurantId'] ?? data['restaurant']?['_id'] ?? data['user']?['restaurantId'] ?? '';
        final isApproved = data['isApproved'] == true || data['restaurantApproved'] == true || data['approvalStatus'] == 'verified';

        String resolvedName = '';
        if (data['name'] != null && data['name'].toString().isNotEmpty) {
          final n = data['name'];
          resolvedName = (n is Map ? (n['en'] ?? '') : n).toString();
        } else if (data['restaurant'] != null && data['restaurant']['name'] != null) {
          final n = data['restaurant']['name'];
          resolvedName = (n is Map ? (n['en'] ?? '') : n).toString();
        }

        ApiConstants.setAuthenticatedSession(
          restaurantId: restId.toString(),
          authToken: token.toString(),
        );

        final prefs = await SharedPreferences.getInstance();
        if (restId.toString().isNotEmpty) await prefs.setString('restaurantId', restId.toString());
        if (token.toString().isNotEmpty) await prefs.setString('token', token.toString());
        await prefs.setString('userPhone', mobile);
        if (resolvedName.isNotEmpty && resolvedName != 'null') {
          await prefs.setString('restaurantName', resolvedName);
        }

        if (!mounted) return;
        setState(() => _isLoading = false);

        if (isApproved) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('PIN Verified! Welcome to ECDKART Partner Dashboard.'),
              backgroundColor: primaryGreen,
            ),
          );
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const DashboardScreen()),
          );
        } else {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => WaitingForApprovalScreen(
                applicationId: restId.toString().isNotEmpty ? restId.toString() : 'APP-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
                restaurantName: data['name'] ?? data['restaurant']?['name'] ?? 'Your Restaurant',
                city: data['city'] ?? 'Indore',
                appliedDate: DateTime.now().toIso8601String().substring(0, 10),
                mobileNumber: mobile,
              ),
            ),
          );
        }
      } else {
        String msg = 'Incorrect PIN entered. Please check your 4-digit PIN.';
        try {
          final err = jsonDecode(res.body);
          if (err['message'] != null) msg = err['message'];
        } catch (_) {}
        if (!mounted) return;
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(msg),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Connection error: $e'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  void _onLoginWithPin() {
    if (!_validateInput()) return;

    for (var c in _pinControllers) {
      c.clear();
    }
    _pinControllers[0].text = '1';
    _pinControllers[1].text = '2';
    _pinControllers[2].text = '3';
    _pinControllers[3].text = '4';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Floating Circle Close Button
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

              // PIN Entry Modal Card
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
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: primaryGreen.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.lock_rounded, color: primaryGreen, size: 24),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Enter Security PIN',
                                style: GoogleFonts.poppins(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.darkBlack,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Login to ${_mobileController.text.trim()} with your 4-digit PIN',
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // 4-Digit PIN Boxes
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: List.generate(4, (index) {
                        return SizedBox(
                          width: 58,
                          height: 58,
                          child: TextField(
                            controller: _pinControllers[index],
                            focusNode: _pinFocusNodes[index],
                            keyboardType: TextInputType.number,
                            textAlign: TextAlign.center,
                            maxLength: 1,
                            obscureText: true,
                            obscuringCharacter: '●',
                            style: GoogleFonts.poppins(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.darkBlack,
                            ),
                            decoration: InputDecoration(
                              counterText: '',
                              filled: true,
                              fillColor: const Color(0xFFF9FAFB),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(14),
                                borderSide: BorderSide(color: Colors.grey[300]!, width: 1.5),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(14),
                                borderSide: BorderSide(color: Colors.grey[300]!, width: 1.5),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(14),
                                borderSide: const BorderSide(color: primaryGreen, width: 2),
                              ),
                            ),
                            onChanged: (val) {
                              if (val.isNotEmpty && index < 3) {
                                _pinFocusNodes[index + 1].requestFocus();
                              } else if (val.isEmpty && index > 0) {
                                _pinFocusNodes[index - 1].requestFocus();
                              }
                            },
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 24),

                    // Demo PIN Hint
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: primaryGreen.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.info_outline_rounded, size: 16, color: primaryGreen),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Default quick demo PIN: 1234',
                              style: GoogleFonts.poppins(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: primaryGreen,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Submit PIN Login Button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: () {
                          final pin = _pinControllers.map((c) => c.text.trim()).join();
                          if (pin.length != 4) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Please enter 4-digit PIN'),
                                backgroundColor: Colors.red,
                              ),
                            );
                            return;
                          }

                          _handlePinLogin(ctx, pin);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primaryGreen,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: Text(
                          'Verify & Login',
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
        ),
      ),
    );
  }

  void _onRegisterNew() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => const LoginScreen(isLoggedOut: false),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Top Illustration Header
            Stack(
              clipBehavior: Clip.none,
              alignment: Alignment.bottomCenter,
              children: [
                Container(
                  height: 220,
                  width: double.infinity,
                  decoration: const BoxDecoration(
                    color: AppTheme.offWhiteBg,
                    image: DecorationImage(
                      image: AssetImage('assets/images/restaurant_otp_header.jpg'),
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

                if (_isOtpMode)
                  Positioned(
                    top: 40,
                    left: 16,
                    child: CircleAvatar(
                      backgroundColor: Colors.white,
                      radius: 18,
                      child: IconButton(
                        padding: EdgeInsets.zero,
                        icon: const Icon(Icons.arrow_back_rounded, color: AppTheme.darkBlack, size: 20),
                        onPressed: () {
                          setState(() {
                            _isOtpMode = false;
                          });
                        },
                      ),
                    ),
                  ),

                // Floating ECDKART Badge Logo
                Positioned(
                  bottom: -15,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: primaryGreen, width: 1.5),
                      boxShadow: [
                        BoxShadow(
                          color: primaryGreen.withValues(alpha: 0.12),
                          blurRadius: 14,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const EcdkartLogo(height: 28, fit: BoxFit.contain),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 32),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_isOtpMode) ...[
                    // OTP Verification Mode
                    Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Text(
                            'OTP Verification',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.poppins(
                              fontSize: 28,
                              fontWeight: FontWeight.w900,
                              color: AppTheme.darkBlack,
                              letterSpacing: -0.8,
                            ),
                          ),
                          const SizedBox(height: 6),
                          RichText(
                            textAlign: TextAlign.center,
                            text: TextSpan(
                              style: GoogleFonts.poppins(fontSize: 13, color: Colors.grey[600]),
                              children: [
                                const TextSpan(text: 'Enter the 6-digit verification code sent to '),
                                TextSpan(
                                  text: '+91 ${_mobileController.text.trim()}',
                                  style: GoogleFonts.poppins(
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.darkBlack,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 28),

                    // 6 OTP Input Boxes
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: List.generate(6, (index) {
                        return SizedBox(
                          width: 48,
                          height: 52,
                          child: TextField(
                            controller: _otpControllers[index],
                            focusNode: _otpFocusNodes[index],
                            keyboardType: TextInputType.number,
                            textAlign: TextAlign.center,
                            maxLength: 1,
                            style: GoogleFonts.poppins(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.darkBlack,
                            ),
                            decoration: InputDecoration(
                              counterText: '',
                              filled: true,
                              fillColor: const Color(0xFFF9FAFB),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: Colors.grey[300]!, width: 1.5),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: Colors.grey[300]!, width: 1.5),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: primaryGreen, width: 2),
                              ),
                            ),
                            onChanged: (val) {
                              if (val.isNotEmpty && index < 5) {
                                _otpFocusNodes[index + 1].requestFocus();
                              } else if (val.isEmpty && index > 0) {
                                _otpFocusNodes[index - 1].requestFocus();
                              }
                            },
                          ),
                        );
                      }),
                    ),

                    const SizedBox(height: 24),

                    // Verify OTP Button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _verifyOtpAndLogin,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primaryGreen,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: _isLoading
                            ? const CircularProgressIndicator(color: Colors.white)
                            : Text(
                                'Verify & Continue',
                                style: GoogleFonts.poppins(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Resend OTP Link
                    Center(
                      child: TextButton(
                        onPressed: _onLoginWithOtp,
                        child: Text(
                          'Resend OTP Code',
                          style: GoogleFonts.poppins(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: primaryGreen,
                          ),
                        ),
                      ),
                    ),
                  ] else ...[
                    // Primary Relogin View with OTP + PIN Options
                    Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          const WelcomeBackLogo(height: 72),
                          const SizedBox(height: 6),
                          Text(
                            'Enter your mobile number to get started',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.poppins(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 28),

                    // Phone Number Input Label
                    Text(
                      'Phone Number',
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.darkBlack,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFFF9FAFB),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey[300]!, width: 1.2),
                      ),
                      child: Row(
                        children: [
                          // +91 Country Code Badge
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                            decoration: BoxDecoration(
                              color: Colors.grey[100],
                              borderRadius: const BorderRadius.only(
                                topLeft: Radius.circular(11),
                                bottomLeft: Radius.circular(11),
                              ),
                              border: Border(right: BorderSide(color: Colors.grey[300]!, width: 1)),
                            ),
                            child: Row(
                              children: [
                                const Text('🇮🇳', style: TextStyle(fontSize: 18)),
                                const SizedBox(width: 6),
                                Text(
                                  '+91',
                                  style: GoogleFonts.poppins(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.darkBlack,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            child: TextField(
                              controller: _mobileController,
                              keyboardType: TextInputType.phone,
                              maxLength: 10,
                              style: GoogleFonts.poppins(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.darkBlack,
                                letterSpacing: 1.5,
                              ),
                              decoration: InputDecoration(
                                hintText: 'Enter 10-digit number',
                                hintStyle: GoogleFonts.poppins(
                                  fontSize: 13,
                                  fontWeight: FontWeight.normal,
                                  color: Colors.grey[400],
                                  letterSpacing: 0,
                                ),
                                counterText: '',
                                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                                border: InputBorder.none,
                                suffixIcon: _mobileController.text.isNotEmpty
                                    ? IconButton(
                                        icon: const Icon(Icons.clear_rounded, size: 18, color: Colors.grey),
                                        onPressed: () => setState(() => _mobileController.clear()),
                                      )
                                    : null,
                              ),
                              onChanged: (val) {
                                setState(() {});
                              },
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Interactive Terms & Conditions Checkbox
                    InkWell(
                      onTap: () {
                        setState(() {
                          _termsAccepted = !_termsAccepted;
                        });
                      },
                      borderRadius: BorderRadius.circular(8),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            SizedBox(
                              width: 22,
                              height: 22,
                              child: Checkbox(
                                value: _termsAccepted,
                                activeColor: primaryGreen,
                                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
                                side: BorderSide(
                                  color: _termsAccepted ? primaryGreen : Colors.grey[400]!,
                                  width: 1.5,
                                ),
                                onChanged: (val) {
                                  setState(() {
                                    _termsAccepted = val ?? false;
                                  });
                                },
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Wrap(
                                crossAxisAlignment: WrapCrossAlignment.center,
                                children: [
                                  Text(
                                    'I agree to the ',
                                    style: GoogleFonts.poppins(
                                      fontSize: 12,
                                      color: Colors.grey[700],
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  GestureDetector(
                                    onTap: () {
                                      Navigator.push(context, MaterialPageRoute(builder: (_) => const TermsConditionsScreen()));
                                    },
                                    child: Text(
                                      'Terms of Service',
                                      style: GoogleFonts.poppins(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: primaryGreen,
                                        decoration: TextDecoration.underline,
                                      ),
                                    ),
                                  ),
                                  Text(
                                    ' & ',
                                    style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[700]),
                                  ),
                                  GestureDetector(
                                    onTap: () {
                                      Navigator.push(context, MaterialPageRoute(builder: (_) => const PrivacyPolicyScreen()));
                                    },
                                    child: Text(
                                      'Privacy Policy',
                                      style: GoogleFonts.poppins(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: primaryGreen,
                                        decoration: TextDecoration.underline,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    // OPTION 1: Login with OTP / Get Started Button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _onLoginWithOtp,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primaryGreen,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: _isLoading
                            ? const CircularProgressIndicator(color: Colors.white)
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    'Login with OTP',
                                    style: GoogleFonts.poppins(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  const Icon(Icons.arrow_forward_rounded, size: 18),
                                ],
                              ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // OR Divider
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            height: 1,
                            color: Colors.grey.shade300,
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 14.0),
                          child: Text(
                            'OR',
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey[500],
                            ),
                          ),
                        ),
                        Expanded(
                          child: Container(
                            height: 1,
                            color: Colors.grey.shade300,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // OPTION 2: Login with PIN Button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: OutlinedButton.icon(
                        onPressed: _onLoginWithPin,
                        icon: const Icon(Icons.lock_clock_rounded, size: 20, color: primaryGreen),
                        label: Text(
                          'Login with PIN',
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: primaryGreen,
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          backgroundColor: const Color(0xFFF0FDF4),
                          side: const BorderSide(color: primaryGreen, width: 1.5),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Register Now Link for New Restaurant Outlets
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          "Don't have a Restaurant account? ",
                          style: GoogleFonts.poppins(
                            fontSize: 13,
                            color: Colors.grey[700],
                          ),
                        ),
                        GestureDetector(
                          onTap: _onRegisterNew,
                          child: Text(
                            'Register Now',
                            style: GoogleFonts.poppins(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: primaryGreen,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],

                  const SizedBox(height: 28),

                  // ECDKART Restaurant Partner Value Proposition & Features (Same content)
                  _buildRestaurantPartnerContent(),

                  const SizedBox(height: 32),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRestaurantPartnerContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Subtle Divider with center text
        Row(
          children: [
            Expanded(child: Divider(color: Colors.grey[300], thickness: 1)),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text(
                'WHY PARTNER WITH ECD KART',
                style: GoogleFonts.poppins(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.2,
                  color: Colors.grey[600],
                ),
              ),
            ),
            Expanded(child: Divider(color: Colors.grey[300], thickness: 1)),
          ],
        ),
        const SizedBox(height: 16),

        // Hero value badge
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                primaryGreen.withValues(alpha: 0.1),
                primaryGreen.withValues(alpha: 0.03),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: primaryGreen.withValues(alpha: 0.2)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: primaryGreen,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.rocket_launch_rounded, color: Colors.white, size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Grow Your Kitchen Sales in Sohna',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.darkBlack,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Direct orders, fast delivery & 0% setup fee for local restaurants.',
                      style: GoogleFonts.poppins(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w500,
                        color: Colors.grey[700],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // 3 Key Benefit Feature Cards
        _buildPartnerFeatureRow(
          icon: Icons.delivery_dining_rounded,
          iconColor: const Color(0xFF248C70),
          title: 'Hyperlocal Sohna Fleet',
          subtitle: 'Dedicated rider network ensuring speedy 25-30 min door-to-door delivery.',
        ),
        const SizedBox(height: 10),
        _buildPartnerFeatureRow(
          icon: Icons.account_balance_wallet_rounded,
          iconColor: const Color(0xFF2E7D32),
          title: 'Direct Weekly Settlements',
          subtitle: 'Transparent payouts transferred straight to your bank with zero hidden cuts.',
        ),
        const SizedBox(height: 10),
        _buildPartnerFeatureRow(
          icon: Icons.storefront_rounded,
          iconColor: const Color(0xFFE65100),
          title: 'Live Order & Menu Control',
          subtitle: 'Real-time loud audio alerts, instant item toggle & live price management.',
        ),
        const SizedBox(height: 16),

        // Stats ribbon (50+ Partners • 10K+ Orders • 25 Min Delivery)
        Container(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
          decoration: BoxDecoration(
            color: const Color(0xFFF9FAFB),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatItem('50+', 'Local Partners'),
              Container(width: 1, height: 24, color: Colors.grey[300]),
              _buildStatItem('25 Min', 'Avg Delivery'),
              Container(width: 1, height: 24, color: Colors.grey[300]),
              _buildStatItem('100%', 'Safe Payouts'),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Official Website Trust Badge
        Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.language_rounded, size: 13, color: Colors.grey),
                const SizedBox(width: 5),
                Text(
                  'ecdkart.co.in • Sohna, Gurugram (122103)',
                  style: GoogleFonts.poppins(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: Colors.grey[700],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPartnerFeatureRow({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: iconColor, size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.darkBlack,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: GoogleFonts.poppins(
                    fontSize: 10.5,
                    fontWeight: FontWeight.normal,
                    color: Colors.grey[600],
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String value, String label) {
    return Column(
      children: [
        Text(
          value,
          style: GoogleFonts.poppins(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: primaryGreen,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 9.5,
            fontWeight: FontWeight.w500,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }
}

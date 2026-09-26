import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../api_constants.dart';
import '../theme/app_theme.dart';
import '../widgets/ecdkart_logo.dart';
import 'dashboard_screen.dart';
import 'login_screen.dart';

class WaitingForApprovalScreen extends StatefulWidget {
  final String? restaurantId;
  final String? applicationId;
  final String? restaurantName;
  final String? city;
  final String? appliedDate;
  final String? mobile;
  final String? mobileNumber;

  const WaitingForApprovalScreen({
    super.key,
    this.restaurantId,
    this.applicationId,
    this.restaurantName,
    this.city,
    this.appliedDate,
    this.mobile,
    this.mobileNumber,
  });

  @override
  State<WaitingForApprovalScreen> createState() => _WaitingForApprovalScreenState();
}

class _WaitingForApprovalScreenState extends State<WaitingForApprovalScreen> {
  bool _isChecking = false;
  String _statusMessage = 'Your application is under review by the Admin team.';
  Timer? _pollingTimer;
  int _currentStep = 2; // 1: Submitted, 2: Documents Under Review, 3: Menu Review, 4: Approved
  bool _isRejected = false;
  String _rejectionReason = '';
  String _displayName = '';

  @override
  void initState() {
    super.initState();
    _displayName = widget.restaurantName ?? 'Your Restaurant';
    // Immediate check on load
    _checkApprovalStatus(isAutoPoll: true);
    // Background polling every 5 seconds for instant real-time sync
    _pollingTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted && !_isChecking) {
        _checkApprovalStatus(isAutoPoll: true);
      }
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> _checkApprovalStatus({bool isAutoPoll = false}) async {
    if (!isAutoPoll) {
      setState(() => _isChecking = true);
    }

    final prefs = await SharedPreferences.getInstance();
    final restId = widget.restaurantId ?? widget.applicationId ?? prefs.getString('restaurantId') ?? '';
    final phone = widget.mobile ?? widget.mobileNumber ?? prefs.getString('userPhone') ?? '8305370330';
    final token = prefs.getString('token') ?? '';

    String requestUrl = '';
    if (restId.isNotEmpty) {
      requestUrl = ApiConstants.getApprovalStatus(restId);
    } else if (phone.isNotEmpty) {
      requestUrl = ApiConstants.checkApprovalStatusByMobile(phone);
    } else {
      if (!isAutoPoll) {
        setState(() {
          _isChecking = false;
          _statusMessage = 'No active restaurant application found. Please register.';
        });
      }
      return;
    }

    try {
      final response = await http.get(
        Uri.parse(requestUrl),
        headers: {
          'Content-Type': 'application/json',
          if (token.isNotEmpty) 'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final isApproved = data['restaurantApproved'] == true || data['verificationStatus'] == 'verified';
        final isRejected = data['verificationStatus'] == 'rejected' || data['rejectionReason'] != null;
        final serverName = data['name'];
        final serverToken = data['token'];
        final returnedRestId = data['restaurantId'] ?? restId;

        if (serverName != null && serverName.toString().isNotEmpty) {
          _displayName = serverName.toString();
        }

        if (isApproved) {
          _pollingTimer?.cancel();
          if (returnedRestId != null && returnedRestId.toString().isNotEmpty) {
            final effectiveToken = (serverToken != null && serverToken.toString().isNotEmpty)
                ? serverToken.toString()
                : (token.isNotEmpty ? token : 'token_$returnedRestId');
            ApiConstants.setAuthenticatedSession(
              restaurantId: returnedRestId.toString(),
              authToken: effectiveToken,
            );
            await prefs.setString('restaurantId', returnedRestId.toString());
            await prefs.setString('token', effectiveToken);
          }

          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Row(
                  children: [
                    Icon(Icons.check_circle_rounded, color: Colors.white),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text('🎉 Congratulations! Your restaurant has been Approved by Admin!'),
                    ),
                  ],
                ),
                backgroundColor: AppTheme.primaryGreen,
                duration: Duration(seconds: 4),
              ),
            );
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => const DashboardScreen()),
            );
          }
          return;
        } else if (isRejected) {
          setState(() {
            _isRejected = true;
            _currentStep = 2;
            _rejectionReason = data['rejectionReason'] ?? 'Document verification could not be completed.';
            _statusMessage = 'Application Rejected by Admin.\nReason: $_rejectionReason';
          });
        } else {
          final menuApproved = data['menuApproved'] == true;
          setState(() {
            _isRejected = false;
            _currentStep = menuApproved ? 3 : 2;
            _statusMessage = 'Application is actively under review by the Admin team.';
          });
          if (!isAutoPoll && mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Status checked: Verification in progress...'),
                backgroundColor: Colors.teal,
                duration: Duration(seconds: 2),
              ),
            );
          }
        }
      } else {
        if (!isAutoPoll) {
          setState(() {
            _statusMessage = 'Pending Admin review. Live checking active.';
          });
        }
      }
    } catch (e) {
      if (!isAutoPoll) {
        setState(() {
          _statusMessage = 'Checking with server... Waiting for Admin approval.';
        });
      }
    } finally {
      if (mounted && !isAutoPoll) {
        setState(() => _isChecking = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        centerTitle: true,
        title: const EcdkartLogo(height: 26),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.grey),
            tooltip: 'Logout',
            onPressed: () async {
              _pollingTimer?.cancel();
              final prefs = await SharedPreferences.getInstance();
              await prefs.clear();
              ApiConstants.clearAuthenticatedSession();
              if (context.mounted) {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (context) => const LoginScreen(isLoggedOut: true)),
                );
              }
            },
          )
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 18.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Animated Top Header Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: _isRejected ? Colors.red.shade50 : Colors.amber.shade50,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: _isRejected ? Colors.red.shade200 : Colors.amber.shade300,
                          width: 2.5,
                        ),
                      ),
                      child: Center(
                        child: Icon(
                          _isRejected ? Icons.cancel_outlined : Icons.hourglass_top_rounded,
                          size: 40,
                          color: _isRejected ? Colors.red : Colors.amber.shade800,
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      _isRejected ? 'Application Needs Revision' : 'Waiting for Admin Approval',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF1E293B),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEEF2F6),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _displayName,
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF334155),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      _statusMessage,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        color: _isRejected ? Colors.red.shade700 : const Color(0xFF64748B),
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 18),

              // Live Verification Tracking Timeline / Stepper
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
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
                          'Live Application Tracking',
                          style: GoogleFonts.poppins(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFECFDF5),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 7,
                                height: 7,
                                decoration: const BoxDecoration(
                                  color: AppTheme.primaryGreen,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 5),
                              Text(
                                'LIVE SYNC',
                                style: GoogleFonts.poppins(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.primaryGreen,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),

                    // Step 1: Application Submitted
                    _buildTrackingStep(
                      stepNumber: 1,
                      title: 'Application Submitted',
                      subtitle: 'Restaurant details, location & bank info uploaded',
                      isCompleted: true,
                      isActive: false,
                      isLast: false,
                    ),

                    // Step 2: Documents & Bank Verification
                    _buildTrackingStep(
                      stepNumber: 2,
                      title: 'Documents & Bank Verification',
                      subtitle: _isRejected
                          ? 'Verification failed: $_rejectionReason'
                          : (_currentStep > 2 ? 'FSSAI License & Bank details verified' : 'Admin verifying food license & bank documents'),
                      isCompleted: _currentStep > 2,
                      isActive: _currentStep == 2 && !_isRejected,
                      isFailed: _isRejected,
                      isLast: false,
                    ),

                    // Step 3: Menu & Pricing Review
                    _buildTrackingStep(
                      stepNumber: 3,
                      title: 'Menu & Pricing Review',
                      subtitle: _currentStep >= 3 ? 'Menu items checked & approved' : 'Reviewing dish categories and prices',
                      isCompleted: _currentStep >= 3,
                      isActive: _currentStep == 3,
                      isLast: false,
                    ),

                    // Step 4: Admin Final Approval
                    _buildTrackingStep(
                      stepNumber: 4,
                      title: 'Admin Final Approval',
                      subtitle: 'Store activation & live order routing enabled',
                      isCompleted: _currentStep >= 4,
                      isActive: _currentStep == 4,
                      isLast: true,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 18),

              // What happens next card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.notifications_active_outlined, size: 22, color: Color(0xFF0F766E)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Instant Push & Notification Alert',
                            style: GoogleFonts.poppins(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF1E293B),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'As soon as Admin approves your store, you will receive a push notification and this screen will automatically open your Partner Dashboard.',
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              color: const Color(0xFF64748B),
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Manual Refresh Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: _isChecking ? null : () => _checkApprovalStatus(isAutoPoll: false),
                  icon: _isChecking
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.refresh_rounded, color: Colors.white),
                  label: Text(
                    _isChecking ? 'Checking Live Approval...' : 'Check Approval Status',
                    style: GoogleFonts.poppins(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0F766E),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 10),

              // Switch Account / Back to login
              TextButton(
                onPressed: () {
                  _pollingTimer?.cancel();
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(builder: (context) => const LoginScreen()),
                  );
                },
                child: Text(
                  'Switch Account / Back to Login',
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF64748B),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTrackingStep({
    required int stepNumber,
    required String title,
    required String subtitle,
    required bool isCompleted,
    required bool isActive,
    bool isFailed = false,
    required bool isLast,
  }) {
    Color circleBg = const Color(0xFFE2E8F0);
    Color circleBorder = const Color(0xFFCBD5E1);
    Widget iconWidget = Text(
      '$stepNumber',
      style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 13, color: const Color(0xFF94A3B8)),
    );

    if (isCompleted) {
      circleBg = AppTheme.primaryGreen;
      circleBorder = AppTheme.primaryGreen;
      iconWidget = const Icon(Icons.check_rounded, color: Colors.white, size: 16);
    } else if (isFailed) {
      circleBg = Colors.red.shade600;
      circleBorder = Colors.red.shade600;
      iconWidget = const Icon(Icons.close_rounded, color: Colors.white, size: 16);
    } else if (isActive) {
      circleBg = Colors.amber.shade500;
      circleBorder = Colors.amber.shade600;
      iconWidget = const SizedBox(
        width: 14,
        height: 14,
        child: CircularProgressIndicator(strokeWidth: 2.2, color: Colors.white),
      );
    }

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Step Icon + Vertical Line
          Column(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: circleBg,
                  shape: BoxShape.circle,
                  border: Border.all(color: circleBorder, width: 2),
                ),
                child: Center(child: iconWidget),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2.5,
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    color: isCompleted ? AppTheme.primaryGreen : const Color(0xFFE2E8F0),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 14),

          // Step Text Details
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: isCompleted
                          ? AppTheme.primaryGreen
                          : (isFailed ? Colors.red.shade700 : (isActive ? Colors.amber.shade900 : const Color(0xFF334155))),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      color: const Color(0xFF64748B),
                      height: 1.35,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}


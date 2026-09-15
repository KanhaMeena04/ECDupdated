import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:ecdkart_app/core/theme/app_colors.dart';
import 'package:ecdkart_app/core/theme/app_text_styles.dart';
import 'package:ecdkart_app/pages/profile/policy_page.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _mobileController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  TapGestureRecognizer? _termsRecognizer;
  TapGestureRecognizer? _privacyRecognizer;

  TapGestureRecognizer get termsRecognizer =>
      _termsRecognizer ??= (TapGestureRecognizer()..onTap = _showTermsBottomSheet);

  TapGestureRecognizer get privacyRecognizer =>
      _privacyRecognizer ??= (TapGestureRecognizer()..onTap = _showPrivacyBottomSheet);

  static const List<PolicySection> _termsSections = [
    PolicySection(
      heading: '1. Introduction & Definitions',
      content:
          'The Platform is operated by ECDKART (OPC) PRIVATE LIMITED. By downloading or using the ECDKART Customer App, you agree to these Terms & Conditions. "Platform" refers to the ECDKART app and services. "Restaurant Partner" refers to listed food outlets, and "Rider" refers to delivery personnel.',
    ),
    PolicySection(
      heading: '2. Account Registration & Security',
      content:
          'You must provide accurate information to register. You are responsible for maintaining the confidentiality of your account credentials and OTPs. ECDKART uses OTP-based authentication for security. Do not share your OTPs with unknown persons.',
    ),
    PolicySection(
      heading: '3. Ordering & Services',
      content:
          'ECDKART facilitates Home Delivery and Self Pickup from Restaurant Partners. Restaurant Partners are responsible for food preparation and quality. Placing an order does not guarantee acceptance; orders may be rejected due to item unavailability or operational limits.',
    ),
    PolicySection(
      heading: '4. Payments & Refunds',
      content:
          'Payments can be made via UPI, Debit/Credit Cards, Wallets, and other supported methods. Cancellations may be available before food preparation begins. Refunds for eligible cancelled or rejected orders will be processed according to the ECDKART Refund & Cancellation Policy.',
    ),
    PolicySection(
      heading: '5. Prohibited Activities & Conduct',
      content:
          'You must not use the Platform for unlawful purposes, submit fraudulent refund claims, create fake accounts, manipulate payments, or harass Restaurant Partners or Riders. ECDKART may suspend or terminate accounts involved in fraud or abuse.',
    ),
    PolicySection(
      heading: '6. Limitation of Liability',
      content:
          'To the maximum extent permitted by applicable law, ECDKART acts as a technology platform and will not be liable for losses arising solely from circumstances beyond its reasonable control, including food quality issues which are the responsibility of the Restaurant Partner.',
    ),
    PolicySection(
      heading: '7. Dispute Resolution & Grievance',
      content:
          'These Terms shall be governed by the laws applicable in India. For complaints or grievances, please contact us at:\n\nECDKART (OPC) PRIVATE LIMITED\nWebsite: https://ecdkart.co.in\nPlease provide your registered mobile number and Order ID for faster resolution.',
    ),
  ];

  static const List<PolicySection> _privacySections = [
    PolicySection(
      heading: 'Overview & Compliance',
      content:
          'Effective Date: August 10, 2026\n\nECD KART (OPC) PRIVATE LIMITED ("Company", "We", "Our", or "Us") operates the online food ordering system through our smartphone application. This privacy statement documents how we acquire, handle, store, transfer, and safeguard user information in compliance with the Indian Information Technology Act, 2000 and the Digital Personal Data Protection (DPDP) Act, 2023.',
    ),
    PolicySection(
      heading: '1. Information Collection Practices',
      content:
          'When you register a profile or place an order, we acquire the following:\n\n• Contact Profiles: Full name, telephone numbers, secondary emails, and precise delivery path addresses.\n• Authentication Data: SMS-driven One-Time Password tokens (OTPs).',
    ),
    PolicySection(
      heading: '2. Location Telemetry Data',
      content:
          'To drive effective food delivery dispatch and tracking, we require active GPS location coordinates from your smartphone when the app is in use (foreground). This facilitates accurate address selection and real-time tracking during active checkouts. You can revoke this permission at any time in device settings.',
    ),
    PolicySection(
      heading: '3. Payment Processing Safeguards',
      content:
          'Payment operations are routed exclusively through Reserve Bank of India (RBI) authorized third-party gateways (e.g., Razorpay). ECD KART does NOT access or store full card details or UPI PIN passwords on our servers.',
    ),
    PolicySection(
      heading: '4. Third-Party Integrations',
      content:
          'We may pass specific profile details (such as customer phone and delivery address) to assigned delivery riders to facilitate quick drops. We strictly do not sell or lease user listings to marketing companies.',
    ),
    PolicySection(
      heading: '5. Data Security & Retention',
      content:
          'All electronic communications utilize Secure Sockets Layer (SSL/TLS) encryption. Customer profiles and logs are retained securely on servers in India, and are purged or anonymized upon request or within 12 months of profile closure, unless regulatory retention is requested by law.',
    ),
    PolicySection(
      heading: '6. Your Digital Rights & Deletion',
      content:
          'Under Indian DPDP guidelines, you hold the right to access profile parameters, modify discrepancies, withdraw consent, or file for complete deletion of your customer logs directly from the app settings or by contacting our support.',
    ),
    PolicySection(
      heading: '7. Grievance Officer & Contact',
      content:
          'In accordance with federal compliance regulations, if you have privacy concerns, please contact our Grievance Officer at:\n\nECD KART (OPC) PRIVATE LIMITED\nWebsite: https://ecdkart.co.in\nEmail: support@ecdkart.co.in',
    ),
  ];

  @override
  void dispose() {
    _termsRecognizer?.dispose();
    _privacyRecognizer?.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _mobileController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _showTermsBottomSheet() {
    _showPolicyBottomSheet(
      title: 'Terms & Conditions',
      emoji: '📄',
      sections: _termsSections,
    );
  }

  void _showPrivacyBottomSheet() {
    _showPolicyBottomSheet(
      title: 'Privacy Policy',
      emoji: '🔒',
      sections: _privacySections,
    );
  }

  void _showPolicyBottomSheet({
    required String title,
    required String emoji,
    required List<PolicySection> sections,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.75,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    Text(emoji, style: const TextStyle(fontSize: 22)),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        title,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.black,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.grey),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.all(20),
                  itemCount: sections.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 16),
                  itemBuilder: (context, index) {
                    final section = sections[index];
                    return Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAF9),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            section.heading,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF248C70),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            section.content,
                            style: const TextStyle(
                              fontSize: 13,
                              color: Colors.black87,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Top Image fading into white
            SizedBox(
              height: 160,
              child: Stack(
                alignment: Alignment.bottomCenter,
                children: [
                  Positioned.fill(
                    child: Image.asset(
                      'assets/flat-lay-delicious-bread-with-tomatoes-chopper-with-copy-space 1.jpg',
                      fit: BoxFit.cover,
                      alignment: Alignment.topCenter,
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 80,
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.white.withOpacity(0.0),
                            Colors.white.withOpacity(0.8),
                            Colors.white,
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            // Heading
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                children: [
                  const Text(
                    'Create Your Account',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.black,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Sign up to explore delicious meals and get them delivered to your location',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                      height: 1.3,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            
            // Form Section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _buildTextField(
                            label: 'First Name',
                            hint: 'First Name',
                            controller: _firstNameController,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildTextField(
                            label: 'Last Name',
                            hint: 'Last Name',
                            controller: _lastNameController,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _buildTextField(
                      label: 'Mobile Number',
                      hint: 'Enter Mobile Number',
                      keyboardType: TextInputType.phone,
                      maxLength: 10,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      controller: _mobileController,
                    ),
                    const SizedBox(height: 12),
                    _buildTextField(
                      label: 'Email (Optional)',
                      hint: 'Enter Email',
                      keyboardType: TextInputType.emailAddress,
                      controller: _emailController,
                    ),
                    const SizedBox(height: 12),
                    _buildPasswordField(
                      label: 'Password',
                      hint: '........',
                      obscure: _obscurePassword,
                      controller: _passwordController,
                      onToggle: () => setState(() => _obscurePassword = !_obscurePassword),
                    ),
                    const SizedBox(height: 12),
                    _buildPasswordField(
                      label: 'Confirm Password',
                      hint: '........',
                      obscure: _obscureConfirmPassword,
                      controller: _confirmPasswordController,
                      onToggle: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                    ),
                    
                    const SizedBox(height: 20),
                    
                    // Create Account Button
                    SizedBox(
                      height: 46,
                      child: ElevatedButton(
                        onPressed: () {
                          // TODO: implement registration
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF248C70),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          elevation: 0,
                        ).copyWith(
                          overlayColor: WidgetStateProperty.resolveWith<Color?>(
                            (Set<WidgetState> states) {
                              if (states.contains(WidgetState.hovered)) {
                                return const Color(0xFF238E66);
                              }
                              if (states.contains(WidgetState.pressed)) {
                                return const Color(0xFF1E7554);
                              }
                              return null;
                            },
                          ),
                        ),
                        child: const Text(
                          'Create Account',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.2,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    
                    // Terms and Privacy
                    Center(
                      child: RichText(
                        textAlign: TextAlign.center,
                        text: TextSpan(
                          style: const TextStyle(color: Colors.black87, fontSize: 11, height: 1.4),
                          children: [
                            const TextSpan(text: 'I agree to the '),
                            TextSpan(
                              text: 'Terms & Conditions',
                              style: const TextStyle(
                                color: Color(0xFFE5212E),
                                fontWeight: FontWeight.w500,
                              ),
                              recognizer: termsRecognizer,
                            ),
                            const TextSpan(text: ' and\n'),
                            TextSpan(
                              text: 'Privacy Policy',
                              style: const TextStyle(
                                color: Color(0xFFE5212E),
                                fontWeight: FontWeight.w500,
                              ),
                              recognizer: privacyRecognizer,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // Already have an account
                    Center(
                      child: GestureDetector(
                        onTap: () => context.pop(),
                        child: RichText(
                          text: const TextSpan(
                            style: TextStyle(color: Colors.black87, fontSize: 13),
                            children: [
                              TextSpan(text: 'Already have an account? '),
                              TextSpan(
                                text: 'Login',
                                style: TextStyle(
                                  color: Color(0xFFE5212E),
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required String hint,
    TextInputType keyboardType = TextInputType.text,
    int? maxLength,
    List<TextInputFormatter>? inputFormatters,
    Widget? prefixIcon,
    TextEditingController? controller,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            color: Colors.black87,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 6),
        SizedBox(
          height: 48,
          child: TextFormField(
            controller: controller,
            keyboardType: keyboardType,
            maxLength: maxLength,
            inputFormatters: inputFormatters,
            style: const TextStyle(fontSize: 14),
            decoration: InputDecoration(
              counterText: '',
              hintText: hint,
              hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
              prefixIcon: prefixIcon,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey.shade300, width: 1),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: Color(0xFF248C70), width: 1.5),
              ),
              filled: true,
              fillColor: Colors.white,
            ),
            validator: validator,
          ),
        ),
      ],
    );
  }

  Widget _buildPasswordField({
    required String label,
    required String hint,
    required bool obscure,
    required VoidCallback onToggle,
    TextEditingController? controller,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            color: Colors.black87,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 6),
        SizedBox(
          height: 48,
          child: TextFormField(
            controller: controller,
            obscureText: obscure,
            style: const TextStyle(fontSize: 14),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey.shade300, width: 1),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: Color(0xFF248C70), width: 1.5),
              ),
              filled: true,
              fillColor: Colors.white,
              suffixIcon: IconButton(
                icon: Icon(
                  obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  color: Colors.grey.shade400,
                  size: 20,
                ),
                onPressed: onToggle,
              ),
            ),
          ),
        ),
      ],
    );
  }
}


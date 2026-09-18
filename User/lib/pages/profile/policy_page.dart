import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme/app_colors.dart';
import '../../providers/theme_provider.dart';
import 'support_chat_page.dart';

// â”€â”€ Data models â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class PolicySection {
  final String heading;
  final String content;
  final Widget? customWidget;

  const PolicySection({
    required this.heading,
    required this.content,
    this.customWidget,
  });
}

// â”€â”€ Reusable PolicyPage widget â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class PolicyPage extends StatefulWidget {
  final String title;
  final String emoji;
  final List<PolicySection> sections;
  final Widget? customHeaderWidget;

  const PolicyPage({
    super.key,
    required this.title,
    required this.emoji,
    required this.sections,
    this.customHeaderWidget,
  });

  @override
  State<PolicyPage> createState() => _PolicyPageState();
}

class _PolicyPageState extends State<PolicyPage> {
  final Set<int> _expanded = {};

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    return Scaffold(
      backgroundColor: isDark ? Colors.black : const Color(0xFFF5FAF8),
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new,
              color: Colors.white, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          widget.title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Colors.white,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // â”€â”€ Header card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          // ── Clean Header (Plain White Background) ─────────────────────────
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFE5E7EB)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: [
                Image.asset(
                  'assets/splash_logo.png',
                  height: 64,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => Image.asset(
                    'assets/logo.png',
                    height: 64,
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => const Icon(
                      Icons.restaurant_menu_rounded,
                      size: 48,
                      color: Color(0xFF248C70),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  widget.title,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : Colors.black87,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Last updated: June 2025',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white54 : Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          ),

          if (widget.customHeaderWidget != null) ...[
            const SizedBox(height: 16),
            widget.customHeaderWidget!,
          ],

          const SizedBox(height: 20),

          // â”€â”€ Expandable sections â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          ...List.generate(widget.sections.length, (index) {
            final section = widget.sections[index];
            final isExpanded = _expanded.contains(index);

            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              decoration: BoxDecoration(
                color: isDark ? Colors.black : Colors.white,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () {
                      setState(() {
                        if (isExpanded) {
                          _expanded.remove(index);
                        } else {
                          _expanded.add(index);
                        }
                      });
                    },
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Heading row
                        Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 14),
                          child: Row(
                            children: [
                              Container(
                                width: 28,
                                height: 28,
                                decoration: BoxDecoration(
                                  color:
                                      AppColors.primary.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Center(
                                  child: Text(
                                    '${index + 1}',
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  section.heading,
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                    color: isDark ? Colors.white : const Color(0xFF2C2C2C),
                                  ),
                                ),
                              ),
                              AnimatedRotation(
                                turns: isExpanded ? 0.5 : 0,
                                duration: const Duration(milliseconds: 200),
                                child: const Icon(
                                  Icons.keyboard_arrow_down,
                                  color: AppColors.primary,
                                  size: 22,
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Expandable content
                        AnimatedCrossFade(
                          firstChild: const SizedBox.shrink(),
                          secondChild: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Divider(
                                  color:
                                      AppColors.primary.withValues(alpha: 0.15),
                                  height: 1,
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  section.content,
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: isDark ? Colors.white70 : const Color(0xFF4B5563),
                                    height: 1.6,
                                  ),
                                ),
                                if (section.customWidget != null) ...[
                                  const SizedBox(height: 12),
                                  section.customWidget!,
                                ],
                              ],
                            ),
                          ),
                          crossFadeState: isExpanded
                              ? CrossFadeState.showSecond
                              : CrossFadeState.showFirst,
                          duration: const Duration(milliseconds: 200),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }),

          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

// â”€â”€ Support Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class SupportPage extends StatelessWidget {
  const SupportPage({super.key});

  Future<void> _makeCall() async {
    final Uri callUri = Uri(scheme: 'tel', path: '8950605676');
    if (await canLaunchUrl(callUri)) {
      await launchUrl(callUri);
    }
  }

  Widget _buildActionButton({
    required String title,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Material(
      color: color,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: Colors.white, size: 18),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final actionButtons = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 6),
        Row(
          children: [
            Expanded(
              child: _buildActionButton(
                title: 'Chat Support',
                icon: Icons.chat_bubble_rounded,
                color: const Color(0xFF248C70),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const SupportChatPage()),
                  );
                },
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildActionButton(
                title: 'Call Support',
                icon: Icons.phone_rounded,
                color: const Color(0xFFE89D1E),
                onTap: _makeCall,
              ),
            ),
          ],
        ),
      ],
    );

    return PolicyPage(
      title: 'Help & Support',
      emoji: '',
      customHeaderWidget: actionButtons,
      sections: [
        PolicySection(
          heading: 'We are here for you',
          content: 'We are 100% available for your response. If you need any assistance, have questions, or face any issues, our support team is ready to help you.',
        ),
        PolicySection(
          heading: 'Contact Details',
          content: 'Email: support@ecdkart.co.in\nPhone: +91 89506 05676\n\nFeel free to reach out to us anytime.',
          customWidget: actionButtons,
        ),
      ],
    );
  }
}

// â”€â”€ FAQ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class FaqPage extends StatelessWidget {
  const FaqPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const PolicyPage(
      title: 'FAQs',
      emoji: '❓',
      sections: [
        PolicySection(
          heading: '1. What is ECDKART?',
          content: 'ECDKART is a food ordering platform that allows customers to discover participating restaurants, order food, make payments, and choose between Home Delivery and Self Pickup where available.',
        ),
        PolicySection(
          heading: '2. How do I place an order?',
          content: 'Open ECDKART, select your location and restaurant, add items to your cart, choose Home Delivery or Self Pickup, confirm your details, select a payment method, and place your order.',
        ),
        PolicySection(
          heading: '3. Can I track my order?',
          content: 'Where order tracking is available, you may be able to view your order status in real-time through the ECDKART App under "My Orders".',
        ),
        PolicySection(
          heading: '4. Can I cancel my order?',
          content: 'Cancellation may be available before the restaurant starts preparing your food. Once food preparation has started, cancellation may not be permitted.',
        ),
        PolicySection(
          heading: '5. How can I request a refund?',
          content: 'If you believe your order qualifies for a refund, contact ECDKART Support and provide your Order ID. Refund eligibility is determined according to the ECDKART Refund & Cancellation Policy.',
        ),
        PolicySection(
          heading: '6. What payment methods are available?',
          content: 'Payment methods include UPI, Debit/Credit Cards, Wallets, and other supported payment methods displayed during checkout.',
        ),
        PolicySection(
          heading: '7. Why does ECDKART need my location?',
          content: 'Location is used to show nearby restaurants, determine delivery availability, calculate delivery distance, provide order tracking, and support location-based Self Pickup services.',
        ),
        PolicySection(
          heading: '8. How can I delete my ECDKART account?',
          content: 'You can use the account deletion option available in your Profile settings under "Edit Profile", or contact ECDKART Support for an account deletion request. Certain information may be retained where required by law.',
        ),
        PolicySection(
          heading: '9. How can I contact ECDKART Support?',
          content: 'You can contact us via our website (https://ecdkart.co.in) or email. Please provide your Order ID for faster assistance.',
        ),
      ],
    );
  }
}

// â”€â”€ About App Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class AboutAppPage extends StatelessWidget {
  const AboutAppPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const PolicyPage(
      title: 'About App',
      emoji: 'ðŸ“±',
      sections: [
        PolicySection(
          heading: 'ECDKART',
          content: 'ECDKART is your premium food delivery application, designed to bring the best local restaurants right to your doorstep. Our mission is to provide lightning-fast deliveries with top-notch reliability.',
        ),
        PolicySection(
          heading: 'App Version',
          content: 'Version 1.0.0 (Build 1)\nDeveloped by ECDKART (OPC) PRIVATE LIMITED.\nTechnology Partner: webintegratorz technologies',
        ),
      ],
    );
  }
}

// â”€â”€ Privacy Policy Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class PrivacyPolicyPage extends StatelessWidget {
  const PrivacyPolicyPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const PolicyPage(
      title: 'Privacy Policy',
      emoji: 'ðŸ”’',
      sections: [
        PolicySection(
          heading: 'Overview & Compliance',
          content: 'Effective Date: August 10, 2026\n\n'
                   'ECD KART (OPC) PRIVATE LIMITED ("Company", "We", "Our", or "Us") operates the online food ordering system through our smartphone application. This privacy statement documents how we acquire, handle, store, transfer, and safeguard user information in compliance with the Indian Information Technology Act, 2000 and the Digital Personal Data Protection (DPDP) Act, 2023.',
        ),
        PolicySection(
          heading: '1. Information Collection Practices',
          content: 'When you register a profile or place an order, we acquire the following:\n\n'
                   '• Contact Profiles: Full name, telephone numbers, secondary emails, and precise delivery path addresses.\n'
                   '• Authentication Data: SMS-driven One-Time Password tokens (OTPs).',
        ),
        PolicySection(
          heading: '2. Location Telemetry Data',
          content: 'To drive effective food delivery dispatch and tracking, we require active GPS location coordinates from your smartphone when the app is in use (foreground). This facilitates accurate address selection and real-time tracking during active checkouts. You can revoke this permission at any time in device settings.',
        ),
        PolicySection(
          heading: '3. Payment Processing Safeguards',
          content: 'Payment operations are routed exclusively through Reserve Bank of India (RBI) authorized third-party gateways (e.g., Razorpay). ECD KART does NOT access or store full card details or UPI PIN passwords on our servers.',
        ),
        PolicySection(
          heading: '4. Third-Party Integrations',
          content: 'We may pass specific profile details (such as customer phone and delivery address) to assigned delivery riders to facilitate quick drops. We strictly do not sell or lease user listings to marketing companies.',
        ),
        PolicySection(
          heading: '5. Data Security & Retention',
          content: 'All electronic communications utilize Secure Sockets Layer (SSL/TLS) encryption. Customer profiles and logs are retained securely on servers in India, and are purged or anonymized upon request or within 12 months of profile closure, unless regulatory retention is requested by law.',
        ),
        PolicySection(
          heading: '6. Your Digital Rights & Deletion',
          content: 'Under Indian DPDP guidelines, you hold the right to access profile parameters, modify discrepancies, withdraw consent, or file for complete deletion of your customer logs directly from the app settings or by contacting our support.',
        ),
        PolicySection(
          heading: '7. Grievance Officer & Contact',
          content: 'In accordance with federal compliance regulations, if you have privacy concerns, please contact our Grievance Officer at:\n\n'
                   'ECD KART (OPC) PRIVATE LIMITED\n'
                   'Website: https://ecdkart.co.in\n'
                   'Email: support@ecdkart.co.in',
        ),
      ],
    );
  }
}

// ── Refund Policy Page ───────────────────────────────────────────────────────

class RefundPolicyPage extends StatelessWidget {
  const RefundPolicyPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const PolicyPage(
      title: 'Refund Policy',
      emoji: '💰',
      sections: [
        PolicySection(
          heading: 'Refund Eligibility',
          content:
              'You are eligible for a refund if: (a) your order was not delivered within the '
              'promised time window and you did not receive it, (b) you received the wrong items '
              'or your order was significantly different from what was described, (c) the food '
              'quality was unacceptable due to spoilage or contamination, or (d) you were charged '
              'incorrectly. Refund requests must be raised within 24 hours of the expected delivery '
              'time through the app or by contacting our support team.',
        ),
        PolicySection(
          heading: 'Non-Refundable Cases',
          content:
              'Refunds will not be issued in the following situations: (a) the order was delivered '
              'successfully and matches the description but you changed your mind, (b) incorrect '
              'delivery address was provided by the customer, (c) the customer was unavailable at '
              'the delivery location after multiple attempts, (d) the refund request was raised '
              'more than 24 hours after the order, (e) the issue was caused by factors outside '
              'ECDKART\'s control such as natural disasters or government restrictions, or '
              '(f) promotional or free items included in the order.',
        ),
        PolicySection(
          heading: 'Refund Process',
          content:
              'To initiate a refund, go to My Orders in the app, select the relevant order, and '
              'tap "Report an Issue". Describe the problem and attach photos if applicable. '
              'Alternatively, contact our support team at support@ecdkart.co.in or call +91 89506 05676. '
              'Our team will review your request within 24–48 hours. If approved, the refund will '
              'be processed to your original payment method. For cash-on-delivery orders, refunds '
              'will be credited as ECDKART wallet balance.',
        ),
        PolicySection(
          heading: 'Refund Timeline',
          content:
              'Once a refund is approved, the processing time depends on your payment method:\n\n'
              '• UPI / Net Banking: 2–3 business days\n'
              '• Credit / Debit Card: 5–7 business days\n'
              '• ECDKART Wallet: Instant\n'
              '• Cash on Delivery: Credited as wallet balance within 24 hours\n\n'
              'Please note that bank processing times may vary. If you do not receive your refund '
              'within the stated period, contact your bank before reaching out to us.',
        ),
        PolicySection(
          heading: 'Partial Refunds',
          content:
              'In cases where only part of your order was affected — for example, one item was '
              'missing from a multi-item order — ECDKART may issue a partial refund corresponding '
              'to the value of the affected item(s). The partial refund amount will be calculated '
              'based on the item price at the time of order, excluding any discounts or offers '
              'applied to the overall order. Partial refunds are credited to your ECDKART wallet '
              'by default for faster processing.',
        ),
        PolicySection(
          heading: 'Contact for Refunds',
          content:
              'For any refund-related queries or disputes, please contact us:\n\n'
              'Email: support@ecdkart.co.in\n'
              'Phone: +91 89506 05676 (Mon–Sat, 9 AM – 9 PM)\n'
              'In-App: My Orders → Select Order → Report an Issue\n'
              'Address: ECDKART Technologies Pvt. Ltd., 42 MG Road, Indore, Madhya Pradesh – 452001, India\n\n'
              'We are committed to resolving all refund disputes fairly and promptly.',
        ),
      ],
    );
  }
}

// ── Terms & Conditions Page ──────────────────────────────────────────────────

class TermsConditionsPage extends StatelessWidget {
  const TermsConditionsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const PolicyPage(
      title: 'Terms & Conditions',
      emoji: '📄',
      sections: [
        PolicySection(
          heading: '1. Introduction & Definitions',
          content: 'The Platform is operated by ECDKART (OPC) PRIVATE LIMITED. By downloading or using the ECDKART Customer App, you agree to these Terms & Conditions. "Platform" refers to the ECDKART app and services. "Restaurant Partner" refers to listed food outlets, and "Rider" refers to delivery personnel.',
        ),
        PolicySection(
          heading: '2. Account Registration & Security',
          content: 'You must provide accurate information to register. You are responsible for maintaining the confidentiality of your account credentials and OTPs. ECDKART uses OTP-based authentication for security. Do not share your OTPs with unknown persons.',
        ),
        PolicySection(
          heading: '3. Ordering & Services',
          content: 'ECDKART facilitates Home Delivery and Self Pickup from Restaurant Partners. Restaurant Partners are responsible for food preparation and quality. Placing an order does not guarantee acceptance; orders may be rejected due to item unavailability or operational limits.',
        ),
        PolicySection(
          heading: '4. Payments & Refunds',
          content: 'Payments can be made via UPI, Debit/Credit Cards, Wallets, and other supported methods. Cancellations may be available before food preparation begins. Refunds for eligible cancelled or rejected orders will be processed according to the ECDKART Refund & Cancellation Policy.',
        ),
        PolicySection(
          heading: '5. Prohibited Activities & Conduct',
          content: 'You must not use the Platform for unlawful purposes, submit fraudulent refund claims, create fake accounts, manipulate payments, or harass Restaurant Partners or Riders. ECDKART may suspend or terminate accounts involved in fraud or abuse.',
        ),
        PolicySection(
          heading: '6. Limitation of Liability',
          content: 'To the maximum extent permitted by applicable law, ECDKART acts as a technology platform and will not be liable for losses arising solely from circumstances beyond its reasonable control, including food quality issues which are the responsibility of the Restaurant Partner.',
        ),
        PolicySection(
          heading: '7. Dispute Resolution & Grievance',
          content: 'These Terms shall be governed by the laws applicable in India. For complaints or grievances, please contact us at:\n\nECDKART (OPC) PRIVATE LIMITED\nWebsite: https://ecdkart.co.in\nPlease provide your registered mobile number and Order ID for faster resolution.',
        ),
      ],
    );
  }
}

// ── Shipping Policy Page ─────────────────────────────────────────────────────

class ShippingPolicyPage extends StatelessWidget {
  const ShippingPolicyPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const PolicyPage(
      title: 'Shipping Policy',
      emoji: '🚚',
      sections: [
        PolicySection(
          heading: 'Delivery Coverage',
          content:
              'ECDKART currently delivers across Indore, Madhya Pradesh, India. Our delivery '
              'zones cover major areas including Vijay Nagar, Palasia, Rajwada, Bhanwarkuan, '
              'Scheme 54, Scheme 78, Nipania, Bhawarkuan, LIG Colony, and surrounding localities. '
              'You can check if your area is serviceable by entering your delivery address in the '
              'app. We are continuously expanding our coverage — if your area is not currently '
              'served, please check back soon or contact us to express your interest.',
        ),
        PolicySection(
          heading: 'Delivery Time',
          content:
              'Standard delivery time is 30–45 minutes from order confirmation, depending on '
              'the restaurant\'s preparation time and your distance from the restaurant. '
              'During peak hours (12 PM – 2 PM and 7 PM – 9 PM), delivery may take up to '
              '60 minutes. Estimated delivery time is displayed on the order confirmation screen '
              'and is updated in real time. Delivery times may be affected by traffic conditions, '
              'weather, or high order volumes. ECDKART will notify you of any significant delays '
              'via push notification.',
        ),
        PolicySection(
          heading: 'Delivery Charges',
          content:
              'Delivery charges are calculated based on the distance between the restaurant and '
              'your delivery address. The applicable delivery fee is displayed clearly before you '
              'confirm your order. Orders above ₹299 qualify for free delivery from participating '
              'restaurants. A small platform fee may apply to certain orders. During promotional '
              'periods, delivery charges may be waived. ECDKART reserves the right to revise '
              'delivery charges at any time, with changes reflected in the app before order '
              'placement.',
        ),
        PolicySection(
          heading: 'Delivery Process',
          content:
              'Once you place an order, the restaurant begins preparation and a delivery partner '
              'is assigned. You can track your order in real time through the "My Orders" section '
              'of the app. Our delivery partners are trained to handle food safely and maintain '
              'hygiene standards. All deliveries are made in insulated bags to preserve food '
              'temperature. Upon delivery, you will receive a notification. Please ensure someone '
              'is available at the delivery address to receive the order. Contactless delivery '
              'is available on request.',
        ),
        PolicySection(
          heading: 'Failed Delivery',
          content:
              'If a delivery attempt fails because the customer is unavailable or the address '
              'is inaccessible, our delivery partner will wait for up to 5 minutes and attempt '
              'to contact you via phone. If contact cannot be established, the order may be '
              'cancelled and a refund will be processed as per our Refund Policy. To avoid '
              'failed deliveries, please ensure your address details are accurate and complete, '
              'and that you are reachable on the registered phone number at the time of delivery. '
              'ECDKART is not liable for failed deliveries due to incorrect address information.',
        ),
        PolicySection(
          heading: 'Order Tracking',
          content:
              'ECDKART provides real-time order tracking so you always know where your food is. '
              'After placing an order, navigate to My Orders and tap on your active order to '
              'view the live tracking map. You will see status updates including: Order Confirmed, '
              'Preparing, Out for Delivery, and Delivered. Push notifications are sent at each '
              'stage. If you experience any issues with tracking or your order status appears '
              'stuck, please contact our support team at support@ecdkart.co.in or call '
              '+91 89506 05676.',
        ),
      ],
    );
  }
}

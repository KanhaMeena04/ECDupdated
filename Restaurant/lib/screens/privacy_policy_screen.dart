import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5FAF8),
      appBar: AppBar(
        title: Text('Privacy Policy', style: GoogleFonts.poppins(fontWeight: FontWeight.w700, color: const Color(0xFF2C2C2C))),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF2C2C2C),
        elevation: 0,
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: const [
              BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 5))
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: const Color(0xFF248C70).withValues(alpha: 0.1), shape: BoxShape.circle),
                  child: const Icon(Icons.privacy_tip_rounded, size: 48, color: Color(0xFF248C70)),
                ),
              ),
              const SizedBox(height: 24),
              Text('Privacy Policy', style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.bold, color: const Color(0xFF2C2C2C))),
              const SizedBox(height: 8),
              Text('Effective Date: 13 August 2026', style: GoogleFonts.poppins(fontSize: 14, color: Colors.grey[500])),
              const Divider(height: 32, color: Color(0xFFEEEEEE)),
              Text('ECDKART Restaurant App (â€œAppâ€) is operated by ECDKART (OPC) PRIVATE LIMITED.', style: GoogleFonts.poppins(fontSize: 15, color: Colors.grey[700], height: 1.5)),
              const SizedBox(height: 24),
              _buildSection('1. Information We Collect', 'We may collect restaurant name, owner/contact details, address, bank/payment details, business documents, location data, device information and order-related information.'),
              _buildSection('2. Use of Information', 'Information is used to:\n\nâ€¢ Manage restaurant accounts and orders.\nâ€¢ Process payments and settlements.\nâ€¢ Provide delivery/order-related services.\nâ€¢ Verify restaurant/business information.\nâ€¢ Improve security, performance and customer support.'),
              _buildSection('3. Information Sharing', 'We may share necessary information with customers, delivery partners, payment providers and service providers only when required to provide our services or comply with law.'),
              _buildSection('4. Data Security', 'We take reasonable technical and organizational measures to protect your information. However, no online system can be guaranteed to be completely secure.'),
              _buildSection('5. Account & Data Deletion', 'Restaurant partners may request account or personal data deletion by contacting ECDKART support, subject to legal and financial record-retention requirements.'),
              _buildSection('6. Contact', 'For privacy-related queries, contact ECDKART through the official support channel provided in the App.'),
              Text('By using the App, you agree to this Privacy Policy.', style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.bold, color: const Color(0xFF2C2C2C))),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSection(String title, String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF248C70))),
          const SizedBox(height: 8),
          Text(content, style: GoogleFonts.poppins(fontSize: 15, color: Colors.grey[700], height: 1.5)),
        ],
      ),
    );
  }
}

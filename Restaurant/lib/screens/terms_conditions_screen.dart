import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class TermsConditionsScreen extends StatelessWidget {
  const TermsConditionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5FAF8),
      appBar: AppBar(
        title: Text('Terms & Conditions', style: GoogleFonts.poppins(fontWeight: FontWeight.w700, color: const Color(0xFF2C2C2C))),
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
                  decoration: BoxDecoration(color: const Color(0xFF248C70).withOpacity(0.1), shape: BoxShape.circle),
                  child: const Icon(Icons.article_rounded, size: 48, color: Color(0xFF248C70)),
                ),
              ),
              const SizedBox(height: 24),
              Text('Terms & Conditions', style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.bold, color: const Color(0xFF2C2C2C))),
              const SizedBox(height: 8),
              Text('Effective Date: 13 August 2026', style: GoogleFonts.poppins(fontSize: 14, color: Colors.grey[500])),
              const Divider(height: 32, color: Color(0xFFEEEEEE)),
              Text('By registering or using the ECDKART Restaurant App, you agree to these Terms & Conditions.', style: GoogleFonts.poppins(fontSize: 15, color: Colors.grey[700], height: 1.5)),
              const SizedBox(height: 24),
              _buildSection('1. Restaurant Account', 'You must provide accurate and complete business information. You are responsible for maintaining the confidentiality of your login credentials.'),
              _buildSection('2. Orders', 'Restaurants must accept, reject or process orders accurately and within the estimated preparation time. Repeated cancellations, delays or incorrect orders may result in restrictions or suspension.'),
              _buildSection('3. Menu & Pricing', 'Restaurants are responsible for keeping menu items, prices, availability and descriptions accurate and updated.'),
              _buildSection('4. Payments & Commission', 'Applicable commissions, payment charges and settlement terms will be as agreed between ECDKART and the restaurant partner.'),
              _buildSection('5. Legal Compliance', 'Restaurants must maintain all licenses, registrations, food-safety approvals and other documents required by applicable laws.'),
              _buildSection('6. Prohibited Activities', 'Fraud, false information, misuse of the platform, manipulation of orders, unlawful products or activities, and abuse of customers/riders are strictly prohibited.'),
              _buildSection('7. Suspension & Termination', 'ECDKART may temporarily suspend or terminate an account for violations of these Terms, fraudulent activity, legal violations or repeated service issues.'),
              _buildSection('8. Changes', 'ECDKART may update these Terms from time to time. Continued use of the App means acceptance of the updated Terms.'),
              _buildSection('9. Contact', 'For support or complaints, contact ECDKART through the official support channel provided in the App.'),
              Text('By using the ECDKART Restaurant App, you agree to these Terms & Conditions.', style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.bold, color: const Color(0xFF2C2C2C))),
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

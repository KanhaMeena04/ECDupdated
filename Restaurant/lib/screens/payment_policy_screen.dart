import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class PaymentPolicyScreen extends StatelessWidget {
  const PaymentPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5FAF8),
      appBar: AppBar(
        title: Text('Payment Policy', style: GoogleFonts.poppins(fontWeight: FontWeight.w700, color: const Color(0xFF2C2C2C))),
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
                  child: const Icon(Icons.payment_rounded, size: 48, color: Color(0xFF248C70)),
                ),
              ),
              const SizedBox(height: 24),
              Text('Payment Policy', style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.bold, color: const Color(0xFF2C2C2C))),
              const SizedBox(height: 8),
              Text('Last updated: July 2026', style: GoogleFonts.poppins(fontSize: 14, color: Colors.grey[500])),
              const Divider(height: 32, color: Color(0xFFEEEEEE)),
              _buildSection('1. Commission Structure', 'ECD Kart charges a standard 10% commission on all orders processed through the platform.'),
              _buildSection('2. Weekly Payouts', 'Earnings (minus commission) are calculated weekly. Payouts are transferred to the registered bank account every Tuesday.'),
              _buildSection('3. Refunds & Cancellations', 'Orders cancelled by the customer before preparation will not incur a commission. Orders cancelled by the restaurant will be fully refunded to the customer.'),
              _buildSection('4. Discrepancies', 'If there is a dispute regarding payout amounts, please contact our support team within 3 days of receiving the settlement report.'),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: Colors.orange.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, color: Colors.orange, size: 20),
                    const SizedBox(width: 12),
                    Expanded(child: Text('(Dummy Data for Demo Purposes)', style: GoogleFonts.poppins(color: Colors.orange[800], fontStyle: FontStyle.italic))),
                  ],
                ),
              ),
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

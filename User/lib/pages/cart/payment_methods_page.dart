import 'package:ecdkart_app/widgets/safe_image.dart';
import 'package:flutter/material.dart';

class PaymentMethodsPage extends StatelessWidget {
  final double totalAmount;
  const PaymentMethodsPage({super.key, required this.totalAmount});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Bill total: ₹${totalAmount.toStringAsFixed(2)}',
          style: const TextStyle(color: Colors.black, fontSize: 16, fontWeight: FontWeight.w700),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _SectionHeader(title: 'RECOMMENDED'),
            _PaymentOptionGroup(options: [
              _PaymentOption(name: 'Paytm UPI', logo: 'https://logos-download.com/wp-content/uploads/2021/01/Paytm_Logo.png'),
              _PaymentOption(name: 'Google Pay UPI', logo: 'https://cdn.iconscout.com/icon/free/png-256/free-google-pay-logo-icon-download-in-svg-png-gif-file-formats--payment-gateway-digital-wallet-brands-pack-logos-icons-2028244.png?f=webp&w=256'),
              _PaymentOption(name: 'PhonePe UPI', logo: 'https://cdn.iconscout.com/icon/free/png-256/free-phonepe-logo-icon-download-in-svg-png-gif-file-formats--payment-digital-wallet-brands-pack-logos-icons-2028254.png?f=webp&w=256'),
            ]),

            _SectionHeader(title: 'CARDS'),
            _PaymentOptionGroup(options: [
              _PaymentOption(name: 'Add credit or debit cards', icon: Icons.credit_card, isAdd: true),
            ]),

            _SectionHeader(title: 'PAY BY ANY UPI APP'),
            _PaymentOptionGroup(options: [
              _PaymentOption(name: 'Whatsapp UPI', icon: Icons.chat_bubble_outline),
              _PaymentOption(name: 'Navi UPI', icon: Icons.account_balance_wallet_outlined),
            ]),

            _SectionHeader(title: 'NETBANKING'),
            _PaymentOptionGroup(options: [
              _PaymentOption(name: 'Netbanking', icon: Icons.account_balance_outlined, isAdd: true),
            ]),

            _SectionHeader(title: 'CASH ON DELIVERY'),
            _PaymentOptionGroup(options: [
              _PaymentOption(name: 'Cash on delivery', icon: Icons.money),
            ]),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
      child: Text(
        title,
        style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF), fontWeight: FontWeight.w800, letterSpacing: 1.0),
      ),
    );
  }
}

class _PaymentOptionGroup extends StatelessWidget {
  final List<_PaymentOption> options;
  const _PaymentOptionGroup({required this.options});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: options.length,
        separatorBuilder: (_, __) => Divider(height: 1, indent: 56, color: Colors.grey.withOpacity(0.1)),
        itemBuilder: (_, i) => _PaymentRow(option: options[i]),
      ),
    );
  }
}

class _PaymentRow extends StatelessWidget {
  final _PaymentOption option;
  const _PaymentRow({required this.option});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => Navigator.pop(context, option.name),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            SizedBox(
              width: 24,
              height: 24,
              child: option.logo != null
                  ? SafeImage(
                      option.logo!,
                      width: 24,
                      height: 24,
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => const Icon(Icons.payment, size: 20, color: Colors.grey),
                    )
                  : Icon(option.icon ?? Icons.payment, color: const Color(0xFF1F2937), size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                option.name,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFF1F2937)),
              ),
            ),
            Icon(
              option.isAdd ? Icons.add : Icons.chevron_right,
              color: option.isAdd ? const Color(0xFF059669) : const Color(0xFF9CA3AF),
              size: 20,
            ),
          ],
        ),
      ),
    );
  }
}

class _PaymentOption {
  final String name;
  final String? logo;
  final IconData? icon;
  final bool isAdd;
  const _PaymentOption({required this.name, this.logo, this.icon, this.isAdd = false});
}

import 'package:flutter/material.dart';
import '../order/contact_support_page.dart';

class SupportChatPage extends StatelessWidget {
  final String? orderId;
  const SupportChatPage({super.key, this.orderId});

  @override
  Widget build(BuildContext context) {
    return ContactSupportPage(orderId: orderId);
  }
}

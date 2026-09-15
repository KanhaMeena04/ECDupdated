// This file is kept for go_router compatibility at the /checkout route.
// The full implementation lives in lib/pages/checkout/checkout_page.dart.
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/cart_provider.dart';
import '../checkout/checkout_page.dart';

class CheckoutPage extends StatelessWidget {
  const CheckoutPage({super.key});

  @override
  Widget build(BuildContext context) {
    final cart = context.read<CartProvider>();
    const double deliveryFee = 40.0;
    final subtotal = cart.totalAmount;
    final total = subtotal + deliveryFee;

    return CheckoutFlow(
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      total: total,
    );
  }
}

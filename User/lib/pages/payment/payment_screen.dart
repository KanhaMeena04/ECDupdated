import 'package:ecdkart_app/widgets/safe_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../providers/cart_provider.dart';
import '../../providers/user_provider.dart';
import '../../services/payment_service.dart';
import '../../core/models/product.dart';
import '../checkout/order_success_page.dart';

class PaymentScreen extends StatefulWidget {
  const PaymentScreen({super.key});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  late Razorpay _razorpay;
  bool _isProcessing = false;
  bool _isLoadingCart = true;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
    _fetchCartData();
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  Future<void> _fetchCartData() async {
    try {
      await context.read<CartProvider>().fetchCart();
    } catch (e) {
      debugPrint("Silent: Could not fetch cart (likely unauthenticated)");
    } finally {
      if (mounted) {
        setState(() => _isLoadingCart = false);
      }
    }
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    debugPrint("=========== PAYMENT SUCCESS ===========");
    debugPrint("PAYMENT ID: ${response.paymentId}");
    debugPrint("ORDER ID: ${response.orderId}");
    debugPrint("SIGNATURE: ${response.signature}");

    setState(() => _isProcessing = true);
    
    try {
      debugPrint("CALLING VERIFY PAYMENT API");
      
      final result = await PaymentService.verifyPayment(
        razorpayOrderId: response.orderId!,
        razorpayPaymentId: response.paymentId!,
        razorpaySignature: response.signature!,
      );

      debugPrint("VERIFY RESPONSE: $result");

      if (result != null && result['success'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Payment Successful!"), backgroundColor: Colors.green),
          );
        }
        _completeOrder();
      } else {
        setState(() => _isProcessing = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(result?['message'] ?? 'Payment verification failed'), backgroundColor: Colors.red),
          );
        }
      }
    } catch (e) {
      debugPrint("VERIFY ERROR: $e");
      setState(() => _isProcessing = false);
    }
  }

  void _completeOrder() {
    context.read<CartProvider>().clear();
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => const OrderSuccessPage()),
      (route) => false,
    );
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    debugPrint("RAZORPAY ERROR CODE: ${response.code}");
    debugPrint("RAZORPAY ERROR MESSAGE: ${response.message}");
    debugPrint("RAZORPAY ERROR METADATA: ${response.error}");
    
    setState(() => _isProcessing = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Payment failed: ${response.message}'),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    setState(() => _isProcessing = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text("External Wallet Selected: ${response.walletName}"),
      ),
    );
  }

  Future<void> _startPayment() async {
    if (_isProcessing) return;
    
    final cart = context.read<CartProvider>();
    final amount = cart.totalAmount; // Send Rupees to backend

    if (amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Cart is empty!")),
      );
      return;
    }

    setState(() => _isProcessing = true);

    try {
      final orderData = await PaymentService.createOrder(amount);
      if (orderData != null && orderData['success'] == true) {
        final order = orderData['order'];
        
        if (order == null || order['id'] == null) {
          throw Exception("Razorpay Order ID missing from server response");
        }

        var options = {
          'key': 'rzp_test_SoUrOmQ6Rc5zI4', // Using the key from your .env
          'amount': (amount * 100).toInt(),
          'name': 'ECDKART',
          'order_id': order['id'],
          'description': 'Food Order Payment',
          'timeout': 300, // in seconds
          'prefill': {
            'contact': context.read<UserProvider>().phone.isNotEmpty 
                ? context.read<UserProvider>().phone 
                : '9876543210',
            'email': context.read<UserProvider>().email.isNotEmpty 
                ? context.read<UserProvider>().email 
                : 'test@example.com'
          }
        };
        _razorpay.open(options);
      } else {
        setState(() => _isProcessing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Failed to create order. Try again.")),
        );
      }
    } catch (e) {
      setState(() => _isProcessing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error: $e")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text(
          "Payment",
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
      ),
      body: _isLoadingCart
          ? const Center(child: CircularProgressIndicator(color: Colors.red))
          : Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Order Summary",
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (cart.items.isNotEmpty)
                    Expanded(
                      child: ListView.builder(
                        itemCount: cart.items.length,
                        itemBuilder: (context, index) {
                          final item = cart.items[index];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12.0),
                            child: Row(
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: SafeImage(
                                    item.imageUrl,
                                    width: 50,
                                    height: 50,
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) =>
                                        Container(
                                          width: 50,
                                          height: 50,
                                          color: Colors.grey[200],
                                          child: const Icon(Icons.fastfood, color: Colors.grey),
                                        ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        item.product.name,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                        ),
                                      ),
                                      Text(
                                        "Qty: ${item.quantity}",
                                        style: TextStyle(
                                          color: Colors.grey[600],
                                          fontSize: 14,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Text(
                                  "₹${item.totalPrice}",
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    )
                  else
                    const Expanded(
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.shopping_cart_outlined,
                                size: 64, color: Colors.grey),
                            SizedBox(height: 16),
                            Text(
                              "Your cart is empty",
                              style: TextStyle(
                                fontSize: 18,
                                color: Colors.grey,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  const Divider(height: 32),
                  if (cart.isEmpty)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16.0),
                      child: SizedBox(
                        width: double.infinity,
                        child: OutlinedButton(
                          onPressed: () {
                            // Add a sample item for testing
                            cart.addItem(
                              Product(
                                id: 'sample_1',
                                name: 'Delicious Pepperoni Pizza',
                                description: 'Freshly baked with extra cheese',
                                price: 299.0,
                                image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400',
                                category: 'Pizza',
                                rating: 4.5,
                                isVeg: false,
                              ),
                              restaurantId: 'r1',
                              restaurantName: 'Pizza Paradise',
                              restaurantImageUrl: '',
                              imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400',
                            );
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.red,
                            side: const BorderSide(color: Colors.red),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text("Add Sample Item (Test)"),
                        ),
                      ),
                    ),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.grey[50],
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey[200]!),
                    ),
                    child: Column(
                      children: [
                        _buildSummaryRow("Subtotal", "₹${cart.totalAmount}"),
                        const SizedBox(height: 12),
                        _buildSummaryRow("Delivery Fee", "₹40"),
                        const SizedBox(height: 12),
                        _buildSummaryRow("Taxes", "₹12"),
                        const Divider(height: 32),
                        _buildSummaryRow(
                          "Total Amount",
                          "₹${cart.totalAmount + 52}",
                          isTotal: true,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _isProcessing || cart.isEmpty ? null : _startPayment,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 0,
                      ),
                      child: _isProcessing
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text(
                              "Pay Now",
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isTotal = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: isTotal ? 18 : 16,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            color: isTotal ? Colors.black : Colors.grey[600],
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isTotal ? 18 : 16,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            color: isTotal ? Colors.red : Colors.black,
          ),
        ),
      ],
    );
  }
}

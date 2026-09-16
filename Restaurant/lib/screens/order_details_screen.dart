import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/order_model.dart';
import '../theme/app_colors.dart';

class OrderDetailsScreen extends StatefulWidget {
  final Order order;
  const OrderDetailsScreen({super.key, required this.order});

  @override
  State<OrderDetailsScreen> createState() => _OrderDetailsScreenState();
}

class _OrderDetailsScreenState extends State<OrderDetailsScreen> {
  late String _currentStatus;

  @override
  void initState() {
    super.initState();
    _currentStatus = widget.order.status;
  }

  void _advanceOrderState() {
    setState(() {
      if (_currentStatus == 'Placed' || _currentStatus == 'Preparing') {
        _currentStatus = 'Ready';
        widget.order.status = 'Ready';
      } else if (_currentStatus == 'Ready') {
        _currentStatus = 'Picked Up';
        widget.order.status = 'Picked Up';
      } else if (_currentStatus == 'Picked Up') {
        _currentStatus = 'Delivered';
        widget.order.status = 'Delivered';
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Order feedback recorded! Thank you.'),
            backgroundColor: AppColors.primaryGreen,
          ),
        );
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Order status updated to $_currentStatus'),
        backgroundColor: AppColors.primaryGreen,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  // Top Hero Header Image with Floating Action Buttons matching reference images
                  Stack(
                    children: [
                      Container(
                        height: 200,
                        width: double.infinity,
                        decoration: const BoxDecoration(
                          image: DecorationImage(
                            image: AssetImage('assets/images/restaurant_order_header.jpg'),
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      // Gradient overlay for smooth contrast
                      Container(
                        height: 200,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.black.withValues(alpha: 0.4),
                              Colors.transparent,
                              Colors.white.withValues(alpha: 0.9),
                            ],
                          ),
                        ),
                      ),
                      // Top Navigation Buttons Row
                      Positioned(
                        top: MediaQuery.of(context).padding.top + 10,
                        left: 16,
                        right: 16,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            GestureDetector(
                              onTap: () => Navigator.pop(context),
                              child: Container(
                                width: 40,
                                height: 40,
                                decoration: const BoxDecoration(
                                  color: Colors.white,
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(color: Colors.black26, blurRadius: 6),
                                  ],
                                ),
                                child: const Icon(Icons.arrow_back, color: Colors.black87, size: 20),
                              ),
                            ),
                            Container(
                              width: 40,
                              height: 40,
                              decoration: const BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(color: Colors.black26, blurRadius: 6),
                                ],
                              ),
                              child: const Icon(Icons.more_vert, color: Colors.black87, size: 20),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  // Progress Step Indicator Row matching Reference Images 1-4
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    child: _buildProgressStepTracker(),
                  ),

                  // Status Banner Alert matching Reference Images
                  Container(
                    width: double.infinity,
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF5F5), // Soft pastel alert tint
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      _getStatusBannerText(),
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Colors.black87,
                      ),
                    ),
                  ),

                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Items (3) Section Card
                        _buildItemsSectionCard(),

                        const SizedBox(height: 14),

                        // Delivering Address Card
                        _buildDeliveringAddressCard(),

                        const SizedBox(height: 14),

                        // Bill Details Card
                        _buildBillDetailsCard(),

                        // Rider Details Card (Shows when preparing is done / rider assigned)
                        if (_currentStatus != 'Placed') ...[
                          const SizedBox(height: 14),
                          _buildRiderDetailsCard(),
                        ],

                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Bottom Action Bar matching Reference Images
          _buildBottomActionBar(),
        ],
      ),
    );
  }

  // Horizontal Step Tracker: Prepared -> Ready -> Pickup -> Delivered
  Widget _buildProgressStepTracker() {
    final steps = ['Prepared', 'Ready', 'Pickup', 'Delivered'];
    int activeIndex = 0;
    if (_currentStatus == 'Preparing' || _currentStatus == 'Placed') {
      activeIndex = 0;
    } else if (_currentStatus == 'Ready') {
      activeIndex = 1;
    } else if (_currentStatus == 'Picked Up') {
      activeIndex = 2;
    } else if (_currentStatus == 'Delivered') {
      activeIndex = 3;
    }

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: List.generate(steps.length, (index) {
        final bool isDoneOrActive = index <= activeIndex;
        final Color color = isDoneOrActive ? AppColors.primaryGreen : Colors.grey[400]!;

        return Expanded(
          child: Row(
            children: [
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: color,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    steps[index],
                    style: GoogleFonts.poppins(
                      fontSize: 11,
                      fontWeight: isDoneOrActive ? FontWeight.bold : FontWeight.normal,
                      color: color,
                    ),
                  ),
                ],
              ),
              if (index < steps.length - 1)
                Expanded(
                  child: Container(
                    height: 2,
                    margin: const EdgeInsets.only(bottom: 16, left: 4, right: 4),
                    color: index < activeIndex ? AppColors.primaryGreen : Colors.grey[300],
                  ),
                ),
            ],
          ),
        );
      }),
    );
  }

  String _getStatusBannerText() {
    switch (_currentStatus) {
      case 'Placed':
      case 'Preparing':
        return '🔥 Food is being prepared.';
      case 'Ready':
        return '🔥 Food is ready and waiting for the rider.';
      case 'Picked Up':
        return '🔥 The food has been handed over to the rider and is on the way.';
      case 'Delivered':
        return '🎉 Your order has been delivered successfully. Order completed.';
      default:
        return '🔥 Food is being prepared.';
    }
  }

  // Items Section Card
  Widget _buildItemsSectionCard() {
    final items = [
      {'name': '6 pcs chicken Wings', 'variant': 'Original', 'price': 150.0},
      {'name': 'Margherita Pizza', 'variant': 'Regular', 'price': 150.0},
      {'name': 'Margherita Pizza', 'variant': 'Regular', 'price': 150.0},
    ];

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Items (${items.length})',
            style: GoogleFonts.poppins(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 12),
          ...items.map((item) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Image.asset(
                      item['name'].toString().contains('chicken')
                          ? 'assets/images/restaurant_chicken_item.jpg'
                          : 'assets/images/restaurant_pizza_item.jpg',
                      width: 50,
                      height: 50,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
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
                          item['name'] as String,
                          style: GoogleFonts.poppins(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                        Text(
                          item['variant'] as String,
                          style: GoogleFonts.poppins(
                            fontSize: 11,
                            color: Colors.grey[500],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '₹${(item['price'] as double).toStringAsFixed(1)}',
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  // Delivering Address Card
  Widget _buildDeliveringAddressCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Delivering Address',
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Jetty Point - Gate No. 3, Marina Bay, New Delhi',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              OutlinedButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Tracking live order route...')),
                  );
                },
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  side: BorderSide(color: Colors.grey[300]!),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: Text(
                  'Track Order',
                  style: GoogleFonts.poppins(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
              ),
            ],
          ),
          const Divider(height: 20),
          _buildInfoRow('Order ID', '#7892020189'),
          const SizedBox(height: 10),
          _buildInfoRow('Payment Method', 'Via Credit Card'),
          const SizedBox(height: 10),
          _buildInfoRow('Payment Time & Date', 'On 24, May, 2026, 11:59 PM'),
        ],
      ),
    );
  }

  // Bill Details Card
  Widget _buildBillDetailsCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Bill Details',
            style: GoogleFonts.poppins(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 12),
          _buildBillRow('Subtotal', '₹300.00'),
          const SizedBox(height: 8),
          _buildBillRow('Standard Delivery', 'Free', isAccent: true),
          const SizedBox(height: 8),
          _buildBillRow('Service Fee', '₹5.00'),
          const Divider(height: 20),
          _buildBillRow('Grand Total', '₹240.00', isBold: true),
          const SizedBox(height: 6),
          _buildBillRow('Coupon Applied - FLAT20', '-₹20.00', isAccent: true),
          const SizedBox(height: 8),
          _buildBillRow('Paid', '₹240.00', isBold: true),
        ],
      ),
    );
  }

  // Rider Details Card matching Reference Images 2, 3, 4
  Widget _buildRiderDetailsCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Rider Details',
            style: GoogleFonts.poppins(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const CircleAvatar(
                radius: 20,
                backgroundImage: NetworkImage('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Rohit (Rider)',
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    Row(
                      children: [
                        const Icon(Icons.star, color: Colors.orange, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          '5.0 (2.7k Ratings)',
                          style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[600]),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              ElevatedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Calling rider Rohit...')),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                icon: const Icon(Icons.call, size: 14, color: Colors.white),
                label: Text(
                  'Call Now',
                  style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Estimated time & Mini Map Card
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[200]!),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'The rider will reach in about 2 minutes',
                        style: GoogleFonts.poppins(fontSize: 11, color: Colors.black87, fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Track Location',
                        style: GoogleFonts.poppins(fontSize: 11, color: Colors.redAccent, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 70,
                  height: 45,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEDF2F7),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey[300]!),
                  ),
                  child: const Center(
                    child: Icon(Icons.location_on, color: AppColors.primaryGreen, size: 22),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Bottom Fixed Action Bar matching state
  Widget _buildBottomActionBar() {
    String text = '';
    String buttonText = '';

    if (_currentStatus == 'Placed' || _currentStatus == 'Preparing') {
      text = 'Has the food been prepared and is it ready to move to the next stage ?';
      buttonText = 'Searching Rider';
    } else if (_currentStatus == 'Ready') {
      text = 'Has the rider picked up the order?';
      buttonText = 'Pick up';
    } else if (_currentStatus == 'Picked Up') {
      text = 'Has the food been handed over and is on the way?';
      buttonText = 'Mark Delivered';
    } else {
      text = 'How was your experience with the rider? Please rate';
      buttonText = 'Rate Now';
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: Text(
                text,
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
            ),
            const SizedBox(width: 12),
            ElevatedButton(
              onPressed: _advanceOrderState,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryGreen, // Brand Primary Green
                elevation: 0,
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(
                buttonText,
                style: GoogleFonts.poppins(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600])),
        Text(value, style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87)),
      ],
    );
  }

  Widget _buildBillRow(String label, String value, {bool isBold = false, bool isAccent = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: isBold ? 13 : 12,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
            color: isAccent ? Colors.redAccent : Colors.grey[700],
          ),
        ),
        Text(
          value,
          style: GoogleFonts.poppins(
            fontSize: isBold ? 14 : 12,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
            color: isAccent ? Colors.redAccent : Colors.black87,
          ),
        ),
      ],
    );
  }
}

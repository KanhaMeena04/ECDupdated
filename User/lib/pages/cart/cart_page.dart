import 'dart:async';
import 'package:ecdkart_app/widgets/safe_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/cart_provider.dart';
import '../../core/models/cart_item.dart';
import '../../core/models/product.dart';
import '../../core/models/restaurant_models.dart';
import '../payment/review_pay_page.dart';
import '../../providers/address_provider.dart';
import '../../providers/location_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/coupons_bottom_sheet.dart';

import '../../services/auth_service.dart';
import '../../widgets/flip_animation_widgets.dart';
import '../auth/login_page.dart';

class CartPage extends StatefulWidget {
  final Restaurant? restaurant;
  const CartPage({super.key, this.restaurant});

  @override
  State<CartPage> createState() => _CartPageState();
}

class _CartPageState extends State<CartPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchDynamicDeliveryFee();
    });
  }

  void _fetchDynamicDeliveryFee() {
    final cart = context.read<CartProvider>();
    final addressProvider = context.read<AddressProvider>();
    final locationProvider = context.read<LocationProvider>();

    final selectedAddress = addressProvider.addresses.isNotEmpty
        ? addressProvider.addresses.first
        : null;

    final lat = selectedAddress?.latitude ?? locationProvider.lat ?? 22.7196;
    final lng = selectedAddress?.longitude ?? locationProvider.lng ?? 75.8577;

    cart.calculateDeliveryFee(lat, lng);
  }

  void _placeOrder(CartProvider cart) async {
    String? token = await AuthService.getToken();
    if (token == null || token.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please log in with mobile number to place your order.'),
          backgroundColor: AppColors.primary,
        ),
      );
      await Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const LoginPage()),
      );

      token = await AuthService.getToken();
      if (token == null || token.isEmpty) {
        return; // Login wasn't completed
      }
    }

    if (!mounted) return;

    // Screenshot 3: 1-Minute Order Placement & Cancellation Window
    _showOrderPlacementWindow(
      context: context,
      cart: cart,
      onConfirmed: () async {
        await Navigator.push(
          context,
          FlipPageRoute(
            page: ReviewPayPage(
              subtotal: cart.totalAmount,
              deliveryFee: cart.deliveryFee,
              total: cart.finalAmount,
            ),
          ),
        );
      },
    );
  }

  void _showNoteDialog(BuildContext context, CartProvider cart) {
    final controller = TextEditingController(text: cart.orderNote);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Add Note for Restaurant',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
        content: TextField(
          controller: controller,
          maxLines: 3,
          decoration: InputDecoration(
            hintText: 'e.g. No onions, Make it spicy...',
            hintStyle: TextStyle(color: Colors.grey[400], fontSize: 13),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: Colors.grey))),
          ElevatedButton(
            onPressed: () {
              cart.setOrderNote(controller.text);
              Navigator.pop(ctx);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('Save Note', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  // ── Screenshot 1 Modal Sheet: Pick-up Slot Selection ───────────────────────
  void _showPickupSlotModalSheet(BuildContext context) {
    final cart = context.read<CartProvider>();
    String selectedTab = cart.orderType;
    String selectedDate = cart.pickupDate.isNotEmpty ? cart.pickupDate : 'Today, Sep 14';
    String selectedTimeSlot = cart.pickupTimeSlot.isNotEmpty ? cart.pickupTimeSlot : '9:30 AM - 9:45 AM';

    final dateOptions = [
      'Today, Sep 14',
      'Tomorrow, Sep 15',
      'Wed, Sep 16',
      'Thu, Sep 17',
    ];

    final timeSlotOptions = [
      'ASAP (~15-20 mins prep time)',
      '9:30 AM - 9:45 AM',
      '9:45 AM - 10:00 AM',
      '10:00 AM - 10:15 AM',
      '10:15 AM - 10:30 AM',
      '10:30 AM - 10:45 AM',
      '10:45 AM - 11:00 AM',
      '11:00 AM - 11:15 AM',
      '11:15 AM - 11:30 AM',
      '11:30 AM - 11:45 AM',
      '11:45 AM - 12:00 PM',
      '12:00 PM - 12:15 PM',
      '12:15 PM - 12:30 PM',
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Container(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Close X button
                  Center(
                    child: GestureDetector(
                      onTap: () => Navigator.pop(ctx),
                      child: Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.12),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: const Icon(Icons.close, size: 20, color: Colors.black87),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Segmented Tabs: Delivery | Pick-up (Matching Screenshot 1)
                  Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () {
                            setSheetState(() => selectedTab = 'delivery');
                          },
                          child: Column(
                            children: [
                              Padding(
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                child: Text(
                                  'Delivery',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: selectedTab == 'delivery'
                                        ? const Color(0xFF1F2937)
                                        : Colors.grey.shade400,
                                  ),
                                ),
                              ),
                              Container(
                                height: 3,
                                color: selectedTab == 'delivery'
                                    ? const Color(0xFF248C70)
                                    : Colors.transparent,
                              ),
                            ],
                          ),
                        ),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () {
                            setSheetState(() => selectedTab = 'pickup');
                          },
                          child: Column(
                            children: [
                              Padding(
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                child: Text(
                                  'Pick-up',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: selectedTab == 'pickup'
                                        ? const Color(0xFF1F2937)
                                        : Colors.grey.shade400,
                                  ),
                                ),
                              ),
                              Container(
                                height: 3,
                                color: selectedTab == 'pickup'
                                    ? const Color(0xFF248C70)
                                    : Colors.transparent,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  if (selectedTab == 'pickup') ...[
                    // Pick-up Date Header & Dropdown (Matching Screenshot 1)
                    const Text(
                      'Pick-up Date',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey.shade300),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: dateOptions.contains(selectedDate) ? selectedDate : dateOptions.first,
                          isExpanded: true,
                          icon: const Icon(Icons.keyboard_arrow_down, color: Colors.black54),
                          items: dateOptions.map((date) {
                            return DropdownMenuItem<String>(
                              value: date,
                              child: Text(
                                date,
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF1F2937),
                                ),
                              ),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) {
                              setSheetState(() => selectedDate = val);
                            }
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Pick-up Time Header & Dropdown (Matching Screenshot 1)
                    const Text(
                      'Pick-up Time',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey.shade300),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: timeSlotOptions.contains(selectedTimeSlot)
                              ? selectedTimeSlot
                              : timeSlotOptions.first,
                          isExpanded: true,
                          icon: const Icon(Icons.keyboard_arrow_down, color: Colors.black54),
                          items: timeSlotOptions.map((slot) {
                            return DropdownMenuItem<String>(
                              value: slot,
                              child: Text(
                                slot,
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF1F2937),
                                ),
                              ),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) {
                              setSheetState(() => selectedTimeSlot = val);
                            }
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Smart Prep Buffer Pill
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE8F5E9),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF248C70).withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: const [
                          Icon(Icons.bolt, color: Color(0xFF248C70), size: 20),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Smart Preparation Buffer: ~15 mins prep time + 15 mins grace period at counter.',
                              style: TextStyle(
                                fontSize: 12,
                                color: Color(0xFF1B5E20),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ] else ...[
                    // Standard Delivery
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: const Text(
                        'Standard Delivery: ~30-45 mins to your doorstep.',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF374151),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 24),

                  // Red Add Button (Matching Screenshot 1)
                  FlipAddItemWrapper(
                    onTap: () {
                      if (selectedTab == 'pickup') {
                        cart.setPickupDetails(
                          date: selectedDate,
                          timeSlot: selectedTimeSlot,
                        );
                      } else {
                        cart.setOrderType('delivery');
                      }
                      setState(() {});
                      Navigator.pop(ctx);
                    },
                    child: Container(
                      width: double.infinity,
                      height: 50,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: const Color(0xFF248C70),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Text(
                        'Add',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final items = cart.items;

    if (items.isEmpty) return const Scaffold(body: _EmptyCart());

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF1F2937)),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Cart Details',
          style: TextStyle(
              color: Color(0xFF1F2937),
              fontSize: 18,
              fontWeight: FontWeight.w800),
        ),
        centerTitle: false,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. Estimated Delivery Header Banner
                  const _EstimatedDeliveryHeader(),

                  const SizedBox(height: 12),

                  // 2. Restaurant Header Section
                  _RestaurantHeaderCard(
                    restaurant: widget.restaurant,
                    cart: cart,
                  ),

                  const SizedBox(height: 12),

                  // 3. Cart Items Card List
                  Container(
                    width: double.infinity,
                    color: Colors.white,
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ...items.map((item) => _CartItemRow(
                              item: item,
                              onEdit: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Edit options for ${item.product.name}'),
                                    duration: const Duration(seconds: 1),
                                  ),
                                );
                              },
                            )),

                        const SizedBox(height: 12),

                        // "+ Add More Items" Brand Colored Button
                        SizedBox(
                          width: 160,
                          height: 38,
                          child: ElevatedButton(
                            onPressed: () => Navigator.pop(context),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              elevation: 0,
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(6),
                              ),
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.add, color: Colors.white, size: 18),
                                SizedBox(width: 4),
                                Text(
                                  'Add More Items',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 12),

                  // 4. Offers & Coupons Section
                  _OffersSection(cart: cart),

                  const SizedBox(height: 12),

                  // 5. Order Type & Notes Selector
                  _OrderOptionsAndNotesCard(
                    cart: cart,
                    onAddNote: () => _showNoteDialog(context, cart),
                    onSelectPickupSlot: () => _showPickupSlotModalSheet(context),
                  ),

                  const SizedBox(height: 12),

                  // 6. Bill Details Section with Dashed Divider
                  _BillDetailsCard(cart: cart),

                  const SizedBox(height: 14),

                  // Cancellation Policy Card (Matching Screenshot 2)
                  const _CancellationPolicyCard(),

                  const SizedBox(height: 14),

                  // Delivery Respect Note Box
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: _DeliveryRespectNoteCard(),
                  ),

                  const SizedBox(height: 16),

                  // 7. Popular with your Order (Upsell horizontal list)
                  _PopularWithOrderSection(restaurant: widget.restaurant),

                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),

          // 8. Sticky Bottom Action / Payment Bar
          _PaymentBar(
            cart: cart,
            onPlaceOrder: () => _placeOrder(cart),
          ),
        ],
      ),
    );
  }
}

// ── 1. Estimated Delivery Header ─────────────────────────────────────────────
class _EstimatedDeliveryHeader extends StatelessWidget {
  const _EstimatedDeliveryHeader();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: AppColors.primary.withValues(alpha: 0.08),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Text(
                'Estimated Delivery',
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFF6B7280),
                  fontWeight: FontWeight.w500,
                ),
              ),
              SizedBox(height: 2),
              Text(
                'Standard (20-35 minutes)',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1F2937),
                ),
              ),
            ],
          ),
          GestureDetector(
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Delivery options can be changed at checkout.'),
                  duration: Duration(seconds: 2),
                ),
              );
            },
            child: const Text(
              'Change',
              style: TextStyle(
                color: AppColors.primary,
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── 2. Restaurant Header Card ────────────────────────────────────────────────
class _RestaurantHeaderCard extends StatelessWidget {
  final Restaurant? restaurant;
  final CartProvider cart;
  const _RestaurantHeaderCard({this.restaurant, required this.cart});

  @override
  Widget build(BuildContext context) {
    final name = restaurant?.name ?? cart.restaurantName ?? 'Cellar Door Restaurant';
    final cuisine = (restaurant?.cuisine != null && restaurant!.cuisine.isNotEmpty)
        ? restaurant!.cuisine
        : 'Pizza, Italian, Fast Food';

    return Container(
      width: double.infinity,
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                name,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF1F2937),
                ),
              ),
              const Icon(Icons.chevron_right, color: Color(0xFF6B7280), size: 22),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            cuisine,
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF6B7280),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

// ── 3. Cart Item Row ─────────────────────────────────────────────────────────
class _CartItemRow extends StatelessWidget {
  final CartItem item;
  final VoidCallback onEdit;
  const _CartItemRow({required this.item, required this.onEdit});

  @override
  Widget build(BuildContext context) {
    final cart = context.read<CartProvider>();
    final String imageUrl = item.imageUrl.isNotEmpty ? item.imageUrl : item.product.image;

    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Food image thumbnail
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: imageUrl.isNotEmpty
                    ? SafeImage(
                        imageUrl,
                        width: 64,
                        height: 64,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _defaultImagePlaceholder(),
                      )
                    : _defaultImagePlaceholder(),
              ),
              const SizedBox(width: 12),

              // Title, variant/category, Edit link
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.product.name,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF1F2937),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      item.product.category.isNotEmpty ? item.product.category : 'Original',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF9CA3AF),
                      ),
                    ),
                    const SizedBox(height: 4),
                    GestureDetector(
                      onTap: onEdit,
                      child: const Text(
                        'Edit',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Quantity Stepper
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.3), width: 1.2),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    GestureDetector(
                      onTap: () => cart.updateQuantity(
                          item.product.id, item.quantity - 1),
                      child: const Padding(
                        padding: EdgeInsets.all(4),
                        child: Icon(Icons.remove, size: 14, color: AppColors.primary),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      child: Text(
                        '${item.quantity}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: () => cart.updateQuantity(
                          item.product.id, item.quantity + 1),
                      child: const Padding(
                        padding: EdgeInsets.all(4),
                        child: Icon(Icons.add, size: 14, color: AppColors.primary),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Sub-row: Items Count & Total Price
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Items Count : ${item.quantity}',
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF6B7280),
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                'Total Price : ₹${item.totalPrice.toStringAsFixed(1)}',
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF6B7280),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _defaultImagePlaceholder() {
    return Container(
      width: 64,
      height: 64,
      color: AppColors.primary.withValues(alpha: 0.08),
      child: const Icon(Icons.fastfood, color: AppColors.primary, size: 28),
    );
  }
}

// ── 4. Offers Section ────────────────────────────────────────────────────────
class _OffersSection extends StatelessWidget {
  final CartProvider cart;
  const _OffersSection({required this.cart});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Offers',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 12),

          // Currently applied coupon banner if active
          if (cart.discountAmount > 0) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.stars_rounded, color: AppColors.primary, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Coupon "${cart.appliedCoupon?['code']}" applied! You saved ₹${cart.discountAmount.toInt()}',
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => cart.removeCoupon(),
                    child: const Text(
                      'Remove',
                      style: TextStyle(
                        color: Colors.red,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],

          // Offer Card 1
          _OfferCard(
            description: 'Get flat ₹50 off on your first order.',
            code: 'FLAT50',
            onApply: () => _applySampleCoupon(context, 'FLAT50'),
          ),
          const SizedBox(height: 10),

          // Offer Card 2
          _OfferCard(
            description: 'Get flat ₹50 off on your first order.',
            code: 'FLAT50',
            onApply: () => _applySampleCoupon(context, 'FLAT50'),
          ),
          const SizedBox(height: 12),

          // View all Coupons >
          GestureDetector(
            onTap: () => CouponsBottomSheet.show(
              context,
              onApplyCoupon: (code) async {
                final result = await cart.applyCoupon(code);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(result['message']),
                      backgroundColor:
                          result['success'] ? AppColors.primary : Colors.red,
                    ),
                  );
                }
              },
            ),
            child: Row(
              children: const [
                Icon(Icons.percent_rounded, size: 18, color: Color(0xFF4B5563)),
                SizedBox(width: 8),
                Text(
                  'View all Coupons',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF374151),
                  ),
                ),
                Spacer(),
                Icon(Icons.chevron_right, size: 20, color: Color(0xFF6B7280)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _applySampleCoupon(BuildContext context, String code) async {
    final result = await cart.applyCoupon(code);
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: result['success'] ? AppColors.primary : Colors.red,
        ),
      );
    }
  }
}

class _OfferCard extends StatelessWidget {
  final String description;
  final String code;
  final VoidCallback onApply;

  const _OfferCard({
    required this.description,
    required this.code,
    required this.onApply,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  description,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF374151),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                height: 32,
                child: OutlinedButton(
                  onPressed: onApply,
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    side: const BorderSide(color: Color(0xFFE5E7EB)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ),
                  child: const Text(
                    'Apply',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF374151),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          // Coupon code dashed badge (Brand Primary Tinted)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
            ),
            child: Text(
              code,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: AppColors.primary,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── 5. Order Options & Notes Card ────────────────────────────────────────────
class _OrderOptionsAndNotesCard extends StatelessWidget {
  final CartProvider cart;
  final VoidCallback onAddNote;
  final VoidCallback onSelectPickupSlot;
  const _OrderOptionsAndNotesCard({
    required this.cart,
    required this.onAddNote,
    required this.onSelectPickupSlot,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Order Options',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => cart.setOrderType('delivery'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: cart.orderType == 'delivery'
                          ? AppColors.primary.withValues(alpha: 0.08)
                          : Colors.grey.shade50,
                      border: Border.all(
                        color: cart.orderType == 'delivery'
                            ? AppColors.primary
                            : Colors.grey.shade300,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(
                      child: Text(
                        'Delivery',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                          color: cart.orderType == 'delivery'
                              ? AppColors.primary
                              : Colors.grey.shade700,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    cart.setOrderType('pickup');
                    onSelectPickupSlot();
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: cart.orderType == 'pickup'
                          ? AppColors.primary.withValues(alpha: 0.08)
                          : Colors.grey.shade50,
                      border: Border.all(
                        color: cart.orderType == 'pickup'
                            ? AppColors.primary
                            : Colors.grey.shade300,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(
                      child: Text(
                        'Self Collect / Slot',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                          color: cart.orderType == 'pickup'
                              ? AppColors.primary
                              : Colors.grey.shade700,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),

          if (cart.orderType == 'pickup') ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFE8F5E9),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFF248C70).withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.storefront_rounded, color: Color(0xFF248C70), size: 22),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Pickup Slot: ${cart.pickupDate} (${cart.pickupTimeSlot})',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF1B5E20),
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          '⚡ Smart Prep Buffer & 15-min Grace Period',
                          style: TextStyle(
                            fontSize: 11,
                            color: Color(0xFF2E7D32),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  InkWell(
                    onTap: onSelectPickupSlot,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF248C70),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'Change',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 14),
          GestureDetector(
            onTap: onAddNote,
            child: Row(
              children: [
                const Icon(Icons.edit_note_rounded, size: 20, color: Color(0xFF4B5563)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    cart.orderNote != null
                        ? 'Note: ${cart.orderNote}'
                        : 'Add a note for the restaurant',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: cart.orderNote != null
                          ? AppColors.primary
                          : const Color(0xFF4B5563),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── 6. Bill Summary Card (Matching Screenshot 2) ─────────────────────────────────────────────────────
class _BillDetailsCard extends StatelessWidget {
  final CartProvider cart;
  const _BillDetailsCard({required this.cart});

  @override
  Widget build(BuildContext context) {
    final subtotal = cart.totalAmount;
    final delivery = cart.deliveryFee;
    final platformFee = cart.platformFee;
    final packagingFee = cart.packagingFee;
    final gst = cart.gstAmount;
    final discount = cart.discountAmount;
    final grandTotalRaw = cart.grandTotalRaw;
    final cashRoundOff = cart.cashRoundOff;
    final toPay = cart.finalAmount;

    return Container(
      width: double.infinity,
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Bill Summary',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w900,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 14),

          // Item total
          _BillRow(label: 'Item total', valueStr: '₹${subtotal.toStringAsFixed(0)}'),
          const SizedBox(height: 10),

          // Delivery Partner Fee (up to 4 km)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Delivery partner fee (up to 4 km)',
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF4B5563),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Goes to them for their time and effort',
                    style: TextStyle(
                      fontSize: 10.5,
                      color: Colors.grey.shade500,
                    ),
                  ),
                ],
              ),
              Text(
                delivery == 0 ? 'Free' : '₹${delivery.toStringAsFixed(0)}',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: delivery == 0 ? AppColors.primary : const Color(0xFF1F2937),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Platform fee
          _BillRow(label: 'Platform fee', valueStr: '₹${platformFee.toStringAsFixed(2)}'),
          const SizedBox(height: 10),

          // Restaurant Packaging fee
          _BillRow(label: 'Restaurant packaging fee', valueStr: '₹${packagingFee.toStringAsFixed(2)}'),
          const SizedBox(height: 10),

          // GST (govt. taxes) 5%
          _BillRow(label: 'GST (govt. taxes)', valueStr: '₹${gst.toStringAsFixed(2)}'),

          // Offer Applied if active
          if (discount > 0) ...[
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Offer Discount Applied',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF4B5563),
                  ),
                ),
                Text(
                  '-₹${discount.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ],

          const SizedBox(height: 14),
          const _DashedDivider(),
          const SizedBox(height: 14),

          // Grand Total
          _BillRow(label: 'Grand Total', valueStr: '₹${grandTotalRaw.toStringAsFixed(2)}'),
          const SizedBox(height: 8),

          // Cash round off
          _BillRow(label: 'Cash round off', valueStr: '₹${cashRoundOff.toStringAsFixed(2)}'),
          const SizedBox(height: 10),

          // To pay
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'To pay',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF1F2937),
                ),
              ),
              Text(
                '₹${toPay.toStringAsFixed(0)}',
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF1F2937),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BillRow extends StatelessWidget {
  final String label;
  final String valueStr;
  final bool isBold;
  const _BillRow({
    required this.label,
    required this.valueStr,
    this.isBold = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: isBold ? FontWeight.w800 : FontWeight.w500,
            color: const Color(0xFF4B5563),
          ),
        ),
        Text(
          valueStr,
          style: TextStyle(
            fontSize: 14,
            fontWeight: isBold ? FontWeight.w900 : FontWeight.w600,
            color: const Color(0xFF1F2937),
          ),
        ),
      ],
    );
  }
}



// ── Screenshot 2: Cancellation Policy Box ────────────────────────────────────
class _CancellationPolicyCard extends StatelessWidget {
  const _CancellationPolicyCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Text(
            'CANCELLATION POLICY',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: Color(0xFF6B7280),
              letterSpacing: 1.0,
            ),
          ),
          SizedBox(height: 6),
          Text(
            'A 100% cancellation charge will apply after 1 minute window. This helps us compensate the restaurant partner for food preparation.',
            style: TextStyle(
              fontSize: 11,
              color: Color(0xFF6B7280),
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Screenshot 3: 1-Minute Order Placement & Cancellation Window ───────────────
void _showOrderPlacementWindow({
  required BuildContext context,
  required CartProvider cart,
  required Function() onConfirmed,
}) {
  showModalBottomSheet(
    context: context,
    isDismissible: false,
    enableDrag: false,
    backgroundColor: Colors.transparent,
    builder: (ctx) => _OrderPlacementBottomSheet(
      cart: cart,
      onConfirmed: onConfirmed,
    ),
  );
}

class _OrderPlacementBottomSheet extends StatefulWidget {
  final CartProvider cart;
  final Function() onConfirmed;

  const _OrderPlacementBottomSheet({
    required this.cart,
    required this.onConfirmed,
  });

  @override
  State<_OrderPlacementBottomSheet> createState() => _OrderPlacementBottomSheetState();
}

class _OrderPlacementBottomSheetState extends State<_OrderPlacementBottomSheet>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  Timer? _countdownTimer;
  int _secondsRemaining = 60;
  bool _isCancelled = false;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 60),
    )..forward();

    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (_secondsRemaining > 1) {
        setState(() {
          _secondsRemaining--;
        });
      } else {
        _countdownTimer?.cancel();
        if (!_isCancelled) {
          Navigator.pop(context);
          widget.onConfirmed();
        }
      }
    });
  }

  @override
  void dispose() {
    _animController.dispose();
    _countdownTimer?.cancel();
    super.dispose();
  }

  void _cancelOrder() {
    setState(() {
      _isCancelled = true;
    });
    _animController.stop();
    _countdownTimer?.cancel();
    Navigator.pop(context);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(
          children: [
            Icon(Icons.cancel_rounded, color: Colors.white, size: 20),
            SizedBox(width: 8),
            Text('Order cancelled within 1 min cancellation window.'),
          ],
        ),
        backgroundColor: Colors.grey.shade800,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  void _showBillDetailsModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalContext) {
        final isDark = Theme.of(modalContext).brightness == Brightness.dark;
        return Container(
          height: MediaQuery.of(modalContext).size.height * 0.85,
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E1E1E) : const Color(0xFFF3F4F6),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // Modal Top Handle & Header Bar
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF2A2A2A) : Colors.white,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.arrow_back_rounded),
                          onPressed: () => Navigator.pop(modalContext),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Bill & Order Summary',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: isDark ? Colors.white : const Color(0xFF1F2937),
                          ),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded),
                      onPressed: () => Navigator.pop(modalContext),
                    ),
                  ],
                ),
              ),

              // Scrollable Content
              Expanded(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: Column(
                    children: [
                      // Address Banner Card
                      Container(
                        width: double.infinity,
                        margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF2A2A2A) : Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: isDark ? Colors.grey.shade800 : const Color(0xFFE5E7EB)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.home_rounded, color: AppColors.primary, size: 24),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: const [
                                  Text(
                                    'Delivering to Home',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFF1F2937),
                                    ),
                                  ),
                                  SizedBox(height: 2),
                                  Text(
                                    '102, Royal Palms, Vijay Nagar, Indore',
                                    style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Payment Method Banner Card
                      Container(
                        width: double.infinity,
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF2A2A2A) : Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: isDark ? Colors.grey.shade800 : const Color(0xFFE5E7EB)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.account_balance_wallet_rounded, color: AppColors.primary, size: 24),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Payment Method',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w900,
                                      color: isDark ? Colors.white : const Color(0xFF1F2937),
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  const Text(
                                    'Cash on Delivery (UPI/Cash)',
                                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Full Bill Details Card
                      _BillDetailsCard(cart: widget.cart),

                      const SizedBox(height: 12),
                      const _CancellationPolicyCard(),
                      const SizedBox(height: 24),
                    ],
                  ),
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
    final toPay = widget.cart.finalAmount;
    final isDark = context.watch<ThemeProvider>().isDarkMode;

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Placing your order',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : const Color(0xFF1F2937),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '00:${_secondsRemaining.toString().padLeft(2, '0')}',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Pay Card (Clickable)
          GestureDetector(
            onTap: () => _showBillDetailsModal(context),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF2A2A2A) : const Color(0xFFF9FAFB),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isDark ? Colors.grey.shade800 : const Color(0xFFE5E7EB)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.account_balance_wallet_rounded, color: AppColors.primary, size: 22),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Pay ₹${toPay.toStringAsFixed(0)} on delivery (UPI/cash)',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : const Color(0xFF1F2937),
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Cash or UPI at time of doorstep delivery',
                          style: TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded, color: Color(0xFF9CA3AF), size: 20),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Delivery Address Card (Clickable)
          GestureDetector(
            onTap: () => _showBillDetailsModal(context),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF2A2A2A) : const Color(0xFFF9FAFB),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isDark ? Colors.grey.shade800 : const Color(0xFFE5E7EB)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.home_rounded, color: AppColors.primary, size: 22),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          'Delivering to Home',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF1F2937),
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          '102, Royal Palms, Vijay Nagar, Indore',
                          style: TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded, color: Color(0xFF9CA3AF), size: 20),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // 1-Minute Progress Bar + Cancel Button
          Row(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: AnimatedBuilder(
                    animation: _animController,
                    builder: (context, child) {
                      return LinearProgressIndicator(
                        value: _animController.value,
                        minHeight: 12,
                        backgroundColor: isDark ? Colors.grey.shade800 : Colors.grey.shade200,
                        color: AppColors.primary,
                      );
                    },
                  ),
                ),
              ),
              const SizedBox(width: 14),
              GestureDetector(
                onTap: _cancelOrder,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFEF4444)),
                  ),
                  child: const Text(
                    'CANCEL',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFFEF4444),
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Instant confirm button option
          Center(
            child: TextButton(
              onPressed: () {
                _animController.stop();
                _countdownTimer?.cancel();
                Navigator.pop(context);
                widget.onConfirmed();
              },
              child: const Text(
                'Confirm Order Immediately >',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── 7. Popular with your Order Section ───────────────────────────────────────
class _PopularWithOrderSection extends StatelessWidget {
  final Restaurant? restaurant;
  const _PopularWithOrderSection({this.restaurant});

  @override
  Widget build(BuildContext context) {
    final menuItems = restaurant?.menu ?? [];

    final displayItems = menuItems.isNotEmpty
        ? menuItems
        : [
            MenuItem(
              id: 'pop_1',
              name: '6 pcs chicken wings',
              description: 'Crispy fried chicken wings',
              price: 120.0,
              imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=300',
              category: 'Popular',
              rating: 4.5,
              isVeg: false,
            ),
            MenuItem(
              id: 'pop_2',
              name: '6 pcs chicken wings',
              description: 'Juicy honey glazed wings',
              price: 120.0,
              imageUrl: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=300',
              category: 'Popular',
              rating: 4.5,
              isVeg: false,
            ),
            MenuItem(
              id: 'pop_3',
              name: '6 pcs chicken wings',
              description: 'Spicy buffalo wings',
              price: 120.0,
              imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300',
              category: 'Popular',
              rating: 4.5,
              isVeg: false,
            ),
          ];

    return Container(
      width: double.infinity,
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'Popular with your Order',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w900,
                color: Color(0xFF1F2937),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 185,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: displayItems.length,
              itemBuilder: (ctx, idx) {
                final item = displayItems[idx];
                return _PopularCard(item: item);
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _PopularCard extends StatefulWidget {
  final MenuItem item;
  const _PopularCard({required this.item});

  @override
  State<_PopularCard> createState() => _PopularCardState();
}

class _PopularCardState extends State<_PopularCard> {
  bool isFavorite = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 130,
      margin: const EdgeInsets.only(right: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: SafeImage(
                  widget.item.imageUrl,
                  width: 130,
                  height: 110,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    width: 130,
                    height: 110,
                    color: AppColors.primary.withValues(alpha: 0.08),
                    child: const Icon(Icons.fastfood, color: AppColors.primary),
                  ),
                ),
              ),
              Positioned(
                top: 6,
                left: 6,
                child: GestureDetector(
                  onTap: () {
                    setState(() => isFavorite = !isFavorite);
                  },
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(color: Colors.black12, blurRadius: 4)
                      ],
                    ),
                    child: Icon(
                      isFavorite ? Icons.favorite : Icons.favorite_border,
                      size: 16,
                      color: isFavorite ? AppColors.primary : const Color(0xFF6B7280),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '₹${widget.item.price.toStringAsFixed(2)}',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF1F2937),
                ),
              ),
              GestureDetector(
                onTap: () {
                  final cart = context.read<CartProvider>();
                  cart.addItem(
                    Product(
                      id: widget.item.id,
                      name: widget.item.name,
                      description: widget.item.description,
                      price: widget.item.price,
                      image: widget.item.imageUrl,
                      category: widget.item.category,
                      rating: 4.5,
                      isVeg: widget.item.isVeg,
                    ),
                    restaurantId: cart.restaurantId ?? '',
                    restaurantName: cart.restaurantName ?? '',
                    restaurantImageUrl: cart.restaurantImageUrl ?? '',
                    imageUrl: widget.item.imageUrl,
                  );
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Added ${widget.item.name} to cart'),
                      duration: const Duration(seconds: 1),
                    ),
                  );
                },
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Icon(Icons.add, size: 16, color: Color(0xFF1F2937)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),

          Text(
            widget.item.name,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Color(0xFF6B7280),
              height: 1.2,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

// ── 8. Sticky Bottom Action / Payment Bar ────────────────────────────────────
class _PaymentBar extends StatelessWidget {
  final CartProvider cart;
  final VoidCallback onPlaceOrder;

  const _PaymentBar({
    required this.cart,
    required this.onPlaceOrder,
  });

  @override
  Widget build(BuildContext context) {
    final total = cart.finalAmount + cart.deliveryFee;

    return Container(
      padding: EdgeInsets.fromLTRB(
        20,
        14,
        20,
        MediaQuery.of(context).padding.bottom + 14,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 10,
            offset: Offset(0, -3),
          )
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '₹${total.toStringAsFixed(2)}',
                style: const TextStyle(
                  color: Color(0xFF1F2937),
                  fontWeight: FontWeight.w900,
                  fontSize: 20,
                ),
              ),
              const Text(
                'Total Price',
                style: TextStyle(
                  color: Color(0xFF6B7280),
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),

          SizedBox(
            height: 48,
            child: ElevatedButton(
              onPressed: onPlaceOrder,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(horizontal: 28),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                elevation: 0,
              ),
              child: const Text(
                'Review Order',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 15,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Custom Dashed Divider Widget ─────────────────────────────────────────────
class _DashedDivider extends StatelessWidget {
  final double height;
  final Color color;

  const _DashedDivider({this.height = 1, this.color = const Color(0xFFE5E7EB)});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final boxWidth = constraints.constrainWidth();
        const dashWidth = 5.0;
        const dashSpace = 3.0;
        final dashCount = (boxWidth / (dashWidth + dashSpace)).floor();
        return Flex(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          direction: Axis.horizontal,
          children: List.generate(dashCount, (_) {
            return SizedBox(
              width: dashWidth,
              height: height,
              child: DecoratedBox(
                decoration: BoxDecoration(color: color),
              ),
            );
          }),
        );
      },
    );
  }
}

// ── Empty Cart Widget ────────────────────────────────────────────────────────
class _EmptyCart extends StatelessWidget {
  const _EmptyCart();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 90,
            height: 90,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.08),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.shopping_bag_outlined,
                size: 44, color: AppColors.primary),
          ),
          const SizedBox(height: 20),
          const Text(
            'Your cart is empty',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Add items from a restaurant to get started',
            style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF)),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
              elevation: 0,
            ),
            child: const Text(
              'Browse Restaurants',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}

class _DeliveryRespectNoteCard extends StatelessWidget {
  const _DeliveryRespectNoteCard({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: const Color(0xFF248C70).withOpacity(0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: const Color(0xFF248C70).withOpacity(0.25),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFF248C70).withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.favorite_rounded,
              color: Color(0xFF248C70),
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              '“We believe every delivery deserves respect.”',
              style: TextStyle(
                fontSize: 13,
                fontStyle: FontStyle.italic,
                fontWeight: FontWeight.w800,
                color: Color(0xFF1B5E20),
                height: 1.3,
              ),
            ),
          ),
        ],
      ),
    );
  }
}


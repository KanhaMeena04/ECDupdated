import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_colors.dart';
import '../providers/theme_provider.dart';
import '../services/coupon_api_service.dart';

class UnifiedCoupon {
  final String id;
  final String heading;
  final String title;
  final String discountAmount;
  final String minSpend;
  final String expiryDate;
  final String code;
  final String termsSummary;
  final List<String> fullTerms;
  final String? tag;

  UnifiedCoupon({
    required this.id,
    required this.heading,
    required this.title,
    required this.discountAmount,
    required this.minSpend,
    required this.expiryDate,
    required this.code,
    required this.termsSummary,
    required this.fullTerms,
    this.tag,
  });

  factory UnifiedCoupon.fromMap(Map<String, dynamic> m, int index) {
    final code = (m['code'] ?? 'OFFER${index + 1}').toString();
    final discount = m['discount'];
    String discountStr = '';
    if (discount != null) {
      discountStr = '₹$discount OFF';
    } else if (m['discountAmount'] != null) {
      discountStr = m['discountAmount'].toString();
    } else {
      discountStr = 'SPECIAL OFFER';
    }

    final minVal = m['minOrderValue'] ?? m['minOrder'] ?? m['minSpend'];
    String minSpendStr = 'No min spend required';
    if (minVal != null && minVal.toString() != '0') {
      minSpendStr = 'Min order: ₹$minVal';
    } else if (m['minSpend'] != null) {
      minSpendStr = m['minSpend'].toString();
    }

    final validTo = m['validTo'] ?? m['expiryDate'];
    String validStr = 'Limited time offer';
    if (validTo != null && validTo.toString() != 'N/A') {
      try {
        final dt = DateTime.parse(validTo.toString());
        final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        validStr = 'Valid till ${dt.day} ${months[dt.month - 1]} ${dt.year}';
      } catch (_) {
        validStr = 'Valid till ${validTo.toString()}';
      }
    }

    final desc = m['description'] ?? m['subHeading'] ?? m['title'] ?? 'Get special discount on your food order';

    List<String> termsList = [];
    if (m['terms'] is List) {
      termsList = List<String>.from(m['terms'].map((x) => x.toString()));
    } else if (m['fullTerms'] is List) {
      termsList = List<String>.from(m['fullTerms'].map((x) => x.toString()));
    } else {
      termsList = [
        "Voucher must be used before the expiry date.",
        "Valid on selected items / participating outlets.",
        "Cannot be combined with other ongoing promotions.",
        "Non-refundable and cannot be redeemed for cash."
      ];
    }

    return UnifiedCoupon(
      id: m['id']?.toString() ?? m['_id']?.toString() ?? 'api_$index',
      heading: (m['heading'] ?? 'SPECIAL OFFER').toString().toUpperCase(),
      title: desc.toString(),
      discountAmount: discountStr,
      minSpend: minSpendStr,
      expiryDate: validStr,
      code: code,
      termsSummary: m['termsSummary']?.toString() ?? 'Terms: Minimum order rules apply. Valid for limited time.',
      fullTerms: termsList,
      tag: m['tag']?.toString(),
    );
  }
}

const List<Map<String, dynamic>> _dummyCouponsData = [
  {
    'id': '1',
    'heading': 'WELCOME OFFER',
    'title': 'Get ₹50 OFF on your first food order',
    'discountAmount': '₹50.00',
    'minSpend': 'Min order: ₹199',
    'expiryDate': '31 Mar 2026',
    'code': 'WELCOME50',
    'tag': 'POPULAR',
    'termsSummary': 'Terms: Valid on first order per user. Min order ₹199.',
    'fullTerms': [
      'Voucher valid for new users on their first completed order.',
      'Minimum cart value of ₹199 is required.',
      'Cannot be combined with other promo codes.',
      'Valid for digital online payment methods.'
    ]
  },
  {
    'id': '2',
    'heading': 'SPECIAL OFFER',
    'title': 'Get ₹100 OFF on orders above ₹499',
    'discountAmount': '₹100.00',
    'minSpend': 'Min order: ₹499',
    'expiryDate': '30 Apr 2026',
    'code': 'FOODIE100',
    'tag': 'HOT',
    'termsSummary': 'Terms: Maximum discount ₹100. Applicable on all orders above ₹499.',
    'fullTerms': [
      'Voucher valid on food orders above ₹499.',
      'Maximum discount applicable is ₹100.',
      'Applicable across all partner restaurants.',
      'Subject to restaurant availability.'
    ]
  },
  {
    'id': '3',
    'heading': 'FLAT DISCOUNT',
    'title': "₹500 off on Shakey's Pizza & Starters",
    'discountAmount': '₹500.00',
    'minSpend': 'Min order: ₹1,000',
    'expiryDate': '31 May 2026',
    'code': 'PICHAPIE',
    'tag': 'MEGA SAVINGS',
    'termsSummary': 'Terms: Minimum order value ₹1,000 required.',
    'fullTerms': [
      'Valid on orders above ₹1,000.',
      'Applicable on pizza & side starters.',
      'Single use per customer account.',
      'Not redeemable for cash credit.'
    ]
  },
  {
    'id': '4',
    'heading': 'FREE DELIVERY',
    'title': 'Free Delivery on Food & Grocery',
    'discountAmount': 'FREE DEL',
    'minSpend': 'Min order: ₹149',
    'expiryDate': '30 Jun 2026',
    'code': 'FREEDEL',
    'tag': 'FREEBIE',
    'termsSummary': 'Terms: Waives standard delivery fee up to 10km.',
    'fullTerms': [
      'Waives full standard delivery fee.',
      'Minimum order value ₹149 required.',
      'Valid for delivery distance up to 10km.'
    ]
  }
];

class CouponsBottomSheet extends StatefulWidget {
  final Function(String code)? onApplyCoupon;
  const CouponsBottomSheet({super.key, this.onApplyCoupon});

  static Future<void> show(BuildContext context, {Function(String code)? onApplyCoupon}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => SizedBox(
        height: MediaQuery.of(context).size.height * 0.85,
        child: CouponsBottomSheet(onApplyCoupon: onApplyCoupon),
      ),
    );
  }

  @override
  State<CouponsBottomSheet> createState() => _CouponsBottomSheetState();
}

class _CouponsBottomSheetState extends State<CouponsBottomSheet> {
  String _searchQuery = '';
  List<UnifiedCoupon> _coupons = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCoupons();
  }

  Future<void> _loadCoupons() async {
    try {
      final apiList = await CouponApiService.getCoupons();
      List<UnifiedCoupon> parsed = [];
      if (apiList.isNotEmpty) {
        for (int i = 0; i < apiList.length; i++) {
          parsed.add(UnifiedCoupon.fromMap(Map<String, dynamic>.from(apiList[i]), i));
        }
      }
      // Add default dummy coupons if missing
      final dummyParsed = _dummyCouponsData
          .asMap()
          .entries
          .map((e) => UnifiedCoupon.fromMap(e.value, e.key))
          .where((d) => !parsed.any((p) => p.code == d.code))
          .toList();

      parsed.addAll(dummyParsed);

      if (mounted) {
        setState(() {
          _coupons = parsed;
          _isLoading = false;
        });
      }
    } catch (e) {
      final dummyParsed = _dummyCouponsData
          .asMap()
          .entries
          .map((e) => UnifiedCoupon.fromMap(e.value, e.key))
          .toList();
      if (mounted) {
        setState(() {
          _coupons = dummyParsed;
          _isLoading = false;
        });
      }
    }
  }

  List<UnifiedCoupon> get _filteredCoupons {
    if (_searchQuery.trim().isEmpty) return _coupons;
    final q = _searchQuery.toLowerCase();
    return _coupons.where((c) {
      return c.title.toLowerCase().contains(q) ||
          c.code.toLowerCase().contains(q) ||
          c.discountAmount.toLowerCase().contains(q) ||
          c.heading.toLowerCase().contains(q);
    }).toList();
  }

  void _useCoupon(BuildContext context, UnifiedCoupon coupon) {
    Clipboard.setData(ClipboardData(text: coupon.code));
    if (widget.onApplyCoupon != null) {
      widget.onApplyCoupon!(coupon.code);
    }
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Coupon "${coupon.code}" applied!'),
        backgroundColor: const Color(0xFF248C70),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showTermsModal(BuildContext context, UnifiedCoupon coupon, bool isDark) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.topCenter,
            children: [
              Container(
                width: double.infinity,
                margin: const EdgeInsets.only(top: 28),
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.2),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: const Color(0xFF248C70).withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.verified_user_outlined, color: Color(0xFF248C70), size: 20),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Terms & Conditions',
                              style: TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w800,
                                color: isDark ? Colors.white : const Color(0xFF1F2937),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        coupon.title,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF248C70),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Coupon Code: ${coupon.code}',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.grey[400] : const Color(0xFF6B7280),
                        ),
                      ),
                      const Divider(height: 24),
                      ...coupon.fullTerms.map(
                        (term) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Padding(
                                padding: EdgeInsets.only(top: 2),
                                child: Icon(Icons.check_circle_outline, size: 16, color: Color(0xFF248C70)),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  term,
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: isDark ? Colors.grey[300] : const Color(0xFF4B5563),
                                    height: 1.35,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () => Navigator.pop(ctx),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF248C70),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            elevation: 0,
                          ),
                          child: const Text('GOT IT', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Positioned(
                top: 0,
                child: GestureDetector(
                  onTap: () => Navigator.pop(ctx),
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black26,
                          blurRadius: 8,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.close_rounded,
                      color: Colors.black,
                      size: 22,
                    ),
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
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    const brandColor = Color(0xFF248C70);

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF121824) : const Color(0xFFF5FAF8),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 10),
          Center(
            child: Container(
              width: 38,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? Colors.white24 : Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: brandColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.local_offer_rounded,
                    color: brandColor,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Available Offers',
                    style: TextStyle(
                      fontSize: 19,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : const Color(0xFF1F2937),
                    ),
                  ),
                ),
                IconButton(
                  icon: Icon(
                    Icons.close_rounded,
                    color: isDark ? Colors.white70 : Colors.grey.shade600,
                    size: 22,
                  ),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          Divider(height: 1, color: isDark ? Colors.white12 : const Color(0xFFE5E7EB)),

          // Search Box
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: TextField(
              onChanged: (val) => setState(() => _searchQuery = val),
              style: TextStyle(color: isDark ? Colors.white : Colors.black, fontSize: 14),
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.search_rounded, color: brandColor, size: 20),
                hintText: 'Search coupon code or offer...',
                hintStyle: const TextStyle(color: Colors.grey, fontSize: 13),
                filled: true,
                fillColor: isDark ? Colors.white10 : Colors.white,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(28),
                  borderSide: BorderSide(color: isDark ? Colors.white10 : const Color(0xFFE5E7EB)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(28),
                  borderSide: BorderSide(color: isDark ? Colors.white10 : const Color(0xFFE5E7EB)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(28),
                  borderSide: const BorderSide(color: brandColor, width: 1.5),
                ),
              ),
            ),
          ),

          // Content body
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: brandColor))
                : _filteredCoupons.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.sentiment_dissatisfied, size: 52, color: isDark ? Colors.white38 : Colors.grey[300]),
                            const SizedBox(height: 10),
                            Text(
                              'No offers available',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: isDark ? Colors.grey[400] : Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        itemCount: _filteredCoupons.length,
                        itemBuilder: (context, index) {
                          final coupon = _filteredCoupons[index];
                          return _buildCouponCard(context, coupon, isDark);
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildCouponCard(BuildContext context, UnifiedCoupon coupon, bool isDark) {
    const brandColor = Color(0xFF248C70);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Band with Brand Theme Gradient
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF248C70), Color(0xFF1E7554)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.local_offer_rounded, color: Colors.white, size: 15),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    coupon.heading,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                if (coupon.tag != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.25),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      coupon.tag!.toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Description / Title
                Text(
                  coupon.title,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.white : const Color(0xFF1F2937),
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 8),

                // Amount
                Text(
                  coupon.discountAmount,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : brandColor,
                  ),
                ),
                const SizedBox(height: 10),

                // Badges Row (Min spend & Expiry)
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _BadgePill(
                      icon: Icons.shopping_bag_outlined,
                      label: coupon.minSpend,
                      isDark: isDark,
                    ),
                    _BadgePill(
                      icon: Icons.access_time_rounded,
                      label: coupon.expiryDate,
                      isDark: isDark,
                    ),
                  ],
                ),

                const SizedBox(height: 14),

                // Dotted Code Container with Apply Button
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white.withValues(alpha: 0.04) : brandColor.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isDark ? Colors.white24 : brandColor.withValues(alpha: 0.25),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.confirmation_num_outlined, color: brandColor, size: 18),
                          const SizedBox(width: 8),
                          Text(
                            coupon.code,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.1,
                              color: isDark ? Colors.white : brandColor,
                            ),
                          ),
                        ],
                      ),
                      ElevatedButton(
                        onPressed: () => _useCoupon(context, coupon),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: brandColor,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          elevation: 0,
                        ),
                        child: const Text(
                          'APPLY',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 10),

                // Terms Strip
                GestureDetector(
                  onTap: () => _showTermsModal(context, coupon, isDark),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.05)
                          : const Color(0xFFF3F4F6),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '${coupon.termsSummary}  View details ›',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? Colors.grey[400] : const Color(0xFF4B5563),
                        fontWeight: FontWeight.w500,
                      ),
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

class _BadgePill extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isDark;

  const _BadgePill({
    required this.icon,
    required this.label,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: isDark ? Colors.white10 : const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: isDark ? Colors.grey[300] : const Color(0xFF6B7280)),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.grey[300] : const Color(0xFF4B5563),
            ),
          ),
        ],
      ),
    );
  }
}

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../api_constants.dart';
import '../theme/app_colors.dart';

class RestaurantDashboardScreen extends StatefulWidget {
  const RestaurantDashboardScreen({super.key});

  @override
  State<RestaurantDashboardScreen> createState() => _RestaurantDashboardScreenState();
}

class _RestaurantDashboardScreenState extends State<RestaurantDashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedPeriod = 'Today';
  bool _isLoading = false;

  // Dynamic Live Data
  String _todayEarning = '₹0.00';
  int _todayOrders = 0;
  int _completedOrders = 0;
  int _cancelledOrders = 0;
  double _totalRevenue = 0.0;
  int _pickupCount = 0;
  int _deliveredCount = 0;

  List<Map<String, dynamic>> _earningHistory = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadLiveAnalytics();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadLiveAnalytics() async {
    setState(() => _isLoading = true);
    final prefs = await SharedPreferences.getInstance();
    var restId = ApiConstants.restaurantId.isNotEmpty ? ApiConstants.restaurantId : (prefs.getString('restaurantId') ?? '');
    final phone = prefs.getString('userPhone') ?? '8305370330';
    if (restId.isEmpty) restId = phone;
    final token = prefs.getString('token') ?? '';

    if (restId.isEmpty) {
      if (mounted) setState(() => _isLoading = false);
      return;
    }

    try {
      final ordersUrl = '${ApiConstants.baseUrl}/orders/restaurant/$restId';
      final res = await http.get(
        Uri.parse(ordersUrl),
        headers: {
          'Content-Type': 'application/json',
          if (token.isNotEmpty) 'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        List<dynamic> rawOrders = [];
        if (data is List) rawOrders = data;
        else if (data['orders'] is List) rawOrders = data['orders'];

        final now = DateTime.now();
        double todayEarn = 0.0;
        int todayOrdCount = 0;
        int completedCount = 0;
        int cancelledCount = 0;
        double totalRev = 0.0;
        int pickup = 0;
        int delivered = 0;
        List<Map<String, dynamic>> history = [];

        for (var o in rawOrders) {
          final amt = double.tryParse((o['payableAmount'] ?? o['totalAmount'] ?? 0).toString()) ?? 0.0;
          final status = (o['status'] ?? '').toString().toLowerCase();
          final deliveryStatus = (o['deliveryStatus'] ?? '').toString().toLowerCase();
          final isCancelled = status == 'cancelled' || status == 'failed';
          final isCompleted = status == 'delivered' || deliveryStatus == 'delivered';
          final orderType = (o['orderType'] ?? 'delivery').toString().toLowerCase();

          DateTime orderDate = DateTime.now();
          if (o['createdAt'] != null) {
            orderDate = DateTime.tryParse(o['createdAt'].toString()) ?? DateTime.now();
          }

          final isSameDay = orderDate.year == now.year && orderDate.month == now.month && orderDate.day == now.day;

          if (!isCancelled) {
            totalRev += amt;
            if (isSameDay) {
              todayEarn += amt;
              todayOrdCount++;
            }
          }

          if (isCancelled) {
            cancelledCount++;
          } else if (isCompleted) {
            completedCount++;
          }

          if (orderType == 'pickup') {
            pickup++;
          } else {
            delivered++;
          }

          if (isCompleted || !isCancelled) {
            final period = orderDate.hour >= 12 ? 'PM' : 'AM';
            final hr = orderDate.hour > 12 ? orderDate.hour - 12 : (orderDate.hour == 0 ? 12 : orderDate.hour);
            final min = orderDate.minute.toString().padLeft(2, '0');
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            history.add({
              'amount': '₹${amt.toStringAsFixed(2)}',
              'paymentMode': o['paymentMethod'] ?? (o['paymentStatus'] == 'paid' ? 'UPI Online' : 'Cash'),
              'dateTime': '${orderDate.day} ${months[orderDate.month - 1]}, $hr:$min $period',
              'orderId': 'Order #${o['orderNumber'] ?? o['_id']?.toString().substring(0, 6) ?? 'N/A'}',
              'status': isCompleted ? 'Completed' : (status.isNotEmpty ? status[0].toUpperCase() + status.substring(1) : 'Processing'),
            });
          }
        }

        if (mounted) {
          setState(() {
            _todayEarning = '₹${todayEarn.toStringAsFixed(2)}';
            _todayOrders = todayOrdCount;
            _completedOrders = completedCount;
            _cancelledOrders = cancelledCount;
            _totalRevenue = totalRev;
            _pickupCount = pickup;
            _deliveredCount = delivered;
            _earningHistory = history;
            _isLoading = false;
          });
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showTransactionReceipt(Map<String, dynamic> item) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2))),
            ),
            const SizedBox(height: 16),
            Text('Transaction Receipt', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Order Number', style: GoogleFonts.poppins(fontSize: 13, color: Colors.grey[600])),
                Text(item['orderId'], style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Payment Method', style: GoogleFonts.poppins(fontSize: 13, color: Colors.grey[600])),
                Text(item['paymentMode'], style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600)),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Date & Time', style: GoogleFonts.poppins(fontSize: 13, color: Colors.grey[600])),
                Text(item['dateTime'], style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w500)),
              ],
            ),
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Total Paid', style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.bold)),
                Text(
                  item['amount'],
                  style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                ),
              ],
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        foregroundColor: Colors.black,
        automaticallyImplyLeading: Navigator.canPop(context),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Dashboard',
              style: GoogleFonts.poppins(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.black,
              ),
            ),
            Text(
              'All your restaurant\'s activity for today in one place.',
              style: GoogleFonts.poppins(
                fontSize: 11,
                color: Colors.grey[600],
                fontWeight: FontWeight.w400,
              ),
            ),
          ],
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.black,
          unselectedLabelColor: Colors.grey[500],
          indicatorColor: AppColors.primaryGreen, // Brand Primary Green indicator
          indicatorWeight: 3,
          labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 14),
          unselectedLabelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w500, fontSize: 14),
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Analytics'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildOverviewTab(),
          _buildAnalyticsTab(),
        ],
      ),
    );
  }

  // TAB 1: Overview matching Reference Image 1
  Widget _buildOverviewTab() {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Summary Header Row with Period Dropdown
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Summary',
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedPeriod,
                    icon: const Icon(Icons.keyboard_arrow_down, size: 18),
                    style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black87),
                    onChanged: (val) {
                      if (val != null) setState(() => _selectedPeriod = val);
                    },
                    items: ['Today', 'Weekly', 'Monthly'].map((p) {
                      return DropdownMenuItem(value: p, child: Text(p));
                    }).toList(),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // 2x2 Summary Stat Cards Grid matching Reference Image 1
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 1.8,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            children: [
              _buildSummaryCard(_todayEarning, 'Today Earning'),
              _buildSummaryCard('$_todayOrders', 'Today Orders'),
              _buildSummaryCard('$_completedOrders', 'Completed Orders'),
              _buildSummaryCard('$_cancelledOrders', 'Cancelled Orders'),
            ],
          ),
          const SizedBox(height: 24),

          // Earning History Section Title
          Text(
            'Earning History',
            style: GoogleFonts.poppins(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 12),

          // List of Earning History Cards matching Reference Image 1
          if (_earningHistory.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey[200]!, width: 1),
              ),
              child: Column(
                children: [
                  Icon(Icons.receipt_long_outlined, size: 40, color: Colors.grey[400]),
                  const SizedBox(height: 8),
                  Text(
                    'No earnings recorded yet',
                    style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: Colors.grey[600]),
                  ),
                ],
              ),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _earningHistory.length,
              itemBuilder: (context, index) {
                final item = _earningHistory[index];
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey[200]!, width: 1),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.03),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    title: Text(
                      item['amount'],
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 2),
                        Text(
                          '${item['paymentMode']} • ${item['dateTime']}',
                          style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[600]),
                        ),
                        Text(
                          item['orderId'],
                          style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[600]),
                        ),
                      ],
                    ),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primaryGreen.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            item['status'],
                            style: GoogleFonts.poppins(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primaryGreen,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Icon(Icons.chevron_right, color: Colors.black54, size: 20),
                      ],
                    ),
                    onTap: () => _showTransactionReceipt(item),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  // Summary Metric Card matching Reference Image 1 & Yellow Theme
  Widget _buildSummaryCard(String title, String subtitle) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB), // Elegant soft yellow background
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFFDE68A), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            title,
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: GoogleFonts.poppins(
              fontSize: 11,
              color: Colors.grey[700],
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  // TAB 2: Analytics matching Reference Image 2
  Widget _buildAnalyticsTab() {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Summary Row (Today Earning & Today Orders)
          Row(
            children: [
              Expanded(child: _buildSummaryCard(_todayEarning, 'Today Earning')),
              const SizedBox(width: 12),
              Expanded(child: _buildSummaryCard('$_todayOrders', 'Today Orders')),
            ],
          ),
          const SizedBox(height: 20),

          // Total Revenue Chart Section Card matching Reference Image 2
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey[200]!, width: 1),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Total Revenue',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[700],
                  ),
                ),
                Text(
                  '₹${_totalRevenue.toStringAsFixed(2)}',
                  style: GoogleFonts.poppins(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 20),

                // Custom Bar Chart Visualization with Trend Line
                SizedBox(
                  height: 180,
                  width: double.infinity,
                  child: CustomPaint(
                    painter: RevenueChartPainter(),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Order Types Section Card matching Reference Image 2
          Builder(
            builder: (context) {
              final int totalTypes = _pickupCount + _deliveredCount;
              final double pRatio = totalTypes > 0 ? (_pickupCount / totalTypes) : 0.0;
              final double dRatio = totalTypes > 0 ? (_deliveredCount / totalTypes) : 0.0;

              return Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey[200]!, width: 1),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Order Types',
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Pickup Metric Row
                    _buildOrderTypeMetricRow('Pickup (${(pRatio * 100).toStringAsFixed(0)}%)', '$_pickupCount', pRatio),
                    const SizedBox(height: 16),

                    // Delivered Metric Row
                    _buildOrderTypeMetricRow('Delivered (${(dRatio * 100).toStringAsFixed(0)}%)', '$_deliveredCount', dRatio),
                  ],
                ),
              );
            },
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildOrderTypeMetricRow(String label, String count, double percentage) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFFBEB),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.takeout_dining, color: AppColors.primaryGreen, size: 18),
                ),
                const SizedBox(width: 10),
                Text(
                  label,
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[700],
                  ),
                ),
              ],
            ),
            Text(
              count,
              style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.black,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),

        // Progress Bar
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: percentage,
            minHeight: 10,
            backgroundColor: const Color(0xFFF3F4F6),
            valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primaryGreen),
          ),
        ),
      ],
    );
  }
}

// Custom Painter for Revenue Bar Chart matching Reference Image 2
class RevenueChartPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    final barValues = [0.75, 0.25, 0.40, 0.28, 0.50, 0.85];
    final lineValues = [0.80, 0.65, 0.78, 0.72, 0.76, 0.90];

    const double barWidth = 24.0;
    final double spacing = (size.width - (months.length * barWidth)) / (months.length + 1);

    final Paint barPaint = Paint()
      ..color = AppColors.primaryGreen.withValues(alpha: 0.4)
      ..style = PaintingStyle.fill;

    final Paint linePaint = Paint()
      ..color = AppColors.primaryGreen
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke;

    final Paint dotPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    final Paint dotBorderPaint = Paint()
      ..color = AppColors.primaryGreen
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke;

    final TextPainter textPainter = TextPainter(
      textDirection: TextDirection.ltr,
    );

    final List<Offset> linePoints = [];

    for (int i = 0; i < months.length; i++) {
      final double x = spacing + i * (barWidth + spacing) + barWidth / 2;
      final double barHeight = (size.height - 30) * barValues[i];
      final double barTop = (size.height - 30) - barHeight;

      // Draw Bar
      final Rect barRect = Rect.fromLTWH(x - barWidth / 2, barTop, barWidth, barHeight);
      final RRect roundedBar = RRect.fromRectAndRadius(barRect, const Radius.circular(4));
      canvas.drawRRect(roundedBar, barPaint);

      // Save line point
      final double lineY = (size.height - 30) * (1.0 - lineValues[i] * 0.8);
      linePoints.add(Offset(x, lineY));

      // Draw Month Label below
      textPainter.text = TextSpan(
        text: months[i],
        style: TextStyle(color: Colors.grey[600], fontSize: 11, fontWeight: FontWeight.w500),
      );
      textPainter.layout();
      textPainter.paint(canvas, Offset(x - textPainter.width / 2, size.height - 20));
    }

    // Draw Smooth Line Chart Curve
    final Path path = Path();
    if (linePoints.isNotEmpty) {
      path.moveTo(linePoints[0].dx, linePoints[0].dy);
      for (int i = 0; i < linePoints.length - 1; i++) {
        final p1 = linePoints[i];
        final p2 = linePoints[i + 1];
        final controlP1 = Offset(p1.dx + (p2.dx - p1.dx) / 2, p1.dy);
        final controlP2 = Offset(p1.dx + (p2.dx - p1.dx) / 2, p2.dy);
        path.cubicTo(controlP1.dx, controlP1.dy, controlP2.dx, controlP2.dy, p2.dx, p2.dy);
      }
      canvas.drawPath(path, linePaint);

      // Draw Dots on line
      for (final pt in linePoints) {
        canvas.drawCircle(pt, 4.5, dotPaint);
        canvas.drawCircle(pt, 4.5, dotBorderPaint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

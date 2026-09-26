import 'dart:async';
import 'package:flutter/material.dart';
import 'dart:convert';
import 'dart:ui';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_colors.dart';
import '../services/category_api_service.dart';
import '../services/menu_api_service.dart';
import '../api_constants.dart';

class MenuManagementScreen extends StatefulWidget {
  const MenuManagementScreen({super.key});

  @override
  State<MenuManagementScreen> createState() => _MenuManagementScreenState();
}

class _MenuManagementScreenState extends State<MenuManagementScreen> {
  List<Map<String, dynamic>> _menuItems = [];
  bool _isLoading = false;
  Timer? _liveSyncTimer;

  @override
  void initState() {
    super.initState();
    _loadInitialMockMenu();
    _loadMenuFromApi();
    // Live background sync every 4 seconds to catch real-time admin approvals
    _liveSyncTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (mounted) {
        _loadMenuFromApi(isSilent: true);
      }
    });
  }

  @override
  void dispose() {
    _liveSyncTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadMenuFromApi({bool isSilent = false}) async {
    if (!isSilent) {
      setState(() => _isLoading = true);
    }
    try {
      final prefs = await SharedPreferences.getInstance();
      var restId = prefs.getString('restaurantId') ?? ApiConstants.restaurantId;
      final phone = prefs.getString('userPhone') ?? '';
      final token = prefs.getString('token') ?? ApiConstants.authToken;

      if (restId.isEmpty && phone.isNotEmpty) {
        try {
          final sRes = await http.get(
            Uri.parse(ApiConstants.checkApprovalStatusByMobile(phone)),
            headers: {
              'Content-Type': 'application/json',
              if (token.isNotEmpty) 'Authorization': 'Bearer $token',
            },
          ).timeout(const Duration(seconds: 5));
          if (sRes.statusCode == 200) {
            final sData = jsonDecode(sRes.body);
            if (sData['restaurantId'] != null) {
              restId = sData['restaurantId'].toString();
              prefs.setString('restaurantId', restId);
            }
          }
        } catch (_) {}
      }

      final items = await MenuApiService.fetchRestaurantMenu(restId.isNotEmpty ? restId : phone);
      if (mounted) {
        // Detect newly approved items to show instant celebration snackbar
        for (var newItem in items) {
          final oldItem = _menuItems.firstWhere((it) => it['_id'] == newItem['_id'] || it['name'] == newItem['name'], orElse: () => {});
          if (oldItem.isNotEmpty) {
            final wasPending = oldItem['approvalStatus'] == 'pending' || oldItem['isApproved'] == false;
            final isNowApproved = newItem['approvalStatus'] == 'approved' || newItem['isApproved'] == true;
            if (wasPending && isNowApproved) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Row(
                    children: [
                      const Icon(Icons.verified_rounded, color: Colors.white),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '🎉 "${newItem['name']}" has been Approved by Admin and is now Live!',
                          style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                  backgroundColor: const Color(0xFF16A34A),
                  duration: const Duration(seconds: 4),
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              );
            }
          }
        }

        setState(() {
          _menuItems = items;
          prefs.setString('cached_menu_items', jsonEncode(_menuItems));
          if (!isSilent) _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted && !isSilent) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _loadInitialMockMenu() {
    _menuItems = [];
  }

  Future<void> _toggleAvailability(String itemId, bool isAvailable, String name) async {
    setState(() {
      final index = _menuItems.indexWhere((item) => item['_id'] == itemId);
      if (index != -1) {
        _menuItems[index]['isAvailable'] = isAvailable;
      }
    });

    try {
      final prefs = await SharedPreferences.getInstance();
      final restId = prefs.getString('restaurantId') ?? ApiConstants.restaurantId;
      final token = prefs.getString('token') ?? ApiConstants.authToken;
      if (restId.isNotEmpty && itemId.isNotEmpty) {
        await http.patch(
          Uri.parse('${ApiConstants.baseUrl}/restaurants/vendor/menu/toggle/$restId/$itemId'),
          headers: {
            'Content-Type': 'application/json',
            if (token.isNotEmpty) 'Authorization': 'Bearer $token',
          },
        ).timeout(const Duration(seconds: 6));
      }
    } catch (_) {}

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(isAvailable ? '$name is now Available' : '$name is marked Unavailable'),
          backgroundColor: AppColors.primaryGreen,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _deleteMenuItem(String itemId) async {
    setState(() {
      _menuItems.removeWhere((item) => item['_id'] == itemId);
    });

    try {
      final prefs = await SharedPreferences.getInstance();
      final restId = prefs.getString('restaurantId') ?? ApiConstants.restaurantId;
      final token = prefs.getString('token') ?? ApiConstants.authToken;
      if (restId.isNotEmpty && itemId.isNotEmpty) {
        await http.post(
          Uri.parse('${ApiConstants.baseUrl}/restaurants/$restId/menu/$itemId/request-delete'),
          headers: {
            'Content-Type': 'application/json',
            if (token.isNotEmpty) 'Authorization': 'Bearer $token',
          },
        ).timeout(const Duration(seconds: 6));
      }
    } catch (_) {}

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Menu item deleted successfully'),
          backgroundColor: Colors.redAccent,
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  void _showDeleteConfirmDialog(String itemId, String itemName) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Delete Item', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to delete "$itemName" from your menu?', style: GoogleFonts.poppins(fontSize: 14)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text('Cancel', style: GoogleFonts.poppins(color: Colors.grey[600])),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              _deleteMenuItem(itemId);
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            child: Text('Delete', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showStatusDetailDialog(String title, String message, Color headerColor) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.info_outline_rounded, color: headerColor),
            const SizedBox(width: 8),
            Expanded(child: Text(title, style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16))),
          ],
        ),
        content: Text(
          message.isNotEmpty ? message : 'No further details provided by admin.',
          style: GoogleFonts.poppins(fontSize: 14, color: Colors.grey[800], height: 1.4),
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(dialogContext),
            style: ElevatedButton.styleFrom(
              backgroundColor: headerColor,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: Text('Close', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showExcelImportModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.92,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: ExcelMenuImportSheet(
          onItemsImported: (importedItems) {
            setState(() {
              _menuItems.insertAll(0, importedItems);
            });

            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  children: [
                    const Icon(Icons.check_circle_rounded, color: Colors.white),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '${importedItems.length} menu items imported successfully from Excel!',
                        style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
                backgroundColor: AppColors.primaryGreen,
                duration: const Duration(seconds: 3),
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            );
          },
        ),
      ),
    );
  }

  void _openAddOrEditMenuModal([Map<String, dynamic>? existingItem]) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.9,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: AddOrEditMenuItemForm(
          existingItem: existingItem,
          onItemSaved: (savedItem) async {
            setState(() {
              if (existingItem != null) {
                final index = _menuItems.indexWhere((item) => item['_id'] == existingItem['_id']);
                if (index != -1) {
                  _menuItems[index] = savedItem;
                }
              } else {
                _menuItems.insert(0, savedItem);
              }
            });

            try {
              final prefs = await SharedPreferences.getInstance();
              await prefs.setString('cached_menu_items', jsonEncode(_menuItems));
            } catch (_) {}

            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(existingItem != null ? 'Menu item updated successfully!' : 'New menu item submitted for admin approval!'),
                backgroundColor: AppColors.primaryGreen,
              ),
            );

            _loadMenuFromApi(isSilent: true);
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: Column(
          children: [
            // Top Header Banner with generated image matching Reference Image 1
            _buildMenuHeaderBanner(),

            // Menu Items List
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
                  : RefreshIndicator(
                      onRefresh: _loadMenuFromApi,
                      color: AppColors.primaryGreen,
                      child: _menuItems.isEmpty
                          ? ListView(
                              physics: const AlwaysScrollableScrollPhysics(),
                              children: [
                                SizedBox(height: MediaQuery.of(context).size.height * 0.2),
                                Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.restaurant_menu_rounded, size: 64, color: Colors.grey[400]),
                                      const SizedBox(height: 16),
                                      Text(
                                        'No menu items found',
                                        style: GoogleFonts.poppins(color: Colors.grey[600], fontSize: 16),
                                      ),
                                      const SizedBox(height: 12),
                                      ElevatedButton.icon(
                                        onPressed: _loadMenuFromApi,
                                        icon: const Icon(Icons.refresh_rounded, size: 16),
                                        label: Text('Refresh Menu', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 12)),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: AppColors.primaryGreen,
                                          foregroundColor: Colors.white,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            )
                          : ListView.builder(
                              physics: const AlwaysScrollableScrollPhysics(),
                              padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
                              itemCount: _menuItems.length,
                              itemBuilder: (context, index) {
                                final item = _menuItems[index];
                                return _buildReferenceMenuCard(item);
                              },
                            ),
                    ),
            ),
          ],
        ),
      ),
      floatingActionButton: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            FloatingActionButton.extended(
              heroTag: 'excelImportFab',
              onPressed: () => _showExcelImportModal(),
              backgroundColor: Colors.white,
              foregroundColor: AppColors.primaryGreen,
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
                side: const BorderSide(color: AppColors.primaryGreen, width: 1.5),
              ),
              icon: const Icon(Icons.table_chart_rounded, color: AppColors.primaryGreen, size: 20),
              label: Text(
                'Import Excel',
                style: GoogleFonts.poppins(color: AppColors.primaryGreen, fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
            const SizedBox(width: 10),
            FloatingActionButton.extended(
              heroTag: 'addMenuItemFab',
              onPressed: () => _openAddOrEditMenuModal(),
              backgroundColor: AppColors.primaryGreen,
              foregroundColor: Colors.white,
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
              ),
              icon: const Icon(Icons.add, color: Colors.white, size: 20),
              label: Text(
                'Add Item',
                style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Header Banner with generated image matching Reference Image 1
  Widget _buildMenuHeaderBanner() {
    return Container(
      width: double.infinity,
      height: 150,
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Header Background Image (Tacos with Lime) matching asset
          Positioned.fill(
            child: Image.asset(
              'assets/images/restaurant_menu_header_bg.jpg',
              fit: BoxFit.cover,
              alignment: Alignment.center,
              errorBuilder: (context, error, stackTrace) => Image.network(
                'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
                fit: BoxFit.cover,
              ),
            ),
          ),
          // White frosted blur overlay matching user's "WHITE WHITE BLUR" reference
          Positioned.fill(
            child: ClipRect(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
                child: Container(
                  color: Colors.white.withValues(alpha: 0.65),
                ),
              ),
            ),
          ),

          // Header Text Content
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Row(
                  children: [
                    if (Navigator.canPop(context)) ...[
                      IconButton(
                        icon: const Icon(Icons.arrow_back, color: Colors.black87, size: 24),
                        onPressed: () => Navigator.pop(context),
                      ),
                      const SizedBox(width: 4),
                    ],
                    Expanded(
                      child: Text(
                        'Menu Management',
                        style: GoogleFonts.poppins(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Colors.black,
                        ),
                      ),
                    ),
                    // Import Excel Button
                    InkWell(
                      onTap: () => _showExcelImportModal(),
                      borderRadius: BorderRadius.circular(20),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.primaryGreen.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.4)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.file_upload_outlined, color: AppColors.primaryGreen, size: 16),
                            const SizedBox(width: 4),
                            Text(
                              'Import',
                              style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    IconButton(
                      icon: const Icon(Icons.add_circle_rounded, color: AppColors.primaryGreen, size: 32),
                      tooltip: 'Add Menu Item',
                      onPressed: () => _openAddOrEditMenuModal(),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'View, add, edit, or manage all your\nmenu items in one place',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: Colors.grey[700],
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Reference Menu Item Card matching Reference Image 1
  Widget _buildReferenceMenuCard(Map<String, dynamic> item) {
    final bool isAvailable = item['isAvailable'] ?? true;
    final List<String> flavors = [];
    final rawFlavors = item['flavors'] ?? item['variants'] ?? item['variations'];
    if (rawFlavors is List) {
      for (var f in rawFlavors) {
        if (f is String && f.isNotEmpty) {
          flavors.add(f);
        } else if (f is Map) {
          final n = f['name'];
          if (n is String && n.isNotEmpty) {
            flavors.add(n);
          } else if (n is Map) {
            final s = n['en']?.toString() ?? (n.values.isNotEmpty ? n.values.first.toString() : '');
            if (s.isNotEmpty) flavors.add(s);
          }
        }
      }
    }
    final List<dynamic> addOns = item['addOns'] is List ? item['addOns'] : [];

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!, width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Main Item Info Row
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Item Image with Heart Favorite Overlay
                Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: _buildItemThumbnail(item['image']),
                    ),
                    Positioned(
                      top: 4,
                      left: 4,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.favorite_border_rounded,
                          size: 14,
                          color: Colors.black54,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 14),

                // Item Details Column
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Approval Status Badge
                      _buildApprovalStatusBadge(item),
                      const SizedBox(height: 4),

                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(
                            '₹${(item['sellingPrice'] ?? item['price'] ?? item['basePrice'] ?? item['b2bPrice'] ?? 0.0).toStringAsFixed(2)}',
                            style: GoogleFonts.poppins(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.black,
                            ),
                          ),
                          if (item['mrp'] != null && (item['mrp'] as num) > (item['sellingPrice'] ?? item['price'] ?? item['basePrice'] ?? 0)) ...[
                            const SizedBox(width: 6),
                            Text(
                              '₹${(item['mrp'] as num).toStringAsFixed(2)}',
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                color: Colors.grey[400],
                                decoration: TextDecoration.lineThrough,
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: item['foodType'] == 'veg' ? Colors.green : (item['foodType'] == 'egg' ? Colors.orange : Colors.red),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              item['name'] ?? '',
                              style: GoogleFonts.poppins(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Colors.black,
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (item['category'] != null && item['category'].toString().isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          '${item['category']}${item['subcategory'] != null && item['subcategory'].toString().isNotEmpty ? ' • ${item['subcategory']}' : ''}',
                          style: GoogleFonts.poppins(fontSize: 10, color: AppColors.primaryGreen, fontWeight: FontWeight.w600),
                        ),
                      ],
                      const SizedBox(height: 4),
                      Text(
                        item['description'] ?? '',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),

                // Availability Switch Column
                Column(
                  children: [
                    Switch(
                      value: isAvailable,
                      activeThumbColor: AppColors.primaryGreen,
                      onChanged: (val) {
                        _toggleAvailability(item['_id'], val, item['name']);
                      },
                    ),
                    Text(
                      isAvailable ? 'Available' : 'Unavailable',
                      style: GoogleFonts.poppins(
                        fontSize: 9,
                        color: isAvailable ? AppColors.primaryGreen : Colors.grey,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Choice of Flavor Section matching Reference Image 1
          if (flavors.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Choice of Flavor (${flavors.length})',
                    style: GoogleFonts.poppins(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  GestureDetector(
                    onTap: () => _openAddOrEditMenuModal(item),
                    child: Text(
                      'Manage',
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryGreen,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 6),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              physics: const BouncingScrollPhysics(),
              child: Row(
                children: flavors.map((flavor) {
                  return GestureDetector(
                    onTap: () => _openAddOrEditMenuModal(item),
                    child: Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF9FAFB),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey[300]!, width: 1),
                      ),
                      child: Text(
                        flavor,
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          color: Colors.black87,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 12),
          ],

          // Add-Ons Section matching Reference Image 1
          if (addOns.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Add-Ons (${addOns.length})',
                    style: GoogleFonts.poppins(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  GestureDetector(
                    onTap: () => _openAddOrEditMenuModal(item),
                    child: Text(
                      'Manage',
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryGreen,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 6),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              physics: const BouncingScrollPhysics(),
              child: Row(
                children: addOns.map((addOn) {
                  final String name = addOn['name'] ?? 'Add-on';
                  final double price = (addOn['price'] ?? 0.0).toDouble();
                  final String img = addOn['image'] ?? 'assets/images/restaurant_chicken_item.jpg';

                  return GestureDetector(
                    onTap: () => _openAddOrEditMenuModal(item),
                    child: Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.fromLTRB(10, 6, 6, 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF9FAFB),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.grey[200]!, width: 1),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '₹ ${price.toStringAsFixed(2)}',
                                style: GoogleFonts.poppins(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black,
                                ),
                              ),
                              Text(
                                name,
                                style: GoogleFonts.poppins(
                                  fontSize: 10,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(width: 8),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: Image.asset(
                              img,
                              width: 28,
                              height: 28,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) => Container(
                                width: 28,
                                height: 28,
                                color: Colors.grey[300],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 12),
          ],

          // Card Action Buttons (Delete & Edit)
          const Divider(height: 1, color: Color(0xFFEEEEEE)),
          Row(
            children: [
              Expanded(
                child: TextButton.icon(
                  onPressed: () => _showDeleteConfirmDialog(item['_id'], item['name']),
                  icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 18),
                  label: Text(
                    'Delete',
                    style: GoogleFonts.poppins(
                      color: Colors.redAccent,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
              Container(width: 1, height: 28, color: const Color(0xFFEEEEEE)),
              Expanded(
                child: TextButton.icon(
                  onPressed: () => _openAddOrEditMenuModal(item),
                  icon: const Icon(Icons.edit_outlined, color: AppColors.primaryGreen, size: 18),
                  label: Text(
                    'Edit',
                    style: GoogleFonts.poppins(
                      color: AppColors.primaryGreen,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildApprovalStatusBadge(Map<String, dynamic> item) {
    final status = (item['approvalStatus'] ?? (item['isApproved'] == true ? 'approved' : (item['isRejected'] == true ? 'rejected' : 'pending'))).toString().toLowerCase();
    final rejectionReason = item['rejectionReason']?.toString() ?? '';
    final changeRequest = item['changeRequest']?.toString() ?? '';

    if (status == 'approved') {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: const Color(0xFFDCFCE7),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: const Color(0xFF86EFAC)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle_rounded, size: 12, color: Color(0xFF16A34A)),
            const SizedBox(width: 4),
            Text(
              'Approved & Live',
              style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFF15803D)),
            ),
          ],
        ),
      );
    } else if (status == 'rejected') {
      return GestureDetector(
        onTap: () => _showStatusDetailDialog('Rejection Reason', rejectionReason, Colors.redAccent),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: const Color(0xFFFEE2E2),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: const Color(0xFFFCA5A5)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.cancel_rounded, size: 12, color: Colors.redAccent),
              const SizedBox(width: 4),
              Text(
                'Rejected (Tap for reason)',
                style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFFB91C1C)),
              ),
            ],
          ),
        ),
      );
    } else if (status == 'changes_requested') {
      return GestureDetector(
        onTap: () => _showStatusDetailDialog('Changes Requested', changeRequest, Colors.blueAccent),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: const Color(0xFFDBEAFE),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: const Color(0xFF93C5FD)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.info_outline_rounded, size: 12, color: Color(0xFF2563EB)),
              const SizedBox(width: 4),
              Text(
                'Changes Requested (Tap for note)',
                style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFF1D4ED8)),
              ),
            ],
          ),
        ),
      );
    }

    // Pending review
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF3C7),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.hourglass_empty_rounded, size: 12, color: Color(0xFFD97706)),
          const SizedBox(width: 4),
          Text(
            'Pending Admin Approval',
            style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFFB45309)),
          ),
        ],
      ),
    );
  }

  Widget _buildItemThumbnail(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) {
      return Container(
        width: 80,
        height: 80,
        color: Colors.grey[200],
        child: const Icon(Icons.fastfood, color: Colors.grey, size: 30),
      );
    }
    if (imagePath.startsWith('data:image')) {
      final base64Data = imagePath.split(',').last;
      final bytes = base64Decode(base64Data);
      return Image.memory(bytes, width: 80, height: 80, fit: BoxFit.cover);
    }
    if (imagePath.startsWith('http')) {
      return Image.network(
        imagePath,
        width: 80,
        height: 80,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => Container(
          width: 80,
          height: 80,
          color: Colors.grey[200],
          child: const Icon(Icons.fastfood, color: Colors.grey),
        ),
      );
    }
    return Image.asset(
      imagePath,
      width: 80,
      height: 80,
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) => Container(
        width: 80,
        height: 80,
        color: Colors.grey[200],
        child: const Icon(Icons.fastfood, color: Colors.grey),
      ),
    );
  }
}

// Add or Edit Menu Item Form Component matching Reference Image 2 with Modal Flow
class AddOrEditMenuItemForm extends StatefulWidget {
  final Map<String, dynamic>? existingItem;
  final Function(Map<String, dynamic>) onItemSaved;

  const AddOrEditMenuItemForm({
    super.key,
    this.existingItem,
    required this.onItemSaved,
  });

  @override
  State<AddOrEditMenuItemForm> createState() => _AddOrEditMenuItemFormState();
}

class _AddOrEditMenuItemFormState extends State<AddOrEditMenuItemForm> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _descController;
  late TextEditingController _priceController;
  late TextEditingController _mrpController;
  late TextEditingController _b2bPriceController;
  late TextEditingController _prepTimeController;

  String _selectedCategory = 'Main Course';
  String _selectedSubcategory = 'General';
  String _foodType = 'Veg'; // 'Veg', 'Non-Veg', or 'Egg'
  Uint8List? _selectedImageBytes;
  String? _existingImagePath;

  List<String> _flavorVariants = [];
  List<Map<String, dynamic>> _addOnsList = [];

  List<String> _categories = [
    'Main Course',
    'Starters',
    'Pizzas & Burgers',
    'Breads & Rice',
    'Desserts',
    'Beverages',
  ];

  Map<String, List<String>> _subcategoriesMap = {
    'Main Course': ['Paneer Specialties', 'Chicken Specialties', 'Dal & Curry', 'Biryani & Rice'],
    'Starters': ['Veg Starters', 'Non-Veg Starters', 'Tandoori Starters', 'Chinese Starters'],
    'Pizzas & Burgers': ['Thin Crust Pizza', 'Cheese Burst Pizza', 'Veg Burger', 'Chicken Burger'],
    'Breads & Rice': ['Naan & Roti', 'Fried Rice', 'Steamed Rice'],
    'Desserts': ['Ice Creams', 'Sweets & Gulab Jamun', 'Pastries'],
    'Beverages': ['Mocktails', 'Shakes & Smoothies', 'Cold Drinks'],
  };

  @override
  void initState() {
    super.initState();
    final item = widget.existingItem;
    _nameController = TextEditingController(text: item?['name'] ?? '');
    _descController = TextEditingController(text: item?['description'] ?? '');
    _priceController = TextEditingController(
      text: item?['sellingPrice'] != null ? item!['sellingPrice'].toString() : (item?['price'] != null ? item!['price'].toString() : (item?['basePrice'] != null ? item!['basePrice'].toString() : '')),
    );
    _mrpController = TextEditingController(
      text: item?['mrp'] != null ? item!['mrp'].toString() : (item?['b2cMrp'] != null ? item!['b2cMrp'].toString() : (_priceController.text)),
    );
    _b2bPriceController = TextEditingController(
      text: item?['b2bPrice'] != null ? item!['b2bPrice'].toString() : (_priceController.text),
    );
    _prepTimeController = TextEditingController(
      text: item?['preparationTime'] != null ? item!['preparationTime'].toString() : '15',
    );
    if (item != null) {
      _selectedCategory = item['category'] ?? 'Main Course';
      _selectedSubcategory = item['subcategory'] ?? (_subcategoriesMap[_selectedCategory]?.first ?? 'General');
      final rawFt = (item['foodType'] ?? 'veg').toString().toLowerCase();
      _foodType = rawFt == 'egg' ? 'Egg' : (rawFt == 'non-veg' ? 'Non-Veg' : 'Veg');
      _existingImagePath = item['image'];
      if (item['flavors'] != null && item['flavors'] is List) {
        final List<String> fList = [];
        for (var f in (item['flavors'] as List)) {
          if (f is String && f.isNotEmpty) {
            fList.add(f);
          } else if (f is Map) {
            final n = f['name'];
            if (n is String && n.isNotEmpty) {
              fList.add(n);
            } else if (n is Map) {
              final s = n['en']?.toString() ?? (n.values.isNotEmpty ? n.values.first.toString() : '');
              if (s.isNotEmpty) fList.add(s);
            }
          }
        }
        _flavorVariants = fList;
      }
      if (item['addOns'] != null && item['addOns'] is List) {
        final List<Map<String, dynamic>> aList = [];
        for (var a in (item['addOns'] as List)) {
          if (a is Map) {
            final n = a['name'];
            String aName = n is String ? n : (n is Map ? (n['en']?.toString() ?? (n.values.isNotEmpty ? n.values.first.toString() : '')) : '');
            aList.add({
              'name': aName.isNotEmpty ? aName : 'Add-on',
              'price': double.tryParse((a['price'] ?? 0).toString()) ?? 0.0,
              'image': a['image']?.toString() ?? 'assets/images/restaurant_chicken_item.jpg',
            });
          }
        }
        _addOnsList = aList;
      }
    }
    _loadLiveCategories();
  }

  Future<void> _loadLiveCategories() async {
    try {
      final tree = await CategoryApiService.fetchCategoryTree();
      if (tree.isNotEmpty && mounted) {
        final newCats = <String>[];
        final newSubMap = <String, List<String>>{};
        for (var c in tree) {
          if (c.name.isNotEmpty) {
            newCats.add(c.name);
            final subs = c.subcategories.map((s) => s.name).where((n) => n.isNotEmpty).toList();
            newSubMap[c.name] = subs.isNotEmpty ? subs : ['General'];
          }
        }
        if (newCats.isNotEmpty) {
          setState(() {
            _categories = newCats;
            _subcategoriesMap = newSubMap;
            if (!_categories.contains(_selectedCategory)) {
              _selectedCategory = _categories.first;
            }
            final currentSubs = _subcategoriesMap[_selectedCategory] ?? ['General'];
            if (!currentSubs.contains(_selectedSubcategory)) {
              _selectedSubcategory = currentSubs.first;
            }
          });
        }
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    _priceController.dispose();
    _mrpController.dispose();
    _b2bPriceController.dispose();
    _prepTimeController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    try {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(source: ImageSource.gallery, maxWidth: 800, maxHeight: 800);

      if (pickedFile != null) {
        final bytes = await pickedFile.readAsBytes();
        if (!mounted) return;
        setState(() {
          _selectedImageBytes = bytes;
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to pick image: $e')),
      );
    }
  }

  // --- MODAL 1: Flavour Variants List Modal (Reference Image 1) ---
  void _showFlavourVariantsListModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalContext) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.75,
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                children: [
                  // Close Icon Button
                  Align(
                    alignment: Alignment.center,
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: const BoxDecoration(
                        color: Color(0xFFF3F4F6),
                        shape: BoxShape.circle,
                      ),
                      child: IconButton(
                        padding: EdgeInsets.zero,
                        icon: const Icon(Icons.close, color: Colors.black87, size: 20),
                        onPressed: () => Navigator.pop(modalContext),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Title
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'Flavour Variants (${_flavorVariants.length})',
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // List of Variants with Edit & Delete Buttons
                  Expanded(
                    child: ListView.builder(
                      physics: const BouncingScrollPhysics(),
                      itemCount: _flavorVariants.length,
                      itemBuilder: (context, index) {
                        final variant = _flavorVariants[index];
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: const BoxDecoration(
                            border: Border(bottom: BorderSide(color: Color(0xFFF0F0F0))),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                variant,
                                style: GoogleFonts.poppins(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                  color: Colors.black87,
                                ),
                              ),
                              Row(
                                children: [
                                  // Edit Chip Button
                                  GestureDetector(
                                    onTap: () {
                                      _showEditFlavourVariantDialog(
                                        index: index,
                                        currentName: variant,
                                        onUpdated: (newName) {
                                          setState(() => _flavorVariants[index] = newName);
                                          setModalState(() {});
                                        },
                                      );
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF9FAFB),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: Colors.grey[300]!),
                                      ),
                                      child: Row(
                                        children: [
                                          const Icon(Icons.edit_outlined, size: 14, color: Colors.black87),
                                          const SizedBox(width: 4),
                                          Text('Edit', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w500)),
                                        ],
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),

                                  // Delete Close Button
                                  GestureDetector(
                                    onTap: () {
                                      setState(() => _flavorVariants.removeAt(index));
                                      setModalState(() {});
                                    },
                                    child: const Icon(Icons.cancel_outlined, color: Colors.grey, size: 22),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Bottom Update Button (Brand Primary Green)
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(modalContext),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryGreen,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(
                        'Update',
                        style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
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

  // --- MODAL 2: Add-Ons List Modal (Reference Image 2) ---
  void _showAddOnsListModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalContext) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.75,
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                children: [
                  // Close Icon Button
                  Align(
                    alignment: Alignment.center,
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: const BoxDecoration(
                        color: Color(0xFFF3F4F6),
                        shape: BoxShape.circle,
                      ),
                      child: IconButton(
                        padding: EdgeInsets.zero,
                        icon: const Icon(Icons.close, color: Colors.black87, size: 20),
                        onPressed: () => Navigator.pop(modalContext),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Title
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'Add-Ons (${_addOnsList.length})',
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // List of Add-ons with Image, Price, Edit & Delete Buttons
                  Expanded(
                    child: ListView.builder(
                      physics: const BouncingScrollPhysics(),
                      itemCount: _addOnsList.length,
                      itemBuilder: (context, index) {
                        final addOn = _addOnsList[index];
                        final String name = addOn['name'] ?? 'Plain Rice';
                        final double price = (addOn['price'] ?? 25.0).toDouble();
                        final String img = addOn['image'] ?? 'assets/images/restaurant_chicken_item.jpg';

                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          decoration: const BoxDecoration(
                            border: Border(bottom: BorderSide(color: Color(0xFFF0F0F0))),
                          ),
                          child: Row(
                            children: [
                              // Add-on Image Thumbnail
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.asset(
                                  img,
                                  width: 44,
                                  height: 44,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) => Container(
                                    width: 44,
                                    height: 44,
                                    color: Colors.grey[200],
                                    child: const Icon(Icons.fastfood, size: 20, color: Colors.grey),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),

                              // Name & Price
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '₹ ${price.toStringAsFixed(2)}',
                                      style: GoogleFonts.poppins(
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.black,
                                      ),
                                    ),
                                    Text(
                                      name,
                                      style: GoogleFonts.poppins(
                                        fontSize: 11,
                                        color: Colors.grey[600],
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              // Edit & Delete Actions
                              Row(
                                children: [
                                  // Edit Button
                                  GestureDetector(
                                    onTap: () {
                                      _showEditAddOnDialog(
                                        index: index,
                                        currentAddOn: addOn,
                                        onUpdated: (newAddOn) {
                                          setState(() => _addOnsList[index] = newAddOn);
                                          setModalState(() {});
                                        },
                                      );
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF9FAFB),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: Colors.grey[300]!),
                                      ),
                                      child: Row(
                                        children: [
                                          const Icon(Icons.edit_outlined, size: 14, color: Colors.black87),
                                          const SizedBox(width: 4),
                                          Text('Edit', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w500)),
                                        ],
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),

                                  // Delete Close Button
                                  GestureDetector(
                                    onTap: () {
                                      setState(() => _addOnsList.removeAt(index));
                                      setModalState(() {});
                                    },
                                    child: const Icon(Icons.cancel_outlined, color: Colors.grey, size: 22),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Bottom Update Button (Brand Primary Green)
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(modalContext),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryGreen,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(
                        'Update',
                        style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
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

  // --- MODAL 4: Edit Flavour Variant Form Dialog (Reference Image 4) ---
  void _showEditFlavourVariantDialog({
    int? index,
    String? currentName,
    Function(String)? onUpdated,
  }) {
    final controller = TextEditingController(text: currentName ?? '');
    showDialog(
      context: context,
      builder: (dialogContext) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        backgroundColor: Colors.white,
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                index != null ? 'Edit Flavour Variants' : 'Add Flavour Variant',
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Flavour Name',
                style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: controller,
                decoration: InputDecoration(
                  hintText: 'Enter Flavour name',
                  hintStyle: GoogleFonts.poppins(fontSize: 13, color: Colors.grey[400]),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[300]!)),
                ),
              ),
              const SizedBox(height: 24),

              // Update Button
              SizedBox(
                width: double.infinity,
                height: 46,
                child: ElevatedButton(
                  onPressed: () {
                    final newName = controller.text.trim();
                    if (newName.isNotEmpty) {
                      if (onUpdated != null) {
                        onUpdated(newName);
                      } else {
                        setState(() => _flavorVariants.add(newName));
                      }
                    }
                    Navigator.pop(dialogContext);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(
                    index != null ? 'Update' : 'Add',
                    style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                ),
              ),
              const SizedBox(height: 10),

              // Cancel Button
              SizedBox(
                width: double.infinity,
                height: 46,
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(dialogContext),
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: Colors.grey[400]!),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(
                    'Cancel',
                    style: GoogleFonts.poppins(color: Colors.black87, fontWeight: FontWeight.w600, fontSize: 14),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // --- MODAL 3: Edit Add-On Form Dialog (Reference Image 3) ---
  void _showEditAddOnDialog({
    int? index,
    Map<String, dynamic>? currentAddOn,
    Function(Map<String, dynamic>)? onUpdated,
  }) {
    final nameCtrl = TextEditingController(text: currentAddOn?['name'] ?? '');
    final priceCtrl = TextEditingController(
      text: currentAddOn?['price'] != null ? currentAddOn!['price'].toString() : '',
    );
    String imgPath = currentAddOn?['image'] ?? 'assets/images/restaurant_chicken_item.jpg';

    showDialog(
      context: context,
      builder: (dialogContext) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        backgroundColor: Colors.white,
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                index != null ? 'Edit Add-ons' : 'Add New Add-on',
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 16),

              // Dashed Upload Image Container matching Reference Image 3
              GestureDetector(
                onTap: () async {
                  final picker = ImagePicker();
                  final picked = await picker.pickImage(source: ImageSource.gallery);
                  if (picked != null) {
                    final bytes = await picked.readAsBytes();
                    imgPath = 'data:image/jpeg;base64,${base64Encode(bytes)}';
                  }
                },
                child: Container(
                  width: double.infinity,
                  height: 100,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.5), width: 1.5),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.upload_outlined, color: AppColors.primaryGreen, size: 24),
                      const SizedBox(height: 4),
                      Text('Upload Image', style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[600], fontWeight: FontWeight.w500)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // Add-on Name Field
              Text('Add-on Name', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87)),
              const SizedBox(height: 4),
              TextField(
                controller: nameCtrl,
                decoration: InputDecoration(
                  hintText: 'Enter Flavour name',
                  hintStyle: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[400]),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[300]!)),
                ),
              ),
              const SizedBox(height: 12),

              // Base Price Field
              Text('Base Price', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87)),
              const SizedBox(height: 4),
              TextField(
                controller: priceCtrl,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  hintText: 'Enter price',
                  hintStyle: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[400]),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[300]!)),
                ),
              ),
              const SizedBox(height: 20),

              // Update Button
              SizedBox(
                width: double.infinity,
                height: 46,
                child: ElevatedButton(
                  onPressed: () {
                    final name = nameCtrl.text.trim();
                    final price = double.tryParse(priceCtrl.text) ?? 0.0;
                    if (name.isNotEmpty) {
                      final newAddOn = {'name': name, 'price': price, 'image': imgPath};
                      if (onUpdated != null) {
                        onUpdated(newAddOn);
                      } else {
                        setState(() => _addOnsList.add(newAddOn));
                      }
                    }
                    Navigator.pop(dialogContext);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(
                    index != null ? 'Update' : 'Add',
                    style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                ),
              ),
              const SizedBox(height: 10),

              // Cancel Button
              SizedBox(
                width: double.infinity,
                height: 46,
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(dialogContext),
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: Colors.grey[400]!),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(
                    'Cancel',
                    style: GoogleFonts.poppins(color: Colors.black87, fontWeight: FontWeight.w600, fontSize: 14),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;

    String imagePath = _existingImagePath ?? '';
    if (_selectedImageBytes != null) {
      final base64String = base64Encode(_selectedImageBytes!);
      imagePath = 'data:image/jpeg;base64,$base64String';
    }

    final priceVal = double.tryParse(_priceController.text) ?? 0.0;
    final mrpVal = double.tryParse(_mrpController.text) ?? priceVal;
    final b2bVal = double.tryParse(_b2bPriceController.text) ?? priceVal;
    final prepTimeVal = int.tryParse(_prepTimeController.text) ?? 15;
    final nameVal = _nameController.text.trim();
    final descVal = _descController.text.trim();

    final isEditing = widget.existingItem != null;
    final savedItem = {
      '_id': widget.existingItem?['_id'] ?? 'm_${DateTime.now().millisecondsSinceEpoch}',
      'name': nameVal,
      'description': descVal,
      'category': _selectedCategory,
      'subcategory': _selectedSubcategory,
      'basePrice': priceVal,
      'sellingPrice': priceVal,
      'price': priceVal,
      'b2cMrp': mrpVal > 0 ? mrpVal : priceVal,
      'mrp': mrpVal > 0 ? mrpVal : priceVal,
      'b2bPrice': b2bVal > 0 ? b2bVal : priceVal,
      'preparationTime': prepTimeVal,
      'foodType': _foodType.toLowerCase(),
      'isVeg': _foodType.toLowerCase() == 'veg',
      'isAvailable': widget.existingItem?['isAvailable'] ?? true,
      'available': widget.existingItem?['isAvailable'] ?? true,
      'approvalStatus': isEditing ? (widget.existingItem?['approvalStatus'] ?? 'pending') : 'pending',
      'isApproved': isEditing ? (widget.existingItem?['isApproved'] ?? false) : false,
      'image': imagePath,
      'flavors': _flavorVariants,
      'variants': _flavorVariants,
      'addOns': _addOnsList,
    };

    // Save to backend database in real-time
    try {
      final prefs = await SharedPreferences.getInstance();
      final restId = prefs.getString('restaurantId') ?? ApiConstants.restaurantId;
      final phone = prefs.getString('userPhone') ?? '';
      final token = prefs.getString('token') ?? ApiConstants.authToken;
      final effectiveRestId = restId.isNotEmpty ? restId : (phone.isNotEmpty ? phone : 'me');

      final payload = {
        'name': nameVal,
        'basePrice': priceVal,
        'price': priceVal,
        'sellingPrice': priceVal,
        'mrp': mrpVal > 0 ? mrpVal : priceVal,
        'b2cMrp': mrpVal > 0 ? mrpVal : priceVal,
        'b2cSellingPrice': priceVal,
        'b2bPrice': b2bVal > 0 ? b2bVal : priceVal,
        'preparationTime': prepTimeVal,
        'category': _selectedCategory,
        'subcategory': _selectedSubcategory,
        'foodType': _foodType.toLowerCase(),
        'isVeg': _foodType.toLowerCase() == 'veg',
        'description': descVal,
        'image': imagePath,
        'variants': _flavorVariants,
        'variations': _flavorVariants,
        'addOns': _addOnsList,
      };

      if (isEditing && widget.existingItem?['_id'] != null) {
        // Edit Menu Item
        final itemId = widget.existingItem!['_id'].toString();
        final res = await http.put(
          Uri.parse('${ApiConstants.baseUrl}/restaurants/vendor/menu/edit/$effectiveRestId/$itemId'),
          headers: {
            'Content-Type': 'application/json',
            if (token.isNotEmpty) 'Authorization': 'Bearer $token',
          },
          body: jsonEncode(payload),
        ).timeout(const Duration(seconds: 12));

        if (res.statusCode == 200) {
          final resData = jsonDecode(res.body);
          if (resData['product'] != null) {
            final prod = resData['product'];
            savedItem['approvalStatus'] = prod['approvalStatus'] ?? savedItem['approvalStatus'];
            savedItem['isApproved'] = prod['isApproved'] ?? savedItem['isApproved'];
          }
        }
      } else {
        // Add New Menu Item -> Pending approval
        final res = await http.post(
          Uri.parse('${ApiConstants.baseUrl}/restaurants/vendor/menu/add/$effectiveRestId'),
          headers: {
            'Content-Type': 'application/json',
            if (token.isNotEmpty) 'Authorization': 'Bearer $token',
          },
          body: jsonEncode(payload),
        ).timeout(const Duration(seconds: 12));

        if (res.statusCode == 200 || res.statusCode == 201) {
          final resData = jsonDecode(res.body);
          if (resData['product'] != null) {
            final prod = resData['product'];
            if (prod['_id'] != null) savedItem['_id'] = prod['_id'].toString();
            savedItem['approvalStatus'] = prod['approvalStatus'] ?? 'pending';
            savedItem['isApproved'] = prod['isApproved'] ?? false;
            if (prod['restaurant'] != null) {
              await prefs.setString('restaurantId', prod['restaurant'].toString());
            }
          }
        }
      }
    } catch (e) {
      debugPrint("Menu item save API error: $e");
    }

    widget.onItemSaved(savedItem);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.existingItem != null;
    final subcategories = _subcategoriesMap[_selectedCategory] ?? ['General'];

    return Column(
      children: [
        // Modal Header matching Reference Image 2
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.black),
                onPressed: () => Navigator.pop(context),
              ),
              Expanded(
                child: Text(
                  isEditing ? 'Edit Menu' : 'Add Menu Item',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                  ),
                ),
              ),
              const SizedBox(width: 48), // Spacer for centered title
            ],
          ),
        ),
        const Divider(height: 1, color: Color(0xFFEEEEEE)),

        // Form Content Body matching Reference Image 2
        Expanded(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.all(20),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Item Name Field
                  Text('Item Name', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller: _nameController,
                    decoration: InputDecoration(
                      hintText: 'Enter Item Name',
                      hintStyle: GoogleFonts.poppins(fontSize: 13, color: Colors.grey[400]),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[300]!)),
                    ),
                    validator: (v) => v == null || v.trim().isEmpty ? 'Please enter item name' : null,
                  ),
                  const SizedBox(height: 16),

                  // Upload Item Image Box
                  GestureDetector(
                    onTap: _pickImage,
                    child: Container(
                      width: double.infinity,
                      height: 110,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.5), width: 1.5),
                      ),
                      child: _selectedImageBytes != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(11),
                              child: Image.memory(_selectedImageBytes!, fit: BoxFit.cover),
                            )
                          : Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.upload_outlined, color: AppColors.primaryGreen, size: 28),
                                const SizedBox(height: 6),
                                Text(
                                  'Upload Item Image',
                                  style: GoogleFonts.poppins(
                                    color: Colors.grey[600],
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Category Field (Dropdown)
                  Text('Category', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    initialValue: _categories.contains(_selectedCategory) ? _selectedCategory : _categories.first,
                    decoration: InputDecoration(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[300]!)),
                    ),
                    items: _categories.map((cat) {
                      return DropdownMenuItem<String>(value: cat, child: Text(cat, style: GoogleFonts.poppins(fontSize: 13)));
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) {
                        setState(() {
                          _selectedCategory = val;
                          _selectedSubcategory = _subcategoriesMap[val]?.first ?? 'General';
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 16),

                  // Subcategory Field (Requested explicitly by user!)
                  Text('Subcategory', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    initialValue: subcategories.contains(_selectedSubcategory) ? _selectedSubcategory : subcategories.first,
                    decoration: InputDecoration(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[300]!)),
                    ),
                    items: subcategories.map((sub) {
                      return DropdownMenuItem<String>(value: sub, child: Text(sub, style: GoogleFonts.poppins(fontSize: 13)));
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) {
                        setState(() => _selectedSubcategory = val);
                      }
                    },
                  ),
                  const SizedBox(height: 16),

                  // Food Type Selection (Veg / Non-Veg / Egg)
                  Text('Food Type', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      // Veg Option
                      GestureDetector(
                        onTap: () => setState(() => _foodType = 'Veg'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: _foodType == 'Veg' ? Colors.green.withValues(alpha: 0.1) : Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: _foodType == 'Veg' ? Colors.green : Colors.grey[300]!, width: 1.5),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 10,
                                height: 10,
                                decoration: const BoxDecoration(shape: BoxShape.circle, color: Colors.green),
                              ),
                              const SizedBox(width: 6),
                              Text('Veg', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 12)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Non-Veg Option
                      GestureDetector(
                        onTap: () => setState(() => _foodType = 'Non-Veg'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: _foodType == 'Non-Veg' ? Colors.red.withValues(alpha: 0.1) : Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: _foodType == 'Non-Veg' ? Colors.red : Colors.grey[300]!, width: 1.5),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 10,
                                height: 10,
                                decoration: const BoxDecoration(shape: BoxShape.circle, color: Colors.red),
                              ),
                              const SizedBox(width: 6),
                              Text('Non-Veg', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 12)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Egg Option
                      GestureDetector(
                        onTap: () => setState(() => _foodType = 'Egg'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: _foodType == 'Egg' ? Colors.amber.withValues(alpha: 0.15) : Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: _foodType == 'Egg' ? Colors.amber[700]! : Colors.grey[300]!, width: 1.5),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 10,
                                height: 10,
                                decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.amber[700]),
                              ),
                              const SizedBox(width: 6),
                              Text('Egg', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 12)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Pricing Grid: Selling Price (B2C), MRP, B2B Wholesale Price
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Selling Price (₹)', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 12)),
                            const SizedBox(height: 6),
                            TextFormField(
                              controller: _priceController,
                              keyboardType: TextInputType.number,
                              decoration: InputDecoration(
                                hintText: '₹ Selling',
                                hintStyle: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[400]),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[300]!)),
                              ),
                              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('MRP (₹ Strikethrough)', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 12)),
                            const SizedBox(height: 6),
                            TextFormField(
                              controller: _mrpController,
                              keyboardType: TextInputType.number,
                              decoration: InputDecoration(
                                hintText: '₹ MRP',
                                hintStyle: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[400]),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[300]!)),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('B2B Price (₹)', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 12)),
                            const SizedBox(height: 6),
                            TextFormField(
                              controller: _b2bPriceController,
                              keyboardType: TextInputType.number,
                              decoration: InputDecoration(
                                hintText: '₹ B2B',
                                hintStyle: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[400]),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[300]!)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Preparation Time Field
                  Text('Preparation Time (Minutes)', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller: _prepTimeController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.timer_outlined, size: 20, color: AppColors.primaryGreen),
                      hintText: 'e.g. 15 mins',
                      hintStyle: GoogleFonts.poppins(fontSize: 13, color: Colors.grey[400]),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[300]!)),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Description Field
                  Text('Description', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller: _descController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      hintText: 'Enter description...',
                      hintStyle: GoogleFonts.poppins(fontSize: 13, color: Colors.grey[400]),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[300]!)),
                    ),
                    validator: (v) => v == null || v.trim().isEmpty ? 'Please enter description' : null,
                  ),
                  const SizedBox(height: 20),

                  // Flavour Variants Section matching Reference Image 1 & 4
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Flavour Variants (${_flavorVariants.length})', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 13)),
                      Row(
                        children: [
                          GestureDetector(
                            onTap: _showFlavourVariantsListModal,
                            child: Text(
                              'Manage All',
                              style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.add_circle_outline_rounded, color: AppColors.primaryGreen),
                            onPressed: () => _showEditFlavourVariantDialog(),
                          ),
                        ],
                      ),
                    ],
                  ),
                  Text(
                    'Optional: Add flavour options that customers can choose from',
                    style: GoogleFonts.poppins(fontSize: 10, color: Colors.grey[500]),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _flavorVariants.map((variant) {
                      return GestureDetector(
                        onTap: _showFlavourVariantsListModal,
                        child: Chip(
                          label: Text(variant, style: GoogleFonts.poppins(fontSize: 11)),
                          backgroundColor: const Color(0xFFF3F4F6),
                          deleteIcon: const Icon(Icons.edit_outlined, size: 13, color: AppColors.primaryGreen),
                          onDeleted: _showFlavourVariantsListModal,
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 20),

                  // Add Add-ons Section matching Reference Image 2 & 3
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Add Add-ons (${_addOnsList.length})', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 13)),
                      Row(
                        children: [
                          GestureDetector(
                            onTap: _showAddOnsListModal,
                            child: Text(
                              'Manage All',
                              style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.add_circle_outline_rounded, color: AppColors.primaryGreen),
                            onPressed: () => _showEditAddOnDialog(),
                          ),
                        ],
                      ),
                    ],
                  ),
                  Text(
                    'Optional: Add add-on options that customers can choose from',
                    style: GoogleFonts.poppins(fontSize: 10, color: Colors.grey[500]),
                  ),
                  const SizedBox(height: 8),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: _addOnsList.map((addOn) {
                        return GestureDetector(
                          onTap: _showAddOnsListModal,
                          child: Container(
                            margin: const EdgeInsets.only(right: 8),
                            padding: const EdgeInsets.fromLTRB(10, 6, 6, 6),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF9FAFB),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: Colors.grey[200]!, width: 1),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('₹ ${addOn['price']}', style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold)),
                                    Text(addOn['name'], style: GoogleFonts.poppins(fontSize: 10, color: Colors.grey[600])),
                                  ],
                                ),
                                const SizedBox(width: 8),
                                const Icon(Icons.edit_outlined, size: 14, color: AppColors.primaryGreen),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 28),

                  // Bottom CTA Button matching Reference Image 2
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _submitForm,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryGreen, // Brand primary green theme
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(
                        isEditing ? 'Update' : 'Save Item',
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

// ==========================================
// EXCEL / CSV MENU IMPORT MODAL SHEET
// ==========================================
class ExcelMenuImportSheet extends StatefulWidget {
  final Function(List<Map<String, dynamic>>) onItemsImported;

  const ExcelMenuImportSheet({
    super.key,
    required this.onItemsImported,
  });

  @override
  State<ExcelMenuImportSheet> createState() => _ExcelMenuImportSheetState();
}

class _ExcelMenuImportSheetState extends State<ExcelMenuImportSheet> {
  int _activeTab = 0; // 0: Upload & Presets, 1: Paste CSV / Excel, 2: Excel Template Guide
  String? _selectedFileName;
  String? _selectedFileSize;
  bool _isUploading = false;
  final TextEditingController _pasteController = TextEditingController();

  List<Map<String, dynamic>> _parsedItems = [];
  final Set<int> _selectedIndices = {};

  // Sample Preset Menus for instantaneous 1-tap testing
  final List<Map<String, dynamic>> _northIndianPreset = [
    {
      'name': 'Paneer Butter Masala',
      'category': 'Main Course',
      'subcategory': 'Paneer Specialties',
      'b2bPrice': 240.0,
      'foodType': 'veg',
      'description': 'Fresh cottage cheese cubes simmered in rich creamy tomato and butter gravy.',
      'image': 'assets/images/restaurant_paneertikka_header.jpg',
      'flavors': ['Mild Creamy', 'Medium Spicy', 'Desi Ghee Tadka'],
      'addOns': [
        {'name': 'Butter Naan', 'price': 40.0, 'image': 'assets/images/restaurant_daltadka_header.jpg'},
        {'name': 'Jeera Rice', 'price': 80.0, 'image': 'assets/images/restaurant_chicken_item.jpg'},
      ],
    },
    {
      'name': 'Butter Chicken Boneless',
      'category': 'Main Course',
      'subcategory': 'Chicken Curries',
      'b2bPrice': 290.0,
      'foodType': 'non-veg',
      'description': 'Tender roasted tandoori chicken cooked in authentic makhani tomato butter sauce.',
      'image': 'assets/images/restaurant_butterchicken_header.jpg',
      'flavors': ['Classic Makhani', 'Spicy Delhi Style'],
      'addOns': [
        {'name': 'Garlic Naan', 'price': 45.0, 'image': 'assets/images/restaurant_daltadka_header.jpg'},
        {'name': 'Extra Gravy', 'price': 60.0, 'image': 'assets/images/restaurant_butterchicken_header.jpg'},
      ],
    },
    {
      'name': 'Dal Makhani Slow Cooked',
      'category': 'Main Course',
      'subcategory': 'Lentils & Dals',
      'b2bPrice': 190.0,
      'foodType': 'veg',
      'description': 'Black lentils simmered overnight with fresh cream, butter, and mild spices.',
      'image': 'assets/images/restaurant_daltadka_header.jpg',
      'flavors': ['Creamy Classic', 'Smoky Dhaba Style'],
      'addOns': [
        {'name': 'Tandoori Roti', 'price': 20.0, 'image': 'assets/images/restaurant_daltadka_header.jpg'},
        {'name': 'Sirka Onion', 'price': 15.0, 'image': 'assets/images/restaurant_paneertikka_header.jpg'},
      ],
    },
    {
      'name': 'Dum Handi Chicken Biryani',
      'category': 'Biryani & Rice',
      'subcategory': 'Handi Biryani',
      'b2bPrice': 280.0,
      'foodType': 'non-veg',
      'description': 'Fragrant basmati rice layered with spiced marinated chicken and saffron herbs.',
      'image': 'assets/images/restaurant_handibiryani_header.jpg',
      'flavors': ['Hyderabadi Dum', 'Kolkata Saffron'],
      'addOns': [
        {'name': 'Boiled Egg (1 pc)', 'price': 20.0, 'image': 'assets/images/restaurant_handibiryani_header.jpg'},
        {'name': 'Burani Raita', 'price': 35.0, 'image': 'assets/images/restaurant_chicken_item.jpg'},
        {'name': 'Mirchi Ka Salan', 'price': 30.0, 'image': 'assets/images/restaurant_butterchicken_header.jpg'},
      ],
    },
    {
      'name': 'Tandoori Paneer Tikka (6 pcs)',
      'category': 'Starters',
      'subcategory': 'Tandoori Snacks',
      'b2bPrice': 220.0,
      'foodType': 'veg',
      'description': 'Chunks of paneer marinated in spiced yogurt and grilled in traditional clay oven.',
      'image': 'assets/images/restaurant_paneertikka_header.jpg',
      'flavors': ['Achari Tikka', 'Hariyali Mint', 'Malai Cream'],
      'addOns': [
        {'name': 'Mint Chutney', 'price': 15.0, 'image': 'assets/images/restaurant_paneertikka_header.jpg'},
        {'name': 'Chaat Masala Salad', 'price': 25.0, 'image': 'assets/images/restaurant_chicken_item.jpg'},
      ],
    },
    {
      'name': 'Tandoori Chicken Leg Piece',
      'category': 'Starters',
      'subcategory': 'Tandoori Non-Veg',
      'b2bPrice': 240.0,
      'foodType': 'non-veg',
      'description': 'Juicy roasted chicken leg pieces seasoned with secret tandoori spices and lemon.',
      'image': 'assets/images/restaurant_legpiece_header.jpg',
      'flavors': ['Red Spicy', 'Afghani Malai', 'Peri Peri Rub'],
      'addOns': [
        {'name': 'Extra Green Chutney', 'price': 15.0, 'image': 'assets/images/restaurant_paneertikka_header.jpg'},
        {'name': 'Rumali Roti', 'price': 25.0, 'image': 'assets/images/restaurant_daltadka_header.jpg'},
      ],
    },
  ];

  final List<Map<String, dynamic>> _fastFoodPreset = [
    {
      'name': 'Crispy Veggie Deluxe Burger',
      'category': 'Pizzas & Burgers',
      'subcategory': 'Burgers',
      'b2bPrice': 120.0,
      'foodType': 'veg',
      'description': 'Crispy golden vegetable patty topped with melted cheese, lettuce and signature mayo.',
      'image': 'assets/images/restaurant_pizza_item.jpg',
      'flavors': ['Classic Mayo', 'Spicy Peri Peri', 'Chipotle'],
      'addOns': [
        {'name': 'French Fries', 'price': 50.0, 'image': 'assets/images/restaurant_chicken_item.jpg'},
        {'name': 'Extra Cheese Slice', 'price': 25.0, 'image': 'assets/images/restaurant_pizza_item.jpg'},
        {'name': 'Coke 500ml', 'price': 40.0, 'image': 'assets/images/restaurant_chicken_item.jpg'},
      ],
    },
    {
      'name': 'Farmhouse Veg Supreme Pizza (10")',
      'category': 'Pizzas & Burgers',
      'subcategory': 'Pizzas',
      'b2bPrice': 270.0,
      'foodType': 'veg',
      'description': 'Loaded with bell peppers, mushrooms, sweet corn, black olives, and 100% mozzarella.',
      'image': 'assets/images/restaurant_pizza_item.jpg',
      'flavors': ['Thin Crust', 'Cheese Burst', 'Wheat Crust'],
      'addOns': [
        {'name': 'Extra Mozzarella', 'price': 50.0, 'image': 'assets/images/restaurant_pizza_item.jpg'},
        {'name': 'Garlic Dip', 'price': 30.0, 'image': 'assets/images/restaurant_chicken_item.jpg'},
      ],
    },
    {
      'name': 'Crispy Chicken Wings (6 pcs)',
      'category': 'Starters',
      'subcategory': 'Non-Veg Starters',
      'b2bPrice': 180.0,
      'foodType': 'non-veg',
      'description': 'Fresh chicken wings tossed in your choice of spicy seasoning and glaze.',
      'image': 'assets/images/restaurant_chicken_item.jpg',
      'flavors': ['Honey Bulgogi', 'Spicy BBQ', 'Snow Onion', 'Peri Peri'],
      'addOns': [
        {'name': 'Extra Ranch Sauce', 'price': 20.0, 'image': 'assets/images/restaurant_chicken_item.jpg'},
        {'name': 'Coke 500ml', 'price': 45.0, 'image': 'assets/images/restaurant_pizza_item.jpg'},
      ],
    },
    {
      'name': 'Veg Hakka Noodles',
      'category': 'Chinese & Asian',
      'subcategory': 'Noodles',
      'b2bPrice': 150.0,
      'foodType': 'veg',
      'description': 'Wok tossed noodles loaded with crunchy julienned veggies and oriental sauces.',
      'image': 'assets/images/restaurant_chinese_header.jpg',
      'flavors': ['Classic Garlic', 'Schezwan Spicy'],
      'addOns': [
        {'name': 'Veg Manchurian (4 pcs)', 'price': 60.0, 'image': 'assets/images/restaurant_chinese_header.jpg'},
        {'name': 'Chilli Garlic Dip', 'price': 20.0, 'image': 'assets/images/restaurant_chicken_item.jpg'},
      ],
    },
    {
      'name': 'Chilli Paneer Dry',
      'category': 'Chinese & Asian',
      'subcategory': 'Starters',
      'b2bPrice': 190.0,
      'foodType': 'veg',
      'description': 'Fried paneer cubes tossed in spicy soya-chilli glaze with capsicum and spring onions.',
      'image': 'assets/images/restaurant_chinese_header.jpg',
      'flavors': ['Dry Starter', 'Semi-Gravy'],
      'addOns': [
        {'name': 'Fried Rice (Small)', 'price': 70.0, 'image': 'assets/images/restaurant_chinese_header.jpg'},
      ],
    },
  ];

  @override
  void initState() {
    super.initState();
    // Start with North Indian preset loaded by default for instant preview
    _loadPreset(_northIndianPreset, 'North_Indian_Menu_Sample.xlsx', '18.4 KB');
  }

  @override
  void dispose() {
    _pasteController.dispose();
    super.dispose();
  }

  void _loadPreset(List<Map<String, dynamic>> presetList, String fileName, String fileSize) {
    setState(() {
      _selectedFileName = fileName;
      _selectedFileSize = fileSize;
      _parsedItems = presetList.map((item) {
        return {
          '_id': 'm_imp_${DateTime.now().millisecondsSinceEpoch}_${item['name'].hashCode}',
          'name': item['name'],
          'category': item['category'] ?? 'General',
          'subcategory': item['subcategory'] ?? 'General',
          'b2bPrice': (item['b2bPrice'] as num).toDouble(),
          'foodType': item['foodType'] ?? 'veg',
          'isAvailable': true,
          'description': item['description'] ?? '',
          'image': item['image'] ?? 'assets/images/restaurant_chicken_item.jpg',
          'flavors': List<String>.from(item['flavors'] ?? ['Standard']),
          'addOns': List<Map<String, dynamic>>.from(item['addOns'] ?? []),
        };
      }).toList();

      _selectedIndices.clear();
      for (int i = 0; i < _parsedItems.length; i++) {
        _selectedIndices.add(i);
      }
    });
  }

  void _simulateFileUpload() {
    setState(() {
      _isUploading = true;
    });

    Future.delayed(const Duration(milliseconds: 700), () {
      if (!mounted) return;
      _loadPreset(_northIndianPreset, 'Restaurant_Menu_Master.xlsx', '24.2 KB');
      setState(() {
        _isUploading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Excel file parsed successfully! ${_parsedItems.length} dishes detected.'),
          backgroundColor: AppColors.primaryGreen,
          duration: const Duration(seconds: 2),
        ),
      );
    });
  }

  void _parsePastedText() {
    final text = _pasteController.text.trim();
    if (text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please paste some CSV or Excel text first!'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    final lines = text.split('\n');
    final List<Map<String, dynamic>> newParsed = [];

    for (int i = 0; i < lines.length; i++) {
      final line = lines[i].trim();
      if (line.isEmpty) continue;

      // Split by tab (Excel copy) or comma (CSV)
      final List<String> parts = line.contains('\t') ? line.split('\t') : line.split(',');
      if (parts.isEmpty) continue;

      final name = parts[0].trim();
      if (name.isEmpty || name.toLowerCase() == 'name' || name.toLowerCase() == 'dish name') {
        continue; // Skip header row
      }

      final category = parts.length > 1 && parts[1].trim().isNotEmpty ? parts[1].trim() : 'Main Course';
      final priceStr = parts.length > 2 ? parts[2].replaceAll(RegExp(r'[^0-9.]'), '').trim() : '150';
      final double price = double.tryParse(priceStr) ?? 150.0;
      final typeStr = parts.length > 3 ? parts[3].trim().toLowerCase() : 'veg';
      final isNonVeg = typeStr.contains('non') || typeStr.contains('chicken') || typeStr.contains('mutton') || typeStr.contains('egg') || typeStr.contains('fish');
      final desc = parts.length > 4 ? parts[4].trim() : 'Delicious freshly prepared dish';

      List<String> flavors = ['Regular', 'Spicy'];
      if (parts.length > 5 && parts[5].trim().isNotEmpty) {
        flavors = parts[5].split(RegExp(r'[/;|]')).map((f) => f.trim()).where((f) => f.isNotEmpty).toList();
      }

      newParsed.add({
        '_id': 'm_imp_${DateTime.now().millisecondsSinceEpoch}_$i',
        'name': name,
        'category': category,
        'subcategory': category,
        'b2bPrice': price,
        'foodType': isNonVeg ? 'non-veg' : 'veg',
        'isAvailable': true,
        'description': desc,
        'image': isNonVeg ? 'assets/images/restaurant_chicken_item.jpg' : 'assets/images/restaurant_paneertikka_header.jpg',
        'flavors': flavors.isNotEmpty ? flavors : ['Standard'],
        'addOns': [
          {'name': 'Extra Portion', 'price': 30.0, 'image': 'assets/images/restaurant_chicken_item.jpg'},
        ],
      });
    }

    if (newParsed.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No valid items could be parsed. Check the format guide!'),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    setState(() {
      _selectedFileName = 'Pasted_Spreadsheet_Data.csv';
      _selectedFileSize = '${lines.length} lines';
      _parsedItems = newParsed;
      _selectedIndices.clear();
      for (int i = 0; i < _parsedItems.length; i++) {
        _selectedIndices.add(i);
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Parsed ${newParsed.length} items from pasted spreadsheet data!'),
        backgroundColor: AppColors.primaryGreen,
      ),
    );
  }

  void _confirmImport() {
    if (_selectedIndices.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select at least one item to import!'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    final List<Map<String, dynamic>> itemsToImport = [];
    for (final index in _selectedIndices) {
      if (index < _parsedItems.length) {
        itemsToImport.add(Map<String, dynamic>.from(_parsedItems[index]));
      }
    }

    Navigator.pop(context);
    widget.onItemsImported(itemsToImport);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Top Drag Handle & Title Bar
        Container(
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: [
              // Drag Pill
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Title Row
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primaryGreen.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.table_chart_rounded, color: AppColors.primaryGreen, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Import Menu from Excel / CSV',
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                        Text(
                          'Bulk import your complete restaurant menu in seconds',
                          style: GoogleFonts.poppins(
                            fontSize: 11,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.grey),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Mode Tabs
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(10),
                ),
                padding: const EdgeInsets.all(3),
                child: Row(
                  children: [
                    _buildTabButton(0, 'Upload & Samples', Icons.file_present_rounded),
                    _buildTabButton(1, 'Paste CSV', Icons.paste_rounded),
                    _buildTabButton(2, 'Excel Format', Icons.help_outline_rounded),
                  ],
                ),
              ),
            ],
          ),
        ),

        // Scrollable Body
        Expanded(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(18, 14, 18, 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_activeTab == 0) ...[
                  _buildUploadAndPresetsTab(),
                ] else if (_activeTab == 1) ...[
                  _buildPasteCsvTab(),
                ] else ...[
                  _buildFormatGuideTab(),
                ],

                const SizedBox(height: 20),

                // Preview Table Section Header
                _buildPreviewSectionHeader(),

                const SizedBox(height: 10),

                // Preview List Cards
                if (_parsedItems.isEmpty) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(28),
                    decoration: BoxDecoration(
                      color: Colors.grey[50],
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: Colors.grey[200]!),
                    ),
                    child: Column(
                      children: [
                        Icon(Icons.inventory_2_outlined, size: 40, color: Colors.grey[400]),
                        const SizedBox(height: 10),
                        Text(
                          'No dishes parsed yet',
                          style: GoogleFonts.poppins(color: Colors.grey[700], fontWeight: FontWeight.w600, fontSize: 13),
                        ),
                        Text(
                          'Choose an Excel file or tap a sample menu above',
                          style: GoogleFonts.poppins(color: Colors.grey[500], fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ] else ...[
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _parsedItems.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      return _buildParsedItemCard(index);
                    },
                  ),
                ],
              ],
            ),
          ),
        ),

        // Bottom CTA Bar
        Container(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.06),
                blurRadius: 10,
                offset: const Offset(0, -3),
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '${_selectedIndices.length} of ${_parsedItems.length} selected',
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      Text(
                        'Will be added directly to live menu',
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: _selectedIndices.isEmpty ? null : _confirmImport,
                  icon: const Icon(Icons.file_download_done_rounded, color: Colors.white, size: 18),
                  label: Text(
                    'Import (${_selectedIndices.length}) Dishes',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: Colors.white,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    disabledBackgroundColor: Colors.grey[300],
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTabButton(int index, String title, IconData icon) {
    final bool isSelected = _activeTab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _activeTab = index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    )
                  ]
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 14,
                color: isSelected ? AppColors.primaryGreen : Colors.grey[600],
              ),
              const SizedBox(width: 5),
              Text(
                title,
                style: GoogleFonts.poppins(
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  color: isSelected ? AppColors.primaryGreen : Colors.grey[700],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildUploadAndPresetsTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Upload Excel Box
        GestureDetector(
          onTap: _simulateFileUpload,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
            decoration: BoxDecoration(
              color: AppColors.primaryGreen.withValues(alpha: 0.03),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppColors.primaryGreen.withValues(alpha: 0.4),
                style: BorderStyle.solid,
                width: 1.5,
              ),
            ),
            child: _isUploading
                ? const Center(
                    child: Column(
                      children: [
                        CircularProgressIndicator(color: AppColors.primaryGreen),
                        SizedBox(height: 10),
                        Text('Reading Excel file sheets...'),
                      ],
                    ),
                  )
                : Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.cloud_upload_outlined, color: AppColors.primaryGreen, size: 28),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        _selectedFileName != null ? 'Selected: $_selectedFileName' : 'Select or Browse Excel File (.xlsx / .csv)',
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _selectedFileSize != null ? 'Size: $_selectedFileSize • Tap to re-upload' : 'Supports Microsoft Excel (.xlsx, .xls) and standard CSV format',
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          color: Colors.grey[600],
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.primaryGreen,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          'Browse Files',
                          style: GoogleFonts.poppins(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
          ),
        ),
        const SizedBox(height: 16),

        // Quick Presets Header
        Text(
          'Or test with 1-tap sample menus:',
          style: GoogleFonts.poppins(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: Colors.grey[800],
          ),
        ),
        const SizedBox(height: 8),

        // Presets Chips
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _buildPresetChip(
              title: '🍲 North Indian (6 dishes)',
              isSelected: _selectedFileName == 'North_Indian_Menu_Sample.xlsx',
              onTap: () => _loadPreset(_northIndianPreset, 'North_Indian_Menu_Sample.xlsx', '18.4 KB'),
            ),
            _buildPresetChip(
              title: '🍔 Fast Food & Pizza (5 dishes)',
              isSelected: _selectedFileName == 'Fast_Food_Menu_Sample.xlsx',
              onTap: () => _loadPreset(_fastFoodPreset, 'Fast_Food_Menu_Sample.xlsx', '15.2 KB'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildPresetChip({
    required String title,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryGreen.withValues(alpha: 0.12) : const Color(0xFFF9FAFB),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? AppColors.primaryGreen : Colors.grey[300]!,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Text(
          title,
          style: GoogleFonts.poppins(
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? AppColors.primaryGreen : Colors.black87,
          ),
        ),
      ),
    );
  }

  Widget _buildPasteCsvTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Paste data copied from Excel or Google Sheets:',
          style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _pasteController,
          maxLines: 5,
          style: GoogleFonts.robotoMono(fontSize: 11),
          decoration: InputDecoration(
            hintText: 'Dish Name, Category, Price, Veg/Non-Veg, Description\ne.g. Paneer Tikka, Starters, 220, Veg, Grilled cottage cheese\ne.g. Chicken Biryani, Main Course, 280, Non-Veg, Dum Biryani',
            hintStyle: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[400]),
            filled: true,
            fillColor: const Color(0xFFF9FAFB),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[300]!)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[300]!)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primaryGreen)),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            TextButton(
              onPressed: () {
                _pasteController.text = 'Kadai Paneer, Main Course, 230, Veg, Spicy tomato onion capsicum gravy\nChicken Tikka Masala, Main Course, 280, Non-Veg, Charred chicken in rich gravy\nGarlic Butter Naan, Breads, 50, Veg, Fresh clay oven naan\nMango Lassi, Beverages, 90, Veg, Thick creamy yogurt lassi';
              },
              child: Text('Fill Sample CSV', style: GoogleFonts.poppins(fontSize: 11, color: AppColors.primaryGreen)),
            ),
            const SizedBox(width: 8),
            ElevatedButton.icon(
              onPressed: _parsePastedText,
              icon: const Icon(Icons.flash_on_rounded, size: 16, color: Colors.white),
              label: Text('Parse Data', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryGreen,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                elevation: 0,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildFormatGuideTab() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.info_outline_rounded, color: AppColors.primaryGreen, size: 18),
              const SizedBox(width: 8),
              Text(
                'Excel Columns Structure',
                style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.black87),
              ),
            ],
          ),
          const SizedBox(height: 10),
          _buildGuideRow('1. Dish Name', 'e.g. Butter Chicken (Required)'),
          _buildGuideRow('2. Category', 'e.g. Starters, Main Course, Biryani'),
          _buildGuideRow('3. Base Price', 'e.g. 250 (Numeric ₹ price)'),
          _buildGuideRow('4. Food Type', 'e.g. "veg" or "non-veg"'),
          _buildGuideRow('5. Description', 'e.g. Rich tomato butter gravy'),
          _buildGuideRow('6. Flavours', 'e.g. Mild / Spicy / Extra Gravy (Optional)'),
          _buildGuideRow('7. Add-ons', 'e.g. Extra Cheese:40, Butter Naan:30 (Optional)'),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Sample Excel Template "ECD_Restaurant_Menu_Template.xlsx" downloaded!'),
                    backgroundColor: AppColors.primaryGreen,
                  ),
                );
              },
              icon: const Icon(Icons.download_rounded, size: 16, color: AppColors.primaryGreen),
              label: Text(
                'Download Sample Excel Template',
                style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.primaryGreen),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGuideRow(String col, String example) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              col,
              style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black87),
            ),
          ),
          Expanded(
            child: Text(
              example,
              style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[600]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPreviewSectionHeader() {
    final bool isAllSelected = _selectedIndices.length == _parsedItems.length && _parsedItems.isNotEmpty;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Checkbox(
              value: isAllSelected,
              activeColor: AppColors.primaryGreen,
              onChanged: (val) {
                setState(() {
                  if (val == true) {
                    for (int i = 0; i < _parsedItems.length; i++) {
                      _selectedIndices.add(i);
                    }
                  } else {
                    _selectedIndices.clear();
                  }
                });
              },
            ),
            Text(
              'Dishes to Import (${_selectedIndices.length}/${_parsedItems.length})',
              style: GoogleFonts.poppins(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
          ],
        ),
        if (_parsedItems.isNotEmpty)
          TextButton(
            onPressed: () {
              setState(() {
                _parsedItems.clear();
                _selectedIndices.clear();
              });
            },
            child: Text(
              'Clear All',
              style: GoogleFonts.poppins(fontSize: 11, color: Colors.redAccent),
            ),
          ),
      ],
    );
  }

  Widget _buildParsedItemCard(int index) {
    final item = _parsedItems[index];
    final bool isSelected = _selectedIndices.contains(index);
    final bool isVeg = (item['foodType'] ?? 'veg') == 'veg';
    final List flavors = item['flavors'] ?? [];
    final List addOns = item['addOns'] ?? [];

    return Container(
      decoration: BoxDecoration(
        color: isSelected ? Colors.white : const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isSelected ? AppColors.primaryGreen.withValues(alpha: 0.5) : Colors.grey[200]!,
          width: isSelected ? 1.5 : 1,
        ),
        boxShadow: isSelected
            ? [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                )
              ]
            : null,
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        child: Row(
          children: [
            // Checkbox
            Checkbox(
              value: isSelected,
              activeColor: AppColors.primaryGreen,
              onChanged: (val) {
                setState(() {
                  if (val == true) {
                    _selectedIndices.add(index);
                  } else {
                    _selectedIndices.remove(index);
                  }
                });
              },
            ),

            // Food Type Dot
            Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isVeg ? Colors.green : Colors.red,
              ),
            ),
            const SizedBox(width: 10),

            // Item Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item['name'] ?? '',
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? Colors.black87 : Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF3F4F6),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          item['category'] ?? 'General',
                          style: GoogleFonts.poppins(fontSize: 10, color: Colors.grey[700]),
                        ),
                      ),
                      if (flavors.isNotEmpty) ...[
                        const SizedBox(width: 6),
                        Text(
                          '${flavors.length} flavours',
                          style: GoogleFonts.poppins(fontSize: 10, color: Colors.grey[500]),
                        ),
                      ],
                      if (addOns.isNotEmpty) ...[
                        const SizedBox(width: 6),
                        Text(
                          '${addOns.length} add-ons',
                          style: GoogleFonts.poppins(fontSize: 10, color: Colors.grey[500]),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),

            // Price & Delete
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '₹${(item['b2bPrice'] ?? 0.0).toStringAsFixed(2)}',
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primaryGreen,
                  ),
                ),
                GestureDetector(
                  onTap: () {
                    setState(() {
                      _parsedItems.removeAt(index);
                      _selectedIndices.remove(index);
                      // Re-index remaining items in selected set
                      final newSet = <int>{};
                      for (final idx in _selectedIndices) {
                        if (idx > index) {
                          newSet.add(idx - 1);
                        } else if (idx < index) {
                          newSet.add(idx);
                        }
                      }
                      _selectedIndices.clear();
                      _selectedIndices.addAll(newSet);
                    });
                  },
                  child: const Padding(
                    padding: EdgeInsets.only(top: 4),
                    child: Icon(Icons.delete_outline, size: 16, color: Colors.grey),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}


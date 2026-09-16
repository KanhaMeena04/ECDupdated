import 'package:flutter/material.dart';
import 'dart:convert';
import 'dart:ui';
import 'dart:typed_data';
import 'package:image_picker/image_picker.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';

class MenuManagementScreen extends StatefulWidget {
  const MenuManagementScreen({super.key});

  @override
  State<MenuManagementScreen> createState() => _MenuManagementScreenState();
}

class _MenuManagementScreenState extends State<MenuManagementScreen> {
  List<Map<String, dynamic>> _menuItems = [];
  final bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadInitialMockMenu();
  }

  void _loadInitialMockMenu() {
    _menuItems = [
      {
        '_id': 'm1',
        'name': '6 pcs chicken wings',
        'description': '2pcs original chicken wings served with plain rice',
        'category': 'Starters',
        'subcategory': 'Non-Veg Starters',
        'b2bPrice': 120.0,
        'foodType': 'non-veg',
        'isAvailable': true,
        'image': 'assets/images/restaurant_chicken_item.jpg',
        'flavors': ['Original', 'Honey Bulgogi', 'Snow Cheese', 'Spicy BBQ', 'Snow Onion'],
        'addOns': [
          {'name': 'Plain Rice', 'price': 25.0, 'image': 'assets/images/restaurant_chicken_item.jpg'},
          {'name': 'Extra Sauce', 'price': 20.0, 'image': 'assets/images/restaurant_pizza_item.jpg'},
          {'name': 'Garlic Dip', 'price': 30.0, 'image': 'assets/images/restaurant_chicken_item.jpg'},
          {'name': 'Coke 500ml', 'price': 45.0, 'image': 'assets/images/restaurant_pizza_item.jpg'},
          {'name': 'Cheese Slice', 'price': 25.0, 'image': 'assets/images/restaurant_chicken_item.jpg'},
        ],
      },
      {
        '_id': 'm2',
        'name': 'Margherita Pizza',
        'description': 'Classic thin crust pizza with fresh basil and mozzarella cheese',
        'category': 'Pizzas & Burgers',
        'subcategory': 'Thin Crust Pizza',
        'b2bPrice': 240.0,
        'foodType': 'veg',
        'isAvailable': true,
        'image': 'assets/images/restaurant_pizza_item.jpg',
        'flavors': ['Regular Crust', 'Cheese Burst', 'Wheat Crust'],
        'addOns': [
          {'name': 'Extra Cheese', 'price': 50.0, 'image': 'assets/images/restaurant_pizza_item.jpg'},
          {'name': 'Coke 500ml', 'price': 40.0, 'image': 'assets/images/restaurant_chicken_item.jpg'},
        ],
      },
      {
        '_id': 'm3',
        'name': 'Paneer Butter Masala',
        'description': 'Rich creamy tomato gravy cooked with cottage cheese cubes',
        'category': 'Main Course',
        'subcategory': 'Paneer Specialties',
        'b2bPrice': 220.0,
        'foodType': 'veg',
        'isAvailable': true,
        'image': 'assets/images/restaurant_paneertikka_header.jpg',
        'flavors': ['Mild', 'Spicy'],
        'addOns': [
          {'name': 'Butter Naan', 'price': 40.0, 'image': 'assets/images/restaurant_daltadka_header.jpg'},
        ],
      },
    ];
  }

  void _toggleAvailability(String itemId, bool isAvailable, String name) {
    setState(() {
      final index = _menuItems.indexWhere((item) => item['_id'] == itemId);
      if (index != -1) {
        _menuItems[index]['isAvailable'] = isAvailable;
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(isAvailable ? '$name is now Available' : '$name is marked Unavailable'),
        backgroundColor: AppColors.primaryGreen,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _deleteMenuItem(String itemId) {
    setState(() {
      _menuItems.removeWhere((item) => item['_id'] == itemId);
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Menu item deleted successfully'),
        backgroundColor: Colors.redAccent,
        duration: Duration(seconds: 2),
      ),
    );
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
          onItemSaved: (savedItem) {
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

            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(existingItem != null ? 'Menu item updated successfully!' : 'New menu item added successfully!'),
                backgroundColor: AppColors.primaryGreen,
              ),
            );
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
                  : _menuItems.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.restaurant_menu_rounded, size: 64, color: Colors.grey[400]),
                              const SizedBox(height: 16),
                              Text(
                                'No menu items found',
                                style: GoogleFonts.poppins(color: Colors.grey[600], fontSize: 16),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          physics: const BouncingScrollPhysics(),
                          padding: const EdgeInsets.all(16),
                          itemCount: _menuItems.length,
                          itemBuilder: (context, index) {
                            final item = _menuItems[index];
                            return _buildReferenceMenuCard(item);
                          },
                        ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openAddOrEditMenuModal(),
        backgroundColor: AppColors.primaryGreen,
        icon: const Icon(Icons.add, color: Colors.white),
        label: Text(
          'Add Menu Item',
          style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold),
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
                    IconButton(
                      icon: const Icon(Icons.add_circle_rounded, color: AppColors.primaryGreen, size: 32),
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
    final List<String> flavors = List<String>.from(item['flavors'] ?? ['Original', 'Spicy']);
    final List<dynamic> addOns = item['addOns'] ?? [];

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
                      Text(
                        '₹${(item['b2bPrice'] ?? 0.0).toStringAsFixed(2)}',
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.black,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: item['foodType'] == 'veg' ? Colors.green : Colors.red,
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

  String _selectedCategory = 'Starters';
  String _selectedSubcategory = 'Veg Starters';
  String _foodType = 'Veg'; // 'Veg' or 'Non-Veg'
  Uint8List? _selectedImageBytes;
  String? _existingImagePath;

  List<String> _flavorVariants = ['Original', 'Honey Bulgogi', 'Snow Cheese', 'Original', 'Honey Bulgogi', 'Snow Cheese'];
  List<Map<String, dynamic>> _addOnsList = [
    {'name': 'Plain Rice', 'price': 25.0, 'image': 'assets/images/restaurant_chicken_item.jpg'},
    {'name': 'Plain Rice', 'price': 25.0, 'image': 'assets/images/restaurant_chicken_item.jpg'},
    {'name': 'Plain Rice', 'price': 25.0, 'image': 'assets/images/restaurant_chicken_item.jpg'},
    {'name': 'Plain Rice', 'price': 25.0, 'image': 'assets/images/restaurant_chicken_item.jpg'},
    {'name': 'Plain Rice', 'price': 25.0, 'image': 'assets/images/restaurant_chicken_item.jpg'},
  ];

  final List<String> _categories = [
    'Starters',
    'Main Course',
    'Pizzas & Burgers',
    'Breads & Rice',
    'Desserts',
    'Beverages',
  ];

  final Map<String, List<String>> _subcategoriesMap = {
    'Starters': ['Veg Starters', 'Non-Veg Starters', 'Tandoori Starters', 'Chinese Starters'],
    'Main Course': ['Paneer Specialties', 'Chicken Specialties', 'Dal & Curry', 'Biryani & Rice'],
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
      text: item?['b2bPrice'] != null ? item!['b2bPrice'].toString() : '',
    );
    if (item != null) {
      _selectedCategory = item['category'] ?? 'Starters';
      _selectedSubcategory = item['subcategory'] ?? (_subcategoriesMap[_selectedCategory]?.first ?? 'Veg Starters');
      _foodType = (item['foodType'] ?? 'veg').toString().toLowerCase() == 'non-veg' ? 'Non-Veg' : 'Veg';
      _existingImagePath = item['image'];
      if (item['flavors'] != null) {
        _flavorVariants = List<String>.from(item['flavors']);
      }
      if (item['addOns'] != null) {
        _addOnsList = List<Map<String, dynamic>>.from(item['addOns']);
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    _priceController.dispose();
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

  void _submitForm() {
    if (!_formKey.currentState!.validate()) return;

    String imagePath = _existingImagePath ?? 'assets/images/restaurant_pizza_item.jpg';
    if (_selectedImageBytes != null) {
      final base64String = base64Encode(_selectedImageBytes!);
      imagePath = 'data:image/jpeg;base64,$base64String';
    }

    final savedItem = {
      '_id': widget.existingItem?['_id'] ?? 'm_${DateTime.now().millisecondsSinceEpoch}',
      'name': _nameController.text.trim(),
      'description': _descController.text.trim(),
      'category': _selectedCategory,
      'subcategory': _selectedSubcategory,
      'b2bPrice': double.tryParse(_priceController.text) ?? 0.0,
      'foodType': _foodType.toLowerCase(),
      'isAvailable': widget.existingItem?['isAvailable'] ?? true,
      'image': imagePath,
      'flavors': _flavorVariants,
      'addOns': _addOnsList,
    };

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

                  // Food Type Radio Selection (Veg / Non-Veg)
                  Text('Food Type', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      // Veg Option
                      GestureDetector(
                        onTap: () => setState(() => _foodType = 'Veg'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: _foodType == 'Veg' ? Colors.green.withValues(alpha: 0.1) : Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: _foodType == 'Veg' ? Colors.green : Colors.grey[300]!, width: 1.5),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 12,
                                height: 12,
                                decoration: const BoxDecoration(shape: BoxShape.circle, color: Colors.green),
                              ),
                              const SizedBox(width: 8),
                              Text('Veg', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),

                      // Non-Veg Option
                      GestureDetector(
                        onTap: () => setState(() => _foodType = 'Non-Veg'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: _foodType == 'Non-Veg' ? Colors.red.withValues(alpha: 0.1) : Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: _foodType == 'Non-Veg' ? Colors.red : Colors.grey[300]!, width: 1.5),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 12,
                                height: 12,
                                decoration: const BoxDecoration(shape: BoxShape.circle, color: Colors.red),
                              ),
                              const SizedBox(width: 8),
                              Text('Non-Veg', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Base Price Field
                  Text('Base Price', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller: _priceController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      hintText: 'Enter price (₹)',
                      hintStyle: GoogleFonts.poppins(fontSize: 13, color: Colors.grey[400]),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[300]!)),
                    ),
                    validator: (v) => v == null || v.trim().isEmpty ? 'Please enter price' : null,
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

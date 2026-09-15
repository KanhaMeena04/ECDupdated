import 'package:flutter/material.dart';
import 'dart:convert';
import 'dart:typed_data';
import 'package:image_picker/image_picker.dart';
import 'package:google_fonts/google_fonts.dart';

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
        'name': 'Paneer Butter Masala',
        'description': 'Rich creamy tomato gravy with cottage cheese cubes',
        'b2bPrice': 240.0,
        'foodType': 'veg',
        'isAvailable': true,
        'image': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&q=80',
      },
      {
        '_id': 'm2',
        'name': 'Butter Naan',
        'description': 'Soft clay oven bread brushed with butter',
        'b2bPrice': 40.0,
        'foodType': 'veg',
        'isAvailable': true,
        'image': 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=400&q=80',
      },
      {
        '_id': 'm3',
        'name': 'Hyderabadi Veg Biryani',
        'description': 'Fragrant basmati rice dum cooked with vegetables',
        'b2bPrice': 220.0,
        'foodType': 'veg',
        'isAvailable': true,
        'image': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80',
      },
      {
        '_id': 'm4',
        'name': 'Dal Makhani',
        'description': 'Slow-cooked black lentils in butter and cream',
        'b2bPrice': 190.0,
        'foodType': 'veg',
        'isAvailable': false,
        'image': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80',
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
      SnackBar(content: Text(isAvailable ? '$name is now Active' : '$name is now Hidden')),
    );
  }

  void _requestDeletion(String itemId, String reason) {
    setState(() {
      _menuItems.removeWhere((item) => item['_id'] == itemId);
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Menu item deleted successfully')),
    );
  }

  void _showDeleteDialog(String itemId) {
    final reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Delete Menu Item'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Why do you want to delete this item?'),
              const SizedBox(height: 16),
              TextField(
                controller: reasonController,
                decoration: const InputDecoration(
                  labelText: 'Reason',
                  border: OutlineInputBorder(),
                ),
                maxLines: 2,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                if (reasonController.text.trim().isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please enter a reason')),
                  );
                  return;
                }
                Navigator.pop(context);
                _requestDeletion(itemId, reasonController.text.trim());
              },
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              child: const Text('Delete', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );
  }

  void _showAddDishBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            top: 20,
            left: 20,
            right: 20,
          ),
          child: AddMenuItemForm(
            onItemAdded: (newItem) {
              setState(() {
                _menuItems.insert(0, newItem);
              });
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Menu item added successfully!'), backgroundColor: Color(0xFF248C70)),
              );
            },
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5FAF8),
      appBar: AppBar(
        title: Text('Menu Management', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF2C2C2C),
        elevation: 0.5,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF248C70)))
          : _menuItems.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.restaurant_menu, size: 64, color: Colors.grey),
                      const SizedBox(height: 16),
                      Text('No menu items added yet', style: GoogleFonts.poppins(color: Colors.grey, fontSize: 16)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _menuItems.length,
                  itemBuilder: (context, index) {
                    final item = _menuItems[index];
                    final bool isAvailable = item['isAvailable'] ?? true;

                    return Card(
                      margin: const EdgeInsets.only(bottom: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 2,
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.network(
                                item['image'] ?? '',
                                width: 80,
                                height: 80,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) => Container(
                                  width: 80,
                                  height: 80,
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
                                  Row(
                                    children: [
                                      Container(
                                        width: 12,
                                        height: 12,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: item['foodType'] == 'veg' ? Colors.green : Colors.red,
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          item['name'] ?? '',
                                          style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 15),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    item['description'] ?? '',
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    '₹${item['b2bPrice']}',
                                    style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: const Color(0xFF248C70), fontSize: 14),
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              children: [
                                Switch(
                                  value: isAvailable,
                                  activeThumbColor: const Color(0xFF248C70),
                                  onChanged: (val) {
                                    _toggleAvailability(item['_id'], val, item['name']);
                                  },
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                                  onPressed: () => _showDeleteDialog(item['_id']),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddDishBottomSheet,
        backgroundColor: const Color(0xFF248C70),
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Add Item', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }
}

class AddMenuItemForm extends StatefulWidget {
  final Function(Map<String, dynamic>) onItemAdded;

  const AddMenuItemForm({super.key, required this.onItemAdded});

  @override
  State<AddMenuItemForm> createState() => _AddMenuItemFormState();
}

class _AddMenuItemFormState extends State<AddMenuItemForm> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _descController = TextEditingController();
  final TextEditingController _b2bPriceController = TextEditingController();

  String _itemType = 'Veg';
  bool _isSaving = false;
  Uint8List? _selectedImageBytes;

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

  void _submitForm() {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSaving = true;
    });

    String imagePath = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
    if (_selectedImageBytes != null) {
      final base64String = base64Encode(_selectedImageBytes!);
      imagePath = 'data:image/jpeg;base64,$base64String';
    }

    final newItem = {
      '_id': 'm_${DateTime.now().millisecondsSinceEpoch}',
      'name': _nameController.text.trim(),
      'description': _descController.text.trim(),
      'b2bPrice': double.tryParse(_b2bPriceController.text) ?? 0.0,
      'foodType': _itemType.toLowerCase(),
      'isAvailable': true,
      'image': imagePath,
    };

    widget.onItemAdded(newItem);
    Navigator.pop(context); // Close bottom sheet
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    _b2bPriceController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Add New Dish', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            GestureDetector(
              onTap: _pickImage,
              child: Container(
                width: double.infinity,
                height: 120,
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: _selectedImageBytes != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.memory(_selectedImageBytes!, fit: BoxFit.cover),
                      )
                    : const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add_a_photo, color: Colors.grey, size: 32),
                          SizedBox(height: 4),
                          Text('Tap to select dish image', style: TextStyle(color: Colors.grey, fontSize: 12)),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Dish Name', border: OutlineInputBorder()),
              validator: (v) => v == null || v.isEmpty ? 'Please enter dish name' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _descController,
              decoration: const InputDecoration(labelText: 'Description', border: OutlineInputBorder()),
              maxLines: 2,
              validator: (v) => v == null || v.isEmpty ? 'Please enter description' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _b2bPriceController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Price (₹)', border: OutlineInputBorder()),
              validator: (v) => v == null || v.isEmpty ? 'Please enter price' : null,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Text('Category:', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(width: 16),
                ChoiceChip(
                  label: const Text('Veg'),
                  selected: _itemType == 'Veg',
                  onSelected: (val) => setState(() => _itemType = 'Veg'),
                ),
                const SizedBox(width: 8),
                ChoiceChip(
                  label: const Text('Non-Veg'),
                  selected: _itemType == 'Non-Veg',
                  onSelected: (val) => setState(() => _itemType = 'Non-Veg'),
                ),
              ],
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _isSaving ? null : _submitForm,
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF248C70)),
                child: const Text('Save Dish', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}

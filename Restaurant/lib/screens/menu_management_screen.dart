import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:typed_data';
import 'package:image_picker/image_picker.dart';
import 'package:google_fonts/google_fonts.dart';
import '../api_constants.dart';

class MenuManagementScreen extends StatefulWidget {
  const MenuManagementScreen({Key? key}) : super(key: key);

  @override
  _MenuManagementScreenState createState() => _MenuManagementScreenState();
}

class _MenuManagementScreenState extends State<MenuManagementScreen> {
  List<dynamic> _menuItems = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchMenu();
  }

  Future<void> _fetchMenu() async {
    setState(() {
      _isLoading = true;
    });
    try {
      final response = await http.get(
        Uri.parse(ApiConstants.getProfile(ApiConstants.restaurantId)),
        headers: {
          'Authorization': 'Bearer ${ApiConstants.authToken}',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['restaurant'] != null) {
          setState(() {
            _menuItems = data['restaurant']['menu'] ?? [];
            _isLoading = false;
          });
        }
      } else {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to load menu')),
        );
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  Future<void> _toggleAvailability(String itemId, bool isAvailable, String name) async {
    try {
      final response = await http.patch(
        Uri.parse(ApiConstants.toggleMenuItem(ApiConstants.restaurantId, itemId)),
        headers: {
          'Authorization': 'Bearer ${ApiConstants.authToken}',
          'Content-Type': 'application/json',
        },
        body: json.encode({'isAvailable': isAvailable}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(isAvailable ? '$name is now Active' : '$name is now Hidden')),
          );
          _fetchMenu(); // Refresh to ensure state is consistent
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to update visibility')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  Future<void> _requestDeletion(String itemId, String reason) async {
    try {
      final response = await http.delete(
        Uri.parse(ApiConstants.requestDeleteMenuItem(ApiConstants.restaurantId, itemId)),
        headers: {
          'Authorization': 'Bearer ${ApiConstants.authToken}',
          'Content-Type': 'application/json',
        },
        body: json.encode({'reason': reason}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Deletion requested successfully')),
          );
          _fetchMenu();
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to request deletion')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
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
              const Text('Why do you want to delete this item? This request will be sent to the admin for approval.'),
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
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please provide a reason')));
                  return;
                }
                Navigator.pop(context);
                _requestDeletion(itemId, reasonController.text.trim());
              },
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              child: const Text('Request Delete', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );
  }

  void _showAddItemBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return AddMenuItemForm(onItemAdded: _fetchMenu);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5FAF8),
      appBar: AppBar(
        title: Text('Menu Management', style: GoogleFonts.poppins(fontWeight: FontWeight.w700, color: const Color(0xFF2C2C2C))),
        backgroundColor: Colors.white,
        iconTheme: const IconThemeData(color: Color(0xFF2C2C2C)),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF248C70)))
          : _menuItems.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(color: const Color(0xFF248C70).withOpacity(0.1), shape: BoxShape.circle),
                        child: const Icon(Icons.restaurant_menu_rounded, size: 80, color: Color(0xFF248C70)),
                      ),
                      const SizedBox(height: 24),
                      Text('No menu items yet', style: GoogleFonts.poppins(fontSize: 20, color: const Color(0xFF2C2C2C), fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Text('Add items to show them to your customers', style: GoogleFonts.poppins(color: Colors.grey[500])),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                  itemCount: _menuItems.length,
                  itemBuilder: (context, index) {
                    final item = _menuItems[index];
                    final isVeg = item['foodType'] == 'veg';
                    final approvalStatus = item['approvalStatus'] ?? 'approved';
                    
                    Color statusColor = Colors.green;
                    String statusText = 'Approved';
                    if (approvalStatus == 'pending') {
                      statusColor = Colors.orange;
                      statusText = 'Pending Approval';
                    } else if (approvalStatus == 'delete_pending') {
                      statusColor = Colors.orange;
                      statusText = 'Pending Deletion';
                    } else if (approvalStatus == 'rejected') {
                      statusColor = Colors.red;
                      statusText = 'Rejected';
                    }

                    ImageProvider imageProvider;
                    if (item['image'] != null && item['image'].toString().startsWith('data:image')) {
                      final base64String = item['image'].toString().split(',').last;
                      imageProvider = MemoryImage(base64Decode(base64String));
                    } else {
                      imageProvider = NetworkImage(item['image'] ?? 'https://via.placeholder.com/150');
                    }

                    return Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4))
                        ],
                        border: Border.all(color: Colors.grey[100]!),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Image Placeholder
                            Container(
                              width: 90,
                              height: 90,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(16),
                                color: Colors.grey[100],
                                image: DecorationImage(
                                  image: imageProvider,
                                  fit: BoxFit.cover,
                                ),
                                boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))],
                              ),
                            ),
                            const SizedBox(width: 16),
                            
                            // Details
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      // Veg/Non-Veg icon
                                      Container(
                                        width: 16,
                                        height: 16,
                                        decoration: BoxDecoration(
                                          border: Border.all(color: isVeg ? Colors.green : Colors.red, width: 1.5),
                                          borderRadius: BorderRadius.circular(2),
                                        ),
                                        child: Center(
                                          child: Container(
                                            width: 8,
                                            height: 8,
                                            decoration: BoxDecoration(
                                              shape: BoxShape.circle,
                                              color: isVeg ? Colors.green : Colors.red,
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          item['name'] ?? '',
                                          style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF2C2C2C)),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    item['description'] ?? '',
                                    style: GoogleFonts.poppins(color: Colors.grey[500], fontSize: 13, height: 1.3),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 10),
                                  Row(
                                    children: [
                                      Text('B2B: â‚¹${item['b2bPrice'] ?? 0}', style: GoogleFonts.poppins(fontWeight: FontWeight.w700, color: const Color(0xFF248C70), fontSize: 14)),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: statusColor.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: statusColor.withOpacity(0.2)),
                                    ),
                                    child: Text(
                                      statusText,
                                      style: GoogleFonts.poppins(fontSize: 10, color: statusColor, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            // Switch & Actions
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Switch(
                                  value: item['isAvailable'] ?? false,
                                  onChanged: (approvalStatus == 'pending' || approvalStatus == 'delete_pending') ? null : (val) {
                                    // Optimistic UI update
                                    setState(() {
                                      item['isAvailable'] = val;
                                    });
                                    _toggleAvailability(item['_id'], val, item['name']);
                                  },
                                  activeColor: const Color(0xFF248C70),
                                ),
                                if (approvalStatus != 'delete_pending')
                                  IconButton(
                                    icon: const Icon(Icons.delete, color: Colors.red),
                                    onPressed: () => _showDeleteDialog(item['_id']),
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(),
                                  ),
                              ],
                            )
                          ],
                        ),
                      ),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddItemBottomSheet,
        backgroundColor: const Color(0xFF248C70),
        elevation: 4,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: Text('Add Item', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }
}

class AddMenuItemForm extends StatefulWidget {
  final VoidCallback onItemAdded;

  const AddMenuItemForm({Key? key, required this.onItemAdded}) : super(key: key);

  @override
  _AddMenuItemFormState createState() => _AddMenuItemFormState();
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
        setState(() {
          _selectedImageBytes = bytes;
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to pick image: $e')),
      );
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() {
      _isSaving = true;
    });

    try {
      String imageBase64 = 'https://via.placeholder.com/150';
      if (_selectedImageBytes != null) {
        final base64String = base64Encode(_selectedImageBytes!);
        // Add a proper data URI scheme so it works perfectly in web panels and apps
        imageBase64 = 'data:image/jpeg;base64,$base64String';
      }

      final payload = {
        'name': _nameController.text.trim(),
        'description': _descController.text.trim(),
        'b2bPrice': double.tryParse(_b2bPriceController.text) ?? 0.0,
        'foodType': _itemType.toLowerCase(),
        'image': imageBase64,
      };

      final response = await http.post(
        Uri.parse(ApiConstants.addMenuItem(ApiConstants.restaurantId)),
        headers: {
          'Authorization': 'Bearer ${ApiConstants.authToken}',
          'Content-Type': 'application/json',
        },
        body: json.encode(payload),
      );

      if (response.statusCode == 201) {
        Navigator.pop(context); // Close bottom sheet
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Menu item submitted for approval!')),
        );
        widget.onItemAdded(); // Refresh list
      } else {
        final data = json.decode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(data['message'] ?? 'Failed to add item')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
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
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.88,
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 20,
        right: 20,
        top: 12,
      ),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Container(
                  width: 48,
                  height: 5,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Add New Menu Item', style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.bold, color: const Color(0xFF2C2C2C))),
                  Container(
                    decoration: BoxDecoration(color: Colors.grey[200], shape: BoxShape.circle),
                    child: IconButton(
                      icon: const Icon(Icons.close_rounded, color: Colors.black87),
                      onPressed: () => Navigator.pop(context),
                      splashRadius: 24,
                    ),
                  )
                ],
              ),
              const SizedBox(height: 12),

              // Image Upload
              Center(
                child: GestureDetector(
                  onTap: _pickImage,
                  child: Container(
                    height: 100,
                    width: 100,
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.grey[300]!, width: 2, style: BorderStyle.solid),
                      image: _selectedImageBytes != null
                          ? DecorationImage(
                              image: MemoryImage(_selectedImageBytes!),
                              fit: BoxFit.cover,
                            )
                          : null,
                    ),
                    child: _selectedImageBytes == null
                        ? Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)]),
                                child: const Icon(Icons.add_photo_alternate_rounded, color: Color(0xFF248C70), size: 28),
                              ),
                              const SizedBox(height: 8),
                              Text('Add Photo', style: GoogleFonts.poppins(color: Colors.grey[600], fontSize: 12, fontWeight: FontWeight.w500)),
                            ],
                          )
                        : null,
                  ),
                ),
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _nameController,
                validator: (value) => value == null || value.isEmpty ? 'Required' : null,
                style: GoogleFonts.poppins(fontSize: 15),
                decoration: InputDecoration(
                  labelText: 'Item Name',
                  labelStyle: GoogleFonts.poppins(color: Colors.grey[600]),
                  filled: true,
                  fillColor: Colors.grey[100],
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFF248C70), width: 1.5)),
                  prefixIcon: const Icon(Icons.fastfood_rounded, color: Colors.grey),
                ),
              ),
              const SizedBox(height: 16),

              // Item Type
              Text('Item Type', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13, color: const Color(0xFF2C2C2C))),
              const SizedBox(height: 8),
              Row(
                children: [
                  _buildTypeChip('Veg', Colors.green),
                  const SizedBox(width: 12),
                  _buildTypeChip('Non-Veg', Colors.red),
                  const SizedBox(width: 12),
                  _buildTypeChip('Vegan', Colors.lightGreen),
                ],
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _descController,
                maxLines: 3,
                style: GoogleFonts.poppins(fontSize: 15),
                decoration: InputDecoration(
                  labelText: 'Description',
                  labelStyle: GoogleFonts.poppins(color: Colors.grey[600]),
                  alignLabelWithHint: true,
                  filled: true,
                  fillColor: Colors.grey[100],
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFF248C70), width: 1.5)),
                ),
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _b2bPriceController,
                validator: (value) => value == null || value.isEmpty ? 'Required' : null,
                keyboardType: TextInputType.number,
                style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w600),
                decoration: InputDecoration(
                  labelText: 'B2B Price (â‚¹) - Your cost',
                  labelStyle: GoogleFonts.poppins(color: Colors.grey[600]),
                  filled: true,
                  fillColor: Colors.grey[100],
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFF248C70), width: 1.5)),
                  prefixIcon: const Icon(Icons.currency_rupee_rounded, size: 20, color: Colors.grey),
                ),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: Colors.orange.withOpacity(0.08), borderRadius: BorderRadius.circular(12)),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, color: Colors.orange, size: 18),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Your item will be reviewed by admin to set the final Selling Price.',
                        style: GoogleFonts.poppins(color: Colors.orange[800], fontSize: 12, fontStyle: FontStyle.italic),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _submitForm,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2C2C2C),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 2,
                  ),
                  child: _isSaving 
                      ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                      : Text('Submit for Approval', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: 0.5)),
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTypeChip(String label, Color color) {
    final isSelected = _itemType == label;
    return GestureDetector(
      onTap: () => setState(() => _itemType = label),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.15) : Colors.grey[100],
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? color : Colors.transparent, width: 1.5),
        ),
        child: Row(
          children: [
            if (isSelected) ...[
              Icon(Icons.check_circle_rounded, color: color, size: 16),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: GoogleFonts.poppins(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected ? color : Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

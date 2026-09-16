import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';

class RestaurantProfileScreen extends StatefulWidget {
  const RestaurantProfileScreen({super.key});

  @override
  State<RestaurantProfileScreen> createState() => _RestaurantProfileScreenState();
}

class _RestaurantProfileScreenState extends State<RestaurantProfileScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Controllers for Restaurant Details
  final TextEditingController _tradeNameController = TextEditingController(text: 'ECDKART Partner Restaurant');
  final TextEditingController _typeController = TextEditingController(text: 'Casual Dining & Fast Food');
  final TextEditingController _cuisineController = TextEditingController(text: 'Pizza, Italian, Fast Food');
  final TextEditingController _aboutController = TextEditingController(
    text: 'We serve delicious Pizza, Italian, and Fast Food made with fresh ingredients and quality recipes. Our focus is on great taste, quick preparation, and hygienic cooking to ensure every order is satisfying and delivered on time.',
  );

  // Location Controllers
  final TextEditingController _addressController = TextEditingController(text: 'Logistics Park, Dubai Industrial City');
  final TextEditingController _areaController = TextEditingController(text: 'Dubai Industrial City');
  final TextEditingController _cityController = TextEditingController(text: 'Dubai');

  // Contact Info
  final TextEditingController _phoneController = TextEditingController(text: '+1 416-026-0518');
  final TextEditingController _emailController = TextEditingController(text: 'ecdkartpartner@gmail.com');

  // Documents
  final TextEditingController _tradeLicenseController = TextEditingController(text: 'TL-94820194');
  final TextEditingController _vatNumberController = TextEditingController(text: 'VAT-39201948');

  // Sample Images List
  final List<String> _restaurantImages = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=500&q=80',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=500&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=500&q=80',
  ];

  // Operational Days
  final List<Map<String, dynamic>> _operationalDays = [
    {'day': 'Monday', 'isOpen': true, 'from': '09:00 AM', 'to': '05:30 PM'},
    {'day': 'Tuesday', 'isOpen': true, 'from': '09:00 AM', 'to': '05:30 PM'},
    {'day': 'Wednesday', 'isOpen': true, 'from': '09:00 AM', 'to': '05:30 PM'},
    {'day': 'Thursday', 'isOpen': true, 'from': '09:00 AM', 'to': '05:30 PM'},
    {'day': 'Friday', 'isOpen': true, 'from': '09:00 AM', 'to': '05:30 PM'},
    {'day': 'Saturday', 'isOpen': true, 'from': '09:00 AM', 'to': '05:30 PM'},
    {'day': 'Sunday', 'isOpen': false, 'from': 'Closed', 'to': 'Closed'},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _tradeNameController.dispose();
    _typeController.dispose();
    _cuisineController.dispose();
    _aboutController.dispose();
    _addressController.dispose();
    _areaController.dispose();
    _cityController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _tradeLicenseController.dispose();
    _vatNumberController.dispose();
    super.dispose();
  }

  void _saveProfile() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Restaurant Profile saved successfully!',
          style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.w500),
        ),
        backgroundColor: AppColors.primaryGreen,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: Text(
          'Restaurant Profile',
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.bold,
            fontSize: 20,
            color: Colors.black87,
          ),
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primaryGreen,
          unselectedLabelColor: Colors.grey[600],
          indicatorColor: AppColors.primaryGreen,
          indicatorWeight: 3,
          labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 14),
          unselectedLabelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w500, fontSize: 14),
          tabs: const [
            Tab(text: 'Profile View'),
            Tab(text: 'Edit Details'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildViewMode(),
          _buildEditMode(),
        ],
      ),
    );
  }

  // View Mode matching Reference Image 3
  Widget _buildViewMode() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Banner Image Header
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                height: 180,
                width: double.infinity,
                decoration: const BoxDecoration(
                  image: DecorationImage(
                    image: AssetImage('assets/images/restaurant_header_bg.jpg'),
                    fit: BoxFit.cover,
                  ),
                ),
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      stops: const [0.0, 0.40, 0.75, 1.0],
                      colors: [
                        Colors.black.withValues(alpha: 0.15),
                        Colors.white.withValues(alpha: 0.45),
                        Colors.white.withValues(alpha: 0.85),
                        Colors.white,
                      ],
                    ),
                  ),
                ),
              ),
              Positioned(
                bottom: -40,
                left: 20,
                child: Row(
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: const [
                          BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4)),
                        ],
                        image: const DecorationImage(
                          image: NetworkImage('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&q=80'),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 42),
                        Text(
                          _tradeNameController.text,
                          style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
                        ),
                        Text(
                          _cuisineController.text,
                          style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600]),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Delivery | Pickup services',
                          style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.primaryGreen),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 54),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // About Restaurant Card
                _buildInfoCard(
                  title: 'About Restaurant',
                  child: Text(
                    _aboutController.text,
                    style: GoogleFonts.poppins(fontSize: 13, color: Colors.grey[700], height: 1.5),
                  ),
                ),

                const SizedBox(height: 16),

                // Contact Information
                _buildInfoCard(
                  title: 'Contact Information',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Phone', style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[500])),
                                Text(_phoneController.text, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600)),
                              ],
                            ),
                          ),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Email', style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[500])),
                                Text(_emailController.text, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600)),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text('Address', style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[500])),
                      Text('${_addressController.text}, ${_cityController.text}', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 14),

                      // Map Container Placeholder matching Reference Image 3
                      Container(
                        height: 110,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE5E7EB),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Colors.grey[300]!),
                        ),
                        child: Stack(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(14),
                              child: Container(
                                color: const Color(0xFFEDF2F7),
                                child: Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Icon(Icons.location_on, color: AppColors.primaryGreen, size: 32),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Dubai Industrial City, Dubai',
                                        style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black87),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Operational Hours
                _buildInfoCard(
                  title: 'Operational Hours',
                  child: Column(
                    children: _operationalDays.map((item) {
                      final bool isClosed = !item['isOpen'];
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(item['day'], style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w500, color: Colors.black87)),
                            Text(
                              isClosed ? 'Closed' : '${item['from']} - ${item['to']}',
                              style: GoogleFonts.poppins(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: isClosed ? Colors.red : AppColors.primaryGreen,
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ),

                const SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Edit Mode matching Reference Images 4 & 5
  Widget _buildEditMode() {
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(18),
            child: Column(
              children: [
                // Section 1: Restaurant Details
                _buildAccordionSection(
                  title: 'Restaurant Details',
                  children: [
                    _buildTextField('Restaurant Trade Name', _tradeNameController),
                    const SizedBox(height: 14),
                    _buildTextField('Restaurant Type', _typeController),
                    const SizedBox(height: 14),
                    _buildTextField('Cuisine Type', _cuisineController),
                    const SizedBox(height: 14),
                    _buildTextField('About Restaurant', _aboutController, maxLines: 4),
                  ],
                ),

                const SizedBox(height: 16),

                // Section 2: Restaurant Images
                _buildAccordionSection(
                  title: 'Restaurant Images',
                  children: [
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [
                        ..._restaurantImages.asMap().entries.map((entry) {
                          final idx = entry.key;
                          final url = entry.value;
                          return Stack(
                            clipBehavior: Clip.none,
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: Image.network(url, width: 80, height: 80, fit: BoxFit.cover),
                              ),
                              Positioned(
                                top: -6,
                                right: -6,
                                child: GestureDetector(
                                  onTap: () {
                                    setState(() {
                                      _restaurantImages.removeAt(idx);
                                    });
                                  },
                                  child: const CircleAvatar(
                                    radius: 10,
                                    backgroundColor: Colors.black,
                                    child: Icon(Icons.close, size: 12, color: Colors.white),
                                  ),
                                ),
                              ),
                            ],
                          );
                        }),
                        // Add image square matching Reference Image 4
                        GestureDetector(
                          onTap: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Upload Image picker opened!')),
                            );
                          },
                          child: Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              color: Colors.grey[50],
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.grey[300]!, width: 1.5),
                            ),
                            child: const Center(
                              child: Icon(Icons.camera_alt_outlined, color: Colors.black54, size: 28),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Section 3: Restaurant Location
                _buildAccordionSection(
                  title: 'Restaurant Location',
                  children: [
                    _buildTextField('Restaurant Address', _addressController),
                    const SizedBox(height: 14),
                    _buildTextField('Area', _areaController),
                    const SizedBox(height: 14),
                    _buildTextField('City', _cityController),
                    const SizedBox(height: 14),
                    // Map view box
                    Container(
                      height: 120,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: const Color(0xFFEDF2F7),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.grey[300]!),
                      ),
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.map, color: AppColors.primaryGreen, size: 30),
                            const SizedBox(height: 4),
                            Text(
                              'Location Pin Selected on Map',
                              style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Section 4: Documents
                _buildAccordionSection(
                  title: 'Documents',
                  children: [
                    _buildTextField('Trade License Number', _tradeLicenseController),
                    const SizedBox(height: 10),
                    _buildUploadBox('Upload Trade Licence Number'),
                    const SizedBox(height: 16),
                    _buildTextField('VAT Registration Number', _vatNumberController),
                    const SizedBox(height: 10),
                    _buildUploadBox('Upload VAT'),
                  ],
                ),

                const SizedBox(height: 16),

                // Section 5: Operational Details
                _buildAccordionSection(
                  title: 'Operational Details',
                  children: _operationalDays.map((item) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(
                        children: [
                          Switch(
                            value: item['isOpen'],
                            activeThumbColor: AppColors.primaryGreen,
                            activeTrackColor: AppColors.primaryGreen.withValues(alpha: 0.4),
                            onChanged: (val) {
                              setState(() {
                                item['isOpen'] = val;
                              });
                            },
                          ),
                          SizedBox(
                            width: 80,
                            child: Text(
                              item['day'],
                              style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                          ),
                          Expanded(
                            child: Row(
                              children: [
                                Expanded(
                                  child: _buildTimeChip('From', item['from']),
                                ),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: _buildTimeChip('To', item['to']),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
        ),

        // Bottom Primary Green Save Button matching theme & reference images
        Container(
          padding: const EdgeInsets.all(18),
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
            child: SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _saveProfile,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryGreen,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: Text(
                  'Save',
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInfoCard({required String title, required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!, width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }

  Widget _buildAccordionSection({required String title, required List<Widget> children}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!, width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black87),
              ),
              const Icon(Icons.keyboard_arrow_up, color: Colors.black54, size: 22),
            ],
          ),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, {int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey[700]),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          maxLines: maxLines,
          style: GoogleFonts.poppins(fontSize: 13),
          decoration: InputDecoration(
            hintText: 'Enter $label',
            hintStyle: GoogleFonts.poppins(color: Colors.grey[400], fontSize: 13),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildUploadBox(String label) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 18),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[300]!, width: 1.5),
      ),
      child: Column(
        children: [
          const Icon(Icons.file_upload_outlined, color: Colors.black54, size: 24),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600], fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _buildTimeChip(String prefix, String time) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Text(
        '$prefix $time',
        textAlign: TextAlign.center,
        style: GoogleFonts.poppins(fontSize: 11, color: Colors.black87),
      ),
    );
  }
}

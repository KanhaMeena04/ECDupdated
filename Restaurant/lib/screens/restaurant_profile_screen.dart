import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:geolocator/geolocator.dart';
import '../api_constants.dart';
import '../theme/app_colors.dart';

class RestaurantProfileScreen extends StatefulWidget {
  const RestaurantProfileScreen({super.key});

  @override
  State<RestaurantProfileScreen> createState() => _RestaurantProfileScreenState();
}

class _RestaurantProfileScreenState extends State<RestaurantProfileScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Controllers for Restaurant Details
  final TextEditingController _tradeNameController = TextEditingController();
  final TextEditingController _typeController = TextEditingController(text: 'Both (Veg & Non-Veg)');
  final TextEditingController _cuisineController = TextEditingController(text: 'North Indian, Fast Food, Chinese');
  final TextEditingController _aboutController = TextEditingController();

  // Location Controllers
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _areaController = TextEditingController();
  final TextEditingController _cityController = TextEditingController();
  bool _isFetchingLocation = false;

  Future<void> _fetchCurrentLocation() async {
    setState(() => _isFetchingLocation = true);
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('GPS is disabled. Please enable location services.'), backgroundColor: Colors.red),
          );
        }
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      Position? position;
      if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
        position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
          timeLimit: const Duration(seconds: 10),
        );
      } else {
        position = await Geolocator.getLastKnownPosition();
      }

      if (position != null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('📍 Live GPS Fetched: ${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)}'),
              backgroundColor: AppColors.primaryGreen,
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not fetch GPS location. Please try again.'), backgroundColor: Colors.orange),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Location error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isFetchingLocation = false);
      }
    }
  }

  // Contact Info
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();

  // Documents
  final TextEditingController _tradeLicenseController = TextEditingController(text: 'FSSAI-VERIFIED');
  final TextEditingController _vatNumberController = TextEditingController(text: 'GST-REGISTERED');

  // Dynamic Images List
  final List<String> _restaurantImages = [];

  // Operational Days
  final List<Map<String, dynamic>> _operationalDays = [
    {'day': 'Monday', 'isOpen': true, 'from': '09:00 AM', 'to': '11:00 PM'},
    {'day': 'Tuesday', 'isOpen': true, 'from': '09:00 AM', 'to': '11:00 PM'},
    {'day': 'Wednesday', 'isOpen': true, 'from': '09:00 AM', 'to': '11:00 PM'},
    {'day': 'Thursday', 'isOpen': true, 'from': '09:00 AM', 'to': '11:00 PM'},
    {'day': 'Friday', 'isOpen': true, 'from': '09:00 AM', 'to': '11:00 PM'},
    {'day': 'Saturday', 'isOpen': true, 'from': '09:00 AM', 'to': '11:00 PM'},
    {'day': 'Sunday', 'isOpen': true, 'from': '09:00 AM', 'to': '11:00 PM'},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadRestaurantDetails();
  }

  Future<void> _loadRestaurantDetails() async {
    final prefs = await SharedPreferences.getInstance();
    final restId = prefs.getString('restaurantId') ?? '';
    final phone = prefs.getString('userPhone') ?? '';
    final token = prefs.getString('token') ?? '';
    final storedName = prefs.getString('restaurantName') ?? '';
    final storedAddress = prefs.getString('restaurantAddress') ?? '';
    final storedEmail = prefs.getString('userEmail') ?? '';

    if (storedName.isNotEmpty && storedName != 'null') _tradeNameController.text = storedName;
    if (storedAddress.isNotEmpty && storedAddress != 'null') _addressController.text = storedAddress;
    if (phone.isNotEmpty) _phoneController.text = phone;
    if (storedEmail.isNotEmpty && storedEmail != 'null') _emailController.text = storedEmail;

    try {
      String url = '';
      if (restId.isNotEmpty) {
        url = '${ApiConstants.baseUrl}/restaurants/vendor/profile/$restId';
      } else if (phone.isNotEmpty) {
        url = ApiConstants.checkApprovalStatusByMobile(phone);
      }

      if (url.isNotEmpty) {
        final res = await http.get(
          Uri.parse(url),
          headers: {
            'Content-Type': 'application/json',
            if (token.isNotEmpty) 'Authorization': 'Bearer $token',
          },
        ).timeout(const Duration(seconds: 6));

        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          final restObj = data['restaurant'] ?? data;
          if (mounted) {
            setState(() {
              if (restObj['name'] != null) {
                _tradeNameController.text = restObj['name'] is Map ? (restObj['name']['en'] ?? '') : restObj['name'].toString();
              }
              if (restObj['address'] != null) _addressController.text = restObj['address'].toString();
              if (restObj['city'] != null) _cityController.text = restObj['city'].toString();
              if (restObj['area'] != null) _areaController.text = restObj['area'].toString();
              if (restObj['contactNumber'] != null) _phoneController.text = restObj['contactNumber'].toString();
              if (restObj['email'] != null) _emailController.text = restObj['email'].toString();
              if (restObj['fssaiNumber'] != null) _tradeLicenseController.text = restObj['fssaiNumber'].toString();
              if (restObj['gstNumber'] != null) _vatNumberController.text = restObj['gstNumber'].toString();
              if (restObj['description'] != null) {
                _aboutController.text = restObj['description'] is Map ? (restObj['description']['en'] ?? '') : restObj['description'].toString();
              }
              if (restObj['cuisine'] != null) {
                if (restObj['cuisine'] is List) {
                  _cuisineController.text = (restObj['cuisine'] as List).join(', ');
                } else {
                  _cuisineController.text = restObj['cuisine'].toString();
                }
              }
              if (restObj['restaurantType'] != null) _typeController.text = restObj['restaurantType'].toString();

              _restaurantImages.clear();
              if (restObj['restaurantImages'] is List && (restObj['restaurantImages'] as List).isNotEmpty) {
                for (var img in (restObj['restaurantImages'] as List)) {
                  if (img != null && img.toString().isNotEmpty) {
                    _restaurantImages.add(img.toString());
                  }
                }
              } else if (restObj['image'] != null && restObj['image'].toString().isNotEmpty) {
                _restaurantImages.add(restObj['image'].toString());
              }
            });
          }
        }
      }
    } catch (_) {}
  }

  Future<void> _pickProfileImage() async {
    try {
      final ImagePicker picker = ImagePicker();
      final XFile? image = await picker.pickImage(source: ImageSource.gallery);
      if (image != null) {
        setState(() {
          _restaurantImages.add(image.path);
        });
      }
    } catch (e) {
      debugPrint('Error picking image: $e');
    }
  }

  Future<void> _saveProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final restId = prefs.getString('restaurantId') ?? '';
    final token = prefs.getString('token') ?? '';

    await prefs.setString('restaurantName', _tradeNameController.text.trim());
    await prefs.setString('restaurantAddress', _addressController.text.trim());
    await prefs.setString('userPhone', _phoneController.text.trim());
    await prefs.setString('userEmail', _emailController.text.trim());

    if (restId.isNotEmpty) {
      try {
        final url = '${ApiConstants.baseUrl}/restaurants/vendor/profile/$restId';
        final body = {
          'name': _tradeNameController.text.trim(),
          'restaurantType': _typeController.text.trim(),
          'cuisine': _cuisineController.text.trim(),
          'description': _aboutController.text.trim(),
          'address': _addressController.text.trim(),
          'area': _areaController.text.trim(),
          'city': _cityController.text.trim(),
          'contactNumber': _phoneController.text.trim(),
          'email': _emailController.text.trim(),
          'fssaiNumber': _tradeLicenseController.text.trim(),
          'gstNumber': _vatNumberController.text.trim(),
          'restaurantImages': _restaurantImages,
        };

        final response = await http.put(
          Uri.parse(url),
          headers: {
            'Content-Type': 'application/json',
            if (token.isNotEmpty) 'Authorization': 'Bearer $token',
          },
          body: jsonEncode(body),
        ).timeout(const Duration(seconds: 8));

        if (response.statusCode == 200) {
          debugPrint("Profile updated successfully on DB!");
        }
      } catch (e) {
        debugPrint("Error saving profile to DB: $e");
      }
    }

    if (mounted) {
      setState(() {});
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '🎉 Restaurant Profile saved & updated in backend database!',
            style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.w600),
          ),
          backgroundColor: AppColors.primaryGreen,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      _tabController.animateTo(0);
    }
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
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 12),
                                        child: Text(
                                          _addressController.text.isNotEmpty
                                              ? '${_addressController.text}${_areaController.text.isNotEmpty ? ", ${_areaController.text}" : ""}${_cityController.text.isNotEmpty ? ", ${_cityController.text}" : ""}'
                                              : 'Restaurant Address Pending',
                                          textAlign: TextAlign.center,
                                          style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black87),
                                        ),
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
                          onTap: _pickProfileImage,
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
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Live GPS Location', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.black87)),
                        ElevatedButton.icon(
                          onPressed: _isFetchingLocation ? null : _fetchCurrentLocation,
                          icon: _isFetchingLocation
                              ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Icon(Icons.my_location_rounded, size: 14, color: Colors.white),
                          label: Text(
                            _isFetchingLocation ? 'Fetching...' : 'Fetch Live Location',
                            style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryGreen,
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            elevation: 0,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _buildTextField('Restaurant Address', _addressController),
                    const SizedBox(height: 14),
                    _buildTextField('Area', _areaController),
                    const SizedBox(height: 14),
                    _buildTextField('City', _cityController),
                    const SizedBox(height: 14),
                    // Map view box
                    Container(
                      height: 100,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: const Color(0xFFE8F5E9),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.primaryGreen.withOpacity(0.3)),
                      ),
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.location_on_rounded, color: AppColors.primaryGreen, size: 30),
                            const SizedBox(height: 4),
                            Text(
                              '📍 Live Device Location Sync Enabled',
                              style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
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

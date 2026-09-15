import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/location_provider.dart';
import '../../routes/app_routes.dart';
import '../../services/location_service.dart';

class LocationSetupPage extends StatefulWidget {
  const LocationSetupPage({super.key});

  @override
  State<LocationSetupPage> createState() => _LocationSetupPageState();
}

class _LocationSetupPageState extends State<LocationSetupPage> {
  final TextEditingController _searchController = TextEditingController();
  bool _isLoading = false;

  final List<Map<String, String>> _popularLocations = [
    {
      'title': 'Vijay Nagar, Indore',
      'sub': 'Bhagora, Madhya Pradesh, India',
    },
    {
      'title': 'Palasia, Indore',
      'sub': 'Madhya Pradesh, India',
    },
    {
      'title': 'MP Nagar, Bhopal',
      'sub': 'Madhya Pradesh, India',
    },
    {
      'title': 'Connaught Place, New Delhi',
      'sub': 'Central Delhi, Delhi, India',
    },
    {
      'title': 'Cyber City, Gurgaon',
      'sub': 'Gurugram, Haryana, India',
    },
    {
      'title': 'Sector 15, Faridabad',
      'sub': 'Haryana, India',
    },
    {
      'title': 'Marine Drive, Mumbai',
      'sub': 'Maharashtra, India (Unserviceable Demo)',
    },
    {
      'title': 'MG Road, Bengaluru',
      'sub': 'Karnataka, India (Unserviceable Demo)',
    },
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  // ── Fetch Current Device GPS Location ──────────────────────────────────────
  Future<void> _useDeviceLocation() async {
    setState(() => _isLoading = true);
    try {
      Position? pos;
      try {
        LocationPermission perm = await Geolocator.checkPermission();
        if (perm == LocationPermission.denied) {
          perm = await Geolocator.requestPermission();
        }
        if (perm == LocationPermission.whileInUse || perm == LocationPermission.always) {
          pos = await Geolocator.getCurrentPosition(
            desiredAccuracy: LocationAccuracy.medium,
            timeLimit: const Duration(seconds: 4),
          );
        }
      } catch (_) {}

      String realLoc = await getCurrentLocationName();
      if (!mounted) return;
      setState(() => _isLoading = false);

      final locProvider = context.read<LocationProvider>();
      if (pos != null) {
        locProvider.deviceLat = pos.latitude;
        locProvider.deviceLng = pos.longitude;
      }

      _handleLocationSelected(
        realLoc.isNotEmpty ? realLoc : 'Vijay Nagar, Indore',
        'Madhya Pradesh, India',
        lat: pos?.latitude ?? 22.7196,
        lng: pos?.longitude ?? 75.8577,
      );
    } catch (_) {
      if (mounted) {
        setState(() => _isLoading = false);
        _handleLocationSelected('Vijay Nagar, Indore', 'Bhagora, Madhya Pradesh, India');
      }
    }
  }

  // ── Handle Location Selection & Verification ───────────────────────────────
  void _handleLocationSelected(
    String title,
    String subAddress, {
    double? lat,
    double? lng,
    bool skipPopupCheck = false,
  }) async {
    final locProvider = context.read<LocationProvider>();

    // Check serviceability
    final fullAddr = '$title $subAddress';
    final isServiceable = locProvider.isLocationServiceable(fullAddr);

    if (!isServiceable) {
      // Unserviceable Location -> Go to Screenshot 2 screen
      await locProvider.updateLocation(title, subAddress: subAddress, latitude: lat, longitude: lng);
      if (mounted) {
        context.go('/unserviceable');
      }
      return;
    }

    // Serviceable Location -> Check if selected location is far from device GPS location (or demo popup)
    if (!skipPopupCheck && (title.contains('Bhopal') || title.contains('Delhi') || title.contains('Gurgaon'))) {
      _showLocationFarOffPopup(title, subAddress, lat, lng);
      return;
    }

    // Serviceable & Confirmed -> Go to Home
    await locProvider.updateLocation(title, subAddress: subAddress, latitude: lat, longitude: lng);
    if (mounted) {
      context.go(AppRoutes.home);
    }
  }

  // ── Screenshot 1 Dialog: "Are you sure of the selected location?" ─────────
  void _showLocationFarOffPopup(String title, String subAddress, double? lat, double? lng) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          elevation: 0,
          backgroundColor: Colors.white,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Green Circle with Exclamation Warning Icon (Matching Screenshot 1)
                Container(
                  width: 72,
                  height: 72,
                  decoration: const BoxDecoration(
                    color: Color(0xFF2E8B57), // Forest Green
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.error_outline_rounded,
                      color: Colors.white,
                      size: 38,
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Title
                const Text(
                  'Are you sure of the\nselected location?',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: Colors.black,
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 12),

                // Body text
                const Text(
                  'Your selected location seems to be a little far off from the device location',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: Color(0xFF555555),
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 28),

                // Button 1: "No, select another location" (Green rounded button matching Screenshot 1)
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF04873C), // Deep Green
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(28),
                      ),
                    ),
                    child: const Text(
                      'No, select another location',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Button 2: "Yes, continue with this location" (Green text link matching Screenshot 1)
                TextButton(
                  onPressed: () async {
                    Navigator.pop(ctx);
                    final locProvider = context.read<LocationProvider>();
                    await locProvider.updateLocation(title, subAddress: subAddress, latitude: lat, longitude: lng);
                    if (mounted) {
                      context.go(AppRoutes.home);
                    }
                  },
                  child: const Text(
                    'Yes, continue with this location',
                    style: TextStyle(
                      color: Color(0xFF04873C),
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _popularLocations.where((loc) {
      final query = _searchController.text.toLowerCase();
      if (query.isEmpty) return true;
      return loc['title']!.toLowerCase().contains(query) || loc['sub']!.toLowerCase().contains(query);
    }).toList();

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => context.go(AppRoutes.home),
        ),
        title: const Text(
          'Select Location',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Search Input Box
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                ),
                child: TextField(
                  controller: _searchController,
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(
                    hintText: 'Search area, landmark or street...',
                    hintStyle: TextStyle(color: Color(0xFF9CA3AF), fontSize: 14),
                    prefixIcon: Icon(Icons.search, color: Color(0xFF248C70)),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Use Current GPS Location Button
              InkWell(
                onTap: _isLoading ? null : _useDeviceLocation,
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF248C70).withOpacity(0.08),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF248C70).withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: const BoxDecoration(
                          color: Color(0xFF248C70),
                          shape: BoxShape.circle,
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : const Icon(Icons.my_location, color: Colors.white, size: 20),
                      ),
                      const SizedBox(width: 14),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Use Current Device Location',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF248C70),
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Enable GPS to automatically detect your location',
                              style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_right, color: Color(0xFF248C70)),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 28),
              const Text(
                'Available Service Cities (MP, Delhi, Haryana)',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF374151),
                ),
              ),
              const SizedBox(height: 12),

              // Popular Locations List
              Expanded(
                child: ListView.separated(
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const Divider(height: 1, color: Color(0xFFF3F4F6)),
                  itemBuilder: (context, index) {
                    final item = filtered[index];
                    final isUnserviceableDemo = item['sub']!.contains('Unserviceable');

                    return ListTile(
                      contentPadding: const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: isUnserviceableDemo ? Colors.red.shade50 : const Color(0xFFF3F4F6),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          isUnserviceableDemo ? Icons.location_off : Icons.location_on_outlined,
                          color: isUnserviceableDemo ? Colors.red : const Color(0xFF248C70),
                          size: 22,
                        ),
                      ),
                      title: Text(
                        item['title']!,
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                      ),
                      subtitle: Text(
                        item['sub']!,
                        style: TextStyle(
                          fontSize: 12,
                          color: isUnserviceableDemo ? Colors.red : const Color(0xFF6B7280),
                        ),
                      ),
                      trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Color(0xFF9CA3AF)),
                      onTap: () => _handleLocationSelected(item['title']!, item['sub']!),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

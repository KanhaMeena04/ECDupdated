import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
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
  bool _isSearching = false;
  Timer? _debounceTimer;
  List<Map<String, dynamic>> _searchResults = [];

  @override
  void dispose() {
    _searchController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 400), () {
      _searchLocation(query);
    });
  }

  Future<void> _searchLocation(String query) async {
    final q = query.trim();
    if (q.length < 2) {
      if (mounted) setState(() => _searchResults = []);
      return;
    }
    setState(() => _isSearching = true);
    try {
      final url = Uri.parse(
        'https://nominatim.openstreetmap.org/search?q=${Uri.encodeComponent(q)}&format=json&addressdetails=1&limit=8',
      );
      final response = await http.get(url, headers: {'User-Agent': 'EcdkartUserApp/1.0'});
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        final results = data.map<Map<String, dynamic>>((item) {
          final displayName = item['display_name'] ?? '';
          final lat = double.tryParse(item['lat']?.toString() ?? '') ?? 0.0;
          final lng = double.tryParse(item['lon']?.toString() ?? '') ?? 0.0;

          final address = item['address'] ?? {};
          final namePart = address['road'] ??
              address['suburb'] ??
              address['neighbourhood'] ??
              address['city'] ??
              address['town'] ??
              address['county'] ??
              displayName.split(',').first;
          final statePart = [
            address['city'] ?? address['town'] ?? address['state_district'],
            address['state'],
            address['country']
          ].where((s) => s != null && s.toString().isNotEmpty).join(', ');

          return {
            'title': namePart.toString(),
            'sub': statePart.isNotEmpty ? statePart : displayName.toString(),
            'lat': lat,
            'lng': lng,
          };
        }).toList();

        if (mounted) {
          setState(() {
            _searchResults = results;
            _isSearching = false;
          });
        }
      } else {
        if (mounted) setState(() => _isSearching = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isSearching = false);
    }
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
        realLoc.isNotEmpty ? realLoc : 'Current Location',
        'Live GPS Location',
        lat: pos?.latitude,
        lng: pos?.longitude,
      );
    } catch (_) {
      if (mounted) {
        setState(() => _isLoading = false);
        _handleLocationSelected('Current Location', 'Live GPS Location');
      }
    }
  }

  // ── Handle Location Selection & Transition ───────────────────────────────
  void _handleLocationSelected(
    String title,
    String subAddress, {
    double? lat,
    double? lng,
  }) async {
    final locProvider = context.read<LocationProvider>();
    await locProvider.updateLocation(title, subAddress: subAddress, latitude: lat, longitude: lng);
    if (mounted) {
      context.go(AppRoutes.home);
    }
  }

  @override
  Widget build(BuildContext context) {
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
                  onChanged: _onSearchChanged,
                  decoration: InputDecoration(
                    hintText: 'Search area, landmark or street...',
                    hintStyle: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 14),
                    prefixIcon: const Icon(Icons.search, color: Color(0xFF248C70)),
                    suffixIcon: _isSearching
                        ? const Padding(
                            padding: EdgeInsets.all(12.0),
                            child: SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF248C70)),
                              ),
                            ),
                          )
                        : (_searchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, color: Color(0xFF9CA3AF)),
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() => _searchResults = []);
                                },
                              )
                            : null),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 14),
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

              const SizedBox(height: 24),

              if (_searchResults.isNotEmpty) ...[
                const Text(
                  'Search Results',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF374151),
                  ),
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: ListView.separated(
                    itemCount: _searchResults.length,
                    separatorBuilder: (_, __) => const Divider(height: 1, color: Color(0xFFF3F4F6)),
                    itemBuilder: (context, index) {
                      final item = _searchResults[index];
                      return ListTile(
                        contentPadding: const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
                        leading: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(
                            color: Color(0xFFF3F4F6),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.location_on_outlined,
                            color: Color(0xFF248C70),
                            size: 22,
                          ),
                        ),
                        title: Text(
                          item['title']!,
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                        ),
                        subtitle: Text(
                          item['sub']!,
                          style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                        ),
                        trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Color(0xFF9CA3AF)),
                        onTap: () => _handleLocationSelected(
                          item['title']!,
                          item['sub']!,
                          lat: item['lat'],
                          lng: item['lng'],
                        ),
                      );
                    },
                  ),
                ),
              ] else if (_searchController.text.trim().isNotEmpty && !_isSearching) ...[
                const Expanded(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.location_off_rounded, size: 48, color: Color(0xFF9CA3AF)),
                        SizedBox(height: 12),
                        Text(
                          'No locations found',
                          style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF374151)),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Try searching for another area, city or landmark',
                          style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                        ),
                      ],
                    ),
                  ),
                ),
              ] else ...[
                const Expanded(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.map_outlined, size: 48, color: Color(0xFFD1D5DB)),
                        SizedBox(height: 12),
                        Text(
                          'Search for any city or area',
                          style: TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF6B7280)),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

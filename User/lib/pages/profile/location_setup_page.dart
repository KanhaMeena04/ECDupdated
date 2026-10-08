import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart' as geo;
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/theme/app_colors.dart';
import '../../core/models/address_model.dart';
import '../../providers/location_provider.dart';
import '../../routes/app_routes.dart';
import '../../services/location_service.dart';
import '../../services/address_api_service.dart';

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
  List<Address> _savedAddresses = [];
  bool _isLoadingSavedAddresses = true;
  List<Map<String, dynamic>> _recentLocations = [];

  @override
  void initState() {
    super.initState();
    _loadSavedAddresses();
    _loadRecentLocations();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadSavedAddresses() async {
    try {
      final addresses = await AddressApiService.getMyAddresses();
      if (mounted) {
        setState(() {
          _savedAddresses = addresses;
          _isLoadingSavedAddresses = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingSavedAddresses = false);
    }
  }

  Future<void> _loadRecentLocations() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString('recent_selected_locations');
      if (raw != null && raw.isNotEmpty) {
        final List<dynamic> list = jsonDecode(raw);
        if (mounted) {
          setState(() {
            _recentLocations = list.cast<Map<String, dynamic>>();
          });
        }
      }
    } catch (_) {}
  }

  Future<void> _saveRecentLocation(String title, String subAddress, double? lat, double? lng) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final newEntry = {
        'title': title,
        'sub': subAddress,
        'lat': lat,
        'lng': lng,
      };
      final updated = [
        newEntry,
        ..._recentLocations.where((e) => e['title'] != title),
      ].take(5).toList();

      await prefs.setString('recent_selected_locations', jsonEncode(updated));
    } catch (_) {}
  }

  void _onSearchChanged(String query) {
    final q = query.trim();
    if (q.isEmpty) {
      _debounceTimer?.cancel();
      setState(() {
        _searchResults = [];
        _isSearching = false;
      });
      return;
    }

    setState(() => _isSearching = true);
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 400), () {
      _searchOnlineIndia(q);
    });
  }

  static const String _googleApiKey = 'AIzaSyCN7XqyxOj5lgr2uaMNrTOg6PzHTOGa0xU';

  Future<void> _searchOnlineIndia(String query) async {
    try {
      // 1. Direct Official Google Places API Autocomplete
      final googleUrl = Uri.parse(
        'https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${Uri.encodeComponent(query)}&components=country:in&key=$_googleApiKey',
      );
      final response = await http.get(googleUrl).timeout(const Duration(seconds: 4));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['status'] == 'OK' && data['predictions'] != null) {
          final List<dynamic> preds = data['predictions'];
          final results = preds.map<Map<String, dynamic>>((p) {
            final desc = p['description']?.toString() ?? '';
            final structured = p['structured_formatting'] as Map<String, dynamic>? ?? {};
            final main = structured['main_text']?.toString() ?? desc.split(',').first;
            final secondary = structured['secondary_text']?.toString() ?? desc;
            return {
              'place_id': p['place_id']?.toString() ?? '',
              'title': main,
              'sub': secondary,
              'description': desc,
            };
          }).toList();

          if (mounted) {
            setState(() {
              _searchResults = results;
              _isSearching = false;
            });
            return;
          }
        }
      }
    } catch (_) {}

    // 2. Fallback to native geocoding
    try {
      final locs = await geo.locationFromAddress(query).timeout(const Duration(seconds: 3));
      if (locs.isNotEmpty && mounted) {
        final results = locs.take(6).map((item) {
          return {
            'title': query,
            'sub': 'Lat: ${item.latitude.toStringAsFixed(4)}, Lng: ${item.longitude.toStringAsFixed(4)}',
            'lat': item.latitude,
            'lng': item.longitude,
          };
        }).toList();

        setState(() {
          _searchResults = results;
          _isSearching = false;
        });
        return;
      }
    } catch (_) {}

    if (mounted) setState(() => _isSearching = false);
  }

  Future<void> _handleSearchResultTap(Map<String, dynamic> item) async {
    final placeId = item['place_id']?.toString() ?? '';
    double? lat = item['lat'] != null ? (item['lat'] as num).toDouble() : null;
    double? lng = item['lng'] != null ? (item['lng'] as num).toDouble() : null;
    final title = item['title']?.toString() ?? '';
    final sub = item['sub']?.toString() ?? '';

    if (placeId.isNotEmpty && (lat == null || lng == null)) {
      try {
        final detailsUrl = Uri.parse(
          'https://maps.googleapis.com/maps/api/place/details/json?place_id=$placeId&fields=geometry,formatted_address&key=$_googleApiKey',
        );
        final res = await http.get(detailsUrl).timeout(const Duration(seconds: 4));
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          final geom = data['result']?['geometry']?['location'];
          if (geom != null) {
            lat = double.tryParse(geom['lat']?.toString() ?? '');
            lng = double.tryParse(geom['lng']?.toString() ?? '');
          }
        }
      } catch (_) {}
    }

    _handleLocationSelected(title, sub, lat: lat, lng: lng);
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
            desiredAccuracy: LocationAccuracy.high,
            timeLimit: const Duration(seconds: 8),
          );
        } else {
          pos = await Geolocator.getLastKnownPosition();
        }
      } catch (_) {}

      String realTitle = 'Current Location';
      String realSub = 'Live GPS Location, India';

      if (pos != null) {
        // Direct Google Maps Reverse Geocoding
        try {
          final googleUrl = Uri.parse(
            'https://maps.googleapis.com/maps/api/geocode/json?latlng=${pos.latitude},${pos.longitude}&key=$_googleApiKey',
          );
          final res = await http.get(googleUrl).timeout(const Duration(seconds: 4));
          if (res.statusCode == 200) {
            final data = jsonDecode(res.body);
            if (data['status'] == 'OK' && data['results'] != null && (data['results'] as List).isNotEmpty) {
              final formatted = data['results'][0]['formatted_address']?.toString() ?? '';
              if (formatted.isNotEmpty) {
                realSub = formatted;
                realTitle = formatted.split(',').first;
              }
            }
          }
        } catch (_) {}

        // Fallback to device placemark
        if (realSub == 'Live GPS Location, India') {
          try {
            final placemarks = await geo.placemarkFromCoordinates(pos.latitude, pos.longitude);
            if (placemarks.isNotEmpty) {
              final p = placemarks.first;
              realTitle = p.subLocality?.isNotEmpty == true
                  ? p.subLocality!
                  : (p.street?.isNotEmpty == true ? p.street! : (p.name ?? 'Current Location'));
              realSub = [p.name, p.street, p.subLocality, p.locality, p.administrativeArea, p.postalCode]
                  .where((e) => e != null && e.isNotEmpty)
                  .toSet()
                  .join(', ');
            }
          } catch (_) {}
        }
      }

      if (!mounted) return;
      setState(() => _isLoading = false);

      final locProvider = context.read<LocationProvider>();
      if (pos != null) {
        locProvider.deviceLat = pos.latitude;
        locProvider.deviceLng = pos.longitude;
      }

      _handleLocationSelected(
        realTitle,
        realSub,
        lat: pos?.latitude,
        lng: pos?.longitude,
      );
    } catch (_) {
      if (mounted) {
        setState(() => _isLoading = false);
        _handleLocationSelected('Current Location', 'Live Location, India');
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
    await _saveRecentLocation(title, subAddress, lat, lng);
    if (!mounted) return;
    final locProvider = context.read<LocationProvider>();
    await locProvider.updateLocation(title, subAddress: subAddress, latitude: lat, longitude: lng);
    if (mounted) {
      context.go(AppRoutes.home);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasSearchQuery = _searchController.text.trim().isNotEmpty;

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.black),
          onPressed: () => context.go(AppRoutes.home),
        ),
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Select Delivery Location',
              style: TextStyle(color: Colors.black87, fontWeight: FontWeight.w800, fontSize: 18),
            ),
            Text(
              'Search area, street or use GPS',
              style: TextStyle(color: Color(0xFF248C70), fontWeight: FontWeight.w600, fontSize: 11),
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Search Input & GPS Card
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
              child: Column(
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
                        hintText: 'Search area, street, landmark or city...',
                        hintStyle: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 13),
                        prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF248C70)),
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
                                    icon: const Icon(Icons.clear_rounded, color: Color(0xFF9CA3AF)),
                                    onPressed: () {
                                      _searchController.clear();
                                      setState(() {
                                        _searchResults = [];
                                        _isSearching = false;
                                      });
                                    },
                                  )
                                : null),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Option 1: Use Current Location (GPS)
                  InkWell(
                    onTap: _isLoading ? null : _useDeviceLocation,
                    borderRadius: BorderRadius.circular(14),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF248C70).withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFF248C70).withValues(alpha: 0.25)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: const BoxDecoration(
                              color: Color(0xFF248C70),
                              shape: BoxShape.circle,
                            ),
                            child: _isLoading
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                    ),
                                  )
                                : const Icon(Icons.my_location_rounded, color: Colors.white, size: 16),
                          ),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Use Current Location',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF248C70),
                                  ),
                                ),
                                SizedBox(height: 2),
                                Text(
                                  'Auto-detect address via real-time GPS',
                                  style: TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.chevron_right_rounded, color: Color(0xFF248C70)),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 8),

                  // Option 2: Add / Select an Address (Map Picker & Saved Addresses)
                  InkWell(
                    onTap: () => context.push(AppRoutes.mapAddressPicker),
                    borderRadius: BorderRadius.circular(14),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFE5E7EB)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: const BoxDecoration(
                              color: Color(0xFFF3F4F6),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.add_location_alt_rounded, color: Color(0xFF1F2937), size: 16),
                          ),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Add / Select an Address',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF1F2937),
                                  ),
                                ),
                                SizedBox(height: 2),
                                Text(
                                  'Pin exact delivery location on Google Maps',
                                  style: TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.chevron_right_rounded, color: Color(0xFF9CA3AF)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Body: Live Search Results OR Saved Addresses / Recents
            Expanded(
              child: hasSearchQuery
                  ? _buildSearchResults()
                  : _buildSavedAndRecentLocations(),
            ),
          ],
        ),
      ),
    );
  }

  // ── Search Results View ───────────────────────────────────────────────────
  Widget _buildSearchResults() {
    if (_searchResults.isNotEmpty) {
      return ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        itemCount: _searchResults.length,
        separatorBuilder: (_, __) => const Divider(height: 1, color: Color(0xFFF3F4F6)),
        itemBuilder: (context, index) {
          final item = _searchResults[index];

          return ListTile(
            contentPadding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(
                color: Color(0xFFF3F4F6),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.location_on_rounded,
                color: Color(0xFF248C70),
                size: 20,
              ),
            ),
            title: Text(
              item['title']!,
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: Colors.black87),
            ),
            subtitle: Text(
              item['sub']!,
              style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
            ),
            trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 13, color: Color(0xFF9CA3AF)),
            onTap: () => _handleSearchResultTap(item),
          );
        },
      );
    }

    if (!_isSearching) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.location_off_rounded, size: 48, color: Color(0xFF9CA3AF)),
            SizedBox(height: 12),
            Text(
              'No locations found',
              style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF374151), fontSize: 15),
            ),
            SizedBox(height: 4),
            Text(
              'Try searching with area name, street or landmark',
              style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
            ),
          ],
        ),
      );
    }

    return const Center(child: CircularProgressIndicator(color: AppColors.primary));
  }

  // ── Saved Addresses & Recents ─────────────────────────────────────────────
  Widget _buildSavedAndRecentLocations() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      children: [
        // 1. Saved Addresses Section (if available)
        if (_savedAddresses.isNotEmpty) ...[
          const Row(
            children: [
              Icon(Icons.bookmark_rounded, color: Color(0xFF248C70), size: 18),
              SizedBox(width: 6),
              Text(
                'Saved Addresses',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1F2937),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ..._savedAddresses.map((addr) {
            IconData icon = Icons.location_on_rounded;
            final lbl = addr.label.toLowerCase();
            if (lbl.contains('home')) icon = Icons.home_rounded;
            if (lbl.contains('work') || lbl.contains('office')) icon = Icons.work_rounded;

            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              child: ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF248C70).withValues(alpha: 0.08),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: const Color(0xFF248C70), size: 20),
                ),
                title: Text(
                  addr.label,
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: Colors.black87),
                ),
                subtitle: Text(
                  addr.fullAddress,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                ),
                trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFF9CA3AF)),
                onTap: () => _handleLocationSelected(
                  addr.label,
                  addr.fullAddress,
                  lat: addr.latitude,
                  lng: addr.longitude,
                ),
              ),
            );
          }),
          const SizedBox(height: 20),
        ],

        // 2. Recent Locations Section (if available)
        if (_recentLocations.isNotEmpty) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.history_rounded, color: Color(0xFF6B7280), size: 18),
                  SizedBox(width: 6),
                  Text(
                    'Recent Locations',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                ],
              ),
              TextButton(
                onPressed: () async {
                  final prefs = await SharedPreferences.getInstance();
                  await prefs.remove('recent_selected_locations');
                  if (mounted) setState(() => _recentLocations = []);
                },
                child: const Text('Clear', style: TextStyle(color: Color(0xFFEF4444), fontSize: 12, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ..._recentLocations.map((item) {
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              child: ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(
                    color: Color(0xFFF3F4F6),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.history_rounded, color: Color(0xFF6B7280), size: 18),
                ),
                title: Text(
                  item['title'] ?? '',
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: Colors.black87),
                ),
                subtitle: Text(
                  item['sub'] ?? '',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                ),
                trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFF9CA3AF)),
                onTap: () => _handleLocationSelected(
                  item['title'] ?? '',
                  item['sub'] ?? '',
                  lat: item['lat'],
                  lng: item['lng'],
                ),
              ),
            );
          }),
        ],

        // Helper instruction banner when no recents or saved
        if (_savedAddresses.isEmpty && _recentLocations.isEmpty && !_isLoadingSavedAddresses) ...[
          Container(
            padding: const EdgeInsets.all(20),
            margin: const EdgeInsets.only(top: 20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: const Column(
              children: [
                Icon(Icons.search_rounded, size: 40, color: Color(0xFF248C70)),
                SizedBox(height: 12),
                Text(
                  'Search Your Location',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Color(0xFF1F2937)),
                ),
                SizedBox(height: 6),
                Text(
                  'Type your area, locality, street, or landmark in the search box above or tap "Use Current Device Location".',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: Color(0xFF6B7280), height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

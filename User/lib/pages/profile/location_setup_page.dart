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
import '../../services/indian_locations_data.dart';

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
  String? _expandedState;

  @override
  void dispose() {
    _searchController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
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

    // 1. Instant local search across Indian cities & states
    final localMatches = IndianLocationsData.searchLocal(q).map((city) {
      return {
        'title': city.popularArea != null && city.popularArea!.isNotEmpty
            ? '${city.popularArea}, ${city.name}'
            : city.name,
        'sub': '${city.state}, India',
        'lat': city.lat,
        'lng': city.lng,
        'isLocal': true,
      };
    }).toList();

    setState(() {
      _searchResults = localMatches;
      _isSearching = true;
    });

    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 450), () {
      _searchOnlineIndia(q, localMatches);
    });
  }

  Future<void> _searchOnlineIndia(String query, List<Map<String, dynamic>> localMatches) async {
    try {
      // Strictly restrict search to India (countrycodes=in)
      final url = Uri.parse(
        'https://nominatim.openstreetmap.org/search?q=${Uri.encodeComponent(query)}&countrycodes=in&format=json&addressdetails=1&limit=10',
      );
      final response = await http.get(url, headers: {'User-Agent': 'EcdkartUserApp/1.0'});
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        final onlineResults = data.map<Map<String, dynamic>>((item) {
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
            'India'
          ].where((s) => s != null && s.toString().isNotEmpty).join(', ');

          return {
            'title': namePart.toString(),
            'sub': statePart.isNotEmpty ? statePart : displayName.toString(),
            'lat': lat,
            'lng': lng,
            'isLocal': false,
          };
        }).toList();

        // Combine local results + online results, avoiding duplicates
        final combined = [...localMatches];
        final seenTitles = combined.map((e) => e['title']?.toString().toLowerCase()).toSet();
        for (final res in onlineResults) {
          final t = res['title']?.toString().toLowerCase();
          if (t != null && !seenTitles.contains(t)) {
            seenTitles.add(t);
            combined.add(res);
          }
        }

        if (mounted) {
          setState(() {
            _searchResults = combined;
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
        'Live GPS Location, India',
        lat: pos?.latitude ?? 22.7533,
        lng: pos?.longitude ?? 75.8937,
      );
    } catch (_) {
      if (mounted) {
        setState(() => _isLoading = false);
        _handleLocationSelected('Vijay Nagar, Indore', 'Madhya Pradesh, India', lat: 22.7533, lng: 75.8937);
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
              'Select Location',
              style: TextStyle(color: Colors.black87, fontWeight: FontWeight.w800, fontSize: 18),
            ),
            Text(
              'India (All States & Cities)',
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
                        hintText: 'Search city, state, area (e.g. Indore, Sohna, Delhi)...',
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

                  // Use Current GPS Location Button
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
                                  'Use Current Device Location',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF248C70),
                                  ),
                                ),
                                SizedBox(height: 2),
                                Text(
                                  'Enable GPS to detect your location automatically',
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
                ],
              ),
            ),

            // Body: Search Results OR Popular Cities & All States
            Expanded(
              child: hasSearchQuery
                  ? _buildSearchResults()
                  : _buildIndianStatesAndCitiesBrowser(),
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
          final isLocal = item['isLocal'] == true;

          return ListTile(
            contentPadding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isLocal ? const Color(0xFFE8F5E9) : const Color(0xFFF3F4F6),
                shape: BoxShape.circle,
              ),
              child: Icon(
                isLocal ? Icons.location_city_rounded : Icons.location_on_rounded,
                color: const Color(0xFF248C70),
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
            onTap: () => _handleLocationSelected(
              item['title']!,
              item['sub']!,
              lat: item['lat'],
              lng: item['lng'],
            ),
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
              'No locations found in India',
              style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF374151), fontSize: 15),
            ),
            SizedBox(height: 4),
            Text(
              'Try searching for another Indian city, area or landmark',
              style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
            ),
          ],
        ),
      );
    }

    return const Center(child: CircularProgressIndicator(color: AppColors.primary));
  }

  // ── Indian States & Cities Browser View ──────────────────────────────────
  Widget _buildIndianStatesAndCitiesBrowser() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        // 1. Popular Indian Cities Section
        const Row(
          children: [
            Icon(Icons.local_fire_department_rounded, color: Color(0xFFE89D1E), size: 18),
            SizedBox(width: 6),
            Text(
              'Popular Indian Cities',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: Color(0xFF1F2937),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: IndianLocationsData.popularCities.map((city) {
            return InkWell(
              onTap: () => _handleLocationSelected(
                city.popularArea != null ? '${city.popularArea}, ${city.name}' : city.name,
                '${city.state}, India',
                lat: city.lat,
                lng: city.lng,
              ),
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.location_on, size: 14, color: Color(0xFF248C70)),
                    const SizedBox(width: 4),
                    Text(
                      city.name,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF374151),
                      ),
                    ),
                    if (city.popularArea != null) ...[
                      const SizedBox(width: 4),
                      Text(
                        '(${city.popularArea})',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF9CA3AF),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            );
          }).toList(),
        ),

        const SizedBox(height: 24),

        // 2. All Indian States & Cities Section
        const Row(
          children: [
            Icon(Icons.map_rounded, color: Color(0xFF248C70), size: 18),
            SizedBox(width: 6),
            Text(
              'Browse by State / Region',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: Color(0xFF1F2937),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        ...IndianLocationsData.statesAndCities.entries.map((stateEntry) {
          final stateName = stateEntry.key;
          final cities = stateEntry.value;
          final isExpanded = _expandedState == stateName;

          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: isExpanded ? const Color(0xFF248C70).withValues(alpha: 0.3) : const Color(0xFFE5E7EB)),
            ),
            child: Theme(
              data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
              child: ExpansionTile(
                initiallyExpanded: isExpanded,
                onExpansionChanged: (expanded) {
                  setState(() {
                    _expandedState = expanded ? stateName : null;
                  });
                },
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF248C70).withValues(alpha: 0.08),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.location_city_rounded, color: Color(0xFF248C70), size: 18),
                ),
                title: Text(
                  stateName,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: isExpanded ? const Color(0xFF248C70) : const Color(0xFF1F2937),
                  ),
                ),
                subtitle: Text(
                  '${cities.length} major cities',
                  style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF)),
                ),
                children: [
                  Container(
                    padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
                    child: Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: cities.map((city) {
                        return InkWell(
                          onTap: () => _handleLocationSelected(
                            city.popularArea != null ? '${city.popularArea}, ${city.name}' : city.name,
                            '${city.state}, India',
                            lat: city.lat,
                            lng: city.lng,
                          ),
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF3F4F6),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFE5E7EB)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.pin_drop_rounded, size: 12, color: Color(0xFF248C70)),
                                const SizedBox(width: 4),
                                Text(
                                  city.name,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF374151),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}

import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart' as geo;
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/app_constants.dart';
import '../../core/theme/app_colors.dart';
import '../../core/models/address_model.dart';
import '../../providers/location_provider.dart';
import '../../providers/address_provider.dart';
import '../../routes/app_routes.dart';

class MapAddressPickerPage extends StatefulWidget {
  const MapAddressPickerPage({super.key});

  @override
  State<MapAddressPickerPage> createState() => _MapAddressPickerPageState();
}

class _MapAddressPickerPageState extends State<MapAddressPickerPage> {
  static const String _googleApiKey = 'AIzaSyCN7XqyxOj5lgr2uaMNrTOg6PzHTOGa0xU';

  GoogleMapController? _mapController;
  LatLng _center = const LatLng(22.7533, 75.8937);
  bool _isGpsLoading = false;
  bool _isLocatingAddress = false;
  bool _isSearching = false;
  bool _isSavingLocation = false;
  Timer? _debounceGeocodeTimer;
  Timer? _debounceSearchTimer;

  final TextEditingController _searchCtrl = TextEditingController();
  final TextEditingController _landmarkCtrl = TextEditingController();
  List<dynamic> _placePredictions = [];

  String _currentAddress = 'Detecting exact location...';
  String _subAddress = '';

  @override
  void initState() {
    super.initState();
    final locProvider = context.read<LocationProvider>();
    if (locProvider.lat != null && locProvider.lng != null) {
      _center = LatLng(locProvider.lat!, locProvider.lng!);
      _currentAddress = locProvider.location.isNotEmpty ? locProvider.location : 'Detecting exact location...';
      _subAddress = locProvider.subAddress;
    }
    _getUserLocation();
  }

  @override
  void dispose() {
    _debounceGeocodeTimer?.cancel();
    _debounceSearchTimer?.cancel();
    _searchCtrl.dispose();
    _landmarkCtrl.dispose();
    super.dispose();
  }

  // ── High-Accuracy GPS Detection & Street-Level Zoom ───────────────────────
  Future<void> _getUserLocation() async {
    if (!mounted) return;
    setState(() => _isGpsLoading = true);

    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      Position? position;
      if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
        position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.best,
          timeLimit: const Duration(seconds: 8),
        );
      } else {
        position = await Geolocator.getLastKnownPosition();
      }

      if (position != null && mounted) {
        final newCenter = LatLng(position.latitude, position.longitude);
        setState(() {
          _center = newCenter;
          _isGpsLoading = false;
        });

        _mapController?.animateCamera(
          CameraUpdate.newCameraPosition(
            CameraPosition(target: newCenter, zoom: 17.5),
          ),
        );
        await _fetchAddressForLocation(newCenter);
      } else {
        if (mounted) {
          setState(() => _isGpsLoading = false);
          _fetchAddressForLocation(_center);
        }
      }
    } catch (e) {
      debugPrint('Error getting GPS position: $e');
      if (mounted) {
        setState(() => _isGpsLoading = false);
        _fetchAddressForLocation(_center);
      }
    }
  }

  // ── Reverse Geocoding via Native Geocoder -> Direct Google Maps -> Clean Fallback
  Future<void> _fetchAddressForLocation(LatLng location) async {
    if (!mounted) return;
    setState(() => _isLocatingAddress = true);

    // 1. Native Android / iOS Geocoder (uses device Google Play Services Geocoding)
    try {
      final placemarks = await geo.placemarkFromCoordinates(
        location.latitude,
        location.longitude,
      ).timeout(const Duration(seconds: 4));

      if (placemarks.isNotEmpty) {
        final p = placemarks.first;
        final parts = <String>[];

        void addUnique(String? val) {
          if (val == null) return;
          final s = val.trim();
          if (s.isEmpty) return;
          if (s.toLowerCase().contains('tahsil') || s.toLowerCase().contains('tehsil') || s.toLowerCase().endsWith('district')) {
            return;
          }
          if (!parts.any((e) => e.toLowerCase() == s.toLowerCase())) {
            parts.add(s);
          }
        }

        if (p.name != null && p.name!.isNotEmpty && p.name != p.street && p.name != p.subLocality && p.name != p.locality) {
          addUnique(p.name);
        }
        addUnique(p.street);
        addUnique(p.subLocality);
        addUnique(p.locality);
        addUnique(p.administrativeArea);
        addUnique(p.postalCode);

        final landmark = p.subLocality?.isNotEmpty == true
            ? p.subLocality!
            : (p.street?.isNotEmpty == true ? p.street! : (p.name ?? ''));

        if (parts.isNotEmpty && mounted) {
          setState(() {
            _currentAddress = parts.join(', ');
            _subAddress = landmark;
            if (landmark.isNotEmpty && _landmarkCtrl.text.isEmpty) {
              _landmarkCtrl.text = landmark;
            }
            _isLocatingAddress = false;
          });
          return;
        }
      }
    } catch (_) {}

    // 2. Direct Official Google Maps Geocoding API
    try {
      final googleUrl = Uri.parse(
        'https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=$_googleApiKey',
      );
      final response = await http.get(googleUrl).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['status'] == 'OK' && data['results'] != null && (data['results'] as List).isNotEmpty) {
          final first = data['results'][0];
          final formatted = first['formatted_address']?.toString() ?? '';
          String detectedLandmark = '';

          if (first['address_components'] is List) {
            for (final comp in first['address_components']) {
              final types = (comp['types'] as List?)?.map((t) => t.toString()).toList() ?? [];
              if (types.contains('sublocality_level_1') ||
                  types.contains('sublocality') ||
                  types.contains('neighborhood') ||
                  types.contains('point_of_interest')) {
                detectedLandmark = comp['long_name']?.toString() ?? '';
                break;
              }
            }
          }

          if (formatted.isNotEmpty && mounted) {
            setState(() {
              _currentAddress = formatted;
              _subAddress = detectedLandmark;
              if (detectedLandmark.isNotEmpty && _landmarkCtrl.text.isEmpty) {
                _landmarkCtrl.text = detectedLandmark;
              }
              _isLocatingAddress = false;
            });
            return;
          }
        }
      }
    } catch (_) {}

    // 3. Backend Reverse Geocode Proxy
    try {
      final backendUrl = Uri.parse(
        '${AppConstants.baseUrl}/location/reverse-geocode?lat=${location.latitude}&lng=${location.longitude}',
      );
      final response = await http.get(backendUrl).timeout(const Duration(seconds: 3));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['formatted_address'] != null) {
          final formatted = data['formatted_address'].toString();
          String detectedLandmark = '';
          if (data['address_components'] is List) {
            for (final comp in data['address_components']) {
              final types = (comp['types'] as List?)?.map((t) => t.toString()).toList() ?? [];
              if (types.contains('sublocality_level_1') || types.contains('sublocality') || types.contains('neighborhood')) {
                detectedLandmark = comp['long_name']?.toString() ?? '';
                break;
              }
            }
          }

          if (mounted) {
            setState(() {
              _currentAddress = formatted;
              _subAddress = detectedLandmark;
              if (detectedLandmark.isNotEmpty && _landmarkCtrl.text.isEmpty) {
                _landmarkCtrl.text = detectedLandmark;
              }
              _isLocatingAddress = false;
            });
            return;
          }
        }
      }
    } catch (_) {}

    // 4. Clean Intelligent OpenStreetMap Fallback (Filters out Tahsil, District, duplicates)
    try {
      final nominatimUrl = Uri.parse(
        'https://nominatim.openstreetmap.org/reverse?lat=${location.latitude}&lon=${location.longitude}&format=json&addressdetails=1',
      );
      final response = await http.get(nominatimUrl, headers: {'User-Agent': 'EcdkartUserApp/1.0'}).timeout(
        const Duration(seconds: 4),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final addr = data['address'] as Map<String, dynamic>? ?? {};

        final building = addr['amenity'] ?? addr['building'] ?? addr['shop'] ?? addr['office'];
        final road = addr['road'] ?? addr['pedestrian'] ?? addr['street'];
        final neighbourhood = addr['neighbourhood'] ?? addr['suburb'] ?? addr['residential'] ?? addr['commercial'];
        final city = addr['city'] ?? addr['town'] ?? addr['village'] ?? addr['city_district'];
        final state = addr['state'];
        final postcode = addr['postcode'];

        final cleanParts = <String>[];
        void addIfClean(dynamic val) {
          if (val == null) return;
          final s = val.toString().trim();
          if (s.isEmpty) return;
          if (s.toLowerCase().contains('tahsil') || s.toLowerCase().contains('tehsil') || s.toLowerCase().endsWith('district')) {
            return;
          }
          if (!cleanParts.any((existing) => existing.toLowerCase() == s.toLowerCase())) {
            cleanParts.add(s);
          }
        }

        addIfClean(building);
        addIfClean(road);
        addIfClean(neighbourhood);
        addIfClean(city);
        addIfClean(state);
        addIfClean(postcode);

        final landmark = (neighbourhood ?? road ?? building ?? '').toString();
        final formatted = cleanParts.isNotEmpty ? cleanParts.join(', ') : (data['display_name'] ?? '');

        if (mounted) {
          setState(() {
            _currentAddress = formatted;
            _subAddress = landmark;
            if (landmark.isNotEmpty && _landmarkCtrl.text.isEmpty) {
              _landmarkCtrl.text = landmark;
            }
            _isLocatingAddress = false;
          });
          return;
        }
      }
    } catch (_) {}

    if (mounted) {
      setState(() {
        _currentAddress = 'Pin Location (${location.latitude.toStringAsFixed(5)}, ${location.longitude.toStringAsFixed(5)})';
        _isLocatingAddress = false;
      });
    }
  }

  // ── Google Places Search Autocomplete ─────────────────────────────────────
  void _onSearchChanged(String query) {
    final q = query.trim();
    if (q.isEmpty) {
      _debounceSearchTimer?.cancel();
      setState(() {
        _placePredictions = [];
        _isSearching = false;
      });
      return;
    }

    setState(() => _isSearching = true);
    _debounceSearchTimer?.cancel();
    _debounceSearchTimer = Timer(const Duration(milliseconds: 300), () async {
      // 1. Direct Google Places API
      try {
        final googleUrl = Uri.parse(
          'https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${Uri.encodeComponent(q)}&components=country:in&key=$_googleApiKey',
        );
        final response = await http.get(googleUrl).timeout(const Duration(seconds: 4));
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          if (data['status'] == 'OK' && data['predictions'] != null && (data['predictions'] as List).isNotEmpty && mounted) {
            setState(() {
              _placePredictions = data['predictions'];
              _isSearching = false;
            });
            return;
          }
        }
      } catch (_) {}

      // 2. Try Backend Places Autocomplete
      try {
        final url = Uri.parse('${AppConstants.baseUrl}/location/autocomplete?input=${Uri.encodeComponent(q)}');
        final response = await http.get(url).timeout(const Duration(seconds: 3));
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          if (data['predictions'] != null && (data['predictions'] as List).isNotEmpty && mounted) {
            setState(() {
              _placePredictions = data['predictions'];
              _isSearching = false;
            });
            return;
          }
        }
      } catch (_) {}

      // 3. Direct India Search Fallback
      try {
        final url = Uri.parse('https://nominatim.openstreetmap.org/search?q=${Uri.encodeComponent(q)}&countrycodes=in&format=json&addressdetails=1&limit=8');
        final response = await http.get(url, headers: {'User-Agent': 'EcdkartUserApp/1.0'}).timeout(const Duration(seconds: 4));
        if (response.statusCode == 200 && mounted) {
          final List<dynamic> data = jsonDecode(response.body);
          final mapped = data.map((item) {
            final addr = item['address'] ?? {};
            final main = addr['road'] ?? addr['suburb'] ?? addr['amenity'] ?? item['display_name']?.toString().split(',').first ?? '';
            final secondary = [addr['city'] ?? addr['town'], addr['state'], addr['postcode']].where((s) => s != null && s.toString().isNotEmpty).join(', ');
            return {
              'description': item['display_name'] ?? '',
              'lat': double.tryParse(item['lat']?.toString() ?? '') ?? 0.0,
              'lng': double.tryParse(item['lon']?.toString() ?? '') ?? 0.0,
              'structured_formatting': {
                'main_text': main,
                'secondary_text': secondary.isNotEmpty ? secondary : item['display_name']?.toString() ?? '',
              }
            };
          }).toList();

          setState(() {
            _placePredictions = mapped;
            _isSearching = false;
          });
          return;
        }
      } catch (_) {}

      if (mounted) setState(() => _isSearching = false);
    });
  }

  // ── Select Autocomplete Place & Fly to Coordinates ────────────────────────
  Future<void> _selectPlace(dynamic prediction) async {
    final placeId = prediction['place_id']?.toString() ?? '';
    final description = prediction['description']?.toString() ?? '';
    final directLat = (prediction['lat'] as num?)?.toDouble() ?? 0.0;
    final directLng = (prediction['lng'] as num?)?.toDouble() ?? 0.0;

    setState(() {
      _placePredictions = [];
      _searchCtrl.text = description.split(',').first;
      _currentAddress = description;
    });
    FocusScope.of(context).unfocus();

    if (directLat != 0.0 && directLng != 0.0) {
      final newLoc = LatLng(directLat, directLng);
      setState(() => _center = newLoc);
      _mapController?.animateCamera(
        CameraUpdate.newCameraPosition(
          CameraPosition(target: newLoc, zoom: 17.5),
        ),
      );
      _fetchAddressForLocation(newLoc);
      return;
    }

    if (placeId.isNotEmpty) {
      // 1. Direct Google Place Details
      try {
        final googleUrl = Uri.parse(
          'https://maps.googleapis.com/maps/api/place/details/json?place_id=$placeId&fields=geometry,formatted_address,name&key=$_googleApiKey',
        );
        final response = await http.get(googleUrl).timeout(const Duration(seconds: 4));
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          final result = data['result'];
          if (result != null && result['geometry'] != null && result['geometry']['location'] != null) {
            final lat = double.tryParse(result['geometry']['location']['lat']?.toString() ?? '') ?? 0.0;
            final lng = double.tryParse(result['geometry']['location']['lng']?.toString() ?? '') ?? 0.0;

            if (lat != 0.0 && lng != 0.0 && mounted) {
              final newLoc = LatLng(lat, lng);
              setState(() {
                _center = newLoc;
                _currentAddress = result['formatted_address'] ?? description;
              });

              _mapController?.animateCamera(
                CameraUpdate.newCameraPosition(
                  CameraPosition(target: newLoc, zoom: 17.5),
                ),
              );
              _fetchAddressForLocation(newLoc);
              return;
            }
          }
        }
      } catch (_) {}

      // 2. Backend Proxy Details
      try {
        final url = Uri.parse('${AppConstants.baseUrl}/location/place-details?place_id=$placeId');
        final response = await http.get(url).timeout(const Duration(seconds: 4));
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          final result = data['result'];
          if (result != null && result['geometry'] != null && result['geometry']['location'] != null) {
            final lat = double.tryParse(result['geometry']['location']['lat']?.toString() ?? '') ?? 0.0;
            final lng = double.tryParse(result['geometry']['location']['lng']?.toString() ?? '') ?? 0.0;

            if (lat != 0.0 && lng != 0.0 && mounted) {
              final newLoc = LatLng(lat, lng);
              setState(() {
                _center = newLoc;
                _currentAddress = result['formatted_address'] ?? description;
              });

              _mapController?.animateCamera(
                CameraUpdate.newCameraPosition(
                  CameraPosition(target: newLoc, zoom: 17.5),
                ),
              );
              _fetchAddressForLocation(newLoc);
              return;
            }
          }
        }
      } catch (_) {}
    }

    _fetchAddressForLocation(_center);
  }

  void _onCameraMove(CameraPosition position) {
    _center = position.target;
    _debounceGeocodeTimer?.cancel();
    _debounceGeocodeTimer = Timer(const Duration(milliseconds: 500), () {
      _fetchAddressForLocation(_center);
    });
  }

  // ── Confirm & Save Location Handler ──────────────────────────────────────
  void _confirmAndSaveLocation() async {
    if (_isSavingLocation) return;
    setState(() => _isSavingLocation = true);

    try {
      final locProvider = context.read<LocationProvider>();
      final validAddress = _currentAddress.isNotEmpty && !_currentAddress.startsWith('Detecting')
          ? _currentAddress
          : (_landmarkCtrl.text.trim().isNotEmpty
              ? _landmarkCtrl.text.trim()
              : 'Delivery Location (${_center.latitude.toStringAsFixed(4)}, ${_center.longitude.toStringAsFixed(4)})');

      final title = _landmarkCtrl.text.trim().isNotEmpty
          ? _landmarkCtrl.text.trim()
          : (validAddress.split(',').take(2).join(',').trim());

      // 1. Update global LocationProvider state immediately
      await locProvider.updateLocation(
        title,
        subAddress: validAddress,
        latitude: _center.latitude,
        longitude: _center.longitude,
      );

      // 2. Save into recent selected locations history
      try {
        final prefs = await SharedPreferences.getInstance();
        final raw = prefs.getString('recent_selected_locations');
        List<dynamic> list = [];
        if (raw != null && raw.isNotEmpty) {
          list = jsonDecode(raw);
        }
        final newEntry = {
          'title': title,
          'sub': validAddress,
          'lat': _center.latitude,
          'lng': _center.longitude,
        };
        final updated = [
          newEntry,
          ...list.where((e) => e['title'] != title),
        ].take(5).toList();
        await prefs.setString('recent_selected_locations', jsonEncode(updated));
      } catch (_) {}

      // 3. Save structured Address for user profile asynchronously
      try {
        final newAddr = Address(
          id: '',
          label: _landmarkCtrl.text.trim().isNotEmpty ? _landmarkCtrl.text.trim() : 'Delivery Location',
          fullAddress: validAddress,
          landmark: _landmarkCtrl.text.trim(),
          latitude: _center.latitude,
          longitude: _center.longitude,
        );
        context.read<AddressProvider>().addAddress(newAddr);
      } catch (_) {}

      // 4. Navigate back or go to home screen
      if (mounted) {
        if (Navigator.canPop(context)) {
          Navigator.pop(context, true);
        } else {
          context.go(AppRoutes.home);
        }
      }
    } catch (e) {
      debugPrint('Error saving confirmed location: $e');
      if (mounted) {
        setState(() => _isSavingLocation = false);
        context.go(AppRoutes.home);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: const Color(0xFF248C70),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () {
            if (Navigator.canPop(context)) {
              Navigator.pop(context);
            } else {
              context.go(AppRoutes.locationSetup);
            }
          },
        ),
        title: const Text(
          'Pin Delivery Location',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w800,
            fontSize: 18,
          ),
        ),
      ),
      body: Stack(
        children: [
          // 1. Fullscreen Google Map
          GoogleMap(
            initialCameraPosition: CameraPosition(
              target: _center,
              zoom: 17.5,
            ),
            onMapCreated: (ctrl) {
              _mapController = ctrl;
              ctrl.animateCamera(
                CameraUpdate.newCameraPosition(
                  CameraPosition(target: _center, zoom: 17.5),
                ),
              );
              _getUserLocation();
            },
            onCameraMove: _onCameraMove,
            onCameraIdle: () {
              _fetchAddressForLocation(_center);
            },
            myLocationEnabled: true,
            myLocationButtonEnabled: false,
            zoomControlsEnabled: false,
            mapToolbarEnabled: false,
            compassEnabled: true,
          ),

          // 2. Floating Google Places Search Bar (Top over map)
          Positioned(
            top: 14,
            left: 16,
            right: 16,
            child: Column(
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.15),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: TextField(
                    controller: _searchCtrl,
                    onChanged: _onSearchChanged,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                    decoration: InputDecoration(
                      hintText: 'Search society, street, landmark, area...',
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
                          : (_searchCtrl.text.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.clear_rounded, color: Color(0xFF9CA3AF), size: 18),
                                  onPressed: () {
                                    _searchCtrl.clear();
                                    setState(() => _placePredictions = []);
                                  },
                                )
                              : null),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                  ),
                ),

                // Search Autocomplete Predictions Dropdown
                if (_placePredictions.isNotEmpty)
                  Container(
                    margin: const EdgeInsets.only(top: 6),
                    constraints: const BoxConstraints(maxHeight: 220),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.18),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ListView.separated(
                      shrinkWrap: true,
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      itemCount: _placePredictions.length,
                      separatorBuilder: (_, __) => const Divider(height: 1, color: Color(0xFFF3F4F6)),
                      itemBuilder: (ctx, i) {
                        final p = _placePredictions[i];
                        final desc = p['description']?.toString() ?? '';
                        final structured = p['structured_formatting'] ?? {};
                        final mainText = structured['main_text']?.toString() ?? desc.split(',').first;
                        final secondaryText = structured['secondary_text']?.toString() ?? desc;

                        return ListTile(
                          dense: true,
                          leading: const Icon(Icons.location_on_outlined, color: Color(0xFF248C70), size: 20),
                          title: Text(
                            mainText,
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                          ),
                          subtitle: Text(
                            secondaryText,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
                          ),
                          onTap: () => _selectPlace(p),
                        );
                      },
                    ),
                  ),
              ],
            ),
          ),

          // 3. Center Pin with "Delivery Point" Badge (matching reference screenshot)
          Center(
            child: Transform.translate(
              offset: const Offset(0, -26),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.25),
                          blurRadius: 6,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (_isLocatingAddress) ...[
                          const SizedBox(
                            width: 10,
                            height: 10,
                            child: CircularProgressIndicator(
                              strokeWidth: 1.5,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          ),
                          const SizedBox(width: 6),
                        ],
                        const Text(
                          'Delivery Point',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.2,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 2),

                  const Icon(
                    Icons.location_on_rounded,
                    size: 44,
                    color: Color(0xFF248C70),
                  ),
                ],
              ),
            ),
          ),

          // 4. Floating GPS Target Button (Bottom Right)
          Positioned(
            right: 18,
            bottom: 270,
            child: Material(
              color: Colors.transparent,
              elevation: 4,
              shape: const CircleBorder(),
              child: InkWell(
                onTap: _isGpsLoading ? null : _getUserLocation,
                customBorder: const CircleBorder(),
                child: Container(
                  width: 48,
                  height: 48,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: _isGpsLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF248C70)),
                            ),
                          )
                        : const Icon(
                            Icons.my_location_rounded,
                            color: Color(0xFF248C70),
                            size: 24,
                          ),
                  ),
                ),
              ),
            ),
          ),

          // 5. Bottom Delivery Location Card (Matching Reference Screenshot)
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 16,
                    offset: Offset(0, -4),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title Row: Pin Icon + "Delivery Location"
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF248C70).withValues(alpha: 0.12),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.location_on_rounded,
                          color: Color(0xFF248C70),
                          size: 18,
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Text(
                        'Delivery Location',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Formatted Address Display Box
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF9FAFB),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                    ),
                    child: _isLocatingAddress
                        ? const Row(
                            children: [
                              SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF248C70)),
                                ),
                              ),
                              SizedBox(width: 10),
                              Text(
                                'Detecting exact address from Google Maps...',
                                style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
                              ),
                            ],
                          )
                        : Text(
                            _currentAddress,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF1F2937),
                              height: 1.35,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                  ),
                  const SizedBox(height: 12),

                  // Landmark / House Area Input Box
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                    ),
                    child: TextField(
                      controller: _landmarkCtrl,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                      decoration: const InputDecoration(
                        hintText: 'Landmark / Flat / Area',
                        hintStyle: TextStyle(color: Color(0xFF9CA3AF), fontSize: 13),
                        prefixIcon: Icon(Icons.outlined_flag_rounded, color: Color(0xFF9CA3AF), size: 18),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Confirm & Save Location Black Button
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isSavingLocation ? null : _confirmAndSaveLocation,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                        disabledBackgroundColor: Colors.black87,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isSavingLocation
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const Text(
                              'Confirm & Save Location',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.2,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

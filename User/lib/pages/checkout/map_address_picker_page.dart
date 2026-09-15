import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import '../../core/theme/app_colors.dart';
import '../../core/models/address_model.dart';
import 'package:provider/provider.dart';
import '../../providers/address_provider.dart';

class MapAddressPickerPage extends StatefulWidget {
  const MapAddressPickerPage({super.key});

  @override
  State<MapAddressPickerPage> createState() => _MapAddressPickerPageState();
}

class _MapAddressPickerPageState extends State<MapAddressPickerPage> {
  static const String _placesApiKey = 'AIzaSyCN7XqyxOj5lgr2uaMNrTOg6PzHTOGa0xU';

  GoogleMapController? _mapController;
  LatLng _center = const LatLng(23.2599, 77.4126); // Default location (Bhopal)
  bool _isLoading = true;
  bool _isSearching = false;

  final TextEditingController _searchCtrl = TextEditingController();
  final TextEditingController _landmarkCtrl = TextEditingController();

  List<dynamic> _searchResults = [];
  String _currentAddress = 'Fetching address...';

  @override
  void initState() {
    super.initState();
    _getUserLocation();
  }

  Future<void> _getUserLocation() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() => _isLoading = false);
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() => _isLoading = false);
        return;
      }

      Position position = await Geolocator.getCurrentPosition();
      setState(() {
        _center = LatLng(position.latitude, position.longitude);
        _isLoading = false;
      });
      _mapController?.animateCamera(CameraUpdate.newLatLngZoom(_center, 15));
      _fetchAddressForLocation(_center);
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchAddressForLocation(LatLng location) async {
    final baseUrl =
        'https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=$_placesApiKey';
    final url = kIsWeb ? 'https://corsproxy.io/?${Uri.encodeComponent(baseUrl)}' : baseUrl;
    try {
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['results'] != null && data['results'].isNotEmpty) {
          setState(() {
            _currentAddress = data['results'][0]['formatted_address'];
            if (_landmarkCtrl.text.isEmpty) {
              _landmarkCtrl.text = _currentAddress.split(',')[0].trim();
            }
          });
        }
      }
    } catch (e) {
      // Ignored
    }
  }

  Future<void> _searchPlaces(String input) async {
    if (input.isEmpty) {
      setState(() => _searchResults = []);
      return;
    }
    setState(() => _isSearching = true);
    final baseUrl =
        'https://maps.googleapis.com/maps/api/place/autocomplete/json?input=$input&key=$_placesApiKey';
    final url = kIsWeb ? 'https://corsproxy.io/?${Uri.encodeComponent(baseUrl)}' : baseUrl;
    try {
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['status'] == 'OK') {
          setState(() {
            _searchResults = data['predictions'];
          });
        }
      }
    } catch (e) {
      // Ignored
    }
    setState(() => _isSearching = false);
  }

  Future<void> _selectPlace(String placeId, String description) async {
    setState(() {
      _searchResults = [];
      _searchCtrl.text = description;
      _currentAddress = description;
      _landmarkCtrl.text = description.split(',')[0].trim();
    });
    FocusScope.of(context).unfocus();

    final baseUrl =
        'https://maps.googleapis.com/maps/api/place/details/json?place_id=$placeId&key=$_placesApiKey';
    final url = kIsWeb ? 'https://corsproxy.io/?${Uri.encodeComponent(baseUrl)}' : baseUrl;
    try {
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['status'] == 'OK') {
          final loc = data['result']['geometry']['location'];
          final latLng = LatLng(loc['lat'], loc['lng']);
          setState(() {
            _center = latLng;
          });
          _mapController?.animateCamera(CameraUpdate.newLatLngZoom(latLng, 15));
        }
      }
    } catch (e) {
      // Ignored
    }
  }

  void _onCameraIdle() {
    _fetchAddressForLocation(_center);
  }

  void _saveAddress() async {
    if (_currentAddress.isEmpty || _currentAddress == 'Fetching address...') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a valid location.')),
      );
      return;
    }

    final address = Address(
      id: '', // Will be assigned by backend
      label: 'Other',
      fullAddress: _currentAddress,
      landmark: _landmarkCtrl.text.trim(),
      latitude: _center.latitude,
      longitude: _center.longitude,
    );

    try {
      final success = await context.read<AddressProvider>().addAddress(address);
      if (success && mounted) {
        Navigator.pop(context, true);
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to save address')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pin Delivery Location'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: Stack(
        children: [
          _isLoading
              ? const Center(child: CircularProgressIndicator())
              : GoogleMap(
                  initialCameraPosition: CameraPosition(target: _center, zoom: 15),
                  onMapCreated: (ctrl) => _mapController = ctrl,
                  onCameraMove: (pos) => setState(() => _center = pos.target),
                  onCameraIdle: _onCameraIdle,
                  myLocationEnabled: true,
                  myLocationButtonEnabled: false,
                  zoomControlsEnabled: false,
                ),
          
          // Map Center Pin Icon
          if (!_isLoading)
            Center(
              child: Transform.translate(
                offset: const Offset(0, -20),
                child: const Icon(Icons.location_on, size: 40, color: AppColors.primary),
              ),
            ),
          
          // Search Bar
          Positioned(
            top: 16, left: 16, right: 16,
            child: Column(
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: const [
                      BoxShadow(color: Colors.black12, blurRadius: 10)
                    ]
                  ),
                  child: TextField(
                    controller: _searchCtrl,
                    decoration: InputDecoration(
                      hintText: 'Search location...',
                      prefixIcon: const Icon(Icons.search, color: AppColors.primary),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      suffixIcon: _searchCtrl.text.isNotEmpty 
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 20),
                            onPressed: () {
                              _searchCtrl.clear();
                              setState(() => _searchResults = []);
                            },
                          ) 
                        : null,
                    ),
                    onChanged: _searchPlaces,
                  ),
                ),
                if (_searchResults.isNotEmpty)
                  Container(
                    margin: const EdgeInsets.only(top: 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: const [
                        BoxShadow(color: Colors.black12, blurRadius: 10)
                      ]
                    ),
                    constraints: const BoxConstraints(maxHeight: 200),
                    child: ListView.builder(
                      shrinkWrap: true,
                      itemCount: _searchResults.length,
                      itemBuilder: (ctx, i) {
                        final result = _searchResults[i];
                        return ListTile(
                          leading: const Icon(Icons.location_on_outlined, color: Colors.grey),
                          title: Text(result['description'] ?? '', style: const TextStyle(fontSize: 14)),
                          onTap: () => _selectPlace(result['place_id'], result['description']),
                        );
                      },
                    ),
                  )
              ],
            ),
          ),
          
          // My Location Button
          Positioned(
            bottom: 300, right: 16,
            child: FloatingActionButton(
              backgroundColor: Colors.white,
              mini: true,
              child: const Icon(Icons.my_location, color: AppColors.primary),
              onPressed: _getUserLocation,
            ),
          ),

          // Bottom Sheet for Address Details
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 10)],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Delivery Location', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.location_on, color: AppColors.primary, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _currentAddress,
                          style: const TextStyle(fontSize: 14, color: Colors.black87),
                          maxLines: 2, overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _landmarkCtrl,
                    decoration: InputDecoration(
                      hintText: 'Landmark',
                      isDense: true,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _saveAddress,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Confirm & Save Location'),
                    ),
                  )
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}

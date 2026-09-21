import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_polyline_points/flutter_polyline_points.dart';
import '../../../logic/blocs/driver/driver_bloc.dart';
import '../../../logic/blocs/driver/driver_event.dart';
import '../../../logic/blocs/driver/driver_state.dart';
import '../../../data/services/api_service.dart';

class OrderTrackingScreen extends StatefulWidget {
  final Map<String, dynamic> order;
  final bool isToRestaurant;

  const OrderTrackingScreen({
    super.key,
    required this.order,
    this.isToRestaurant = false,
  });

  @override
  State<OrderTrackingScreen> createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen> {
  static const Color primaryGreen = Color(0xFF248C70);
  static const Color lightGreen = Color(0xFFE8F5E9);

  GoogleMapController? _mapController;
  LatLng? _driverLatLng;
  StreamSubscription<Position>? _positionSubscription;
  bool _isLoading = false;
  final TextEditingController _otpController = TextEditingController();
  bool _isSendingOtp = false;

  final Set<Polyline> _polylines = {};
  static const String googleApiKey = 'AIzaSyCN7XqyxOj5lgr2uaMNrTOg6PzHTOGa0xU';
  PolylinePoints polylinePoints = PolylinePoints(apiKey: googleApiKey);

  @override
  void initState() {
    super.initState();
    _determineInitialPosition();
    _startLocationSubscription();
  }

  @override
  void dispose() {
    _otpController.dispose();
    _positionSubscription?.cancel();
    _mapController?.dispose();
    super.dispose();
  }

  String _parseAddressToString(dynamic raw) {
    if (raw == null) return '';
    if (raw is String) return raw.trim();
    if (raw is List) {
      if (raw.isEmpty) return '';
      return _parseAddressToString(raw.first);
    }
    if (raw is Map) {
      final line = raw['fullAddress'] ?? raw['address'] ?? raw['addressLine'] ?? raw['street'] ?? '';
      final city = raw['city'] ?? raw['cityName'] ?? '';
      final lineStr = _parseAddressToString(line);
      final cityStr = _parseAddressToString(city);
      if (lineStr.isNotEmpty) {
        if (cityStr.isNotEmpty && !lineStr.toLowerCase().contains(cityStr.toLowerCase())) {
          return "$lineStr, $cityStr";
        }
        return lineStr;
      }
      if (cityStr.isNotEmpty) return cityStr;
    }
    return raw.toString();
  }

  Future<void> _determineInitialPosition() async {
    try {
      final hasPermission = await Geolocator.checkPermission();
      if (hasPermission == LocationPermission.whileInUse ||
          hasPermission == LocationPermission.always) {
        final position = await Geolocator.getCurrentPosition();
        if (mounted) {
          setState(() {
            _driverLatLng = LatLng(position.latitude, position.longitude);
          });
          // Center map on driver
          _mapController?.animateCamera(CameraUpdate.newLatLngZoom(_driverLatLng!, 15.0));
          _getPolyline();
        }
      }
    } catch (_) {}
  }

  void _startLocationSubscription() {
    _positionSubscription = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      ),
    ).listen((position) {
      if (mounted) {
        setState(() {
          _driverLatLng = LatLng(position.latitude, position.longitude);
        });
      }
    });
  }

  Future<void> _getPolyline() async {
    if (_driverLatLng == null) return;
    
    final targetLatLng = widget.isToRestaurant ? _getRestaurantLatLng() : _getCustomerLatLng();
    
    // ignore: deprecated_member_use
    PolylineResult result = await polylinePoints.getRouteBetweenCoordinates(
      // ignore: deprecated_member_use
      request: PolylineRequest(
        origin: PointLatLng(_driverLatLng!.latitude, _driverLatLng!.longitude),
        destination: PointLatLng(targetLatLng.latitude, targetLatLng.longitude),
        mode: TravelMode.driving,
      ),
    );

    if (result.points.isNotEmpty) {
      List<LatLng> polylineCoordinates = [];
      for (var point in result.points) {
        polylineCoordinates.add(LatLng(point.latitude, point.longitude));
      }

      if (mounted) {
        setState(() {
          _polylines.add(
            Polyline(
              polylineId: const PolylineId('route'),
              color: Colors.blue,
              points: polylineCoordinates,
              width: 5,
            ),
          );
        });
      }
    }
  }

  LatLng _getRestaurantLatLng() {
    try {
      final store = widget.order['store'];
      if (store != null && store['location'] != null && store['location']['coordinates'] != null) {
        final coords = store['location']['coordinates'] as List;
        return LatLng(coords[1].toDouble(), coords[0].toDouble());
      }
    } catch (_) {}
    return const LatLng(28.4951, 77.0878); // Gurgaon Cyber Hub
  }

  LatLng _getCustomerLatLng() {
    try {
      final address = widget.order['address'];
      if (address != null && address['location'] != null && address['location']['coordinates'] != null) {
        final coords = address['location']['coordinates'] as List;
        return LatLng(coords[1].toDouble(), coords[0].toDouble());
      }
    } catch (_) {}
    return const LatLng(28.4751, 77.0898); // Sector 45 Gurgaon
  }

  String _getLiveDistance() {
    if (_driverLatLng != null) {
      final targetLatLng = widget.isToRestaurant ? _getRestaurantLatLng() : _getCustomerLatLng();
      
      try {
        final distanceInMeters = Geolocator.distanceBetween(
          _driverLatLng!.latitude,
          _driverLatLng!.longitude,
          targetLatLng.latitude,
          targetLatLng.longitude,
        );
        
        final distanceInKm = distanceInMeters / 1000;
        return distanceInKm.toStringAsFixed(1);
      } catch (_) {}
    }
    
    // Fallback to API provided distance if live tracking isn't available yet
    try {
      if (widget.isToRestaurant) {
        final rDist = widget.order['restaurant']?['distance_km'] ?? widget.order['store']?['distance_km'];
        if (rDist != null) return rDist.toString();
      } else {
        final cDist = widget.order['customer']?['distance_km'];
        if (cDist != null) return cDist.toString();
      }
      
      final oDist = widget.order['distanceKm'] ?? widget.order['distance_km'];
      if (oDist != null) return oDist.toString();
    } catch (_) {}
    
    return '--';
  }

  Future<void> _openExternalMap() async {
    final dest = widget.isToRestaurant ? _getRestaurantLatLng() : _getCustomerLatLng();
    final url = 'https://www.google.com/maps/dir/?api=1&destination=${dest.latitude},${dest.longitude}&travelmode=driving';
    final uri = Uri.parse(url);
    if (await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      // Opened
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not launch maps application')),
        );
      }
    }
  }

  Future<void> _sendPickupOtp() async {
    setState(() => _isSendingOtp = true);
    try {
      final orderId = widget.order['_id'] ?? widget.order['orderId'] ?? '';
      final response = await ApiService.sendPickupOtp(orderId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(response['message'] ?? 'Pickup OTP sent (Mock OTP: 1234)'),
          backgroundColor: Colors.orange[800],
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString()),
          backgroundColor: Colors.red[700],
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _isSendingOtp = false);
    }
  }

  Future<void> _sendDeliveryOtp() async {
    setState(() => _isSendingOtp = true);
    try {
      final orderId = widget.order['_id'] ?? widget.order['orderId'] ?? '';
      final response = await ApiService.sendDeliveryOtp(orderId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(response['message'] ?? 'OTP sent to customer successfully (Mock OTP: 5678)'),
          backgroundColor: primaryGreen,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString()),
          backgroundColor: Colors.red[700],
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _isSendingOtp = false);
    }
  }

  void _verifyAndCompleteStep([String? code]) {
    final otpCode = (code ?? _otpController.text).trim();
    if (otpCode.length != 4) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a valid 4-digit OTP code'),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final orderId = widget.order['_id'] ?? widget.order['orderId'] ?? '';
    final targetStatus = widget.isToRestaurant ? 'picked_up' : 'delivered';
    setState(() => _isLoading = true);
    context.read<DriverBloc>().add(
          UpdateOrderStatus(
            orderId: orderId,
            status: targetStatus,
            otp: otpCode,
          ),
        );
  }

  void _showOtpBottomSheet(BuildContext context) {
    final dialogController = TextEditingController(text: _otpController.text);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        bool isDialogSending = false;
        return StatefulBuilder(
          builder: (modalContext, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 24,
                right: 24,
                top: 20,
                bottom: MediaQuery.of(modalContext).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Customer Delivery OTP',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.grey[900],
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Enter the 4-digit code provided by customer',
                            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                          ),
                        ],
                      ),
                      TextButton.icon(
                        onPressed: isDialogSending
                            ? null
                            : () async {
                                setModalState(() => isDialogSending = true);
                                try {
                                  final orderId = widget.order['_id'] ?? widget.order['orderId'] ?? '';
                                  final response = await ApiService.sendDeliveryOtp(orderId);
                                  if (ctx.mounted) {
                                    ScaffoldMessenger.of(ctx).showSnackBar(
                                      SnackBar(
                                        content: Text(response['message'] ?? 'OTP sent successfully (Mock: 5678)'),
                                        backgroundColor: primaryGreen,
                                        behavior: SnackBarBehavior.floating,
                                      ),
                                    );
                                  }
                                } catch (e) {
                                  if (ctx.mounted) {
                                    ScaffoldMessenger.of(ctx).showSnackBar(
                                      SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
                                    );
                                  }
                                } finally {
                                  if (ctx.mounted) setModalState(() => isDialogSending = false);
                                }
                              },
                        icon: isDialogSending
                            ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                            : const Icon(Icons.send_rounded, size: 14),
                        label: const Text('Send OTP', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        style: TextButton.styleFrom(
                          foregroundColor: primaryGreen,
                          backgroundColor: primaryGreen.withValues(alpha: 0.1),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  TextField(
                    controller: dialogController,
                    autofocus: true,
                    keyboardType: TextInputType.number,
                    maxLength: 4,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 10,
                      color: primaryGreen,
                    ),
                    decoration: InputDecoration(
                      hintText: '• • • •',
                      hintStyle: TextStyle(color: Colors.grey[300], letterSpacing: 10),
                      counterText: '',
                      filled: true,
                      fillColor: Colors.grey[50],
                      contentPadding: const EdgeInsets.symmetric(vertical: 14),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide(color: Colors.grey[300]!),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: primaryGreen, width: 2),
                      ),
                    ),
                    onChanged: (val) {
                      _otpController.text = val;
                    },
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () {
                        final code = dialogController.text.trim();
                        Navigator.pop(ctx);
                        _verifyAndCompleteStep(code);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryGreen,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: const Text(
                        'Verify & Complete Delivery',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _handleStatusTransition(BuildContext context, String currentStatus) {
    final orderId = widget.order['_id'] ?? '';
    if (widget.isToRestaurant) {
      if (currentStatus == 'accepted' || currentStatus == 'assigned') {
        setState(() => _isLoading = true);
        context.read<DriverBloc>().add(
              UpdateOrderStatus(orderId: orderId, status: 'reached_store'),
            );
      } else if (currentStatus == 'reached_store') {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please show your OTP to the restaurant so they can verify the pickup.')),
        );
      }
    } else {
      if (currentStatus == 'picked_up') {
        setState(() => _isLoading = true);
        context.read<DriverBloc>().add(
              UpdateOrderStatus(orderId: orderId, status: 'out_for_delivery'),
            );
      } else if (currentStatus == 'out_for_delivery' || currentStatus == 'delivered') {
        if (_otpController.text.trim().length == 4) {
          _verifyAndCompleteStep();
        } else {
          _showOtpBottomSheet(context);
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final customer = widget.order['customer'] ?? {};
    final address = widget.order['address'] ?? widget.order['deliveryAddress'] ?? {};
    final restaurant = widget.order['restaurant'] ?? {'name': 'FreshNow Store', 'address': 'Cyber Hub, Gurgaon'};

    final currentStatus = widget.order['deliveryStatus'] ?? 'accepted';
    final targetLatLng = widget.isToRestaurant ? _getRestaurantLatLng() : _getCustomerLatLng();

    // Setup map markers
    final markers = <Marker>{
      Marker(
        markerId: const MarkerId('target'),
        position: targetLatLng,
        icon: BitmapDescriptor.defaultMarkerWithHue(
          widget.isToRestaurant ? BitmapDescriptor.hueOrange : BitmapDescriptor.hueGreen,
        ),
      ),
    };

    if (_driverLatLng != null) {
      markers.add(
        Marker(
          markerId: const MarkerId('driver'),
          position: _driverLatLng!,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
        ),
      );
    }

    // Dynamic Action Button details
    String actionBtnText = '';
    Color actionBtnColor = primaryGreen;
    bool showActionButton = true;

    if (widget.isToRestaurant) {
      if (currentStatus == 'accepted' || currentStatus == 'assigned') {
        actionBtnText = 'I have Reached the Store';
        actionBtnColor = Colors.orange[700]!;
      } else if (currentStatus == 'reached_store') {
        actionBtnText = 'Waiting for Restaurant';
        actionBtnColor = Colors.orange[300]!;
      } else {
        showActionButton = false;
      }
    } else {
      if (currentStatus == 'picked_up') {
        actionBtnText = 'Mark as Out for Delivery';
        actionBtnColor = primaryGreen;
      } else if (currentStatus == 'out_for_delivery') {
        actionBtnText = 'Complete Delivery';
        actionBtnColor = primaryGreen;
      } else {
        showActionButton = false;
      }
    }

    return BlocListener<DriverBloc, DriverState>(
      listener: (context, state) {
        if (state is OrderStatusUpdated) {
          setState(() => _isLoading = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: primaryGreen,
              behavior: SnackBarBehavior.floating,
            ),
          );
          if (state.status == 'picked_up' || state.status == 'delivered') {
            Navigator.pop(context);
          }
        } else if (state is DriverError) {
          setState(() => _isLoading = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: Colors.red[700],
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(widget.isToRestaurant ? 'Track Pick-up' : 'Track Delivery'),
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          elevation: 0.5,
        ),
        body: Stack(
          children: [
            Column(
              children: [
                // Live GoogleMap Area
                Expanded(
                  flex: 3,
                  child: Stack(
                    children: [
                      GoogleMap(
                        initialCameraPosition: CameraPosition(
                          target: targetLatLng,
                          zoom: 14.5,
                        ),
                        onMapCreated: (controller) => _mapController = controller,
                        markers: markers,
                        polylines: _polylines,
                      ),
                      Positioned(
                        bottom: 16,
                        left: 0,
                        right: 0,
                        child: Center(
                          child: FloatingActionButton.extended(
                            onPressed: _openExternalMap,
                            backgroundColor: Colors.blue[600],
                            icon: const Icon(Icons.navigation, color: Colors.white),
                            label: const Text('Navigate', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                            elevation: 4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Bottom Sheet/Card Section
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(24),
                      topRight: Radius.circular(24),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black12,
                        blurRadius: 10,
                        offset: Offset(0, -3),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Estimated Arrival',
                                style: TextStyle(color: Colors.grey, fontSize: 13),
                              ),
                              Text(
                                widget.isToRestaurant ? 'Est. Arrival' : 'Est. Arrival',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: widget.isToRestaurant ? Colors.orange[700] : primaryGreen,
                                ),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                            decoration: BoxDecoration(
                              color: (widget.isToRestaurant ? Colors.orange[700] : primaryGreen)!.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Text(
                              '${_getLiveDistance()} KM',
                              style: TextStyle(
                                color: widget.isToRestaurant ? Colors.orange[700] : primaryGreen,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const Divider(height: 1),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 20,
                            backgroundColor: (widget.isToRestaurant ? Colors.orange[50] : lightGreen),
                            child: Icon(
                              widget.isToRestaurant ? Icons.storefront : Icons.person,
                              color: widget.isToRestaurant ? Colors.orange[700] : primaryGreen,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  widget.isToRestaurant ? restaurant['name'] ?? 'Restaurant' : customer['name'] ?? 'Customer',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                  Text(
                                    widget.isToRestaurant
                                        ? (_parseAddressToString(restaurant['address']).isNotEmpty ? _parseAddressToString(restaurant['address']) : 'Store Location')
                                        : (_parseAddressToString(address).isNotEmpty ? _parseAddressToString(address) : (_parseAddressToString(customer['address']).isNotEmpty ? _parseAddressToString(customer['address']) : 'Customer Location')),
                                    style: TextStyle(color: Colors.grey[600], fontSize: 13),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  widget.isToRestaurant ? (restaurant['phone'] ?? 'No Number') : (widget.order['deliveryPhone'] ?? customer['phone'] ?? 'No Number'),
                                  style: const TextStyle(color: Colors.blueGrey, fontSize: 13, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            onPressed: () async {
                              final phone = widget.isToRestaurant ? restaurant['phone'] : (widget.order['deliveryPhone'] ?? customer['phone']);
                              if (phone != null && phone.isNotEmpty) {
                                final uri = Uri.parse('tel:$phone');
                                if (await launchUrl(uri)) {}
                              }
                            },
                            icon: const Icon(Icons.phone),
                            color: widget.isToRestaurant ? Colors.orange[700] : primaryGreen,
                            style: IconButton.styleFrom(
                              backgroundColor: (widget.isToRestaurant ? Colors.orange[700] : primaryGreen)!.withValues(alpha: 0.1),
                              padding: const EdgeInsets.all(8),
                            ),
                          ),
                        ],
                      ),

                        const SizedBox(height: 20),
                        if (currentStatus == 'reached_store' && widget.isToRestaurant)
                          Container(
                            padding: const EdgeInsets.all(16),
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              color: Colors.orange[50],
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.orange[300]!),
                            ),
                            child: Column(
                              children: [
                                const Text(
                                  'SHOW THIS OTP TO RESTAURANT',
                                  style: TextStyle(fontWeight: FontWeight.bold, color: Colors.orange),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  widget.order['pickupOtp'] ?? 'N/A',
                                  style: const TextStyle(
                                    fontSize: 32,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 8,
                                    color: Colors.black87,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        _buildInlineDeliveryOtpSection(),
                        if (showActionButton) ...[
                          Row(
                          children: [
                            Expanded(
                              child: SizedBox(
                                height: 48,
                                child: ElevatedButton(
                                  onPressed: () => _handleStatusTransition(context, currentStatus),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: actionBtnColor,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    elevation: 0,
                                  ),
                                  child: Text(
                                    actionBtnText,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        ]
                      ],
                  ),
                ),
              ],
            ),
            if (_isLoading)
              Container(
                color: Colors.black26,
                child: const Center(
                  child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(primaryGreen)),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInlineDeliveryOtpSection() {
    final bool isPickup = widget.isToRestaurant;
    final Color themeColor = isPickup ? Colors.orange[800]! : primaryGreen;
    final Color bgColor = isPickup ? const Color(0xFFFFF8F0) : const Color(0xFFF2F9F6);
    final String titleText = isPickup ? 'Store Pickup OTP' : 'Customer Delivery OTP';
    final String buttonText = isPickup ? 'Verify & Pick Up' : 'Verify & Deliver';

    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: themeColor.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.security, size: 18, color: themeColor),
                  const SizedBox(width: 8),
                  Text(
                    titleText,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: themeColor,
                    ),
                  ),
                ],
              ),
              InkWell(
                onTap: _isSendingOtp ? null : (isPickup ? _sendPickupOtp : _sendDeliveryOtp),
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: themeColor.withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (_isSendingOtp)
                        SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: themeColor))
                      else
                        Icon(Icons.send_rounded, size: 12, color: themeColor),
                      const SizedBox(width: 4),
                      Text(
                        'Send OTP',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: themeColor),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                flex: 3,
                child: SizedBox(
                  height: 46,
                  child: TextField(
                    controller: _otpController,
                    keyboardType: TextInputType.number,
                    maxLength: 4,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 6,
                      color: themeColor,
                    ),
                    decoration: InputDecoration(
                      hintText: '4-Digit OTP',
                      hintStyle: TextStyle(color: Colors.grey[400], letterSpacing: 0, fontSize: 13),
                      counterText: '',
                      filled: true,
                      fillColor: Colors.white,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(color: Colors.grey[300]!),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(color: themeColor, width: 2),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                flex: 2,
                child: SizedBox(
                  height: 46,
                  child: ElevatedButton(
                    onPressed: () => _verifyAndCompleteStep(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: themeColor,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: EdgeInsets.zero,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: Text(
                      buttonText,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

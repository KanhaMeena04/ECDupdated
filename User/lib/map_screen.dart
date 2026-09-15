import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  GoogleMapController? mapController;

  Timer? movementTimer;
  int etaMinutes = 10;
  int currentStatusIndex = 2;
  String? selectedCancelReason;

  final List<String> orderStatuses = [
    "Order Confirmed",
    "Preparing Food",
    "Out for Delivery",
    "Delivered",
  ];

  // Simulated driver route
  final List<LatLng> routePoints = [
    LatLng(23.2599, 77.4126),
    LatLng(23.2605, 77.4135),
    LatLng(23.2612, 77.4145),
    LatLng(23.2620, 77.4155),
    LatLng(23.2630, 77.4165),
    LatLng(23.2640, 77.4175),
  ];

  int currentRouteIndex = 0;
  LatLng driverPosition = LatLng(23.2599, 77.4126);
  LatLng userPosition = LatLng(23.2640, 77.4175); // destination

  @override
  void initState() {
    super.initState();
    _initLocation();
    startDriverMovement();
  }

  Future<void> _initLocation() async {
    try {
      final position = await _getCurrentLocation();
      setState(() {
        userPosition = LatLng(position.latitude, position.longitude);
      });
      mapController?.animateCamera(CameraUpdate.newLatLngZoom(userPosition, 14));
    } catch (_) {
      // Keep default
    }
  }

  Future<Position> _getCurrentLocation() async {
    LocationPermission perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) {
      perm = await Geolocator.requestPermission();
    }
    if (perm == LocationPermission.deniedForever) {
      throw Exception('Location permission denied forever');
    }
    return Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );
  }

  void startDriverMovement() {
    movementTimer = Timer.periodic(const Duration(seconds: 2), (timer) {
      if (etaMinutes > 0) {
        setState(() {
          etaMinutes--;
          if (etaMinutes <= 5) currentStatusIndex = 3;
          if (currentRouteIndex < routePoints.length - 1) {
            currentRouteIndex++;
            driverPosition = routePoints[currentRouteIndex];
            mapController?.animateCamera(CameraUpdate.newLatLngZoom(driverPosition, 15));
          }
        });
      } else {
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    movementTimer?.cancel();
    super.dispose();
  }

  void _showCancelBottomSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setModalState) {
            return SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      "Cancel Order",
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      "Please let us know why you are cancelling.",
                      style: TextStyle(color: Colors.grey),
                    ),
                    const SizedBox(height: 16),
                    ...["Changed my mind", "Ordered by mistake", "Taking too long"]
                        .map((reason) => RadioListTile<String>(
                              title: Text(reason),
                              value: reason,
                              groupValue: selectedCancelReason,
                              activeColor: Colors.red,
                              contentPadding: EdgeInsets.zero,
                              onChanged: (value) =>
                                  setModalState(() => selectedCancelReason = value),
                            ))
                        .toList(),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: selectedCancelReason == null
                            ? null
                            : () {
                                context.pop();
                                context.go('/orders');
                              },
                        child: const Text(
                          "Submit & Cancel",
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    double progress = ((10 - etaMinutes) / 10.0).clamp(0.0, 1.0);

    return Scaffold(
      appBar: AppBar(
        title: const Text("Live Driver Tracking"),
        actions: [
          TextButton(
            onPressed: _showCancelBottomSheet,
            child: const Text(
              "Cancel",
              style: TextStyle(
                  color: Colors.red, fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          // ── TOP HALF: GoogleMap ──
          Expanded(
            child: GoogleMap(
              initialCameraPosition: CameraPosition(
                target: driverPosition,
                zoom: 15,
              ),
              onMapCreated: (controller) => mapController = controller,
              polylines: {
                Polyline(
                  polylineId: const PolylineId('route'),
                  points: routePoints,
                  color: Colors.red,
                  width: 5,
                ),
              },
              markers: {
                Marker(
                  markerId: const MarkerId('driver'),
                  position: driverPosition,
                  icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
                ),
                Marker(
                  markerId: const MarkerId('user'),
                  position: userPosition,
                  icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
                ),
              },
            ),
          ),

          // ── BOTTOM: Order Details Card ──
          Container(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(24),
                topRight: Radius.circular(24),
              ),
              boxShadow: [
                BoxShadow(
                    color: Colors.black12, blurRadius: 10, offset: Offset(0, -4)),
              ],
            ),
            child: SafeArea(
              top: false,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        orderStatuses[currentStatusIndex],
                        style: const TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.red.shade50,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.red.shade200),
                        ),
                        child: Text(
                          "ETA: $etaMinutes mins",
                          style: TextStyle(
                              fontSize: 13,
                              color: Colors.red.shade700,
                              fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  LinearProgressIndicator(
                    value: progress,
                    color: Colors.red,
                    backgroundColor: Colors.red.shade100,
                    minHeight: 4,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      const CircleAvatar(
                        radius: 24,
                        backgroundImage:
                            NetworkImage('https://i.pravatar.cc/150?img=12'),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text("Rahul Sharma",
                                style: TextStyle(
                                    fontSize: 16, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                const Icon(Icons.star,
                                    color: Colors.orange, size: 16),
                                const SizedBox(width: 4),
                                const Text("4.9",
                                    style: TextStyle(fontSize: 13)),
                                const SizedBox(width: 10),
                                Text("MP04 ZX 4521",
                                    style: TextStyle(
                                        fontSize: 13,
                                        color: Colors.grey.shade600)),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const _LiveBadge(),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Divider(height: 1),
                  const SizedBox(height: 10),
                  const Text("Order Summary",
                      style: TextStyle(
                          fontSize: 14, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  _buildSummaryItem("Pepperoni Pizza", "x1", "₹249"),
                  _buildSummaryItem("Coke 500ml", "x1", "₹40"),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.red,
                            foregroundColor: Colors.white,
                            padding:
                                const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10)),
                          ),
                          onPressed: () {},
                          icon: const Icon(Icons.call, size: 18),
                          label: const Text("Call"),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.red,
                            foregroundColor: Colors.white,
                            padding:
                                const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10)),
                          ),
                          onPressed: () {},
                          icon: const Icon(Icons.message, size: 18),
                          label: const Text("Chat"),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String name, String qty, String price) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text("$qty $name",
              style: TextStyle(color: Colors.grey[800], fontSize: 13)),
          Text(price,
              style:
                  const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
        ],
      ),
    );
  }
}

// ── Pulsing LIVE Badge ──────────────────────────────────────────────────────────
class _LiveBadge extends StatefulWidget {
  const _LiveBadge();

  @override
  State<_LiveBadge> createState() => _LiveBadgeState();
}

class _LiveBadgeState extends State<_LiveBadge>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        ...List.generate(2, (index) {
          return AnimatedBuilder(
            animation: _controller,
            builder: (context, child) {
              final progress = (_controller.value + (index * 0.5)) % 1.0;
              return Container(
                width: 44 + (progress * 30),
                height: 24 + (progress * 15),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Colors.green.withOpacity(1.0 - progress),
                    width: 2,
                  ),
                ),
              );
            },
          );
        }),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.green,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                  color: Colors.green.withOpacity(0.3),
                  blurRadius: 8,
                  spreadRadius: 2),
            ],
          ),
          child: const Text(
            "LIVE",
            style: TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
        ),
      ],
    );
  }
}

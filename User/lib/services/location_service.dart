import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import '../core/config/app_mode.dart';

Future<String> getCurrentLocationName() async {
  if (kFrontendPreviewMode) {
    return "Vijay Nagar, Indore";
  }

  try {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled().timeout(
      const Duration(seconds: 2),
      onTimeout: () => false,
    );
    if (!serviceEnabled) {
      return "Vijay Nagar, Indore";
    }

    LocationPermission permission = await Geolocator.checkPermission().timeout(
      const Duration(seconds: 2),
      onTimeout: () => LocationPermission.denied,
    );
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission().timeout(
        const Duration(seconds: 3),
        onTimeout: () => LocationPermission.denied,
      );
      if (permission == LocationPermission.denied) {
        return "Vijay Nagar, Indore";
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return "Vijay Nagar, Indore";
    }

    // Get position with timeout & medium accuracy (much faster on device & emulator)
    Position position = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.medium,
      timeLimit: const Duration(seconds: 4),
    );

    return await reverseGeocode(position.latitude, position.longitude);
  } catch (_) {
    return "Vijay Nagar, Indore";
  }
}

Future<String> reverseGeocode(double lat, double lng) async {
  if (kFrontendPreviewMode) {
    return "Vijay Nagar, Indore";
  }
  try {
    List<Placemark> placemarks = await placemarkFromCoordinates(lat, lng).timeout(
      const Duration(seconds: 3),
    );
    if (placemarks.isNotEmpty) {
      Placemark place = placemarks[0];
      final parts = [
        place.subLocality,
        place.locality,
      ].where((p) => p != null && p.isNotEmpty).toList();

      if (parts.isNotEmpty) return parts.join(', ');
      return place.administrativeArea ?? "Vijay Nagar, Indore";
    }
  } catch (_) {}
  return "Vijay Nagar, Indore";
}


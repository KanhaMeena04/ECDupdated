import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import '../core/config/app_mode.dart';

Future<Position?> getCurrentPositionSafe() async {
  if (kFrontendPreviewMode) return null;
  try {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled().timeout(
      const Duration(seconds: 2),
      onTimeout: () => false,
    );
    if (!serviceEnabled) return null;

    LocationPermission permission = await Geolocator.checkPermission().timeout(
      const Duration(seconds: 2),
      onTimeout: () => LocationPermission.denied,
    );
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission().timeout(
        const Duration(seconds: 3),
        onTimeout: () => LocationPermission.denied,
      );
      if (permission == LocationPermission.denied) return null;
    }
    if (permission == LocationPermission.deniedForever) return null;

    return await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.medium,
      timeLimit: const Duration(seconds: 4),
    );
  } catch (_) {
    return null;
  }
}

Future<Map<String, double>?> getCoordinatesFromAddress(String address) async {
  try {
    List<Location> locations = await locationFromAddress(address).timeout(
      const Duration(seconds: 3),
    );
    if (locations.isNotEmpty) {
      return {
        'lat': locations.first.latitude,
        'lng': locations.first.longitude,
      };
    }
  } catch (_) {}

  final lower = address.toLowerCase();
  if (lower.contains('mumbai')) {
    return {'lat': 19.0760, 'lng': 72.8777};
  }
  if (lower.contains('indore') || lower.contains('palasia') || lower.contains('vijay nagar')) {
    return {'lat': 22.7196, 'lng': 75.8577};
  }
  if (lower.contains('bhopal')) {
    return {'lat': 23.2599, 'lng': 77.4126};
  }
  if (lower.contains('delhi') || lower.contains('connaught')) {
    return {'lat': 28.6139, 'lng': 77.2090};
  }
  return null;
}

Future<String> getCurrentLocationName() async {
  try {
    final position = await getCurrentPositionSafe();
    if (position == null) {
      return "Current Location";
    }

    return await reverseGeocode(position.latitude, position.longitude);
  } catch (_) {
    return "Current Location";
  }
}

Future<String> reverseGeocode(double lat, double lng) async {
  try {
    List<Placemark> placemarks = await placemarkFromCoordinates(lat, lng).timeout(
      const Duration(seconds: 4),
    );
    if (placemarks.isNotEmpty) {
      Placemark place = placemarks[0];
      final List<String> parts = [];
      if (place.name != null && place.name!.trim().isNotEmpty && place.name != place.locality) {
        parts.add(place.name!.trim());
      }
      if (place.subLocality != null && place.subLocality!.trim().isNotEmpty && place.subLocality != place.locality) {
        parts.add(place.subLocality!.trim());
      }
      if (place.locality != null && place.locality!.trim().isNotEmpty) {
        parts.add(place.locality!.trim());
      }

      if (parts.isNotEmpty) return parts.toSet().join(', ');
      return place.locality ?? place.administrativeArea ?? "Current Location";
    }
  } catch (_) {}
  return "Current Location";
}


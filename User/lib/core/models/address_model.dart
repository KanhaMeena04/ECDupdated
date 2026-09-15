import 'package:flutter/foundation.dart';

@immutable
class Address {
  final String id;
  final String label; // e.g., 'Home', 'Work'
  final String fullAddress;
  final String? flatNo;
  final String? landmark;
  final String? city;
  final String? state;
  final String? pincode;
  final bool isDefault;
  final double? latitude;
  final double? longitude;
  final String? phone;

  const Address({
    required this.id,
    required this.label,
    required this.fullAddress,
    this.flatNo,
    this.landmark,
    this.city,
    this.state,
    this.pincode,
    this.isDefault = false,
    this.latitude,
    this.longitude,
    this.phone,
  });

  factory Address.fromJson(Map<String, dynamic> json) {
    double lat = 0.0;
    double lng = 0.0;
    
    if (json['location'] != null && json['location']['coordinates'] != null) {
      final coords = json['location']['coordinates'] as List;
      if (coords.length >= 2) {
        lng = (coords[0] ?? 0.0).toDouble();
        lat = (coords[1] ?? 0.0).toDouble();
      }
    } else {
      lat = (json['latitude'] ?? 0.0).toDouble();
      lng = (json['longitude'] ?? 0.0).toDouble();
    }

    return Address(
      id: json['_id'] ?? json['id'] ?? '',
      label: json['label'] ?? json['type'] ?? 'Other',
      fullAddress: json['address'] ?? json['fullAddress'] ?? '',
      flatNo: json['flatNo'] ?? json['apartment'],
      landmark: json['landmark'],
      city: json['city'],
      state: json['state'],
      pincode: json['pincode'],
      isDefault: json['isDefault'] ?? false,
      latitude: lat,
      longitude: lng,
      phone: json['phone'],
    );
  }

  Map<String, dynamic> toJson() {
    final map = {
      'label': label,
      'fullAddress': fullAddress,
      'apartment': flatNo,
      'landmark': landmark,
      'city': city,
      'state': state,
      'pincode': pincode,
      'isDefault': isDefault,
      'latitude': latitude ?? 0.0,
      'longitude': longitude ?? 0.0,
      'phone': phone,
    };
    map.removeWhere((key, value) => value == null);
    return map;
  }
}

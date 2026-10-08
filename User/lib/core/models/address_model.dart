import 'package:flutter/foundation.dart';

@immutable
class Address {
  final String id;
  final String label; // e.g., 'Home', 'Work', 'Other'
  final String fullAddress;
  final String? flatNo;
  final String? floor;
  final String? buildingName;
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
    this.floor,
    this.buildingName,
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
      label: json['label'] ?? json['type'] ?? 'Home',
      fullAddress: json['address'] ?? json['fullAddress'] ?? json['addressLine'] ?? '',
      flatNo: json['flatNo'] ?? json['apartment'],
      floor: json['floor']?.toString(),
      buildingName: json['buildingName']?.toString() ?? json['apartment']?.toString(),
      landmark: json['landmark'],
      city: json['city'],
      state: json['state'],
      pincode: json['pincode'] ?? json['zipCode'],
      isDefault: json['isDefault'] ?? false,
      latitude: lat,
      longitude: lng,
      phone: json['phone'],
    );
  }

  String get formattedDisplay {
    final prefixParts = <String>[];
    if (flatNo != null && flatNo!.trim().isNotEmpty) {
      prefixParts.add('Flat/House: ${flatNo!.trim()}');
    }
    if (floor != null && floor!.trim().isNotEmpty) {
      prefixParts.add('Floor: ${floor!.trim()}');
    }
    if (buildingName != null && buildingName!.trim().isNotEmpty) {
      prefixParts.add(buildingName!.trim());
    }
    if (prefixParts.isNotEmpty) {
      return '${prefixParts.join(', ')}, $fullAddress';
    }
    return fullAddress;
  }

  Map<String, dynamic> toJson() {
    final map = {
      'label': label,
      'fullAddress': fullAddress,
      'addressLine': fullAddress,
      'address': fullAddress,
      'flatNo': flatNo,
      'apartment': flatNo,
      'floor': floor,
      'buildingName': buildingName,
      'landmark': landmark,
      'city': city,
      'state': state,
      'pincode': pincode,
      'zipCode': pincode,
      'isDefault': isDefault,
      'latitude': latitude ?? 0.0,
      'longitude': longitude ?? 0.0,
      'phone': phone,
    };
    map.removeWhere((key, value) => value == null);
    return map;
  }
}

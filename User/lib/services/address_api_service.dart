import '../core/constants/app_constants.dart';
import '../core/config/app_mode.dart';
import 'dart:convert';
import 'package:flutter/foundation.dart' show debugPrint;
import 'package:http/http.dart' as http;
import '../core/models/address_model.dart';
import 'auth_service.dart';

class AddressApiService {
  // static String get baseUrl => '${AppConstants.baseUrl}/addresses';
  static String get baseUrl => '${AppConstants.baseUrl}/addresses';

  static Future<Map<String, String>> _getHeaders() async {
    final token = await AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<List<Address>> getMyAddresses() async {
    if (kFrontendPreviewMode) {
      return [
        Address(
          id: 'addr_1',
          label: 'Home',
          fullAddress: '102, Royal Palms, Vijay Nagar, Indore',
          city: 'Indore',
          state: 'Madhya Pradesh',
          pincode: '452010',
          latitude: 22.7533,
          longitude: 75.8937,
          isDefault: true,
        ),
        Address(
          id: 'addr_2',
          label: 'Work',
          fullAddress: '4th Floor, IT Park, Ring Road, Indore',
          city: 'Indore',
          state: 'Madhya Pradesh',
          pincode: '452001',
          latitude: 22.7196,
          longitude: 75.8577,
          isDefault: false,
        ),
      ];
    }
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/me'),
        headers: await _getHeaders(),
      );

      debugPrint('API Response [getMyAddresses]: ${response.statusCode} - ${response.body}');

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        if (data['addresses'] != null) {
          final List<dynamic> addressesList = data['addresses'];
          return addressesList.map((json) => Address.fromJson(json)).toList();
        }
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching addresses: $e');
      return [];
    }
  }

  static Future<bool> addAddress(Address address) async {
    if (kFrontendPreviewMode) return true;
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/add'),
        headers: await _getHeaders(),
        body: jsonEncode(address.toJson()),
      );
      debugPrint('API Response [addAddress]: ${response.statusCode} - ${response.body}');
      if (response.statusCode == 200 || response.statusCode == 201) return true;
      throw Exception(response.body);
    } catch (e) {
      debugPrint('Error adding address: $e');
      throw e;
    }
  }

  static Future<bool> updateAddress(String id, Address address) async {
    if (kFrontendPreviewMode) return true;
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/update/$id'),
        headers: await _getHeaders(),
        body: jsonEncode(address.toJson()),
      );
      debugPrint('API Response [updateAddress]: ${response.statusCode}');
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error updating address: $e');
      return false;
    }
  }

  static Future<bool> deleteAddress(String id) async {
    if (kFrontendPreviewMode) return true;
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/delete/$id'),
        headers: await _getHeaders(),
      );
      debugPrint('API Response [deleteAddress]: ${response.statusCode}');
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error deleting address: $e');
      return false;
    }
  }

  static Future<bool> setDefaultAddress(String id) async {
    if (kFrontendPreviewMode) return true;
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/set-default/$id'),
        headers: await _getHeaders(),
      );
      debugPrint('API Response [setDefaultAddress]: ${response.statusCode}');
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error setting default address: $e');
      return false;
    }
  }
}

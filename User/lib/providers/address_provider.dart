import 'package:flutter/material.dart';
import '../core/models/address_model.dart';
import '../services/address_api_service.dart';

class AddressProvider extends ChangeNotifier {
  List<Address> _addresses = [];
  bool _isLoading = false;
  String? _error;
  int _selectedIndex = 0;

  List<Address> get addresses => _addresses;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get selectedIndex => _selectedIndex;

  Address? get defaultAddress {
    try {
      return _addresses.firstWhere((a) => a.isDefault);
    } catch (_) {
      return _addresses.isNotEmpty ? _addresses.first : null;
    }
  }

  Address? get selectedAddress {
    if (_addresses.isEmpty) return null;
    if (_selectedIndex >= 0 && _selectedIndex < _addresses.length) {
      return _addresses[_selectedIndex];
    }
    return defaultAddress;
  }

  void selectAddress(int index) {
    if (index >= 0 && index < _addresses.length) {
      _selectedIndex = index;
      notifyListeners();
    }
  }

  Future<void> fetchAddresses() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _addresses = await AddressApiService.getMyAddresses();
      final defaultIdx = _addresses.indexWhere((a) => a.isDefault);
      if (defaultIdx != -1) {
        _selectedIndex = defaultIdx;
      } else if (_selectedIndex >= _addresses.length) {
        _selectedIndex = 0;
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> addAddress(Address address) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final success = await AddressApiService.addAddress(address);
      if (success) {
        await fetchAddresses();
      } else {
        _isLoading = false;
        notifyListeners();
      }
      return success;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      // Rethrow to let the UI catch it
      rethrow;
    }
  }

  Future<bool> updateAddress(String id, Address address) async {
    _isLoading = true;
    notifyListeners();

    final success = await AddressApiService.updateAddress(id, address);
    if (success) {
      await fetchAddresses();
    } else {
      _isLoading = false;
      notifyListeners();
    }
    return success;
  }

  Future<bool> deleteAddress(String id) async {
    _isLoading = true;
    notifyListeners();

    final success = await AddressApiService.deleteAddress(id);
    if (success) {
      await fetchAddresses();
    } else {
      _isLoading = false;
      notifyListeners();
    }
    return success;
  }

  Future<bool> setDefaultAddress(String id) async {
    _isLoading = true;
    notifyListeners();

    final success = await AddressApiService.setDefaultAddress(id);
    if (success) {
      await fetchAddresses();
    } else {
      _isLoading = false;
      notifyListeners();
    }
    return success;
  }
}

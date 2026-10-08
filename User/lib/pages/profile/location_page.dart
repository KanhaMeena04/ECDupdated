import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../providers/theme_provider.dart';
import '../../providers/address_provider.dart';
import '../../core/models/address_model.dart';
import '../checkout/map_address_picker_page.dart';

class LocationPage extends StatefulWidget {
  const LocationPage({super.key});

  @override
  State<LocationPage> createState() => _LocationPageState();
}

class _LocationPageState extends State<LocationPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AddressProvider>().fetchAddresses();
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    final addressProvider = context.watch<AddressProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Manage Addresses'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: addressProvider.isLoading && addressProvider.addresses.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => addressProvider.fetchAddresses(),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Card(
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: ListTile(
                      tileColor: const Color(0xFF248C70),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      leading: const Icon(Icons.map_rounded, color: Colors.white),
                      title: const Text('Pick Location on Google Map',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      subtitle: const Text('Pin exact location with GPS and Google Maps',
                          style: TextStyle(color: Colors.white70, fontSize: 12)),
                      trailing: const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white, size: 16),
                      onTap: () async {
                        await Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const MapAddressPickerPage()),
                        );
                        if (context.mounted) {
                          context.read<AddressProvider>().fetchAddresses();
                        }
                      },
                    ),
                  ),
                  const SizedBox(height: 10),
                  Card(
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: ListTile(
                      tileColor: const Color(0xFF2C2C2C),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      leading: const Icon(Icons.add_circle_outline, color: Color(0xFF9EF01A)),
                      title: Text('Add Address Manually',
                          style: AppTextStyles.h4.copyWith(color: const Color(0xFF9EF01A))),
                      onTap: () => _openAddEditAddress(context),
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (addressProvider.addresses.isEmpty)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32.0),
                        child: Column(
                          children: [
                            Icon(Icons.location_off_outlined, size: 64, color: Colors.grey[400]),
                            const SizedBox(height: 16),
                            Text('No addresses found',
                                style: AppTextStyles.bodyLarge.copyWith(color: Colors.grey)),
                          ],
                        ),
                      ),
                    )
                  else
                    ...addressProvider.addresses.map((address) {
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        elevation: 2,
                        shadowColor: Colors.black12,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        child: Container(
                          decoration: BoxDecoration(
                            color: isDark ? Colors.black.withOpacity(0.9) : Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: address.isDefault
                                ? Border.all(color: AppColors.primary, width: 1.5)
                                : null,
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(
                                      children: [
                                        Icon(
                                          address.label.toLowerCase() == 'home'
                                              ? Icons.home_outlined
                                              : address.label.toLowerCase() == 'work'
                                                  ? Icons.work_outline
                                                  : Icons.location_on_outlined,
                                          size: 20,
                                          color: const Color(0xFF248C70),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(address.label,
                                            style: AppTextStyles.h4.copyWith(
                                                color: isDark ? Colors.white : Colors.black)),
                                        if (address.isDefault)
                                          Container(
                                            margin: const EdgeInsets.only(left: 8),
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 8, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: AppColors.primary.withOpacity(0.1),
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: const Text('DEFAULT',
                                                style: TextStyle(
                                                    color: AppColors.primary,
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.bold)),
                                          ),
                                      ],
                                    ),
                                    Row(
                                      children: [
                                        IconButton(
                                          icon: const Icon(Icons.edit_outlined, size: 20),
                                          onPressed: () => _openAddEditAddress(context, address),
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.delete_outline,
                                              size: 20, color: AppColors.error),
                                          onPressed: () => _confirmDelete(context, address),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                if (address.flatNo != null && address.flatNo!.isNotEmpty ||
                                    address.floor != null && address.floor!.isNotEmpty ||
                                    address.buildingName != null && address.buildingName!.isNotEmpty)
                                  Padding(
                                    padding: const EdgeInsets.only(bottom: 4),
                                    child: Text(
                                      [
                                        if (address.flatNo != null && address.flatNo!.isNotEmpty) 'Flat/House: ${address.flatNo}',
                                        if (address.floor != null && address.floor!.isNotEmpty) 'Floor: ${address.floor}',
                                        if (address.buildingName != null && address.buildingName!.isNotEmpty) address.buildingName!,
                                      ].join(', '),
                                      style: TextStyle(
                                        color: isDark ? Colors.grey[300] : const Color(0xFF1F2937),
                                        fontWeight: FontWeight.w600,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ),
                                Text(
                                  address.fullAddress,
                                  style: AppTextStyles.bodyMedium.copyWith(color: Colors.grey[600]),
                                ),
                                if (address.landmark != null && address.landmark!.isNotEmpty)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 4),
                                    child: Text(
                                      'Landmark: ${address.landmark}',
                                      style: AppTextStyles.bodySmall.copyWith(color: Colors.grey[500]),
                                    ),
                                  ),
                                if (!address.isDefault)
                                  TextButton(
                                    onPressed: () => addressProvider.setDefaultAddress(address.id),
                                    child: const Text('Set as Default'),
                                  ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }

  void _openAddEditAddress(BuildContext context, [Address? address]) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => AddEditAddressPage(address: address),
      ),
    );
  }

  void _confirmDelete(BuildContext context, Address address) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Address'),
        content: const Text('Are you sure you want to delete this address?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              context.read<AddressProvider>().deleteAddress(address.id);
              Navigator.pop(ctx);
            },
            child: const Text('Delete', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }
}

class AddEditAddressPage extends StatefulWidget {
  final Address? address;
  const AddEditAddressPage({super.key, this.address});

  @override
  State<AddEditAddressPage> createState() => _AddEditAddressPageState();
}

class _AddEditAddressPageState extends State<AddEditAddressPage> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _labelCtrl;
  late TextEditingController _addressCtrl;
  late TextEditingController _flatCtrl;
  late TextEditingController _floorCtrl;
  late TextEditingController _buildingCtrl;
  late TextEditingController _landmarkCtrl;
  String _selectedLabel = 'Home';
  bool _isDefault = false;

  @override
  void initState() {
    super.initState();
    final addrLabel = widget.address?.label ?? 'Home';
    _selectedLabel = ['Home', 'Work', 'Other'].contains(addrLabel) ? addrLabel : 'Other';
    _labelCtrl = TextEditingController(text: addrLabel);
    _addressCtrl = TextEditingController(text: widget.address?.fullAddress ?? '');
    _flatCtrl = TextEditingController(text: widget.address?.flatNo ?? '');
    _floorCtrl = TextEditingController(text: widget.address?.floor ?? '');
    _buildingCtrl = TextEditingController(text: widget.address?.buildingName ?? '');
    _landmarkCtrl = TextEditingController(text: widget.address?.landmark ?? '');
    _isDefault = widget.address?.isDefault ?? false;
  }

  @override
  void dispose() {
    _labelCtrl.dispose();
    _addressCtrl.dispose();
    _flatCtrl.dispose();
    _floorCtrl.dispose();
    _buildingCtrl.dispose();
    _landmarkCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.address != null;
    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? 'Edit Address' : 'Add Complete Address'),
        backgroundColor: const Color(0xFF248C70),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Save address as',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF1F2937)),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  _buildLabelChip('Home', Icons.home_rounded),
                  const SizedBox(width: 8),
                  _buildLabelChip('Work', Icons.work_rounded),
                  const SizedBox(width: 8),
                  _buildLabelChip('Other', Icons.location_on_rounded),
                ],
              ),
              const SizedBox(height: 20),
              _buildTextField(_flatCtrl, 'House / Flat / Block No *', Icons.apartment_rounded, isRequired: true),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: _buildTextField(_floorCtrl, 'Floor (e.g. 2nd Floor)', Icons.layers_outlined),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildTextField(_buildingCtrl, 'Building / Apartment', Icons.business_outlined),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              _buildTextField(_addressCtrl, 'Complete Street Address *', Icons.location_on_outlined, maxLines: 2, isRequired: true),
              const SizedBox(height: 14),
              _buildTextField(_landmarkCtrl, 'Nearby Landmark (optional)', Icons.near_me_outlined),
              const SizedBox(height: 14),
              CheckboxListTile(
                title: const Text('Set as Default Delivery Address', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                value: _isDefault,
                activeColor: const Color(0xFF248C70),
                contentPadding: EdgeInsets.zero,
                onChanged: (val) => setState(() => _isDefault = val ?? false),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: () => _save(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF248C70),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  child: Text(
                    isEdit ? 'Update Address' : 'Save Address',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabelChip(String label, IconData icon) {
    final isSelected = _selectedLabel == label;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedLabel = label;
          _labelCtrl.text = label;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF248C70) : const Color(0xFFF3F4F6),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? const Color(0xFF248C70) : const Color(0xFFE5E7EB),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: isSelected ? Colors.white : const Color(0xFF6B7280)),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: isSelected ? Colors.white : const Color(0xFF374151),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(TextEditingController ctrl, String label, IconData icon, {int maxLines = 1, bool isRequired = false}) {
    return TextFormField(
      controller: ctrl,
      maxLines: maxLines,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
        prefixIcon: Icon(icon, color: const Color(0xFF248C70), size: 20),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF248C70), width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      validator: (val) {
        if (isRequired && (val == null || val.trim().isEmpty)) {
          return 'This field is required';
        }
        return null;
      },
    );
  }

  void _save(BuildContext context) async {
    if (_formKey.currentState!.validate()) {
      final address = Address(
        id: widget.address?.id ?? '',
        label: _selectedLabel,
        fullAddress: _addressCtrl.text.trim(),
        flatNo: _flatCtrl.text.trim(),
        floor: _floorCtrl.text.trim(),
        buildingName: _buildingCtrl.text.trim(),
        landmark: _landmarkCtrl.text.trim(),
        isDefault: _isDefault,
      );

      bool success;
      if (widget.address != null && widget.address!.id.isNotEmpty) {
        success = await context.read<AddressProvider>().updateAddress(widget.address!.id, address);
      } else {
        success = await context.read<AddressProvider>().addAddress(address);
      }

      if (success && mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(widget.address != null ? 'Address updated' : 'Address saved successfully'),
            backgroundColor: const Color(0xFF248C70),
          ),
        );
      }
    }
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../providers/theme_provider.dart';
import '../../providers/address_provider.dart';
import '../../core/models/address_model.dart';

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
                      tileColor: const Color(0xFF2C2C2C),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      leading: const Icon(Icons.add_circle_outline, color: Color(0xFF9EF01A)),
                      title: Text('Add New Address',
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
                                Text(
                                  '${address.flatNo != null ? "${address.flatNo}, " : ""}${address.fullAddress}',
                                  style: AppTextStyles.bodyMedium.copyWith(color: Colors.grey[600]),
                                ),
                                if (address.landmark != null && address.landmark!.isNotEmpty)
                                  Text(
                                    'Landmark: ${address.landmark}',
                                    style: AppTextStyles.bodySmall.copyWith(color: Colors.grey[500]),
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
  late TextEditingController _landmarkCtrl;
  bool _isDefault = false;

  @override
  void initState() {
    super.initState();
    _labelCtrl = TextEditingController(text: widget.address?.label ?? '');
    _addressCtrl = TextEditingController(text: widget.address?.fullAddress ?? '');
    _flatCtrl = TextEditingController(text: widget.address?.flatNo ?? '');
    _landmarkCtrl = TextEditingController(text: widget.address?.landmark ?? '');
    _isDefault = widget.address?.isDefault ?? false;
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.address != null;
    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? 'Edit Address' : 'Add Address'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              _buildTextField(_labelCtrl, 'Label (e.g. Home, Work)', Icons.label_outline),
              const SizedBox(height: 16),
              _buildTextField(_addressCtrl, 'Full Address', Icons.location_on_outlined, maxLines: 3),
              const SizedBox(height: 16),
              _buildTextField(_flatCtrl, 'Flat / House No', Icons.home_work_outlined),
              const SizedBox(height: 16),
              _buildTextField(_landmarkCtrl, 'Landmark', Icons.near_me_outlined),
              const SizedBox(height: 16),
              CheckboxListTile(
                title: const Text('Set as Default Address'),
                value: _isDefault,
                activeColor: AppColors.primary,
                onChanged: (val) => setState(() => _isDefault = val ?? false),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: () => _save(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(isEdit ? 'Update Address' : 'Save Address'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(TextEditingController ctrl, String label, IconData icon, {int maxLines = 1}) {
    return TextFormField(
      controller: ctrl,
      maxLines: maxLines,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: AppColors.primary),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      ),
      validator: (val) => val == null || val.isEmpty ? 'Required' : null,
    );
  }

  void _save(BuildContext context) async {
    if (_formKey.currentState!.validate()) {
      final address = Address(
        id: widget.address?.id ?? '',
        label: _labelCtrl.text.trim(),
        fullAddress: _addressCtrl.text.trim(),
        flatNo: _flatCtrl.text.trim(),
        landmark: _landmarkCtrl.text.trim(),
        isDefault: _isDefault,
      );

      bool success;
      if (widget.address != null) {
        success = await context.read<AddressProvider>().updateAddress(widget.address!.id, address);
      } else {
        success = await context.read<AddressProvider>().addAddress(address);
      }

      if (success && mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(widget.address != null ? 'Address updated' : 'Address added')),
        );
      }
    }
  }
}

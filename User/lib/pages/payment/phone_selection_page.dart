import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class PhoneSelectionPage extends StatefulWidget {
  final String defaultPhone;
  final List<String> alternatePhones;
  final String? selectedPhone;

  const PhoneSelectionPage({
    super.key,
    required this.defaultPhone,
    required this.alternatePhones,
    this.selectedPhone,
  });

  @override
  State<PhoneSelectionPage> createState() => _PhoneSelectionPageState();
}

class _PhoneSelectionPageState extends State<PhoneSelectionPage> {
  late List<String> _allPhones;
  String? _selectedPhone;

  @override
  void initState() {
    super.initState();
    _selectedPhone = widget.selectedPhone ?? (widget.defaultPhone.isNotEmpty ? widget.defaultPhone : null);
    _allPhones = [
      if (widget.defaultPhone.isNotEmpty) widget.defaultPhone,
      ...widget.alternatePhones,
    ];
  }

  void _addPhone() {
    final tc = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Delivery Number', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
        content: TextField(
          controller: tc,
          keyboardType: TextInputType.phone,
          maxLength: 10,
          decoration: InputDecoration(
            hintText: 'Enter 10-digit number',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: Colors.grey))),
          ElevatedButton(
            onPressed: () {
              if (tc.text.length == 10) {
                if (!_allPhones.contains(tc.text)) {
                  setState(() {
                    _allPhones.add(tc.text);
                  });
                }
                Navigator.pop(ctx);
              } else {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter 10 digits')));
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.black),
            child: const Text('Save', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        final alternates = _allPhones.where((p) => p != widget.defaultPhone).toList();
        Navigator.pop(context, {'phone': _selectedPhone, 'alternates': alternates});
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF5FAF8),
      appBar: AppBar(
        title: const Text(
          'Select Contact Number',
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1F2937),
        elevation: 0,
        centerTitle: true,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: ElevatedButton.icon(
              onPressed: _addPhone,
              icon: const Icon(Icons.add, color: Colors.white),
              label: const Text('Add Delivery Number', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.black,
                minimumSize: const Size(double.infinity, 54),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
          Expanded(
            child: _allPhones.isEmpty
                ? const Center(child: Text('No phone numbers available', style: TextStyle(color: Colors.grey)))
                : ListView.builder(
                    itemCount: _allPhones.length,
                    itemBuilder: (ctx, i) {
                      final phone = _allPhones[i];
                      final isDefault = phone == widget.defaultPhone;
                      return Container(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          border: Border.all(color: _selectedPhone == phone ? Colors.green : Colors.transparent, width: 2),
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10)
                          ]
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(12),
                          leading: Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.phone, color: AppColors.primary, size: 22),
                          ),
                          title: Text(phone, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Color(0xFF1F2937))),
                          subtitle: isDefault 
                            ? const Padding(padding: EdgeInsets.only(top: 4), child: Text('Default Number', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 12)))
                            : const Padding(padding: EdgeInsets.only(top: 4), child: Text('Alternate Number', style: TextStyle(color: Color(0xFF6B7280), fontSize: 12))),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Radio<String>(
                                value: phone,
                                groupValue: _selectedPhone,
                                activeColor: Colors.green,
                                onChanged: (val) {
                                  if (val != null) {
                                    setState(() => _selectedPhone = val);
                                  }
                                },
                              ),
                              if (!isDefault)
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                                  onPressed: () {
                                    setState(() {
                                      _allPhones.remove(phone);
                                    });
                                  },
                                ),
                            ],
                          ),
                          onTap: () {
                            setState(() => _selectedPhone = phone);
                          },
                        ),
                      );
                    },
                  ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  final alternates = _allPhones.where((p) => p != widget.defaultPhone).toList();
                  Navigator.pop(context, {'phone': _selectedPhone, 'alternates': alternates});
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Confirm Selection', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),
          )
        ],
      ),
    ));
  }
}

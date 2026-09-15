import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class FiltersBottomSheet extends StatefulWidget {
  const FiltersBottomSheet({Key? key}) : super(key: key);

  @override
  State<FiltersBottomSheet> createState() => _FiltersBottomSheetState();
}

class _FiltersBottomSheetState extends State<FiltersBottomSheet> {
  int _selectedTabIndex = 0;

  final List<String> _tabs = [
    'Dietary',
    'Price',
    'Rating',
    'Distance',
    'Status'
  ];

  // Filter States
  String? _selectedDietary;
  String? _selectedPrice;
  String? _selectedRating;
  String? _selectedDistance;
  String? _selectedStatus;

  void _clearAll() {
    setState(() {
      _selectedDietary = null;
      _selectedPrice = null;
      _selectedRating = null;
      _selectedDistance = null;
      _selectedStatus = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Filters and sorting',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                GestureDetector(
                  onTap: _clearAll,
                  child: const Text(
                    'Clear all',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppColors.border),

          // Main Body (Left Tabs + Right Content)
          Expanded(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Left Tabs
                Container(
                  width: 110,
                  color: Colors.grey.shade50,
                  child: ListView.builder(
                    itemCount: _tabs.length,
                    itemBuilder: (context, index) {
                      final isSelected = _selectedTabIndex == index;
                      return GestureDetector(
                        onTap: () => setState(() => _selectedTabIndex = index),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
                          decoration: BoxDecoration(
                            color: isSelected ? Colors.white : Colors.transparent,
                            border: isSelected
                                ? const Border(
                                    left: BorderSide(color: AppColors.primary, width: 4),
                                  )
                                : null,
                          ),
                          child: Text(
                            _tabs[index],
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                              color: isSelected ? AppColors.primary : AppColors.textSecondary,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                
                // Right Content
                Expanded(
                  child: Container(
                    color: Colors.white,
                    padding: const EdgeInsets.all(20),
                    child: _buildRightContent(),
                  ),
                ),
              ],
            ),
          ),

          // Bottom Buttons
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -4),
                )
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: BorderSide(color: Colors.grey.shade300),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text(
                      'Close',
                      style: TextStyle(fontSize: 16, color: AppColors.textPrimary, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      final Map<String, String> filters = {};
                      if (_selectedDietary != null) filters['dietary'] = _selectedDietary!;
                      if (_selectedPrice != null) {
                        if (_selectedPrice == '₹100 - ₹300') {
                          filters['minPrice'] = '100';
                          filters['maxPrice'] = '300';
                        } else if (_selectedPrice == '₹300 - ₹500') {
                          filters['minPrice'] = '300';
                          filters['maxPrice'] = '500';
                        } else if (_selectedPrice == 'Above ₹500') {
                          filters['minPrice'] = '500';
                        }
                      }
                      if (_selectedRating != null) {
                        if (_selectedRating == '⭐ 4+') filters['minRating'] = '4';
                        if (_selectedRating == '⭐ 4.5+') filters['minRating'] = '4.5';
                        if (_selectedRating == '⭐ 5') filters['minRating'] = '5';
                      }
                      if (_selectedDistance != null) {
                        if (_selectedDistance == 'Within 2 km') filters['maxDistance'] = '2';
                        if (_selectedDistance == 'Within 5 km') filters['maxDistance'] = '5';
                        if (_selectedDistance == 'Within 10 km') filters['maxDistance'] = '10';
                      }
                      if (_selectedStatus != null) {
                        filters['status'] = _selectedStatus!;
                      }
                      
                      Navigator.pop(context, filters);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text(
                      'Show results',
                      style: TextStyle(fontSize: 16, color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRightContent() {
    switch (_selectedTabIndex) {
      case 0:
        return _buildOptionsList(
          title: 'Dietary Preference',
          options: ['Veg', 'Non-Veg'],
          selectedValue: _selectedDietary,
          onSelect: (val) => setState(() => _selectedDietary = val),
        );
      case 1:
        return _buildOptionsList(
          title: 'Dish Price',
          options: ['₹100 - ₹300', '₹300 - ₹500', 'Above ₹500'],
          selectedValue: _selectedPrice,
          onSelect: (val) => setState(() => _selectedPrice = val),
        );
      case 2:
        return _buildOptionsList(
          title: 'Restaurant Rating',
          options: ['⭐ 4+', '⭐ 4.5+', '⭐ 5'],
          selectedValue: _selectedRating,
          onSelect: (val) => setState(() => _selectedRating = val),
        );
      case 3:
        return _buildOptionsList(
          title: 'Distance',
          options: ['Within 2 km', 'Within 5 km', 'Within 10 km'],
          selectedValue: _selectedDistance,
          onSelect: (val) => setState(() => _selectedDistance = val),
        );
      case 4:
        return _buildOptionsList(
          title: 'Restaurant Status',
          options: ['Open Now', 'Closed'],
          selectedValue: _selectedStatus,
          onSelect: (val) => setState(() => _selectedStatus = val),
        );
      default:
        return const SizedBox();
    }
  }

  Widget _buildOptionsList({
    required String title,
    required List<String> options,
    required String? selectedValue,
    required Function(String) onSelect,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 16),
        Expanded(
          child: ListView.separated(
            itemCount: options.length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final option = options[index];
              final isSelected = selectedValue == option;
              return GestureDetector(
                onTap: () => onSelect(option),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primary.withOpacity(0.05) : Colors.white,
                    border: Border.all(
                      color: isSelected ? AppColors.primary : Colors.grey.shade300,
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          option,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                            color: isSelected ? AppColors.primary : AppColors.textPrimary,
                          ),
                        ),
                      ),
                      if (isSelected)
                        const Icon(Icons.check_circle, color: AppColors.primary, size: 20)
                      else
                        Icon(Icons.circle_outlined, color: Colors.grey.shade300, size: 20),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/theme_provider.dart';
import '../../routes/app_routes.dart';
import '../../widgets/safe_image.dart';

class CategoryPrefItem {
  final String id;
  final String title;
  final String imageUrl;

  const CategoryPrefItem({
    required this.id,
    required this.title,
    required this.imageUrl,
  });
}

class FoodPreferencesPage extends StatefulWidget {
  final bool showBackButton;
  final ValueChanged<List<String>>? onCompleted;
  final VoidCallback? onSkip;

  const FoodPreferencesPage({
    super.key,
    this.showBackButton = false,
    this.onCompleted,
    this.onSkip,
  });

  @override
  State<FoodPreferencesPage> createState() => _FoodPreferencesPageState();
}

class _FoodPreferencesPageState extends State<FoodPreferencesPage> {
  // Start empty so user has full freedom to select/unselect any item
  final Set<String> _selectedCategories = {};

  final List<CategoryPrefItem> _categoryItems = const [
    CategoryPrefItem(
      id: 'italian',
      title: 'Italian',
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400',
    ),
    CategoryPrefItem(
      id: 'french',
      title: 'French',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
    ),
    CategoryPrefItem(
      id: 'mexican',
      title: 'Mexican',
      imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',
    ),
    CategoryPrefItem(
      id: 'chinese',
      title: 'Chinese',
      imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
    ),
    CategoryPrefItem(
      id: 'japanese',
      title: 'Japanese',
      imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400',
    ),
    CategoryPrefItem(
      id: 'thai',
      title: 'Thai',
      imageUrl: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400',
    ),
    CategoryPrefItem(
      id: 'mediterranean',
      title: 'Mediterranean',
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
    ),
    CategoryPrefItem(
      id: 'american',
      title: 'American',
      imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400',
    ),
    CategoryPrefItem(
      id: 'spanish',
      title: 'Spanish',
      imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400',
    ),
    CategoryPrefItem(
      id: 'indian',
      title: 'Indian',
      imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
    ),
    CategoryPrefItem(
      id: 'non_veg',
      title: 'Non-Veg',
      imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400',
    ),
    CategoryPrefItem(
      id: 'vegetarian',
      title: 'Vegetarian',
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    ),
  ];

  void _toggleCategory(String title) {
    setState(() {
      if (_selectedCategories.contains(title)) {
        _selectedCategories.remove(title);
      } else {
        _selectedCategories.add(title);
      }
    });
  }

  void _navigateToHome() {
    if (widget.showBackButton && Navigator.canPop(context)) {
      Navigator.pop(context);
    } else {
      context.go(AppRoutes.home);
    }
  }

  void _onContinue() {
    if (widget.onCompleted != null) {
      widget.onCompleted!(_selectedCategories.toList());
      return;
    }
    _navigateToHome();
  }

  void _onSkip() {
    if (widget.onSkip != null) {
      widget.onSkip!();
      return;
    }
    _navigateToHome();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    const primaryColor = Color(0xFF248C70);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF121212) : Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // Top App Bar / Back Arrow + Skip Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  if (widget.showBackButton || Navigator.canPop(context))
                    IconButton(
                      icon: Icon(
                        Icons.arrow_back_rounded,
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                      onPressed: () => Navigator.pop(context),
                    )
                  else
                    const SizedBox(width: 48),
                  const Spacer(),
                  TextButton(
                    onPressed: _onSkip,
                    style: TextButton.styleFrom(
                      foregroundColor: primaryColor,
                    ),
                    child: const Text(
                      'Skip',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Header Titles
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                children: [
                  Text(
                    'Food Preferences',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : const Color(0xFF111827),
                      letterSpacing: -0.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Choose your favorite food types and dietary preferences to personalize your menu and get recommendations you\'ll love.',
                    style: TextStyle(
                      fontSize: 12,
                      height: 1.4,
                      color: isDark ? Colors.grey.shade400 : const Color(0xFF6B7280),
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // 3-Column Category Grid
            Expanded(
              child: GridView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  mainAxisSpacing: 14,
                  crossAxisSpacing: 14,
                  childAspectRatio: 0.85,
                ),
                itemCount: _categoryItems.length,
                itemBuilder: (context, index) {
                  final cat = _categoryItems[index];
                  final isSelected = _selectedCategories.contains(cat.title);

                  return GestureDetector(
                    onTap: () => _toggleCategory(cat.title),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isSelected ? primaryColor : Colors.transparent,
                          width: isSelected ? 3 : 0,
                        ),
                        boxShadow: [
                          if (isSelected)
                            BoxShadow(
                              color: primaryColor.withValues(alpha: 0.35),
                              blurRadius: 10,
                              spreadRadius: 2,
                            )
                          else
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.08),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            // Background Image
                            SafeImage(
                              cat.imageUrl,
                              fit: BoxFit.cover,
                            ),

                            // Dark Gradient Overlay for readability
                            Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    Colors.black.withValues(alpha: 0.2),
                                    Colors.black.withValues(alpha: 0.75),
                                  ],
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                ),
                              ),
                            ),

                            // Category Name Text
                            Center(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 4),
                                child: Text(
                                  cat.title,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    shadows: [
                                      Shadow(
                                        color: Colors.black87,
                                        blurRadius: 4,
                                      ),
                                    ],
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ),
                            ),

                            // Selection Checkmark Badge
                            if (isSelected)
                              Positioned(
                                top: 6,
                                right: 6,
                                child: Container(
                                  padding: const EdgeInsets.all(3),
                                  decoration: const BoxDecoration(
                                    color: primaryColor,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.check_rounded,
                                    color: Colors.white,
                                    size: 14,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),

            // Bottom Sticky Continue Button matching Project Primary Brand Green
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 20),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _onContinue,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryColor, // #248C70 Project Primary Green
                    foregroundColor: Colors.white,
                    elevation: 4,
                    shadowColor: primaryColor.withValues(alpha: 0.4),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(28),
                    ),
                  ),
                  child: Text(
                    _selectedCategories.isEmpty
                        ? 'Continue'
                        : 'Continue (${_selectedCategories.length} Selected)',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.2,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}


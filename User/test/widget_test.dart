import 'package:flutter_test/flutter_test.dart';
import 'package:ecdkart_app/providers/theme_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('loads the saved dark theme', () async {
    SharedPreferences.setMockInitialValues({'isDarkMode': true});

    final provider = ThemeProvider();
    await Future<void>.delayed(Duration.zero);

    expect(provider.isDarkMode, isTrue);
  });
}

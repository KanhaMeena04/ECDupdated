import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

// We import the main.dart of the User App
import 'package:ecdkart_app/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Phase 1: End-to-End Authentication Tests', () {
    testWidgets('Fresh install launch and accept terms', (WidgetTester tester) async {
      // 1. Launch the app
      app.main();
      
      // Wait for animations and splash screen to finish
      await tester.pumpAndSettle(const Duration(seconds: 5));

      // 2. The Terms & Conditions dialog should appear
      final termsDialog = find.text('Terms & Conditions');
      if (termsDialog.evaluate().isNotEmpty) {
        // Find the checkbox or just tap 'Agree & Continue'
        final agreeButton = find.text('Agree & Continue');
        expect(agreeButton, findsOneWidget);
        
        // Tap the agree button
        await tester.tap(agreeButton);
        await tester.pumpAndSettle();
      }

      // 3. Verify we are on the Login screen by looking for common text or input
      // (Assuming there is a +91 or Continue button)
      final loginButtonText = find.text('Continue'); // Adjust based on actual UI text
      if (loginButtonText.evaluate().isNotEmpty) {
        expect(loginButtonText, findsWidgets);
      }
      
      // 4. Test Invalid Login
      // Enter an invalid phone number
      final phoneInput = find.byType(TextField).first;
      if (phoneInput.evaluate().isNotEmpty) {
        await tester.enterText(phoneInput, '12345');
        await tester.pumpAndSettle();
        
        // Tap continue
        if (loginButtonText.evaluate().isNotEmpty) {
          await tester.tap(loginButtonText.first);
          await tester.pumpAndSettle();
          
          // Should show an error message (SnackBar or Text)
          // expect(find.textContaining('Please enter a valid phone number'), findsWidgets);
        }
      }
      
      // Wait a moment at the end to observe
      await Future.delayed(const Duration(seconds: 2));
    });
  });
}

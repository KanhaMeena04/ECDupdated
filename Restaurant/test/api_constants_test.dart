import 'package:flutter_test/flutter_test.dart';
import 'package:ecd_restaurant/api_constants.dart';

void main() {
  tearDown(ApiConstants.clearAuthenticatedSession);

  test('authenticated session rejects empty values', () {
    expect(
      () => ApiConstants.setAuthenticatedSession(
        restaurantId: '',
        authToken: 'token',
      ),
      throwsArgumentError,
    );
    expect(
      () => ApiConstants.setAuthenticatedSession(
        restaurantId: 'restaurant',
        authToken: '',
      ),
      throwsArgumentError,
    );
  });

  test('authenticated session requires login credentials', () {
    expect(() => ApiConstants.restaurantId, throwsStateError);
    expect(() => ApiConstants.authToken, throwsStateError);
  });

  test('authenticated session stores and clears credentials', () {
    ApiConstants.setAuthenticatedSession(
      restaurantId: 'restaurant',
      authToken: 'token',
    );

    expect(ApiConstants.restaurantId, 'restaurant');
    expect(ApiConstants.authToken, 'token');

    ApiConstants.clearAuthenticatedSession();
    expect(() => ApiConstants.restaurantId, throwsStateError);
    expect(() => ApiConstants.authToken, throwsStateError);
  });
}

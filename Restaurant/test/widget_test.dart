import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ecd_restaurant/main.dart';

void main() {
  test('constructs the restaurant application', () {
    const app = RestaurantApp(hasToken: false);

    expect(app, isA<StatelessWidget>());
    expect(app.hasToken, isFalse);
  });
}

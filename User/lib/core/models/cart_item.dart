import 'product.dart';

class CartItem {
  final Product product;
  final String imageUrl; // network image URL of the menu item
  int quantity;

  CartItem({
    required this.product,
    required this.imageUrl,
    this.quantity = 1,
  });

  double get totalPrice => product.price * quantity;
}

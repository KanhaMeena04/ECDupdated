import 'package:ecdkart_app/core/models/product.dart';
import '../core/models/category.dart';

class DummyData {
  static List<Product> getProducts() {
    return [
      Product(
        id: '1',
        name: 'Margherita Pizza',
        description:
            'Classic cheese pizza with rich tomato sauce & fresh basil',
        price: 299,
        image: 'assets/static/pizza.jpg',
        category: 'Pizza',
        rating: 4.5,
        isVeg: true,
      ),
      Product(
        id: '2',
        name: 'Chicken Burger',
        description: 'Juicy chicken patty with lettuce, tomato & mayo',
        price: 199,
        image: 'assets/static/b2.jpg',
        category: 'Burger',
        rating: 4.3,
        isVeg: false,
      ),
      Product(
        id: '3',
        name: 'Hakka Noodles',
        description: 'Indo-Chinese style wok-tossed noodles with veggies',
        price: 179,
        image: 'assets/static/b3.jpg',
        category: 'Noodles',
        rating: 4.2,
        isVeg: true,
      ),
      Product(
        id: '4',
        name: 'Penne Pasta',
        description: 'Creamy white sauce penne pasta with herbs & cheese',
        price: 249,
        image: 'assets/static/b1.jpg',
        category: 'Pasta',
        rating: 4.4,
        isVeg: true,
      ),
      Product(
        id: '5',
        name: 'Chilli Chicken',
        description: 'Crispy chicken tossed in spicy Indo-Chinese sauce',
        price: 329,
        image: 'assets/static/b3.jpg',
        category: 'Chinese',
        rating: 4.6,
        isVeg: false,
      ),
      Product(
        id: '6',
        name: 'Paneer Butter Masala',
        description: 'Rich creamy paneer curry with butter & aromatic spices',
        price: 279,
        image: 'assets/static/b4.jpg',
        category: 'Indian',
        rating: 4.5,
        isVeg: true,
      ),
      Product(
        id: '7',
        name: 'Chocolate Brownie',
        description: 'Warm fudgy brownie served with vanilla ice cream',
        price: 149,
        image: 'assets/static/cake5.jpg',
        category: 'Desserts',
        rating: 4.7,
        isVeg: true,
      ),
      Product(
        id: '8',
        name: 'Mango Smoothie',
        description: 'Fresh Alphonso mango blended with milk & honey',
        price: 129,
        image: 'assets/static/b4.jpg',
        category: 'Beverages',
        rating: 4.4,
        isVeg: true,
      ),
    ];
  }

  static List<Category> getCategories() {
    return [
      Category(id: '3', title: 'Pizza', image: 'assets/static/c3.png'),
      Category(id: '4', title: 'Chicken', image: 'assets/static/c4.png'), // Reusing c4.png or another image
      Category(id: '2', title: 'Burgers', image: 'assets/static/c2.png'),
      Category(id: '1', title: 'Cakes', image: 'assets/static/c1.png'),
      Category(id: '5', title: 'Biryani', image: 'assets/static/c5.png'),
      Category(id: '6', title: 'Sandwich', image: 'assets/static/c6.png'),
    ];
  }
}

class Product {
  final String id;
  final String name;
  final String description;
  final double price;
  final String image;
  final String category;
  final double rating;
  final bool isVeg;
  final String? restaurantId;
  final String? restaurantName;
  final String? restaurantImageUrl;

  Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.image,
    required this.category,
    this.rating = 4.0,
    this.isVeg = true,
    this.restaurantId,
    this.restaurantName,
    this.restaurantImageUrl,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      price: (json['price'] ?? 0.0).toDouble(),
      image: json['image'] ?? '',
      category: json['category'] ?? '',
      rating: (json['rating'] ?? 4.0).toDouble(),
      isVeg: json['isVeg'] ?? true,
      restaurantId: json['restaurantId']?.toString(),
      restaurantName: json['restaurantName']?.toString(),
      restaurantImageUrl: json['restaurantImageUrl']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'image': image,
      'category': category,
      'rating': rating,
      'isVeg': isVeg,
      if (restaurantId != null) 'restaurantId': restaurantId,
      if (restaurantName != null) 'restaurantName': restaurantName,
      if (restaurantImageUrl != null) 'restaurantImageUrl': restaurantImageUrl,
    };
  }
}

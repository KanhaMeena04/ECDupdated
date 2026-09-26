class Category {
  final String id;
  final String title;
  final String image;
  final double startingPrice;

  Category({
    required this.id,
    required this.title,
    required this.image,
    double? startingPrice,
  }) : startingPrice = startingPrice ?? 28.0;
}

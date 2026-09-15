class BannerModel {
  final String id;
  final String imageUrl;
  final bool isActive;

  BannerModel({
    required this.id,
    required this.imageUrl,
    required this.isActive,
  });

  factory BannerModel.fromJson(Map<String, dynamic> json) {
    return BannerModel(
      id: json['_id'] as String,
      imageUrl: json['imageUrl'] as String,
      isActive: json['isActive'] as bool? ?? true,
    );
  }
}

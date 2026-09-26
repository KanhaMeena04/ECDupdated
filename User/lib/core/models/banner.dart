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
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      imageUrl: (json['imageUrl'] ?? json['image'] ?? json['bannerImage'] ?? '').toString(),
      isActive: json['isActive'] == true || json['isActive'] == 'true' || json['isActive'] == null,
    );
  }
}

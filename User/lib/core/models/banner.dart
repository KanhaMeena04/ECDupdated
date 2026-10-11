import '../constants/app_constants.dart';

class BannerModel {
  final String id;
  final String title;
  final String imageUrl;
  final String type; // 'restaurant', 'item', 'category', 'external', 'static'
  final String targetId;
  final String targetModel; // 'Restaurant', 'Product', 'Category'
  final String link;
  final int position;
  final bool isActive;

  BannerModel({
    required this.id,
    this.title = '',
    required this.imageUrl,
    this.type = 'static',
    this.targetId = '',
    this.targetModel = '',
    this.link = '',
    this.position = 0,
    required this.isActive,
  });

  factory BannerModel.fromJson(Map<String, dynamic> json) {
    String rawImg = (json['imageUrl'] ?? json['image'] ?? json['bannerImage'] ?? '').toString().trim();
    if (rawImg.isNotEmpty) {
      if (rawImg.startsWith('/uploads/') || rawImg.startsWith('uploads/')) {
        final host = AppConstants.baseUrl.replaceAll(RegExp(r'/api(/v1)?/?$'), '');
        rawImg = rawImg.startsWith('/') ? '$host$rawImg' : '$host/$rawImg';
      } else if (!rawImg.startsWith('http://') && !rawImg.startsWith('https://') && !rawImg.startsWith('assets/')) {
        if (rawImg.startsWith('/')) {
          final host = AppConstants.baseUrl.replaceAll(RegExp(r'/api(/v1)?/?$'), '');
          rawImg = '$host$rawImg';
        }
      }
    }

    final tId = (json['targetId'] ?? json['restaurant'] ?? '').toString().trim();
    final tModel = (json['targetModel'] ?? (json['restaurant'] != null ? 'Restaurant' : '')).toString().trim();
    final bType = (json['type'] ?? (tId.isNotEmpty ? 'restaurant' : 'static')).toString().trim().toLowerCase();
    final bLink = (json['link'] ?? json['externalUrl'] ?? json['ctaUrl'] ?? '').toString().trim();
    final bPos = int.tryParse((json['position'] ?? 0).toString()) ?? 0;

    return BannerModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      imageUrl: rawImg,
      type: bType,
      targetId: tId,
      targetModel: tModel,
      link: bLink,
      position: bPos,
      isActive: json['isActive'] == true || json['isActive'] == 'true' || json['isActive'] == null || json['status'] == 'active',
    );
  }
}

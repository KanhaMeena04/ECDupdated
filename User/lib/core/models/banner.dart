import '../constants/app_constants.dart';

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
    return BannerModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      imageUrl: rawImg,
      isActive: json['isActive'] == true || json['isActive'] == 'true' || json['isActive'] == null || json['status'] == 'active',
    );
  }
}

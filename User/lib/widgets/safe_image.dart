import 'package:flutter/material.dart';
import '../core/constants/app_constants.dart';

class SafeImage extends StatelessWidget {
  final String url;
  final double? width;
  final double? height;
  final BoxFit? fit;
  final Widget Function(BuildContext, Widget, ImageChunkEvent?)? loadingBuilder;
  final Widget Function(BuildContext, Object, StackTrace?)? errorBuilder;

  const SafeImage(
    this.url, {
    super.key,
    this.width,
    this.height,
    this.fit,
    this.loadingBuilder,
    this.errorBuilder,
  });

  @override
  Widget build(BuildContext context) {
    const fallbackFoodUrl = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400';

    if (url.isEmpty || url.trim() == 'null') {
      return Image.network(
        fallbackFoodUrl,
        width: width,
        height: height,
        fit: fit ?? BoxFit.cover,
      );
    }

    String cleanUrl = url.trim();
    if (cleanUrl.startsWith('file:///')) {
      cleanUrl = cleanUrl.replaceFirst('file:///', '');
    } else if (cleanUrl.startsWith('file://')) {
      cleanUrl = cleanUrl.replaceFirst('file://', '');
    }

    if (cleanUrl.startsWith('assets/')) {
      return Image.asset(
        cleanUrl,
        width: width,
        height: height,
        fit: fit,
        errorBuilder: errorBuilder ?? (context, error, stackTrace) => Image.network(
          fallbackFoodUrl,
          width: width,
          height: height,
          fit: fit ?? BoxFit.cover,
        ),
      );
    }

    if (cleanUrl.startsWith('/uploads/') || cleanUrl.startsWith('uploads/')) {
      final host = AppConstants.baseUrl.replaceAll(RegExp(r'/api(/v1)?/?$'), '');
      cleanUrl = cleanUrl.startsWith('/') ? '$host$cleanUrl' : '$host/$cleanUrl';
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      if (cleanUrl.contains('assets/')) {
        final assetIndex = cleanUrl.indexOf('assets/');
        final assetPath = cleanUrl.substring(assetIndex);
        return Image.asset(
          assetPath,
          width: width,
          height: height,
          fit: fit,
          errorBuilder: errorBuilder ?? (context, error, stackTrace) => Image.network(
            fallbackFoodUrl,
            width: width,
            height: height,
            fit: fit ?? BoxFit.cover,
          ),
        );
      }

      return Image.network(
        fallbackFoodUrl,
        width: width,
        height: height,
        fit: fit ?? BoxFit.cover,
      );
    }

    return Image.network(
      cleanUrl,
      width: width,
      height: height,
      fit: fit,
      loadingBuilder: loadingBuilder,
      errorBuilder: errorBuilder ?? (context, error, stackTrace) => Image.network(
        fallbackFoodUrl,
        width: width,
        height: height,
        fit: fit ?? BoxFit.cover,
      ),
    );
  }
}

ImageProvider safeImageProvider(String url) {
  if (url.isEmpty) {
    return const AssetImage('assets/food.png');
  }
  String cleanUrl = url.trim();
  if (cleanUrl.startsWith('file:///')) {
    cleanUrl = cleanUrl.replaceFirst('file:///', '');
  } else if (cleanUrl.startsWith('file://')) {
    cleanUrl = cleanUrl.replaceFirst('file://', '');
  }
  if (cleanUrl.startsWith('assets/')) {
    return AssetImage(cleanUrl);
  }
  if (cleanUrl.contains('assets/')) {
    final assetIndex = cleanUrl.indexOf('assets/');
    final assetPath = cleanUrl.substring(assetIndex);
    return AssetImage(assetPath);
  }
  if (cleanUrl.startsWith('/uploads/') || cleanUrl.startsWith('uploads/')) {
    final host = AppConstants.baseUrl.replaceAll(RegExp(r'/api(/v1)?/?$'), '');
    cleanUrl = cleanUrl.startsWith('/') ? '$host$cleanUrl' : '$host/$cleanUrl';
  }
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return NetworkImage(cleanUrl);
  }
  return const AssetImage('assets/food.png');
}


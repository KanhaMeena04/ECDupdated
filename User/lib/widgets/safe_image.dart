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
    if (url.isEmpty) {
      return errorBuilder?.call(context, 'empty url', null) ?? 
             Container(
               width: width, 
               height: height, 
               color: Colors.grey[200], 
               child: const Icon(Icons.image_not_supported, color: Colors.grey)
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
        errorBuilder: errorBuilder ?? (context, error, stackTrace) => Container(
          width: width, 
          height: height, 
          color: Colors.grey[200], 
          child: const Icon(Icons.image_not_supported, color: Colors.grey),
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
          errorBuilder: errorBuilder ?? (context, error, stackTrace) => Container(
            width: width, 
            height: height, 
            color: Colors.grey[200], 
            child: const Icon(Icons.image_not_supported, color: Colors.grey),
          ),
        );
      }

      return errorBuilder?.call(context, 'invalid url', null) ?? Container(
        width: width, 
        height: height, 
        color: Colors.grey[200], 
        child: const Icon(Icons.fastfood, color: Colors.grey),
      );
    }

    return Image.network(
      cleanUrl,
      width: width,
      height: height,
      fit: fit,
      loadingBuilder: loadingBuilder,
      errorBuilder: errorBuilder ?? (context, error, stackTrace) => Container(
        width: width, 
        height: height, 
        color: Colors.grey[200], 
        child: const Icon(Icons.fastfood, color: Colors.grey),
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


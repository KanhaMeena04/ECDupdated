import 'dart:io';
import 'package:image/image.dart';

void main() {
  final bytes = File(r'C:\Users\samya\.gemini\antigravity-ide\brain\f323865b-58e3-4e17-af63-6c650a474310\.user_uploaded\media_1788763717747.png').readAsBytesSync();
  final image = decodeImage(bytes);
  if (image != null) {
    final cx = image.width ~/ 2;
    final cy = image.height ~/ 2;
    final pixel = image.getPixel(cx, cy);
    print('Color at center ($cx, $cy):');
    print('R: ${pixel.r}, G: ${pixel.g}, B: ${pixel.b}');
  }
}

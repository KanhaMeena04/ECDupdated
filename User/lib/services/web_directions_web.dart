import 'dart:js_interop';

@JS('fetchGoogleDirections')
external JSPromise<JSString?> _fetchDirections(JSNumber oLat, JSNumber oLng, JSNumber dLat, JSNumber dLng);

Future<String?> getWebDirections(double oLat, double oLng, double dLat, double dLng) async {
  try {
    final promise = _fetchDirections(oLat.toJS, oLng.toJS, dLat.toJS, dLng.toJS);
    final jsString = await promise.toDart;
    return jsString?.toDart;
  } catch (e) {
    return null;
  }
}

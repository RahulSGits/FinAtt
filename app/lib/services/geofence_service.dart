import 'dart:math';

/// Pure distance/geofence math - no I/O, easy to unit test.
class GeofenceService {
  static const _earthRadiusMeters = 6371000.0;

  /// Great-circle distance between two lat/lng points, in meters.
  static double distanceMeters({
    required double lat1,
    required double lng1,
    required double lat2,
    required double lng2,
  }) {
    final dLat = _degToRad(lat2 - lat1);
    final dLng = _degToRad(lng2 - lng1);
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_degToRad(lat1)) *
            cos(_degToRad(lat2)) *
            sin(dLng / 2) *
            sin(dLng / 2);
    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return _earthRadiusMeters * c;
  }

  static double _degToRad(double deg) => deg * (pi / 180);

  /// True if the point is within [radiusMeters] of the site center.
  static bool isInside({
    required double pointLat,
    required double pointLng,
    required double siteLat,
    required double siteLng,
    required double radiusMeters,
  }) {
    final distance = distanceMeters(
      lat1: pointLat,
      lng1: pointLng,
      lat2: siteLat,
      lng2: siteLng,
    );
    return distance <= radiusMeters;
  }
}

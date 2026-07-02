import 'package:geolocator/geolocator.dart';

class LocationPermissionDeniedException implements Exception {
  final String message;
  LocationPermissionDeniedException(this.message);
  @override
  String toString() => message;
}

class LocationService {
  /// Ensures location services are on and permission granted, then
  /// returns the current high-accuracy position. Throws
  /// [LocationPermissionDeniedException] if the user refuses access.
  Future<Position> getCurrentPosition() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw LocationPermissionDeniedException(
        'Location services are disabled. Please enable GPS.',
      );
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        throw LocationPermissionDeniedException(
          'Location permission denied.',
        );
      }
    }

    if (permission == LocationPermission.deniedForever) {
      throw LocationPermissionDeniedException(
        'Location permission permanently denied. Enable it in Settings.',
      );
    }

    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
      ),
    );
  }

  /// Requests background/"always" permission, needed to keep logging
  /// presence while the shift is running and the app is backgrounded.
  Future<bool> requestBackgroundPermission() async {
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.always) return true;

    permission = await Geolocator.requestPermission();
    return permission == LocationPermission.always;
  }

  Stream<Position> watchPosition({int distanceFilterMeters = 25}) {
    return Geolocator.getPositionStream(
      locationSettings: LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: distanceFilterMeters,
      ),
    );
  }
}

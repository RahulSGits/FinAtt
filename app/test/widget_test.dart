// Unit tests for the pure attendance logic: geofence distance checks and
// shift-window matching. These have no I/O so they run fast and offline.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:geoselfie_attendance/models/shift.dart';
import 'package:geoselfie_attendance/services/face_service.dart';
import 'package:geoselfie_attendance/services/geofence_service.dart';

void main() {
  group('GeofenceService.distanceMeters', () {
    test('returns ~0 for identical points', () {
      final d = GeofenceService.distanceMeters(
        lat1: 28.6139,
        lng1: 77.2090,
        lat2: 28.6139,
        lng2: 77.2090,
      );
      expect(d, lessThan(1));
    });

    test('matches a known short distance within tolerance', () {
      // ~157m apart (0.001 degrees of longitude near this latitude).
      final d = GeofenceService.distanceMeters(
        lat1: 28.6139,
        lng1: 77.2090,
        lat2: 28.6139,
        lng2: 77.2100,
      );
      expect(d, inInclusiveRange(90, 110));
    });
  });

  group('GeofenceService.isInside', () {
    const siteLat = 28.6139;
    const siteLng = 77.2090;

    test('point at the center is inside', () {
      expect(
        GeofenceService.isInside(
          pointLat: siteLat,
          pointLng: siteLng,
          siteLat: siteLat,
          siteLng: siteLng,
          radiusMeters: 150,
        ),
        isTrue,
      );
    });

    test('point well outside the radius is rejected', () {
      expect(
        GeofenceService.isInside(
          pointLat: 28.7000,
          pointLng: 77.3000,
          siteLat: siteLat,
          siteLng: siteLng,
          radiusMeters: 150,
        ),
        isFalse,
      );
    });
  });

  group('Shift.isWithinWindow', () {
    final dayShift = Shift(
      id: '1',
      name: 'Day',
      startTime: const TimeOfDay(hour: 9, minute: 0),
      endTime: const TimeOfDay(hour: 17, minute: 0),
    );

    test('time inside the window is accepted', () {
      expect(dayShift.isWithinWindow(DateTime(2026, 7, 2, 10, 30)), isTrue);
    });

    test('time before start is rejected', () {
      expect(dayShift.isWithinWindow(DateTime(2026, 7, 2, 8, 30)), isFalse);
    });

    test('overnight shift wraps past midnight', () {
      final night = Shift(
        id: '2',
        name: 'Night',
        startTime: const TimeOfDay(hour: 22, minute: 0),
        endTime: const TimeOfDay(hour: 6, minute: 0),
      );
      expect(night.isWithinWindow(DateTime(2026, 7, 2, 23, 0)), isTrue);
      expect(night.isWithinWindow(DateTime(2026, 7, 2, 3, 0)), isTrue);
      expect(night.isWithinWindow(DateTime(2026, 7, 2, 12, 0)), isFalse);
    });
  });

  group('Shift.scheduledDuration', () {
    test('computes an 8-hour day shift', () {
      final shift = Shift(
        id: '1',
        name: 'Day',
        startTime: const TimeOfDay(hour: 9, minute: 0),
        endTime: const TimeOfDay(hour: 17, minute: 0),
      );
      expect(shift.scheduledDuration, const Duration(hours: 8));
    });
  });

  group('FaceService matching', () {
    test('identical signatures match', () {
      final sig = [1.0, 2.0, 1.5, 0.8, 3.2];
      expect(FaceService.difference(sig, sig), 0);
      expect(FaceService.matches(sig, sig), isTrue);
    });

    test('a very different signature does not match', () {
      final a = [1.0, 2.0, 1.5, 0.8, 3.2];
      final b = [5.0, 9.0, 0.1, 7.0, 0.0];
      expect(FaceService.matches(a, b), isFalse);
    });

    test('mismatched lengths report infinite difference', () {
      expect(FaceService.difference([1, 2], [1, 2, 3]), double.infinity);
    });
  });
}

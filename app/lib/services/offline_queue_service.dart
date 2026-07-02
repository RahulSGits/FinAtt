import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'storage_service.dart';
import 'supabase_service.dart';

/// A check-in captured while offline, held locally until connectivity returns.
class PendingCheckIn {
  final String employeeId;
  final String date;
  final String checkInTimeIso;
  final double lat;
  final double lng;
  final String localSelfiePath;
  final bool insideGeofence;
  final bool faceVerified;

  PendingCheckIn({
    required this.employeeId,
    required this.date,
    required this.checkInTimeIso,
    required this.lat,
    required this.lng,
    required this.localSelfiePath,
    required this.insideGeofence,
    required this.faceVerified,
  });

  Map<String, dynamic> toJson() => {
        'employee_id': employeeId,
        'date': date,
        'check_in_time': checkInTimeIso,
        'lat': lat,
        'lng': lng,
        'selfie': localSelfiePath,
        'inside_geofence': insideGeofence,
        'face_verified': faceVerified,
      };

  factory PendingCheckIn.fromJson(Map<String, dynamic> j) => PendingCheckIn(
        employeeId: j['employee_id'] as String,
        date: j['date'] as String,
        checkInTimeIso: j['check_in_time'] as String,
        lat: (j['lat'] as num).toDouble(),
        lng: (j['lng'] as num).toDouble(),
        localSelfiePath: j['selfie'] as String,
        insideGeofence: j['inside_geofence'] as bool? ?? true,
        faceVerified: j['face_verified'] as bool? ?? false,
      );
}

/// Persists check-ins that couldn't reach the server and replays them once
/// the device is back online. Selfies are copied to the app documents dir so
/// they survive the camera's temp-file cleanup.
class OfflineQueueService {
  static const _key = 'pending_checkins';
  final StorageService _storage = StorageService();

  Future<void> enqueue({
    required String employeeId,
    required String date,
    required DateTime checkInTime,
    required double lat,
    required double lng,
    required File selfie,
    required bool insideGeofence,
    required bool faceVerified,
  }) async {
    final dir = await getApplicationDocumentsDirectory();
    final saved = await selfie.copy(
      '${dir.path}/queued_${DateTime.now().millisecondsSinceEpoch}.jpg',
    );

    final prefs = await SharedPreferences.getInstance();
    final list = prefs.getStringList(_key) ?? [];
    list.add(jsonEncode(PendingCheckIn(
      employeeId: employeeId,
      date: date,
      checkInTimeIso: checkInTime.toIso8601String(),
      lat: lat,
      lng: lng,
      localSelfiePath: saved.path,
      insideGeofence: insideGeofence,
      faceVerified: faceVerified,
    ).toJson()));
    await prefs.setStringList(_key, list);
  }

  Future<int> pendingCount() async {
    final prefs = await SharedPreferences.getInstance();
    return (prefs.getStringList(_key) ?? []).length;
  }

  /// Uploads and inserts every queued check-in. Items that sync successfully
  /// are removed; anything that still fails stays queued for next time.
  Future<int> syncPending() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getStringList(_key) ?? [];
    if (raw.isEmpty) return 0;

    final remaining = <String>[];
    var synced = 0;

    for (final entry in raw) {
      try {
        final item = PendingCheckIn.fromJson(
          jsonDecode(entry) as Map<String, dynamic>,
        );
        final file = File(item.localSelfiePath);
        String? selfiePath;
        if (file.existsSync()) {
          selfiePath = await _storage.uploadSelfie(
            employeeId: item.employeeId,
            file: file,
          );
        }

        await SupabaseService.client.from('attendance_sessions').insert({
          'employee_id': item.employeeId,
          'date': item.date,
          'check_in_time': item.checkInTimeIso,
          'check_in_lat': item.lat,
          'check_in_lng': item.lng,
          'selfie_url': selfiePath,
          'inside_geofence': item.insideGeofence,
          'face_verified': item.faceVerified,
        });

        if (file.existsSync()) {
          try {
            file.deleteSync();
          } catch (_) {}
        }
        synced++;
      } catch (_) {
        remaining.add(entry);
      }
    }

    await prefs.setStringList(_key, remaining);
    return synced;
  }
}

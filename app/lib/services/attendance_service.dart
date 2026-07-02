import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:geolocator/geolocator.dart';

import '../models/attendance_session.dart';
import '../models/shift.dart';
import '../models/site.dart';
import 'face_service.dart';
import 'geofence_service.dart';
import 'location_service.dart';
import 'offline_queue_service.dart';
import 'storage_service.dart';
import 'supabase_service.dart';

class CheckInResult {
  final bool success;
  final String message;
  final bool insideGeofence;
  final bool withinShiftWindow;

  CheckInResult({
    required this.success,
    required this.message,
    required this.insideGeofence,
    required this.withinShiftWindow,
  });
}

class AttendanceService {
  final LocationService _locationService = LocationService();
  final StorageService _storageService = StorageService();
  final FaceService _faceService = FaceService();
  final OfflineQueueService _offlineQueue = OfflineQueueService();

  String get _todayDate => DateTime.now().toIso8601String().substring(0, 10);

  Future<Site?> getSite(String siteId) async {
    final row = await SupabaseService.client
        .from('sites')
        .select()
        .eq('id', siteId)
        .maybeSingle();
    return row == null ? null : Site.fromMap(row);
  }

  Future<Shift?> getShift(String shiftId) async {
    final row = await SupabaseService.client
        .from('shifts')
        .select()
        .eq('id', shiftId)
        .maybeSingle();
    return row == null ? null : Shift.fromMap(row);
  }

  /// Returns today's open session (checked in, not checked out) if any.
  Future<AttendanceSession?> getOpenSession(String employeeId) async {
    final row = await SupabaseService.client
        .from('attendance_sessions')
        .select()
        .eq('employee_id', employeeId)
        .eq('date', _todayDate)
        .isFilter('check_out_time', null)
        .order('check_in_time', ascending: false)
        .maybeSingle();
    return row == null ? null : AttendanceSession.fromMap(row);
  }

  Future<List<AttendanceSession>> getSessionsForDate(
    String employeeId,
    DateTime date,
  ) async {
    final dateStr = date.toIso8601String().substring(0, 10);
    final rows = await SupabaseService.client
        .from('attendance_sessions')
        .select()
        .eq('employee_id', employeeId)
        .eq('date', dateStr)
        .order('check_in_time');
    return rows.map<AttendanceSession>(AttendanceSession.fromMap).toList();
  }

  /// Captures current location, validates geofence + shift window, uploads
  /// the selfie, and writes a new attendance_sessions row.
  Future<CheckInResult> checkIn({
    required String employeeId,
    required Site site,
    required Shift shift,
    required File selfieFile,
    List<double>? enrolledFaceSignature,
  }) async {
    // 1. Face liveness / quality gate + 1:1 identity match.
    final faceResult = await _faceService.analyze(selfieFile);
    if (!faceResult.ok) {
      return CheckInResult(
        success: false,
        message: faceResult.message,
        insideGeofence: false,
        withinShiftWindow: false,
      );
    }
    if (enrolledFaceSignature != null && faceResult.signature != null) {
      if (!FaceService.matches(enrolledFaceSignature, faceResult.signature!)) {
        return CheckInResult(
          success: false,
          message: "Face doesn't match the enrolled employee.",
          insideGeofence: false,
          withinShiftWindow: false,
        );
      }
    }

    // 2. Location.
    final Position position;
    try {
      position = await _locationService.getCurrentPosition();
    } on LocationPermissionDeniedException catch (e) {
      return CheckInResult(
        success: false,
        message: e.message,
        insideGeofence: false,
        withinShiftWindow: false,
      );
    }

    final now = DateTime.now();
    final withinWindow = shift.isWithinWindow(now);
    final insideGeofence = GeofenceService.isInside(
      pointLat: position.latitude,
      pointLng: position.longitude,
      siteLat: site.latitude,
      siteLng: site.longitude,
      radiusMeters: site.radiusMeters,
    );

    if (!withinWindow) {
      return CheckInResult(
        success: false,
        message: 'Outside scheduled shift hours (${_formatShift(shift)}).',
        insideGeofence: insideGeofence,
        withinShiftWindow: false,
      );
    }

    if (!insideGeofence) {
      return CheckInResult(
        success: false,
        message: 'You are outside the ${site.name} location radius.',
        insideGeofence: false,
        withinShiftWindow: true,
      );
    }

    // 3. Persist — online if possible, otherwise queue for later sync.
    final offline = await _isOffline();
    if (offline) {
      return _queueOffline(employeeId, now, position, selfieFile, site);
    }

    try {
      final selfiePath = await _storageService.uploadSelfie(
        employeeId: employeeId,
        file: selfieFile,
      );

      await SupabaseService.client.from('attendance_sessions').insert({
        'employee_id': employeeId,
        'date': _todayDate,
        'check_in_time': now.toIso8601String(),
        'check_in_lat': position.latitude,
        'check_in_lng': position.longitude,
        'selfie_url': selfiePath,
        'inside_geofence': true,
        'face_verified': enrolledFaceSignature != null,
      });

      return CheckInResult(
        success: true,
        message: 'Checked in at ${site.name}.',
        insideGeofence: true,
        withinShiftWindow: true,
      );
    } catch (_) {
      // Network hiccup mid-request: don't lose the check-in.
      return _queueOffline(employeeId, now, position, selfieFile, site);
    }
  }

  Future<bool> _isOffline() async {
    final result = await Connectivity().checkConnectivity();
    return result.contains(ConnectivityResult.none) || result.isEmpty;
  }

  Future<CheckInResult> _queueOffline(
    String employeeId,
    DateTime now,
    Position position,
    File selfieFile,
    Site site,
  ) async {
    await _offlineQueue.enqueue(
      employeeId: employeeId,
      date: _todayDate,
      checkInTime: now,
      lat: position.latitude,
      lng: position.longitude,
      selfie: selfieFile,
      insideGeofence: true,
      faceVerified: true,
    );
    return CheckInResult(
      success: true,
      message: 'No connection — check-in saved offline and will sync automatically.',
      insideGeofence: true,
      withinShiftWindow: true,
    );
  }

  Future<CheckInResult> checkOut({required String sessionId}) async {
    final Position position;
    try {
      position = await _locationService.getCurrentPosition();
    } on LocationPermissionDeniedException catch (e) {
      return CheckInResult(
        success: false,
        message: e.message,
        insideGeofence: false,
        withinShiftWindow: false,
      );
    }

    await SupabaseService.client.from('attendance_sessions').update({
      'check_out_time': DateTime.now().toIso8601String(),
      'check_out_lat': position.latitude,
      'check_out_lng': position.longitude,
    }).eq('id', sessionId);

    return CheckInResult(
      success: true,
      message: 'Checked out.',
      insideGeofence: true,
      withinShiftWindow: true,
    );
  }

  String _formatShift(Shift shift) {
    String two(int n) => n.toString().padLeft(2, '0');
    return '${two(shift.startTime.hour)}:${two(shift.startTime.minute)} - '
        '${two(shift.endTime.hour)}:${two(shift.endTime.minute)}';
  }
}

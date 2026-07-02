/// A single check-in -> check-out (or ongoing) presence session within a day.
class AttendanceSession {
  final String id;
  final String employeeId;
  final DateTime date;
  final DateTime checkInTime;
  final DateTime? checkOutTime;
  final double checkInLat;
  final double checkInLng;
  final double? checkOutLat;
  final double? checkOutLng;
  final String? selfieUrl;
  final bool insideGeofence;

  AttendanceSession({
    required this.id,
    required this.employeeId,
    required this.date,
    required this.checkInTime,
    this.checkOutTime,
    required this.checkInLat,
    required this.checkInLng,
    this.checkOutLat,
    this.checkOutLng,
    this.selfieUrl,
    required this.insideGeofence,
  });

  Duration get duration {
    final end = checkOutTime ?? DateTime.now();
    return end.difference(checkInTime);
  }

  factory AttendanceSession.fromMap(Map<String, dynamic> map) {
    return AttendanceSession(
      id: map['id'] as String,
      employeeId: map['employee_id'] as String,
      date: DateTime.parse(map['date'] as String),
      checkInTime: DateTime.parse(map['check_in_time'] as String),
      checkOutTime: map['check_out_time'] != null
          ? DateTime.parse(map['check_out_time'] as String)
          : null,
      checkInLat: (map['check_in_lat'] as num).toDouble(),
      checkInLng: (map['check_in_lng'] as num).toDouble(),
      checkOutLat: (map['check_out_lat'] as num?)?.toDouble(),
      checkOutLng: (map['check_out_lng'] as num?)?.toDouble(),
      selfieUrl: map['selfie_url'] as String?,
      insideGeofence: map['inside_geofence'] as bool? ?? true,
    );
  }
}

enum AttendanceStatus { present, absent, halfDay, onLeave, pending }

AttendanceStatus statusFromString(String value) {
  return AttendanceStatus.values.firstWhere(
    (s) => s.name == value,
    orElse: () => AttendanceStatus.pending,
  );
}

/// Daily aggregate: total hours present at the site and final status.
class AttendanceDay {
  final String id;
  final String employeeId;
  final DateTime date;
  final Duration totalPresentDuration;
  final AttendanceStatus status;

  AttendanceDay({
    required this.id,
    required this.employeeId,
    required this.date,
    required this.totalPresentDuration,
    required this.status,
  });

  factory AttendanceDay.fromMap(Map<String, dynamic> map) {
    return AttendanceDay(
      id: map['id'] as String,
      employeeId: map['employee_id'] as String,
      date: DateTime.parse(map['date'] as String),
      totalPresentDuration: Duration(
        seconds: (map['total_present_seconds'] as num?)?.toInt() ?? 0,
      ),
      status: statusFromString(map['status'] as String? ?? 'pending'),
    );
  }
}

import 'package:flutter/material.dart';

class Shift {
  final String id;
  final String name;
  final TimeOfDay startTime;
  final TimeOfDay endTime;

  /// Minimum fraction (0-1) of the shift duration an employee must be
  /// inside the geofence for the day to count as Present rather than Absent.
  final double minPresencePercent;

  Shift({
    required this.id,
    required this.name,
    required this.startTime,
    required this.endTime,
    this.minPresencePercent = 0.5,
  });

  Duration get scheduledDuration {
    final startMinutes = startTime.hour * 60 + startTime.minute;
    final endMinutes = endTime.hour * 60 + endTime.minute;
    final diff = endMinutes - startMinutes;
    return Duration(minutes: diff > 0 ? diff : diff + 24 * 60);
  }

  /// True if [time] falls within this shift's start/end window on the same
  /// calendar day (handles overnight shifts where end < start).
  bool isWithinWindow(DateTime time) {
    final minutesOfDay = time.hour * 60 + time.minute;
    final startMinutes = startTime.hour * 60 + startTime.minute;
    final endMinutes = endTime.hour * 60 + endTime.minute;

    if (endMinutes > startMinutes) {
      return minutesOfDay >= startMinutes && minutesOfDay <= endMinutes;
    }
    // Overnight shift, e.g. 22:00 -> 06:00.
    return minutesOfDay >= startMinutes || minutesOfDay <= endMinutes;
  }

  static TimeOfDay _parseTime(String value) {
    final parts = value.split(':');
    return TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1]));
  }

  static String _formatTime(TimeOfDay time) {
    final h = time.hour.toString().padLeft(2, '0');
    final m = time.minute.toString().padLeft(2, '0');
    return '$h:$m:00';
  }

  factory Shift.fromMap(Map<String, dynamic> map) {
    return Shift(
      id: map['id'] as String,
      name: map['name'] as String,
      startTime: _parseTime(map['start_time'] as String),
      endTime: _parseTime(map['end_time'] as String),
      minPresencePercent:
          (map['min_presence_percent'] as num?)?.toDouble() ?? 0.5,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'start_time': _formatTime(startTime),
      'end_time': _formatTime(endTime),
      'min_presence_percent': minPresencePercent,
    };
  }
}

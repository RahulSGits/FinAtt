import 'package:flutter/material.dart';

import '../models/attendance_session.dart';
import '../models/profile.dart';
import '../models/shift.dart';
import '../models/site.dart';

/// Static sample data so the UI preview renders without a backend.
/// None of this touches Supabase, dart:io, or any mobile-only plugin, so it
/// compiles and runs in a browser.

final DateTime kPreviewMonth = DateTime(2026, 7, 1);

final List<Site> mockSites = [
  Site(
    id: 's1',
    name: 'Head Office',
    latitude: 28.6139,
    longitude: 77.2090,
    radiusMeters: 150,
  ),
  Site(
    id: 's2',
    name: 'Warehouse',
    latitude: 28.5355,
    longitude: 77.3910,
    radiusMeters: 250,
  ),
];

final List<Shift> mockShifts = [
  Shift(
    id: 'sh1',
    name: 'Morning',
    startTime: const TimeOfDay(hour: 9, minute: 0),
    endTime: const TimeOfDay(hour: 17, minute: 0),
  ),
  Shift(
    id: 'sh2',
    name: 'Evening',
    startTime: const TimeOfDay(hour: 14, minute: 0),
    endTime: const TimeOfDay(hour: 22, minute: 0),
  ),
];

Profile _emp(String id, String name, String email, {String? site, String? shift, String? dept, bool enrolled = true}) {
  return Profile(
    id: id,
    fullName: name,
    email: email,
    role: UserRole.employee,
    siteId: site,
    shiftId: shift,
    department: dept,
    faceEnrolled: enrolled,
    createdAt: DateTime(2026, 1, 1),
  );
}

final Profile mockMe = _emp(
  'e1', 'Asha Nair', 'asha@example.com',
  site: 's1', shift: 'sh1', dept: 'Operations',
);

final List<Profile> mockEmployees = [
  mockMe,
  _emp('e2', 'Rahul Verma', 'rahul@example.com', site: 's1', shift: 'sh1', dept: 'Sales'),
  _emp('e3', 'Meera Iyer', 'meera@example.com', site: 's2', shift: 'sh2', dept: 'Logistics'),
  _emp('e4', 'Sam Cole', 'sam@example.com', enrolled: false),
];

/// Per-employee monthly rollup used by the admin Reports tab.
class MockRow {
  final Profile profile;
  final int present, half, absent, leave, workingDays;
  final Duration hours;
  const MockRow(this.profile, this.present, this.half, this.absent,
      this.leave, this.workingDays, this.hours);
  double get pct => workingDays == 0 ? 0 : (present + half) / workingDays * 100;
}

final List<MockRow> mockCompany = [
  MockRow(mockEmployees[0], 18, 2, 1, 1, 22, const Duration(hours: 151, minutes: 30)),
  MockRow(mockEmployees[1], 20, 0, 2, 0, 22, const Duration(hours: 160)),
  MockRow(mockEmployees[2], 15, 3, 3, 1, 22, const Duration(hours: 128, minutes: 15)),
  MockRow(mockEmployees[3], 0, 0, 0, 0, 22, Duration.zero),
];

/// Colored calendar days for the signed-in employee's current month.
List<AttendanceDay> mockMyMonth() {
  final days = <AttendanceDay>[];
  final statuses = [
    AttendanceStatus.present,
    AttendanceStatus.present,
    AttendanceStatus.halfDay,
    AttendanceStatus.present,
    AttendanceStatus.absent,
    AttendanceStatus.onLeave,
    AttendanceStatus.present,
  ];
  for (var d = 1; d <= 24; d++) {
    final date = DateTime(kPreviewMonth.year, kPreviewMonth.month, d);
    if (date.weekday == DateTime.sunday) continue; // day off
    final status = statuses[d % statuses.length];
    final hours = switch (status) {
      AttendanceStatus.present => const Duration(hours: 8, minutes: 12),
      AttendanceStatus.halfDay => const Duration(hours: 3, minutes: 40),
      _ => Duration.zero,
    };
    days.add(AttendanceDay(
      id: 'd$d',
      employeeId: mockMe.id,
      date: date,
      totalPresentDuration: hours,
      status: status,
    ));
  }
  return days;
}

class MockLeave {
  final String name;
  final DateTime start;
  final DateTime end;
  final String reason;
  String status;
  MockLeave(this.name, this.start, this.end, this.reason, this.status);
}

List<MockLeave> mockLeaves() => [
      MockLeave('Meera Iyer', DateTime(2026, 7, 10), DateTime(2026, 7, 11),
          'Family function', 'pending'),
      MockLeave('Rahul Verma', DateTime(2026, 7, 3), DateTime(2026, 7, 3),
          'Medical', 'approved'),
      MockLeave('Asha Nair', DateTime(2026, 7, 18), DateTime(2026, 7, 19),
          'Personal', 'pending'),
    ];

String hm(Duration d) => '${d.inHours}h ${d.inMinutes.remainder(60)}m';

String siteName(String? id) =>
    mockSites.where((s) => s.id == id).map((s) => s.name).firstOrNull ?? 'No site';
String shiftName(String? id) =>
    mockShifts.where((s) => s.id == id).map((s) => s.name).firstOrNull ?? 'No shift';

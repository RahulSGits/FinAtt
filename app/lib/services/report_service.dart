import '../models/attendance_session.dart';
import '../models/profile.dart';
import 'supabase_service.dart';

class MonthlySummary {
  final int presentDays;
  final int absentDays;
  final int halfDays;
  final int onLeaveDays;
  final Duration totalHours;
  final int totalWorkingDays;

  MonthlySummary({
    required this.presentDays,
    required this.absentDays,
    required this.halfDays,
    required this.onLeaveDays,
    required this.totalHours,
    required this.totalWorkingDays,
  });

  double get attendancePercent =>
      totalWorkingDays == 0 ? 0 : (presentDays + halfDays) / totalWorkingDays * 100;
}

class EmployeeMonthlyRow {
  final Profile profile;
  final MonthlySummary summary;

  EmployeeMonthlyRow({required this.profile, required this.summary});
}

class ReportService {
  /// Fetches every attendance_days row for [employeeId] within the given
  /// calendar month.
  Future<List<AttendanceDay>> getMonthDays(
    String employeeId,
    DateTime month,
  ) async {
    final start = DateTime(month.year, month.month, 1);
    final end = DateTime(month.year, month.month + 1, 1);

    final rows = await SupabaseService.client
        .from('attendance_days')
        .select()
        .eq('employee_id', employeeId)
        .gte('date', start.toIso8601String().substring(0, 10))
        .lt('date', end.toIso8601String().substring(0, 10))
        .order('date');

    return rows.map<AttendanceDay>(AttendanceDay.fromMap).toList();
  }

  MonthlySummary summarize(List<AttendanceDay> days) {
    var present = 0, absent = 0, half = 0, leave = 0;
    var totalSeconds = 0;

    for (final day in days) {
      totalSeconds += day.totalPresentDuration.inSeconds;
      switch (day.status) {
        case AttendanceStatus.present:
          present++;
          break;
        case AttendanceStatus.absent:
          absent++;
          break;
        case AttendanceStatus.halfDay:
          half++;
          break;
        case AttendanceStatus.onLeave:
          leave++;
          break;
        case AttendanceStatus.pending:
          break;
      }
    }

    return MonthlySummary(
      presentDays: present,
      absentDays: absent,
      halfDays: half,
      onLeaveDays: leave,
      totalHours: Duration(seconds: totalSeconds),
      totalWorkingDays: days.length,
    );
  }

  /// Admin view: every employee's monthly summary for the given month.
  Future<List<EmployeeMonthlyRow>> getAllEmployeesMonthlySummary(
    DateTime month,
  ) async {
    final profileRows = await SupabaseService.client
        .from('profiles')
        .select()
        .eq('role', 'employee');
    final profiles = profileRows.map<Profile>(Profile.fromMap).toList();

    final results = <EmployeeMonthlyRow>[];
    for (final profile in profiles) {
      final days = await getMonthDays(profile.id, month);
      results.add(
        EmployeeMonthlyRow(profile: profile, summary: summarize(days)),
      );
    }
    return results;
  }
}

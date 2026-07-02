import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:printing/printing.dart';
import 'package:table_calendar/table_calendar.dart';

import '../../models/attendance_session.dart';
import '../../models/profile.dart';
import '../../providers.dart';
import '../../services/report_service.dart';
import '../../widgets/summary_stat_card.dart';
import 'day_detail_screen.dart';

class EmployeeDashboardScreen extends ConsumerStatefulWidget {
  const EmployeeDashboardScreen({super.key});

  @override
  ConsumerState<EmployeeDashboardScreen> createState() =>
      _EmployeeDashboardScreenState();
}

class _EmployeeDashboardScreenState
    extends ConsumerState<EmployeeDashboardScreen> {
  DateTime _focusedMonth = DateTime.now();
  List<AttendanceDay> _days = [];
  MonthlySummary? _summary;
  bool _loading = true;
  bool _exporting = false;
  String? _employeeId;
  Profile? _profile;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final profile = await ref.read(currentProfileProvider.future);
    if (profile == null) return;
    _employeeId = profile.id;
    _profile = profile;

    final reportService = ref.read(reportServiceProvider);
    final days = await reportService.getMonthDays(profile.id, _focusedMonth);
    final summary = reportService.summarize(days);

    if (mounted) {
      setState(() {
        _days = days;
        _summary = summary;
        _loading = false;
      });
    }
  }

  Future<void> _changeMonth(int delta) async {
    setState(() {
      _focusedMonth =
          DateTime(_focusedMonth.year, _focusedMonth.month + delta, 1);
    });
    await _load();
  }

  Future<void> _exportPdf() async {
    final profile = _profile;
    final summary = _summary;
    if (profile == null || summary == null) return;
    setState(() => _exporting = true);
    try {
      final file = await ref.read(exportServiceProvider).employeeMonthlyPdf(
            profile: profile,
            month: _focusedMonth,
            days: _days,
            summary: summary,
          );
      await Printing.sharePdf(
        bytes: await file.readAsBytes(),
        filename: file.uri.pathSegments.last,
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Export failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }

  AttendanceDay? _dayFor(DateTime date) {
    for (final d in _days) {
      if (d.date.year == date.year &&
          d.date.month == date.month &&
          d.date.day == date.day) {
        return d;
      }
    }
    return null;
  }

  Color _statusColor(AttendanceStatus status) {
    switch (status) {
      case AttendanceStatus.present:
        return Colors.green;
      case AttendanceStatus.halfDay:
        return Colors.orange;
      case AttendanceStatus.absent:
        return Colors.red;
      case AttendanceStatus.onLeave:
        return Colors.blue;
      case AttendanceStatus.pending:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My monthly report'),
        actions: [
          IconButton(
            icon: _exporting
                ? const SizedBox(
                    height: 18,
                    width: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.picture_as_pdf),
            tooltip: 'Export PDF',
            onPressed: _exporting || _loading ? null : _exportPdf,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.chevron_left),
                        onPressed: () => _changeMonth(-1),
                      ),
                      Text(
                        '${_monthName(_focusedMonth.month)} ${_focusedMonth.year}',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      IconButton(
                        icon: const Icon(Icons.chevron_right),
                        onPressed: () => _changeMonth(1),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      SummaryStatCard(
                        label: 'Present',
                        value: '${_summary?.presentDays ?? 0}',
                        color: Colors.green,
                      ),
                      SummaryStatCard(
                        label: 'Half day',
                        value: '${_summary?.halfDays ?? 0}',
                        color: Colors.orange,
                      ),
                      SummaryStatCard(
                        label: 'Absent',
                        value: '${_summary?.absentDays ?? 0}',
                        color: Colors.red,
                      ),
                      SummaryStatCard(
                        label: 'On leave',
                        value: '${_summary?.onLeaveDays ?? 0}',
                        color: Colors.blue,
                      ),
                      SummaryStatCard(
                        label: 'Total hours',
                        value: _formatDuration(_summary?.totalHours),
                        color: Colors.purple,
                      ),
                      SummaryStatCard(
                        label: 'Attendance %',
                        value:
                            '${_summary?.attendancePercent.toStringAsFixed(0) ?? 0}%',
                        color: Colors.teal,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TableCalendar(
                    firstDay: DateTime.utc(2020, 1, 1),
                    lastDay: DateTime.utc(2035, 12, 31),
                    focusedDay: _focusedMonth,
                    headerVisible: false,
                    onPageChanged: (day) => setState(() => _focusedMonth = day),
                    calendarBuilders: CalendarBuilders(
                      defaultBuilder: (context, day, _) {
                        final attendanceDay = _dayFor(day);
                        return _dayCell(context, day, attendanceDay);
                      },
                      todayBuilder: (context, day, _) {
                        final attendanceDay = _dayFor(day);
                        return _dayCell(context, day, attendanceDay,
                            isToday: true);
                      },
                    ),
                    onDaySelected: (day, _) {
                      final attendanceDay = _dayFor(day);
                      if (attendanceDay != null && _employeeId != null) {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => DayDetailScreen(
                              employeeId: _employeeId!,
                              date: day,
                              attendanceDay: attendanceDay,
                            ),
                          ),
                        );
                      }
                    },
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Tap a colored day for the detailed check-in/out log.',
                    style: TextStyle(color: Colors.grey),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _dayCell(
    BuildContext context,
    DateTime day,
    AttendanceDay? attendanceDay, {
    bool isToday = false,
  }) {
    final color =
        attendanceDay != null ? _statusColor(attendanceDay.status) : null;
    return Container(
      margin: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: color?.withValues(alpha: 0.15),
        shape: BoxShape.circle,
        border: isToday ? Border.all(color: Colors.blue, width: 2) : null,
      ),
      alignment: Alignment.center,
      child: Text(
        '${day.day}',
        style: TextStyle(color: color ?? Colors.black87),
      ),
    );
  }

  String _formatDuration(Duration? d) {
    if (d == null) return '0h 0m';
    return '${d.inHours}h ${d.inMinutes.remainder(60)}m';
  }

  String _monthName(int month) {
    const names = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return names[month - 1];
  }
}

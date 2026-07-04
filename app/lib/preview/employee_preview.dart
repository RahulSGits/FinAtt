import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:table_calendar/table_calendar.dart';

import '../models/attendance_session.dart';
import '../widgets/status_chip.dart';
import '../widgets/summary_stat_card.dart';
import 'mock_data.dart';

/// Employee home (check-in card) for the preview.
class EmployeePreview extends StatefulWidget {
  const EmployeePreview({super.key});

  @override
  State<EmployeePreview> createState() => _EmployeePreviewState();
}

class _EmployeePreviewState extends State<EmployeePreview> {
  bool _checkedIn = false;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Hello, ${mockMe.fullName}',
                style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 24),
            Icon(
              _checkedIn ? Icons.check_circle : Icons.radio_button_unchecked,
              size: 72,
              color: _checkedIn ? Colors.green : Colors.grey,
            ),
            const SizedBox(height: 8),
            Text(_checkedIn ? 'Currently checked in' : 'Not checked in'),
            const SizedBox(height: 32),
            FilledButton.icon(
              icon: Icon(_checkedIn ? Icons.logout : Icons.camera_alt),
              label: Text(_checkedIn ? 'Check out' : 'Check in with selfie'),
              onPressed: () {
                setState(() => _checkedIn = !_checkedIn);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(_checkedIn
                        ? 'Preview: face + GPS check would run here, then you are checked in.'
                        : 'Preview: checked out.'),
                  ),
                );
              },
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              icon: const Icon(Icons.bar_chart),
              label: const Text('My monthly report'),
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(
                    builder: (_) => const EmployeeDashboardPreview()),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Employee monthly report: calendar + stat cards, matching the real screen.
class EmployeeDashboardPreview extends StatelessWidget {
  const EmployeeDashboardPreview({super.key});

  Color _statusColor(AttendanceStatus s) => switch (s) {
        AttendanceStatus.present => Colors.green,
        AttendanceStatus.halfDay => Colors.orange,
        AttendanceStatus.absent => Colors.red,
        AttendanceStatus.onLeave => Colors.blue,
        AttendanceStatus.pending => Colors.grey,
      };

  @override
  Widget build(BuildContext context) {
    final days = mockMyMonth();
    final present = days.where((d) => d.status == AttendanceStatus.present).length;
    final half = days.where((d) => d.status == AttendanceStatus.halfDay).length;
    final absent = days.where((d) => d.status == AttendanceStatus.absent).length;
    final leave = days.where((d) => d.status == AttendanceStatus.onLeave).length;
    final totalSecs =
        days.fold<int>(0, (a, d) => a + d.totalPresentDuration.inSeconds);
    final totalHours = Duration(seconds: totalSecs);
    final pct = days.isEmpty ? 0 : (present + half) / days.length * 100;

    AttendanceDay? dayFor(DateTime day) {
      for (final d in days) {
        if (d.date.year == day.year &&
            d.date.month == day.month &&
            d.date.day == day.day) {
          return d;
        }
      }
      return null;
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My monthly report'),
        actions: [
          IconButton(
            icon: const Icon(Icons.picture_as_pdf),
            tooltip: 'Export PDF',
            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                  content: Text('PDF export runs on device (disabled in preview).')),
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(DateFormat('MMMM yyyy').format(kPreviewMonth),
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            alignment: WrapAlignment.center,
            children: [
              SummaryStatCard(label: 'Present', value: '$present', color: Colors.green),
              SummaryStatCard(label: 'Half day', value: '$half', color: Colors.orange),
              SummaryStatCard(label: 'Absent', value: '$absent', color: Colors.red),
              SummaryStatCard(label: 'On leave', value: '$leave', color: Colors.blue),
              SummaryStatCard(label: 'Total hours', value: hm(totalHours), color: Colors.purple),
              SummaryStatCard(label: 'Attendance %', value: '${pct.toStringAsFixed(0)}%', color: Colors.teal),
            ],
          ),
          const SizedBox(height: 16),
          TableCalendar(
            firstDay: DateTime.utc(2020, 1, 1),
            lastDay: DateTime.utc(2035, 12, 31),
            focusedDay: kPreviewMonth,
            headerVisible: false,
            calendarBuilders: CalendarBuilders(
              defaultBuilder: (context, day, _) {
                final ad = dayFor(day);
                final color = ad != null ? _statusColor(ad.status) : null;
                return Container(
                  margin: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: color?.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text('${day.day}',
                      style: TextStyle(color: color ?? Colors.black87)),
                );
              },
            ),
            onDaySelected: (day, _) {
              final ad = dayFor(day);
              if (ad == null) return;
              showModalBottomSheet(
                context: context,
                builder: (_) => Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(DateFormat('EEEE, d MMM yyyy').format(day),
                          style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          StatusChip(status: ad.status),
                          Text('${hm(ad.totalPresentDuration)} present'),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Text('Session log (sample):',
                          style: TextStyle(color: Colors.grey)),
                      const ListTile(
                        leading: Icon(Icons.login),
                        title: Text('Check in 09:04 · inside Head Office'),
                        subtitle: Text('Face verified · selfie stored'),
                      ),
                      const ListTile(
                        leading: Icon(Icons.logout),
                        title: Text('Check out 17:16'),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 8),
          const Text('Tap a colored day for the detailed log.',
              style: TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }
}

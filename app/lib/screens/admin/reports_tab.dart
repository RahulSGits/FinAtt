import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:open_filex/open_filex.dart';

import '../../providers.dart';
import '../../services/report_service.dart';

/// Company-wide monthly report: one row per employee showing days present
/// out of working days and total hours worked, plus a comparison bar chart.
class ReportsTab extends ConsumerStatefulWidget {
  const ReportsTab({super.key});

  @override
  ConsumerState<ReportsTab> createState() => _ReportsTabState();
}

class _ReportsTabState extends ConsumerState<ReportsTab> {
  DateTime _month = DateTime.now();
  List<EmployeeMonthlyRow> _rows = [];
  bool _loading = true;
  bool _exporting = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final rows = await ref
        .read(reportServiceProvider)
        .getAllEmployeesMonthlySummary(_month);
    if (mounted) {
      setState(() {
        _rows = rows;
        _loading = false;
      });
    }
  }

  void _changeMonth(int delta) {
    setState(() => _month = DateTime(_month.year, _month.month + delta, 1));
    _load();
  }

  Future<void> _exportExcel() async {
    if (_rows.isEmpty) return;
    setState(() => _exporting = true);
    try {
      final file = await ref.read(exportServiceProvider).companyMonthlyExcel(
            month: _month,
            rows: _rows,
          );
      await OpenFilex.open(file.path);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Export failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());

    return RefreshIndicator(
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
                '${_monthName(_month.month)} ${_month.year}',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              IconButton(
                icon: const Icon(Icons.chevron_right),
                onPressed: () => _changeMonth(1),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              onPressed: _exporting || _rows.isEmpty ? null : _exportExcel,
              icon: _exporting
                  ? const SizedBox(
                      height: 16,
                      width: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.table_view),
              label: const Text('Export Excel'),
            ),
          ),
          const SizedBox(height: 8),
          if (_rows.isEmpty)
            const Padding(
              padding: EdgeInsets.all(32),
              child: Center(child: Text('No employees yet.')),
            )
          else ...[
            _AttendanceChart(rows: _rows),
            const SizedBox(height: 24),
            ..._rows.map((r) => _employeeCard(context, r)),
          ],
        ],
      ),
    );
  }

  Widget _employeeCard(BuildContext context, EmployeeMonthlyRow row) {
    final s = row.summary;
    final hours = '${s.totalHours.inHours}h ${s.totalHours.inMinutes.remainder(60)}m';
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          child: Text(
            row.profile.fullName.isNotEmpty
                ? row.profile.fullName[0].toUpperCase()
                : '?',
          ),
        ),
        title: Text(row.profile.fullName),
        subtitle: Text(
          'Present ${s.presentDays}/${s.totalWorkingDays} days  •  $hours\n'
          'Absent ${s.absentDays}  •  Half ${s.halfDays}  •  Leave ${s.onLeaveDays}',
        ),
        isThreeLine: true,
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              '${s.attendancePercent.toStringAsFixed(0)}%',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            const Text('attend.', style: TextStyle(fontSize: 11)),
          ],
        ),
      ),
    );
  }

  String _monthName(int month) {
    const names = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return names[month - 1];
  }
}

/// Simple bar chart of total hours worked per employee for the month.
class _AttendanceChart extends StatelessWidget {
  final List<EmployeeMonthlyRow> rows;
  const _AttendanceChart({required this.rows});

  @override
  Widget build(BuildContext context) {
    final maxHours = rows
        .map((r) => r.summary.totalHours.inMinutes / 60.0)
        .fold<double>(1, (a, b) => b > a ? b : a);

    return SizedBox(
      height: 200,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Total hours worked', style: TextStyle(fontSize: 12)),
          const SizedBox(height: 8),
          Expanded(
            child: BarChart(
              BarChartData(
                maxY: maxHours * 1.2,
                barGroups: [
                  for (var i = 0; i < rows.length; i++)
                    BarChartGroupData(
                      x: i,
                      barRods: [
                        BarChartRodData(
                          toY: rows[i].summary.totalHours.inMinutes / 60.0,
                          width: 16,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ],
                    ),
                ],
                titlesData: FlTitlesData(
                  leftTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: true, reservedSize: 28),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, _) {
                        final i = value.toInt();
                        if (i < 0 || i >= rows.length) return const SizedBox();
                        final name = rows[i].profile.fullName;
                        return Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            name.isNotEmpty ? name.split(' ').first : '?',
                            style: const TextStyle(fontSize: 10),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                gridData: const FlGridData(show: true, drawVerticalLine: false),
                borderData: FlBorderData(show: false),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

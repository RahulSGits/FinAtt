import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import 'mock_data.dart';

/// Admin dashboard preview: the same five tabs as the real app, with mock data.
class AdminPreview extends StatelessWidget {
  const AdminPreview({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 5,
      child: Column(
        children: [
          const Material(
            child: TabBar(
              isScrollable: true,
              tabs: [
                Tab(icon: Icon(Icons.bar_chart), text: 'Reports'),
                Tab(icon: Icon(Icons.people), text: 'Employees'),
                Tab(icon: Icon(Icons.location_on), text: 'Sites'),
                Tab(icon: Icon(Icons.schedule), text: 'Shifts'),
                Tab(icon: Icon(Icons.event_available), text: 'Leave'),
              ],
            ),
          ),
          const Expanded(
            child: TabBarView(
              children: [
                _ReportsTab(),
                _EmployeesTab(),
                _SitesTab(),
                _ShiftsTab(),
                _LeaveTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ReportsTab extends StatelessWidget {
  const _ReportsTab();

  @override
  Widget build(BuildContext context) {
    final maxHours = mockCompany
        .map((r) => r.hours.inMinutes / 60.0)
        .fold<double>(1, (a, b) => b > a ? b : a);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(DateFormat('MMMM yyyy').format(kPreviewMonth),
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleLarge),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton.icon(
            icon: const Icon(Icons.table_view),
            label: const Text('Export Excel'),
            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                  content: Text('Excel export runs on device (disabled in preview).')),
            ),
          ),
        ),
        SizedBox(
          height: 200,
          child: BarChart(
            BarChartData(
              maxY: maxHours * 1.2,
              barGroups: [
                for (var i = 0; i < mockCompany.length; i++)
                  BarChartGroupData(x: i, barRods: [
                    BarChartRodData(
                      toY: mockCompany[i].hours.inMinutes / 60.0,
                      width: 16,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ]),
              ],
              titlesData: FlTitlesData(
                leftTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: true, reservedSize: 28)),
                rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false)),
                topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false)),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    getTitlesWidget: (value, _) {
                      final i = value.toInt();
                      if (i < 0 || i >= mockCompany.length) {
                        return const SizedBox();
                      }
                      return Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          mockCompany[i].profile.fullName.split(' ').first,
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
        const SizedBox(height: 20),
        ...mockCompany.map((r) => Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                leading: CircleAvatar(
                    child: Text(r.profile.fullName[0].toUpperCase())),
                title: Text(r.profile.fullName),
                subtitle: Text(
                  'Present ${r.present}/${r.workingDays} days  •  ${hm(r.hours)}\n'
                  'Absent ${r.absent}  •  Half ${r.half}  •  Leave ${r.leave}',
                ),
                isThreeLine: true,
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('${r.pct.toStringAsFixed(0)}%',
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 18)),
                    const Text('attend.', style: TextStyle(fontSize: 11)),
                  ],
                ),
              ),
            )),
      ],
    );
  }
}

class _EmployeesTab extends StatelessWidget {
  const _EmployeesTab();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(12),
      children: mockEmployees.map((e) {
        final unassigned = e.siteId == null || e.shiftId == null;
        return Card(
          child: ListTile(
            leading: CircleAvatar(child: Text(e.fullName[0].toUpperCase())),
            title: Text(e.fullName),
            subtitle: Text('${siteName(e.siteId)} • ${shiftName(e.shiftId)}'
                '${e.department != null ? ' • ${e.department}' : ''}'),
            trailing: unassigned
                ? const Chip(
                    label: Text('Unassigned'),
                    backgroundColor: Color(0x22FF9800))
                : const Icon(Icons.edit),
            onTap: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Preview: opens assign dialog.')),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _SitesTab extends StatelessWidget {
  const _SitesTab();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: mockSites
            .map((s) => Card(
                  child: ListTile(
                    leading: const Icon(Icons.location_on),
                    title: Text(s.name),
                    subtitle: Text(
                      'lat ${s.latitude.toStringAsFixed(5)}, '
                      'lng ${s.longitude.toStringAsFixed(5)}\n'
                      'radius ${s.radiusMeters.toStringAsFixed(0)} m',
                    ),
                    isThreeLine: true,
                    trailing: const Icon(Icons.tune),
                  ),
                ))
            .toList(),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        icon: const Icon(Icons.add_location_alt),
        label: const Text('Add site'),
      ),
    );
  }
}

class _ShiftsTab extends StatelessWidget {
  const _ShiftsTab();

  String _fmt(TimeOfDay t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: mockShifts
            .map((s) => Card(
                  child: ListTile(
                    leading: const Icon(Icons.schedule),
                    title: Text(s.name),
                    subtitle: Text(
                      '${_fmt(s.startTime)} – ${_fmt(s.endTime)} '
                      '(${s.scheduledDuration.inHours}h)\n'
                      'Min presence: ${(s.minPresencePercent * 100).toStringAsFixed(0)}%',
                    ),
                    isThreeLine: true,
                  ),
                ))
            .toList(),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        icon: const Icon(Icons.add),
        label: const Text('Add shift'),
      ),
    );
  }
}

class _LeaveTab extends StatefulWidget {
  const _LeaveTab();

  @override
  State<_LeaveTab> createState() => _LeaveTabState();
}

class _LeaveTabState extends State<_LeaveTab> {
  final _leaves = mockLeaves();

  Color _c(String s) => switch (s) {
        'approved' => Colors.green,
        'rejected' => Colors.red,
        _ => Colors.orange,
      };

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('d MMM yyyy');
    return ListView(
      padding: const EdgeInsets.all(12),
      children: _leaves.map((l) {
        final pending = l.status == 'pending';
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(l.name,
                        style: const TextStyle(fontWeight: FontWeight.bold)),
                    Chip(
                      label: Text(l.status,
                          style: TextStyle(color: _c(l.status))),
                      backgroundColor: _c(l.status).withValues(alpha: 0.12),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text('${fmt.format(l.start)} → ${fmt.format(l.end)}'),
                Text(l.reason, style: const TextStyle(color: Colors.grey)),
                if (pending)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: () => setState(() => l.status = 'rejected'),
                        child: const Text('Reject'),
                      ),
                      const SizedBox(width: 8),
                      FilledButton(
                        onPressed: () => setState(() => l.status = 'approved'),
                        child: const Text('Approve'),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../models/attendance_session.dart';
import '../../providers.dart';
import '../../services/storage_service.dart';
import '../../widgets/status_chip.dart';

class DayDetailScreen extends ConsumerStatefulWidget {
  final String employeeId;
  final DateTime date;
  final AttendanceDay attendanceDay;

  const DayDetailScreen({
    super.key,
    required this.employeeId,
    required this.date,
    required this.attendanceDay,
  });

  @override
  ConsumerState<DayDetailScreen> createState() => _DayDetailScreenState();
}

class _DayDetailScreenState extends ConsumerState<DayDetailScreen> {
  List<AttendanceSession> _sessions = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final sessions = await ref
        .read(attendanceServiceProvider)
        .getSessionsForDate(widget.employeeId, widget.date);
    if (mounted) {
      setState(() {
        _sessions = sessions;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateLabel = DateFormat('EEEE, d MMM yyyy').format(widget.date);

    return Scaffold(
      appBar: AppBar(title: Text(dateLabel)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    StatusChip(status: widget.attendanceDay.status),
                    Text(
                      '${widget.attendanceDay.totalPresentDuration.inHours}h '
                      '${widget.attendanceDay.totalPresentDuration.inMinutes.remainder(60)}m present',
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if (_sessions.isEmpty)
                  const Text('No check-in sessions recorded for this day.'),
                for (final session in _sessions) _sessionTile(session),
              ],
            ),
    );
  }

  Widget _sessionTile(AttendanceSession session) {
    final timeFmt = DateFormat('HH:mm');
    return Card(
      child: ListTile(
        leading: session.selfieUrl != null
            ? FutureBuilder<String>(
                future:
                    StorageService().getSignedUrl(session.selfieUrl!),
                builder: (context, snapshot) {
                  if (!snapshot.hasData) {
                    return const SizedBox(
                      width: 40,
                      height: 40,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    );
                  }
                  return ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: Image.network(
                      snapshot.data!,
                      width: 40,
                      height: 40,
                      fit: BoxFit.cover,
                    ),
                  );
                },
              )
            : const Icon(Icons.person),
        title: Text(
          '${timeFmt.format(session.checkInTime)}'
          ' - '
          '${session.checkOutTime != null ? timeFmt.format(session.checkOutTime!) : 'ongoing'}',
        ),
        subtitle: Text(
          '${session.insideGeofence ? 'Inside geofence' : 'Outside geofence'} · '
          '${session.duration.inHours}h ${session.duration.inMinutes.remainder(60)}m',
        ),
      ),
    );
  }
}

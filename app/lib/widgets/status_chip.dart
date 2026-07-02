import 'package:flutter/material.dart';

import '../models/attendance_session.dart';

class StatusChip extends StatelessWidget {
  final AttendanceStatus status;

  const StatusChip({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      AttendanceStatus.present => ('Present', Colors.green),
      AttendanceStatus.halfDay => ('Half day', Colors.orange),
      AttendanceStatus.absent => ('Absent', Colors.red),
      AttendanceStatus.onLeave => ('On leave', Colors.blue),
      AttendanceStatus.pending => ('Pending', Colors.grey),
    };

    return Chip(
      label: Text(label, style: TextStyle(color: color)),
      backgroundColor: color.withValues(alpha: 0.12),
      side: BorderSide(color: color.withValues(alpha: 0.4)),
    );
  }
}

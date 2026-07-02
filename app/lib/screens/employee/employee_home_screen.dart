import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/attendance_session.dart';
import '../../models/profile.dart';
import '../../providers.dart';
import '../../services/notification_service.dart';
import '../auth/login_screen.dart';
import 'employee_dashboard_screen.dart';
import 'face_enrollment_screen.dart';
import 'selfie_camera_screen.dart';

class EmployeeHomeScreen extends ConsumerStatefulWidget {
  const EmployeeHomeScreen({super.key});

  @override
  ConsumerState<EmployeeHomeScreen> createState() => _EmployeeHomeScreenState();
}

class _EmployeeHomeScreenState extends ConsumerState<EmployeeHomeScreen> {
  AttendanceSession? _openSession;
  bool _loading = true;
  bool _busy = false;
  String? _message;
  int _pendingOffline = 0;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    await _syncOffline();
    await _refreshOpenSession();
    await _scheduleReminders();
  }

  /// Requests notification permission and schedules daily check-in / check-out
  /// reminders aligned to the employee's assigned shift.
  Future<void> _scheduleReminders() async {
    try {
      final profile = await ref.read(currentProfileProvider.future);
      if (profile?.shiftId == null) return;
      final shift =
          await ref.read(attendanceServiceProvider).getShift(profile!.shiftId!);
      if (shift == null) return;
      await NotificationService.instance.requestPermissions();
      await NotificationService.instance.scheduleShiftReminders(
        start: shift.startTime,
        end: shift.endTime,
      );
    } catch (_) {
      // Reminders are best-effort; ignore failures.
    }
  }

  Future<void> _syncOffline() async {
    try {
      final synced = await ref.read(offlineQueueProvider).syncPending();
      final pending = await ref.read(offlineQueueProvider).pendingCount();
      if (mounted) {
        setState(() => _pendingOffline = pending);
        if (synced > 0) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Synced $synced offline check-in(s).')),
          );
        }
      }
    } catch (_) {
      // best-effort; will retry next open
    }
  }

  Future<void> _refreshOpenSession() async {
    final profile = await ref.read(currentProfileProvider.future);
    if (profile == null) return;
    final session =
        await ref.read(attendanceServiceProvider).getOpenSession(profile.id);
    if (mounted) {
      setState(() {
        _openSession = session;
        _loading = false;
      });
    }
  }

  Future<void> _enrollFace() async {
    final done = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const FaceEnrollmentScreen()),
    );
    if (done == true) ref.invalidate(currentProfileProvider);
  }

  Future<void> _handleCheckIn(Profile profile) async {
    if (profile.siteId == null || profile.shiftId == null) {
      setState(() => _message =
          'No site/shift assigned yet. Ask your admin to assign one.');
      return;
    }

    if (!profile.faceEnrolled) {
      setState(() => _message = 'Enroll your face first to enable check-in.');
      await _enrollFace();
      return;
    }

    final selfieFile = await Navigator.of(context).push<File?>(
      MaterialPageRoute(builder: (_) => const SelfieCameraScreen()),
    );
    if (selfieFile == null) return;

    setState(() {
      _busy = true;
      _message = null;
    });

    try {
      final attendanceService = ref.read(attendanceServiceProvider);
      final site = await attendanceService.getSite(profile.siteId!);
      final shift = await attendanceService.getShift(profile.shiftId!);
      if (site == null || shift == null) {
        setState(() => _message = 'Site or shift not found.');
        return;
      }

      final result = await attendanceService.checkIn(
        employeeId: profile.id,
        site: site,
        shift: shift,
        selfieFile: selfieFile,
        enrolledFaceSignature: profile.faceSignature,
      );

      setState(() => _message = result.message);
      if (result.success) {
        await _refreshOpenSession();
        await _syncOffline();
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _handleCheckOut() async {
    final session = _openSession;
    if (session == null) return;

    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      final result = await ref
          .read(attendanceServiceProvider)
          .checkOut(sessionId: session.id);
      setState(() => _message = result.message);
      if (result.success) await _refreshOpenSession();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(currentProfileProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('GeoSelfie Attendance'),
        actions: [
          IconButton(
            icon: const Icon(Icons.face),
            tooltip: 'Re-enroll face',
            onPressed: _enrollFace,
          ),
          IconButton(
            icon: const Icon(Icons.bar_chart),
            tooltip: 'My monthly report',
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => const EmployeeDashboardScreen(),
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await ref.read(authServiceProvider).signOut();
              if (context.mounted) {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              }
            },
          ),
        ],
      ),
      body: Center(
        child: profileAsync.when(
          loading: () => const CircularProgressIndicator(),
          error: (e, _) => Text('Error: $e'),
          data: (profile) {
            if (_loading || profile == null) {
              return const CircularProgressIndicator();
            }

            final isCheckedIn = _openSession != null;
            return Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Hello, ${profile.fullName}',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  if (!profile.faceEnrolled) ...[
                    const SizedBox(height: 12),
                    _Banner(
                      color: Colors.orange,
                      icon: Icons.face_retouching_natural,
                      text: 'Face not enrolled — tap check-in to set it up.',
                    ),
                  ],
                  if (_pendingOffline > 0) ...[
                    const SizedBox(height: 12),
                    _Banner(
                      color: Colors.blueGrey,
                      icon: Icons.cloud_off,
                      text: '$_pendingOffline check-in(s) waiting to sync.',
                    ),
                  ],
                  const SizedBox(height: 24),
                  Icon(
                    isCheckedIn
                        ? Icons.check_circle
                        : Icons.radio_button_unchecked,
                    size: 72,
                    color: isCheckedIn ? Colors.green : Colors.grey,
                  ),
                  const SizedBox(height: 8),
                  Text(isCheckedIn ? 'Currently checked in' : 'Not checked in'),
                  if (isCheckedIn)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        'Since ${_openSession!.checkInTime.hour.toString().padLeft(2, '0')}:'
                        '${_openSession!.checkInTime.minute.toString().padLeft(2, '0')}',
                      ),
                    ),
                  const SizedBox(height: 32),
                  FilledButton.icon(
                    icon: Icon(isCheckedIn ? Icons.logout : Icons.camera_alt),
                    label: Text(
                      _busy
                          ? 'Please wait...'
                          : (isCheckedIn
                              ? 'Check out'
                              : 'Check in with selfie'),
                    ),
                    onPressed: _busy
                        ? null
                        : (isCheckedIn
                            ? _handleCheckOut
                            : () => _handleCheckIn(profile)),
                  ),
                  if (_message != null) ...[
                    const SizedBox(height: 16),
                    Text(_message!, textAlign: TextAlign.center),
                  ],
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _Banner extends StatelessWidget {
  final Color color;
  final IconData icon;
  final String text;

  const _Banner({
    required this.color,
    required this.icon,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 8),
          Flexible(child: Text(text)),
        ],
      ),
    );
  }
}

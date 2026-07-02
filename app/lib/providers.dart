import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'models/profile.dart';
import 'services/admin_service.dart';
import 'services/attendance_service.dart';
import 'services/auth_service.dart';
import 'services/export_service.dart';
import 'services/offline_queue_service.dart';
import 'services/report_service.dart';

final authServiceProvider = Provider<AuthService>((ref) => AuthService());
final attendanceServiceProvider =
    Provider<AttendanceService>((ref) => AttendanceService());
final reportServiceProvider = Provider<ReportService>((ref) => ReportService());
final adminServiceProvider = Provider<AdminService>((ref) => AdminService());
final offlineQueueProvider =
    Provider<OfflineQueueService>((ref) => OfflineQueueService());
final exportServiceProvider =
    Provider<ExportService>((ref) => ExportService());

final authStateProvider = StreamProvider<AuthState>((ref) {
  return ref.watch(authServiceProvider).authStateChanges;
});

/// The signed-in user's profile row (includes role/site/shift). Rebuilds
/// whenever auth state changes.
final currentProfileProvider = FutureProvider<Profile?>((ref) async {
  ref.watch(authStateProvider);
  return ref.watch(authServiceProvider).getCurrentProfile();
});

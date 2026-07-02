import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/profile.dart';
import '../../providers.dart';
import '../admin/admin_dashboard_screen.dart';
import '../employee/employee_home_screen.dart';
import 'login_screen.dart';

/// Root routing widget: shows login when signed out, otherwise routes to
/// the employee or admin experience based on the profile's role.
class AuthGate extends ConsumerWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);

    return authState.when(
      loading: () => const _Loading(),
      error: (err, _) => _ErrorView(message: err.toString()),
      data: (state) {
        final session = state.session;
        if (session == null) return const LoginScreen();

        final profileAsync = ref.watch(currentProfileProvider);
        return profileAsync.when(
          loading: () => const _Loading(),
          error: (err, _) => _ErrorView(message: err.toString()),
          data: (profile) {
            if (profile == null) return const _Loading();
            return profile.role == UserRole.admin
                ? const AdminDashboardScreen()
                : const EmployeeHomeScreen();
          },
        );
      },
    );
  }
}

class _Loading extends StatelessWidget {
  const _Loading();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: CircularProgressIndicator()));
  }
}

class _ErrorView extends StatelessWidget {
  final String message;
  const _ErrorView({required this.message});

  @override
  Widget build(BuildContext context) {
    return Scaffold(body: Center(child: Text('Error: $message')));
  }
}

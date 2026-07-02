import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers.dart';
import '../auth/login_screen.dart';
import 'employees_tab.dart';
import 'leave_tab.dart';
import 'reports_tab.dart';
import 'shifts_tab.dart';
import 'sites_tab.dart';

/// Admin home: five tabs covering the whole back-office — company-wide
/// monthly reports, employee assignment, site & shift setup, and the
/// leave-approval queue.
class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 5,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Admin Dashboard'),
          actions: [
            IconButton(
              icon: const Icon(Icons.logout),
              tooltip: 'Sign out',
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
          bottom: const TabBar(
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
        body: const TabBarView(
          children: [
            ReportsTab(),
            EmployeesTab(),
            SitesTab(),
            ShiftsTab(),
            LeaveTab(),
          ],
        ),
      ),
    );
  }
}

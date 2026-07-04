import 'package:flutter/material.dart';

import 'admin_preview.dart';
import 'employee_preview.dart';

/// Web entrypoint for a UI-only preview of GeoSelfie Attendance.
///
/// Build/run with:  flutter run -d web-server -t lib/preview/main_preview.dart
///
/// It reuses the app's real models and widgets but uses mock data and stubs
/// every native capability (camera, face recognition, GPS, notifications,
/// Supabase), so it compiles and runs in a browser. It is a visual walkthrough,
/// not the functional app.
void main() {
  runApp(const PreviewApp());
}

class PreviewApp extends StatelessWidget {
  const PreviewApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GeoSelfie Attendance — UI Preview',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
      ),
      home: const PreviewShell(),
    );
  }
}

class PreviewShell extends StatefulWidget {
  const PreviewShell({super.key});

  @override
  State<PreviewShell> createState() => _PreviewShellState();
}

class _PreviewShellState extends State<PreviewShell> {
  bool _admin = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('GeoSelfie Attendance'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(30),
          child: Container(
            width: double.infinity,
            color: Colors.amber.withValues(alpha: 0.25),
            padding: const EdgeInsets.symmetric(vertical: 5),
            child: const Text(
              'UI PREVIEW · mock data · native features (camera/face/GPS) disabled',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12),
            ),
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: Center(
              child: SegmentedButton<bool>(
                segments: const [
                  ButtonSegment(value: false, label: Text('Employee')),
                  ButtonSegment(value: true, label: Text('Admin')),
                ],
                selected: {_admin},
                onSelectionChanged: (s) => setState(() => _admin = s.first),
              ),
            ),
          ),
        ],
      ),
      body: _admin ? const AdminPreview() : const EmployeePreview(),
    );
  }
}

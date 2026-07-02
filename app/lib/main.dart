import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'config/env.dart';
import 'screens/auth/auth_gate.dart';
import 'services/notification_service.dart';
import 'services/supabase_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (Env.isConfigured) {
    await SupabaseService.init();
  }
  await NotificationService.instance.init();

  runApp(const ProviderScope(child: GeoSelfieApp()));
}

class GeoSelfieApp extends StatelessWidget {
  const GeoSelfieApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GeoSelfie Attendance',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
      ),
      home: Env.isConfigured ? const AuthGate() : const _MissingConfigScreen(),
    );
  }
}

/// Shown when the app is launched without SUPABASE_URL / SUPABASE_ANON_KEY
/// dart-defines, so the developer gets a clear message instead of a crash.
class _MissingConfigScreen extends StatelessWidget {
  const _MissingConfigScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(32),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.settings, size: 56),
              const SizedBox(height: 16),
              Text(
                'Supabase not configured',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 12),
              const Text(
                'Run the app with your Supabase credentials:\n\n'
                'flutter run \\\n'
                '  --dart-define=SUPABASE_URL=https://xxxx.supabase.co \\\n'
                '  --dart-define=SUPABASE_ANON_KEY=your-anon-key',
                textAlign: TextAlign.center,
                style: TextStyle(fontFamily: 'monospace'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

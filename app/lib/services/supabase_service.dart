import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/env.dart';

class SupabaseService {
  static Future<void> init() async {
    await Supabase.initialize(
      url: Env.supabaseUrl,
      // Supabase renamed the client "anon" key to "publishable"; the value
      // you copy from the dashboard is the same either way.
      publishableKey: Env.supabaseAnonKey,
    );
  }

  static SupabaseClient get client => Supabase.instance.client;
}

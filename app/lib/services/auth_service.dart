import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/profile.dart';
import 'supabase_service.dart';

class AuthService {
  SupabaseClient get _client => SupabaseService.client;

  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  User? get currentUser => _client.auth.currentUser;

  Future<AuthResponse> signIn({
    required String email,
    required String password,
  }) {
    return _client.auth.signInWithPassword(email: email, password: password);
  }

  Future<AuthResponse> signUp({
    required String email,
    required String password,
    required String fullName,
  }) {
    return _client.auth.signUp(
      email: email,
      password: password,
      data: {'full_name': fullName, 'role': 'employee'},
    );
  }

  Future<void> signOut() => _client.auth.signOut();

  /// Saves the employee's enrolled face signature to their own profile.
  Future<void> enrollFace(List<double> signature) async {
    final user = currentUser;
    if (user == null) return;
    await _client.from('profiles').update({
      'face_enrolled': true,
      'face_signature': signature,
    }).eq('id', user.id);
  }

  Future<Profile?> getCurrentProfile() async {
    final user = currentUser;
    if (user == null) return null;

    final row = await _client
        .from('profiles')
        .select()
        .eq('id', user.id)
        .maybeSingle();

    return row == null ? null : Profile.fromMap(row);
  }
}

import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers.dart';
import '../../services/face_service.dart';
import '../../services/storage_service.dart';
import 'selfie_camera_screen.dart';

/// One-time face enrollment. Captures a selfie, checks a single clear face is
/// present, derives the geometry signature, and saves it to the profile so
/// future check-ins can be matched against it.
class FaceEnrollmentScreen extends ConsumerStatefulWidget {
  const FaceEnrollmentScreen({super.key});

  @override
  ConsumerState<FaceEnrollmentScreen> createState() =>
      _FaceEnrollmentScreenState();
}

class _FaceEnrollmentScreenState extends ConsumerState<FaceEnrollmentScreen> {
  final _faceService = FaceService();
  bool _busy = false;
  String? _message;

  @override
  void dispose() {
    _faceService.dispose();
    super.dispose();
  }

  Future<void> _enroll() async {
    final selfie = await Navigator.of(context).push<File?>(
      MaterialPageRoute(builder: (_) => const SelfieCameraScreen()),
    );
    if (selfie == null) return;

    setState(() {
      _busy = true;
      _message = null;
    });

    try {
      final result = await _faceService.analyze(selfie);
      if (!result.ok || result.signature == null) {
        setState(() => _message = result.message);
        return;
      }

      await ref.read(authServiceProvider).enrollFace(result.signature!);
      // Keep a reference selfie for the admin/audit trail (best-effort).
      final user = ref.read(authServiceProvider).currentUser;
      if (user != null) {
        try {
          await StorageService().uploadSelfie(employeeId: user.id, file: selfie);
        } catch (_) {}
      }
      ref.invalidate(currentProfileProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Face enrolled successfully.')),
        );
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      setState(() => _message = 'Enrollment failed: $e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Enroll your face')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.face_retouching_natural, size: 88),
            const SizedBox(height: 16),
            Text(
              'Set up face verification',
              style: Theme.of(context).textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            const Text(
              'Take one clear selfie in good lighting, looking straight at the '
              'camera. This is used to confirm it is really you at check-in.',
              textAlign: TextAlign.center,
            ),
            if (_message != null) ...[
              const SizedBox(height: 16),
              Text(_message!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 28),
            FilledButton.icon(
              onPressed: _busy ? null : _enroll,
              icon: _busy
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.camera_alt),
              label: Text(_busy ? 'Processing…' : 'Take enrollment selfie'),
            ),
          ],
        ),
      ),
    );
  }
}

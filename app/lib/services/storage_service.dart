import 'dart:io';

import 'supabase_service.dart';

class StorageService {
  static const _bucket = 'selfies';

  /// Uploads a selfie to `selfies/<employeeId>/<timestamp>.jpg` and
  /// returns a path that can later be resolved to a signed URL.
  Future<String> uploadSelfie({
    required String employeeId,
    required File file,
  }) async {
    final fileName = '${DateTime.now().millisecondsSinceEpoch}.jpg';
    final path = '$employeeId/$fileName';

    await SupabaseService.client.storage.from(_bucket).upload(path, file);

    return path;
  }

  Future<String> getSignedUrl(String path, {int expiresInSeconds = 3600}) {
    return SupabaseService.client.storage
        .from(_bucket)
        .createSignedUrl(path, expiresInSeconds);
  }
}

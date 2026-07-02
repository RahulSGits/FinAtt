import 'dart:io';
import 'dart:math';

import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';

/// Outcome of analysing a selfie: whether it passed the liveness/quality gate,
/// a human-readable message, and (when a good single face was found) a
/// normalized geometry signature used for 1:1 matching.
class FaceCheckResult {
  final bool ok;
  final String message;
  final List<double>? signature;

  FaceCheckResult(this.ok, this.message, [this.signature]);
}

/// On-device face verification.
///
/// Uses ML Kit face detection for a real liveness/quality gate (exactly one
/// face, eyes open, looking roughly straight) and derives a scale-invariant
/// signature from facial landmark geometry. Enrollment stores the signature;
/// check-in compares a fresh signature against it.
///
/// Geometry matching is lighter than deep face-embedding models but needs no
/// bundled model and runs fully offline. [matchThreshold] can be tuned, or a
/// TFLite embedding model swapped in later for higher accuracy.
class FaceService {
  static const double matchThreshold = 0.28;
  static const double _eyeOpenMin = 0.30;
  static const double _maxHeadTurnDegrees = 28;

  final FaceDetector _detector = FaceDetector(
    options: FaceDetectorOptions(
      enableClassification: true,
      enableLandmarks: true,
      performanceMode: FaceDetectorMode.accurate,
    ),
  );

  Future<FaceCheckResult> analyze(File image) async {
    final faces = await _detector.processImage(
      InputImage.fromFilePath(image.path),
    );

    if (faces.isEmpty) {
      return FaceCheckResult(false, 'No face detected. Face the camera clearly.');
    }
    if (faces.length > 1) {
      return FaceCheckResult(false, 'Multiple faces detected. Only you should be in frame.');
    }

    final face = faces.single;

    final leftEye = face.leftEyeOpenProbability;
    final rightEye = face.rightEyeOpenProbability;
    if (leftEye != null && rightEye != null &&
        (leftEye < _eyeOpenMin || rightEye < _eyeOpenMin)) {
      return FaceCheckResult(false, 'Keep your eyes open and look at the camera.');
    }

    final yaw = face.headEulerAngleY;
    if (yaw != null && yaw.abs() > _maxHeadTurnDegrees) {
      return FaceCheckResult(false, 'Look straight at the camera.');
    }

    final signature = _signature(face);
    if (signature == null) {
      return FaceCheckResult(
        false,
        "Couldn't read your facial features. Try better lighting.",
      );
    }

    return FaceCheckResult(true, 'Face captured.', signature);
  }

  /// Builds a scale-invariant vector from pairwise distances between key
  /// landmarks, normalized by inter-ocular distance so it is independent of
  /// how close the face is to the camera.
  List<double>? _signature(Face face) {
    Point<int>? p(FaceLandmarkType t) => face.landmarks[t]?.position;

    final leftEye = p(FaceLandmarkType.leftEye);
    final rightEye = p(FaceLandmarkType.rightEye);
    final noseBase = p(FaceLandmarkType.noseBase);
    final leftMouth = p(FaceLandmarkType.leftMouth);
    final rightMouth = p(FaceLandmarkType.rightMouth);
    final bottomMouth = p(FaceLandmarkType.bottomMouth);
    final leftCheek = p(FaceLandmarkType.leftCheek);
    final rightCheek = p(FaceLandmarkType.rightCheek);

    final pts = [
      leftEye, rightEye, noseBase, leftMouth,
      rightMouth, bottomMouth, leftCheek, rightCheek,
    ];
    if (pts.any((e) => e == null)) return null;

    final ocular = _dist(leftEye!, rightEye!);
    if (ocular < 1) return null;

    final vector = <double>[];
    for (var i = 0; i < pts.length; i++) {
      for (var j = i + 1; j < pts.length; j++) {
        vector.add(_dist(pts[i]!, pts[j]!) / ocular);
      }
    }
    return vector;
  }

  double _dist(Point<int> a, Point<int> b) {
    final dx = (a.x - b.x).toDouble();
    final dy = (a.y - b.y).toDouble();
    return sqrt(dx * dx + dy * dy);
  }

  /// Root-mean-square difference between two signatures of equal length.
  static double difference(List<double> a, List<double> b) {
    if (a.length != b.length || a.isEmpty) return double.infinity;
    var sum = 0.0;
    for (var i = 0; i < a.length; i++) {
      final d = a[i] - b[i];
      sum += d * d;
    }
    return sqrt(sum / a.length);
  }

  static bool matches(List<double> enrolled, List<double> candidate) {
    return difference(enrolled, candidate) <= matchThreshold;
  }

  void dispose() => _detector.close();
}

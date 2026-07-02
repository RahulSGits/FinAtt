import 'dart:io';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';

/// Opens the front camera, lets the employee take a selfie, and returns the
/// captured [File] via [Navigator.pop] once confirmed.
class SelfieCameraScreen extends StatefulWidget {
  const SelfieCameraScreen({super.key});

  @override
  State<SelfieCameraScreen> createState() => _SelfieCameraScreenState();
}

class _SelfieCameraScreenState extends State<SelfieCameraScreen> {
  CameraController? _controller;
  Future<void>? _initFuture;
  XFile? _captured;
  String? _error;

  @override
  void initState() {
    super.initState();
    _setup();
  }

  Future<void> _setup() async {
    try {
      final cameras = await availableCameras();
      final front = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );
      _controller = CameraController(
        front,
        ResolutionPreset.medium,
        enableAudio: false,
      );
      setState(() {
        _initFuture = _controller!.initialize();
      });
    } catch (e) {
      setState(() => _error = 'Camera unavailable: $e');
    }
  }

  Future<void> _capture() async {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) return;
    final file = await controller.takePicture();
    setState(() => _captured = file);
  }

  void _retake() => setState(() => _captured = null);

  void _confirm() {
    if (_captured != null) {
      Navigator.of(context).pop(File(_captured!.path));
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Selfie')),
        body: Center(child: Text(_error!)),
      );
    }

    if (_captured != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Confirm selfie')),
        body: Column(
          children: [
            Expanded(child: Image.file(File(_captured!.path))),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _retake,
                      child: const Text('Retake'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: _confirm,
                      child: const Text('Use photo'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Take a selfie to check in')),
      body: FutureBuilder<void>(
        future: _initFuture,
        builder: (context, snapshot) {
          if (_controller == null ||
              snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          return Column(
            children: [
              Expanded(child: CameraPreview(_controller!)),
              Padding(
                padding: const EdgeInsets.all(20),
                child: FloatingActionButton.large(
                  onPressed: _capture,
                  child: const Icon(Icons.camera_alt),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

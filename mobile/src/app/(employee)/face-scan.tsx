import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../store/auth';
import { useAttendanceStore } from '../../attendance/useAttendanceStore';
import * as Location from 'expo-location';

export default function FaceScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mode = params.mode as 'enroll' | 'verify';
  const type = params.type as 'IN' | 'OUT'; // Only provided in verify mode

  const { enrollFace } = useAuthStore();
  const { addRecord } = useAttendanceStore();
  const device = useCameraDevice('front');
  const camera = useRef<Camera>(null);
  
  const [hasPermission, setHasPermission] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState(
    mode === 'enroll' ? 'Position your face to register' : 'Position your face to verify'
  );

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleCapture = async () => {
    if (!camera.current) return;
    
    setIsProcessing(true);
    setStatusText("Scanning face...");

    try {
      await camera.current.takePhoto({
        flash: 'off'
      });

      // Simulated Backend Call for OpenCV Face Recognition / Registration
      // Here we would typically send photo.path (as multipart/form-data or Base64)
      // to our FastAPI backend for OpenCV processing.
      
      // Simulating network delay for backend processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (mode === 'enroll') {
        await enrollFace();
        Alert.alert("Success", "Face registered successfully!", [
          { text: "OK", onPress: () => router.back() }
        ]);
      } else {
        // Verification mode (Punch IN/OUT)
        let location = await Location.getCurrentPositionAsync({});
        await addRecord({
          timestamp: new Date().toISOString(),
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          deviceInfo: "MobileApp",
          faceData: "simulated_base64_data",
        });
        
        Alert.alert("Verified", `Punched ${type} successfully!`, [
          { text: "OK", onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Face scanning failed. Please try again.");
      setStatusText(mode === 'enroll' ? 'Position your face to register' : 'Position your face to verify');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera permission is required.</Text>
        <TouchableOpacity style={styles.button} onPress={() => Camera.requestCameraPermission()}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No front camera device found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {mode === 'enroll' ? 'Face Registration' : 'Biometric Check-in'}
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cameraContainer}>
        <Camera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={!isProcessing}
          photo={true}
        />
        
        {/* Face Overlay Guide */}
        <View style={styles.overlay}>
          <View style={styles.faceGuide} />
        </View>

        {isProcessing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>{statusText}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.instructionText}>{statusText}</Text>
        <TouchableOpacity 
          style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
          onPress={handleCapture}
          disabled={isProcessing}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // gray-900
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4F46E5',
    padding: 15,
    borderRadius: 8,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelText: {
    color: '#9CA3AF', // gray-400
    fontSize: 16,
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    margin: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#374151', // gray-700
  },
  overlay: {
    ...(StyleSheet.absoluteFill as any),
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceGuide: {
    width: 250,
    height: 350,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderStyle: 'dashed',
    borderRadius: 125,
  },
  loadingOverlay: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 15,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 30,
    alignItems: 'center',
  },
  instructionText: {
    color: '#D1D5DB', // gray-300
    fontSize: 16,
    marginBottom: 20,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: 'white',
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../store/auth';
import { useAttendanceStore } from '../../attendance/useAttendanceStore';

export default function FaceScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mode = params.mode as 'enroll' | 'verify';
  const type = params.type as 'IN' | 'OUT';

  const { enrollFace } = useAuthStore();
  const { addRecord } = useAttendanceStore();
  
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSimulate = async () => {
    setIsProcessing(true);
    
    // Simulate quick processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      if (mode === 'enroll') {
        await enrollFace();
        Alert.alert("Success", "Face registered successfully! (Web Mock)", [
          { text: "OK", onPress: () => router.back() }
        ]);
      } else {
        // Verification mode (Punch IN/OUT)
        // Note: expo-location might not work smoothly on all web browsers without https
        // so we mock coordinates for the web fallback
        await addRecord({
          timestamp: new Date().toISOString(),
          latitude: 37.7749, // Mock San Francisco
          longitude: -122.4194,
          deviceInfo: "WebApp (Mock)",
          faceData: "simulated_base64_data",
        });
        
        Alert.alert("Verified", `Punched ${type} successfully! (Web Mock)`, [
          { text: "OK", onPress: () => router.back() }
        ]);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to process simulation");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Web Simulator</Text>
        <Text style={styles.text}>
          Native Camera API is unavailable on the web. Click below to simulate the {mode === 'enroll' ? 'Face Enrollment' : 'Punch ' + type} process.
        </Text>

        <TouchableOpacity 
          style={styles.simulateButton} 
          onPress={handleSimulate}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Simulate {mode === 'enroll' ? 'Registration' : 'Punch ' + type}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1f2937',
    padding: 24,
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  text: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  simulateButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '600',
  }
});

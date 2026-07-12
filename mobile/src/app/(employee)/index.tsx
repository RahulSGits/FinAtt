import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useAuthStore } from '../../store/auth';
import { useAttendanceStore } from '../../attendance/useAttendanceStore';
import * as Location from "expo-location";
import { useRouter } from "expo-router";

export default function EmployeeDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const { addRecord, queue } = useAttendanceStore();
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>("Checking location...");

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('Permission to access location was denied');
        return;
      }
      setLocationStatus("Location access granted.");
    })();
  }, []);

  const handlePunch = async (type: "IN" | "OUT") => {
    // Check if the user has enrolled their face
    if (!user?.faceEnrolled) {
      Alert.alert(
        "Face Registration Required",
        "You must register your face before you can mark attendance.",
        [
          { text: "Cancel", style: "cancel" },
          // @ts-ignore
          { text: "Register Now", onPress: () => router.push({ pathname: "/(employee)/face-scan", params: { mode: "enroll" } }) }
        ]
      );
      return;
    }

    // Proceed to Live Verification
    // @ts-ignore
    router.push({
      pathname: "/(employee)/face-scan" as any,
      params: { mode: "verify", type }
    });
  };

  const unsyncedCount = queue.filter(q => !q.isSynced).length;

  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="px-6 pt-16 pb-8">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-medium text-blue-400">Welcome back,</Text>
            <Text className="text-3xl font-bold text-white">{user?.name}</Text>
          </View>
          <View className="flex-row items-center space-x-3">
            <TouchableOpacity 
              className="h-10 w-10 items-center justify-center rounded-full bg-gray-800 border border-gray-700"
              onPress={() => router.push("/notifications")}
            >
              <Text className="text-xl">🔔</Text>
              {/* Notification Badge */}
              <View className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border border-gray-900" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="h-10 w-10 items-center justify-center rounded-full bg-gray-800"
              onPress={logout}
            >
              <Text className="font-bold text-red-400">Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sync Status Banner */}
        {unsyncedCount > 0 && (
          <View className="mt-4 rounded-xl bg-yellow-600/20 border border-yellow-600/50 p-4">
            <Text className="text-yellow-500 font-medium">
              You have {unsyncedCount} offline punches pending sync.
            </Text>
          </View>
        )}

        {/* Attendance Card */}
        <View className="mt-8 rounded-3xl bg-gray-800 p-6 shadow-xl border border-gray-700/50">
          <Text className="mb-4 text-lg font-semibold text-white">Daily Attendance</Text>
          <Text className="mb-6 text-sm text-gray-400">{locationStatus}</Text>

          <View className="flex-row justify-between space-x-4">
            <TouchableOpacity
              className="flex-1 items-center justify-center rounded-2xl bg-green-600 py-4 active:bg-green-700"
              onPress={() => handlePunch("IN")}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-bold text-white">PUNCH IN</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 items-center justify-center rounded-2xl bg-red-600 py-4 active:bg-red-700"
              onPress={() => handlePunch("OUT")}
              disabled={loading}
            >
               {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-bold text-white">PUNCH OUT</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="mt-6 flex-row justify-between space-x-4">
          <TouchableOpacity 
            className="flex-1 rounded-3xl bg-gray-800 p-6 shadow-xl border border-gray-700/50"
            onPress={() => router.push("/leave-application")}
          >
            <Text className="text-gray-400 font-medium">Leave Balance</Text>
            <Text className="text-2xl font-bold text-white mt-2">12 Days</Text>
            <Text className="text-blue-400 text-xs mt-2 font-semibold">Apply Leave →</Text>
          </TouchableOpacity>
          <View className="flex-1 rounded-3xl bg-gray-800 p-6 shadow-xl border border-gray-700/50">
            <Text className="text-gray-400 font-medium">Overtime</Text>
            <Text className="text-2xl font-bold text-white mt-2">5 hrs</Text>
          </View>
        </View>

        {/* AI Assistant Banner */}
        <TouchableOpacity 
          className="mt-6 bg-blue-900/40 rounded-3xl p-5 border border-blue-500/30 flex-row items-center justify-between"
          onPress={() => router.push("/ai-assistant")}
        >
          <View className="flex-1">
            <Text className="text-white font-bold text-lg mb-1">Need help?</Text>
            <Text className="text-blue-200 text-sm">Ask the AI Assistant about policies, leaves, and more.</Text>
          </View>
          <View className="bg-blue-600 h-12 w-12 rounded-full items-center justify-center ml-4">
            <Text className="text-white text-xl">✨</Text>
          </View>
        </TouchableOpacity>

        {/* Recent Activity */}
        <View className="mt-8">
          <Text className="text-lg font-semibold text-white mb-4">Recent Activity</Text>
          {queue.slice(-3).reverse().map((record) => (
            <View key={record.id} className="flex-row items-center justify-between rounded-2xl bg-gray-800 p-4 mb-3">
              <View>
                <Text className="text-white font-medium">Location Punch</Text>
                <Text className="text-gray-400 text-xs mt-1">
                  {new Date(record.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              <View className={`px-3 py-1 rounded-full ${record.isSynced ? 'bg-green-900/50' : 'bg-yellow-900/50'}`}>
                <Text className={`text-xs font-semibold ${record.isSynced ? 'text-green-400' : 'text-yellow-400'}`}>
                  {record.isSynced ? 'Synced' : 'Pending'}
                </Text>
              </View>
            </View>
          ))}
          {queue.length === 0 && (
            <Text className="text-gray-500 italic text-center py-4">No recent activity</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

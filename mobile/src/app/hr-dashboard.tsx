import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useAuthStore } from "../store/auth";
import { useRouter } from "expo-router";

export default function HRDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  // Mock data for warnings (as requested earlier for Fraud/Warnings)
  const flaggedEmployees = [
    { id: 1, name: "John Doe", warnings: 2, status: "At Risk" },
    { id: 2, name: "Jane Smith", warnings: 1, status: "Monitored" }
  ];

  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="px-6 pt-16 pb-8">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-medium text-blue-400">HR Portal</Text>
            <Text className="text-3xl font-bold text-white">{user?.name}</Text>
          </View>
          <View className="flex-row items-center space-x-3">
            <TouchableOpacity 
              className="h-10 w-10 items-center justify-center rounded-full bg-gray-800 border border-gray-700"
              onPress={() => router.push("/notifications")}
            >
              <Text className="text-xl">🔔</Text>
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

        {/* Quick Stats */}
        <View className="mt-8 flex-row justify-between space-x-4">
          <View className="flex-1 rounded-3xl bg-gray-800 p-5 shadow-xl border border-gray-700/50">
            <Text className="text-gray-400 font-medium">Headcount</Text>
            <Text className="text-3xl font-bold text-white mt-2">142</Text>
          </View>
          <View className="flex-1 rounded-3xl bg-blue-900/40 p-5 shadow-xl border border-blue-500/30">
            <Text className="text-blue-300 font-medium">Present Today</Text>
            <Text className="text-3xl font-bold text-white mt-2">128</Text>
          </View>
        </View>

        {/* Fraud & Security Warnings */}
        <View className="mt-8 rounded-3xl bg-gray-800 p-6 shadow-xl border border-red-500/30">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-white">Security & Warnings</Text>
            <View className="bg-red-500/20 px-3 py-1 rounded-full">
              <Text className="text-red-400 text-xs font-bold">Action Needed</Text>
            </View>
          </View>
          
          {flaggedEmployees.map(emp => (
            <View key={emp.id} className="flex-row justify-between items-center bg-gray-900 p-4 rounded-2xl mb-3 border border-gray-800">
              <View>
                <Text className="text-white font-medium">{emp.name}</Text>
                <Text className="text-red-400 text-xs mt-1">{emp.warnings} Warnings • {emp.status}</Text>
              </View>
              <TouchableOpacity className="bg-red-600 px-4 py-2 rounded-xl">
                <Text className="text-white text-xs font-semibold">Review</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View className="mt-8">
          <Text className="text-lg font-semibold text-white mb-4">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between">
            <TouchableOpacity className="w-[48%] bg-gray-800 p-4 rounded-2xl mb-4 border border-gray-700/50">
              <Text className="text-white font-medium text-center">Manage Employees</Text>
            </TouchableOpacity>
            <TouchableOpacity className="w-[48%] bg-gray-800 p-4 rounded-2xl mb-4 border border-gray-700/50">
              <Text className="text-white font-medium text-center">Leave Requests</Text>
            </TouchableOpacity>
            <TouchableOpacity className="w-[48%] bg-gray-800 p-4 rounded-2xl mb-4 border border-gray-700/50">
              <Text className="text-white font-medium text-center">Geofence Setup</Text>
            </TouchableOpacity>
            <TouchableOpacity className="w-[48%] bg-gray-800 p-4 rounded-2xl mb-4 border border-gray-700/50">
              <Text className="text-white font-medium text-center">Send Broadcast</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

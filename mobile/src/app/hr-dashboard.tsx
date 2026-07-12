import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { useAuthStore } from "../store/auth";
import { useRouter } from "expo-router";
import { Users, AlertTriangle, Megaphone, Check } from "lucide-react-native";

export default function HRDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [broadcastMsg, setBroadcastMsg] = useState("");

  const fraudulentActivity = [
    { id: 1, name: "Rahul Singh", action: "GPS Spoofing Detected", location: "Unknown IP", time: "10:45 AM", risk: "High", warnings: 3, atRisk: true },
    { id: 2, name: "Anjali M", action: "Multiple device logins", location: "Mumbai, IN", time: "09:12 AM", risk: "Medium", warnings: 2, atRisk: false },
    { id: 3, name: "Dev Patel", action: "Face recognition failed 3x", location: "Bangalore, IN", time: "08:30 AM", risk: "Low", warnings: 1, atRisk: false },
  ];

  const handleBroadcast = () => {
    if (!broadcastMsg) return;
    Alert.alert("Success", "Broadcast sent to all employees!");
    setBroadcastMsg("");
  };

  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="px-6 pt-16 pb-8 border-b border-gray-800">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-medium text-emerald-400">HR Workspace</Text>
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
      </View>

      <View className="p-6">
        {/* Headcount & Analytics */}
        <View className="flex-row justify-between mb-8 space-x-4">
          <View className="flex-1 rounded-3xl bg-gray-800 p-5 border border-gray-700/50 shadow-lg">
            <Users size={20} color="#9ca3af" className="mb-2" />
            <Text className="text-gray-400 font-medium text-sm">Total Headcount</Text>
            <Text className="text-3xl font-bold text-white mt-1">142</Text>
          </View>
          <View className="flex-1 rounded-3xl bg-emerald-900/30 p-5 border border-emerald-500/30 shadow-lg">
            <Check size={20} color="#34d399" className="mb-2" />
            <Text className="text-emerald-400 font-medium text-sm">Present Today</Text>
            <Text className="text-3xl font-bold text-white mt-1">128</Text>
          </View>
        </View>

        {/* Employee Broadcast */}
        <View className="bg-gray-800 rounded-3xl p-6 border border-gray-700/50 mb-8 shadow-lg">
          <View className="flex-row items-center mb-4 space-x-2">
            <Megaphone size={20} color="#60a5fa" />
            <Text className="text-xl font-bold text-white ml-2">Employee Broadcast</Text>
          </View>
          <Text className="text-gray-400 text-sm mb-4">Send an announcement to all employees. It will appear in their notifications.</Text>
          <TextInput 
            className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-white mb-4 h-24"
            placeholder="Type your message here..."
            placeholderTextColor="#6b7280"
            multiline
            textAlignVertical="top"
            value={broadcastMsg}
            onChangeText={setBroadcastMsg}
          />
          <TouchableOpacity 
            className="bg-blue-600 p-4 rounded-xl items-center flex-row justify-center space-x-2"
            onPress={handleBroadcast}
          >
            <Text className="text-white font-bold">Send Broadcast</Text>
          </TouchableOpacity>
        </View>

        {/* Fraudulent Activity & Warnings */}
        <View className="bg-gray-800 rounded-3xl p-6 border border-rose-500/30 shadow-lg mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center space-x-2">
              <AlertTriangle size={20} color="#f87171" />
              <Text className="text-xl font-bold text-white ml-2">Risk & Warnings</Text>
            </View>
            <View className="bg-rose-500/20 px-3 py-1 rounded-full">
              <Text className="text-rose-400 text-xs font-bold">Action Needed</Text>
            </View>
          </View>
          
          <Text className="text-gray-400 text-sm mb-4">Employees reach &quot;At Risk&quot; status after 3 automated warnings.</Text>

          {fraudulentActivity.map(item => (
            <View key={item.id} className={`bg-gray-900 p-4 rounded-2xl mb-3 border ${item.atRisk ? 'border-rose-500/50' : 'border-gray-800'}`}>
              <View className="flex-row justify-between items-start mb-2">
                <View>
                  <Text className="text-white font-bold text-lg">{item.name}</Text>
                  <Text className="text-gray-400 text-xs mt-1">{item.time} • {item.location}</Text>
                </View>
                {item.atRisk && (
                  <View className="bg-rose-600 px-3 py-1 rounded-full">
                    <Text className="text-white text-xs font-bold text-center">FLAG RAISED</Text>
                  </View>
                )}
              </View>

              <Text className="text-rose-300 font-medium text-sm mb-3">Violation: {item.action}</Text>

              <View className="flex-row items-center justify-between border-t border-gray-800 pt-3">
                <Text className="text-gray-400 text-xs font-semibold">Warnings: {item.warnings}/3</Text>
                <TouchableOpacity className="bg-gray-800 border border-gray-700 px-4 py-2 rounded-lg">
                  <Text className="text-white text-xs font-semibold">View Logs</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

      </View>
    </ScrollView>
  );
}

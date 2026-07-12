import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useAuthStore } from "../store/auth";
import { useRouter } from "expo-router";

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="px-6 pt-16 pb-8">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-medium text-purple-400">Platform Admin</Text>
            <Text className="text-3xl font-bold text-white">{user?.name}</Text>
          </View>
          <TouchableOpacity 
            className="h-10 w-10 items-center justify-center rounded-full bg-gray-800"
            onPress={logout}
          >
            <Text className="font-bold text-red-400">Out</Text>
          </TouchableOpacity>
        </View>

        {/* High-Level KPIs */}
        <View className="mt-8 flex-row justify-between space-x-4">
          <View className="flex-1 rounded-3xl bg-gray-800 p-5 shadow-xl border border-gray-700/50">
            <Text className="text-gray-400 font-medium">Active Tenants</Text>
            <Text className="text-3xl font-bold text-white mt-2">12</Text>
          </View>
          <View className="flex-1 rounded-3xl bg-purple-900/40 p-5 shadow-xl border border-purple-500/30">
            <Text className="text-purple-300 font-medium">Platform MRR</Text>
            <Text className="text-2xl font-bold text-white mt-2">₹45,000</Text>
          </View>
        </View>

        <View className="mt-4 rounded-3xl bg-gray-800 p-5 shadow-xl border border-gray-700/50">
          <Text className="text-gray-400 font-medium">Total Billed Users</Text>
          <Text className="text-3xl font-bold text-white mt-2">1,450</Text>
        </View>

        {/* Tenant List Preview */}
        <View className="mt-8 rounded-3xl bg-gray-800 p-6 shadow-xl border border-gray-700/50">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-white">Recent Companies</Text>
            <TouchableOpacity>
              <Text className="text-purple-400 text-sm font-medium">View All</Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row justify-between items-center bg-gray-900 p-4 rounded-2xl mb-3 border border-gray-800">
            <View>
              <Text className="text-white font-medium">TechNova Solutions</Text>
              <Text className="text-gray-400 text-xs mt-1">142 Seats • Premium Plan</Text>
            </View>
            <View className="bg-green-900/50 px-3 py-1 rounded-full">
              <Text className="text-green-400 text-xs font-semibold">Active</Text>
            </View>
          </View>

          <View className="flex-row justify-between items-center bg-gray-900 p-4 rounded-2xl border border-gray-800">
            <View>
              <Text className="text-white font-medium">Global Logistics</Text>
              <Text className="text-gray-400 text-xs mt-1">45 Seats • Basic Plan</Text>
            </View>
            <View className="bg-red-900/50 px-3 py-1 rounded-full">
              <Text className="text-red-400 text-xs font-semibold">Overdue</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mt-8">
          <Text className="text-lg font-semibold text-white mb-4">Platform Controls</Text>
          <View className="flex-row flex-wrap justify-between">
            <TouchableOpacity 
              className="w-[48%] bg-gray-800 p-4 rounded-2xl mb-4 border border-gray-700/50"
              onPress={() => router.push("/billing")}
            >
              <Text className="text-white font-medium text-center">Billing & Invoices</Text>
            </TouchableOpacity>
            <TouchableOpacity className="w-[48%] bg-gray-800 p-4 rounded-2xl mb-4 border border-gray-700/50">
              <Text className="text-white font-medium text-center">Add Company</Text>
            </TouchableOpacity>
            <TouchableOpacity className="w-full bg-purple-600 p-4 rounded-2xl mt-2">
              <Text className="text-white font-bold text-center">Global Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

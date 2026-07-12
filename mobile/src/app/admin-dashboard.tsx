import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useAuthStore } from "../store/auth";
import { useRouter } from "expo-router";
import { CreditCard, Building2, TrendingUp, ShieldCheck } from "lucide-react-native";

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const INR = (num: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);

  const tenants = [
    { id: 1, name: "TechNova Solutions", seats: 142, nextBilling: "Oct 24, 2026", status: "Active", plan: "Enterprise" },
    { id: 2, name: "Global Logistics", seats: 45, nextBilling: "Overdue", status: "Past Due", plan: "Basic" },
    { id: 3, name: "Acme Corp", seats: 300, nextBilling: "Nov 01, 2026", status: "Active", plan: "Yearly" }
  ];

  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="px-6 pt-16 pb-8 border-b border-gray-800">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-medium text-purple-400">Platform Admin</Text>
            <Text className="text-3xl font-bold text-white">{user?.name || "Admin"}</Text>
          </View>
          <TouchableOpacity 
            className="h-10 w-10 items-center justify-center rounded-full bg-gray-800 border border-gray-700"
            onPress={logout}
          >
            <Text className="font-bold text-red-400">Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="p-6">
        {/* High-Level KPIs */}
        <View className="flex-row justify-between space-x-4 mb-4">
          <View className="flex-1 rounded-3xl bg-gray-800 p-5 shadow-lg border border-gray-700/50">
            <Building2 size={20} color="#a78bfa" className="mb-2" />
            <Text className="text-gray-400 font-medium text-xs">Active Tenants</Text>
            <Text className="text-2xl font-bold text-white mt-1">12</Text>
          </View>
          <View className="flex-1 rounded-3xl bg-purple-900/40 p-5 shadow-lg border border-purple-500/30">
            <TrendingUp size={20} color="#c084fc" className="mb-2" />
            <Text className="text-purple-300 font-medium text-xs">Platform MRR</Text>
            <Text className="text-2xl font-bold text-white mt-1">{INR(45000)}</Text>
          </View>
        </View>

        <View className="rounded-3xl bg-gray-800 p-5 shadow-lg border border-gray-700/50 mb-8 flex-row items-center justify-between">
          <View>
            <Text className="text-gray-400 font-medium text-sm">Total Billed Users</Text>
            <Text className="text-3xl font-bold text-white mt-1">1,450</Text>
          </View>
          <ShieldCheck size={32} color="#34d399" />
        </View>

        {/* Tenant List Preview */}
        <View className="rounded-3xl bg-gray-800 p-6 shadow-xl border border-gray-700/50 mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-white">Platform Tenants</Text>
            <TouchableOpacity>
              <Text className="text-purple-400 text-sm font-medium">View All</Text>
            </TouchableOpacity>
          </View>
          
          {tenants.map(t => (
            <View key={t.id} className={`flex-row justify-between items-center bg-gray-900 p-4 rounded-2xl mb-3 border ${t.status === 'Past Due' ? 'border-rose-500/30' : 'border-gray-800'}`}>
              <View>
                <Text className="text-white font-bold">{t.name}</Text>
                <Text className="text-gray-400 text-xs mt-1">{t.seats} Seats • {t.plan} Plan</Text>
                <Text className="text-gray-500 text-[10px] mt-1">Next bill: {t.nextBilling}</Text>
              </View>
              <View className={`px-3 py-1 rounded-full ${t.status === 'Active' ? 'bg-emerald-900/30' : 'bg-rose-900/30'}`}>
                <Text className={`text-xs font-bold ${t.status === 'Active' ? 'text-emerald-400' : 'text-rose-400'}`}>{t.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Platform Billing Interface integrated directly as requested */}
        <View className="rounded-3xl bg-purple-900/20 p-6 shadow-xl border border-purple-500/30 mb-8">
          <View className="flex-row items-center space-x-2 mb-4">
            <CreditCard size={20} color="#a78bfa" />
            <Text className="text-lg font-semibold text-white ml-2">Platform Billing & Upgrades</Text>
          </View>
          
          <Text className="text-gray-300 text-sm mb-4">You are managing the platform&apos;s global Razorpay subscription.</Text>

          <TouchableOpacity 
            className="bg-purple-600 p-4 rounded-xl flex-row items-center justify-center space-x-2 mb-3 shadow-lg"
            onPress={() => router.push("/billing")}
          >
            <Text className="text-white font-bold text-center">Manage Global Subscription</Text>
          </TouchableOpacity>

          <View className="flex-row justify-between mt-2">
            <TouchableOpacity className="flex-1 bg-gray-800 p-4 rounded-xl mr-2 border border-gray-700 items-center">
              <Text className="text-gray-300 font-semibold text-xs">Add Tenant</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-gray-800 p-4 rounded-xl ml-2 border border-gray-700 items-center">
              <Text className="text-gray-300 font-semibold text-xs">Export Invoices</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

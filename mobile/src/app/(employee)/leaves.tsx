import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
// import { useAuthStore } from '../../store/auth';
// import { FileText, Download } from 'lucide-react-native';

export default function LeavesScreen() {
  // const { user } = useAuthStore();
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="px-6 pt-16 pb-8 border-b border-gray-800">
        <Text className="text-3xl font-bold text-white">Leaves</Text>
        <Text className="text-gray-400 mt-1">Manage your time off</Text>
      </View>

      <View className="p-6">
        <TouchableOpacity 
          className="bg-blue-600 rounded-2xl p-4 flex-row items-center justify-center space-x-2 shadow-lg mb-8"
          onPress={() => router.push('/leave-application')}
        >
          <Text className="text-white font-bold text-lg">Apply for Leave</Text>
        </TouchableOpacity>

        <Text className="text-xl font-bold text-white mb-4">Leave Balances</Text>
        <View className="flex-row justify-between mb-8 space-x-4">
          <View className="flex-1 bg-gray-800 rounded-2xl p-4 border border-gray-700/50">
            <Text className="text-gray-400 text-sm">Sick Leave</Text>
            <Text className="text-white text-2xl font-bold mt-1">4</Text>
          </View>
          <View className="flex-1 bg-gray-800 rounded-2xl p-4 border border-gray-700/50">
            <Text className="text-gray-400 text-sm">Casual Leave</Text>
            <Text className="text-white text-2xl font-bold mt-1">6</Text>
          </View>
          <View className="flex-1 bg-gray-800 rounded-2xl p-4 border border-gray-700/50">
            <Text className="text-gray-400 text-sm">Earned</Text>
            <Text className="text-white text-2xl font-bold mt-1">12</Text>
          </View>
        </View>

        <Text className="text-xl font-bold text-white mb-4">Leave History</Text>
        {/* We will replicate the complex Next.js version history here. For now a card list. */}
        <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700/50 mb-4">
          <View className="flex-row justify-between items-start mb-2">
            <View>
              <Text className="text-white font-bold text-lg">Sick Leave</Text>
              <Text className="text-gray-400 text-sm">Jul 15, 2026 → Jul 16, 2026 (2d)</Text>
            </View>
            <View className="bg-yellow-900/40 px-3 py-1 rounded-full border border-yellow-500/20">
              <Text className="text-yellow-400 font-bold text-xs">PENDING</Text>
            </View>
          </View>
          <Text className="text-gray-400 text-sm mb-3">Reason: Unwell, visiting doctor.</Text>
          
          <View className="flex-row justify-end space-x-3 pt-3 border-t border-gray-700/50">
            <TouchableOpacity>
              <Text className="text-blue-400 font-semibold">Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text className="text-red-400 font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700/50 mb-4">
          <View className="flex-row justify-between items-start mb-2">
            <View>
              <Text className="text-white font-bold text-lg">Casual Leave</Text>
              <Text className="text-gray-400 text-sm">Jun 01, 2026 → Jun 02, 2026 (2d)</Text>
            </View>
            <View className="bg-green-900/40 px-3 py-1 rounded-full border border-green-500/20">
              <Text className="text-green-400 font-bold text-xs">APPROVED</Text>
            </View>
          </View>
          <Text className="text-gray-400 text-sm mb-2">Reason: Personal work</Text>
          <View className="bg-green-900/20 p-3 rounded-xl border border-green-900/40">
            <Text className="text-green-300 text-xs"><Text className="font-bold">HR Remark:</Text> Approved, enjoy your time off.</Text>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal } from "react-native";
import { useRouter } from "expo-router";

// Mock Data
const NOTIFICATIONS = [
  { id: 1, title: "Leave Approved", message: "Your sick leave request for 12th Oct has been approved by HR.", time: "10m ago", isRead: false },
  { id: 2, title: "Company Broadcast", message: "Townhall meeting tomorrow at 10 AM. Attendance is mandatory for all employees.", time: "1h ago", isRead: true },
  { id: 3, title: "Payroll Processed", message: "Your salary for September has been credited to your account.", time: "1d ago", isRead: true },
  { id: 4, title: "Warning Issued", message: "You have received a warning for consecutive late check-ins. Please contact HR.", time: "2d ago", isRead: true },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [selectedNotif, setSelectedNotif] = useState<typeof NOTIFICATIONS[0] | null>(null);

  return (
    <View className="flex-1 bg-gray-900">
      {/* Header */}
      <View className="px-6 pt-16 pb-4 border-b border-gray-800 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-white">Notifications</Text>
          <Text className="text-gray-400 text-sm mt-1">You have 1 unread message</Text>
        </View>
        <TouchableOpacity 
          className="bg-gray-800 p-2 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-gray-300 font-bold px-2">Back</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView className="flex-1 px-4 pt-4">
        {NOTIFICATIONS.map((notif) => (
          <TouchableOpacity 
            key={notif.id}
            onPress={() => setSelectedNotif(notif)}
            className={`mb-3 p-4 rounded-2xl border ${notif.isRead ? 'bg-gray-800 border-gray-700/50' : 'bg-blue-900/20 border-blue-500/30'}`}
          >
            <View className="flex-row justify-between items-start mb-2">
              <Text className={`font-semibold text-base ${notif.isRead ? 'text-white' : 'text-blue-400'}`}>
                {notif.title}
              </Text>
              <Text className="text-gray-500 text-xs">{notif.time}</Text>
            </View>
            <Text className="text-gray-400 text-sm" numberOfLines={2}>
              {notif.message}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={!!selectedNotif}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedNotif(null)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-gray-800 rounded-t-3xl p-6 min-h-[50%] shadow-2xl border-t border-gray-700">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-white flex-1">{selectedNotif?.title}</Text>
              <TouchableOpacity onPress={() => setSelectedNotif(null)} className="bg-gray-700 p-2 rounded-full ml-4">
                <Text className="text-gray-300 font-bold px-2">Close</Text>
              </TouchableOpacity>
            </View>
            
            <View className="bg-gray-900 p-5 rounded-2xl border border-gray-700/50">
              <Text className="text-gray-400 text-xs mb-3">{selectedNotif?.time}</Text>
              <Text className="text-gray-200 text-base leading-relaxed">
                {selectedNotif?.message}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

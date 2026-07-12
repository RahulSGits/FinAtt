import { useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";

export default function LeaveApplicationScreen() {
  const router = useRouter();
  const [leaveType, setLeaveType] = useState("Sick");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (!startDate || !endDate || !reason) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }
    Alert.alert("Success", "Leave application submitted successfully!");
    router.back();
  };

  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="px-6 pt-16 pb-8 border-b border-gray-800 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-white">Apply for Leave</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-gray-800 p-2 rounded-full">
          <Text className="text-gray-300 font-bold px-2">Cancel</Text>
        </TouchableOpacity>
      </View>

      <View className="p-6">
        <Text className="text-gray-400 font-semibold mb-2">Leave Type</Text>
        <View className="flex-row space-x-3 mb-6">
          {["Sick", "Casual", "Earned"].map(type => (
            <TouchableOpacity 
              key={type}
              onPress={() => setLeaveType(type)}
              className={`px-4 py-2 rounded-xl border ${leaveType === type ? 'bg-blue-600 border-blue-500' : 'bg-gray-800 border-gray-700'}`}
            >
              <Text className={`font-semibold ${leaveType === type ? 'text-white' : 'text-gray-400'}`}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-gray-400 font-semibold mb-2">Start Date</Text>
        <TextInput 
          className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-white mb-6"
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#6b7280"
          value={startDate}
          onChangeText={setStartDate}
        />

        <Text className="text-gray-400 font-semibold mb-2">End Date</Text>
        <TextInput 
          className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-white mb-6"
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#6b7280"
          value={endDate}
          onChangeText={setEndDate}
        />

        <Text className="text-gray-400 font-semibold mb-2">Reason</Text>
        <TextInput 
          className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-white mb-8 h-32"
          placeholder="Enter reason for leave..."
          placeholderTextColor="#6b7280"
          multiline
          textAlignVertical="top"
          value={reason}
          onChangeText={setReason}
        />

        <TouchableOpacity 
          className="bg-blue-600 p-4 rounded-2xl items-center shadow-lg"
          onPress={handleSubmit}
        >
          <Text className="text-white font-bold text-lg">Submit Application</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Download } from 'lucide-react-native';

export default function ReportsScreen() {
  const reports = [
    { t: 'Monthly PDF', d: 'July 2026 attendance report', c: '#f87171' }, // rose-400
    { t: 'Excel export', d: 'Raw punch data (.xlsx)', c: '#34d399' } // emerald-400
  ];

  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="px-6 pt-16 pb-6 border-b border-gray-800">
        <Text className="text-3xl font-bold text-white">Reports</Text>
        <Text className="text-gray-400 mt-1">Download your attendance summary</Text>
      </View>

      <View className="p-6">
        {reports.map((r, index) => (
          <View 
            key={index} 
            className="bg-gray-800 rounded-2xl p-5 border border-gray-700/50 mb-4 flex-row items-center justify-between shadow-xl"
          >
            <View className="flex-1">
              <Text className="text-white font-bold text-lg mb-1">{r.t}</Text>
              <Text className="text-gray-400 text-sm">{r.d}</Text>
            </View>
            <TouchableOpacity 
              className="flex-row items-center px-4 py-2 rounded-xl"
              style={{ backgroundColor: `${r.c}22`, borderColor: `${r.c}40`, borderWidth: 1 }}
            >
              <Download size={16} color={r.c} />
              <Text className="font-semibold ml-2" style={{ color: r.c }}>Download</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Download } from 'lucide-react-native';

export default function SalaryScreen() {
  const mySalarySlips = [
    { month: 'June 2026', gross: 55000, deductions: 2500, net: 52500, status: 'PAID' },
    { month: 'May 2026', gross: 55000, deductions: 2500, net: 52500, status: 'PAID' },
    { month: 'April 2026', gross: 50000, deductions: 2000, net: 48000, status: 'PAID' }
  ];

  const latest = mySalarySlips[0];
  const total = mySalarySlips.reduce((s, x) => s + x.net, 0);

  const INR = (num: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);

  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="px-6 pt-16 pb-6 border-b border-gray-800">
        <Text className="text-3xl font-bold text-white">Salary</Text>
        <Text className="text-gray-400 mt-1">Monthly pay & downloadable slips</Text>
      </View>

      <View className="p-6">
        <View className="flex-row justify-between mb-4 space-x-3">
          <View className="flex-1 bg-gray-800 rounded-2xl p-4 border border-gray-700/50">
            <Text className="text-gray-400 text-xs font-medium">Net this month</Text>
            <Text className="text-emerald-400 text-xl font-bold mt-2">{INR(latest.net)}</Text>
            <Text className="text-gray-500 text-xs mt-1">{latest.month}</Text>
          </View>
          <View className="flex-1 bg-gray-800 rounded-2xl p-4 border border-gray-700/50">
            <Text className="text-gray-400 text-xs font-medium">Gross</Text>
            <Text className="text-indigo-400 text-xl font-bold mt-2">{INR(latest.gross)}</Text>
            <Text className="text-gray-500 text-xs mt-1">before ded.</Text>
          </View>
          <View className="flex-1 bg-gray-800 rounded-2xl p-4 border border-gray-700/50">
            <Text className="text-gray-400 text-xs font-medium">Paid (last 4m)</Text>
            <Text className="text-cyan-400 text-xl font-bold mt-2">{INR(total)}</Text>
            <Text className="text-gray-500 text-xs mt-1">net total</Text>
          </View>
        </View>

        <Text className="text-xl font-bold text-white mt-4 mb-4">Payslips</Text>
        
        {mySalarySlips.map((s, index) => (
          <View key={index} className="bg-gray-800 rounded-2xl p-4 border border-gray-700/50 mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-white font-bold text-lg">{s.month}</Text>
              <View className="flex-row items-center mt-1 space-x-2">
                <Text className="text-emerald-400 font-semibold">{INR(s.net)}</Text>
                <View className="bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-500/20 ml-2">
                  <Text className="text-emerald-400 text-[10px] font-bold">{s.status}</Text>
                </View>
              </View>
              <Text className="text-gray-500 text-xs mt-1">Gross: {INR(s.gross)} | Ded: {INR(s.deductions)}</Text>
            </View>
            <TouchableOpacity className="bg-gray-700 p-3 rounded-full flex-row items-center justify-center">
              <Download size={18} color="#d1d5db" />
            </TouchableOpacity>
          </View>
        ))}

      </View>
    </ScrollView>
  );
}

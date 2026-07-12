import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";

export default function BillingScreen() {
  const router = useRouter();

  const handlePayment = () => {
    // Razorpay Integration Placeholder
    Alert.alert(
      "Razorpay Integration", 
      "This will open the Razorpay SDK to process the payment for the selected subscription."
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="px-6 pt-16 pb-4 border-b border-gray-800 flex-row items-center justify-between shadow-sm bg-gray-900 z-10">
        <View>
          <Text className="text-2xl font-bold text-white">Billing & Subscription</Text>
          <Text className="text-purple-400 text-xs mt-1">Manage your GeoSelfie Plan</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} className="bg-gray-800 p-2 rounded-full">
          <Text className="text-gray-300 font-bold px-2">Close</Text>
        </TouchableOpacity>
      </View>

      <View className="p-6">
        {/* Current Plan */}
        <View className="bg-purple-900/30 border border-purple-500/40 rounded-3xl p-6 mb-8 shadow-xl">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-purple-300 font-medium uppercase tracking-widest text-xs">Current Plan</Text>
            <View className="bg-green-900/50 px-3 py-1 rounded-full">
              <Text className="text-green-400 text-xs font-bold">Active</Text>
            </View>
          </View>
          <Text className="text-white text-3xl font-bold mb-1">Enterprise</Text>
          <Text className="text-gray-400 text-sm mb-6">142 Seats • Renews Oct 24, 2026</Text>
          
          <View className="flex-row justify-between items-center border-t border-purple-800/50 pt-4">
            <Text className="text-white font-semibold">Total Amount</Text>
            <Text className="text-white font-bold text-xl">₹12,400 <Text className="text-sm font-normal text-gray-400">/mo</Text></Text>
          </View>
        </View>

        <Text className="text-white text-lg font-bold mb-4">Available Plans</Text>

        {/* Plan Option 1 */}
        <View className="bg-gray-800 border border-gray-700 rounded-2xl p-5 mb-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-white font-bold text-lg">Yearly Plan (Save 20%)</Text>
            <Text className="text-white font-bold text-lg">₹1,19,000</Text>
          </View>
          <Text className="text-gray-400 text-sm mb-4">Billed annually. Best value for growing teams.</Text>
          <TouchableOpacity 
            className="bg-purple-600 py-3 rounded-xl items-center"
            onPress={handlePayment}
          >
            <Text className="text-white font-bold">Upgrade to Yearly</Text>
          </TouchableOpacity>
        </View>

        {/* Plan Option 2 */}
        <View className="bg-gray-800 border border-gray-700 rounded-2xl p-5 mb-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-white font-bold text-lg">Add 50 Seats</Text>
            <Text className="text-white font-bold text-lg">₹4,000</Text>
          </View>
          <Text className="text-gray-400 text-sm mb-4">Add more capacity to your current monthly plan.</Text>
          <TouchableOpacity 
            className="bg-gray-700 border border-gray-600 py-3 rounded-xl items-center"
            onPress={handlePayment}
          >
            <Text className="text-white font-bold">Purchase Seats</Text>
          </TouchableOpacity>
        </View>

        {/* Invoices */}
        <Text className="text-white text-lg font-bold mt-4 mb-4">Recent Invoices</Text>
        {[
          { id: "INV-2026-09", date: "Sep 24, 2026", amount: "₹12,400", status: "Paid" },
          { id: "INV-2026-08", date: "Aug 24, 2026", amount: "₹12,400", status: "Paid" }
        ].map(inv => (
          <View key={inv.id} className="flex-row justify-between items-center bg-gray-900 border border-gray-800 p-4 rounded-xl mb-3">
            <View>
              <Text className="text-white font-medium">{inv.id}</Text>
              <Text className="text-gray-500 text-xs mt-1">{inv.date}</Text>
            </View>
            <View className="items-end">
              <Text className="text-white font-bold">{inv.amount}</Text>
              <Text className="text-green-400 text-xs font-semibold mt-1">{inv.status}</Text>
            </View>
          </View>
        ))}

      </View>
    </ScrollView>
  );
}

import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { api } from "../lib/axios";
import { useAuthStore } from "../store/auth";
import { MapPin } from "lucide-react-native";

export default function LoginScreen() {
  const [companyId, setCompanyId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const loginStore = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
        companyId,
      });

      const { user, accessToken, refreshToken } = response.data;
      
      await loginStore(user, accessToken, refreshToken);

      if (user.role === "hr") {
        router.replace("/hr-dashboard");
      } else if (user.role === "admin") {
        router.replace("/admin-dashboard");
      } else {
        // @ts-ignore: dynamic route for Expo
        router.replace("/(employee)");
      }
    } catch (error: any) {
      Alert.alert(
        "Login Failed", 
        error.response?.data?.error || "An error occurred during login."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-gray-900 p-6">
      <View className="w-full max-w-sm rounded-3xl bg-gray-800 p-8 shadow-2xl border border-gray-700/50">
        
        <View className="items-center mb-6">
          <View className="h-16 w-16 bg-blue-600 rounded-2xl items-center justify-center shadow-lg shadow-blue-500/30 mb-4 transform rotate-3">
            <MapPin size={32} color="#ffffff" strokeWidth={2.5} />
          </View>
          <Text className="text-3xl font-extrabold text-white tracking-tight">geoSelfie</Text>
          <Text className="text-blue-400 font-medium mt-1 text-sm">Enterprise Biometric Attendance</Text>
        </View>

        <Text className="mb-6 text-center text-gray-400 text-sm">Sign in to manage your workforce and attendance</Text>

        <View className="space-y-4">
          <View>
            <Text className="mb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Company ID</Text>
            <TextInput
              className="w-full rounded-xl bg-gray-900/50 border border-gray-700 px-4 py-3.5 text-white placeholder-gray-600 focus:border-blue-500"
              placeholder="e.g. acme_corp"
              placeholderTextColor="#4b5563"
              value={companyId}
              onChangeText={setCompanyId}
              autoCapitalize="none"
            />
          </View>

          <View>
            <Text className="mb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Address</Text>
            <TextInput
              className="w-full rounded-xl bg-gray-900/50 border border-gray-700 px-4 py-3.5 text-white placeholder-gray-600 focus:border-blue-500"
              placeholder="name@example.com"
              placeholderTextColor="#4b5563"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View>
            <Text className="mb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</Text>
            <TextInput
              className="w-full rounded-xl bg-gray-900/50 border border-gray-700 px-4 py-3.5 text-white placeholder-gray-600 focus:border-blue-500"
              placeholder="••••••••"
              placeholderTextColor="#4b5563"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            className="mt-4 w-full rounded-xl bg-blue-600 py-4 active:bg-blue-700 shadow-lg shadow-blue-600/30"
            onPress={handleLogin}
            disabled={loading}
          >
            <Text className="text-center font-bold text-white text-base tracking-wide">
              {loading ? "Authenticating..." : "Sign In securely"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

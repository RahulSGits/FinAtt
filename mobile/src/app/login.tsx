import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { api } from "../lib/axios";
import { useAuthStore } from "../store/auth";

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
      <View className="w-full max-w-sm rounded-2xl bg-gray-800 p-8 shadow-lg">
        <Text className="mb-2 text-center text-3xl font-bold text-white">geoSelfie</Text>
        <Text className="mb-8 text-center text-gray-400">Sign in to your account</Text>

        <View className="space-y-4">
          <View>
            <Text className="mb-1 text-sm font-medium text-gray-300">Company ID</Text>
            <TextInput
              className="w-full rounded-xl bg-gray-700 px-4 py-3 text-white placeholder-gray-500"
              placeholder="e.g. acme_corp"
              placeholderTextColor="#6b7280"
              value={companyId}
              onChangeText={setCompanyId}
              autoCapitalize="none"
            />
          </View>

          <View>
            <Text className="mb-1 text-sm font-medium text-gray-300">Email Address</Text>
            <TextInput
              className="w-full rounded-xl bg-gray-700 px-4 py-3 text-white placeholder-gray-500"
              placeholder="name@example.com"
              placeholderTextColor="#6b7280"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View>
            <Text className="mb-1 text-sm font-medium text-gray-300">Password</Text>
            <TextInput
              className="w-full rounded-xl bg-gray-700 px-4 py-3 text-white placeholder-gray-500"
              placeholder="••••••••"
              placeholderTextColor="#6b7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            className="mt-2 w-full rounded-xl bg-blue-600 py-3 active:bg-blue-700"
            onPress={handleLogin}
            disabled={loading}
          >
            <Text className="text-center font-semibold text-white">
              {loading ? "Signing in..." : "Sign In"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

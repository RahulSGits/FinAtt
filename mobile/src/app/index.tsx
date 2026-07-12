import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useAuthStore } from "../store/auth";

export default function Index() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === "hr") {
        router.replace("/hr-dashboard");
      } else if (user.role === "admin") {
        router.replace("/admin-dashboard");
      } else {
        router.replace("/employee-dashboard");
      }
    }
  }, [isLoading, isAuthenticated, user]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-900">
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return null;
}

import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth";
import "../../global.css";

const queryClient = new QueryClient();

export default function RootLayout() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "login";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Typically we'd route based on role here if we just logged in and the state changed.
      // But we handle this in the login page directly for now, or we can read user role.
      // We will refine this as we build out the dashboards.
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}

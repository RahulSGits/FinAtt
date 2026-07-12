const fs = require('fs');

// 1. ThemeProvider.tsx
fs.writeFileSync('src/components/ThemeProvider.tsx', `"use client";
import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
`);

// 2. layout.tsx
let layout = fs.readFileSync('src/app/layout.tsx', 'utf8');
layout = layout.replace('<html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>', '<html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>');
fs.writeFileSync('src/app/layout.tsx', layout);

// 3. providers.tsx
fs.writeFileSync('src/app/providers.tsx', `"use client";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
`);

// 4. attendance.ts
fs.writeFileSync('src/lib/attendance.ts', `import { useState, useEffect } from "react";

export function useCheckIn() {
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);

  useEffect(() => {
    const val = localStorage.getItem("gs_checked_in");
    const time = localStorage.getItem("gs_checked_in_time");
    if (val === "true") {
      setCheckedIn(true);
      if (time) {
        setCheckInTime(time);
      } else {
        const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        localStorage.setItem("gs_checked_in_time", t);
        setCheckInTime(t);
      }
    } else {
      setCheckedIn(false);
      setCheckInTime(null);
    }

    const handler = () => {
      const v = localStorage.getItem("gs_checked_in");
      const t = localStorage.getItem("gs_checked_in_time");
      setCheckedIn(v === "true");
      setCheckInTime(v === "true" ? t : null);
    };
    window.addEventListener("gs_checked_in_changed", handler);
    return () => window.removeEventListener("gs_checked_in_changed", handler);
  }, []);

  const markCheckIn = () => {
    localStorage.setItem("gs_checked_in", "true");
    const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    localStorage.setItem("gs_checked_in_time", t);
    window.dispatchEvent(new Event("gs_checked_in_changed"));
  };

  const markCheckOut = () => {
    localStorage.setItem("gs_checked_in", "false");
    localStorage.removeItem("gs_checked_in_time");
    window.dispatchEvent(new Event("gs_checked_in_changed"));
  };

  return { checkedIn, checkInTime, markCheckIn, markCheckOut };
}
`);

console.log("Rebuild part 1 done.");

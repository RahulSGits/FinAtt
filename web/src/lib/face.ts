"use client";

import { useEffect, useState } from "react";

/**
 * One-time face enrollment, persisted per user in localStorage. The stored
 * value is a snapshot data-URL captured at registration; daily check-in
 * verifies a live face against this record.
 */
export function useFaceEnrollment(email: string) {
  const key = `gs_face_${email}`;
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [enrolledAt, setEnrolledAt] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSnapshot(localStorage.getItem(key));
    setEnrolledAt(localStorage.getItem(`${key}_at`));
    setReady(true);
  }, [key]);

  const enroll = (dataUrl: string) => {
    const now = new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
    localStorage.setItem(key, dataUrl);
    localStorage.setItem(`${key}_at`, now);
    setSnapshot(dataUrl);
    setEnrolledAt(now);
  };

  const reset = () => {
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_at`);
    setSnapshot(null);
    setEnrolledAt(null);
  };

  return { enrolled: !!snapshot, snapshot, enrolledAt, enroll, reset, ready };
}

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
  const [descriptor, setDescriptor] = useState<Float32Array | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSnapshot(localStorage.getItem(key));
    setEnrolledAt(localStorage.getItem(`${key}_at`));
    const descStr = localStorage.getItem(`${key}_desc`);
    if (descStr) {
      try {
        setDescriptor(new Float32Array(JSON.parse(descStr)));
      } catch (e) {
        console.error("Failed to parse face descriptor", e);
      }
    }
    setReady(true);
  }, [key]);

  const enroll = (dataUrl: string, desc?: Float32Array) => {
    const now = new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
    localStorage.setItem(key, dataUrl);
    localStorage.setItem(`${key}_at`, now);
    if (desc) {
      localStorage.setItem(`${key}_desc`, JSON.stringify(Array.from(desc)));
      setDescriptor(desc);
    }
    setSnapshot(dataUrl);
    setEnrolledAt(now);
  };

  const reset = () => {
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_at`);
    localStorage.removeItem(`${key}_desc`);
    setSnapshot(null);
    setEnrolledAt(null);
    setDescriptor(null);
  };

  return { enrolled: !!snapshot, snapshot, enrolledAt, descriptor, enroll, reset, ready };
}

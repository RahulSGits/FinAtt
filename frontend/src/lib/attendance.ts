import { useState, useEffect } from "react";

export function useCheckIn() {
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);

  useEffect(() => {
    const val = localStorage.getItem("gs_checked_in");
    const time = localStorage.getItem("gs_checked_in_time");
    if (val === "true") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

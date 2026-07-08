"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ScanFace, Mail, IdCard, CheckCircle2, ShieldCheck, Camera, CalendarClock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useFaceEnrollment } from "@/lib/face";
import { employees } from "@/lib/mock";
import { Panel } from "@/components/ui";
import FaceScan from "./FaceScan";

export default function Profile() {
  const { session } = useAuth();
  const email = session?.email ?? "guest";
  const name = session?.name ?? "User";
  const { enrolled, snapshot, enrolledAt, enroll, ready } = useFaceEnrollment(email);
  const [scan, setScan] = useState(false);

  const isEmployee = session?.role === "employee";
  const emp = employees.find((e) => e.name === name);
  const roleLabel =
    session?.role === "admin" ? "Developer · Admin"
      : session?.role === "hr" ? "HR · Company Head"
      : "Employee";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  const hasImg = snapshot?.startsWith("data:");

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      <p className="muted text-sm">{isEmployee ? "Your account & face registration" : "Your account details"}</p>

      <div className={`mt-5 grid gap-4 ${isEmployee ? "lg:grid-cols-3" : "max-w-md"}`}>
        {/* Identity */}
        <Panel className="lg:col-span-1">
          <div className="flex flex-col items-center py-2 text-center">
            <span
              className="grid h-20 w-20 place-items-center rounded-full text-2xl font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}
            >
              {initials}
            </span>
            <div className="mt-3 text-lg font-semibold">{name}</div>
            <span className="mt-1 rounded-full bg-indigo-500/15 px-3 py-1 text-xs text-indigo-200">{roleLabel}</span>
            <div className="mt-5 w-full space-y-3 text-left text-sm">
              <Row icon={<Mail size={15} />} label="Email" value={email} />
              {emp && <Row icon={<IdCard size={15} />} label="Member ID" value={emp.memberId} mono />}
              {isEmployee && (
                <Row
                  icon={<ShieldCheck size={15} />}
                  label="Attendance access"
                  value={enrolled ? "Face enabled" : "Not set up"}
                  tone={enrolled ? "#34d399" : "#fbbf24"}
                />
              )}
            </div>
          </div>
        </Panel>

        {/* Face registration — employees only */}
        {isEmployee && (
        <Panel title="Face registration" className="lg:col-span-2">
          <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
            <div className="relative mx-auto grid h-40 w-40 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-black/30">
              {hasImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={snapshot!} alt="Registered face" className="h-full w-full object-cover" />
              ) : (
                <ScanFace size={54} className="text-slate-500" />
              )}
              {enrolled && (
                <span className="absolute bottom-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white">
                  <CheckCircle2 size={16} />
                </span>
              )}
            </div>

            <div>
              {ready && enrolled ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 size={18} />
                    <span className="font-semibold">Face registered</span>
                  </div>
                  <p className="muted mt-2 text-sm">
                    Your face is enrolled and used to verify attendance. This is a
                    one-time setup — each day your live selfie is matched against it.
                  </p>
                  <div className="muted mt-3 flex items-center gap-2 text-xs">
                    <CalendarClock size={14} /> Registered on {enrolledAt}
                  </div>
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                    <ShieldCheck size={16} /> Daily real-time verification active
                  </div>
                </motion.div>
              ) : (
                <div>
                  <p className="muted text-sm">
                    Register your face <span className="text-white">once</span> to enable
                    selfie attendance. After this, check-in verifies your face live each
                    day — no re-registration needed.
                  </p>
                  <button
                    onClick={() => setScan(true)}
                    className="mt-4 flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 font-medium text-white hover:bg-indigo-400"
                  >
                    <Camera size={18} /> Register face
                  </button>
                </div>
              )}
            </div>
          </div>
        </Panel>
        )}
      </div>

      {scan && (
        <FaceScan
          mode="enroll"
          onClose={() => setScan(false)}
          onEnrolled={(img) => {
            enroll(img);
            setScan(false);
          }}
        />
      )}
    </div>
  );
}

function Row({ icon, label, value, mono, tone }: { icon: React.ReactNode; label: string; value: string; mono?: boolean; tone?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
      <span className="muted flex items-center gap-2 text-xs">{icon} {label}</span>
      <span className={`text-sm ${mono ? "font-mono" : ""}`} style={tone ? { color: tone } : undefined}>{value}</span>
    </div>
  );
}

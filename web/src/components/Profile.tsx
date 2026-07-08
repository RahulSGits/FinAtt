"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ScanFace,
  Mail,
  IdCard,
  CheckCircle2,
  ShieldCheck,
  Camera,
  CalendarClock,
  Pencil,
  Save,
  Building2,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useFaceEnrollment } from "@/lib/face";
import { employees } from "@/lib/mock";
import { Panel } from "@/components/ui";
import FaceScan from "./FaceScan";

export default function Profile() {
  const { session, updateProfile } = useAuth();
  const email = session?.email ?? "guest";
  const name = session?.name ?? "User";
  const { enrolled, snapshot, enrolledAt, enroll, ready } =
    useFaceEnrollment(email);
  const [scan, setScan] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Editable fields
  const [editName, setEditName] = useState(name);
  const [editEmail, setEditEmail] = useState(email);
  const [editCompany, setEditCompany] = useState(
    session?.companyName || "geoSelfie",
  );
  const [editEmpId, setEditEmpId] = useState(
    session?.empId ||
      employees.find((e) => e.name === name)?.memberId ||
      "",
  );

  const isEmployee = session?.role === "employee";
  const emp = employees.find((e) => e.name === name);
  const roleLabel =
    session?.role === "admin"
      ? "Developer · Admin"
      : session?.role === "hr"
        ? "HR · Company Head"
        : "Employee";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  const hasImg = snapshot?.startsWith("data:");

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function startEdit() {
    setEditName(name);
    setEditEmail(email);
    setEditCompany(session?.companyName || "geoSelfie");
    setEditEmpId(
      session?.empId ||
        employees.find((e) => e.name === name)?.memberId ||
        "",
    );
    setEditing(true);
  }

  function saveProfile() {
    // Basic validation
    if (!editName.trim() || !editEmail.trim()) {
      flash("Name and email are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail.trim())) {
      flash("Please enter a valid email address.");
      return;
    }
    updateProfile({
      name: editName.trim(),
      email: editEmail.trim(),
      companyName: editCompany.trim(),
      empId: editEmpId.trim(),
    });
    setEditing(false);
    flash("Profile updated successfully ✓");
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      <p className="muted text-sm">
        {isEmployee
          ? "Your account & face registration"
          : "Your account details"}
      </p>

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="toast-enter mt-3 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-sm text-emerald-200"
        >
          {toast}
        </motion.div>
      )}

      <div
        className={`mt-5 grid gap-4 ${isEmployee ? "lg:grid-cols-3" : "max-w-lg"}`}
      >
        {/* Identity */}
        <Panel className="lg:col-span-1">
          <div className="flex flex-col items-center py-2 text-center">
            <span
              className="grid h-20 w-20 place-items-center rounded-full text-2xl font-semibold text-white"
              style={{
                background: "linear-gradient(135deg,#6366f1,#a855f7)",
              }}
            >
              {initials}
            </span>
            <div className="mt-3 text-lg font-semibold">{name}</div>
            <span className="mt-1 rounded-full bg-indigo-500/15 px-3 py-1 text-xs text-indigo-200">
              {roleLabel}
            </span>

            {/* Edit toggle */}
            {!editing && (
              <button
                onClick={startEdit}
                className="mt-3 flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-indigo-200 hover:bg-white/10"
              >
                <Pencil size={13} /> Edit profile
              </button>
            )}

            <div className="mt-5 w-full space-y-3 text-left text-sm">
              {editing ? (
                <>
                  <EditRow
                    icon={<Mail size={15} />}
                    label="Email"
                    value={editEmail}
                    onChange={setEditEmail}
                  />
                  <EditRow
                    icon={<Building2 size={15} />}
                    label="Company"
                    value={editCompany}
                    onChange={setEditCompany}
                  />
                  <EditRow
                    icon={<IdCard size={15} />}
                    label="Employee ID"
                    value={editEmpId}
                    onChange={setEditEmpId}
                  />
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setEditing(false)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-sm hover:bg-white/10"
                    >
                      <X size={14} /> Cancel
                    </button>
                    <button
                      onClick={saveProfile}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-500 py-2 text-sm font-medium text-white hover:bg-indigo-400"
                    >
                      <Save size={14} /> Save
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Row icon={<Mail size={15} />} label="Email" value={email} />
                  <Row
                    icon={<Building2 size={15} />}
                    label="Company"
                    value={session?.companyName || "geoSelfie"}
                  />
                  {(emp || session?.empId) && (
                    <Row
                      icon={<IdCard size={15} />}
                      label="Employee ID"
                      value={session?.empId || emp?.memberId || "—"}
                      mono
                    />
                  )}
                  {isEmployee && (
                    <Row
                      icon={<ShieldCheck size={15} />}
                      label="Attendance access"
                      value={enrolled ? "Face enabled" : "Not set up"}
                      tone={enrolled ? "#34d399" : "#fbbf24"}
                    />
                  )}
                </>
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
                  <img
                    src={snapshot!}
                    alt="Registered face"
                    className="h-full w-full object-cover"
                  />
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
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex items-center gap-2 text-emerald-300">
                      <CheckCircle2 size={18} />
                      <span className="font-semibold">Face registered</span>
                    </div>
                    <p className="muted mt-2 text-sm">
                      Your face is enrolled and used to verify attendance. This
                      is a one-time setup — each day your live selfie is matched
                      against it.
                    </p>
                    <div className="muted mt-3 flex items-center gap-2 text-xs">
                      <CalendarClock size={14} /> Registered on {enrolledAt}
                    </div>
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                      <ShieldCheck size={16} /> Daily real-time verification
                      active
                    </div>
                    {/* Note: No re-register button for employees — only HR can reset */}
                    <p className="muted mt-3 text-xs">
                      Need to re-register? Contact your HR administrator to
                      reset your face enrollment.
                    </p>
                  </motion.div>
                ) : (
                  <div>
                    <p className="muted text-sm">
                      Register your face{" "}
                      <span className="text-white">once</span> to enable selfie
                      attendance. After this, check-in verifies your face live
                      each day — no re-registration needed.
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

function Row({
  icon,
  label,
  value,
  mono,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  tone?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
      <span className="muted flex items-center gap-2 text-xs">
        {icon} {label}
      </span>
      <span
        className={`text-sm ${mono ? "font-mono" : ""}`}
        style={tone ? { color: tone } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

function EditRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="border-b border-white/5 pb-2 last:border-0">
      <span className="muted mb-1 flex items-center gap-2 text-xs">
        {icon} {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="inline-edit text-sm"
      />
    </div>
  );
}

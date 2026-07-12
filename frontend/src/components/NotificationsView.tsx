"use client";

import { useState } from "react";

import { Check, CheckCheck, Trash2, Bell, CreditCard, FileText, Fingerprint, User, CalendarCheck, Megaphone } from "lucide-react";
import { useNotifications } from "@/lib/notifications";
import { useAuth } from "@/lib/auth";
import { Panel } from "./ui";

const notifIconMap: Record<string, React.ElementType> = {
  plan_updated: CreditCard,
  payroll_edited: FileText,
  face_reset: Fingerprint,
  broadcast: Megaphone,
  profile_updated: User,
  leave_edited: CalendarCheck,
};

export default function NotificationsView() {
  const { session } = useAuth();
  const { items, unread, markRead, markAllRead, clear } = useNotifications(
    session?.role,
  );
  const [filter, setFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredItems = items.filter(n => filter === "all" || n.type === filter);
  const selectedNotif = items.find(n => n.id === selectedId) || filteredItems[0];

  const filterOptions = [
    { label: "All", value: "all" },
    { label: "Billing & Plans", value: "plan_updated" },
    { label: "Leaves", value: "leave_edited" },
    { label: "Payroll", value: "payroll_edited" },
    { label: "Broadcasts", value: "broadcast" },
    { label: "Profile", value: "profile_updated" },
  ];

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="muted text-sm">Updates, alerts, and system messages</p>
        </div>
        <div className="flex gap-2">
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-50 dark:bg-white/5 px-4 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-white/10 transition-colors"
            >
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
          {items.length > 0 && (
            <button
              onClick={clear}
              className="flex items-center gap-1.5 rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
            >
              <Trash2 size={16} /> Clear history
            </button>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide shrink-0">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setFilter(opt.value); setSelectedId(null); }}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === opt.value
                  ? "bg-indigo-600 text-white shadow-md dark:bg-indigo-500"
                  : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-1 gap-6 overflow-hidden min-h-0">
        {/* Left Side: List */}
        <div className="w-1/3 flex flex-col min-w-[300px]">
          <Panel className="flex-1 flex flex-col overflow-hidden">
            {filteredItems.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 flex-1">
                <Bell size={32} className="mb-3 opacity-20" />
                <p className="text-sm">No notifications found.</p>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-white/5">
                {filteredItems.map((n) => {
                  const IconCmp = notifIconMap[n.type] || Bell;
                  const isSelected = selectedNotif?.id === n.id;
                  return (
                    <button
                      key={n.id}
                      onClick={() => setSelectedId(n.id)}
                      className={`w-full flex items-start gap-3 p-4 text-left transition-colors ${
                        isSelected ? "bg-indigo-50 dark:bg-indigo-500/10" : "hover:bg-slate-50 dark:hover:bg-white/5"
                      } ${n.read ? "opacity-70" : ""}`}
                    >
                      <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                        n.read ? "bg-slate-100 dark:bg-white/10 text-slate-500" : "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                      }`}>
                        <IconCmp size={16} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold text-sm truncate ${isSelected ? "text-indigo-700 dark:text-indigo-300" : "text-slate-900 dark:text-slate-100"}`}>
                          {n.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {n.body}
                        </p>
                        <span className="text-[10px] font-medium text-slate-400 mt-1 block">{n.at}</span>
                      </div>
                      {!n.read && (
                        <div className="mt-2 w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>

        {/* Right Side: Details */}
        <div className="w-2/3 flex flex-col">
          <Panel className="flex-1 overflow-y-auto relative">
            {selectedNotif ? (
              <div className="p-2 sm:p-6">
                <div className="flex items-center gap-4 mb-6">
                  {(() => {
                    const DetailIcon = notifIconMap[selectedNotif.type] || Bell;
                    return (
                      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <DetailIcon size={32} />
                      </div>
                    );
                  })()}
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedNotif.title}</h2>
                    <p className="text-sm text-slate-500 mt-1">{selectedNotif.at}</p>
                  </div>
                </div>
                
                <div className="prose prose-sm dark:prose-invert max-w-none mb-8">
                  <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedNotif.body}
                  </p>
                </div>

                {!selectedNotif.read && (
                  <button
                    onClick={() => markRead(selectedNotif.id)}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
                  >
                    <Check size={16} /> Mark as read
                  </button>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Bell size={48} className="mb-4 opacity-20" />
                <p className="text-sm">Select a notification to view details.</p>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

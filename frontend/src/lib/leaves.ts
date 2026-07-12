"use client";

import { useState, useEffect } from "react";

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface LeaveVersion {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  documents: string[];
  editedAt: string; // ISO string
}

export interface LeaveTimelineEvent {
  id: string;
  action: string;
  actorName: string;
  actorRole: "employee" | "hr" | "admin";
  timestamp: string; // ISO string
  remarks?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  appliedAt: string; // ISO string
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  documents: string[];
  status: LeaveStatus;
  hrRemarks?: string;
  versions: LeaveVersion[];
  timeline: LeaveTimelineEvent[];
}

const KEY = "gs_leave_requests";
const EVT = "gs_leaves_changed";

function seedData(): LeaveRequest[] {
  const now = new Date();
  
  // Create some mock data that makes sense relative to now
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  
  return [
    {
      id: "LR-2034",
      employeeId: "emp_1",
      employeeName: "Rahul Sharma",
      type: "Casual",
      appliedAt: twoDaysAgo,
      startDate: "2026-07-10",
      endDate: "2026-07-11",
      days: 2,
      reason: "Family function",
      documents: [],
      status: "pending",
      versions: [],
      timeline: [
        {
          id: "evt_1",
          action: "Leave Request Submitted",
          actorName: "Rahul Sharma",
          actorRole: "employee",
          timestamp: twoDaysAgo,
        }
      ],
    },
    {
      id: "LR-2035",
      employeeId: "emp_2",
      employeeName: "Sara Khan",
      type: "Sick",
      appliedAt: yesterday,
      startDate: "2026-07-03",
      endDate: "2026-07-03",
      days: 1,
      reason: "Medical",
      documents: ["doctor_note.pdf"],
      status: "approved",
      hrRemarks: "Approved, get well soon.",
      versions: [],
      timeline: [
        {
          id: "evt_2",
          action: "Leave Request Submitted",
          actorName: "Sara Khan",
          actorRole: "employee",
          timestamp: yesterday,
        },
        {
          id: "evt_3",
          action: "HR Approved Leave",
          actorName: "Priya Menon",
          actorRole: "hr",
          timestamp: new Date(new Date(yesterday).getTime() + 2 * 60 * 60 * 1000).toISOString(),
          remarks: "Approved, get well soon.",
        }
      ],
    }
  ];
}

function read(): LeaveRequest[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seedData();
    return JSON.parse(raw);
  } catch {
    return seedData();
  }
}

function write(leaves: LeaveRequest[]) {
  localStorage.setItem(KEY, JSON.stringify(leaves));
  window.dispatchEvent(new Event(EVT));
}

export function useLeaves() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLeaves(read());
    const handler = () => setLeaves(read());
    window.addEventListener(EVT, handler);
    return () => window.removeEventListener(EVT, handler);
  }, []);

  const addLeave = (leave: Omit<LeaveRequest, "id" | "timeline" | "versions" | "status" | "appliedAt">) => {
    const newLeaves = [...leaves];
    const appliedAt = new Date().toISOString();
    const id = `LR-${Math.floor(2000 + Math.random() * 8000)}`;
    const newRequest: LeaveRequest = {
      ...leave,
      id,
      appliedAt,
      status: "pending",
      versions: [],
      timeline: [
        {
          id: `evt_${Date.now()}`,
          action: "Leave Request Submitted",
          actorName: leave.employeeName,
          actorRole: "employee",
          timestamp: appliedAt,
        }
      ]
    };
    newLeaves.unshift(newRequest);
    write(newLeaves);
    return newRequest;
  };

  const updateLeave = (
    id: string,
    updates: Partial<Pick<LeaveRequest, "type" | "startDate" | "endDate" | "days" | "reason" | "documents">>,
    actorName: string,
    actorRole: "employee" | "hr" | "admin"
  ) => {
    const newLeaves = [...leaves];
    const index = newLeaves.findIndex(l => l.id === id);
    if (index === -1) return;
    
    const current = newLeaves[index];
    const now = new Date().toISOString();
    
    // Save current state to versions before applying updates
    const version: LeaveVersion = {
      id: `v_${Date.now()}`,
      type: current.type,
      startDate: current.startDate,
      endDate: current.endDate,
      days: current.days,
      reason: current.reason,
      documents: current.documents,
      editedAt: now,
    };

    let actionStr = "Leave Edited";
    if (updates.reason !== undefined && updates.reason !== current.reason) actionStr = "Reason Updated";
    if (updates.startDate !== undefined && updates.startDate !== current.startDate) actionStr = "Leave Dates Changed";
    
    newLeaves[index] = {
      ...current,
      ...updates,
      versions: [...current.versions, version],
      timeline: [
        ...current.timeline,
        {
          id: `evt_${Date.now()}`,
          action: actionStr,
          actorName,
          actorRole,
          timestamp: now,
        }
      ]
    };
    write(newLeaves);
  };

  const updateStatus = (
    id: string,
    status: LeaveStatus,
    actorName: string,
    actorRole: "employee" | "hr" | "admin",
    remarks?: string
  ) => {
    const newLeaves = [...leaves];
    const index = newLeaves.findIndex(l => l.id === id);
    if (index === -1) return;
    
    const current = newLeaves[index];
    const now = new Date().toISOString();
    
    let actionStr = "Status Updated";
    if (status === "approved") actionStr = "HR Approved Leave";
    if (status === "rejected") actionStr = "HR Rejected Leave";
    if (status === "cancelled") actionStr = "Leave Cancelled";

    newLeaves[index] = {
      ...current,
      status,
      hrRemarks: remarks || current.hrRemarks,
      timeline: [
        ...current.timeline,
        {
          id: `evt_${Date.now()}`,
          action: actionStr,
          actorName,
          actorRole,
          timestamp: now,
          remarks,
        }
      ]
    };
    write(newLeaves);
  };

  return { leaves, addLeave, updateLeave, updateStatus };
}

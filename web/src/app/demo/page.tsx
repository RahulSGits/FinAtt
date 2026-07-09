"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function DemoPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Pre-populate the sessions so the iframes automatically log in
    const employeeSession = {
      role: "employee",
      email: "rahul@example.com",
      name: "Rahul Sharma",
      companyName: "Acme Corp",
      empId: "EMP-001",
      loginAt: new Date().toISOString()
    };
    
    const hrSession = {
      role: "hr",
      email: "priya@example.com",
      name: "Priya Menon",
      companyName: "Acme Corp",
      loginAt: new Date().toISOString()
    };

    localStorage.setItem("gs_session_employee", JSON.stringify(employeeSession));
    localStorage.setItem("gs_session_hr", JSON.stringify(hrSession));
    
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-white overflow-hidden absolute inset-0 z-[100]">
      {/* Top Bar */}
      <div className="h-14 border-b border-white/10 bg-black/50 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition">
            <ArrowLeft size={16} /> Back to Admin
          </Link>
          <div className="h-4 w-px bg-white/20" />
          <h1 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
            geoSelfie Live Demo
          </h1>
        </div>
        <div className="text-sm text-slate-400 hidden sm:block">
          Try submitting a leave on the left and see it appear on the right!
        </div>
      </div>
      
      {/* Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Employee Pane */}
        <div className="flex-1 border-r border-white/10 relative h-full">
          <div className="absolute top-0 left-0 right-0 h-8 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center justify-center pointer-events-none z-10 backdrop-blur-sm">
            <span className="text-xs font-bold tracking-widest text-indigo-300 uppercase">Employee View</span>
          </div>
          <iframe 
            src="/employee?mock_role=employee" 
            className="w-full h-full pt-8 border-0"
          />
        </div>
        
        {/* HR Pane */}
        <div className="flex-1 relative h-full">
          <div className="absolute top-0 left-0 right-0 h-8 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-center pointer-events-none z-10 backdrop-blur-sm">
            <span className="text-xs font-bold tracking-widest text-emerald-300 uppercase">HR View</span>
          </div>
          <iframe 
            src="/hr?mock_role=hr" 
            className="w-full h-full pt-8 border-0"
          />
        </div>
      </div>
    </div>
  );
}

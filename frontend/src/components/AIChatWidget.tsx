"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { Sparkles, X, Send } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
};

const HR_PROMPTS = [
  "Who is absent today?",
  "Show employees with less than 80% attendance.",
  "Which department worked the most overtime this month?",
  "Generate this month's attendance report.",
];

const EMP_PROMPTS = [
  "How many leaves do I have left?",
  "When is my next holiday?",
  "Show my attendance percentage.",
];

const ADMIN_PROMPTS = [
  "How many active companies are there?",
  "Show me the platform MRR.",
  "What is the system status?",
];

export default function AIChatWidget({ userProfile }: { userProfile?: { role: string } }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const prompts = userProfile?.role === "admin" ? ADMIN_PROMPTS : userProfile?.role === "hr" ? HR_PROMPTS : EMP_PROMPTS;

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const newMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, role: userProfile?.role || "employee" }),
      });
      const data = await res.json();
      
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "ai", content: data.response || (data.error ? `Error: ${data.error}` : "Sorry, I couldn't process that request.") },
      ]);
    } catch (error: unknown) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "ai", content: "Network error occurred while contacting AI." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!userProfile) return null; // Hide for unauthenticated users

  return (
    <>
      <button
        className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/30 transition-colors"
        onClick={() => setIsOpen(true)}
        title="Ask geoSelfie AI"
      >
        <Sparkles size={17} />
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[350px] flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-900 shadow-2xl sm:w-[400px]"
          >
            <div 
              className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-slate-800/50 p-4 cursor-grab active:cursor-grabbing select-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">FinAtt AI</h3>
                  <p className="text-[10px] text-emerald-400">Online</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
                    <Sparkles size={24} />
                  </div>
                  <h4 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">How can I help you today?</h4>
                  <p className="text-xs text-slate-500">
                    Try asking me about attendance, reports, or anomalies.
                  </p>
                  
                  <div className="mt-6 flex flex-col gap-2 w-full">
                    {prompts.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(p)}
                        className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-2 text-left text-xs text-indigo-600 dark:text-indigo-300 transition hover:bg-indigo-500/10"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}
                    >
                      {msg.role === "ai" && (
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500 text-slate-900 dark:text-white mt-1">
                          <Sparkles size={12} />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                          msg.role === "user"
                            ? "bg-indigo-600 text-slate-900 dark:text-white rounded-tr-sm"
                            : "bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/5 rounded-tl-sm"
                        }`}
                      >
                        <div
                          className="whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{
                            __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start gap-2">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500 text-slate-900 dark:text-white mt-1">
                        <Sparkles size={12} />
                      </div>
                      <div className="flex items-center gap-1 rounded-2xl bg-slate-800 px-4 py-3 border border-slate-200 dark:border-white/5 rounded-tl-sm">
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 dark:border-white/10 bg-slate-800/50 p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-900 py-3 pl-4 pr-12 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-slate-900 dark:text-white disabled:bg-slate-700 disabled:text-slate-500 transition-colors"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

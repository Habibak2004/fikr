import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Leaf } from "lucide-react";

function TypingDots() {
  return (
    <div className="flex gap-1 items-center px-3 py-2">
      {[0, 0.18, 0.36].map((d, i) => (
        <motion.span key={i} className="h-2 w-2 rounded-full bg-green-300"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.75, repeat: Infinity, delay: d, ease: "easeInOut" }} />
      ))}
    </div>
  );
}

export default function GardenSetup({ onPlanReady }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const unsubRef = useRef(null);
  const endRef = useRef(null);
  const lastCount = useRef(0);

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list("-created_date", 50),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments", selectedCourse?.id],
    queryFn: () => base44.entities.Assignment.filter({ course_id: selectedCourse.id, completed: false }),
    enabled: !!selectedCourse,
  });

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  const tryParsePlan = (text) => {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.tasks?.length) return parsed;
      }
    } catch {}
    return null;
  };

  const startChat = async () => {
    setChatStarted(true);
    setIsTyping(true);
    const conv = await base44.agents.createConversation({ agent_name: "focus_coach", metadata: { name: "Fikr Focus" } });
    setConversation(conv);

    if (unsubRef.current) unsubRef.current();
    const unsub = base44.agents.subscribeToConversation(conv.id, (data) => {
      const msgs = (data.messages || []).filter(m => m.content && !m.content.startsWith("["));
      setMessages(msgs);
      const last = [...msgs].reverse().find(m => m.role === "assistant");
      if (last && msgs.length > lastCount.current) {
        lastCount.current = msgs.length;
        setIsTyping(false);
        const plan = tryParsePlan(last.content);
        if (plan) {
          onPlanReady({
            ...plan,
            courseId: selectedCourse?.id,
            courseName: selectedCourse?.name,
            courseCode: selectedCourse?.code,
            assignmentName: selectedAssignment?.name,
          });
        }
      }
    });
    unsubRef.current = unsub;

    const courseCtx = selectedCourse ? `Course: ${selectedCourse.name} (${selectedCourse.code}).` : "";
    const assignCtx = selectedAssignment ? ` Assignment: "${selectedAssignment.name}".` : "";
    await base44.agents.addMessage(conv, {
      role: "user",
      content: `I want to start a focused study session. ${courseCtx}${assignCtx} Please ask me your 2–3 clarifying questions (all at once) so you can build a problem-level task plan.`,
    });
  };

  const send = async () => {
    if (!input.trim() || !conversation) return;
    const text = input.trim();
    setInput("");
    setIsTyping(true);
    await base44.agents.addMessage(conversation, { role: "user", content: text });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "linear-gradient(160deg, #fafdf7 0%, #f0fdf4 50%, #fdf9f5 100%)" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-5">

        {/* Header */}
        <div className="text-center space-y-2 pb-2">
          <div className="flex items-center justify-center gap-2">
            <Leaf className="h-5 w-5 text-green-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-green-500">Fikr Focus Garden</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-800">Let's start your session</h1>
          <p className="text-sm text-stone-400">One question at a time. Every step helps your plant grow.</p>
        </div>

        {!chatStarted ? (
          <>
            {/* Course selection */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Which course?</p>
              <div className="flex flex-wrap gap-2">
                {courses.map(c => (
                  <button key={c.id} onClick={() => { setSelectedCourse(c); setSelectedAssignment(null); }}
                    className="px-3.5 py-2 rounded-2xl text-sm font-semibold transition-all"
                    style={{
                      background: selectedCourse?.id === c.id ? "#4a7c59" : "white",
                      color: selectedCourse?.id === c.id ? "white" : "#4a7c59",
                      border: `1.5px solid ${selectedCourse?.id === c.id ? "#4a7c59" : "#d1fae5"}`,
                    }}>
                    {c.icon && <span className="mr-1">{c.icon}</span>}{c.code}
                  </button>
                ))}
                {courses.length === 0 && (
                  <p className="text-sm text-stone-300 italic">No courses yet — you can still start a session.</p>
                )}
              </div>
            </div>

            {/* Assignment selection */}
            <AnimatePresence>
              {selectedCourse && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Which assignment?</p>
                  <div className="flex flex-col gap-2">
                    {assignments.map(a => (
                      <button key={a.id} onClick={() => setSelectedAssignment(a)}
                        className="w-full text-left px-4 py-3 rounded-2xl text-sm transition-all"
                        style={{
                          background: selectedAssignment?.id === a.id ? "#f0fdf4" : "white",
                          color: "#374151",
                          border: `1.5px solid ${selectedAssignment?.id === a.id ? "#4a7c59" : "#e5e7eb"}`,
                        }}>
                        <p className="font-semibold">{a.name}</p>
                        {a.due_date && (
                          <p className="text-xs text-stone-400 mt-0.5">Due {new Date(a.due_date).toLocaleDateString()}</p>
                        )}
                      </button>
                    ))}
                    <button onClick={() => setSelectedAssignment({ name: "Other / No assignment" })}
                      className="w-full text-left px-4 py-3 rounded-2xl text-sm text-stone-400 transition-all hover:bg-stone-50"
                      style={{ border: "1.5px dashed #e5e7eb" }}>
                      Just study freely
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={startChat}
              disabled={!selectedCourse && courses.length > 0}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #5a9a6f, #4a7c59)" }}>
              🌱 Plan my session
            </button>
          </>
        ) : (
          <>
            {/* Context pill */}
            {(selectedCourse || selectedAssignment) && (
              <div className="flex gap-2 flex-wrap">
                {selectedCourse && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                    {selectedCourse.code}
                  </span>
                )}
                {selectedAssignment && (
                  <span className="px-3 py-1 rounded-full text-xs bg-stone-100 text-stone-500 border border-stone-200">
                    {selectedAssignment.name}
                  </span>
                )}
              </div>
            )}

            {/* Chat window */}
            <div className="rounded-3xl overflow-hidden" style={{ background: "white", border: "1.5px solid #d1fae5" }}>
              <div className="max-h-72 overflow-y-auto p-4 space-y-2.5" style={{ scrollbarWidth: "none" }}>
                <AnimatePresence initial={false}>
                  {messages.map((m, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[86%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-stone-800 text-white rounded-br-sm"
                          : "text-stone-700 rounded-bl-sm"
                      }`} style={m.role !== "user" ? { background: "#f0fdf4", border: "1px solid #d1fae5" } : {}}>
                        {m.content}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-sm" style={{ background: "#f0fdf4", border: "1px solid #d1fae5" }}>
                      <TypingDots />
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* Input */}
              <div className="flex gap-2 p-3 border-t border-green-50">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && send()}
                  placeholder="Type your answer…"
                  autoFocus
                  className="flex-1 h-10 rounded-xl px-3 text-sm text-stone-700 border border-green-100 bg-stone-50 focus:outline-none focus:border-green-300 transition-colors placeholder:text-stone-300"
                />
                <button onClick={send} disabled={!input.trim()}
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-30"
                  style={{ background: "#5a9a6f" }}>
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
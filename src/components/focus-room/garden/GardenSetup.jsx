import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";

function TypingDots() {
  return (
    <div className="flex gap-1 items-center px-2 py-1">
      {[0, 0.2, 0.4].map((d, i) => (
        <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-green-400"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: d, ease: "easeInOut" }} />
      ))}
    </div>
  );
}

export default function GardenSetup({ courses, onPlanReady }) {
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id || "");
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const unsubRef = useRef(null);
  const endRef = useRef(null);
  const lastCount = useRef(0);

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

  const init = async (courseId) => {
    setIsTyping(true);
    const course = courses.find(c => c.id === courseId);
    const conv = await base44.agents.createConversation({ agent_name: "focus_coach", metadata: { name: "Garden Focus" } });
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
        if (plan) onPlanReady({ ...plan, courseId, courseName: course?.name, courseCode: course?.code });
      }
    });
    unsubRef.current = unsub;

    const courseCtx = course ? ` Course: ${course.name} (${course.code}).` : "";
    await base44.agents.addMessage(conv, {
      role: "user",
      content: `I want to start a focused study session.${courseCtx} Please ask me your clarifying questions so you can build a plan.`,
    });
  };

  useEffect(() => {
    if (initialized || !courses.length) return;
    setInitialized(true);
    init(selectedCourse);
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, [courses]);

  const send = async () => {
    if (!input.trim() || !conversation) return;
    const text = input.trim();
    setInput("");
    setIsTyping(true);
    await base44.agents.addMessage(conversation, { role: "user", content: text });
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "linear-gradient(160deg, #f9fdf6 0%, #f0fdf4 50%, #fdf9f0 100%)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-5"
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <span className="text-4xl">🌱</span>
          <h1 className="text-2xl font-bold text-stone-700">Focus Garden</h1>
          <p className="text-sm text-stone-400">Let's plan your session. One question at a time.</p>
        </div>

        {/* Course selector */}
        {courses.length > 1 && (
          <div className="flex gap-2 flex-wrap justify-center">
            {courses.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCourse(c.id)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: selectedCourse === c.id ? "#5a9a6f" : "#f0fdf4",
                  color: selectedCourse === c.id ? "white" : "#5a9a6f",
                  border: `1.5px solid ${selectedCourse === c.id ? "#5a9a6f" : "#d1fae5"}`,
                }}
              >
                {c.code || c.name}
              </button>
            ))}
          </div>
        )}

        {/* Chat */}
        <div
          className="rounded-3xl p-4 space-y-3"
          style={{ background: "white", border: "1.5px solid #d1fae5", minHeight: 200 }}
        >
          <div className="max-h-64 overflow-y-auto space-y-2.5" style={{ scrollbarWidth: "none" }}>
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-stone-700 text-white rounded-br-sm"
                      : "text-stone-700 rounded-bl-sm"
                  }`}
                    style={m.role !== "user" ? { background: "#f0fdf4", border: "1px solid #d1fae5" } : {}}>
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
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Type your reply…"
            className="flex-1 h-11 rounded-2xl px-4 text-sm text-stone-700 border border-green-200 bg-white focus:outline-none focus:border-green-400 transition-colors placeholder:text-stone-300"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="h-11 w-11 rounded-2xl flex items-center justify-center text-white transition-all disabled:opacity-30"
            style={{ background: "#5a9a6f" }}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
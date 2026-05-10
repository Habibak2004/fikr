import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Send, RefreshCw } from "lucide-react";

function TypingDots() {
  return (
    <div className="flex gap-1 items-center px-2 py-1">
      {[0, 0.2, 0.4].map((delay, i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-stone-400"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

export default function FocusCoachPanel({ selectedCourse, courses, onPlanReady }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const unsubRef = useRef(null);
  const messagesEndRef = useRef(null);
  const lastMsgCount = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const tryParsePlan = (text) => {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.tasks && Array.isArray(parsed.tasks)) return parsed;
      }
    } catch {}
    return null;
  };

  const initConversation = async () => {
    if (initialized) return;
    setInitialized(true);
    setIsTyping(true);

    const course = courses.find(c => c.id === selectedCourse);
    const courseCtx = course ? ` The course is ${course.name} (${course.code}).` : "";

    const conv = await base44.agents.createConversation({
      agent_name: "focus_coach",
      metadata: { name: "Focus Session" },
    });
    setConversation(conv);

    if (unsubRef.current) unsubRef.current();
    const unsub = base44.agents.subscribeToConversation(conv.id, (data) => {
      const msgs = (data.messages || []).filter(m => m.content && !m.content.startsWith("["));
      setMessages(msgs);

      const lastAssistant = [...msgs].reverse().find(m => m.role === "assistant");
      if (lastAssistant && msgs.length > lastMsgCount.current) {
        lastMsgCount.current = msgs.length;
        setIsTyping(false);

        const plan = tryParsePlan(lastAssistant.content);
        if (plan) onPlanReady(plan);
      }
    });
    unsubRef.current = unsub;

    await base44.agents.addMessage(conv, {
      role: "user",
      content: `I want to start a focus session.${courseCtx} Please ask me your clarifying questions.`,
    });
  };

  useEffect(() => {
    initConversation();
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || !conversation) return;
    const text = input.trim();
    setInput("");
    setIsTyping(true);
    await base44.agents.addMessage(conversation, { role: "user", content: text });
  };

  const resetCoach = () => {
    if (unsubRef.current) unsubRef.current();
    setConversation(null);
    setMessages([]);
    setInput("");
    setIsTyping(false);
    setInitialized(false);
    lastMsgCount.current = 0;
    onPlanReady(null);
    setTimeout(() => initConversation(), 100);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Messages */}
      <div className="max-h-60 overflow-y-auto space-y-2" style={{ scrollbarWidth: "none" }}>
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-stone-800 text-white rounded-br-sm"
                  : "bg-stone-100 text-stone-700 rounded-bl-sm"
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-stone-100 rounded-xl rounded-bl-sm">
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Reply to coach…"
          className="flex-1 h-8 rounded-lg bg-stone-100 text-stone-800 placeholder:text-stone-400 text-xs px-3 border border-stone-200 focus:outline-none focus:border-stone-300 transition-colors"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="h-8 w-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-white flex items-center justify-center transition-colors disabled:opacity-30"
        >
          <Send className="h-3 w-3" />
        </button>
        <button
          onClick={resetCoach}
          className="h-8 w-8 rounded-lg border border-stone-200 text-stone-400 hover:text-stone-600 flex items-center justify-center transition-colors"
          title="Start over"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
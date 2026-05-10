import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Send, X, MessageCircle } from "lucide-react";

// Soft breathing orb that pulses
function CompanionOrb({ isOpen, onClick, hasMessage }) {
  return (
    <motion.button
      onClick={onClick}
      className="relative h-12 w-12 rounded-full focus:outline-none"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Outer pulse ring */}
      {hasMessage && (
        <motion.span
          className="absolute inset-0 rounded-full bg-primary/20"
          animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {/* Orb */}
      <motion.span
        className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/80 to-blue-400/80 shadow-md"
        animate={isOpen ? {} : { scale: [1, 1.04, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Icon */}
      <span className="absolute inset-0 flex items-center justify-center text-white text-lg">
        {isOpen ? <X className="h-4 w-4" /> : "✦"}
      </span>
    </motion.button>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? "bg-stone-800 text-white rounded-br-sm"
          : "bg-white/90 text-stone-700 border border-stone-100 rounded-bl-sm shadow-sm"
      }`}>
        {msg.content}
      </div>
    </motion.div>
  );
}

// Typing indicator
function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
      <div className="bg-white/90 border border-stone-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
        {[0, 0.2, 0.4].map((delay, i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-stone-300"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay, ease: "easeInOut" }}
          />
        ))}
      </div>
    </motion.div>
  );
}

const CHECKIN_INTERVALS_MS = [3 * 60 * 1000, 8 * 60 * 1000, 15 * 60 * 1000]; // 3, 8, 15 min

export default function StudyCompanion({ isTimerRunning, isBreak, completedTaskCount, plan }) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const unsubRef = useRef(null);
  const messagesEndRef = useRef(null);
  const checkinTimerRef = useRef(null);
  const checkinIndexRef = useRef(0);
  const prevCompletedRef = useRef(0);

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Init conversation on first open
  const initConversation = async () => {
    if (initialized) return;
    setInitialized(true);
    setIsTyping(true);
    const conv = await base44.agents.createConversation({
      agent_name: "study_companion",
      metadata: { name: "Study Session" },
    });
    setConversation(conv);

    if (unsubRef.current) unsubRef.current();
    const unsub = base44.agents.subscribeToConversation(conv.id, (data) => {
      const msgs = (data.messages || []).filter(m => m.content);
      setMessages(msgs);
      setIsTyping(false);
      if (!isOpen) setHasNewMessage(true);
    });
    unsubRef.current = unsub;

    const courseContext = plan?.sessionGoal ? ` We're working on: "${plan.sessionGoal}".` : "";
    await base44.agents.addMessage(conv, {
      role: "user",
      content: `I just opened the Focus Room.${courseContext} Say hi — just a brief, warm greeting. Keep it to 1–2 sentences.`,
    });
  };

  const handleOpen = () => {
    setIsOpen(true);
    setHasNewMessage(false);
    if (!initialized) initConversation();
  };

  // Auto check-ins when timer is running
  useEffect(() => {
    if (!isTimerRunning || !conversation) {
      clearTimeout(checkinTimerRef.current);
      return;
    }
    const scheduleCheckin = () => {
      const delay = CHECKIN_INTERVALS_MS[checkinIndexRef.current] || CHECKIN_INTERVALS_MS[CHECKIN_INTERVALS_MS.length - 1];
      checkinTimerRef.current = setTimeout(async () => {
        checkinIndexRef.current = Math.min(checkinIndexRef.current + 1, CHECKIN_INTERVALS_MS.length - 1);
        setIsTyping(true);
        if (!isOpen) setHasNewMessage(true);
        await base44.agents.addMessage(conversation, {
          role: "user",
          content: `[Auto check-in after ${Math.round(delay / 60000)} minutes of focus time. Give a gentle, brief check-in. 1 sentence max. No explanation needed — just speak to me directly.]`,
        });
        scheduleCheckin();
      }, delay);
    };
    scheduleCheckin();
    return () => clearTimeout(checkinTimerRef.current);
  }, [isTimerRunning, conversation]);

  // Task completion nudge
  useEffect(() => {
    if (!conversation) return;
    if (completedTaskCount > prevCompletedRef.current) {
      prevCompletedRef.current = completedTaskCount;
      setIsTyping(true);
      if (!isOpen) setHasNewMessage(true);
      base44.agents.addMessage(conversation, {
        role: "user",
        content: `[I just completed a task. ${completedTaskCount} done so far. Acknowledge briefly and warmly — 1 sentence.]`,
      });
    }
  }, [completedTaskCount, conversation]);

  // Break nudge
  useEffect(() => {
    if (!conversation || !isBreak) return;
    setIsTyping(true);
    if (!isOpen) setHasNewMessage(true);
    base44.agents.addMessage(conversation, {
      role: "user",
      content: `[Break started. Say something brief and supportive about taking a break. 1 sentence.]`,
    });
  }, [isBreak]);

  const sendMessage = async () => {
    if (!input.trim() || !conversation) return;
    const text = input.trim();
    setInput("");
    setIsTyping(true);
    await base44.agents.addMessage(conversation, { role: "user", content: text });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="w-72 rounded-3xl shadow-xl overflow-hidden border border-stone-100"
            style={{ background: "linear-gradient(160deg, #fdf8f4 0%, #f5f0f8 100%)" }}
          >
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-stone-100/80 flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/70 to-blue-400/70 flex items-center justify-center text-white text-xs">✦</div>
              <div>
                <p className="text-xs font-bold text-stone-700">Study Companion</p>
                <p className="text-[10px] text-stone-400">here with you</p>
              </div>
              <div className="ml-auto">
                {isTimerRunning && (
                  <motion.span
                    className="h-2 w-2 rounded-full bg-green-400 block"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="h-64 overflow-y-auto px-4 py-4 space-y-3">
              {messages.filter(m => m.role !== "user" || !m.content?.startsWith("[")).map((msg, i) => (
                <Message key={i} msg={msg} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-2 border-t border-stone-100/80 flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Say something…"
                className="rounded-xl text-sm border-stone-200 bg-white/80 h-9 flex-1"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="h-9 w-9 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors disabled:opacity-30"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orb trigger */}
      <CompanionOrb isOpen={isOpen} onClick={isOpen ? () => setIsOpen(false) : handleOpen} hasMessage={hasNewMessage} />
    </div>
  );
}
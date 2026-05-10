import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Send, Volume2, VolumeX, ChevronDown } from "lucide-react";
import CompanionFace from "./CompanionFace";

// ── Speech synthesis helper ──────────────────────────────────────────────────
function speak(text, onStart, onEnd) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.88;
  utt.pitch = 1.05;
  utt.volume = 0.9;
  // prefer a soft female voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    /samantha|karen|moira|victoria|zira|google uk english female/i.test(v.name)
  ) || voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("female"))
    || voices.find(v => v.lang.startsWith("en")) || null;
  if (preferred) utt.voice = preferred;
  utt.onstart = onStart;
  utt.onend = onEnd;
  utt.onerror = onEnd;
  window.speechSynthesis.speak(utt);
}

// ── Mood detection ────────────────────────────────────────────────────────────
function detectMood(text = "") {
  const t = text.toLowerCase();
  if (/nice|great|done|good job|proud|well done|crushed|amazing/i.test(t)) return "happy";
  if (/break|rest|breathe|recharge/i.test(t)) return "break";
  if (/stuck|hard|tough|struggling/i.test(t)) return "encouraging";
  if (/let me think|checking|hold on/i.test(t)) return "thinking";
  return "idle";
}

// ── Typing dots ───────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex gap-1 items-center px-3 py-2">
      {[0, 0.2, 0.4].map((delay, i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-white/60"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ── Individual message bubble ─────────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? "bg-white/20 text-white rounded-br-sm"
          : "bg-white/15 text-white rounded-bl-sm"
      }`}>
        {msg.content}
      </div>
    </motion.div>
  );
}

const CHECKIN_INTERVALS = [3 * 60 * 1000, 8 * 60 * 1000, 15 * 60 * 1000];

export default function StudyCompanion({ isTimerRunning, isBreak, completedTaskCount, plan }) {
  const [isOpen, setIsOpen]             = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState("");
  const [isTyping, setIsTyping]         = useState(false);
  const [hasNew, setHasNew]             = useState(false);
  const [initialized, setInitialized]   = useState(false);
  const [mood, setMood]                 = useState("idle");
  const [isSpeaking, setIsSpeaking]     = useState(false);
  const [voiceOn, setVoiceOn]           = useState(true);
  const [latestMsg, setLatestMsg]       = useState("");

  const unsubRef        = useRef(null);
  const messagesEndRef  = useRef(null);
  const checkinTimer    = useRef(null);
  const checkinIdx      = useRef(0);
  const prevCompleted   = useRef(0);
  const lastMsgCount    = useRef(0);

  // scroll to bottom
  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, isTyping]);

  // speak new assistant messages
  const speakMessage = useCallback((text) => {
    if (!voiceOn) return;
    setIsSpeaking(true);
    speak(text, () => setIsSpeaking(true), () => setIsSpeaking(false));
  }, [voiceOn]);

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
      const msgs = (data.messages || []).filter(m => m.content && !m.content.startsWith("["));
      setMessages(msgs);

      const lastAssistant = [...msgs].reverse().find(m => m.role === "assistant");
      if (lastAssistant && msgs.length > lastMsgCount.current) {
        lastMsgCount.current = msgs.length;
        setIsTyping(false);
        setMood(detectMood(lastAssistant.content));
        setLatestMsg(lastAssistant.content);
        if (!isOpen) setHasNew(true);
        speakMessage(lastAssistant.content);
      }
    });
    unsubRef.current = unsub;

    const courseCtx = plan?.sessionGoal ? ` We're working on: "${plan.sessionGoal}".` : "";
    await base44.agents.addMessage(conv, {
      role: "user",
      content: `I just opened the Focus Room.${courseCtx} Say hi — brief, warm, 1–2 sentences.`,
    });
  };

  const handleOpen = () => {
    setIsOpen(true);
    setHasNew(false);
    if (!initialized) initConversation();
  };

  // Auto check-ins
  useEffect(() => {
    if (!isTimerRunning || !conversation) { clearTimeout(checkinTimer.current); return; }
    const schedule = () => {
      const delay = CHECKIN_INTERVALS[checkinIdx.current] ?? CHECKIN_INTERVALS.at(-1);
      checkinTimer.current = setTimeout(async () => {
        checkinIdx.current = Math.min(checkinIdx.current + 1, CHECKIN_INTERVALS.length - 1);
        setIsTyping(true);
        if (!isOpen) setHasNew(true);
        await base44.agents.addMessage(conversation, {
          role: "user",
          content: `[Auto check-in after ${Math.round(delay / 60000)} min of focus. One gentle sentence, speak directly to me.]`,
        });
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(checkinTimer.current);
  }, [isTimerRunning, conversation]);

  // Task complete
  useEffect(() => {
    if (!conversation || completedTaskCount <= prevCompleted.current) return;
    prevCompleted.current = completedTaskCount;
    setIsTyping(true);
    if (!isOpen) setHasNew(true);
    base44.agents.addMessage(conversation, {
      role: "user",
      content: `[Task completed — ${completedTaskCount} done. Acknowledge warmly in 1 sentence.]`,
    });
  }, [completedTaskCount, conversation]);

  // Break
  useEffect(() => {
    if (!conversation || !isBreak) return;
    setIsTyping(true);
    if (!isOpen) setHasNew(true);
    base44.agents.addMessage(conversation, {
      role: "user",
      content: `[Break started. One supportive sentence.]`,
    });
  }, [isBreak]);

  const sendMessage = async () => {
    if (!input.trim() || !conversation) return;
    const text = input.trim();
    setInput("");
    setIsTyping(true);
    await base44.agents.addMessage(conversation, { role: "user", content: text });
  };

  // ── Collapsed floating face ───────────────────────────────────────────────
  const FloatingFace = () => (
    <motion.button
      onClick={handleOpen}
      className="relative focus:outline-none"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
    >
      {/* Breathing halo */}
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(74,127,181,0.35) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.7, 0.2, 0.7] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* New message ring */}
      {hasNew && (
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-white/70"
          animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      )}
      <CompanionFace mood={mood} isSpeaking={isSpeaking} size={64} />
      {/* Latest message tooltip */}
      <AnimatePresence>
        {latestMsg && !isOpen && (
          <motion.div
            key={latestMsg}
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            className="absolute right-16 bottom-1 w-48 bg-white rounded-2xl rounded-br-sm shadow-lg border border-stone-100 px-3 py-2 text-xs text-stone-600 leading-snug pointer-events-none"
          >
            {latestMsg.length > 80 ? latestMsg.slice(0, 80) + "…" : latestMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );

  // ── Expanded panel ────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="w-72 rounded-3xl shadow-2xl overflow-hidden"
            style={{
              background: "linear-gradient(160deg, #3a6fa8 0%, #5b3f9e 100%)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            {/* Face header */}
            <div className="flex flex-col items-center pt-6 pb-4 px-4 relative">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-3 h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => { setVoiceOn(v => !v); if (isSpeaking) window.speechSynthesis?.cancel(); }}
                className="absolute top-3 left-3 h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                title={voiceOn ? "Mute voice" : "Enable voice"}
              >
                {voiceOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              </button>

              <CompanionFace mood={mood} isSpeaking={isSpeaking} size={80} />

              <p className="text-white text-xs font-semibold mt-3 tracking-wide">Study Companion</p>
              <div className="flex items-center gap-1.5 mt-1">
                {isTimerRunning ? (
                  <>
                    <motion.span
                      className="h-1.5 w-1.5 rounded-full bg-green-300"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                    />
                    <span className="text-white/50 text-[10px]">with you</span>
                  </>
                ) : (
                  <span className="text-white/40 text-[10px]">here when you're ready</span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div
              className="h-52 overflow-y-auto px-4 py-3 space-y-2.5"
              style={{ scrollbarWidth: "none" }}
            >
              {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/15 rounded-2xl rounded-bl-sm">
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 pb-4 pt-2 flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Say something…"
                className="flex-1 h-9 rounded-xl bg-white/15 text-white placeholder:text-white/40 text-sm px-3 border border-white/10 focus:outline-none focus:border-white/30 transition-colors"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="h-9 w-9 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors disabled:opacity-30"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating face when closed */}
      {!isOpen && <FloatingFace />}
    </div>
  );
}
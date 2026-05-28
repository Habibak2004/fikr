import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Trash2, ArrowRight, Brain, CheckCircle2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const PROMPTS = [
  "What's taking up space in your head right now?",
  "What are you worried you'll forget?",
  "What task feels heaviest on your mind?",
  "Is there anything you're anxious about?",
  "What unfinished thing is nagging at you?",
];

const CATEGORIES = {
  task: { label: "Task", color: "#c4a882", bg: "#fdf8f3" },
  worry: { label: "Worry", color: "#f87171", bg: "#fff1f1" },
  reminder: { label: "Reminder", color: "#60a5fa", bg: "#eff6ff" },
  feeling: { label: "Feeling", color: "#a78bfa", bg: "#f5f3ff" },
  other: { label: "Other", color: "#94a3b8", bg: "#f8fafc" },
};

export default function UnpackingMode({ energyLevel, onDone, onSkip }) {
  const [input, setInput] = useState("");
  const [items, setItems] = useState([]);
  const [promptIdx, setPromptIdx] = useState(0);
  const [categorizing, setCategorizing] = useState(false);
  const [insight, setInsight] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPromptIdx(i => (i + 1) % PROMPTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const addItem = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setCategorizing(true);

    // AI categorize
    let category = "other";
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Categorize this thought into exactly one of: task, worry, reminder, feeling, other.
Thought: "${text}"
Respond with ONLY JSON: { "category": "task" | "worry" | "reminder" | "feeling" | "other" }`,
        response_json_schema: {
          type: "object",
          properties: { category: { type: "string" } }
        }
      });
      if (res?.category && CATEGORIES[res.category]) category = res.category;
    } catch {}

    setCategorizing(false);
    setItems(prev => [...prev, { id: Date.now(), text, category }]);
    inputRef.current?.focus();
  };

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const handleFinish = async () => {
    if (items.length === 0) { onDone([]); return; }
    setLoadingInsight(true);

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `A student just unpacked their mental clutter before a reset session. Energy level: ${energyLevel}.
Their thoughts: ${items.map(i => `[${i.category}] ${i.text}`).join("; ")}

Write a short (2–3 sentences), warm, non-clinical acknowledgment that:
1. Validates what they've shared without being dismissive
2. Reminds them these thoughts are now safely "parked" — they don't need to carry them during the reset
3. Encourages them gently toward the physical reset

Use calm, grounded, supportive language. No bullet points. No clinical words.`,
      });
      setInsight(typeof res === "string" ? res : res?.response || "Your thoughts are safely parked. Let's focus on your space now.");
    } catch {
      setInsight("Your thoughts are safely parked here. Now let's give your environment the reset it needs.");
    }

    setLoadingInsight(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-[#f7f5f2]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xl text-center"
        >
          <div className="h-16 w-16 rounded-full bg-[#e8e0d6] flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-[#c4a882]" />
          </div>
          <h2 className="text-2xl font-semibold text-[#2c2416] mb-4">Mind unpacked.</h2>
          {loadingInsight ? (
            <p className="text-[#9a8f82] animate-pulse">Reflecting on what you shared...</p>
          ) : (
            <p className="text-[#5a4f42] text-base leading-relaxed mb-8 max-w-md mx-auto">{insight}</p>
          )}

          {/* Parked items summary */}
          {items.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {items.map(item => (
                <span
                  key={item.id}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: CATEGORIES[item.category].bg, color: CATEGORIES[item.category].color }}
                >
                  {item.text.length > 30 ? item.text.slice(0, 30) + "…" : item.text}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={() => onDone(items)}
            className="w-full max-w-xs mx-auto h-13 rounded-2xl font-medium text-base flex items-center justify-center gap-2 transition-all duration-200"
            style={{ backgroundColor: "#4a3b2a", color: "white", padding: "14px" }}
          >
            Continue to Reset <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-[#f7f5f2]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="h-14 w-14 rounded-2xl bg-[#e8e0d6] flex items-center justify-center mx-auto mb-5">
            <Brain className="h-7 w-7 text-[#7a5c3a]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-[#2c2416] tracking-tight mb-3">
            Unpack your mind
          </h1>
          <p className="text-[#9a8f82] text-sm max-w-sm mx-auto leading-relaxed">
            Dump every thought, task, or worry that's taking up space. We'll park them safely so you can fully focus on your reset.
          </p>
        </div>

        {/* Input */}
        <div className="bg-white rounded-3xl border border-[#e8e0d6] p-5 shadow-sm mb-4">
          <AnimatePresence mode="wait">
            <motion.p
              key={promptIdx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4 }}
              className="text-xs text-[#c4a882] font-medium uppercase tracking-widest mb-3"
            >
              {PROMPTS[promptIdx]}
            </motion.p>
          </AnimatePresence>
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addItem()}
              placeholder="Type anything and press Enter..."
              className="flex-1 bg-[#f7f5f2] rounded-xl px-4 py-3 text-sm text-[#2c2416] placeholder-[#c4bdb5] outline-none border-0 focus:ring-1 focus:ring-[#c4a882]/50"
              autoFocus
            />
            <button
              onClick={addItem}
              disabled={!input.trim() || categorizing}
              className="h-11 w-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
              style={{ backgroundColor: "#4a3b2a", color: "white" }}
            >
              {categorizing ? (
                <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Items */}
        <AnimatePresence>
          {items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-4 space-y-2"
            >
              {items.map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-[#e8e0d6]"
                >
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide flex-shrink-0"
                    style={{ backgroundColor: CATEGORIES[item.category].bg, color: CATEGORIES[item.category].color }}
                  >
                    {CATEGORIES[item.category].label}
                  </span>
                  <span className="flex-1 text-sm text-[#3a3028]">{item.text}</span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="h-6 w-6 rounded-full flex items-center justify-center text-[#c4bdb5] hover:text-[#9a8f82] transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-3 mt-2">
          <button
            onClick={onSkip}
            className="flex-1 h-12 rounded-2xl border border-[#e8e0d6] bg-white text-[#9a8f82] text-sm hover:border-[#c4a882] transition-all"
          >
            Skip for now
          </button>
          <button
            onClick={handleFinish}
            disabled={loadingInsight}
            className="flex-2 flex-grow h-12 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            style={{ backgroundColor: "#4a3b2a", color: "white" }}
          >
            {loadingInsight ? "Processing..." : items.length > 0 ? `Park ${items.length} thought${items.length > 1 ? "s" : ""} & continue` : "Continue"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {items.length === 0 && (
          <p className="text-center text-[#c4bdb5] text-xs mt-6">
            Add at least one thought, or skip if your mind feels clear.
          </p>
        )}
      </motion.div>
    </div>
  );
}
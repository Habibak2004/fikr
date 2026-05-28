import { useState } from "react";
import { Search, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

const SUGGESTIONS = ["plan my evening", "I'm overwhelmed", "low energy mode", "what should I do next?", "help me catch up"];

export default function AICommandBar({ assignments = [], onModeChange }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const submit = async (q) => {
    const text = q || query;
    if (!text.trim()) return;
    setQuery(text);
    setLoading(true);
    setResponse(null);

    const pending = assignments.filter(a => !a.completed);
    const overdue = pending.filter(a => a.due_date && new Date(a.due_date) < new Date());

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an empathetic executive functioning assistant for an ADHD/overwhelmed student.
User said: "${text}"
Context: ${pending.length} pending tasks, ${overdue.length} overdue.
Tasks: ${pending.slice(0, 5).map(a => `${a.name} (due: ${a.due_date ? new Date(a.due_date).toLocaleDateString() : 'no date'})`).join(", ")}

Respond in 1-2 sentences: be warm, specific, actionable. Suggest one concrete next step. If overwhelmed, suggest stabilizing first. Never be preachy or pushy.`,
    });

    setLoading(false);
    setResponse(result);

    if (/overwhelm|low energy|catch up|stabilize/i.test(text)) {
      onModeChange?.("catchup");
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="Plan my evening... or I'm feeling low energy"
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border/60 bg-white text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
        />
        {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
      </div>

      {/* Suggestions */}
      {!response && !loading && (
        <div className="flex gap-1.5 flex-wrap">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => submit(s)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors border border-transparent hover:border-primary/20"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {response && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2.5 bg-primary/6 border border-primary/15 rounded-xl px-4 py-3"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground/85 leading-relaxed">{response}</p>
            <button onClick={() => { setResponse(null); setQuery(""); }} className="text-muted-foreground hover:text-foreground ml-auto flex-shrink-0 text-xs">✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
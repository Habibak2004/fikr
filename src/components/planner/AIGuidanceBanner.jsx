import { useState, useEffect } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MESSAGES = [
  { text: "Your energy is peaking now. Let's tackle your highest-priority task.", accent: "primary" },
  { text: "You only need 18 minutes to reduce tomorrow's stress significantly.", accent: "primary" },
  { text: "You've been avoiding admin tasks. Let's clear one quickly — 2 minutes.", accent: "accent" },
  { text: "Today has high cognitive load. Prioritize completion over perfection.", accent: "secondary" },
  { text: "Small wins compound. Start with something easy to build momentum.", accent: "primary" },
  { text: "It's okay to pause. A partial session still counts as progress.", accent: "secondary" },
  { text: "Momentum returns quickly. Pick up where you left off.", accent: "primary" },
];

export default function AIGuidanceBanner({ assignments = [] }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  const overdue = assignments.filter(a => !a.completed && a.due_date && new Date(a.due_date) < new Date());
  const urgent = assignments.filter(a => {
    if (a.completed || !a.due_date) return false;
    const diff = (new Date(a.due_date) - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 2;
  });

  const dynamicMessage = overdue.length > 0
    ? `You have ${overdue.length} overdue task${overdue.length > 1 ? "s" : ""}. Let's tackle one right now — you've got this.`
    : urgent.length > 0
    ? `"${urgent[0].name}" is due soon. Let's start with just 5 minutes.`
    : MESSAGES[idx].text;

  const refresh = () => {
    setVisible(false);
    setTimeout(() => { setIdx(i => (i + 1) % MESSAGES.length); setVisible(true); }, 200);
  };

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          className="flex items-center gap-3 bg-primary/8 border border-primary/15 rounded-2xl px-5 py-3.5"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)/0.07) 0%, hsl(var(--secondary)/0.05) 100%)" }}
        >
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground/90 flex-1 leading-relaxed">{dynamicMessage}</p>
          <button onClick={refresh} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex-shrink-0">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
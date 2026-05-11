import { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

const TINY_STEPS = [
  "Write the first equation.",
  "Read the question out loud.",
  "Solve only part A.",
  "Draw a quick diagram.",
  "Write what you already know.",
  "Highlight the key word in the question.",
  "Set up the formula, don't solve yet.",
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function PhoneReturnScreen({ task, onBack, onMakeEasier, onBreak, onEmergency }) {
  const [tinyStep] = useState(() => getRandom(TINY_STEPS));
  const [loading, setLoading] = useState(false);
  const [aiStep, setAiStep] = useState(null);

  const generateAiStep = async () => {
    if (aiStep || loading) return;
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `A student is working on: "${task?.title || "a study task"}${task?.subtitle ? ` — ${task.subtitle}` : ""}". They got distracted. Give them ONE tiny, concrete first action to restart — 8 words max, no period, no fluff. Just the action.`,
        response_json_schema: {
          type: "object",
          properties: { step: { type: "string" } }
        }
      });
      setAiStep(res?.step || null);
    } catch {
      // silently fall back to static step
    } finally {
      setLoading(false);
    }
  };

  // Trigger AI step generation on mount
  useState(() => { generateAiStep(); });

  const displayStep = aiStep || tinyStep;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: "linear-gradient(160deg, #fafdf7 0%, #fff7ed 55%, #fdf9f5 100%)" }}
    >
      <div className="w-full max-w-sm space-y-6 text-center">

        {/* Gentle emoji */}
        <motion.div
          animate={{ rotate: [0, -8, 8, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-6xl select-none"
        >
          🌤️
        </motion.div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-stone-700">You drifted. That's okay.</h1>
          <p className="text-stone-400 text-sm leading-relaxed">
            Come back by doing the smallest possible next step.
          </p>
        </div>

        {/* Task + tiny step card */}
        <div className="rounded-3xl px-6 py-5 space-y-4 text-left"
          style={{ background: "white", border: "1.5px solid #fed7aa", boxShadow: "0 4px 20px rgba(251,146,60,0.07)" }}>

          {task && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Current task</p>
              <p className="text-sm font-semibold text-stone-700">{task.title}{task.subtitle ? ` — ${task.subtitle}` : ""}</p>
            </div>
          )}

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">Your tiny next step</p>
            {loading ? (
              <div className="flex gap-1.5 items-center py-1">
                {[0, 0.15, 0.3].map((d, i) => (
                  <motion.span key={i} className="h-2 w-2 rounded-full bg-orange-300"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: d }} />
                ))}
              </div>
            ) : (
              <p className="text-base font-semibold text-orange-700 leading-snug">
                "{displayStep}"
              </p>
            )}
          </div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={onBack}
          className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #5a9a6f, #4a7c59)" }}
        >
          🌱 I'm back — re-park my phone
        </button>

        {/* Secondary options */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onMakeEasier}
            className="py-3 rounded-2xl text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-50"
            style={{ border: "1.5px solid #e5e7eb" }}>
            🔀 Make it easier
          </button>
          <button onClick={onBreak}
            className="py-3 rounded-2xl text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-50"
            style={{ border: "1.5px solid #e5e7eb" }}>
            ☕ I need a break
          </button>
        </div>

        {/* Emergency unlock */}
        <button onClick={onEmergency}
          className="text-xs text-stone-300 hover:text-stone-400 transition-colors py-1">
          🔓 Emergency unlock
        </button>

        <p className="text-[11px] text-stone-300 leading-relaxed">
          Every return is a win. No shame, just the next tiny step.
        </p>
      </div>
    </motion.div>
  );
}
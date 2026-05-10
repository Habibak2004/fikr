import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";

export default function SmallerStepModal({ task, onSubtask, onClose }) {
  const [loading, setLoading] = useState(false);
  const [subtasks, setSubtasks] = useState(null);

  const generate = async () => {
    setLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `A student with ADHD is stuck on this task: "${task.title}${task.subtitle ? " — " + task.subtitle : ""}".
Break it into 2–3 ultra-tiny micro-steps. Each step should take 1–3 minutes and be a single concrete action (e.g., "Read just problem 3", "Write the formula only", "Circle what you know").
Return ONLY a JSON array: [{"step": "...", "minutes": 2}, ...]`,
      response_json_schema: {
        type: "object",
        properties: {
          steps: { type: "array", items: { type: "object", properties: { step: { type: "string" }, minutes: { type: "number" } } } }
        }
      }
    });
    setSubtasks(res.steps || []);
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.2)", backdropFilter: "blur(4px)" }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 16 }}
        className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-sm"
        style={{ border: "1.5px solid #d1fae5" }}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-base font-bold text-stone-700">Let's make it smaller</p>
            <p className="text-xs text-stone-400 mt-0.5">You don't have to do it all at once.</p>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!subtasks && !loading && (
          <div className="space-y-3">
            <div className="bg-stone-50 rounded-2xl px-4 py-3 text-sm text-stone-600">
              <span className="font-medium">{task.title}</span>
              {task.subtitle && <span className="text-stone-400"> — {task.subtitle}</span>}
            </div>
            <button
              onClick={generate}
              className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #5a9a6f, #4a7c59)" }}
            >
              🌱 Break it into tiny steps
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 py-6">
            <motion.div
              className="h-10 w-10 rounded-full border-2 border-green-200 border-t-green-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-sm text-stone-400">Finding smaller pieces…</p>
          </div>
        )}

        {subtasks && (
          <div className="space-y-2">
            <p className="text-xs text-stone-400 mb-3">Pick one to start:</p>
            {subtasks.map((s, i) => (
              <button
                key={i}
                onClick={() => onSubtask({ title: s.step, subtitle: "", duration: s.minutes || 3, priority: "must" })}
                className="w-full text-left px-4 py-3 rounded-2xl text-sm text-stone-700 hover:bg-green-50 transition-colors flex items-center gap-3"
                style={{ border: "1.5px solid #e7f5ec" }}
              >
                <span className="text-green-500">🌿</span>
                <div>
                  <p className="font-medium">{s.step}</p>
                  <p className="text-xs text-stone-400">{s.minutes || 3} min</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
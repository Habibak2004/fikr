import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const PHASES = [
  { label: "Breathe in", duration: 5, color: "#5a9a6f" },
  { label: "Hold", duration: 6, color: "#8bc49a" },
  { label: "Breathe out", duration: 8, color: "#4a7c59" },
  { label: "Hold", duration: 4, color: "#8bc49a" },
];

const TOTAL_CYCLE = PHASES.reduce((s, p) => s + p.duration, 0); // 16s

export default function BreathingModal({ onClose }) {
  const [elapsed, setElapsed] = useState(0);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(e => {
        const next = e + 1;
        if (next >= TOTAL_CYCLE) {
          setCycles(c => c + 1);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Determine current phase
  let acc = 0;
  let phase = PHASES[0];
  let phaseElapsed = elapsed;
  for (const p of PHASES) {
    if (elapsed < acc + p.duration) {
      phase = p;
      phaseElapsed = elapsed - acc;
      break;
    }
    acc += p.duration;
  }

  const progress = phaseElapsed / phase.duration;
  const circleScale = phase.label === "Breathe in" ? 0.6 + progress * 0.4
    : phase.label === "Breathe out" ? 1 - progress * 0.4
    : phase.label === "Hold" && elapsed < PHASES[0].duration + PHASES[1].duration ? 1
    : 0.6;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-xs rounded-3xl overflow-hidden flex flex-col items-center py-10 px-6 text-center gap-6"
        style={{ background: "linear-gradient(160deg, #f0fdf4 0%, #fafdf7 100%)", border: "1.5px solid #d1fae5" }}
      >
        <button onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
          <X className="h-4 w-4" />
        </button>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-green-600">SOS — Take a breath</p>
          <p className="text-stone-400 text-xs mt-1">Box breathing • {cycles > 0 ? `${cycles} cycle${cycles > 1 ? "s" : ""} done` : "follow the circle"}</p>
        </div>

        {/* Breathing circle */}
        <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full opacity-20" style={{ background: phase.color }} />
          {/* Animated circle */}
          <motion.div
            className="rounded-full flex items-center justify-center"
            animate={{ scale: circleScale }}
            transition={{ duration: 1, ease: "easeInOut" }}
            style={{
              width: 160, height: 160,
              background: `radial-gradient(circle at 40% 40%, ${phase.color}cc, ${phase.color})`,
              boxShadow: `0 0 40px ${phase.color}55`,
            }}
          >
            <div className="text-center text-white">
              <p className="text-2xl font-bold leading-none">{phase.duration - phaseElapsed}</p>
              <p className="text-xs font-medium mt-1 opacity-90">{phase.label}</p>
            </div>
          </motion.div>
        </div>

        {/* Phase progress dots */}
        <div className="flex gap-2">
          {PHASES.map((p, i) => {
            const start = PHASES.slice(0, i).reduce((s, x) => s + x.duration, 0);
            const active = elapsed >= start && elapsed < start + p.duration;
            return (
              <div key={i} className="h-1.5 w-6 rounded-full transition-all duration-300"
                style={{ background: active ? phase.color : "#d1fae5" }} />
            );
          })}
        </div>

        <p className="text-xs text-stone-400 leading-relaxed max-w-[200px]">
          You're okay. Take your time. The session will be here when you're ready.
        </p>

        <button onClick={onClose}
          className="px-6 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #5a9a6f, #4a7c59)" }}>
          I'm ready to continue
        </button>
      </motion.div>
    </motion.div>
  );
}
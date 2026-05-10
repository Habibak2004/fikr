import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Per-stage interactions — each one is a simple delightful tap
const INTERACTIONS = [
  { label: "Plant the seed", emoji: "🌰", cta: "Tap to plant", color: "#92400e", bg: "#fef9ee" },
  { label: "Water the seed", emoji: "💧", cta: "Tap to water", color: "#3b82f6", bg: "#eff6ff" },
  { label: "A sprout appears!", emoji: "🌱", cta: "Watch it grow", color: "#16a34a", bg: "#f0fdf4" },
  { label: "The stem is rising", emoji: "🌿", cta: "Feel the growth", color: "#15803d", bg: "#f0fdf4" },
  { label: "Leaves are opening", emoji: "🍃", cta: "Touch a leaf", color: "#16a34a", bg: "#ecfdf5" },
  { label: "A bud is forming", emoji: "🌸", cta: "Tap to bloom", color: "#db2777", bg: "#fdf2f8" },
  { label: "The flower opens!", emoji: "🌺", cta: "It's beautiful", color: "#be185d", bg: "#fff1f8" },
  { label: "Your plant is grown!", emoji: "🌟", cta: "Celebrate", color: "#d97706", bg: "#fffbeb" },
];

export default function PlantInteraction({ completedCount = 0, onDone }) {
  const [phase, setPhase] = useState("idle"); // idle | tap | bloom | done
  const ix = INTERACTIONS[Math.min(completedCount, INTERACTIONS.length - 1)];

  const handleTap = () => {
    if (phase !== "idle") return;
    setPhase("tap");
    setTimeout(() => setPhase("bloom"), 800);
    setTimeout(() => {
      setPhase("done");
      setTimeout(onDone, 500);
    }, 1600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      className="flex flex-col items-center gap-4 py-10 px-6 rounded-3xl text-center w-full max-w-xs mx-auto"
      style={{ background: ix.bg, border: `1.5px solid ${ix.color}22` }}
    >
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.button key="idle" onClick={handleTap}
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="h-24 w-24 rounded-full flex items-center justify-center text-6xl shadow-sm cursor-pointer select-none"
            style={{ background: `${ix.color}18`, border: `2px solid ${ix.color}30` }}>
            {ix.emoji}
          </motion.button>
        )}
        {phase === "tap" && (
          <motion.div key="tap"
            className="h-24 w-24 rounded-full flex items-center justify-center text-6xl"
            style={{ background: `${ix.color}28` }}
            animate={{ scale: [1, 1.35, 0.9, 1.2, 1], rotate: [0, -8, 10, -4, 0] }}
            transition={{ duration: 0.8 }}>
            {ix.emoji}
          </motion.div>
        )}
        {phase === "bloom" && (
          <motion.div key="bloom"
            className="h-24 w-24 rounded-full flex items-center justify-center text-6xl relative"
            style={{ background: `${ix.color}20` }}
            initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
            {ix.emoji}
            {["✨", "🌟", "💫"].map((e, i) => (
              <motion.span key={i} className="absolute text-xl"
                initial={{ opacity: 1, scale: 0.5 }}
                animate={{ opacity: 0, scale: 1.4, x: (i - 1) * 32, y: -30 }}
                transition={{ duration: 0.8, delay: i * 0.1 }}>
                {e}
              </motion.span>
            ))}
          </motion.div>
        )}
        {phase === "done" && (
          <motion.div key="done" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="h-24 w-24 rounded-full flex items-center justify-center text-5xl"
            style={{ background: `${ix.color}15` }}>
            ✨
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <p className="text-lg font-bold text-stone-700">{ix.label}</p>
        <AnimatePresence mode="wait">
          {phase === "idle" && <motion.p key="cta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-stone-400 mt-1">{ix.cta}</motion.p>}
          {(phase === "tap" || phase === "bloom") && <motion.p key="growing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm mt-1" style={{ color: ix.color }}>Growing…</motion.p>}
          {phase === "done" && <motion.p key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-green-600 mt-1 font-medium">Beautiful ✓</motion.p>}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
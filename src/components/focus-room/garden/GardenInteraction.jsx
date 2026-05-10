import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// The moment-of-delight interaction shown after completing a task.
// Shows a tactile mini-interaction then calls onComplete.

const INTERACTIONS = [
  { emoji: "🌱", action: "Plant the seed", cta: "Tap to plant", color: "#8B6914", bg: "#fdf6e3" },
  { emoji: "💧", action: "Water your plant", cta: "Tap to water", color: "#3b82f6", bg: "#eff6ff" },
  { emoji: "🌿", action: "A sprout appears!", cta: "Watch it grow", color: "#5a9a6f", bg: "#f0fdf4" },
  { emoji: "🍃", action: "Leaves are opening", cta: "Feel the growth", color: "#4a7c59", bg: "#ecfdf5" },
  { emoji: "🌸", action: "A bud is forming", cta: "Tap to bloom", color: "#ec4899", bg: "#fdf2f8" },
  { emoji: "🌺", action: "It's blooming!", cta: "Beautiful!", color: "#e8519a", bg: "#fff1f8" },
  { emoji: "🌻", action: "Almost fully grown", cta: "One more push", color: "#f59e0b", bg: "#fffbeb" },
  { emoji: "🌟", action: "Your plant is restored!", cta: "Celebrate!", color: "#f59e0b", bg: "#fffde7" },
];

export default function GardenInteraction({ taskIndex = 0, onComplete }) {
  const [phase, setPhase] = useState("ready"); // ready | animating | done
  const interaction = INTERACTIONS[Math.min(taskIndex, INTERACTIONS.length - 1)];

  const handleTap = () => {
    if (phase !== "ready") return;
    setPhase("animating");
    setTimeout(() => {
      setPhase("done");
      setTimeout(() => {
        onComplete();
      }, 600);
    }, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center gap-5 py-8 px-6 rounded-3xl text-center max-w-xs mx-auto"
      style={{ background: interaction.bg, border: `1.5px solid ${interaction.color}22` }}
    >
      {/* Animated emoji */}
      <AnimatePresence mode="wait">
        {phase === "ready" && (
          <motion.button
            key="ready"
            onClick={handleTap}
            className="h-24 w-24 rounded-full flex items-center justify-center text-5xl shadow-sm cursor-pointer select-none"
            style={{ background: `${interaction.color}15`, border: `2px solid ${interaction.color}30` }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            {interaction.emoji}
          </motion.button>
        )}

        {phase === "animating" && (
          <motion.div
            key="animating"
            className="h-24 w-24 rounded-full flex items-center justify-center text-5xl"
            style={{ background: `${interaction.color}25` }}
            animate={{ scale: [1, 1.3, 0.95, 1.15, 1], rotate: [0, -8, 8, -4, 0] }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            {interaction.emoji}
          </motion.div>
        )}

        {phase === "done" && (
          <motion.div
            key="done"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="h-24 w-24 rounded-full flex items-center justify-center text-5xl"
            style={{ background: `${interaction.color}20` }}
          >
            ✨
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <p className="text-lg font-bold text-stone-700">{interaction.action}</p>
        {phase === "ready" && (
          <p className="text-sm text-stone-400 mt-1">{interaction.cta}</p>
        )}
        {phase === "animating" && (
          <motion.p
            className="text-sm mt-1"
            style={{ color: interaction.color }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            Growing…
          </motion.p>
        )}
        {phase === "done" && (
          <p className="text-sm text-green-600 mt-1 font-medium">Beautiful ✓</p>
        )}
      </div>
    </motion.div>
  );
}
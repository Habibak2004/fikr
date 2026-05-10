import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Maps archetype to a calming micro-interaction
const INTERACTIONS = {
  observatory: {
    prompt: "Place the star",
    emoji: "⭐",
    description: "A new star finds its place",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.1)",
    border: "rgba(167,139,250,0.3)",
  },
  forest: {
    prompt: "Plant a seed",
    emoji: "🌱",
    description: "A seedling takes root",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.1)",
    border: "rgba(74,222,128,0.3)",
  },
  city: {
    prompt: "Connect the node",
    emoji: "💡",
    description: "A light comes back online",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.1)",
    border: "rgba(56,189,248,0.3)",
  },
  library: {
    prompt: "Restore the page",
    emoji: "📄",
    description: "A page is returned to the archive",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.3)",
  },
  journey: {
    prompt: "Move forward",
    emoji: "🚂",
    description: "The train moves on",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.1)",
    border: "rgba(148,163,184,0.3)",
  },
  kingdom: {
    prompt: "Set the stone",
    emoji: "🧱",
    description: "A stone settles into place",
    color: "#e879f9",
    bg: "rgba(232,121,249,0.1)",
    border: "rgba(232,121,249,0.3)",
  },
};

export default function WorldInteraction({ archetype, onComplete }) {
  const [phase, setPhase] = useState("waiting"); // waiting | animating | done

  const config = INTERACTIONS[archetype?.id] || INTERACTIONS.journey;

  const handleTap = () => {
    if (phase !== "waiting") return;
    setPhase("animating");
    setTimeout(() => {
      setPhase("done");
      setTimeout(() => {
        onComplete();
      }, 700);
    }, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      className="flex flex-col items-center justify-center py-8 px-6 rounded-3xl text-center"
      style={{
        background: config.bg,
        border: `1.5px solid ${config.border}`,
      }}
    >
      <AnimatePresence mode="wait">
        {phase === "waiting" && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5"
          >
            <p className="text-sm text-stone-500 font-medium">Task complete ✓</p>
            <p className="text-xs text-stone-400">Touch to restore a piece of your world</p>

            {/* The draggable/tappable element */}
            <motion.button
              onClick={handleTap}
              className="relative flex items-center justify-center"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              style={{ width: 80, height: 80 }}
            >
              {/* Outer pulse ring */}
              <motion.span
                className="absolute inset-0 rounded-full"
                style={{ border: `2px solid ${config.color}` }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Inner glow */}
              <motion.span
                className="absolute inset-3 rounded-full"
                style={{ background: config.bg, border: `1.5px solid ${config.border}` }}
                animate={{ scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="text-4xl relative z-10">{config.emoji}</span>
            </motion.button>

            <p className="text-[13px] font-semibold" style={{ color: config.color }}>
              {config.prompt}
            </p>
          </motion.div>
        )}

        {phase === "animating" && (
          <motion.div
            key="animating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.span
              className="text-5xl"
              animate={{
                y: [0, -30, -60],
                scale: [1, 1.3, 0.5],
                opacity: [1, 1, 0],
              }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              {config.emoji}
            </motion.span>
            <motion.div
              className="flex gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {[0, 0.1, 0.2].map((d, i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: config.color }}
                  animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: d }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}

        {phase === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <motion.span
              className="text-4xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              ✨
            </motion.span>
            <p className="text-sm font-semibold" style={{ color: config.color }}>
              {config.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
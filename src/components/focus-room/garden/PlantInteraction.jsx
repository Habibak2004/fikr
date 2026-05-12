import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PlantStage from "@/components/focus-room/garden/PlantStage";

// Per-stage water interactions
const INTERACTIONS = [
  { label: "Water the seed", emoji: "💧", cta: "Tap to water", color: "#3b82f6", bg: "#eff6ff" },
  { label: "A sprout appears!", emoji: "🌱", cta: "Watch it grow", color: "#16a34a", bg: "#f0fdf4" },
  { label: "The stem is rising", emoji: "🌿", cta: "Feel the growth", color: "#15803d", bg: "#f0fdf4" },
  { label: "Leaves are opening", emoji: "🍃", cta: "Touch a leaf", color: "#16a34a", bg: "#ecfdf5" },
  { label: "A bud is forming", emoji: "🌸", cta: "Tap to bloom", color: "#db2777", bg: "#fdf2f8" },
  { label: "The flower opens!", emoji: "🌺", cta: "It's beautiful", color: "#be185d", bg: "#fff1f8" },
  { label: "Your plant is grown!", emoji: "🌟", cta: "Celebrate", color: "#d97706", bg: "#fffbeb" },
];

// completedCount = tasks done so far (before this one is counted)
// After watering, plant grows from completedCount → completedCount+1
export default function PlantInteraction({ completedCount = 0, onDone }) {
  const [phase, setPhase] = useState("idle"); // idle | watering | growing | done
  const ix = INTERACTIONS[Math.min(completedCount, INTERACTIONS.length - 1)];
  const nextStage = Math.min(completedCount + 1, 7);

  const handleWater = () => {
    if (phase !== "idle") return;
    setPhase("watering");
    setTimeout(() => setPhase("growing"), 900);
    setTimeout(() => {
      setPhase("done");
      setTimeout(onDone, 1200);
    }, 2800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      className="flex flex-col items-center gap-5 py-8 px-6 rounded-3xl text-center w-full max-w-xs mx-auto"
      style={{ background: "white", border: "1.5px solid #d1fae5", boxShadow: "0 4px 24px rgba(90,154,111,0.08)" }}
    >
      {/* Plant visual — shows grown version once watering starts */}
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div key="idle-plant" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PlantStage completedCount={completedCount} />
          </motion.div>
        )}
        {(phase === "watering") && (
          <motion.div key="watering-plant" className="relative" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PlantStage completedCount={completedCount} />
            {/* Water drops falling */}
            {[0, 1, 2].map(i => (
              <motion.div key={i} className="absolute text-2xl"
                style={{ left: `${30 + i * 22}%`, top: "-10px" }}
                initial={{ y: -20, opacity: 1 }}
                animate={{ y: 60, opacity: 0 }}
                transition={{ duration: 0.7, delay: i * 0.15, repeat: 2, repeatDelay: 0.3 }}>
                💧
              </motion.div>
            ))}
          </motion.div>
        )}
        {(phase === "growing" || phase === "done") && (
          <motion.div key="grown-plant"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "backOut" }}>
            <PlantStage completedCount={nextStage} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Label + CTA */}
      <div className="space-y-1">
        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.p key="label" className="text-lg font-bold text-stone-700">{ix.label}</motion.p>
          )}
          {phase === "watering" && (
            <motion.p key="watering-txt" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-lg font-bold" style={{ color: "#3b82f6" }}>Watering… 💧</motion.p>
          )}
          {phase === "growing" && (
            <motion.p key="growing-txt" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-lg font-bold text-green-600">It's growing! ✨</motion.p>
          )}
          {phase === "done" && (
            <motion.p key="done-txt" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-lg font-bold text-green-600">Beautiful 🌸</motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Tap button — only in idle */}
      <AnimatePresence>
        {phase === "idle" && (
          <motion.button
            key="water-btn"
            onClick={handleWater}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="px-8 py-3 rounded-2xl text-base font-bold text-white"
            style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}>
            💧 Water your plant
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
import { motion } from "framer-motion";
import { Battery, Zap, Minus, Flame } from "lucide-react";

const LEVELS = [
  {
    id: "barely",
    label: "Barely\nFunctioning",
    icon: Battery,
    color: "#f87171",
    bg: "#fff1f1",
    description: "Exhausted and overwhelmed. We'll focus on tiny, effortless wins to build momentum.",
  },
  {
    id: "low",
    label: "Low\nEnergy",
    icon: Minus,
    color: "#fbbf24",
    bg: "#fffbeb",
    description: "A bit sluggish but willing. Steady progress and gentle pacing to ease into work.",
  },
  {
    id: "moderate",
    label: "Moderate",
    icon: Zap,
    color: "#94a3b8",
    bg: "#f8fafc",
    description: "Balanced and functional. A standard environmental reset to maintain your current path.",
  },
  {
    id: "locked",
    label: "Locked In",
    icon: Flame,
    color: "#c4a882",
    bg: "#fdf8f3",
    description: "Peak focus achieved. Full environmental restoration to maximize your flow state.",
  },
];

export default function EnergyCheck({ onSelect }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-[#f7f5f2]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-full max-w-3xl"
      >
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-semibold text-[#2c2416] tracking-tight leading-tight mb-4">
            How are you feeling right now?
          </h1>
          <p className="text-[#9a8f82] text-base max-w-md mx-auto leading-relaxed">
            Take a moment to check in with yourself. Your current energy level helps us tailor the
            perfect environment for your restoration.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {LEVELS.map((level, i) => {
            const Icon = level.icon;
            return (
              <motion.button
                key={level.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
                whileHover={{ scale: 1.03, boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(level.id)}
                className="text-left p-5 rounded-2xl border border-[#e8e0d6] bg-white cursor-pointer transition-all duration-200 group"
                style={{ "--hover-bg": level.bg }}
              >
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: level.bg }}
                >
                  <Icon className="h-5 w-5" style={{ color: level.color }} />
                </div>
                <h3 className="font-semibold text-[#2c2416] text-sm whitespace-pre-line leading-snug mb-2">
                  {level.label}
                </h3>
                <p className="text-[#9a8f82] text-xs leading-relaxed">{level.description}</p>
              </motion.button>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-[#2c2416] text-lg italic font-light max-w-lg mx-auto leading-relaxed">
            "Your energy is a limited resource. Honoring where you are right now is the first step
            toward arriving where you want to be."
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="h-px w-8 bg-[#c4a882]" />
            <p className="text-[#c4a882] text-xs tracking-[0.15em] uppercase font-medium">
              Wisdom from Study Sanctuary
            </p>
            <div className="h-px w-8 bg-[#c4a882]" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
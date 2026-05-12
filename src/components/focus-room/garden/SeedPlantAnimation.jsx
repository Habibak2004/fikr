import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Phases: "seed_falling" → "seed_in_pot" → "dirt_falling" → "done"
export default function SeedPlantAnimation({ onComplete }) {
  const [phase, setPhase] = useState("seed_falling");

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("seed_in_pot"), 900),
      setTimeout(() => setPhase("dirt_falling"), 1400),
      setTimeout(() => setPhase("done"), 2600),
      setTimeout(() => onComplete(), 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: 220 }}>
      <svg viewBox="0 0 120 200" width="180" height="260" style={{ overflow: "visible" }}>

        {/* ── Pot ── */}
        {/* Pot body */}
        <path d="M35 130 Q32 165 28 180 L92 180 Q88 165 85 130 Z"
          fill="#a16207" />
        <path d="M35 130 Q32 165 28 180 L92 180 Q88 165 85 130 Z"
          fill="url(#pot-shade)" />
        {/* Pot rim */}
        <rect x="28" y="122" width="64" height="12" rx="6"
          fill="#ca8a04" />
        {/* Pot highlight */}
        <path d="M38 134 Q37 155 34 172" stroke="#fde68a" strokeWidth="2" strokeLinecap="round" opacity="0.3" fill="none" />

        {/* ── Dirt base (always visible) ── */}
        <ellipse cx="60" cy="128" rx="28" ry="6" fill="#78350f" />

        {/* ── Seed falling ── */}
        <AnimatePresence>
          {(phase === "seed_falling") && (
            <motion.g
              key="seed-falling"
              initial={{ y: -60, x: 0, rotate: 0, opacity: 1 }}
              animate={{ y: 0, x: 0, rotate: 360, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, ease: "easeIn" }}
              style={{ transformOrigin: "60px 60px" }}
            >
              {/* Seed shape */}
              <ellipse cx="60" cy="55" rx="7" ry="9" fill="#92400e" />
              <ellipse cx="62" cy="52" rx="2.5" ry="3" fill="#d97706" opacity="0.6" />
            </motion.g>
          )}
        </AnimatePresence>

        {/* ── Seed in pot (stationary, half buried) ── */}
        <AnimatePresence>
          {(phase === "seed_in_pot") && (
            <motion.g
              key="seed-in-pot"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ellipse cx="60" cy="122" rx="7" ry="5" fill="#92400e" />
              <ellipse cx="62" cy="120" rx="2.5" ry="1.8" fill="#d97706" opacity="0.6" />
            </motion.g>
          )}
        </AnimatePresence>

        {/* ── Dirt clumps falling ── */}
        <AnimatePresence>
          {(phase === "dirt_falling" || phase === "done") && (
            <motion.g key="dirt-clumps">
              {[
                { cx: 48, delay: 0,   size: 8 },
                { cx: 60, delay: 0.08, size: 10 },
                { cx: 72, delay: 0.14, size: 7 },
                { cx: 53, delay: 0.2,  size: 6 },
                { cx: 67, delay: 0.25, size: 9 },
              ].map(({ cx, delay, size }, i) => (
                <motion.ellipse
                  key={i}
                  cx={cx}
                  cy={90}
                  rx={size}
                  ry={size * 0.55}
                  fill={i % 2 === 0 ? "#92400e" : "#78350f"}
                  initial={{ y: -30, opacity: 1 }}
                  animate={{ y: 35, opacity: 1 }}
                  transition={{ duration: 0.45, delay, ease: "easeIn" }}
                />
              ))}
            </motion.g>
          )}
        </AnimatePresence>

        {/* ── Dirt cover (slides over seed once dirt falls) ── */}
        <AnimatePresence>
          {(phase === "done") && (
            <motion.g key="dirt-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}>
              <ellipse cx="60" cy="124" rx="26" ry="7" fill="#78350f" />
              <ellipse cx="60" cy="122" rx="22" ry="5" fill="#92400e" />
              {/* Small mound bump */}
              <ellipse cx="60" cy="119" rx="10" ry="4" fill="#a16207" opacity="0.7" />
            </motion.g>
          )}
        </AnimatePresence>

        {/* ── Sparkles when done ── */}
        <AnimatePresence>
          {phase === "done" && (
            <motion.g key="sparkles"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              {[[44, 108], [76, 110], [60, 100]].map(([x, y], i) => (
                <motion.circle key={i} cx={x} cy={y} r="2.5"
                  fill={["#fde68a", "#6ee7b7", "#a78bfa"][i]}
                  animate={{ cy: [y, y - 14, y], opacity: [0, 1, 0], scale: [0.5, 1.3, 0.5] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }} />
              ))}
            </motion.g>
          )}
        </AnimatePresence>

        <defs>
          <linearGradient id="pot-shade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#000" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: phase === "done" ? 1 : 0, y: phase === "done" ? 0 : 6 }}
        transition={{ duration: 0.4 }}
        className="text-sm font-semibold mt-1"
        style={{ color: "#6ee7b7" }}>
        Seed planted! 🌱
      </motion.p>
    </div>
  );
}
import { motion, AnimatePresence } from "framer-motion";

// Plant stages: 0=soil, 1=seed, 2=sprout, 3=seedling, 4=small plant, 5=budding, 6=flowering, 7=full bloom
// Maps progress 0-10 tasks to stages

function Soil() {
  return (
    <ellipse cx="60" cy="115" rx="42" ry="10" fill="#c8a97a" opacity="0.5" />
  );
}

function Pot({ color = "#d4855a" }) {
  return (
    <>
      <path d="M38 115 L44 142 Q60 148 76 142 L82 115 Z" fill={color} />
      <rect x="34" y="112" width="52" height="7" rx="3" fill="#c07448" />
    </>
  );
}

// Each stage renders progressively more of the plant
function PlantSVG({ stage, accentColor = "#5a9a6f" }) {
  const light = "#8bc49a";
  const dark = "#3d7a52";
  const flowerYellow = "#f5d76e";
  const flowerPink = "#f4a7b9";

  return (
    <svg viewBox="0 0 120 160" className="w-full h-full" style={{ overflow: "visible" }}>
      <Soil />
      <Pot />

      {/* Stage 1+: seed visible in soil */}
      <AnimatePresence>
        {stage >= 1 && (
          <motion.ellipse
            key="seed"
            cx="60" cy="110"
            rx="5" ry="3"
            fill="#8B6914"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* Stage 2+: tiny sprout */}
      <AnimatePresence>
        {stage >= 2 && (
          <motion.g key="sprout"
            initial={{ scaleY: 0, originY: "110px" }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ transformOrigin: "60px 110px" }}
          >
            <path d="M60 110 Q60 98 60 92" stroke={accentColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M60 98 Q54 92 48 94" stroke={light} strokeWidth="2" fill="none" strokeLinecap="round" />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Stage 3+: taller stem */}
      <AnimatePresence>
        {stage >= 3 && (
          <motion.g key="stem"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.7 }}
            style={{ transformOrigin: "60px 110px" }}
          >
            <path d="M60 110 Q61 85 60 72" stroke={accentColor} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M60 88 Q70 80 76 82" stroke={light} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M60 80 Q50 72 44 74" stroke={light} strokeWidth="2" fill="none" strokeLinecap="round" />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Stage 4+: first real leaf pair */}
      <AnimatePresence>
        {stage >= 4 && (
          <motion.g key="leaves1"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            style={{ transformOrigin: "60px 72px" }}
          >
            <path d="M60 72 Q60 55 60 50" stroke={accentColor} strokeWidth="3" fill="none" />
            <path d="M60 68 Q75 60 80 64" stroke={dark} strokeWidth="2" fill="none" />
            <ellipse cx="74" cy="61" rx="9" ry="5" fill={accentColor} transform="rotate(-20 74 61)" opacity="0.9" />
            <ellipse cx="46" cy="63" rx="9" ry="5" fill={light} transform="rotate(20 46 63)" opacity="0.9" />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Stage 5+: more leaves */}
      <AnimatePresence>
        {stage >= 5 && (
          <motion.g key="leaves2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ transformOrigin: "60px 50px" }}
          >
            <path d="M60 50 Q60 38 60 32" stroke={accentColor} strokeWidth="3" fill="none" />
            <ellipse cx="76" cy="44" rx="11" ry="6" fill={accentColor} transform="rotate(-25 76 44)" />
            <ellipse cx="44" cy="44" rx="11" ry="6" fill={dark} transform="rotate(25 44 44)" />
            <ellipse cx="80" cy="52" rx="8" ry="4" fill={light} transform="rotate(-10 80 52)" />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Stage 6+: bud */}
      <AnimatePresence>
        {stage >= 6 && (
          <motion.g key="bud"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "backOut" }}
            style={{ transformOrigin: "60px 30px" }}
          >
            <path d="M60 32 Q60 24 60 18" stroke={accentColor} strokeWidth="3" fill="none" />
            <ellipse cx="60" cy="16" rx="5" ry="7" fill={flowerPink} />
            <ellipse cx="60" cy="18" rx="4" ry="5" fill="#e8859d" />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Stage 7+: full flower */}
      <AnimatePresence>
        {stage >= 7 && (
          <motion.g key="flower"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: "backOut" }}
            style={{ transformOrigin: "60px 14px" }}
          >
            {/* Petals */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <motion.ellipse
                key={i}
                cx={60 + 11 * Math.cos((angle * Math.PI) / 180)}
                cy={14 + 11 * Math.sin((angle * Math.PI) / 180)}
                rx="6" ry="4"
                fill={i % 2 === 0 ? flowerPink : "#f9c9d8"}
                transform={`rotate(${angle} ${60 + 11 * Math.cos((angle * Math.PI) / 180)} ${14 + 11 * Math.sin((angle * Math.PI) / 180)})`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
              />
            ))}
            {/* Center */}
            <circle cx="60" cy="14" r="6" fill={flowerYellow} />
            <circle cx="60" cy="14" r="3" fill="#e8b84b" />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Floating sparkles on completion */}
      <AnimatePresence>
        {stage >= 7 && (
          <>
            {[[-15, -20], [18, -30], [-8, -40], [22, -10]].map(([dx, dy], i) => (
              <motion.text
                key={i}
                x={60 + dx} y={14 + dy}
                fontSize="8"
                textAnchor="middle"
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], y: -12 }}
                transition={{ duration: 2, delay: i * 0.3, repeat: Infinity, repeatDelay: 3 }}
              >
                ✨
              </motion.text>
            ))}
          </>
        )}
      </AnimatePresence>
    </svg>
  );
}

// Water drop interaction element
function WaterDrop({ onDrop, show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          onClick={onDrop}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className="absolute top-2 right-2 h-10 w-10 rounded-full flex items-center justify-center text-lg shadow-md"
          style={{ background: "rgba(99, 179, 237, 0.2)", border: "1.5px solid rgba(99,179,237,0.5)" }}
          title="Water your plant"
        >
          💧
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// Stage label text
const STAGE_LABELS = [
  "Plant a seed to start",
  "A seed is planted 🌱",
  "Something is sprouting…",
  "A tiny stem appears",
  "First leaves unfurl 🍃",
  "Growing beautifully",
  "A bud is forming 🌸",
  "It's blooming! 🌸✨",
];

export default function PlantGrowth({ stage = 0, onWater, showWater = false }) {
  const clampedStage = Math.min(stage, 7);

  return (
    <div className="relative flex flex-col items-center gap-2">
      <div className="relative w-32 h-40">
        <PlantSVG stage={clampedStage} />
        <WaterDrop show={showWater} onDrop={onWater} />
      </div>
      <motion.p
        key={clampedStage}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs text-center text-stone-500 leading-snug max-w-[140px]"
      >
        {STAGE_LABELS[clampedStage]}
      </motion.p>
    </div>
  );
}
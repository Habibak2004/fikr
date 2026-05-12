import { motion, AnimatePresence } from "framer-motion";

// Magical glowing lotus / fantasy flower stages
// Colors
const TEAL = "#22d3ee";
const VIOLET = "#a78bfa";
const PINK = "#f472b6";
const GOLD = "#fde68a";
const BLUE = "#60a5fa";
const WHITE = "#e0f2fe";
const STEM = "#34d399";
const WATER = "#0ea5e9";

// Shared glow filter definitions
function Defs() {
  return (
    <defs>
      <filter id="glow-soft" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="glow-strong" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="glow-ambient" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <radialGradient id="water-grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#0369a1" stopOpacity="0.2" />
      </radialGradient>
      <radialGradient id="lotus-center" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="60%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#ec4899" />
      </radialGradient>
      <radialGradient id="petal-grad-pink" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#f9a8d4" />
        <stop offset="100%" stopColor="#db2777" stopOpacity="0.7" />
      </radialGradient>
      <radialGradient id="petal-grad-teal" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#a5f3fc" />
        <stop offset="100%" stopColor="#0891b2" stopOpacity="0.7" />
      </radialGradient>
      <radialGradient id="petal-grad-violet" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#ddd6fe" />
        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.7" />
      </radialGradient>
    </defs>
  );
}

// Floating sparkle particle
function Sparkle({ cx, cy, delay = 0, color = GOLD, size = 2 }) {
  return (
    <motion.circle cx={cx} cy={cy} r={size} fill={color} filter="url(#glow-soft)"
      animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5], cy: [cy, cy - 8, cy] }}
      transition={{ duration: 2.5, repeat: Infinity, delay, ease: "easeInOut" }} />
  );
}

// Calm dark water surface
function WaterPad() {
  return (
    <>
      {/* Water surface */}
      <ellipse cx="60" cy="122" rx="46" ry="12" fill="url(#water-grad)" />
      <ellipse cx="60" cy="122" rx="46" ry="12" fill="none" stroke={WATER} strokeWidth="0.5" opacity="0.4" />
      {/* Water shimmer lines */}
      {[48, 60, 72].map((x, i) => (
        <motion.line key={i} x1={x - 8} y1={122 + i * 2} x2={x + 8} y2={122 + i * 2}
          stroke={WHITE} strokeWidth="0.5" opacity="0.3"
          animate={{ opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }} />
      ))}
    </>
  );
}

// Lotus pad (lily pad)
function LilyPad({ cx = 60, cy = 120, r = 22 }) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.45} fill="#166534" opacity="0.85" />
      <path d={`M${cx} ${cy - r * 0.45} L${cx} ${cy + r * 0.45}`} stroke="#14532d" strokeWidth="0.7" opacity="0.5" />
      <path d={`M${cx - r * 0.6} ${cy} Q${cx} ${cy - r * 0.6} ${cx + r * 0.6} ${cy}`} stroke="#14532d" strokeWidth="0.5" fill="none" opacity="0.4" />
    </>
  );
}

// Glowing stem rising from water
function GlowStem({ height = 50 }) {
  const y1 = 118;
  const y2 = y1 - height;
  return (
    <motion.g initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
      transition={{ duration: 0.8 }} style={{ transformOrigin: `60px ${y1}px` }}>
      <path d={`M60 ${y1} Q62 ${(y1 + y2) / 2} 60 ${y2}`}
        stroke={STEM} strokeWidth="2.5" fill="none" strokeLinecap="round"
        filter="url(#glow-soft)" />
    </motion.g>
  );
}

// Single magical lotus petal shape
function LotusPetal({ cx, cy, angle, length = 18, width = 7, color = "url(#petal-grad-pink)", delay = 0 }) {
  const rad = (angle * Math.PI) / 180;
  const tip = { x: cx + Math.cos(rad) * length, y: cy + Math.sin(rad) * length };
  const lw = { x: cx + Math.cos(rad + Math.PI / 2) * width * 0.4, y: cy + Math.sin(rad + Math.PI / 2) * width * 0.4 };
  const rw = { x: cx + Math.cos(rad - Math.PI / 2) * width * 0.4, y: cy + Math.sin(rad - Math.PI / 2) * width * 0.4 };
  return (
    <motion.path
      d={`M${lw.x} ${lw.y} Q${tip.x + Math.cos(rad + Math.PI / 2) * 3} ${tip.y + Math.sin(rad + Math.PI / 2) * 3} ${tip.x} ${tip.y} Q${tip.x + Math.cos(rad - Math.PI / 2) * 3} ${tip.y + Math.sin(rad - Math.PI / 2) * 3} ${rw.x} ${rw.y} Z`}
      fill={color}
      filter="url(#glow-soft)"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay, ease: "backOut" }}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    />
  );
}

// Stage 0 — just dark water
function Stage0() {
  return (
    <>
      <WaterPad />
      <Sparkle cx={38} cy={112} delay={0} color={TEAL} size={1.5} />
      <Sparkle cx={82} cy={115} delay={1.2} color={BLUE} size={1} />
    </>
  );
}

// Stage 1 — lily pad appears
function Stage1() {
  return (
    <>
      <WaterPad />
      <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
        <LilyPad cx={60} cy={118} r={20} />
      </motion.g>
      <Sparkle cx={45} cy={110} delay={0.3} color={TEAL} size={1.5} />
      <Sparkle cx={76} cy={112} delay={1.0} color={BLUE} size={1} />
    </>
  );
}

// Stage 2 — stem + closed bud
function Stage2() {
  return (
    <>
      <WaterPad />
      <LilyPad cx={60} cy={118} r={22} />
      <GlowStem height={38} />
      <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: 0.5, ease: "backOut" }}>
        <ellipse cx="60" cy="76" rx="5" ry="9" fill="url(#petal-grad-pink)" filter="url(#glow-soft)" />
        <ellipse cx="57" cy="79" rx="3" ry="7" fill="url(#petal-grad-violet)" filter="url(#glow-soft)" opacity="0.7" />
        <ellipse cx="63" cy="79" rx="3" ry="7" fill="url(#petal-grad-teal)" filter="url(#glow-soft)" opacity="0.7" />
      </motion.g>
      <Sparkle cx={60} cy={68} delay={0} color={GOLD} size={1.5} />
    </>
  );
}

// Stage 3 — taller stem, bud opening slightly
function Stage3() {
  return (
    <>
      <WaterPad />
      <LilyPad cx={60} cy={118} r={24} />
      <GlowStem height={55} />
      {/* Slightly open bud */}
      {[-20, 0, 20].map((angle, i) => (
        <LotusPetal key={i} cx={60} cy={61} angle={-90 + angle} length={14} width={6}
          color={i === 1 ? "url(#petal-grad-pink)" : "url(#petal-grad-violet)"}
          delay={i * 0.08} />
      ))}
      <circle cx="60" cy="62" r="4" fill="url(#lotus-center)" filter="url(#glow-soft)" />
      <Sparkle cx={52} cy={55} delay={0} color={GOLD} size={1.5} />
      <Sparkle cx={68} cy={57} delay={0.8} color={TEAL} size={1} />
    </>
  );
}

// Stage 4 — half open lotus
function Stage4() {
  const angles = [-90, -50, -130, -20, -160, 10, -180];
  const colors = ["url(#petal-grad-pink)", "url(#petal-grad-teal)", "url(#petal-grad-violet)",
    "url(#petal-grad-pink)", "url(#petal-grad-teal)", "url(#petal-grad-violet)", "url(#petal-grad-pink)"];
  return (
    <>
      <WaterPad />
      <LilyPad cx={60} cy={118} r={26} />
      <GlowStem height={62} />
      {angles.map((angle, i) => (
        <LotusPetal key={i} cx={60} cy={55} angle={angle} length={18} width={7}
          color={colors[i % colors.length]} delay={i * 0.06} />
      ))}
      <circle cx="60" cy="56" r="5" fill="url(#lotus-center)" filter="url(#glow-strong)" />
      <Sparkle cx={44} cy={48} delay={0} color={GOLD} size={2} />
      <Sparkle cx={76} cy={50} delay={0.7} color={PINK} size={1.5} />
      <Sparkle cx={60} cy={40} delay={1.4} color={TEAL} size={1.5} />
    </>
  );
}

// Stage 5 — fully open lotus with glow halo
function Stage5() {
  const inner = [-90, -50, -130, -20, -160, 10, -180, 50];
  const outer = [-70, -110, -30, -150, 10, -190];
  return (
    <>
      <WaterPad />
      <LilyPad cx={60} cy={118} r={28} />
      <GlowStem height={68} />
      {/* Ambient glow halo */}
      <motion.circle cx="60" cy="50" r="22" fill={VIOLET} opacity="0.12" filter="url(#glow-ambient)"
        animate={{ r: [20, 24, 20], opacity: [0.10, 0.18, 0.10] }}
        transition={{ duration: 3, repeat: Infinity }} />
      {outer.map((angle, i) => (
        <LotusPetal key={`o${i}`} cx={60} cy={50} angle={angle} length={22} width={8}
          color={"url(#petal-grad-violet)"} delay={i * 0.07} />
      ))}
      {inner.map((angle, i) => (
        <LotusPetal key={`i${i}`} cx={60} cy={50} angle={angle} length={15} width={7}
          color={i % 2 === 0 ? "url(#petal-grad-pink)" : "url(#petal-grad-teal)"} delay={i * 0.05} />
      ))}
      <circle cx="60" cy="51" r="6" fill="url(#lotus-center)" filter="url(#glow-strong)" />
      {[0, 1, 2, 3, 4].map(i => (
        <Sparkle key={i} cx={38 + i * 12} cy={35 + (i % 2) * 8} delay={i * 0.5} color={i % 2 === 0 ? GOLD : TEAL} size={1.5} />
      ))}
    </>
  );
}

// Stage 6 — full glowing bloom + floating orbs
function Stage6() {
  const inner = [-90, -45, -135, -20, -160, 0, -180, -70, -110];
  const outer = [-60, -100, -30, -150, 0, -180, 30, -210];
  return (
    <>
      <WaterPad />
      <LilyPad cx={60} cy={118} r={30} />
      <GlowStem height={70} />
      {/* Big ambient glow */}
      <motion.circle cx="60" cy="48" r="28" fill={PINK} opacity="0.1" filter="url(#glow-ambient)"
        animate={{ r: [25, 31, 25], opacity: [0.08, 0.16, 0.08] }}
        transition={{ duration: 3.5, repeat: Infinity }} />
      <motion.circle cx="60" cy="48" r="18" fill={TEAL} opacity="0.1" filter="url(#glow-ambient)"
        animate={{ r: [16, 20, 16], opacity: [0.10, 0.20, 0.10] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }} />
      {outer.map((angle, i) => (
        <LotusPetal key={`o${i}`} cx={60} cy={48} angle={angle} length={24} width={9}
          color={i % 3 === 0 ? "url(#petal-grad-violet)" : i % 3 === 1 ? "url(#petal-grad-pink)" : "url(#petal-grad-teal)"}
          delay={i * 0.06} />
      ))}
      {inner.map((angle, i) => (
        <LotusPetal key={`i${i}`} cx={60} cy={48} angle={angle} length={16} width={7}
          color={i % 2 === 0 ? "url(#petal-grad-teal)" : "url(#petal-grad-pink)"} delay={i * 0.05} />
      ))}
      <circle cx="60" cy="49" r="7" fill="url(#lotus-center)" filter="url(#glow-strong)" />
      {/* Floating light orbs */}
      {[[30, 35], [50, 22], [72, 30], [85, 45], [40, 50]].map(([cx, cy], i) => (
        <motion.circle key={i} cx={cx} cy={cy} r="2.5" fill={[GOLD, TEAL, VIOLET, PINK, WHITE][i]}
          filter="url(#glow-soft)" opacity={0.7}
          animate={{ cy: [cy, cy - 10, cy], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.6 }} />
      ))}
    </>
  );
}

// Stage 7 — transcendent full bloom + second flower + rain of light
function Stage7() {
  const inner = [-90, -45, -135, -20, -160, 0, -180, -70, -110];
  const outer = [-60, -100, -30, -150, 0, -180, 30, -210, -240];
  return (
    <>
      <WaterPad />
      <LilyPad cx={60} cy={118} r={32} />
      {/* Second small lily pad */}
      <LilyPad cx={88} cy={120} r={12} />
      <GlowStem height={72} />
      {/* Small second stem + mini bloom */}
      <path d="M88 118 Q89 108 88 100" stroke={STEM} strokeWidth="1.5" fill="none" filter="url(#glow-soft)" />
      {[-90, -30, -150, 30, -210].map((angle, i) => (
        <LotusPetal key={`s${i}`} cx={88} cy={100} angle={-90 + i * 60} length={11} width={5}
          color={i % 2 === 0 ? "url(#petal-grad-teal)" : "url(#petal-grad-violet)"} delay={0.5 + i * 0.06} />
      ))}
      <circle cx="88" cy="100" r="4" fill="url(#lotus-center)" filter="url(#glow-strong)" />

      {/* Main bloom mega glow */}
      <motion.circle cx="60" cy="46" r="34" fill={VIOLET} opacity="0.08" filter="url(#glow-ambient)"
        animate={{ r: [30, 36, 30], opacity: [0.06, 0.14, 0.06] }}
        transition={{ duration: 4, repeat: Infinity }} />
      <motion.circle cx="60" cy="46" r="22" fill={PINK} opacity="0.12" filter="url(#glow-ambient)"
        animate={{ r: [19, 24, 19], opacity: [0.10, 0.20, 0.10] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.7 }} />

      {outer.map((angle, i) => (
        <LotusPetal key={`o${i}`} cx={60} cy={46} angle={angle} length={26} width={10}
          color={i % 3 === 0 ? "url(#petal-grad-violet)" : i % 3 === 1 ? "url(#petal-grad-pink)" : "url(#petal-grad-teal)"}
          delay={i * 0.05} />
      ))}
      {inner.map((angle, i) => (
        <LotusPetal key={`i${i}`} cx={60} cy={46} angle={angle} length={17} width={7}
          color={i % 2 === 0 ? "url(#petal-grad-teal)" : "url(#petal-grad-pink)"} delay={i * 0.04} />
      ))}
      <circle cx="60" cy="47" r="8" fill="url(#lotus-center)" filter="url(#glow-strong)" />

      {/* Rain of light particles */}
      {[20, 35, 50, 65, 80, 95].map((x, i) => (
        <motion.circle key={`r${i}`} cx={x} cy={15} r={1.5}
          fill={[GOLD, TEAL, VIOLET, PINK, WHITE, BLUE][i]}
          filter="url(#glow-soft)"
          animate={{ cy: [10, 135], opacity: [0.8, 0] }}
          transition={{ duration: 4 + i * 0.5, repeat: Infinity, delay: i * 0.7, ease: "linear" }} />
      ))}
      {/* Floating orbs */}
      {[[25, 30], [48, 18], [74, 26], [90, 40], [38, 48], [70, 52]].map(([cx, cy], i) => (
        <motion.circle key={`ob${i}`} cx={cx} cy={cy} r="2.5"
          fill={[GOLD, TEAL, VIOLET, PINK, WHITE, BLUE][i]}
          filter="url(#glow-soft)" opacity={0.8}
          animate={{ cy: [cy, cy - 12, cy], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, delay: i * 0.5 }} />
      ))}
    </>
  );
}

const STAGES = [Stage0, Stage1, Stage2, Stage3, Stage4, Stage5, Stage6, Stage7];
const LABELS = [
  "Waters of potential 💧",
  "Lotus pad awakens 🍃",
  "First bud emerges ✨",
  "Rising from the deep 🌿",
  "Half-bloom glowing 🌸",
  "Lotus opening 🪷",
  "Full magical bloom ✨",
  "Transcendent garden 🌺✨"
];

export default function PlantStage({ completedCount = 0 }) {
  const stage = Math.min(completedCount, 7);
  const StageComp = STAGES[stage];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-40">
        <svg viewBox="0 0 120 145" className="w-full h-full" style={{ overflow: "visible" }}>
          <Defs />
          <AnimatePresence mode="wait">
            <motion.g key={stage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}>
              <StageComp />
            </motion.g>
          </AnimatePresence>
        </svg>
      </div>
      <motion.p key={stage} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
        className="text-xs text-center leading-snug font-medium"
        style={{ color: "#a78bfa" }}>
        {LABELS[stage]}
      </motion.p>
    </div>
  );
}
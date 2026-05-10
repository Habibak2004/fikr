import { motion, AnimatePresence } from "framer-motion";

// 8 stages mapped to completed task count (0–7+)
// 0: soil, 1: seed, 2: sprout, 3: stem, 4: leaves, 5: buds, 6: flower, 7: full bloom

const G = "#5a9a6f";
const GL = "#8bc49a";
const GD = "#3d7a52";
const PINK = "#f9a8d4";
const YELLOW = "#fde68a";

function Stage0() { // bare soil
  return (
    <>
      <ellipse cx="60" cy="115" rx="38" ry="9" fill="#c8a97a" opacity="0.5" />
      <path d="M36 115 L42 140 Q60 146 78 140 L84 115 Z" fill="#c07a50" />
      <rect x="32" y="112" width="56" height="7" rx="3.5" fill="#b06840" />
    </>
  );
}

function Stage1() { // seed planted
  return (
    <>
      <Stage0 />
      <motion.ellipse cx="60" cy="109" rx="5" ry="3.5" fill="#8B6914"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }} />
    </>
  );
}

function Stage2() { // sprout
  return (
    <>
      <Stage0 />
      <motion.g initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
        transition={{ duration: 0.6 }} style={{ transformOrigin: "60px 112px" }}>
        <path d="M60 112 Q60 102 60 96" stroke={G} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M60 102 Q54 96 48 98" stroke={GL} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M60 99 Q66 93 72 95" stroke={GL} strokeWidth="2" fill="none" strokeLinecap="round" />
      </motion.g>
    </>
  );
}

function Stage3() { // stem
  return (
    <>
      <Stage0 />
      <motion.g initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
        transition={{ duration: 0.7 }} style={{ transformOrigin: "60px 112px" }}>
        <path d="M60 112 Q61 88 60 72" stroke={G} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M60 94 Q70 86 76 88" stroke={GL} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M60 84 Q50 76 44 78" stroke={GL} strokeWidth="2" fill="none" strokeLinecap="round" />
      </motion.g>
    </>
  );
}

function Stage4() { // leaves
  return (
    <>
      <Stage0 />
      <path d="M60 112 Q61 82 60 62" stroke={G} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ duration: 0.6 }} style={{ transformOrigin: "60px 75px" }}>
        <path d="M60 90 Q74 82 80 85" stroke={GD} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <ellipse cx="75" cy="82" rx="10" ry="6" fill={G} opacity="0.9" transform="rotate(-20 75 82)" />
        <path d="M60 78 Q46 70 40 73" stroke={GD} strokeWidth="2" fill="none" strokeLinecap="round" />
        <ellipse cx="45" cy="70" rx="10" ry="6" fill={GL} opacity="0.9" transform="rotate(20 45 70)" />
        <ellipse cx="60" cy="60" rx="9" ry="5" fill={G} />
      </motion.g>
    </>
  );
}

function Stage5() { // more leaves / pre-bud
  return (
    <>
      <Stage0 />
      <path d="M60 112 Q62 78 60 54" stroke={G} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M60 95 Q75 84 82 87" stroke={GD} strokeWidth="3" fill="none" />
      <ellipse cx="78" cy="83" rx="12" ry="7" fill={G} opacity="0.9" transform="rotate(-25 78 83)" />
      <path d="M60 82 Q45 72 38 75" stroke={GD} strokeWidth="3" fill="none" />
      <ellipse cx="42" cy="71" rx="12" ry="7" fill={GL} opacity="0.9" transform="rotate(25 42 71)" />
      <ellipse cx="74" cy="92" rx="8" ry="5" fill={GL} opacity="0.8" transform="rotate(-10 74 92)" />
      <path d="M60 68 Q50 56 44 58" stroke={GD} strokeWidth="2.5" fill="none" />
      <path d="M60 65 Q70 53 76 55" stroke={GD} strokeWidth="2.5" fill="none" />
      <motion.ellipse cx="60" cy="52" rx="5" ry="7" fill={PINK} opacity="0.7"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }} />
    </>
  );
}

function Stage6() { // flower blooming
  const petals = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <>
      <Stage0 />
      <path d="M60 112 Q62 76 60 50" stroke={G} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M60 96 Q77 84 84 87" stroke={GD} strokeWidth="3" fill="none" />
      <ellipse cx="79" cy="82" rx="13" ry="7" fill={G} opacity="0.9" transform="rotate(-25 79 82)" />
      <path d="M60 82 Q43 72 36 75" stroke={GD} strokeWidth="3" fill="none" />
      <ellipse cx="40" cy="71" rx="13" ry="7" fill={GL} opacity="0.9" transform="rotate(25 40 71)" />
      <path d="M60 68 Q50 55 44 57" stroke={GD} strokeWidth="2.5" fill="none" />
      <path d="M60 65 Q70 52 76 54" stroke={GD} strokeWidth="2.5" fill="none" />
      <motion.g style={{ transformOrigin: "60px 42px" }}
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.7, ease: "backOut" }}>
        {petals.map((angle, i) => {
          const r = 12;
          const rad = (angle * Math.PI) / 180;
          const px = 60 + r * Math.cos(rad);
          const py = 42 + r * Math.sin(rad);
          return (
            <motion.ellipse key={i} cx={px} cy={py} rx="7" ry="4"
              fill={i % 2 === 0 ? PINK : "#fce7f3"}
              transform={`rotate(${angle + 90} ${px} ${py})`}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: "backOut" }} />
          );
        })}
        <circle cx="60" cy="42" r="6" fill={YELLOW} />
        <circle cx="60" cy="42" r="3.5" fill="#fbbf24" />
      </motion.g>
    </>
  );
}

function Stage7() { // full bloom + falling petals
  return (
    <>
      <Stage6 />
      {/* Extra side flowers */}
      {[[42, 66], [78, 66]].map(([cx, cy], fi) => (
        <motion.g key={fi} style={{ transformOrigin: `${cx}px ${cy}px` }}
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 + fi * 0.15, ease: "backOut" }}>
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const r = 8;
            const rad = (angle * Math.PI) / 180;
            const px = cx + r * Math.cos(rad);
            const py = cy + r * Math.sin(rad);
            return (
              <ellipse key={i} cx={px} cy={py} rx="5" ry="3"
                fill={i % 2 === 0 ? PINK : "#fce7f3"}
                transform={`rotate(${angle + 90} ${px} ${py})`} />
            );
          })}
          <circle cx={cx} cy={cy} r="4" fill={YELLOW} />
        </motion.g>
      ))}
      {/* Falling petals */}
      {[25, 45, 70, 90].map((x, i) => (
        <motion.ellipse key={i} cx={x} cy={20} rx="3.5" ry="2"
          fill={PINK} opacity={0.6}
          animate={{ cy: [20, 130], cx: [x, x + 12 * Math.sin(i)], opacity: [0.6, 0] }}
          transition={{ duration: 5 + i, repeat: Infinity, delay: i * 1.2, ease: "linear" }} />
      ))}
    </>
  );
}

const STAGES = [Stage0, Stage1, Stage2, Stage3, Stage4, Stage5, Stage6, Stage7];
const LABELS = ["Soil ready", "Seed planted 🌱", "First sprout", "Growing stem", "Leaves opening 🍃", "Almost there…", "Flower blooming 🌸", "Fully grown! ✨"];

export default function PlantStage({ completedCount = 0 }) {
  const stage = Math.min(completedCount, 7);
  const StageComp = STAGES[stage];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-36">
        <svg viewBox="0 0 120 150" className="w-full h-full" style={{ overflow: "visible" }}>
          <AnimatePresence mode="wait">
            <motion.g key={stage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}>
              <StageComp />
            </motion.g>
          </AnimatePresence>
        </svg>
      </div>
      <motion.p key={stage} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
        className="text-xs text-stone-400 text-center leading-snug">
        {LABELS[stage]}
      </motion.p>
    </div>
  );
}
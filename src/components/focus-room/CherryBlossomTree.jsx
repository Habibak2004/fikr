import { motion, AnimatePresence } from "framer-motion";

// stage 0 = bare soil, 1 = seedling, 2 = small sapling, 3 = young tree, 4 = branching, 5 = budding, 6 = full bloom

const PETAL_PINK = "#f9a8d4";
const PETAL_DEEP = "#ec4899";
const BARK = "#92400e";
const BARK_LIGHT = "#b45309";
const LEAF = "#86efac";
const SOIL = "#d4a574";

function Petals({ cx, cy, r = 18, count = 6, delay = 0 }) {
  return Array.from({ length: count }).map((_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    return (
      <motion.ellipse
        key={i}
        cx={px} cy={py}
        rx="8" ry="5"
        fill={i % 2 === 0 ? PETAL_PINK : "#fce7f3"}
        transform={`rotate(${(angle * 180) / Math.PI + 90} ${px} ${py})`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: delay + i * 0.06, ease: "backOut" }}
      />
    );
  });
}

function BlossomCluster({ cx, cy, delay = 0 }) {
  return (
    <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }}
      transition={{ duration: 0.6, delay, ease: "backOut" }}
      style={{ transformOrigin: `${cx}px ${cy}px` }}>
      <Petals cx={cx} cy={cy} r={14} count={6} delay={delay} />
      <circle cx={cx} cy={cy} r={5} fill="#fde68a" />
      <circle cx={cx} cy={cy} r={3} fill="#fbbf24" />
    </motion.g>
  );
}

function FallingPetal({ x, delay }) {
  return (
    <motion.ellipse
      cx={x} cy={-5}
      rx="4" ry="2.5"
      fill={PETAL_PINK}
      opacity={0.7}
      animate={{
        cy: [0, 220],
        cx: [x, x + 20 * Math.sin(delay * 5)],
        rotate: [0, 360],
        opacity: [0.7, 0],
      }}
      transition={{ duration: 6 + delay * 2, repeat: Infinity, delay, ease: "linear" }}
    />
  );
}

export default function CherryBlossomTree({ stage = 0, isRunning = false }) {
  const s = Math.min(stage, 6);

  return (
    <svg viewBox="0 0 200 220" className="w-full h-full" style={{ overflow: "visible" }}>
      {/* Sky gradient bg */}
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={s >= 5 ? "#fdf2f8" : "#f0f9ff"} />
          <stop offset="100%" stopColor={s >= 5 ? "#fce7f3" : "#e0f2fe"} />
        </linearGradient>
        <linearGradient id="soilGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8956c" />
          <stop offset="100%" stopColor="#a0724a" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect x="0" y="0" width="200" height="220" fill="url(#skyGrad)" rx="16" />

      {/* Ground */}
      <ellipse cx="100" cy="200" rx="80" ry="14" fill="url(#soilGrad)" opacity="0.6" />
      <ellipse cx="100" cy="197" rx="70" ry="8" fill={SOIL} opacity="0.4" />

      {/* Grass tufts */}
      {s >= 1 && [70, 85, 115, 130].map((x, i) => (
        <motion.g key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
          style={{ transformOrigin: `${x}px 195px` }}>
          <path d={`M${x} 195 Q${x - 3} 188 ${x} 192`} stroke={LEAF} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d={`M${x} 195 Q${x + 3} 187 ${x + 1} 192`} stroke="#4ade80" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </motion.g>
      ))}

      {/* Stage 0 — just soil mound */}
      {s === 0 && (
        <motion.ellipse cx="100" cy="193" rx="12" ry="6"
          fill="#a0724a" opacity="0.8"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* Stage 1 — tiny seedling */}
      {s >= 1 && (
        <motion.g initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ transformOrigin: "100px 195px" }}>
          <line x1="100" y1="195" x2="100" y2="178" stroke={BARK} strokeWidth="3" strokeLinecap="round" />
          <path d="M100 184 Q94 178 90 180" stroke={LEAF} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M100 181 Q106 175 110 177" stroke={LEAF} strokeWidth="2" fill="none" strokeLinecap="round" />
        </motion.g>
      )}

      {/* Stage 2 — sapling with small trunk */}
      {s >= 2 && (
        <motion.g initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ transformOrigin: "100px 195px" }}>
          <path d="M100 195 Q101 165 100 148" stroke={BARK} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M100 170 Q88 160 82 163" stroke={BARK_LIGHT} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M100 162 Q112 152 118 155" stroke={BARK_LIGHT} strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Small leaves */}
          <ellipse cx="80" cy="160" rx="10" ry="6" fill={LEAF} opacity="0.8" transform="rotate(-20 80 160)" />
          <ellipse cx="120" cy="153" rx="10" ry="6" fill="#4ade80" opacity="0.8" transform="rotate(20 120 153)" />
          <ellipse cx="100" cy="145" rx="8" ry="5" fill={LEAF} opacity="0.9" />
        </motion.g>
      )}

      {/* Stage 3 — young tree, taller trunk */}
      {s >= 3 && (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}>
          <path d="M100 195 Q103 155 100 120" stroke={BARK} strokeWidth="7" fill="none" strokeLinecap="round" />
          <path d="M100 155 Q80 140 70 145" stroke={BARK} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M100 145 Q120 130 130 133" stroke={BARK} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M100 135 Q88 118 82 120" stroke={BARK_LIGHT} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M100 130 Q114 115 120 118" stroke={BARK_LIGHT} strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Leaf clusters */}
          <ellipse cx="68" cy="140" rx="14" ry="9" fill={LEAF} opacity="0.7" transform="rotate(-15 68 140)" />
          <ellipse cx="132" cy="130" rx="14" ry="9" fill="#4ade80" opacity="0.7" transform="rotate(15 132 130)" />
          <ellipse cx="80" cy="116" rx="12" ry="8" fill={LEAF} opacity="0.8" />
          <ellipse cx="120" cy="114" rx="12" ry="8" fill="#4ade80" opacity="0.8" />
          <ellipse cx="100" cy="108" rx="14" ry="9" fill={LEAF} opacity="0.9" />
        </motion.g>
      )}

      {/* Stage 4 — full branching */}
      {s >= 4 && (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}>
          <path d="M100 195 Q104 148 100 105" stroke={BARK} strokeWidth="9" fill="none" strokeLinecap="round" />
          <path d="M100 160 Q75 142 60 148" stroke={BARK} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M100 150 Q125 132 140 136" stroke={BARK} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M100 138 Q82 118 72 122" stroke={BARK_LIGHT} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M100 132 Q118 112 128 116" stroke={BARK_LIGHT} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M100 120 Q90 100 84 103" stroke={BARK_LIGHT} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M100 118 Q110 98 116 101" stroke={BARK_LIGHT} strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Green leaf canopy */}
          <ellipse cx="100" cy="90" rx="42" ry="28" fill={LEAF} opacity="0.5" />
          <ellipse cx="72" cy="105" rx="20" ry="13" fill="#4ade80" opacity="0.6" />
          <ellipse cx="128" cy="105" rx="20" ry="13" fill={LEAF} opacity="0.6" />
        </motion.g>
      )}

      {/* Stage 5 — budding (pink starts appearing) */}
      {s >= 5 && (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 1 }}>
          {/* Canopy base */}
          <ellipse cx="100" cy="88" rx="48" ry="32" fill="#fce7f3" opacity="0.7" />
          {/* Blossom clusters just starting */}
          {[[80, 72], [100, 65], [120, 72], [68, 88], [132, 88], [90, 95], [110, 95]].map(([cx, cy], i) => (
            <BlossomCluster key={i} cx={cx} cy={cy} delay={i * 0.1} />
          ))}
        </motion.g>
      )}

      {/* Stage 6 — full bloom with falling petals */}
      {s >= 6 && (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 1 }}>
          {/* Full canopy glow */}
          <ellipse cx="100" cy="86" rx="56" ry="38" fill={PETAL_PINK} opacity="0.3" />
          {/* Dense blossoms */}
          {[
            [65, 70], [82, 58], [100, 52], [118, 58], [135, 70],
            [58, 88], [78, 82], [100, 78], [122, 82], [142, 88],
            [70, 100], [92, 96], [108, 96], [130, 100],
          ].map(([cx, cy], i) => (
            <BlossomCluster key={i} cx={cx} cy={cy} delay={i * 0.05} />
          ))}
          {/* Falling petals */}
          {[30, 55, 80, 110, 140, 165].map((x, i) => (
            <FallingPetal key={i} x={x} delay={i * 0.8} />
          ))}
        </motion.g>
      )}

      {/* Stage label */}
      <text x="100" y="215" textAnchor="middle" fontSize="9" fill="#92400e" opacity="0.6" fontFamily="sans-serif">
        {["Bare soil", "Seedling", "Sapling", "Young tree", "Growing", "Budding", "Full bloom"][s]}
      </text>
    </svg>
  );
}
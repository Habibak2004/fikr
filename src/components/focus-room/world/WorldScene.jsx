import { motion } from "framer-motion";
import { LEVEL_NAMES } from "./WorldEngine";

// ─── Shared helpers ───────────────────────────────────────────────────────────
function Star({ x, y, size = 2, delay = 0, visible }) {
  return (
    <motion.circle
      cx={x} cy={y} r={size}
      fill="white"
      initial={{ opacity: 0, scale: 0 }}
      animate={visible ? { opacity: [0.4, 1, 0.4], scale: 1 } : { opacity: 0, scale: 0 }}
      transition={{ duration: 3, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

function FloatingParticle({ x, y, color, delay = 0 }) {
  return (
    <motion.circle
      cx={x} cy={y} r={2}
      fill={color}
      animate={{ y: [0, -18, 0], opacity: [0, 0.8, 0] }}
      transition={{ duration: 3 + delay, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

// ─── Observatory Scene ────────────────────────────────────────────────────────
function ObservatoryScene({ level, archetype }) {
  const stars = [
    { x: 60, y: 50, s: 1.5, d: 0 }, { x: 150, y: 30, s: 2, d: 0.5 },
    { x: 240, y: 60, s: 1, d: 1 }, { x: 310, y: 25, s: 2.5, d: 0.3 },
    { x: 380, y: 55, s: 1.5, d: 0.8 }, { x: 430, y: 35, s: 1, d: 1.2 },
    { x: 80, y: 100, s: 1, d: 0.6 }, { x: 200, y: 90, s: 1.5, d: 0.9 },
    { x: 350, y: 80, s: 2, d: 0.2 }, { x: 460, y: 70, s: 1, d: 1.5 },
  ];
  const constellations = [
    { points: "160,120 190,100 220,115 200,140", visible: level >= 2 },
    { points: "280,110 310,90 340,105 325,130 295,125", visible: level >= 3 },
    { points: "60,140 90,120 110,145 80,160", visible: level >= 4 },
  ];

  return (
    <svg viewBox="0 0 520 200" className="w-full h-full" style={{ overflow: "visible" }}>
      {/* Sky gradient */}
      <defs>
        <radialGradient id="obs-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#1a1a4e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moon-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e9d5ff" stopOpacity="1" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.6" />
        </radialGradient>
      </defs>
      <rect width="520" height="200" fill="#0d0d2e" rx="16" />

      {/* Stars */}
      {stars.slice(0, Math.max(3, stars.length * (level / 5))).map((s, i) => (
        <Star key={i} x={s.x} y={s.y} size={s.s} delay={s.d} visible={true} />
      ))}

      {/* Moon */}
      <motion.circle
        cx={450} cy={45} r={level >= 1 ? 22 : 10}
        fill="url(#moon-glow)"
        animate={{ opacity: level >= 1 ? [0.7, 1, 0.7] : 0.2 }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Constellations */}
      {constellations.map((c, i) => c.visible && (
        <motion.polyline
          key={i}
          points={c.points}
          fill="none"
          stroke="#a78bfa"
          strokeWidth="1"
          strokeDasharray="4 3"
          initial={{ opacity: 0, pathLength: 0 }}
          animate={{ opacity: 0.7, pathLength: 1 }}
          transition={{ duration: 1.5, delay: i * 0.3 }}
        />
      ))}

      {/* Observatory dome */}
      <motion.ellipse cx={260} cy={185} rx={55} ry={10} fill="#1e1b4b" />
      <motion.path
        d="M210,185 Q260,120 310,185"
        fill={level >= 1 ? "#2e2a6e" : "#1a183a"}
        animate={{ fill: level >= 1 ? "#2e2a6e" : "#1a183a" }}
      />
      {/* Telescope */}
      {level >= 1 && (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
          <line x1="255" y1="160" x2="270" y2="135" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="271" cy="133" rx="6" ry="3" fill="#7c3aed" />
        </motion.g>
      )}

      {/* Light beam when level >= 2 */}
      {level >= 2 && (
        <motion.path
          d="M271,130 L310,60 L330,60 L285,130"
          fill="rgba(167,139,250,0.08)"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}

      {/* Glow at center */}
      <circle cx={260} cy={160} r={60} fill="url(#obs-glow)" />

      {/* Ground lanterns */}
      {[180, 220, 300, 340].slice(0, level + 1).map((x, i) => (
        <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.2 }}>
          <rect x={x - 2} y={178} width={4} height={12} fill="#4c1d95" />
          <motion.circle
            cx={x} cy={176} r={5}
            fill="#fde68a"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
          />
        </motion.g>
      ))}
    </svg>
  );
}

// ─── Forest Scene ─────────────────────────────────────────────────────────────
function ForestScene({ level }) {
  const trees = [
    { x: 40, h: 70, w: 30, d: 0, minLevel: 0 },
    { x: 100, h: 90, w: 35, d: 0.2, minLevel: 1 },
    { x: 180, h: 110, w: 40, d: 0.5, minLevel: 1 },
    { x: 280, h: 100, w: 38, d: 0.3, minLevel: 2 },
    { x: 360, h: 85, w: 32, d: 0.7, minLevel: 2 },
    { x: 440, h: 95, w: 36, d: 0.4, minLevel: 3 },
    { x: 490, h: 70, w: 28, d: 0.6, minLevel: 3 },
  ];
  const flowers = [
    { x: 130, minLevel: 2 }, { x: 220, minLevel: 2 },
    { x: 310, minLevel: 3 }, { x: 400, minLevel: 4 },
  ];

  return (
    <svg viewBox="0 0 520 200" className="w-full h-full">
      <defs>
        <radialGradient id="forest-glow" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor="#16a34a" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0d2b1a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="520" height="200" fill="#0d2b1a" rx="16" />

      {/* Moon / light source */}
      <motion.circle cx={260} cy={40} r={20}
        fill="#d1fae5"
        animate={{ opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      {/* River */}
      <motion.path
        d="M0,190 Q130,175 260,185 Q390,195 520,178"
        fill="none"
        stroke={level >= 2 ? "#34d399" : "#134e3a"}
        strokeWidth={level >= 2 ? 4 : 2}
        animate={{ stroke: level >= 2 ? "#34d399" : "#134e3a" }}
        transition={{ duration: 1.5 }}
      />
      {level >= 2 && (
        <motion.path
          d="M0,192 Q130,177 260,187 Q390,197 520,180"
          fill="none"
          stroke="rgba(52,211,153,0.3)"
          strokeWidth={8}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}

      {/* Trees */}
      {trees.filter(t => t.minLevel <= level).map((t, i) => (
        <motion.g key={i} initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }}
          transition={{ duration: 0.8, delay: i * 0.15 }} style={{ transformOrigin: `${t.x}px 190px` }}>
          <rect x={t.x - 4} y={190 - t.h * 0.3} width={8} height={t.h * 0.3} fill="#065f46" />
          <motion.ellipse cx={t.x} cy={190 - t.h * 0.5} rx={t.w / 2} ry={t.h * 0.5}
            fill="#15803d"
            animate={{ fill: level >= 3 ? "#22c55e" : "#15803d" }}
            transition={{ duration: 2 }}
          />
          {level >= 3 && (
            <FloatingParticle x={t.x} y={190 - t.h * 0.8} color="#86efac" delay={i * 0.4} />
          )}
        </motion.g>
      ))}

      {/* Flowers */}
      {flowers.filter(f => f.minLevel <= level).map((f, i) => (
        <motion.g key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: i * 0.2 }}
          style={{ transformOrigin: `${f.x}px 185px` }}>
          {[-1, 0, 1].map(dx => (
            <circle key={dx} cx={f.x + dx * 6} cy={183} r={3} fill="#4ade80" opacity={0.8} />
          ))}
          <circle cx={f.x} cy={183} r={4} fill="#86efac" />
        </motion.g>
      ))}

      <rect width="520" height="200" fill="url(#forest-glow)" rx="16" />
    </svg>
  );
}

// ─── City Scene ───────────────────────────────────────────────────────────────
function CityScene({ level }) {
  const buildings = [
    { x: 20, w: 40, h: 80, minLevel: 0 },
    { x: 70, w: 50, h: 100, minLevel: 0 },
    { x: 130, w: 35, h: 130, minLevel: 1 },
    { x: 175, w: 55, h: 90, minLevel: 1 },
    { x: 240, w: 45, h: 150, minLevel: 2 },
    { x: 295, w: 40, h: 110, minLevel: 2 },
    { x: 345, w: 60, h: 95, minLevel: 3 },
    { x: 415, w: 38, h: 120, minLevel: 3 },
    { x: 463, w: 50, h: 85, minLevel: 4 },
  ];

  return (
    <svg viewBox="0 0 520 200" className="w-full h-full">
      <defs>
        <radialGradient id="city-glow" cx="50%" cy="100%" r="70%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0a0f1e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="520" height="200" fill="#0a0f1e" rx="16" />

      {/* Stars */}
      {[50, 150, 300, 420, 490].slice(0, level + 1).map((x, i) => (
        <motion.circle key={i} cx={x} cy={15 + i * 8} r={1.5} fill="white"
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }} />
      ))}

      {/* Buildings */}
      {buildings.filter(b => b.minLevel <= level).map((b, i) => (
        <motion.g key={i} initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }}
          transition={{ duration: 0.6, delay: i * 0.1 }} style={{ transformOrigin: `${b.x + b.w / 2}px 200px` }}>
          <rect x={b.x} y={200 - b.h} width={b.w} height={b.h}
            fill={level >= 2 ? "#0f2a4e" : "#0a1a30"} rx={2} />
          {/* Windows */}
          {Array.from({ length: Math.floor(b.h / 18) }).map((_, row) =>
            Array.from({ length: Math.floor(b.w / 14) }).map((_, col) => {
              const lit = level >= 1 && Math.random() > 0.4;
              return (
                <motion.rect key={`${row}-${col}`}
                  x={b.x + 5 + col * 12}
                  y={200 - b.h + 8 + row * 16}
                  width={6} height={8} rx={1}
                  fill={lit ? "#38bdf8" : "#0f2040"}
                  animate={lit ? { opacity: [0.6, 1, 0.6] } : {}}
                  transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                />
              );
            })
          )}
        </motion.g>
      ))}

      {/* Grid lines on ground */}
      {level >= 2 && [80, 160, 260, 360, 440].map((x, i) => (
        <motion.line key={i} x1={x} y1={200} x2={x} y2={195}
          stroke="#38bdf8" strokeWidth={1}
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }} />
      ))}

      <rect width="520" height="200" fill="url(#city-glow)" rx="16" />
    </svg>
  );
}

// ─── Library Scene ────────────────────────────────────────────────────────────
function LibraryScene({ level }) {
  const shelves = [0, 1, 2, 3].slice(0, level + 1);
  const bookColors = ["#b45309", "#92400e", "#d97706", "#78350f", "#a16207", "#854d0e"];

  return (
    <svg viewBox="0 0 520 200" className="w-full h-full">
      <defs>
        <radialGradient id="lib-glow" cx="50%" cy="60%" r="50%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#1a0f00" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="520" height="200" fill="#1a0f00" rx="16" />

      {/* Arched window */}
      <motion.path d="M210,0 Q260,-30 310,0 L310,60 Q260,90 210,60 Z"
        fill={level >= 1 ? "#2a1800" : "#110900"} />
      <motion.path d="M210,0 Q260,-30 310,0 L310,60 Q260,90 210,60 Z"
        fill="none" stroke="#f59e0b" strokeWidth="1.5"
        animate={{ stroke: level >= 2 ? "#fbbf24" : "#92400e" }}
        transition={{ duration: 1 }} />

      {/* Moon through window */}
      {level >= 1 && (
        <motion.circle cx={260} cy={30} r={15} fill="#fde68a"
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 4, repeat: Infinity }} />
      )}

      {/* Bookshelves */}
      {[150, 110, 70, 35].slice(0, 4).map((y, row) => (
        <motion.g key={row} initial={{ opacity: 0 }} animate={{ opacity: row <= level ? 1 : 0.15 }}
          transition={{ duration: 0.8, delay: row * 0.2 }}>
          {/* Shelf board */}
          <rect x={10} y={y + 25} width={500} height={5} fill="#3d2200" rx={2} />
          {/* Books */}
          {Array.from({ length: 20 }).map((_, i) => {
            const bookH = 14 + Math.floor(i % 5) * 4;
            const bookW = 16 + Math.floor(i % 3) * 4;
            const color = bookColors[i % bookColors.length];
            const bright = row <= level && i % 3 !== 2;
            return (
              <motion.rect key={i}
                x={15 + i * 24} y={y + 25 - bookH} width={bookW} height={bookH} rx={1}
                fill={bright ? color : "#2a1800"}
                animate={bright ? { opacity: [0.7, 1, 0.7] } : {}}
                transition={{ duration: 3 + i * 0.1, repeat: Infinity, delay: i * 0.1 }} />
            );
          })}
        </motion.g>
      ))}

      {/* Reading candle */}
      <motion.g>
        <rect x={255} y={170} width={8} height={22} fill="#d97706" rx={3} />
        {level >= 1 && (
          <motion.path d="M259,168 Q256,160 260,155 Q264,160 261,168"
            fill="#fbbf24"
            animate={{ scaleY: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity }} />
        )}
      </motion.g>

      {level >= 3 && [80, 160, 360, 440].map((x, i) => (
        <FloatingParticle key={i} x={x} y={160} color="#fbbf24" delay={i * 0.5} />
      ))}

      <rect width="520" height="200" fill="url(#lib-glow)" rx="16" />
    </svg>
  );
}

// ─── Journey Scene ────────────────────────────────────────────────────────────
function JourneyScene({ level }) {
  return (
    <svg viewBox="0 0 520 200" className="w-full h-full">
      <defs>
        <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f1a2e" />
          <stop offset="100%" stopColor="#1e3a5f" />
        </linearGradient>
      </defs>
      <rect width="520" height="200" fill="url(#sky-grad)" rx="16" />

      {/* Moon */}
      <motion.circle cx={60} cy={40} r={18}
        fill="#e2e8f0"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 4, repeat: Infinity }} />

      {/* Stars */}
      {[120, 200, 300, 380, 460, 90, 250, 430].slice(0, level + 3).map((x, i) => (
        <motion.circle key={i} cx={x} cy={20 + (i % 4) * 15} r={1.5} fill="white"
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }} />
      ))}

      {/* Distant hills */}
      <motion.path d="M0,140 Q80,100 160,130 Q240,160 320,120 Q400,80 520,130 L520,200 L0,200 Z"
        fill="#152a46"
        animate={{ fill: level >= 3 ? "#1a3a5c" : "#152a46" }} />
      <motion.path d="M0,160 Q100,130 200,150 Q300,170 400,140 Q450,130 520,155 L520,200 L0,200 Z"
        fill="#1a3054"
        animate={{ fill: level >= 2 ? "#1f3d6e" : "#1a3054" }} />

      {/* Train tracks */}
      <line x1="0" y1="190" x2="520" y2="190" stroke="#334155" strokeWidth="3" />
      <line x1="0" y1="195" x2="520" y2="195" stroke="#334155" strokeWidth="3" />
      {Array.from({ length: 15 }).map((_, i) => (
        <rect key={i} x={i * 36} y={188} width={16} height={9} fill="#1e2f44" rx={1} />
      ))}

      {/* Train */}
      <motion.g
        animate={{ x: [0, 520 * (level / 5)] }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        {/* Body */}
        <rect x={-80} y={165} width={70} height={25} fill={level >= 1 ? "#1d4ed8" : "#1e293b"} rx={6} />
        <rect x={-90} y={170} width={18} height={20} fill={level >= 1 ? "#1e40af" : "#1e293b"} rx={4} />
        {/* Windows */}
        <rect x={-75} y={169} width={12} height={10} rx={2} fill={level >= 1 ? "#93c5fd" : "#334155"} />
        <rect x={-58} y={169} width={12} height={10} rx={2} fill={level >= 1 ? "#93c5fd" : "#334155"} />
        {/* Wheels */}
        <circle cx={-75} cy={190} r={5} fill="#64748b" />
        <circle cx={-55} cy={190} r={5} fill="#64748b" />
        <circle cx={-30} cy={190} r={5} fill="#64748b" />
        {/* Steam */}
        {level >= 1 && (
          <motion.ellipse cx={-91} cy={162} rx={6} ry={4} fill="rgba(255,255,255,0.15)"
            animate={{ opacity: [0.3, 0.7, 0], y: [0, -8, -16], scaleX: [1, 1.5, 2] }}
            transition={{ duration: 1.5, repeat: Infinity }} />
        )}
      </motion.g>

      {/* Station lights */}
      {[100, 250, 400].slice(0, level).map((x, i) => (
        <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.3 }}>
          <line x1={x} y1={175} x2={x} y2={155} stroke="#475569" strokeWidth={2} />
          <motion.circle cx={x} cy={153} r={5} fill="#fde68a"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2 + i, repeat: Infinity }} />
        </motion.g>
      ))}
    </svg>
  );
}

// ─── Kingdom Scene ────────────────────────────────────────────────────────────
function KingdomScene({ level }) {
  return (
    <svg viewBox="0 0 520 200" className="w-full h-full">
      <defs>
        <radialGradient id="kingdom-glow" cx="50%" cy="70%" r="60%">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#1a0a2e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="520" height="200" fill="#1a0a2e" rx="16" />

      {/* Clouds / floating islands */}
      {[
        { x: 130, y: 150, w: 100, minLevel: 0 },
        { x: 290, y: 130, w: 80, minLevel: 1 },
        { x: 420, y: 155, w: 90, minLevel: 2 },
      ].filter(c => c.minLevel <= level).map((c, i) => (
        <motion.g key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.4, duration: 0.8 }}>
          <ellipse cx={c.x} cy={c.y + 10} rx={c.w / 2} ry={10} fill="#2e1f50" />
          <rect x={c.x - c.w / 2} y={c.y - 5} width={c.w} height={15} fill="#2e1f50" rx={4} />
        </motion.g>
      ))}

      {/* Main castle tower */}
      <motion.g initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
        style={{ transformOrigin: "260px 200px" }}>
        <rect x={220} y={80} width={80} height={120} fill={level >= 1 ? "#3b1f7a" : "#1e1040"} rx={4} />
        {/* Battlements */}
        {[225, 245, 265, 285].map((x, i) => (
          <rect key={i} x={x} y={72} width={12} height={14} fill={level >= 1 ? "#3b1f7a" : "#1e1040"} rx={2} />
        ))}
        {/* Tower top */}
        <motion.path d="M220,80 L260,40 L300,80"
          fill={level >= 2 ? "#6d28d9" : "#2d1f5e"}
          animate={{ fill: level >= 2 ? "#6d28d9" : "#2d1f5e" }} />
        {/* Flag */}
        {level >= 2 && (
          <motion.g>
            <line x1="260" y1="40" x2="260" y2="20" stroke="#7c3aed" strokeWidth={2} />
            <motion.polygon points="260,20 280,27 260,34" fill="#a78bfa"
              animate={{ skewX: [-5, 5, -5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
          </motion.g>
        )}
        {/* Window */}
        <motion.circle cx={260} cy={130} r={12}
          fill={level >= 1 ? "#7c3aed" : "#1e1040"}
          animate={level >= 1 ? { opacity: [0.5, 1, 0.5] } : {}}
          transition={{ duration: 2.5, repeat: Infinity }} />
      </motion.g>

      {/* Side towers */}
      {level >= 2 && (
        <motion.g initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }}
          style={{ transformOrigin: "190px 200px" }}>
          <rect x={170} y={120} width={40} height={80} fill="#2d1f5e" rx={3} />
          <motion.path d="M170,120 L190,95 L210,120" fill="#5b21b6" />
          <rect x={183} y={150} width={14} height={16} rx={2} fill="#7c3aed" />
        </motion.g>
      )}
      {level >= 2 && (
        <motion.g initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }}
          style={{ transformOrigin: "330px 200px" }}>
          <rect x={310} y={125} width={40} height={75} fill="#2d1f5e" rx={3} />
          <motion.path d="M310,125 L330,100 L350,125" fill="#5b21b6" />
          <rect x={323} y={155} width={14} height={16} rx={2} fill="#7c3aed" />
        </motion.g>
      )}

      {/* Bridge */}
      {level >= 3 && (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <rect x={200} y={170} width={120} height={8} fill="#4c1d95" rx={3} />
          {[210, 235, 260, 285, 305].map((x, i) => (
            <motion.line key={i} x1={x} y1={178} x2={x} y2={165}
              stroke="#7c3aed" strokeWidth={2}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }} />
          ))}
        </motion.g>
      )}

      {/* Floating particles */}
      {level >= 3 && [150, 200, 300, 350, 400].map((x, i) => (
        <FloatingParticle key={i} x={x} y={100 + i * 10} color="#c084fc" delay={i * 0.6} />
      ))}

      <rect width="520" height="200" fill="url(#kingdom-glow)" rx="16" />
    </svg>
  );
}

// ─── Main WorldScene component ─────────────────────────────────────────────────
export default function WorldScene({ archetype, level, compact = false }) {
  const SceneMap = {
    observatory: ObservatoryScene,
    forest: ForestScene,
    city: CityScene,
    library: LibraryScene,
    journey: JourneyScene,
    kingdom: KingdomScene,
  };

  const Scene = SceneMap[archetype?.id] || JourneyScene;
  const levelName = LEVEL_NAMES[level] || "Dormant";

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: archetype?.color || "#0d0d2e",
        boxShadow: `0 0 40px ${archetype?.glowColor || "rgba(100,100,200,0.2)"}`,
        height: compact ? 120 : 200,
      }}
    >
      <Scene level={level} archetype={archetype} />

      {/* Level badge */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
        style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}>
        <motion.span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: archetype?.accentColor }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="text-[10px] font-bold tracking-widest uppercase"
          style={{ color: archetype?.accentColor }}>
          {levelName}
        </span>
      </div>

      {/* World name */}
      <div className="absolute top-3 left-3">
        <span className="text-[10px] font-semibold text-white/50">
          {archetype?.emoji} {archetype?.name}
        </span>
      </div>
    </div>
  );
}
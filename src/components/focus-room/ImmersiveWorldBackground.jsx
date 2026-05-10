import { motion } from "framer-motion";

// Shared floating wisp
function Wisp({ x, y, color, size = 3, delay = 0, duration = 6 }) {
  return (
    <motion.circle
      cx={x} cy={y} r={size}
      fill={color}
      animate={{ cy: [y, y - 60, y], opacity: [0, 0.9, 0] }}
      transition={{ duration, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

// ── Forest / Spirit Forest ────────────────────────────────────────────────────
function ForestBackground({ level, isRunning }) {
  const glowOpacity = 0.3 + level * 0.12;
  return (
    <svg viewBox="0 0 1200 700" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="f-sky" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="#0a1f12" />
          <stop offset="100%" stopColor="#040c08" />
        </radialGradient>
        <radialGradient id="f-glow" cx="50%" cy="60%" r="50%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity={glowOpacity} />
          <stop offset="100%" stopColor="#166534" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="f-moon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d1fae5" />
          <stop offset="70%" stopColor="#86efac" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sky */}
      <rect width="1200" height="700" fill="url(#f-sky)" />

      {/* Moon */}
      <motion.circle cx="600" cy="100" r={level >= 2 ? 55 : 30}
        fill="url(#f-moon)"
        animate={{ opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 5, repeat: Infinity }} />

      {/* Background mist layers */}
      {[0.08, 0.12, 0.15].map((op, i) => (
        <motion.rect key={i} x="0" y={400 + i * 60} width="1200" height="150"
          fill={`rgba(34,197,94,${op})`}
          animate={{ x: [-20, 20, -20] }}
          transition={{ duration: 12 + i * 4, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Giant background trees */}
      {[0, 150, 380, 620, 860, 1050, 1180].map((x, i) => {
        const h = 350 + (i % 3) * 80;
        const w = 120 + (i % 4) * 30;
        const visible = i < (level + 2);
        return (
          <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: visible ? 1 : 0.05 }} transition={{ duration: 1.5, delay: i * 0.2 }}>
            {/* Trunk */}
            <rect x={x - 12} y={700 - h} width={24} height={h} fill="#052e16" rx={8} />
            {/* Canopy layers */}
            <motion.ellipse cx={x} cy={700 - h + 20} rx={w / 2} ry={h * 0.45}
              fill={level >= 2 ? "#14532d" : "#052e16"}
              animate={{ fill: level >= 3 ? "#166534" : level >= 2 ? "#14532d" : "#052e16" }}
              transition={{ duration: 2 }} />
            <ellipse cx={x} cy={700 - h - 20} rx={w / 2.5} ry={h * 0.3}
              fill={level >= 3 ? "#15803d" : "#14532d"} />
            {/* Bioluminescent dots on canopy */}
            {level >= 2 && (
              <>
                <Wisp x={x - 20} y={700 - h + 30} color="#86efac" size={2.5} delay={i * 0.3} duration={4 + i * 0.3} />
                <Wisp x={x + 25} y={700 - h - 10} color="#4ade80" size={2} delay={i * 0.5} duration={5} />
              </>
            )}
          </motion.g>
        );
      })}

      {/* Foreground giant roots / trunks */}
      <motion.path d="M0,700 Q80,400 120,200 Q140,100 160,700" fill="#052e16" animate={{ fill: level >= 1 ? "#065f46" : "#052e16" }} />
      <motion.path d="M1200,700 Q1120,380 1080,180 Q1060,90 1040,700" fill="#052e16" animate={{ fill: level >= 1 ? "#065f46" : "#052e16" }} />

      {/* Path */}
      <motion.path
        d="M400,700 Q500,600 560,500 Q600,430 580,350 Q560,270 600,200"
        fill="none"
        stroke={level >= 1 ? "#1a2e1a" : "#0a1a0a"}
        strokeWidth="60"
        animate={{ stroke: level >= 2 ? "#1f4a1f" : "#0a1a0a" }}
      />
      {level >= 2 && (
        <motion.path
          d="M400,700 Q500,600 560,500 Q600,430 580,350 Q560,270 600,200"
          fill="none"
          stroke="rgba(74,222,128,0.12)"
          strokeWidth="80"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      )}

      {/* Floating wisps along path */}
      {level >= 1 && [
        { x: 520, y: 520, d: 0 }, { x: 565, y: 460, d: 0.8 }, { x: 575, y: 390, d: 1.6 },
        { x: 582, y: 310, d: 2.4 }, { x: 595, y: 240, d: 3.2 },
      ].map((w, i) => <Wisp key={i} x={w.x} y={w.y} color="#86efac" size={3 + i * 0.5} delay={w.d} duration={5} />)}

      {/* Ground flora */}
      {level >= 2 && Array.from({ length: 20 }).map((_, i) => {
        const x = 50 + i * 57;
        return (
          <motion.g key={i}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.05 }}
            style={{ transformOrigin: `${x}px 700px` }}>
            <ellipse cx={x} cy={685} rx={8} ry={12} fill="#166534" opacity={0.8} />
            <motion.circle cx={x} cy={675} r={3} fill="#4ade80"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2 + i * 0.1, repeat: Infinity, delay: i * 0.15 }} />
          </motion.g>
        );
      })}

      {/* Central glow */}
      <rect width="1200" height="700" fill="url(#f-glow)" />
    </svg>
  );
}

// ── Observatory ───────────────────────────────────────────────────────────────
function ObservatoryBackground({ level, isRunning }) {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    x: Math.random() * 1200, y: Math.random() * 400,
    r: 0.8 + Math.random() * 2, d: Math.random() * 4,
  }));

  return (
    <svg viewBox="0 0 1200 700" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="o-sky" cx="50%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#0f0a2e" />
          <stop offset="100%" stopColor="#04030f" />
        </radialGradient>
        <radialGradient id="o-nebula" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.15 + level * 0.06} />
          <stop offset="60%" stopColor="#4f46e5" stopOpacity="0.05" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1200" height="700" fill="url(#o-sky)" />
      <rect width="1200" height="700" fill="url(#o-nebula)" />

      {/* Stars */}
      {stars.slice(0, 20 + level * 8).map((s, i) => (
        <motion.circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white"
          animate={{ opacity: [0.2, 0.9, 0.2] }}
          transition={{ duration: 2 + s.d, repeat: Infinity, delay: s.d, ease: "easeInOut" }} />
      ))}

      {/* Large nebula cloud */}
      {level >= 2 && (
        <motion.ellipse cx="600" cy="200" rx="350" ry="120"
          fill="rgba(139,92,246,0.06)"
          animate={{ scaleX: [1, 1.05, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 8, repeat: Infinity }} />
      )}

      {/* Moon */}
      <motion.circle cx="900" cy="100" r={level >= 1 ? 65 : 25}
        fill="rgba(233,213,255,0.9)"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 5, repeat: Infinity }} />

      {/* Constellations */}
      {level >= 2 && (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 0.6 }}>
          {[[200, 150, 260, 130], [260, 130, 300, 160], [300, 160, 280, 200]].map(([x1, y1, x2, y2], i) => (
            <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4 3"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: i * 0.4 }} />
          ))}
        </motion.g>
      )}

      {/* Observatory dome (distant) */}
      <motion.ellipse cx="600" cy="700" rx="200" ry="40" fill="#1e1b4b" />
      <motion.path d="M400,700 Q600,500 800,700" fill={level >= 1 ? "#2e2a6e" : "#1a1a4e"}
        animate={{ fill: level >= 2 ? "#3730a3" : "#2e2a6e" }} />
      {level >= 1 && (
        <motion.g>
          <line x1="595" y1="590" x2="620" y2="520" stroke="#a78bfa" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="622" cy="517" rx="12" ry="6" fill="#7c3aed" />
        </motion.g>
      )}
      {level >= 2 && (
        <motion.path d="M622,512 L700,300 L740,300 L655,512"
          fill="rgba(167,139,250,0.06)"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 4, repeat: Infinity }} />
      )}

      {/* Ground lanterns */}
      {Array.from({ length: Math.min(level + 2, 8) }).map((_, i) => {
        const x = 200 + i * 110;
        return (
          <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.2 }}>
            <line x1={x} y1={700} x2={x} y2={660} stroke="#4c1d95" strokeWidth={3} />
            <motion.circle cx={x} cy={656} r={8} fill="#fde68a"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2 + i * 0.3, repeat: Infinity }} />
          </motion.g>
        );
      })}
    </svg>
  );
}

// ── Network City ──────────────────────────────────────────────────────────────
function CityBackground({ level, isRunning }) {
  const buildingData = [
    { x: 0, w: 90, h: 250 }, { x: 100, w: 70, h: 320 }, { x: 180, w: 110, h: 200 },
    { x: 300, w: 80, h: 380 }, { x: 390, w: 60, h: 280 }, { x: 460, w: 100, h: 430 },
    { x: 570, w: 90, h: 350 }, { x: 670, w: 70, h: 260 }, { x: 750, w: 120, h: 410 },
    { x: 880, w: 80, h: 300 }, { x: 970, w: 90, h: 370 }, { x: 1070, w: 80, h: 250 },
    { x: 1150, w: 70, h: 320 },
  ].filter((_, i) => i < level + 5);

  return (
    <svg viewBox="0 0 1200 700" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="c-sky" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="#020a18" />
          <stop offset="100%" stopColor="#000509" />
        </radialGradient>
        <radialGradient id="c-glow" cx="50%" cy="100%" r="70%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.15 + level * 0.06} />
          <stop offset="60%" stopColor="#0284c7" stopOpacity="0.04" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      <rect width="1200" height="700" fill="url(#c-sky)" />

      {/* Buildings */}
      {buildingData.map((b, i) => (
        <motion.g key={i} initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: i * 0.06 }}
          style={{ transformOrigin: `${b.x + b.w / 2}px 700px` }}>
          <rect x={b.x} y={700 - b.h} width={b.w} height={b.h}
            fill={level >= 3 ? "#0c2040" : "#081828"} rx={2} />
          {/* Windows */}
          {Array.from({ length: Math.floor(b.h / 22) }).map((_, row) =>
            Array.from({ length: Math.floor(b.w / 16) }).map((_, col) => {
              const lit = level >= 1 && (row + col + i) % 3 !== 0;
              return (
                <motion.rect key={`${row}-${col}`}
                  x={b.x + 5 + col * 14} y={700 - b.h + 8 + row * 20}
                  width={8} height={10} rx={1}
                  fill={lit ? "#38bdf8" : "#0a1830"}
                  animate={lit && isRunning ? { opacity: [0.5, 1, 0.5] } : {}}
                  transition={{ duration: 2 + (row * col) % 3, repeat: Infinity, delay: (i + row) * 0.1 }}
                />
              );
            })
          )}
        </motion.g>
      ))}

      {/* Ground grid */}
      {level >= 2 && Array.from({ length: 8 }).map((_, i) => (
        <motion.line key={i}
          x1={150 * i} y1={700} x2={150 * i + 75} y2={660}
          stroke="#0ea5e9" strokeWidth={1}
          animate={{ opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }} />
      ))}

      <rect width="1200" height="700" fill="url(#c-glow)" />
    </svg>
  );
}

// ── Library ───────────────────────────────────────────────────────────────────
function LibraryBackground({ level, isRunning }) {
  const bookColors = ["#92400e", "#b45309", "#d97706", "#78350f", "#a16207"];
  return (
    <svg viewBox="0 0 1200 700" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="l-bg" cx="50%" cy="50%" r="80%">
          <stop offset="0%" stopColor="#1a0f00" />
          <stop offset="100%" stopColor="#090500" />
        </radialGradient>
        <radialGradient id="l-glow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.12 + level * 0.05} />
          <stop offset="100%" stopColor="#92400e" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1200" height="700" fill="url(#l-bg)" />

      {/* Giant arched windows */}
      {[200, 600, 1000].map((x, i) => (
        <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: i <= level ? 1 : 0.15 }}
          transition={{ duration: 1, delay: i * 0.3 }}>
          <motion.path d={`M${x - 80},700 L${x - 80},300 Q${x},180 ${x + 80},300 L${x + 80},700`}
            fill={level >= 1 ? "#1f1200" : "#0f0900"}
            animate={{ fill: level >= 2 ? "#251500" : "#1a1000" }} />
          <motion.path d={`M${x - 80},700 L${x - 80},300 Q${x},180 ${x + 80},300 L${x + 80},700`}
            fill="none" stroke={level >= 2 ? "#fbbf24" : "#78350f"} strokeWidth="2" />
          {level >= 1 && (
            <motion.circle cx={x} cy={220} r={30} fill="#fde68a"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, delay: i * 0.7 }} />
          )}
        </motion.g>
      ))}

      {/* Bookshelves */}
      {[150, 250, 350, 450, 550].slice(0, level + 1).map((y, row) => (
        <motion.g key={row} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: row * 0.2 }}>
          <rect x={0} y={y + 30} width={1200} height={6} fill="#3d2200" rx={3} />
          {Array.from({ length: 40 }).map((_, i) => {
            const bh = 16 + (i % 5) * 5;
            const bw = 20 + (i % 4) * 5;
            const col = bookColors[i % bookColors.length];
            return (
              <motion.rect key={i} x={8 + i * 30} y={y + 30 - bh} width={bw} height={bh} rx={1}
                fill={col}
                animate={isRunning ? { opacity: [0.6, 1, 0.6] } : {}}
                transition={{ duration: 3 + i * 0.05, repeat: Infinity, delay: i * 0.05 }} />
            );
          })}
        </motion.g>
      ))}

      {/* Floating particles */}
      {level >= 2 && Array.from({ length: 12 }).map((_, i) => (
        <Wisp key={i} x={100 + i * 90} y={400 + (i % 4) * 50} color="#fbbf24" size={2} delay={i * 0.5} duration={5} />
      ))}

      <rect width="1200" height="700" fill="url(#l-glow)" />
    </svg>
  );
}

// ── Journey (default) ─────────────────────────────────────────────────────────
function JourneyBackground({ level, isRunning }) {
  return (
    <svg viewBox="0 0 1200 700" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="j-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1628" />
          <stop offset="100%" stopColor="#162540" />
        </linearGradient>
      </defs>
      <rect width="1200" height="700" fill="url(#j-sky)" />

      {/* Stars */}
      {Array.from({ length: 40 + level * 10 }).map((_, i) => (
        <motion.circle key={i} cx={Math.random() * 1200} cy={Math.random() * 300} r={1 + Math.random() * 1.5}
          fill="white"
          animate={{ opacity: [0.2, 0.9, 0.2] }}
          transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3 }} />
      ))}

      {/* Moon */}
      <motion.circle cx="200" cy="100" r={40}
        fill="#e2e8f0"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 5, repeat: Infinity }} />

      {/* Hills */}
      <motion.path d="M0,500 Q200,380 400,450 Q600,520 800,400 Q1000,280 1200,430 L1200,700 L0,700 Z"
        fill="#112038"
        animate={{ fill: level >= 3 ? "#152a4a" : "#112038" }} />
      <motion.path d="M0,580 Q300,500 600,540 Q900,580 1200,510 L1200,700 L0,700 Z"
        fill="#162d50"
        animate={{ fill: level >= 2 ? "#1a3860" : "#162d50" }} />

      {/* Path */}
      <path d="M500,700 Q580,550 600,400 Q610,300 600,150" fill="none" stroke="#1a2e44" strokeWidth="80" />
      {level >= 1 && (
        <motion.path d="M500,700 Q580,550 600,400 Q610,300 600,150"
          fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="100"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }} />
      )}

      {level >= 2 && Array.from({ length: 6 }).map((_, i) => (
        <Wisp key={i} x={580 + (i % 3) * 20} y={550 - i * 70} color="#94a3b8" size={3} delay={i * 0.8} duration={6} />
      ))}
    </svg>
  );
}

// ── Kingdom ───────────────────────────────────────────────────────────────────
function KingdomBackground({ level, isRunning }) {
  return (
    <svg viewBox="0 0 1200 700" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="k-sky" cx="50%" cy="40%" r="80%">
          <stop offset="0%" stopColor="#150830" />
          <stop offset="100%" stopColor="#080315" />
        </radialGradient>
        <radialGradient id="k-glow" cx="50%" cy="70%" r="60%">
          <stop offset="0%" stopColor="#a855f7" stopOpacity={0.15 + level * 0.05} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      <rect width="1200" height="700" fill="url(#k-sky)" />

      {/* Stars */}
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.circle key={i} cx={(i * 53) % 1200} cy={(i * 37) % 350} r={0.8 + (i % 3) * 0.6}
          fill="white"
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 3 + i % 4, repeat: Infinity, delay: i * 0.1 }} />
      ))}

      {/* Floating islands */}
      {[
        { x: 150, y: 400, w: 180, minLevel: 0 },
        { x: 500, y: 300, w: 220, minLevel: 1 },
        { x: 900, y: 380, w: 160, minLevel: 1 },
        { x: 700, y: 500, w: 200, minLevel: 2 },
      ].filter(c => c.minLevel <= level).map((c, i) => (
        <motion.g key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.3, duration: 1 }}>
          <motion.animate attributeName="transform" type="translate"
            values="0 0;0 -12;0 0" dur="6s" repeatCount="indefinite" />
          <ellipse cx={c.x} cy={c.y + 15} rx={c.w / 2} ry={18} fill="#1f1040" />
          <rect x={c.x - c.w / 2} y={c.y - 12} width={c.w} height={27} fill="#2a1755" rx={6} />
          <ellipse cx={c.x} cy={c.y - 12} rx={c.w / 2} ry={10} fill="#351d6e" />
        </motion.g>
      ))}

      {/* Central castle */}
      <motion.g initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} style={{ transformOrigin: "600px 700px" }}>
        <rect x={520} y={300} width={160} height={400} fill={level >= 1 ? "#3b1f7a" : "#1e1040"} rx={6} />
        {[525, 555, 585, 615, 645, 675].map((x, i) => (
          <rect key={i} x={x} y={290} width={22} height={22} fill={level >= 1 ? "#3b1f7a" : "#1e1040"} rx={3} />
        ))}
        <motion.path d="M520,300 L600,200 L680,300" fill={level >= 2 ? "#6d28d9" : "#2d1f5e"}
          animate={{ fill: level >= 2 ? "#6d28d9" : "#2d1f5e" }} />
        {level >= 2 && (
          <motion.g>
            <line x1="600" y1="200" x2="600" y2="160" stroke="#7c3aed" strokeWidth={3} />
            <motion.polygon points="600,160 630,175 600,190" fill="#a78bfa"
              animate={{ skewX: [-8, 8, -8] }}
              transition={{ duration: 2, repeat: Infinity }} />
          </motion.g>
        )}
        {/* Castle windows */}
        {[[550, 380], [610, 380], [580, 440], [550, 480], [610, 480]].map(([x, y], i) => (
          <motion.rect key={i} x={x} y={y} width={20} height={28} rx={10} ry={6}
            fill={level >= 1 ? "#7c3aed" : "#2d1f5e"}
            animate={level >= 1 ? { opacity: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, delay: i * 0.2 }} />
        ))}
      </motion.g>

      {/* Side towers */}
      {level >= 2 && (
        <>
          <motion.g initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} style={{ transformOrigin: "400px 700px" }}>
            <rect x={360} y={420} width={80} height={280} fill="#2d1f5e" rx={4} />
            <motion.path d="M360,420 L400,360 L440,420" fill="#5b21b6" />
          </motion.g>
          <motion.g initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} style={{ transformOrigin: "800px 700px" }}>
            <rect x={760} y={430} width={80} height={270} fill="#2d1f5e" rx={4} />
            <motion.path d="M760,430 L800,370 L840,430" fill="#5b21b6" />
          </motion.g>
        </>
      )}

      {level >= 3 && Array.from({ length: 10 }).map((_, i) => (
        <Wisp key={i} x={300 + i * 70} y={300 + (i % 4) * 60} color="#c084fc" size={2.5} delay={i * 0.6} duration={5} />
      ))}

      <rect width="1200" height="700" fill="url(#k-glow)" />
    </svg>
  );
}

const SCENE_MAP = {
  forest: ForestBackground,
  observatory: ObservatoryBackground,
  city: CityBackground,
  library: LibraryBackground,
  journey: JourneyBackground,
  kingdom: KingdomBackground,
};

export default function ImmersiveWorldBackground({ archetype, level, isRunning }) {
  const Scene = SCENE_MAP[archetype?.id] || JourneyBackground;
  return (
    <div className="absolute inset-0 overflow-hidden">
      <Scene level={level} isRunning={isRunning} />
    </div>
  );
}
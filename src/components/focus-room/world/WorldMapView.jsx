import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LEVEL_NAMES, getWorldLevel, getLevelProgress } from "./WorldEngine";

// Milestone definitions per world level
export const MILESTONES = [
  { level: 0, xp: 0,  region: "Outer Wastes",    desc: "The realm lies dormant. Begin your first task to awaken it.",   emoji: "🌑" },
  { level: 1, xp: 3,  region: "Ember Grounds",   desc: "A faint warmth stirs. Complete 3 sessions to advance.",         emoji: "🔥" },
  { level: 2, xp: 8,  region: "Misty Reaches",   desc: "Fog lifts as knowledge grows. 8 sessions milestone reached.",   emoji: "🌫️" },
  { level: 3, xp: 16, region: "Living Heart",     desc: "The world breathes. 16 sessions — you're unstoppable.",         emoji: "💚" },
  { level: 4, xp: 28, region: "Radiant Peaks",   desc: "Light crowns the summit. 28 sessions of pure dedication.",      emoji: "✨" },
  { level: 5, xp: 45, region: "Restored Eden",   desc: "Full restoration achieved. A legend of focus.",                 emoji: "🌟" },
];

// Badges earned at each milestone
export const MILESTONE_BADGES = [
  { id: "first_spark",   xpRequired: 1,  emoji: "⚡", name: "First Spark",    desc: "Started the journey" },
  { id: "pathfinder",    xpRequired: 3,  emoji: "🧭", name: "Pathfinder",     desc: "Ember Grounds unlocked" },
  { id: "fog_walker",    xpRequired: 8,  emoji: "🌫️", name: "Fog Walker",     desc: "Misty Reaches explored" },
  { id: "heart_tender",  xpRequired: 16, emoji: "💚", name: "Heart Tender",   desc: "Living Heart awakened" },
  { id: "peak_climber",  xpRequired: 28, emoji: "🏔️", name: "Peak Climber",   desc: "Radiant Peaks conquered" },
  { id: "world_restorer",xpRequired: 45, emoji: "🌟", name: "World Restorer", desc: "Full restoration complete" },
  { id: "task_master",   xpRequired: 10, emoji: "🎯", name: "Task Master",    desc: "10 tasks completed",    taskBased: true },
  { id: "focus_sage",    xpRequired: 25, emoji: "🧘", name: "Focus Sage",     desc: "25 tasks completed",    taskBased: true },
];

// SVG world map node positions (6 nodes in a flowing path)
const NODE_POSITIONS = [
  { x: 50,  y: 85 },
  { x: 22,  y: 68 },
  { x: 65,  y: 52 },
  { x: 30,  y: 35 },
  { x: 68,  y: 20 },
  { x: 50,  y: 6  },
];

function MapNode({ milestone, isUnlocked, isCurrent, accentColor, onClick }) {
  return (
    <motion.g
      onClick={isUnlocked ? onClick : undefined}
      style={{ cursor: isUnlocked ? "pointer" : "default" }}
      whileHover={isUnlocked ? { scale: 1.15 } : {}}
    >
      {/* Glow ring for current */}
      {isCurrent && (
        <motion.circle
          cx={milestone.x} cy={milestone.y} r="7"
          fill="none"
          stroke={accentColor}
          strokeWidth="1.5"
          animate={{ r: [7, 10, 7], opacity: [0.8, 0.2, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {/* Node circle */}
      <circle
        cx={milestone.x} cy={milestone.y} r="5"
        fill={isUnlocked ? accentColor : "rgba(255,255,255,0.08)"}
        stroke={isUnlocked ? accentColor : "rgba(255,255,255,0.15)"}
        strokeWidth="1"
      />
      {/* Emoji label */}
      <text
        x={milestone.x} y={milestone.y + 14}
        textAnchor="middle"
        fontSize="7"
        fill={isUnlocked ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)"}
      >
        {milestone.emoji}
      </text>
    </motion.g>
  );
}

export default function WorldMapView({ archetype, totalXP, taskCount }) {
  const level = getWorldLevel(totalXP);
  const progress = getLevelProgress(totalXP);
  const [hoveredMilestone, setHoveredMilestone] = useState(null);

  const earnedBadges = MILESTONE_BADGES.filter(b =>
    b.taskBased ? taskCount >= b.xpRequired : totalXP >= b.xpRequired
  );

  // Build SVG path connecting nodes
  const pathD = NODE_POSITIONS.map((p, i) =>
    i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
  ).join(" ");

  // Progress path up to current level
  const progressNodes = NODE_POSITIONS.slice(0, level + 1);
  const progressPathD = progressNodes.map((p, i) =>
    i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
  ).join(" ");

  return (
    <div className="space-y-5">
      {/* Map + Badges layout */}
      <div className="flex gap-5 flex-col lg:flex-row">

        {/* SVG World Map */}
        <div
          className="relative rounded-2xl overflow-hidden border border-white/10 flex-shrink-0"
          style={{
            background: `radial-gradient(ellipse at 50% 100%, ${archetype.glowColor} 0%, #1a1a2e 65%)`,
            width: "100%",
            maxWidth: 280,
            minHeight: 320,
          }}
        >
          <div className="absolute top-3 left-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">World Map</p>
            <p className="text-sm font-bold text-white mt-0.5">{archetype.name}</p>
          </div>

          <svg
            viewBox="0 0 100 100"
            className="w-full h-full absolute inset-0"
            preserveAspectRatio="xMidYMid meet"
            style={{ padding: "8%" }}
          >
            {/* Background path (dimmed) */}
            <path d={pathD} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" strokeDasharray="2 2" />

            {/* Progress path (lit) */}
            {progressNodes.length > 1 && (
              <motion.path
                d={progressPathD}
                fill="none"
                stroke={archetype.accentColor}
                strokeWidth="1"
                strokeOpacity="0.6"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            )}

            {/* Nodes */}
            {MILESTONES.map((ms, i) => {
              const pos = NODE_POSITIONS[i];
              const isUnlocked = i <= level;
              const isCurrent = i === level;
              return (
                <MapNode
                  key={ms.region}
                  milestone={{ ...ms, ...pos }}
                  isUnlocked={isUnlocked}
                  isCurrent={isCurrent}
                  accentColor={archetype.accentColor}
                  onClick={() => setHoveredMilestone(hoveredMilestone === i ? null : i)}
                />
              );
            })}
          </svg>

          {/* Hovered milestone tooltip */}
          <AnimatePresence>
            {hoveredMilestone !== null && (
              <motion.div
                key={hoveredMilestone}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute bottom-3 left-3 right-3 rounded-xl p-3 text-xs"
                style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <p className="font-bold text-white mb-0.5">
                  {MILESTONES[hoveredMilestone].emoji} {MILESTONES[hoveredMilestone].region}
                </p>
                <p className="text-white/50 leading-snug">{MILESTONES[hoveredMilestone].desc}</p>
                {hoveredMilestone > level && (
                  <p className="text-white/30 mt-1">
                    Requires {MILESTONES[hoveredMilestone].xp} XP · You have {totalXP}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right — current region + badges */}
        <div className="flex-1 space-y-4">
          {/* Current region card */}
          <div
            className="rounded-2xl border border-white/10 p-5"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">Current Region</p>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{MILESTONES[level].emoji}</span>
              <div>
                <p className="text-lg font-extrabold text-white">{MILESTONES[level].region}</p>
                <p className="text-[10px] text-white/40">{LEVEL_NAMES[level]} · Level {level}</p>
              </div>
            </div>

            {/* XP progress to next */}
            {level < 5 && (
              <div>
                <div className="flex justify-between text-[10px] text-white/30 mb-1">
                  <span>{totalXP} XP</span>
                  <span>Next: {MILESTONES[level + 1]?.xp} XP — {MILESTONES[level + 1]?.region}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: archetype.accentColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
            {level === 5 && (
              <p className="text-xs font-bold mt-1" style={{ color: archetype.accentColor }}>
                🌟 World fully restored!
              </p>
            )}
          </div>

          {/* Badges */}
          <div
            className="rounded-2xl border border-white/10 p-5"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-3">
              Badges — {earnedBadges.length}/{MILESTONE_BADGES.length} Earned
            </p>
            <div className="grid grid-cols-4 gap-2">
              {MILESTONE_BADGES.map(badge => {
                const earned = earnedBadges.some(b => b.id === badge.id);
                return (
                  <motion.div
                    key={badge.id}
                    whileHover={{ scale: 1.1 }}
                    className="flex flex-col items-center gap-1 cursor-default"
                    title={`${badge.name}: ${badge.desc}`}
                  >
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center text-lg border transition-all"
                      style={{
                        background: earned ? archetype.accentColor + "22" : "rgba(255,255,255,0.04)",
                        borderColor: earned ? archetype.accentColor + "55" : "rgba(255,255,255,0.08)",
                        filter: earned ? "none" : "grayscale(1) opacity(0.3)",
                      }}
                    >
                      {badge.emoji}
                    </div>
                    <p className="text-[8px] text-white/30 text-center leading-tight">{badge.name}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Milestone timeline strip */}
      <div
        className="rounded-2xl border border-white/10 p-5"
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-4">Restoration Timeline</p>
        <div className="flex items-center gap-0">
          {MILESTONES.map((ms, i) => {
            const isUnlocked = i <= level;
            const isCurrent = i === level;
            return (
              <div key={ms.region} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <motion.div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-sm border"
                    animate={isCurrent ? { boxShadow: [`0 0 0px ${archetype.accentColor}`, `0 0 12px ${archetype.accentColor}`, `0 0 0px ${archetype.accentColor}`] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      background: isUnlocked ? archetype.accentColor + "33" : "rgba(255,255,255,0.05)",
                      borderColor: isUnlocked ? archetype.accentColor : "rgba(255,255,255,0.1)",
                    }}
                  >
                    <span style={{ filter: isUnlocked ? "none" : "grayscale(1) opacity(0.3)" }}>{ms.emoji}</span>
                  </motion.div>
                  <p className="text-[7px] text-white/25 text-center mt-1 leading-tight hidden sm:block">{ms.region}</p>
                </div>
                {i < MILESTONES.length - 1 && (
                  <div className="h-px flex-1 mx-1" style={{ background: i < level ? archetype.accentColor + "60" : "rgba(255,255,255,0.08)" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
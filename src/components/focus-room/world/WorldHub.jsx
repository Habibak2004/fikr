import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map, LayoutGrid } from "lucide-react";
import { ARCHETYPES, getArchetypeForCourse, getWorldLevel, getLevelProgress, LEVEL_NAMES } from "./WorldEngine";
import WorldMapView from "./WorldMapView";

const ARCHETYPE_ICONS = {
  observatory: (
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  ),
  forest: (
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L8 8H5l7 7-2 7h4l-2-7 7-7h-3L12 2z"/>
    </svg>
  ),
  city: (
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3"/><circle cx="4" cy="6" r="2"/><circle cx="20" cy="6" r="2"/><circle cx="4" cy="18" r="2"/><circle cx="20" cy="18" r="2"/>
      <line x1="6" y1="6" x2="10" y2="10"/><line x1="18" y1="6" x2="14" y2="10"/><line x1="6" y1="18" x2="10" y2="14"/><line x1="18" y1="18" x2="14" y2="14"/>
    </svg>
  ),
  library: (
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  journey: (
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  kingdom: (
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
};

const CARD_BG = {
  observatory: "from-[#0d0d2b] to-[#1a1a4e]",
  forest:      "from-[#071a0f] to-[#0d2b1a]",
  city:        "from-[#050a14] to-[#0a0f1e]",
  library:     "from-[#120a00] to-[#1a0f00]",
  journey:     "from-[#080f1a] to-[#0f1a2e]",
  kingdom:     "from-[#0d0618] to-[#1a0a2e]",
};

function WorldCard({ archetype, course, sessionCount, taskCount, onEnter }) {
  const totalXP = sessionCount + taskCount;
  const level = getWorldLevel(totalXP);
  const progress = getLevelProgress(totalXP);
  const levelName = LEVEL_NAMES[level];
  const isLocked = !course;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!isLocked ? { scale: 1.02, y: -2 } : {}}
      className={`relative rounded-2xl overflow-hidden border ${
        isLocked ? "border-white/5 opacity-50" : "border-white/10 cursor-pointer"
      } bg-gradient-to-br ${CARD_BG[archetype.id]} p-5 flex flex-col gap-3`}
      onClick={!isLocked ? onEnter : undefined}
    >
      {!isLocked && (
        <div
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
          style={{ background: `radial-gradient(ellipse at top left, ${archetype.glowColor} 0%, transparent 60%)` }}
        />
      )}

      {course && (
        <div
          className="absolute top-4 right-4 text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full border"
          style={{ borderColor: archetype.accentColor + "55", color: archetype.accentColor, background: archetype.accentColor + "15" }}
        >
          {course.code}
        </div>
      )}

      <div style={{ color: archetype.accentColor }}>{ARCHETYPE_ICONS[archetype.id]}</div>

      <div>
        <h3 className="text-xl font-bold text-white leading-tight">{archetype.name}</h3>
        <p className="text-xs text-white/40 mt-1 leading-relaxed">{archetype.tagline}</p>
      </div>

      {/* XP + badges earned */}
      {!isLocked && (
        <div className="flex items-center gap-1.5">
          {totalXP >= 1  && <span className="text-base" title="First Spark">⚡</span>}
          {totalXP >= 3  && <span className="text-base" title="Pathfinder">🧭</span>}
          {totalXP >= 8  && <span className="text-base" title="Fog Walker">🌫️</span>}
          {totalXP >= 16 && <span className="text-base" title="Heart Tender">💚</span>}
          {totalXP >= 28 && <span className="text-base" title="Peak Climber">🏔️</span>}
          {totalXP >= 45 && <span className="text-base" title="World Restorer">🌟</span>}
          {taskCount >= 10 && <span className="text-base" title="Task Master">🎯</span>}
          {taskCount >= 25 && <span className="text-base" title="Focus Sage">🧘</span>}
        </div>
      )}

      <div className="mt-auto pt-2">
        <div className="flex items-end justify-between mb-1.5">
          <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Restoration</p>
          <span className="text-2xl font-bold" style={{ color: archetype.accentColor }}>
            {Math.round(progress * 100)}%
          </span>
        </div>
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: archetype.accentColor }}
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <p className="text-[10px] text-white/25 mt-1.5">{levelName}</p>
      </div>

      <button
        className="w-full mt-1 py-2 rounded-xl text-xs font-bold transition-all"
        style={{
          background: isLocked ? "rgba(255,255,255,0.05)" : (progress > 0 ? archetype.accentColor : "transparent"),
          color: isLocked ? "rgba(255,255,255,0.3)" : (progress > 0 ? "#000" : archetype.accentColor),
          border: progress > 0 ? "none" : `1px solid ${archetype.accentColor}55`,
        }}
      >
        {isLocked ? "Unlock Domain" : progress > 0 ? "Resume Restoration" : "Enter Domain"}
      </button>
    </motion.div>
  );
}

export default function WorldHub({ courses, allSessions, allTaskCounts, onEnterWorld }) {
  const [view, setView] = useState("grid"); // "grid" | "map"
  const [selectedMapWorld, setSelectedMapWorld] = useState(null);

  const archetypeList = Object.values(ARCHETYPES);
  const courseArchetypeMap = courses.map(c => ({
    course: c,
    archetype: getArchetypeForCourse(c.name, c.code),
  }));

  const cards = archetypeList.map(arch => {
    const match = courseArchetypeMap.find(m => m.archetype.id === arch.id);
    const course = match?.course || null;
    const sessionCount = course ? allSessions.filter(s => s.course_id === course.id).length : 0;
    const taskCount = course ? (allTaskCounts[course.id] || 0) : 0;
    return { archetype: arch, course, sessionCount, taskCount };
  });

  // For map view: pick the first active world or default
  const mapCard = selectedMapWorld
    ? cards.find(c => c.archetype.id === selectedMapWorld)
    : cards.find(c => c.course) || cards[0];

  const totalXP = mapCard ? mapCard.sessionCount + mapCard.taskCount : 0;

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(160deg, #08080f 0%, #0d0d1a 60%, #0a0810 100%)" }}
    >
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Header + view toggle */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-400/70 mb-2">Current Domain</p>
            <h1 className="text-4xl font-extrabold text-white">World Selection Hub</h1>
            <p className="text-sm text-white/40 mt-2 max-w-lg">
              Choose a realm to restore. Each world represents a unique path of knowledge and inner growth.
            </p>
          </div>

          <div className="flex gap-1 p-1 rounded-xl border border-white/10" style={{ background: "rgba(255,255,255,0.04)" }}>
            <button
              onClick={() => setView("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === "grid" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Worlds
            </button>
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === "map" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"
              }`}
            >
              <Map className="h-3.5 w-3.5" /> World Map
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === "grid" ? (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map(({ archetype, course, sessionCount, taskCount }, i) => (
                  <motion.div key={archetype.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                    <WorldCard
                      archetype={archetype}
                      course={course}
                      sessionCount={sessionCount}
                      taskCount={taskCount}
                      onEnter={() => onEnterWorld(course?.id || "")}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>

          ) : (
            <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* World selector tabs */}
              <div className="flex gap-2 flex-wrap">
                {cards.filter(c => c.course).map(({ archetype, course }) => (
                  <button
                    key={archetype.id}
                    onClick={() => setSelectedMapWorld(archetype.id)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                    style={{
                      borderColor: (selectedMapWorld === archetype.id || (!selectedMapWorld && cards.find(c=>c.course)?.archetype.id === archetype.id))
                        ? archetype.accentColor + "80"
                        : "rgba(255,255,255,0.1)",
                      background: (selectedMapWorld === archetype.id || (!selectedMapWorld && cards.find(c=>c.course)?.archetype.id === archetype.id))
                        ? archetype.accentColor + "20"
                        : "rgba(255,255,255,0.03)",
                      color: (selectedMapWorld === archetype.id || (!selectedMapWorld && cards.find(c=>c.course)?.archetype.id === archetype.id))
                        ? archetype.accentColor
                        : "rgba(255,255,255,0.35)",
                    }}
                  >
                    {archetype.emoji} {course.code}
                  </button>
                ))}
                {cards.every(c => !c.course) && (
                  <p className="text-sm text-white/30 italic">No courses linked yet. Add courses to unlock worlds.</p>
                )}
              </div>

              {mapCard && (
                <WorldMapView
                  archetype={mapCard.archetype}
                  totalXP={totalXP}
                  taskCount={mapCard.taskCount}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
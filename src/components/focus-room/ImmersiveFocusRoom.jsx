import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Square, Settings2, Coffee, ChevronRight, Globe, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FocusCoachPanel from "./FocusCoachPanel";
import WorldScene from "./world/WorldScene";
import SessionPlan from "./SessionPlan";
import { LEVEL_NAMES } from "./world/WorldEngine";

// Floating ambient wisps over the scene
function SceneWisps({ color }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div key={i}
          className="absolute rounded-full"
          style={{
            width: 4, height: 4,
            left: `${10 + i * 9}%`,
            bottom: "15%",
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }}
          animate={{ y: [0, -60, 0], opacity: [0, 0.9, 0] }}
          transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

// Compact ring timer
function RingTimer({ timeLeft, totalSecs, isBreak, isRunning, accentColor, focusMinutes, breakMinutes }) {
  const progress = ((totalSecs - timeLeft) / totalSecs) * 100;
  const circumference = 2 * Math.PI * 36;
  const dashOffset = circumference - (progress / 100) * circumference;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="relative h-20 w-20 mx-auto">
      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="5" />
        <circle cx="40" cy="40" r="36" fill="none"
          stroke={isBreak ? "#f59e0b" : accentColor}
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold font-mono leading-none text-stone-800">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
        <span className="text-[9px] text-stone-400 mt-0.5">
          {isRunning ? (isBreak ? "break" : "focus") : "ready"}
        </span>
      </div>
    </div>
  );
}

export default function ImmersiveFocusRoom({
  courses, selectedCourse, setSelectedCourse,
  archetype, worldLevel, levelProgress,
  plan, setPlan,
  isRunning, isBreak, timeLeft, totalSecs, focusMinutes, breakMinutes,
  totalFocused, completedTaskCount,
  onStart, onPause, onEnd, onTaskComplete,
  onOpenSettings, onSwitchWorld
}) {
  const [showCoach, setShowCoach] = useState(!plan);

  const handlePlanReady = (p) => {
    setPlan(p);
    if (p) setShowCoach(false);
  };

  return (
    <div className="min-h-[calc(100vh-57px)]" style={{ background: "linear-gradient(160deg, #fdf8f0 0%, #f5f0e8 50%, #eef4f0 100%)" }}>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* ── World Scene Banner ── */}
        <div className="relative rounded-2xl overflow-hidden" style={{ height: 200 }}>
          <WorldScene archetype={archetype} level={worldLevel} />
          <SceneWisps color={archetype.accentColor} />

          {/* Overlay info */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button onClick={onSwitchWorld}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-black/20"
              style={{ background: "rgba(0,0,0,0.35)", color: archetype.accentColor, backdropFilter: "blur(8px)" }}>
              <Globe className="h-3 w-3" /> Switch World
            </button>
            <button onClick={onOpenSettings}
              className="h-7 w-7 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
              style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}>
              <Settings2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* XP bar at bottom */}
          <div className="absolute bottom-0 left-0 right-0 px-4 py-2"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)" }}>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{LEVEL_NAMES[worldLevel]}</span>
              <div className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
                <motion.div className="h-full rounded-full"
                  style={{ background: archetype.accentColor }}
                  animate={{ width: `${levelProgress * 100}%` }}
                  transition={{ duration: 1 }} />
              </div>
              {worldLevel < 5 && <span className="text-[10px] text-white/40">{LEVEL_NAMES[worldLevel + 1]}</span>}
            </div>
          </div>
        </div>

        {/* ── Main Layout ── */}
        <div className="flex flex-col lg:flex-row gap-5">

          {/* LEFT — Timer + Course */}
          <div className="lg:w-64 xl:w-72 shrink-0 space-y-4">

            {/* Timer Card */}
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-5 text-center space-y-4">
              <AnimatePresence mode="wait">
                <motion.div key={isBreak ? "b" : "f"}
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full ${
                    isBreak ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {isBreak ? <Coffee className="h-2.5 w-2.5" /> : (
                    isRunning
                      ? <motion.span className="h-1.5 w-1.5 rounded-full bg-green-500" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                      : <span className="h-1.5 w-1.5 rounded-full bg-stone-400 inline-block" />
                  )}
                  {isBreak ? "Break ☕" : isRunning ? "Focusing…" : "Focus Session"}
                </motion.div>
              </AnimatePresence>

              <RingTimer
                timeLeft={timeLeft}
                totalSecs={totalSecs}
                isBreak={isBreak}
                isRunning={isRunning}
                accentColor={archetype.accentColor}
                focusMinutes={focusMinutes}
                breakMinutes={breakMinutes}
              />

              <div className="flex items-center justify-center gap-2">
                {isRunning ? (
                  <button onClick={onPause}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">
                    <Pause className="h-3.5 w-3.5" /> Pause
                  </button>
                ) : (
                  <button onClick={() => onStart()}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ background: archetype.accentColor }}>
                    <Play className="h-3.5 w-3.5" /> {timeLeft < totalSecs ? "Resume" : "Start"}
                  </button>
                )}
                {(isRunning || timeLeft < totalSecs) && (
                  <button onClick={onEnd}
                    className="h-9 w-9 rounded-xl border border-rose-200 text-rose-400 hover:bg-rose-50 flex items-center justify-center transition-colors">
                    <Square className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex justify-center gap-2 text-[11px] text-stone-400">
                <span className="bg-stone-50 px-2.5 py-1 rounded-full">🎯 {focusMinutes}m</span>
                <span className="bg-amber-50 px-2.5 py-1 rounded-full">☕ {breakMinutes}m</span>
              </div>

              {totalFocused > 0 && (
                <p className="text-xs text-stone-400">
                  Today: <span className="font-semibold text-stone-600">{totalFocused} min focused</span>
                </p>
              )}
            </div>

            {/* Course selector */}
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm px-4 py-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 block">Studying for</label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="rounded-xl border-stone-200 text-sm bg-stone-50">
                  <SelectValue placeholder="Pick a course (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCourse && (
                <p className="text-[10px] text-stone-400 mt-2 flex items-center gap-1">
                  <span>{archetype.emoji}</span> {archetype.name}
                </p>
              )}
            </div>

            {/* Focus Coach toggle */}
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
              <button
                onClick={() => setShowCoach(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center"
                    style={{ background: archetype.accentColor + "22" }}>
                    <Sparkles className="h-3.5 w-3.5" style={{ color: archetype.accentColor }} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-stone-700">Focus Coach</p>
                    <p className="text-[10px] text-stone-400">AI task planner</p>
                  </div>
                </div>
                <ChevronRight className={`h-4 w-4 text-stone-300 transition-transform ${showCoach ? "rotate-90" : ""}`} />
              </button>
              <AnimatePresence>
                {showCoach && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-stone-100"
                  >
                    <div className="p-4">
                      <FocusCoachPanel
                        selectedCourse={selectedCourse}
                        courses={courses}
                        onPlanReady={handlePlanReady}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT — Tasks */}
          <div className="flex-1 min-w-0">
            {plan ? (
              <SessionPlan
                plan={plan}
                onStartTimer={onStart}
                onTaskComplete={onTaskComplete}
                archetype={archetype}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[320px] flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed border-stone-200 bg-white/50"
              >
                <span className="text-5xl mb-4">{archetype.emoji}</span>
                <p className="text-base font-bold text-stone-500">No plan yet</p>
                <p className="text-sm text-stone-400 mt-1 max-w-xs">
                  Open the Focus Coach and tell it what you're working on — it'll break it into individual problems.
                </p>
                <button
                  onClick={() => setShowCoach(true)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: archetype.accentColor }}>
                  <Sparkles className="h-3.5 w-3.5" /> Build my plan
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
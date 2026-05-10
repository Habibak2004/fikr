import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Square, Settings2, Coffee, ChevronDown, Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FocusCoachPanel from "./FocusCoachPanel";
import SessionPlan from "./SessionPlan";
import ImmersiveWorldBackground from "./ImmersiveWorldBackground";
import { LEVEL_NAMES } from "./world/WorldEngine";

// Floating ambient particles
function AmbientParticles({ color }) {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    x: 10 + Math.random() * 80,
    delay: i * 0.4,
    duration: 4 + Math.random() * 4,
    size: 1.5 + Math.random() * 2,
  }));
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size, height: p.size,
            left: `${p.x}%`,
            bottom: "10%",
            background: color,
            boxShadow: `0 0 6px ${color}`,
          }}
          animate={{ y: [0, -120 - Math.random() * 80], opacity: [0, 0.8, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

// Quest log / active task left panel
function QuestPanel({ plan, isRunning, isBreak, timeLeft, focusMinutes, breakMinutes, onStart, onPause, onEnd, archetype, completedTaskCount }) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalSecs = (isBreak ? breakMinutes : focusMinutes) * 60;
  const progress = ((totalSecs - timeLeft) / totalSecs) * 100;

  // Find active task
  const tasks = plan?.tasks || [];
  const activeTask = tasks.find((_, i) => i === completedTaskCount) || null;
  const questName = plan?.sessionGoal || "Restoration begins…";

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col gap-3 w-64"
    >
      {/* Quest Log */}
      <div className="rounded-2xl p-4 border border-white/10" style={{ background: "rgba(10,15,20,0.75)", backdropFilter: "blur(16px)" }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{archetype.emoji}</span>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">Quest Log</p>
            <p className="text-xs font-semibold text-white/80 leading-tight mt-0.5 line-clamp-2">{questName}</p>
          </div>
        </div>
        {tasks.length > 0 && (
          <div className="space-y-1 max-h-28 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
            {tasks.map((t, i) => (
              <div key={i} className={`flex items-center gap-2 text-[10px] py-0.5 ${i < completedTaskCount ? "opacity-30 line-through" : i === completedTaskCount ? "text-white" : "text-white/40"}`}>
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${i < completedTaskCount ? "bg-green-400" : i === completedTaskCount ? "" : "bg-white/20"}`}
                  style={i === completedTaskCount ? { background: archetype.accentColor } : {}}>
                </span>
                <span className="truncate">{t.title || t.name}</span>
              </div>
            ))}
          </div>
        )}
        {tasks.length > 0 && (
          <div className="mt-2 h-0.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div className="h-full rounded-full"
              style={{ background: archetype.accentColor }}
              animate={{ width: `${(completedTaskCount / tasks.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
      </div>

      {/* Active Task */}
      <div className="rounded-2xl p-5 border border-white/10 flex flex-col gap-4"
        style={{ background: "rgba(10,15,20,0.75)", backdropFilter: "blur(16px)" }}>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: archetype.accentColor + "aa" }}>Active Task</p>
          {activeTask ? (
            <p className="text-base font-bold text-white leading-snug">{activeTask.title || activeTask.name}</p>
          ) : plan ? (
            <p className="text-sm font-bold text-green-400">All tasks complete! 🌟</p>
          ) : (
            <p className="text-sm text-white/30 italic">Waiting for plan…</p>
          )}
        </div>

        {/* Timer display */}
        <div>
          <div className={`text-4xl font-bold font-mono tracking-tight ${isBreak ? "text-amber-300" : "text-white"}`}>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {isBreak ? <Coffee className="h-3 w-3 text-amber-400" /> : null}
            <p className="text-[10px] text-white/30">
              {isRunning ? (isBreak ? "Taking a breath…" : "Focus remaining") : "Ready to begin"}
            </p>
          </div>
          {/* Progress bar */}
          <div className="h-1 rounded-full bg-white/10 mt-2 overflow-hidden">
            <motion.div className="h-full rounded-full"
              style={{ background: isBreak ? "#fbbf24" : archetype.accentColor }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-2">
          {isRunning ? (
            <button onClick={onPause}
              className="w-full py-2.5 rounded-xl text-sm font-bold border border-white/20 text-white/70 hover:bg-white/10 transition-colors">
              <Pause className="h-3.5 w-3.5 inline mr-2" />Pause
            </button>
          ) : (
            <button onClick={() => onStart()}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: archetype.accentColor, color: "#000" }}>
              <Play className="h-3.5 w-3.5 inline mr-2" />{timeLeft < (focusMinutes * 60) ? "Resume" : "Begin Focus"}
            </button>
          )}
          {(isRunning || timeLeft < (focusMinutes * 60)) && (
            <button onClick={onEnd}
              className="w-full py-2 rounded-xl text-xs font-semibold text-rose-400/70 hover:text-rose-400 transition-colors">
              End Session
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Center world message overlay
function WorldMessage({ archetype, completedTaskCount, plan, isRunning }) {
  const tasks = plan?.tasks || [];
  const progress = tasks.length > 0 ? completedTaskCount / tasks.length : 0;

  const getMessage = () => {
    if (!plan) return { title: "A world awaits restoration", sub: "Ask the Focus Coach to begin your journey" };
    if (completedTaskCount === 0) return { title: archetype.tagline, sub: "Each task heals the world a little more" };
    if (progress >= 1) return { title: "The world stirs with life", sub: "You've restored this realm — incredible work" };
    if (progress > 0.6) return { title: "The world is healing", sub: "The light grows stronger with each step" };
    return { title: `${completedTaskCount} moment${completedTaskCount > 1 ? "s" : ""} restored`, sub: isRunning ? "Stay with it — the world feels your focus" : "Keep going, you're making progress" };
  };

  const { title, sub } = getMessage();

  return (
    <motion.div
      key={title}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col items-center gap-2 text-center pointer-events-none"
    >
      {/* Restoration icon */}
      <motion.div
        className="h-14 w-14 rounded-full flex items-center justify-center mb-1"
        style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${archetype.accentColor}44`, backdropFilter: "blur(8px)" }}
        animate={{ boxShadow: isRunning ? [`0 0 0px ${archetype.accentColor}00`, `0 0 24px ${archetype.accentColor}66`, `0 0 0px ${archetype.accentColor}00`] : "none" }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <span className="text-2xl">{archetype.emoji}</span>
      </motion.div>
      <h2 className="text-xl font-bold text-white/90 drop-shadow-lg">{title}</h2>
      <p className="text-sm text-white/50 drop-shadow max-w-xs">{sub}</p>
    </motion.div>
  );
}

export default function ImmersiveFocusRoom({
  courses, selectedCourse, setSelectedCourse, archetype, worldLevel, levelProgress,
  plan, setPlan, isRunning, isBreak, timeLeft, totalSecs, focusMinutes, breakMinutes,
  totalFocused, completedTaskCount, onStart, onPause, onEnd, onTaskComplete,
  onOpenSettings, onSwitchWorld
}) {
  const [showCoach, setShowCoach] = useState(false);
  const selectedCourseObj = courses.find(c => c.id === selectedCourse);

  return (
    <div className="relative min-h-[calc(100vh-57px)] overflow-hidden flex flex-col">

      {/* ── Full-screen world background ── */}
      <div className="absolute inset-0">
        <ImmersiveWorldBackground archetype={archetype} level={worldLevel} isRunning={isRunning} />
      </div>

      {/* ── Ambient particles ── */}
      <AmbientParticles color={archetype.accentColor} />

      {/* ── Dark vignette edges ── */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)" }} />

      {/* ── Top bar ── */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-2">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
            style={{ background: "rgba(0,0,0,0.5)", color: archetype.accentColor, border: `1px solid ${archetype.accentColor}44`, backdropFilter: "blur(8px)" }}>
            {archetype.emoji} {archetype.name}
          </div>
          {isRunning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-green-300"
              style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(74,222,128,0.3)", backdropFilter: "blur(8px)" }}
            >
              <motion.span className="h-1.5 w-1.5 rounded-full bg-green-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }} />
              Focus Mode Active
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onSwitchWorld}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}>
            <Globe className="h-3.5 w-3.5" />
          </button>
          <button onClick={onOpenSettings}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}>
            <Settings2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Main content layer ── */}
      <div className="relative z-10 flex-1 flex items-center px-6 pb-6 gap-6">

        {/* LEFT — Quest panel */}
        <div className="self-stretch flex flex-col justify-center">
          <QuestPanel
            plan={plan}
            isRunning={isRunning}
            isBreak={isBreak}
            timeLeft={timeLeft}
            focusMinutes={focusMinutes}
            breakMinutes={breakMinutes}
            onStart={onStart}
            onPause={onPause}
            onEnd={onEnd}
            archetype={archetype}
            completedTaskCount={completedTaskCount}
          />
        </div>

        {/* CENTER — World message */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 min-h-[60vh]">
          <AnimatePresence mode="wait">
            <WorldMessage
              key={completedTaskCount}
              archetype={archetype}
              completedTaskCount={completedTaskCount}
              plan={plan}
              isRunning={isRunning}
            />
          </AnimatePresence>

          {/* Course selector (if no course selected) */}
          {!selectedCourse && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="w-64 rounded-2xl p-4 border border-white/10"
              style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(16px)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Choose your realm</p>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="rounded-xl text-sm bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}
        </div>

        {/* RIGHT — Coach + session plan toggle */}
        <div className="self-stretch flex flex-col justify-end gap-3 w-64">

          {/* Compact session plan (tasks done/total) */}
          {plan && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl p-4 border border-white/10"
              style={{ background: "rgba(10,15,20,0.75)", backdropFilter: "blur(16px)" }}
            >
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-2">Session Plan</p>
              <SessionPlan
                plan={plan}
                onStartTimer={onStart}
                onTaskComplete={onTaskComplete}
                archetype={archetype}
                compact
              />
            </motion.div>
          )}

          {/* Coach panel */}
          <div className="rounded-2xl overflow-hidden border border-white/10"
            style={{ background: "rgba(10,15,20,0.75)", backdropFilter: "blur(16px)" }}>
            <button
              onClick={() => setShowCoach(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">✨</span>
                <span className="text-xs font-bold text-white/70">Focus Coach</span>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-white/40 transition-transform ${showCoach ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showCoach && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4">
                    <FocusCoachPanel
                      selectedCourse={selectedCourse}
                      courses={courses}
                      onPlanReady={(p) => { setPlan(p); if (p) setShowCoach(false); }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Course selector when already selected */}
          {selectedCourse && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl px-4 py-3 border border-white/10"
              style={{ background: "rgba(10,15,20,0.6)", backdropFilter: "blur(16px)" }}
            >
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Studying</p>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="rounded-xl text-xs bg-white/5 border-white/10 text-white h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Level progress bar (bottom) ── */}
      <div className="relative z-10 px-6 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-white/30 font-semibold uppercase tracking-widest whitespace-nowrap">
            {LEVEL_NAMES[worldLevel]}
          </span>
          <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: archetype.accentColor }}
              animate={{ width: `${levelProgress * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <span className="text-[10px] text-white/20 whitespace-nowrap">
            {totalFocused > 0 && `${totalFocused} min`}
          </span>
        </div>
      </div>
    </div>
  );
}
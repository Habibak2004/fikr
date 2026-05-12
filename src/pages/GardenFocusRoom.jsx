import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, Leaf } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import GardenSetup from "@/components/focus-room/garden/GardenSetup";
import PlantStage from "@/components/focus-room/garden/PlantStage";
import PlantInteraction from "@/components/focus-room/garden/PlantInteraction";
// Tappable seed → plants itself animation
function SeedTapPlant({ onPlanted }) {
  const [phase, setPhase] = useState("idle"); // idle | planting | sprouted

  const handleTap = () => {
    if (phase !== "idle") return;
    setPhase("planting");
    setTimeout(() => {
      setPhase("sprouted");
      setTimeout(onPlanted, 1000);
    }, 900);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-28 w-28 flex items-center justify-center">
        {phase === "idle" && (
          <motion.button
            onClick={handleTap}
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.88 }}
            className="h-24 w-24 rounded-full flex items-center justify-center text-6xl cursor-pointer select-none shadow-md"
            style={{ background: "rgba(90,154,111,0.12)", border: "2px solid rgba(90,154,111,0.3)" }}>
            🌰
          </motion.button>
        )}
        {phase === "planting" && (
          <div className="relative h-24 w-24 flex items-center justify-center">
            <motion.span className="text-6xl absolute"
              animate={{ y: [0, 32], opacity: [1, 0], scale: [1, 0.55] }}
              transition={{ duration: 0.65, ease: "easeIn" }}>🌰</motion.span>
            {/* Dirt splash */}
            {[-20, 0, 20].map((x, i) => (
              <motion.span key={i} className="text-xl absolute"
                style={{ bottom: 0 }}
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], y: [-8, -20], x: [0, x] }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.07 }}>
                🪨
              </motion.span>
            ))}
          </div>
        )}
        {phase === "sprouted" && (
          <motion.div
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "backOut" }}
            className="text-7xl">
            🌱
          </motion.div>
        )}
      </div>
      <motion.p className="text-sm font-medium text-stone-500" animate={{ opacity: 1 }}>
        {phase === "idle" && "Tap to plant 🌰"}
        {phase === "planting" && "Planting…"}
        {phase === "sprouted" && "Sprouted! ✨"}
      </motion.p>
    </div>
  );
}
import TaskTimer from "@/components/focus-room/garden/TaskTimer";
import CompanionMessage from "@/components/focus-room/garden/CompanionMessage";
import StuckModal from "@/components/focus-room/garden/StuckModal";
import SmallerStepModal from "@/components/focus-room/garden/SmallerStepModal";
import BreathingModal from "@/components/focus-room/garden/BreathingModal";
import AmbientPlayer from "@/components/focus-room/garden/AmbientPlayer";
import PhoneParkSetup from "@/components/focus-room/garden/PhoneParkSetup";
import PhoneParkedScreen from "@/components/focus-room/garden/PhoneParkedScreen";
import PhoneReturnScreen from "@/components/focus-room/garden/PhoneReturnScreen";

export default function GardenFocusRoom() {
  const [plan, setPlan] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [skippedIds, setSkippedIds] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);
  const [showStuck, setShowStuck] = useState(false);
  const [showSmaller, setShowSmaller] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [companionCtx, setCompanionCtx] = useState("start");
  const [timeUpMessage, setTimeUpMessage] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);

  // "celebrate" = seed planted screen, null = phone park setup, "parked" | "moved" | "skipped"
  const [phoneState, setPhoneState] = useState(null);
  const [showSeedPlanted, setShowSeedPlanted] = useState(false);
  const [phoneParkedBonus, setPhoneParkedBonus] = useState(false); // earned water drop
  const [sessionStartTime, setSessionStartTime] = useState(null); // actual wall-clock start

  const allTasks = plan?.tasks || [];
  const activeTasks = allTasks.filter((_, i) => !skippedIds.includes(i));
  const currentTask = activeTasks[currentIdx] ?? null;
  const totalTasks = activeTasks.length;
  const isLastTask = currentIdx >= totalTasks - 1;
  const pct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Auto-start when task changes (only in skipped/standard mode)
  useEffect(() => {
    if (currentTask && phoneState === "skipped") {
      setIsRunning(true);
      setTimeUpMessage(false);
    }
  }, [currentIdx, !!currentTask]);

  const handleComplete = () => {
    setIsRunning(false);
    setShowInteraction(true);
  };

  const handleInteractionDone = () => {
    setShowInteraction(false);
    const bonus = phoneParkedBonus ? 1 : 0;
    setPhoneParkedBonus(false);
    const newCount = completedCount + 1 + bonus;
    setCompletedCount(newCount);
    setCompanionCtx("progress");
    if (isLastTask) {
      // Save to garden
      const bloomStage = Math.min(newCount, 7);
      const sessionDate = new Date().toISOString().split("T")[0];
      const totalDuration = sessionStartTime
        ? Math.round((Date.now() - sessionStartTime) / 60000)
        : allTasks.reduce((sum, t) => sum + (t.duration || 7), 0);
      base44.entities.GardenSession.create({
        course_name: plan.courseName || null,
        course_code: plan.courseCode || null,
        assignment_name: plan.assignmentName || null,
        tasks_completed: newCount,
        bloom_stage: bloomStage,
        date: sessionDate,
        duration_minutes: totalDuration,
      });
      // Also log to StudySession so it appears in Insights session history
      base44.entities.StudySession.create({
        date: sessionDate,
        course_id: plan.courseId || null,
        course_name: plan.courseName || null,
        duration_minutes: totalDuration,
        session_type: "deep_work",
        notes: [
          plan.assignmentName ? `Assignment: ${plan.assignmentName}` : null,
          `${newCount} focus block${newCount !== 1 ? "s" : ""} completed`,
          `Bloom stage: ${bloomStage}/7`,
        ].filter(Boolean).join(" · "),
        tasks_completed: newCount,
      });
      setSessionDone(true);
    } else {
      setCurrentIdx(i => i + 1);
      // Show phone park again between tasks
      setPhoneState("between_tasks");
    }
  };

  const handleSkip = () => {
    setShowStuck(false);
    const taskIdx = allTasks.indexOf(currentTask);
    setSkippedIds(prev => [...prev, taskIdx]);
    setCompanionCtx("progress");
    if (isLastTask) setSessionDone(true);
    else setCurrentIdx(i => i + 1);
  };

  const handleSmallerTask = (subtask) => {
    setShowSmaller(false);
    setShowStuck(false);
    setPlan(prev => {
      const tasks = [...prev.tasks];
      const insertAt = allTasks.indexOf(currentTask) + 1;
      tasks.splice(insertAt, 0, subtask);
      return { ...prev, tasks };
    });
    setCompanionCtx("smaller");
  };

  const handleTimeUp = () => {
    setIsRunning(false);
    setTimeUpMessage(true);
    setCompanionCtx("timer_low");
  };

  // Phone parking handlers
  const handlePhoneParked = () => {
    setPhoneState("parked");
    setIsRunning(true);
    setTimeUpMessage(false);
    if (!sessionStartTime) setSessionStartTime(Date.now());
  };

  // First-time park done → show seed planting
  useEffect(() => {
    if (phoneState === "parked_pending_seed") {
      setShowSeedPlanted(true);
    }
  }, [phoneState]);

  const handlePhoneMoved = () => {
    setIsRunning(false);
    setPhoneState("moved");
  };

  const handleReturnFromPhone = () => {
    setPhoneParkedBonus(true); // award a water drop for returning
    setPhoneState("parked");
    setIsRunning(true);
  };

  const handlePhoneBreak = () => {
    setPhoneState(null);
    setIsRunning(false);
    setShowBreathing(true);
  };

  const handleEmergencyUnlock = () => {
    setPhoneState(null);
    setIsRunning(false);
  };

  // ── No active session: go straight to setup ──────────────────────────────────
  if (!plan) {
    return <GardenSetup onPlanReady={(p) => { setPlan(p); }} />;
  }

  // ── Phone Park Setup (first time: before seed planting; between tasks: phoneState reset to null) ─
  // Only show phone park on first time if seed hasn't been planted yet
  if (phoneState === null && !showSeedPlanted && plan && !sessionDone) {
    return (
      <PhoneParkSetup
        task={currentTask}
        onParked={() => { setPhoneState("parked_pending_seed"); }}
        onSkip={() => { setPhoneState("skipped"); setShowSeedPlanted(true); }}
      />
    );
  }

  // ── Plant the Seed (tappable, after first phone park) ────────────────────────
  if (showSeedPlanted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5"
        style={{ background: "linear-gradient(160deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdf4 100%)" }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 max-w-sm w-full text-center">

          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">Your garden awaits</p>
            <h1 className="text-2xl font-bold text-stone-800">Plant your seed to begin</h1>
            <p className="text-sm text-stone-400 leading-relaxed">Tap the seed — it'll grow as you complete each focus block.</p>
          </div>

          <SeedTapPlant onPlanted={() => { setShowSeedPlanted(false); setPhoneState("parked"); setIsRunning(true); setSessionStartTime(Date.now()); }} />

          <p className="text-[11px] text-stone-300">{plan.tasks?.length} focus blocks ready 🌿</p>
        </motion.div>
      </div>
    );
  }

  // ── Between-task Phone Park ───────────────────────────────────────────────────
  if (phoneState === "between_tasks" && plan && !sessionDone) {
    return (
      <PhoneParkSetup
        task={currentTask}
        onParked={() => handlePhoneParked()}
        onSkip={() => setPhoneState("skipped")}
      />
    );
  }

  // ── Phone Parked Screen ───────────────────────────────────────────────────────
  if (phoneState === "parked" && !showInteraction && !sessionDone) {
    return (
      <PhoneParkedScreen
        task={currentTask}
        isRunning={isRunning}
        onTimeUp={handleTimeUp}
        onComplete={handleComplete}
        onMoved={handlePhoneMoved}
        onTogglePause={() => setIsRunning(r => !r)}
      />
    );
  }

  // ── Phone Moved / Return Screen ───────────────────────────────────────────────
  if (phoneState === "moved") {
    return (
      <PhoneReturnScreen
        task={currentTask}
        onBack={handleReturnFromPhone}
        onMakeEasier={() => { setPhoneState("skipped"); setShowSmaller(true); }}
        onBreak={handlePhoneBreak}
        onEmergency={handleEmergencyUnlock}
      />
    );
  }

  // ── Session complete ─────────────────────────────────────────────────────────
  if (sessionDone) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: "linear-gradient(160deg, #fafdf7 0%, #f0fdf4 60%, #fdf9f5 100%)" }}>
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-5 max-w-sm w-full text-center">
          <PlantStage completedCount={completedCount} />
          <div>
            <h2 className="text-2xl font-bold text-stone-700">Session complete 🌸</h2>
            <p className="text-stone-400 text-sm mt-2 leading-relaxed">
              You finished {completedCount} question{completedCount !== 1 ? "s" : ""}.
              {plan.assignmentName ? ` Great work on ${plan.assignmentName}.` : " That took real effort."} Be proud.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={() => { setPlan(null); setCurrentIdx(0); setCompletedCount(0); setSkippedIds([]); setSessionDone(false); setPhoneState(null); setPhoneParkedBonus(false); setSessionStartTime(null); }}
              className="w-full py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #5a9a6f, #4a7c59)" }}>
              🌱 New session
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main Focus Room ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen"
      style={{ background: "linear-gradient(160deg, #fafdf7 0%, #f0fdf4 50%, #fdf9f5 100%)" }}>
      <div className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-4">

        {/* ── Ambient Player + SOS ── */}
        <div className="flex justify-between items-center">
          <AmbientPlayer />
          <button
            onClick={() => { setIsRunning(false); setShowBreathing(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:opacity-90 active:scale-95"
            style={{ background: "#fff1f2", color: "#e11d48", border: "1.5px solid #fecdd3" }}>
            🆘 SOS
          </button>
        </div>

        {/* ── Top bar ── */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {(plan.courseName || plan.courseCode) && (
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider truncate">
                {plan.courseCode && <span className="text-green-600 mr-1">{plan.courseCode}</span>}
                {plan.courseName}
              </p>
            )}
            {plan.assignmentName && (
              <p className="text-sm font-semibold text-stone-700 mt-0.5 leading-snug">{plan.assignmentName}</p>
            )}
            {plan.sessionGoal && !plan.assignmentName && (
              <p className="text-sm text-stone-500 mt-0.5 leading-snug">{plan.sessionGoal}</p>
            )}
          </div>
          <Link to="/focus"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ml-3 shrink-0 transition-colors hover:bg-green-50"
            style={{ color: "#5a9a6f", border: "1.5px solid #d1fae5" }}>
            <Leaf className="h-3 w-3" /> Timer
          </Link>
        </div>

        {/* ── Progress bar ── */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-stone-400 font-medium">
            <span>{completedCount} of {totalTasks} done</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
            <motion.div className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #5a9a6f, #8bc49a)" }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6 }} />
          </div>
        </div>

        {/* ── Main content ── */}
        <AnimatePresence mode="wait">

          {/* PLANT INTERACTION after completing a task — fullscreen moment */}
          {showInteraction && (
            <motion.div key="interaction"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-10">
              <PlantInteraction completedCount={completedCount} onDone={handleInteractionDone} />
            </motion.div>
          )}

          {/* TASK CARD */}
          {!showInteraction && currentTask && (
            <motion.div key={`task-${currentIdx}`}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-4">

              {/* Task card */}
              <div className="rounded-3xl p-6 space-y-5"
                style={{ background: "white", border: "1.5px solid #d1fae5", boxShadow: "0 4px 24px rgba(90,154,111,0.07)" }}>

                {/* Task label */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    Question {currentIdx + 1} of {totalTasks}
                  </p>
                  <h2 className="text-2xl font-bold text-stone-800 mt-1.5 leading-snug">
                    {currentTask.title}
                  </h2>
                  {currentTask.subtitle && (
                    <p className="text-base text-stone-500 mt-1">{currentTask.subtitle}</p>
                  )}
                </div>

                {/* Timer */}
                <div className="flex justify-center">
                  <TaskTimer
                    durationMinutes={currentTask.duration || 7}
                    isRunning={isRunning}
                    onTimeUp={handleTimeUp}
                  />
                </div>

                {/* Time up message */}
                <AnimatePresence>
                  {timeUpMessage && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className="text-center py-2.5 px-4 rounded-2xl text-sm text-amber-700"
                      style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                      Time's up — it's okay. Want to try a smaller piece? 🌤️
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action buttons */}
                <div className="space-y-2.5">
                  <button onClick={handleComplete}
                    className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg, #5a9a6f, #4a7c59)" }}>
                    ✓ Complete Question
                  </button>

                  <div className="flex gap-2">
                    <button onClick={() => setShowStuck(true)}
                      className="flex-1 py-3 rounded-2xl text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-50 active:scale-[0.98]"
                      style={{ border: "1.5px solid #e5e7eb" }}>
                      I'm Stuck
                    </button>
                    <button onClick={() => setShowSmaller(true)}
                      className="flex-1 py-3 rounded-2xl text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-50 active:scale-[0.98]"
                      style={{ border: "1.5px solid #e5e7eb" }}>
                      Smaller Step
                    </button>
                    <button onClick={() => setIsRunning(r => !r)}
                      className="h-12 w-12 rounded-2xl flex items-center justify-center text-stone-500 transition-colors hover:bg-stone-50"
                      style={{ border: "1.5px solid #e5e7eb" }}>
                      {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Plant + companion row */}
              <div className="flex items-end gap-4 px-1">
                <PlantStage completedCount={completedCount} />
                <div className="flex-1 pb-2">
                  <CompanionMessage context={companionCtx} />
                </div>
              </div>

              {/* Up next (low-distraction) */}
              {activeTasks.length > currentIdx + 1 && (
                <div className="px-1 pb-1">
                  <p className="text-[10px] text-stone-300 uppercase tracking-widest mb-1.5 font-semibold">Up next</p>
                  <div className="space-y-1">
                    {activeTasks.slice(currentIdx + 1, currentIdx + 3).map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-stone-300 py-0.5">
                        <span className="h-1 w-1 rounded-full bg-stone-200 shrink-0" />
                        <span className="truncate">{t.title}{t.subtitle ? ` — ${t.subtitle}` : ""}</span>
                      </div>
                    ))}
                    {activeTasks.length > currentIdx + 3 && (
                      <p className="text-[10px] text-stone-200 pl-3">+{activeTasks.length - currentIdx - 3} more</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showStuck && (
          <StuckModal task={currentTask}
            onSmallerStep={() => { setShowStuck(false); setShowSmaller(true); }}
            onSkip={handleSkip}
            onClose={() => setShowStuck(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSmaller && (
          <SmallerStepModal task={currentTask}
            onSubtask={handleSmallerTask}
            onClose={() => setShowSmaller(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showBreathing && (
          <BreathingModal onClose={() => setShowBreathing(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
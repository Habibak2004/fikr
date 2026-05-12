import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, Leaf } from "lucide-react";
import { Link } from "react-router-dom";
import GardenSetup from "@/components/focus-room/garden/GardenSetup";
import PlantStage from "@/components/focus-room/garden/PlantStage";
import SeedPlantAnimation from "@/components/focus-room/garden/SeedPlantAnimation";
import PlantInteraction from "@/components/focus-room/garden/PlantInteraction";
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
    // If phone was parked, award bonus and reset for next task
    const bonus = phoneParkedBonus ? 1 : 0;
    setPhoneParkedBonus(false);
    setCompletedCount(c => c + 1 + bonus);
    setCompanionCtx("progress");
    // Reset phone state so next task also prompts phone park
    if (phoneState === "parked") setPhoneState(null);
    if (isLastTask) setSessionDone(true);
    else setCurrentIdx(i => i + 1);
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
  };

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

  // ── Setup ────────────────────────────────────────────────────────────────────
  if (!plan) return <GardenSetup onPlanReady={(p) => { setPlan(p); setShowSeedPlanted(true); }} />;

  // ── Seed Planted Celebration ──────────────────────────────────────────────────
  if (showSeedPlanted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: "linear-gradient(160deg, #0a0f1a 0%, #0d1f2d 50%, #0f1a2e 100%)" }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4 max-w-sm w-full text-center">
          <SeedPlantAnimation onComplete={() => setShowSeedPlanted(false)} />
          <div className="space-y-1.5">
            <p className="text-2xl font-bold text-white">Your seed is planted 🌱</p>
            <p className="text-slate-400 text-sm leading-relaxed">
              {plan.tasks?.length} questions lined up. Each one helps your lotus bloom.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Phone Park Setup (shown after plan is ready, before session starts) ──────
  if (phoneState === null && plan && !sessionDone) {
    return (
      <PhoneParkSetup
        task={currentTask}
        onParked={(method) => handlePhoneParked()}
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
          <div className="flex gap-3">
            <button
              onClick={() => { setPlan(null); setCurrentIdx(0); setCompletedCount(0); setSkippedIds([]); setSessionDone(false); setPhoneState(null); setPhoneParkedBonus(false); }}
              className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white"
              style={{ background: "#5a9a6f" }}>
              New session
            </button>
            <Link to="/focus"
              className="px-5 py-2.5 rounded-2xl text-sm font-medium text-stone-500 border border-stone-200 hover:bg-stone-50 transition-colors">
              Timer mode
            </Link>
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

          {/* PLANT INTERACTION after completing a task */}
          {showInteraction && (
            <motion.div key="interaction"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
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
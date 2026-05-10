import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import GardenSetup from "@/components/focus-room/garden/GardenSetup";
import PlantGrowth from "@/components/focus-room/garden/PlantGrowth";
import GardenInteraction from "@/components/focus-room/garden/GardenInteraction";
import TaskTimer from "@/components/focus-room/garden/TaskTimer";
import CompanionMessage from "@/components/focus-room/garden/CompanionMessage";
import StuckModal from "@/components/focus-room/garden/StuckModal";
import SmallerStepModal from "@/components/focus-room/garden/SmallerStepModal";

// Map completed count to plant stage (0–7)
function toPlantStage(completed) {
  if (completed === 0) return 0;
  if (completed === 1) return 1;
  if (completed === 2) return 2;
  if (completed === 3) return 3;
  if (completed === 4) return 4;
  if (completed === 5) return 5;
  if (completed === 6) return 6;
  return 7;
}

export default function GardenFocusRoom() {
  const [plan, setPlan] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [skippedIds, setSkippedIds] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);
  const [showStuck, setShowStuck] = useState(false);
  const [showSmaller, setShowSmaller] = useState(false);
  const [companionCtx, setCompanionCtx] = useState("start");
  const [timeUpMessage, setTimeUpMessage] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list("-created_date", 50),
  });

  // Build active task list (skip skipped ones)
  const allTasks = plan?.tasks || [];
  const activeTasks = allTasks.filter((_, i) => !skippedIds.includes(i));
  const currentTask = activeTasks[currentIdx] ?? null;
  const totalTasks = activeTasks.length;
  const isLastTask = currentIdx >= totalTasks - 1;

  // Auto-start timer when task changes
  useEffect(() => {
    if (currentTask) {
      setIsRunning(true);
      setTimeUpMessage(false);
    }
  }, [currentIdx]);

  const handleComplete = () => {
    setIsRunning(false);
    setShowInteraction(true);
  };

  const handleInteractionDone = () => {
    setShowInteraction(false);
    setCompletedCount(c => c + 1);
    setCompanionCtx("progress");
    if (isLastTask) {
      setSessionDone(true);
    } else {
      setCurrentIdx(i => i + 1);
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
    // Insert subtask at current position
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

  const plantStage = toPlantStage(completedCount);

  // ── Setup screen ────────────────────────────────────────────────────────────
  if (!plan) {
    return <GardenSetup courses={courses} onPlanReady={setPlan} />;
  }

  // ── Session complete ────────────────────────────────────────────────────────
  if (sessionDone) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 gap-8"
        style={{ background: "linear-gradient(160deg, #f9fdf6 0%, #f0fdf4 60%, #fdf9f0 100%)" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 max-w-sm"
        >
          <PlantGrowth stage={7} />
          <h2 className="text-2xl font-bold text-stone-700">Session complete! 🌸</h2>
          <p className="text-stone-500 text-sm leading-relaxed">
            You completed {completedCount} task{completedCount !== 1 ? "s" : ""}. Your plant has grown with you.
          </p>
          <p className="text-stone-400 text-sm">That took real effort. Be proud.</p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => { setPlan(null); setCurrentIdx(0); setCompletedCount(0); setSkippedIds([]); setSessionDone(false); }}
              className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white"
              style={{ background: "#5a9a6f" }}
            >
              Start new session
            </button>
            <Link to="/focus" className="px-5 py-2.5 rounded-2xl text-sm font-medium text-stone-500 border border-stone-200 hover:bg-stone-50 transition-colors">
              Back to Focus Room
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main Focus Room ─────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(160deg, #f9fdf6 0%, #f0fdf4 50%, #fdf9f0 100%)" }}
    >
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link to="/focus" className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Focus Room
          </Link>
          <div className="text-center">
            <p className="text-xs font-bold text-stone-600">{plan.courseName || "Study Session"}</p>
            <p className="text-[10px] text-stone-400">{plan.sessionGoal}</p>
          </div>
          <div className="text-xs text-stone-400 text-right">
            {completedCount} / {totalTasks} done
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #5a9a6f, #8bc49a)" }}
            animate={{ width: `${totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>

        <AnimatePresence mode="wait">
          {showInteraction ? (
            /* ── Garden interaction ── */
            <motion.div key="interaction"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GardenInteraction
                taskIndex={completedCount}
                onComplete={handleInteractionDone}
              />
            </motion.div>
          ) : (
            <motion.div key="task"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              {/* Task card */}
              {currentTask && (
                <div
                  className="rounded-3xl p-6 space-y-4"
                  style={{ background: "white", border: "1.5px solid #d1fae5", boxShadow: "0 2px 20px rgba(90,154,111,0.08)" }}
                >
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                      Question {currentIdx + 1} of {totalTasks}
                    </p>
                    <h2 className="text-xl font-bold text-stone-800 mt-1 leading-snug">
                      {currentTask.title}
                    </h2>
                    {currentTask.subtitle && (
                      <p className="text-sm text-stone-500 mt-1">{currentTask.subtitle}</p>
                    )}
                  </div>

                  {/* Timer */}
                  <div className="flex justify-center py-2">
                    <TaskTimer
                      durationMinutes={currentTask.duration || 7}
                      isRunning={isRunning}
                      onTimeUp={handleTimeUp}
                    />
                  </div>

                  {/* Time up gentle message */}
                  <AnimatePresence>
                    {timeUpMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-2 px-4 rounded-2xl text-sm text-amber-700"
                        style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
                      >
                        Time's up — want to try a smaller version? That's totally okay. 🌤️
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action buttons */}
                  <div className="space-y-2.5">
                    <button
                      onClick={handleComplete}
                      className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                      style={{ background: "linear-gradient(135deg, #5a9a6f, #4a7c59)" }}
                    >
                      ✓ Complete Question
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowStuck(true)}
                        className="flex-1 py-2.5 rounded-2xl text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-100"
                        style={{ border: "1.5px solid #e5e7eb" }}
                      >
                        I'm Stuck
                      </button>
                      <button
                        onClick={() => setShowSmaller(true)}
                        className="flex-1 py-2.5 rounded-2xl text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-100"
                        style={{ border: "1.5px solid #e5e7eb" }}
                      >
                        Smaller Step
                      </button>
                      <button
                        onClick={() => setIsRunning(r => !r)}
                        className="h-10 w-10 rounded-2xl flex items-center justify-center text-stone-500 transition-colors hover:bg-stone-100"
                        style={{ border: "1.5px solid #e5e7eb" }}
                      >
                        {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom row: plant + companion */}
              <div className="flex items-end gap-5 px-2">
                <PlantGrowth stage={plantStage} />
                <div className="flex-1 pb-1">
                  <CompanionMessage context={companionCtx} />
                </div>
              </div>

              {/* Upcoming tasks (subtle, low-distraction) */}
              {activeTasks.length > currentIdx + 1 && (
                <div className="px-1">
                  <p className="text-[10px] text-stone-300 uppercase tracking-widest mb-1.5 font-bold">Up next</p>
                  <div className="space-y-1">
                    {activeTasks.slice(currentIdx + 1, currentIdx + 3).map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-stone-300 py-1">
                        <span className="h-1 w-1 rounded-full bg-stone-200" />
                        <span>{t.title}{t.subtitle ? ` — ${t.subtitle}` : ""}</span>
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
          <StuckModal
            task={currentTask}
            onSmallerStep={() => { setShowStuck(false); setShowSmaller(true); }}
            onSkip={handleSkip}
            onClose={() => setShowStuck(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSmaller && (
          <SmallerStepModal
            task={currentTask}
            onSubtask={handleSmallerTask}
            onClose={() => setShowSmaller(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
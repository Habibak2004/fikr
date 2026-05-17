import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { CheckCircle, HelpCircle, Minimize2, SkipForward, Timer } from "lucide-react";
import CompanionAvatar from "./CompanionAvatar";

function buildTaskList(analysisData, energyLevel) {
  const { phases = {} } = analysisData;
  const p1 = phases.phase1 || [];
  const p2 = phases.phase2 || [];
  const p3 = phases.phase3 || [];

  if (energyLevel === "barely") return p1.slice(0, 4);
  if (energyLevel === "low") return [...p1, ...p2.slice(0, 2)];
  if (energyLevel === "moderate") return [...p1, ...p2];
  return [...p1, ...p2, ...p3];
}

const STUCK_MESSAGES = [
  "That's okay. Let's make this even smaller.",
  "No pressure at all — we can pause here.",
  "Even picking up one item counts.",
  "Take a breath first. Then one thing.",
];

const SMALLER_PROMPTS = {
  barely: "Just pick up 3 items from where you're standing.",
  low: "Move one thing to where it belongs.",
  moderate: "Clear just the item directly in front of you.",
  locked: "Start with the most visible item first.",
};

export default function ActiveReset({ analysisData, energyLevel, onComplete }) {
  const [tasks, setTasks] = useState(() => buildTaskList(analysisData, energyLevel));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [companionMood, setCompanionMood] = useState("idle");
  const [companionMsg, setCompanionMsg] = useState(null);
  const [twoMinMode, setTwoMinMode] = useState(false);
  const [twoMinLeft, setTwoMinLeft] = useState(120);
  const [isBreathing, setIsBreathing] = useState(false);
  const [loadingSmaller, setLoadingSmaller] = useState(false);

  const progress = tasks.length > 0 ? Math.round((currentIdx / tasks.length) * 100) : 0;
  const currentTask = tasks[currentIdx];

  // 2-minute mode countdown
  useEffect(() => {
    if (!twoMinMode) return;
    if (twoMinLeft <= 0) { setTwoMinMode(false); return; }
    const t = setTimeout(() => setTwoMinLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [twoMinMode, twoMinLeft]);

  const advance = useCallback((action) => {
    if (action === "done") {
      setCompletedCount(c => c + 1);
      setCompanionMood("celebrating");
      setCompanionMsg(null);
      setTimeout(() => setCompanionMood("idle"), 3000);
    } else if (action === "skip") {
      setSkippedCount(c => c + 1);
      setCompanionMood("idle");
    }

    if (currentIdx + 1 >= tasks.length) {
      onComplete({ completed: completedCount + (action === "done" ? 1 : 0), skipped: skippedCount + (action === "skip" ? 1 : 0), total: tasks.length });
    } else {
      setCurrentIdx(i => i + 1);
    }
  }, [currentIdx, tasks.length, completedCount, skippedCount, onComplete]);

  const handleStuck = () => {
    setCompanionMood("stuck");
    const msg = STUCK_MESSAGES[Math.floor(Math.random() * STUCK_MESSAGES.length)];
    setCompanionMsg(msg);
    setIsBreathing(true);
    setTimeout(() => setIsBreathing(false), 4000);
  };

  const handleMakeSmaller = async () => {
    if (!currentTask) return;
    setLoadingSmaller(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `An ADHD student is overwhelmed by this task: "${currentTask.task}" in zone: "${currentTask.zone}".
Break it down into ONE even smaller micro-step (under 60 seconds) that is physically tiny and requires minimal decisions.
Use emotionally safe, supportive language. Never say "messy" or "dirty".
Respond with ONLY a JSON object: { "task": "the smaller task text" }`,
      response_json_schema: { type: "object", properties: { task: { type: "string" } } },
    });
    setLoadingSmaller(false);
    if (result?.task) {
      const updatedTasks = [...tasks];
      updatedTasks[currentIdx] = { ...currentTask, task: result.task };
      setTasks(updatedTasks);
      setCompanionMsg("We made it smaller. You only need to focus on this one step.");
    }
  };

  const startTwoMin = () => {
    setTwoMinMode(true);
    setTwoMinLeft(120);
    setCompanionMsg("Two minutes. That's all. Let's move.");
    setCompanionMood("encouraging");
  };

  if (!currentTask) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f5f2]">
        <p className="text-[#9a8f82]">Preparing your reset...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f5f2] flex flex-col">
      {/* Top progress bar */}
      <div className="relative h-1 bg-[#e8e0d6] flex-shrink-0">
        <motion.div
          className="h-full bg-[#c4a882] rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
        <div className="absolute right-4 top-3 text-[10px] text-[#9a8f82] font-medium">
          {progress}% of room restored
        </div>
      </div>

      {/* Two-minute mode banner */}
      <AnimatePresence>
        {twoMinMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#3d3020] text-white text-center py-2.5 flex items-center justify-center gap-3">
              <Timer className="h-4 w-4 text-[#c4a882]" />
              <span className="text-sm font-medium">2-minute mode active</span>
              <span className="font-mono text-[#c4a882]">
                {Math.floor(twoMinLeft / 60)}:{String(twoMinLeft % 60).padStart(2, "0")}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breathing overlay */}
      <AnimatePresence>
        {isBreathing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#f7f5f2]/90 backdrop-blur-sm"
          >
            <div className="text-center">
              <motion.div
                className="h-24 w-24 rounded-full bg-[#d4c5b0]/40 mx-auto"
                animate={{ scale: [1, 2, 1] }}
                transition={{ duration: 4, ease: "easeInOut" }}
              />
              <p className="mt-6 text-[#5a4f42] text-lg font-light">Breathe in... and out.</p>
              <p className="text-[#9a8f82] text-sm mt-2">We'll restart gently in a moment.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-2xl flex flex-col md:flex-row items-center gap-10">
          {/* Companion */}
          <div className="flex-shrink-0">
            <CompanionAvatar mood={companionMood} message={companionMsg} size="md" />
          </div>

          {/* Task card */}
          <div className="flex-1 w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-[#e8e0d6]"
              >
                <p className="text-xs text-[#9a8f82] uppercase tracking-widest mb-4">Current Task</p>
                <p className="text-2xl font-medium text-[#2c2416] leading-snug mb-2">
                  {currentTask.task}
                </p>
                {currentTask.zone && (
                  <p className="text-sm text-[#9a8f82] mb-6">Zone: {currentTask.zone}</p>
                )}

                {/* Done button */}
                <button
                  onClick={() => advance("done")}
                  className="w-full h-13 rounded-2xl font-medium text-base flex items-center justify-center gap-2 transition-all duration-200 active:scale-98"
                  style={{ backgroundColor: "#4a3b2a", color: "white", padding: "14px" }}
                >
                  <CheckCircle className="h-5 w-5" />
                  Done
                </button>
              </motion.div>
            </AnimatePresence>

            {/* Secondary action buttons */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={handleStuck}
                className="flex items-center justify-center gap-2 h-11 rounded-2xl border border-[#e8e0d6] bg-white text-[#5a4f42] text-sm hover:border-[#c4a882] transition-all"
              >
                <HelpCircle className="h-4 w-4" /> I'm stuck
              </button>
              <button
                onClick={handleMakeSmaller}
                disabled={loadingSmaller}
                className="flex items-center justify-center gap-2 h-11 rounded-2xl border border-[#e8e0d6] bg-white text-[#5a4f42] text-sm hover:border-[#c4a882] transition-all disabled:opacity-60"
              >
                <Minimize2 className="h-4 w-4" />
                {loadingSmaller ? "Shrinking..." : "Make smaller"}
              </button>
              <button
                onClick={() => advance("skip")}
                className="flex items-center justify-center gap-2 h-11 rounded-2xl border border-[#e8e0d6] bg-white text-[#5a4f42] text-sm hover:border-[#c4a882] transition-all"
              >
                <SkipForward className="h-4 w-4" /> Skip
              </button>
              <button
                onClick={startTwoMin}
                className="flex items-center justify-center gap-2 h-11 rounded-2xl border border-[#f0e0cc] text-sm hover:bg-[#fdf8f3] transition-all"
                style={{ backgroundColor: twoMinMode ? "#f0e0cc" : "#fdf8f3", color: "#7a5c3a" }}
              >
                <Timer className="h-4 w-4" /> 2-minute mode
              </button>
            </div>

            {/* Task counter */}
            <p className="text-center text-xs text-[#b8afa5] mt-5">
              Step {currentIdx + 1} of {tasks.length} · {completedCount} completed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
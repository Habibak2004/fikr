import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TaskCard from "./TaskCard";
import WorldInteraction from "./world/WorldInteraction";

export default function SessionPlan({ plan, onStartTimer, onTaskComplete, archetype, compact = false }) {
  const [completedIds, setCompletedIds] = useState([]);
  const [pendingInteraction, setPendingInteraction] = useState(null); // index awaiting world interaction

  if (!plan) return null;

  const triggerComplete = (i) => {
    // Show the world interaction before marking done
    setPendingInteraction(i);
  };

  const finishInteraction = () => {
    const i = pendingInteraction;
    setPendingInteraction(null);
    setCompletedIds(prev => [...new Set([...prev, i])]);
    if (onTaskComplete) onTaskComplete();
  };

  const activeIndex = plan.tasks.findIndex((_, i) => !completedIds.includes(i) && pendingInteraction !== i);
  const pct = Math.round((completedIds.length / plan.tasks.length) * 100);

  // Compact mode for immersive overlay
  if (compact) {
    return (
      <div className="space-y-2">
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <motion.div className="h-full rounded-full"
            style={{ background: archetype?.accentColor || "#38bdf8" }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5 }} />
        </div>
        <p className="text-[10px] text-white/40">{completedIds.length} / {plan.tasks.length} tasks · {pct}%</p>
        <div className="space-y-1.5 max-h-36 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {plan.tasks.map((task, i) => (
            <div key={i}
              className={`flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-xl cursor-pointer transition-all
                ${completedIds.includes(i) ? "opacity-30 line-through" : i === activeIndex ? "text-white bg-white/10" : "text-white/40"}`}
              onClick={() => !completedIds.includes(i) && triggerComplete(i)}
            >
              <span className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ background: completedIds.includes(i) ? "#4ade80" : i === activeIndex ? (archetype?.accentColor || "#fff") : "rgba(255,255,255,0.2)" }} />
              <span className="truncate">{task.title || task.name}</span>
              {i === activeIndex && !completedIds.includes(i) && (
                <span className="ml-auto text-[9px] font-bold uppercase tracking-widest shrink-0"
                  style={{ color: archetype?.accentColor }}>Complete</span>
              )}
            </div>
          ))}
        </div>
        <AnimatePresence>
          {pendingInteraction !== null && (
            <motion.div key="wi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <WorldInteraction archetype={archetype} onComplete={finishInteraction} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Session goal banner */}
      {plan.sessionGoal && (
        <div className="bg-white/80 backdrop-blur-sm border border-stone-200/60 rounded-2xl px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Today's Goal</p>
          <p className="text-base font-bold text-stone-800">{plan.sessionGoal}</p>
        </div>
      )}

      {/* Progress bar */}
      <div className="bg-white/80 backdrop-blur-sm border border-stone-200/60 rounded-2xl px-5 py-4">
        <div className="flex justify-between text-xs font-semibold text-stone-500 mb-2">
          <span>Session Progress</span>
          <span className={pct === 100 ? "text-green-600 font-bold" : "text-primary"}>{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <p className="text-xs text-stone-400 mt-2">
          {completedIds.length} of {plan.tasks.length} tasks done
          {pct === 100 && " · Amazing work! 🎉"}
        </p>
      </div>

      {/* World Interaction overlay */}
      <AnimatePresence>
        {pendingInteraction !== null && (
          <motion.div
            key="world-interaction"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <WorldInteraction
              archetype={archetype}
              onComplete={finishInteraction}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task cards */}
      {pendingInteraction === null && (
        <div className="space-y-3">
          {plan.tasks.map((task, i) => (
            <TaskCard
              key={i}
              task={task}
              index={i}
              isActive={i === activeIndex}
              isCompleted={completedIds.includes(i)}
              onComplete={() => triggerComplete(i)}
              onStart={() => onStartTimer(task.duration)}
            />
          ))}
        </div>
      )}

      {/* All done */}
      {pct === 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center"
        >
          <p className="text-3xl mb-2">🏆</p>
          <p className="font-bold text-green-700 text-lg">Session Complete!</p>
          <p className="text-sm text-green-600 mt-1">You crushed every task. Take a well-earned break.</p>
        </motion.div>
      )}
    </motion.div>
  );
}
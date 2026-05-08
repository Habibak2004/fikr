import { useState } from "react";
import { motion } from "framer-motion";
import TaskCard from "./TaskCard";

export default function SessionPlan({ plan, onStartTimer }) {
  const [completedIds, setCompletedIds] = useState([]);

  if (!plan) return null;

  const complete = (i) => setCompletedIds(prev => [...new Set([...prev, i])]);
  const activeIndex = plan.tasks.findIndex((_, i) => !completedIds.includes(i));
  const pct = Math.round((completedIds.length / plan.tasks.length) * 100);

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

      {/* Task cards */}
      <div className="space-y-3 relative">
        {plan.tasks.map((task, i) => (
          <div key={i} className="relative">
            <TaskCard
              task={task}
              index={i}
              isActive={i === activeIndex}
              isCompleted={completedIds.includes(i)}
              onComplete={() => complete(i)}
              onStart={() => onStartTimer(task.duration)}
            />
          </div>
        ))}
      </div>

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
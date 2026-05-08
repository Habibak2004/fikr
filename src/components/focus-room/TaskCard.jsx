import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Clock, ChevronRight, Play } from "lucide-react";

const priorityConfig = {
  must:   { label: "Must Do",   color: "bg-red-100 text-red-600",     dot: "bg-red-500" },
  should: { label: "Should Do", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  could:  { label: "If Time",   color: "bg-stone-100 text-stone-500", dot: "bg-stone-400" },
};

export default function TaskCard({ task, index, isActive, isCompleted, onComplete, onStart }) {
  const [showReward, setShowReward] = useState(false);

  const pri = priorityConfig[task.priority] || priorityConfig.could;

  const handleComplete = () => {
    setShowReward(true);
    setTimeout(() => { setShowReward(false); onComplete(); }, 1400);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: isCompleted ? 0.45 : 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`relative rounded-2xl border transition-all ${
        isCompleted
          ? "bg-stone-50 border-stone-200"
          : isActive
          ? "bg-white border-primary/30 shadow-md shadow-primary/5"
          : "bg-white/80 border-stone-200/70"
      }`}
    >
      {/* Active top bar */}
      {isActive && !isCompleted && (
        <div className="h-0.5 rounded-t-2xl bg-gradient-to-r from-primary to-blue-400" />
      )}

      <div className="flex items-center gap-3 px-4 py-4">
        {/* Complete button */}
        <button onClick={handleComplete} disabled={isCompleted} className="shrink-0">
          {isCompleted
            ? <CheckCircle2 className="h-5 w-5 text-green-500" />
            : <Circle className={`h-5 w-5 ${isActive ? "text-primary" : "text-stone-300"} hover:text-primary transition-colors`} />
          }
        </button>

        {/* Title + subtitle */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold leading-snug ${isCompleted ? "line-through text-stone-400" : "text-stone-800"}`}>
            {task.title}
          </p>
          {task.subtitle && (
            <p className={`text-xs mt-0.5 ${isCompleted ? "text-stone-300" : "text-stone-400"}`}>
              {task.subtitle}
            </p>
          )}
        </div>

        {/* Right meta */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pri.color}`}>
            {pri.label}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-stone-400 font-medium">
            <Clock className="h-3 w-3" />{task.duration}m
          </span>
          {!isCompleted && (
            <button
              onClick={onStart}
              className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${
                isActive
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "bg-stone-100 text-stone-400 hover:bg-primary/10 hover:text-primary"
              }`}
            >
              <Play className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Completion flash */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-2xl z-10 pointer-events-none"
          >
            <p className="text-sm font-bold text-primary">✓ Done!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
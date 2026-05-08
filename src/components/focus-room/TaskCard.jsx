import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Zap, Clock, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";

const priorityConfig = {
  must:   { label: "Must Do",  color: "bg-red-100 text-red-600",    dot: "bg-red-500" },
  should: { label: "Should Do",color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  could:  { label: "If Time",  color: "bg-stone-100 text-stone-500", dot: "bg-stone-400" },
};

const categoryEmoji = {
  practice: "✏️", review: "📖", flashcards: "🃏", reading: "📄",
  writing: "📝", problem: "🧮", watch: "🎬", other: "🎯",
};

const energyConfig = {
  low:    { label: "Low energy",    color: "text-green-600",  bg: "bg-green-50" },
  medium: { label: "Medium energy", color: "text-amber-600",  bg: "bg-amber-50" },
  high:   { label: "High focus",    color: "text-red-500",    bg: "bg-red-50" },
};

export default function TaskCard({ task, index, isActive, isCompleted, onComplete, onStart }) {
  const [expanded, setExpanded] = useState(isActive);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [showReward, setShowReward] = useState(false);

  const pri = priorityConfig[task.priority] || priorityConfig.could;
  const energy = energyConfig[task.energyLevel] || energyConfig.medium;
  const emoji = categoryEmoji[task.category] || "🎯";
  const allStepsDone = task.steps?.length > 0 && completedSteps.length === task.steps.length;

  const toggleStep = (i) => {
    setCompletedSteps(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    );
  };

  const handleComplete = () => {
    setShowReward(true);
    setTimeout(() => { setShowReward(false); onComplete(); }, 1800);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isCompleted ? 0.5 : 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`rounded-2xl border transition-all overflow-hidden ${
        isCompleted
          ? "bg-stone-50 border-stone-200"
          : isActive
          ? "bg-white border-primary/30 shadow-md shadow-primary/5"
          : "bg-white/80 border-stone-200/70 hover:border-stone-300"
      }`}
    >
      {/* Active indicator strip */}
      {isActive && !isCompleted && (
        <div className="h-1 bg-gradient-to-r from-primary to-blue-400" />
      )}

      {/* Card header */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Completion circle */}
        <button
          onClick={e => { e.stopPropagation(); if (!isCompleted) handleComplete(); }}
          className="mt-0.5 shrink-0"
        >
          {isCompleted
            ? <CheckCircle2 className="h-5 w-5 text-green-500" />
            : <Circle className={`h-5 w-5 ${isActive ? "text-primary" : "text-stone-300"}`} />
          }
        </button>

        {/* Title area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-base">{emoji}</span>
            <p className={`text-sm font-bold leading-snug ${isCompleted ? "line-through text-stone-400" : "text-stone-800"}`}>
              {task.title}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${pri.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${pri.dot}`} />
              {pri.label}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-stone-400 font-medium">
              <Clock className="h-3 w-3" /> {task.duration} min
            </span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${energy.bg} ${energy.color}`}>
              {energy.label}
            </span>
          </div>
        </div>

        <button className="text-stone-300 shrink-0 mt-0.5">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && !isCompleted && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-stone-100 pt-3">

              {/* Start Here */}
              {task.startHere && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">▶ Start Here</p>
                  <p className="text-sm text-stone-700 font-medium leading-snug">{task.startHere}</p>
                </div>
              )}

              {/* Steps */}
              {task.steps?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Steps</p>
                  {task.steps.map((step, i) => (
                    <button
                      key={i}
                      onClick={() => toggleStep(i)}
                      className={`w-full flex items-start gap-2.5 text-left p-2.5 rounded-xl transition-all ${
                        completedSteps.includes(i)
                          ? "bg-green-50 border border-green-200"
                          : "bg-stone-50 border border-stone-100 hover:border-stone-200"
                      }`}
                    >
                      {completedSteps.includes(i)
                        ? <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        : <Circle className="h-4 w-4 text-stone-300 mt-0.5 shrink-0" />
                      }
                      <span className={`text-sm leading-snug ${
                        completedSteps.includes(i) ? "line-through text-stone-400" : "text-stone-700"
                      }`}>
                        {step}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Dopamine reward */}
              {task.dopamineReward && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200/60 rounded-xl px-3 py-2.5">
                  <Zap className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">{task.dopamineReward}</p>
                </div>
              )}

              {/* Break suggestion */}
              {task.breakSuggestion && (
                <div className="flex items-start gap-2 bg-stone-50 border border-stone-200/60 rounded-xl px-3 py-2.5">
                  <Coffee className="h-4 w-4 text-stone-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-stone-500">{task.breakSuggestion}</p>
                </div>
              )}

              {/* CTA */}
              <div className="flex gap-2">
                <Button
                  onClick={e => { e.stopPropagation(); onStart(); }}
                  size="sm"
                  className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-sm"
                >
                  Start Timer
                </Button>
                <Button
                  onClick={e => { e.stopPropagation(); handleComplete(); }}
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-green-300 text-green-600 hover:bg-green-50 text-sm"
                >
                  Done ✓
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reward animation */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-2xl z-10 pointer-events-none"
          >
            <div className="text-center">
              <div className="text-4xl mb-1">🎉</div>
              <p className="text-sm font-bold text-primary">Task complete!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
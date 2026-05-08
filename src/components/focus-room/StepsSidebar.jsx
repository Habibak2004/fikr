import { CheckCircle2, Circle, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function StepsSidebar({ steps, activeStep, onStepClick, isRunning, isBreak, focusMinutes, breakMinutes }) {
  if (steps.length === 0) {
    return (
      <div className="xl:w-72 bg-white/60 backdrop-blur-sm rounded-3xl border border-stone-200/60 shadow-sm p-6 flex flex-col items-center justify-center text-center min-h-[220px]">
        <span className="text-3xl mb-3">📋</span>
        <p className="text-sm font-semibold text-stone-600">No plan yet</p>
        <p className="text-xs text-stone-400 mt-1">Ask the Focus Coach to break your session into steps — they'll appear here.</p>
      </div>
    );
  }

  const completed = steps.filter((_, i) => i < activeStep).length;
  const pct = Math.round((completed / steps.length) * 100);

  return (
    <div className="xl:w-72 bg-white/80 backdrop-blur-sm rounded-3xl border border-stone-200/60 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-stone-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Session Plan</span>
          <span className="text-xs font-semibold text-primary">{completed}/{steps.length} done</span>
        </div>
        <div className="h-1.5 rounded-full bg-stone-100">
          <motion.div
            className="h-1.5 rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Steps list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence initial={false}>
          {steps.map((step, i) => {
            const isDone = i < activeStep;
            const isActive = i === activeStep;
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onStepClick(i)}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-2xl transition-all ${
                  isActive
                    ? "bg-primary/10 border border-primary/30"
                    : isDone
                    ? "bg-stone-50 border border-stone-100 opacity-70"
                    : "bg-transparent border border-transparent hover:bg-stone-50"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : isActive ? (
                    <Flame className="h-4 w-4 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 text-stone-300" />
                  )}
                </div>
                <div>
                  <p className={`text-sm font-semibold leading-snug ${
                    isActive ? "text-primary" : isDone ? "line-through text-stone-400" : "text-stone-700"
                  }`}>
                    {step.title}
                  </p>
                  {step.detail && (
                    <p className="text-xs text-stone-400 mt-0.5 leading-snug">{step.detail}</p>
                  )}
                  {step.duration && (
                    <span className="inline-block mt-1 text-[10px] font-bold bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                      {step.duration}
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Current status footer */}
      <div className={`px-5 py-3 border-t border-stone-100 text-xs font-semibold ${isBreak ? "text-amber-600 bg-amber-50" : "text-primary bg-primary/5"}`}>
        {isBreak ? `☕ Break — ${breakMinutes} min recharge` : isRunning ? `🎯 Working on step ${activeStep + 1}` : "Ready to begin"}
      </div>
    </div>
  );
}
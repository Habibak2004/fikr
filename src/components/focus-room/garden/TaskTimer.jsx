import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function TaskTimer({ durationMinutes = 7, isRunning, onTimeUp, onTick }) {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const [warned, setWarned] = useState(false);
  const intervalRef = useRef(null);

  // Reset when duration changes (new task)
  useEffect(() => {
    setSecondsLeft(durationMinutes * 60);
    setWarned(false);
  }, [durationMinutes]);

  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onTimeUp?.();
          return 0;
        }
        const next = prev - 1;
        if (next <= 90 && !warned) setWarned(true);
        onTick?.(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const totalSecs = durationMinutes * 60;
  const progress = (totalSecs - secondsLeft) / totalSecs;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  const circumference = 2 * Math.PI * 44;
  const isLow = secondsLeft <= 90 && secondsLeft > 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-28 w-28">
        <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
          {/* Track */}
          <circle cx="50" cy="50" r="44" fill="none" stroke="#e7f5ec" strokeWidth="6" />
          {/* Progress */}
          <motion.circle
            cx="50" cy="50" r="44"
            fill="none"
            stroke={isLow ? "#fbbf24" : "#5a9a6f"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress * circumference}
            animate={isLow ? { stroke: ["#fbbf24", "#f97316", "#fbbf24"] } : {}}
            transition={isLow ? { duration: 1.5, repeat: Infinity } : {}}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-mono text-stone-700 leading-none">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>
          <span className="text-[10px] text-stone-400 mt-0.5">
            {isRunning ? (isLow ? "almost done" : "focusing") : "paused"}
          </span>
        </div>
      </div>
    </div>
  );
}
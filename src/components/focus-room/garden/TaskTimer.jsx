import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function TaskTimer({ durationMinutes = 7, isRunning, onTimeUp }) {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const intervalRef = useRef(null);
  const warnedRef = useRef(false);

  useEffect(() => {
    setSecondsLeft(durationMinutes * 60);
    warnedRef.current = false;
  }, [durationMinutes]);

  useEffect(() => {
    if (!isRunning) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const total = durationMinutes * 60;
  const progress = (total - secondsLeft) / total;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const circumference = 2 * Math.PI * 44;
  const isLow = secondsLeft <= 90 && secondsLeft > 0;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-28 w-28">
        <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="#e7f5ec" strokeWidth="5" />
          <motion.circle cx="50" cy="50" r="44" fill="none"
            stroke={isLow ? "#f97316" : "#5a9a6f"}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: circumference - progress * circumference }}
            transition={{ duration: 0.8 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-mono text-stone-700 leading-none">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>
          <span className="text-[10px] text-stone-400 mt-1">
            {isRunning ? (isLow ? "almost done" : "focusing") : "paused"}
          </span>
        </div>
      </div>
    </div>
  );
}
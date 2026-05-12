import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function TaskTimer({ durationMinutes = 7, isRunning, onTimeUp }) {
  const totalSeconds = durationMinutes * 60;

  // deadline = the wall-clock timestamp when the timer should hit 0
  const deadlineRef = useRef(null);
  // how many seconds were left when we last paused
  const pausedSecondsRef = useRef(totalSeconds);

  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const rafRef = useRef(null);
  const firedRef = useRef(false);

  // Reset everything when task duration changes
  useEffect(() => {
    deadlineRef.current = null;
    pausedSecondsRef.current = durationMinutes * 60;
    setSecondsLeft(durationMinutes * 60);
    firedRef.current = false;
  }, [durationMinutes]);

  useEffect(() => {
    if (isRunning) {
      // Set deadline based on how many seconds were left when paused
      deadlineRef.current = Date.now() + pausedSecondsRef.current * 1000;
      firedRef.current = false;

      const tick = () => {
        const remaining = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
        setSecondsLeft(remaining);

        if (remaining <= 0) {
          if (!firedRef.current) {
            firedRef.current = true;
            onTimeUp?.();
          }
          return; // stop ticking
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    } else {
      // Pausing — save how many seconds are left
      if (deadlineRef.current !== null) {
        pausedSecondsRef.current = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
      }
      cancelAnimationFrame(rafRef.current);
    }

    return () => cancelAnimationFrame(rafRef.current);
  }, [isRunning]);

  // Handle visibility change — recalculate immediately when tab becomes visible
  useEffect(() => {
    const onVisible = () => {
      if (isRunning && deadlineRef.current) {
        const remaining = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
        setSecondsLeft(remaining);
        if (remaining <= 0 && !firedRef.current) {
          firedRef.current = true;
          onTimeUp?.();
        }
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isRunning]);

  const progress = (totalSeconds - secondsLeft) / totalSeconds;
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
import { motion } from "framer-motion";
import TaskTimer from "./TaskTimer";

const ENCOURAGEMENTS = [
  "Stay with one tiny step. You're building momentum.",
  "One question. That's all. You can do this.",
  "Your plant is waiting. Keep going 🌿",
  "Just this next tiny piece. Nothing else.",
  "Momentum builds from the smallest move.",
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function PhoneParkedScreen({
  task,
  isRunning,
  onTimeUp,
  onComplete,
  onMoved,
  onTogglePause,
}) {
  const encouragement = getRandom(ENCOURAGEMENTS);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: "linear-gradient(160deg, #fafdf7 0%, #f0fdf4 55%, #fdf9f5 100%)" }}
    >
      <div className="w-full max-w-sm space-y-6 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold"
          style={{ background: "#dcfce7", color: "#15803d", border: "1.5px solid #bbf7d0" }}>
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          Phone Parked — Focus Protected
        </div>

        {/* Plant */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="text-6xl select-none"
        >
          🌿
        </motion.div>

        {/* Mission card */}
        <div className="rounded-3xl px-6 py-5 space-y-4"
          style={{ background: "white", border: "1.5px solid #d1fae5", boxShadow: "0 4px 20px rgba(90,154,111,0.07)" }}>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">Current Mission</p>
            {task ? (
              <>
                <h2 className="text-xl font-bold text-stone-800 leading-snug">{task.title}</h2>
                {task.subtitle && <p className="text-stone-500 text-sm mt-1">{task.subtitle}</p>}
              </>
            ) : (
              <h2 className="text-xl font-bold text-stone-800">Free study sprint</h2>
            )}
          </div>

          {/* Timer */}
          <div className="flex justify-center">
            <TaskTimer
              durationMinutes={task?.duration || 7}
              isRunning={isRunning}
              onTimeUp={onTimeUp}
            />
          </div>

          {/* Encouragement */}
          <p className="text-sm text-stone-400 leading-relaxed italic">"{encouragement}"</p>

          {/* Complete button */}
          <button
            onClick={onComplete}
            className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #5a9a6f, #4a7c59)" }}
          >
            ✓ Done with this step
          </button>
        </div>

        {/* Secondary actions */}
        <div className="flex gap-2">
          <button
            onClick={onTogglePause}
            className="flex-1 py-2.5 rounded-2xl text-xs font-semibold text-stone-500 transition-colors hover:bg-stone-50"
            style={{ border: "1.5px solid #e5e7eb" }}
          >
            {isRunning ? "⏸ Pause" : "▶ Resume"}
          </button>
          <button
            onClick={onMoved}
            className="flex-1 py-2.5 rounded-2xl text-xs font-semibold transition-colors hover:bg-red-50"
            style={{ border: "1.5px solid #fecdd3", color: "#f43f5e" }}
          >
            📱 Phone moved
          </button>
        </div>

        <p className="text-[11px] text-stone-300">
          Emergency unlock is always available — your safety matters.
        </p>
      </div>
    </motion.div>
  );
}
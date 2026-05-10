import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Square, Settings2, Leaf } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import CherryBlossomTree from "@/components/focus-room/CherryBlossomTree";
import WaterDroplet from "@/components/focus-room/WaterDroplet";
import TimerSettingsModal from "@/components/focus-room/TimerSettingsModal";
import StudyCompanion from "@/components/focus-room/StudyCompanion";

// A 45-min session = 6 droplets (one every 7 min + 3 min leftover)
// Each droplet fed = tree grows one stage (0→6)
const DROPLET_INTERVAL = 7 * 60; // 7 minutes in seconds
const SESSION_MINUTES = 45;
const MAX_DROPLETS = 6;

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function FocusRoom() {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [focusMinutes, setFocusMinutes] = useState(SESSION_MINUTES);
  const [timeLeft, setTimeLeft] = useState(SESSION_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [totalFocused, setTotalFocused] = useState(0);
  const [treeStage, setTreeStage] = useState(0); // 0–6
  const [dropletsEarned, setDropletsEarned] = useState(0); // total droplets ever earned this session
  const [dropletsReady, setDropletsReady] = useState(0); // droplets waiting to be fed
  const [dropletProgress, setDropletProgress] = useState(0); // 0–1 fill of current droplet
  const [sessionComplete, setSessionComplete] = useState(false);
  const [feedAnimation, setFeedAnimation] = useState(false); // splash when fed

  const intervalRef = useRef(null);
  const elapsedRef = useRef(0); // total seconds elapsed (for droplet calc)
  const queryClient = useQueryClient();

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list("-created_date", 50),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.FocusSession.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["focus-sessions"] }),
  });

  // Main timer tick
  useEffect(() => {
    if (!isRunning) { clearInterval(intervalRef.current); return; }

    intervalRef.current = setInterval(() => {
      elapsedRef.current += 1;
      const elapsed = elapsedRef.current;
      const totalSecs = focusMinutes * 60;

      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          setSessionComplete(true);
          const course = courses.find(c => c.id === selectedCourse);
          saveMutation.mutate({
            course_id: selectedCourse || undefined,
            course_name: course?.name || "General",
            duration_minutes: focusMinutes,
            date: format(new Date(), "yyyy-MM-dd"),
            type: "pomodoro",
          });
          setTotalFocused(f => f + focusMinutes);
          return 0;
        }
        return prev - 1;
      });

      // Droplet logic: one droplet earned every DROPLET_INTERVAL seconds
      const earnedSoFar = Math.min(Math.floor(elapsed / DROPLET_INTERVAL), MAX_DROPLETS);
      setDropletsEarned(prev => {
        if (earnedSoFar > prev) {
          setDropletsReady(r => r + (earnedSoFar - prev));
        }
        return earnedSoFar;
      });

      // Fill progress of the *next* droplet being grown
      const nextDropletElapsed = elapsed % DROPLET_INTERVAL;
      if (earnedSoFar < MAX_DROPLETS) {
        setDropletProgress(nextDropletElapsed / DROPLET_INTERVAL);
      } else {
        setDropletProgress(0);
      }

    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const start = () => {
    setIsRunning(true);
  };
  const pause = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
  };
  const stop = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    if (elapsedRef.current > 30) {
      const mins = Math.round(elapsedRef.current / 60);
      const course = courses.find(c => c.id === selectedCourse);
      saveMutation.mutate({
        course_id: selectedCourse || undefined,
        course_name: course?.name || "General",
        duration_minutes: mins,
        date: format(new Date(), "yyyy-MM-dd"),
        type: "pomodoro",
      });
      setTotalFocused(f => f + mins);
    }
    setSessionComplete(true);
  };

  const feedDroplet = () => {
    if (dropletsReady === 0) return;
    setDropletsReady(r => r - 1);
    setTreeStage(s => Math.min(s + 1, 6));
    setFeedAnimation(true);
    setTimeout(() => setFeedAnimation(false), 1200);
  };

  const resetSession = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    elapsedRef.current = 0;
    setTimeLeft(focusMinutes * 60);
    setTreeStage(0);
    setDropletsEarned(0);
    setDropletsReady(0);
    setDropletProgress(0);
    setSessionComplete(false);
    setTotalFocused(0);
  };

  const handleSettingsSave = ({ focus, breakTime }) => {
    setFocusMinutes(focus);
    setTimeLeft(focus * 60);
    setIsRunning(false);
    clearInterval(intervalRef.current);
    elapsedRef.current = 0;
    setDropletProgress(0);
    setShowSettings(false);
  };

  const totalSecs = focusMinutes * 60;
  const sessionProgress = (totalSecs - timeLeft) / totalSecs;
  const circumference = 2 * Math.PI * 54;

  // ── Session complete screen ──────────────────────────────────────────────
  if (sessionComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: "linear-gradient(160deg, #fdf2f8 0%, #fce7f3 50%, #f0fdf4 100%)" }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 max-w-sm w-full text-center">
          <div className="w-56 h-64">
            <CherryBlossomTree stage={treeStage} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-stone-700">Session complete 🌸</h2>
            <p className="text-stone-400 text-sm mt-2">
              Your tree reached <strong className="text-pink-500">{["bare soil", "seedling", "sapling", "young tree", "growing", "budding", "full bloom"][treeStage]}</strong>.
              {totalFocused > 0 && ` You focused for ${totalFocused} minutes.`}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={resetSession}
              className="px-6 py-2.5 rounded-2xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #ec4899, #be185d)" }}>
              Grow another tree
            </button>
            <Link to="/garden"
              className="px-5 py-2.5 rounded-2xl text-sm font-medium text-stone-500 border border-stone-200 hover:bg-stone-50 transition-colors">
              Garden mode
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #fdf9ff 0%, #fce7f3 30%, #f0fdf4 100%)" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-700">Focus Garden</h1>
            <p className="text-xs text-stone-400 mt-0.5">Grow your cherry blossom tree</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/garden"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors hover:bg-green-50"
              style={{ color: "#5a9a6f", border: "1.5px solid #d1fae5" }}>
              <Leaf className="h-3 w-3" /> Task mode
            </Link>
            <button onClick={() => setShowSettings(true)}
              className="h-8 w-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:bg-stone-50 transition-colors">
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Course selector */}
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="rounded-2xl border-stone-200 bg-white/80 text-sm h-10">
            <SelectValue placeholder="Studying for… (optional)" />
          </SelectTrigger>
          <SelectContent>
            {courses.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Main content: tree + timer side by side on desktop, stacked on mobile */}
        <div className="flex flex-col md:flex-row gap-6 items-center">

          {/* Cherry blossom tree */}
          <div className="relative flex-1 flex justify-center">
            {/* Feed animation splash */}
            <AnimatePresence>
              {feedAnimation && (
                <motion.div
                  key="splash"
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {["💧", "🌊", "✨"].map((e, i) => (
                    <motion.span key={i} className="absolute text-2xl"
                      initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
                      animate={{ opacity: 0, scale: 1.5, x: (i - 1) * 40, y: -50 }}
                      transition={{ duration: 1, delay: i * 0.1 }}>
                      {e}
                    </motion.span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="w-52 h-60">
              <CherryBlossomTree stage={treeStage} isRunning={isRunning} />
            </div>
          </div>

          {/* Timer + controls */}
          <div className="flex flex-col items-center gap-5 flex-1">

            {/* Ring timer */}
            <div className="relative h-36 w-36">
              <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#fce7f3" strokeWidth="7" />
                <motion.circle cx="60" cy="60" r="54" fill="none"
                  stroke={isRunning ? "#ec4899" : "#f9a8d4"}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  animate={{ strokeDashoffset: circumference - sessionProgress * circumference }}
                  transition={{ duration: 0.8 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold font-mono text-stone-700 leading-none">{formatTime(timeLeft)}</span>
                <span className="text-[10px] text-stone-400 mt-1">
                  {isRunning ? "focusing 🌸" : timeLeft === totalSecs ? "ready" : "paused"}
                </span>
              </div>
            </div>

            {/* Timer controls */}
            <div className="flex items-center gap-2">
              {isRunning ? (
                <button onClick={pause}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">
                  <Pause className="h-4 w-4" /> Pause
                </button>
              ) : (
                <button onClick={start}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #ec4899, #be185d)" }}>
                  <Play className="h-4 w-4" /> {timeLeft < totalSecs ? "Resume" : "Start Session"}
                </button>
              )}
              {timeLeft < totalSecs && (
                <button onClick={stop}
                  className="h-10 w-10 rounded-2xl border border-rose-200 text-rose-400 hover:bg-rose-50 flex items-center justify-center transition-colors">
                  <Square className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Session info */}
            <div className="flex gap-3 text-[11px] text-stone-400">
              <span className="bg-pink-50 px-2.5 py-1 rounded-full">🌸 {focusMinutes}m session</span>
              <span className="bg-blue-50 px-2.5 py-1 rounded-full">💧 every 7m</span>
            </div>

            {totalFocused > 0 && (
              <p className="text-xs text-stone-400">Today: <span className="font-semibold text-stone-600">{totalFocused} min focused</span></p>
            )}
          </div>
        </div>

        {/* Droplets section */}
        <div className="rounded-3xl p-5 space-y-3" style={{ background: "white", border: "1.5px solid #fce7f3" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-stone-700">Water Droplets</p>
              <p className="text-xs text-stone-400">Earn one every 7 minutes of focus</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-400">Tree stage</p>
              <p className="text-sm font-bold" style={{ color: "#ec4899" }}>
                {["🌱 Bare", "🌱 Seedling", "🌿 Sapling", "🌳 Young", "🌳 Growing", "🌸 Budding", "🌸 Blooming"][treeStage]}
              </p>
            </div>
          </div>

          {/* Droplet row */}
          <div className="flex items-end gap-4 flex-wrap min-h-[80px]">

            {/* Earned + ready droplets */}
            {Array.from({ length: dropletsReady }).map((_, i) => (
              <WaterDroplet key={`ready-${i}`} fillPct={1} isReady={true} onFeed={feedDroplet} index={i} />
            ))}

            {/* Currently-growing droplet */}
            {isRunning && dropletsEarned < MAX_DROPLETS && (
              <WaterDroplet
                key={`growing-${dropletsEarned}`}
                fillPct={dropletProgress}
                isReady={false}
                index={dropletsReady}
              />
            )}

            {/* Empty slots */}
            {!isRunning && dropletsReady === 0 && dropletsEarned === 0 && (
              <p className="text-xs text-stone-300 italic py-4">Start your session to grow droplets…</p>
            )}
          </div>

          {/* Next droplet time */}
          {isRunning && dropletsEarned < MAX_DROPLETS && (
            <div className="text-[11px] text-stone-300 flex items-center gap-1.5">
              <span>Next droplet in</span>
              <span className="font-semibold text-blue-400">
                {formatTime(DROPLET_INTERVAL - (elapsedRef.current % DROPLET_INTERVAL))}
              </span>
            </div>
          )}

          {dropletsReady > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="text-xs text-blue-500 font-medium text-center py-2 rounded-2xl"
              style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
              💧 {dropletsReady} droplet{dropletsReady > 1 ? "s" : ""} ready — drag or tap to water your tree!
            </motion.div>
          )}
        </div>

        {/* How it works */}
        {!isRunning && timeLeft === totalSecs && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl p-4 text-center space-y-1"
            style={{ background: "#fdf2f8", border: "1px solid #fce7f3" }}>
            <p className="text-xs text-stone-500 font-medium">How it works</p>
            <p className="text-xs text-stone-400">Focus for 7 minutes → earn a 💧 droplet → drag it to your tree → watch it grow 🌸</p>
            <p className="text-xs text-stone-400">A full 45-min session grows your tree from a seedling to full bloom.</p>
          </motion.div>
        )}
      </div>

      <TimerSettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        focusMinutes={focusMinutes}
        breakMinutes={5}
        onSave={handleSettingsSave}
      />

      <StudyCompanion
        isTimerRunning={isRunning}
        isBreak={false}
        completedTaskCount={treeStage}
        plan={null}
        archetype={{ name: "Cherry Garden", emoji: "🌸", companionName: "Blossom", accentColor: "#ec4899", progressWords: ["A seedling stirs", "A stem reaches up", "First leaves unfurl", "A bud appears"] }}
        worldLevel={treeStage}
      />
    </div>
  );
}
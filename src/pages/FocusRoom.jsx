import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Square, Settings2, Coffee } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import FocusCoachPanel from "@/components/focus-room/FocusCoachPanel";
import TimerSettingsModal from "@/components/focus-room/TimerSettingsModal";
import SessionPlan from "@/components/focus-room/SessionPlan";
import StudyCompanion from "@/components/focus-room/StudyCompanion";
import WorldScene from "@/components/focus-room/world/WorldScene";
import { getArchetypeForCourse, getWorldLevel, getLevelProgress, LEVEL_NAMES } from "@/components/focus-room/world/WorldEngine";

export default function FocusRoom() {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [totalFocused, setTotalFocused] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [plan, setPlan] = useState(null);
  const [completedTaskCount, setCompletedTaskCount] = useState(0);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list("-created_date", 50),
  });

  // Load all focus sessions to compute world XP
  const { data: allSessions = [] } = useQuery({
    queryKey: ["focus-sessions-all"],
    queryFn: () => base44.entities.FocusSession.list("-date", 500),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.FocusSession.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["focus-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["focus-sessions-all"] });
    },
  });

  const totalSecs = (isBreak ? breakMinutes : focusMinutes) * 60;

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          if (!isBreak) {
            const course = courses.find(c => c.id === selectedCourse);
            saveMutation.mutate({
              course_id: selectedCourse || undefined,
              course_name: course?.name || "General",
              duration_minutes: focusMinutes,
              date: format(new Date(), "yyyy-MM-dd"),
              type: "pomodoro",
            });
            setTotalFocused(f => f + focusMinutes);
          }
          const nextIsBreak = !isBreak;
          setIsBreak(nextIsBreak);
          return (nextIsBreak ? breakMinutes : focusMinutes) * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const startTimer = (overrideMinutes) => {
    if (overrideMinutes) {
      setFocusMinutes(overrideMinutes);
      setTimeLeft(overrideMinutes * 60);
      setIsBreak(false);
    }
    setIsRunning(true);
    if (!startTimeRef.current) startTimeRef.current = Date.now();
  };

  const pauseTimer = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
  };

  const endSession = () => {
    const elapsed = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 60000) : 0;
    if (elapsed > 0 && !isBreak) {
      const course = courses.find(c => c.id === selectedCourse);
      saveMutation.mutate({
        course_id: selectedCourse || undefined,
        course_name: course?.name || "General",
        duration_minutes: elapsed,
        date: format(new Date(), "yyyy-MM-dd"),
        type: "pomodoro",
      });
      setTotalFocused(f => f + elapsed);
    }
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(focusMinutes * 60);
    clearInterval(intervalRef.current);
    startTimeRef.current = null;
  };

  const handleSettingsSave = ({ focus, breakTime }) => {
    setFocusMinutes(focus);
    setBreakMinutes(breakTime);
    setTimeLeft(focus * 60);
    setIsRunning(false);
    setIsBreak(false);
    clearInterval(intervalRef.current);
    setShowSettings(false);
  };

  const handleTaskComplete = () => {
    setCompletedTaskCount(c => c + 1);
  };

  // ─── World system ────────────────────────────────────────────────────────────
  const selectedCourseObj = courses.find(c => c.id === selectedCourse);
  const archetype = getArchetypeForCourse(
    selectedCourseObj?.name || "",
    selectedCourseObj?.code || ""
  );

  // XP = tasks completed this session + sessions from DB for this course
  const courseSessionCount = allSessions.filter(
    s => !selectedCourse || s.course_id === selectedCourse
  ).length;
  const totalWorldXP = courseSessionCount + completedTaskCount;
  const worldLevel = getWorldLevel(totalWorldXP);
  const levelProgress = getLevelProgress(totalWorldXP);
  const nextLevel = LEVEL_NAMES[Math.min(worldLevel + 1, 5)];

  // ─── Timer display ────────────────────────────────────────────────────────────
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((totalSecs - timeLeft) / totalSecs) * 100;
  const circumference = 2 * Math.PI * 110;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="min-h-screen p-4 lg:p-8"
      style={{ background: "linear-gradient(135deg, #fdf6ec 0%, #fef3e2 50%, #f0ebe8 100%)" }}
    >
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── World Banner ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="text-2xl font-extrabold text-stone-800">
                {archetype.emoji} {archetype.name}
              </h1>
              <p className="text-xs text-stone-400 mt-0.5">{archetype.tagline}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                {LEVEL_NAMES[worldLevel]}
              </p>
              {worldLevel < 5 && (
                <p className="text-[10px] text-stone-400">→ {nextLevel}</p>
              )}
            </div>
          </div>

          {/* World Scene */}
          <WorldScene archetype={archetype} level={worldLevel} />

          {/* XP bar */}
          <div className="h-1.5 rounded-full bg-stone-200 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: archetype.accentColor }}
              animate={{ width: `${levelProgress * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* ── Main Layout ── */}
        <div className="flex flex-col xl:flex-row gap-6">

          {/* LEFT — Timer + Coach */}
          <div className="xl:w-80 space-y-5 shrink-0">

            {/* Timer Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-7 shadow-sm border border-stone-200/60 text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isBreak ? "break" : "focus"}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-5 ${
                    isBreak ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {isBreak ? <Coffee className="h-3 w-3" /> : <span className="h-2 w-2 rounded-full bg-stone-500 inline-block" />}
                  {isBreak ? "Break Time ☕" : "Focus Session"}
                </motion.div>
              </AnimatePresence>

              {/* Ring Timer */}
              <div className="relative h-52 w-52 mx-auto mb-5">
                <svg className="h-52 w-52 -rotate-90" viewBox="0 0 240 240">
                  <circle cx="120" cy="120" r="110" fill="none" stroke="#f0ebe8" strokeWidth="10" />
                  <circle
                    cx="120" cy="120" r="110" fill="none"
                    stroke={isBreak ? "#d97706" : archetype.accentColor}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold tracking-tight font-mono text-stone-800">
                    {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                  </span>
                  <span className="text-xs text-stone-400 mt-1.5">
                    {isRunning ? (isBreak ? "Recharging…" : "Deep focus…") : "Ready"}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-2 mb-5">
                {isRunning ? (
                  <Button onClick={pauseTimer} variant="outline" className="rounded-2xl h-11 px-6 border-stone-300 text-stone-700 bg-white">
                    <Pause className="h-4 w-4 mr-2" /> Pause
                  </Button>
                ) : (
                  <Button onClick={() => startTimer()} className="rounded-2xl h-11 px-6 bg-primary hover:bg-primary/90">
                    <Play className="h-4 w-4 mr-2" /> {timeLeft < totalSecs ? "Resume" : "Start"}
                  </Button>
                )}
                {(isRunning || timeLeft < totalSecs) && (
                  <Button onClick={endSession} variant="outline" className="rounded-2xl h-11 px-5 text-rose-500 border-rose-200 hover:bg-rose-50 bg-white">
                    <Square className="h-4 w-4" />
                  </Button>
                )}
                <button
                  onClick={() => setShowSettings(true)}
                  className="h-10 w-10 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-400 hover:text-stone-700 hover:border-stone-300 transition-colors"
                >
                  <Settings2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-stone-500">
                <span className="bg-stone-100 px-3 py-1 rounded-full">🎯 {focusMinutes} min</span>
                <span className="bg-amber-50 px-3 py-1 rounded-full">☕ {breakMinutes} min break</span>
              </div>

              {totalFocused > 0 && (
                <p className="text-xs text-stone-400 mt-3">
                  Focused today: <span className="font-semibold text-stone-600">{totalFocused} min</span>
                </p>
              )}
            </div>

            {/* Course selector */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl px-5 py-4 border border-stone-200/60 shadow-sm">
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 block">Studying for</label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="rounded-xl border-stone-200 bg-white/80 text-sm">
                  <SelectValue placeholder="Pick a course (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCourseObj && (
                <p className="text-[10px] text-stone-400 mt-2 flex items-center gap-1">
                  {archetype.emoji} <span>{archetype.name}</span>
                </p>
              )}
            </div>

            {/* Focus Coach */}
            <FocusCoachPanel
              selectedCourse={selectedCourse}
              courses={courses}
              onPlanReady={setPlan}
            />
          </div>

          {/* RIGHT — Session Plan */}
          <div className="flex-1 min-w-0">
            {plan ? (
              <SessionPlan
                plan={plan}
                onStartTimer={startTimer}
                onTaskComplete={handleTaskComplete}
                archetype={archetype}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[300px] flex flex-col items-center justify-center text-center rounded-3xl border-2 border-dashed border-stone-200 bg-white/30"
              >
                <span className="text-5xl mb-4">{archetype.emoji}</span>
                <p className="text-base font-bold text-stone-500">Your session plan will appear here</p>
                <p className="text-sm text-stone-400 mt-1 max-w-xs">
                  Ask the Focus Coach to build a concrete plan. Each task you complete restores your world.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <TimerSettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        focusMinutes={focusMinutes}
        breakMinutes={breakMinutes}
        onSave={handleSettingsSave}
      />

      <StudyCompanion
        isTimerRunning={isRunning}
        isBreak={isBreak}
        completedTaskCount={completedTaskCount}
        plan={plan}
        archetype={archetype}
        worldLevel={worldLevel}
      />
    </div>
  );
}
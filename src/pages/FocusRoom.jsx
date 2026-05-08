import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Square, Coffee, Settings2 } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import FocusCoachPanel from "@/components/focus-room/FocusCoachPanel";
import TimerSettingsModal from "@/components/focus-room/TimerSettingsModal";
import StepsSidebar from "@/components/focus-room/StepsSidebar";

export default function FocusRoom() {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [totalFocused, setTotalFocused] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [steps, setSteps] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list("-created_date", 50),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.FocusSession.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["focus-sessions"] }),
  });

  useEffect(() => {
    setTimeLeft(focusMinutes * 60);
  }, [focusMinutes]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            if (!isBreak) completeSession();
            setIsBreak(b => !b);
            return (!isBreak ? breakMinutes : focusMinutes) * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const completeSession = () => {
    setTotalFocused(prev => prev + focusMinutes);
    const course = courses.find(c => c.id === selectedCourse);
    saveMutation.mutate({
      course_id: selectedCourse || undefined,
      course_name: course?.name || "General",
      duration_minutes: focusMinutes,
      date: format(new Date(), "yyyy-MM-dd"),
      type: "pomodoro",
    });
  };

  const startTimer = () => {
    setIsRunning(true);
    startTimeRef.current = Date.now();
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
      setTotalFocused(prev => prev + elapsed);
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

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalSecs = (isBreak ? breakMinutes : focusMinutes) * 60;
  const progress = ((totalSecs - timeLeft) / totalSecs) * 100;
  const circumference = 2 * Math.PI * 110;
  const dashOffset = circumference - (progress / 100) * circumference;

  const selectedCourseName = courses.find(c => c.id === selectedCourse)?.name;

  return (
    <div
      className="min-h-screen p-6 lg:p-10"
      style={{ background: "linear-gradient(135deg, #fdf6ec 0%, #fef3e2 40%, #f0ebe8 100%)" }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-stone-800">☕ Focus Room</h1>
        <p className="text-stone-500 mt-1">A calm space to get things done</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 max-w-6xl mx-auto">

        {/* LEFT — Timer */}
        <div className="flex-1 space-y-5">

          {/* Timer Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-stone-200/60 text-center">
            {/* Mode badge */}
            <div className={`inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-6 ${
              isBreak ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-600"
            }`}>
              {isBreak ? <Coffee className="h-3 w-3" /> : <span className="h-2 w-2 rounded-full bg-stone-500 inline-block" />}
              {isBreak ? "Break Time" : "Focus Session"}
            </div>

            {/* Ring Timer */}
            <div className="relative h-56 w-56 mx-auto mb-6">
              <svg className="h-56 w-56 -rotate-90" viewBox="0 0 240 240">
                <circle cx="120" cy="120" r="110" fill="none" stroke="#f0ebe8" strokeWidth="10" />
                <circle cx="120" cy="120" r="110" fill="none"
                  stroke={isBreak ? "#d97706" : "#1a6fa8"}
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
                  {isRunning ? (isBreak ? "Recharging…" : "Deep work…") : timeLeft === 0 ? "Done!" : "Ready"}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 mb-6">
              {isRunning ? (
                <Button onClick={pauseTimer} variant="outline" className="rounded-2xl h-12 px-7 border-stone-300 text-stone-700 bg-white">
                  <Pause className="h-4 w-4 mr-2" /> Pause
                </Button>
              ) : (
                <Button onClick={startTimer} className="rounded-2xl h-12 px-7 bg-primary hover:bg-primary/90">
                  <Play className="h-4 w-4 mr-2" /> {timeLeft < totalSecs ? "Resume" : "Start"}
                </Button>
              )}
              {(isRunning || timeLeft < totalSecs) && (
                <Button onClick={endSession} variant="outline" className="rounded-2xl h-12 px-7 text-rose-500 border-rose-200 hover:bg-rose-50 bg-white">
                  <Square className="h-4 w-4 mr-2" /> End
                </Button>
              )}
              <button
                onClick={() => setShowSettings(true)}
                className="h-10 w-10 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-400 hover:text-stone-700 hover:border-stone-300 transition-colors"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            </div>

            {/* Timer config pills */}
            <div className="flex items-center justify-center gap-3 text-xs text-stone-500">
              <span className="bg-stone-100 px-3 py-1 rounded-full">🎯 Focus: {focusMinutes} min</span>
              <span className="bg-amber-50 px-3 py-1 rounded-full">☕ Break: {breakMinutes} min</span>
            </div>

            {totalFocused > 0 && (
              <p className="text-xs text-stone-400 mt-4">
                Total focused today: <span className="font-semibold text-stone-600">{totalFocused} min</span>
              </p>
            )}
          </div>

          {/* Course selector */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl px-5 py-4 border border-stone-200/60 shadow-sm">
            <label className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2 block">Studying for</label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="rounded-xl border-stone-200 bg-white/80">
                <SelectValue placeholder="Pick a course (optional)" />
              </SelectTrigger>
              <SelectContent>
                {courses.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Focus Coach */}
          <FocusCoachPanel
            selectedCourse={selectedCourse}
            courses={courses}
            onStepsGenerated={setSteps}
            onStepActivated={setActiveStep}
          />
        </div>

        {/* RIGHT — Steps Sidebar */}
        <StepsSidebar
          steps={steps}
          activeStep={activeStep}
          onStepClick={setActiveStep}
          isRunning={isRunning}
          isBreak={isBreak}
          focusMinutes={focusMinutes}
          breakMinutes={breakMinutes}
        />
      </div>

      <TimerSettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        focusMinutes={focusMinutes}
        breakMinutes={breakMinutes}
        onSave={handleSettingsSave}
      />
    </div>
  );
}
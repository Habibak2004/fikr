import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import TimerSettingsModal from "@/components/focus-room/TimerSettingsModal";
import StudyCompanion from "@/components/focus-room/StudyCompanion";
import WorldHub from "@/components/focus-room/world/WorldHub";
import ImmersiveFocusRoom from "@/components/focus-room/ImmersiveFocusRoom";
import { getArchetypeForCourse, getWorldLevel, getLevelProgress, LEVEL_NAMES } from "@/components/focus-room/world/WorldEngine";
import { Globe, Timer } from "lucide-react";

export default function FocusRoom() {
  const [activeTab, setActiveTab] = useState("focus");
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
  const [sessionTaskCounts, setSessionTaskCounts] = useState({});
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list("-created_date", 50),
  });

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
    if (selectedCourse) {
      setSessionTaskCounts(prev => ({ ...prev, [selectedCourse]: (prev[selectedCourse] || 0) + 1 }));
    }
  };

  // World system
  const selectedCourseObj = courses.find(c => c.id === selectedCourse);
  const archetype = getArchetypeForCourse(
    selectedCourseObj?.name || "",
    selectedCourseObj?.code || ""
  );
  const courseSessionCount = allSessions.filter(
    s => !selectedCourse || s.course_id === selectedCourse
  ).length;
  const totalWorldXP = courseSessionCount + completedTaskCount;
  const worldLevel = getWorldLevel(totalWorldXP);
  const levelProgress = getLevelProgress(totalWorldXP);

  return (
    <div className="min-h-screen" style={{ background: activeTab === "worlds" ? "#08080f" : "#0d1117" }}>

      {/* Tab bar */}
      <div className="sticky top-0 z-30 flex items-center gap-1 px-6 py-3 border-b border-white/10 bg-black/40 backdrop-blur-sm">
        <button
          onClick={() => setActiveTab("focus")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "focus"
              ? "text-white border border-white/20 bg-white/10"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          <Timer className="h-4 w-4" /> Focus Room
        </button>
        <button
          onClick={() => setActiveTab("worlds")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "worlds"
              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-400/30"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          <Globe className="h-4 w-4" /> World Hub
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "worlds" ? (
          <motion.div key="worlds" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <WorldHub
              courses={courses}
              allSessions={allSessions}
              allTaskCounts={sessionTaskCounts}
              onEnterWorld={(courseId) => {
                setSelectedCourse(courseId);
                setActiveTab("focus");
              }}
            />
          </motion.div>
        ) : (
          <motion.div key="focus" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ImmersiveFocusRoom
              courses={courses}
              selectedCourse={selectedCourse}
              setSelectedCourse={setSelectedCourse}
              archetype={archetype}
              worldLevel={worldLevel}
              levelProgress={levelProgress}
              plan={plan}
              setPlan={setPlan}
              isRunning={isRunning}
              isBreak={isBreak}
              timeLeft={timeLeft}
              totalSecs={totalSecs}
              focusMinutes={focusMinutes}
              breakMinutes={breakMinutes}
              totalFocused={totalFocused}
              completedTaskCount={completedTaskCount}
              onStart={startTimer}
              onPause={pauseTimer}
              onEnd={endSession}
              onTaskComplete={handleTaskComplete}
              onOpenSettings={() => setShowSettings(true)}
              onSwitchWorld={() => setActiveTab("worlds")}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
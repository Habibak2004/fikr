import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Square, Timer, Target } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function FocusRoom() {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [totalFocused, setTotalFocused] = useState(0);
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
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const completeSession = () => {
    const duration = 25;
    setTotalFocused(prev => prev + duration);
    const course = courses.find(c => c.id === selectedCourse);
    saveMutation.mutate({
      course_id: selectedCourse || undefined,
      course_name: course?.name || "General",
      duration_minutes: duration,
      date: format(new Date(), "yyyy-MM-dd"),
      type: "pomodoro",
    });
  };

  const startTimer = () => {
    setIsRunning(true);
    setIsFullscreen(true);
    startTimeRef.current = Date.now();
  };

  const pauseTimer = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
  };

  const endSession = () => {
    const elapsed = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 60000) : 0;
    if (elapsed > 0) {
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
    setTimeLeft(25 * 60);
    setIsFullscreen(false);
    clearInterval(intervalRef.current);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100;
  const circumference = 2 * Math.PI * 130;
  const dashOffset = circumference - (progress / 100) * circumference;

  const selectedCourseName = courses.find(c => c.id === selectedCourse)?.name;

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          {selectedCourseName && (
            <p className="text-sm text-muted-foreground mb-6 uppercase tracking-widest">{selectedCourseName}</p>
          )}
          
          <div className="relative h-72 w-72 mx-auto mb-8">
            <svg className="h-72 w-72 -rotate-90" viewBox="0 0 280 280">
              <circle cx="140" cy="140" r="130" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle cx="140" cy="140" r="130" fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
                strokeDasharray={circumference} strokeDashoffset={dashOffset}
                strokeLinecap="round" className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-bold tracking-tight font-mono">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
              <span className="text-sm text-muted-foreground mt-2">
                {isRunning ? "Focus Mode" : timeLeft === 0 ? "Complete!" : "Paused"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-center">
            {isRunning ? (
              <Button onClick={pauseTimer} size="lg" variant="outline" className="rounded-2xl h-14 px-8">
                <Pause className="h-5 w-5 mr-2" /> Pause
              </Button>
            ) : (
              <Button onClick={startTimer} size="lg" className="rounded-2xl h-14 px-8 bg-primary hover:bg-primary/90">
                <Play className="h-5 w-5 mr-2" /> {timeLeft < 25 * 60 ? "Resume" : "Start"}
              </Button>
            )}
            <Button onClick={endSession} size="lg" variant="outline" className="rounded-2xl h-14 px-8 text-destructive hover:text-destructive">
              <Square className="h-5 w-5 mr-2" /> End
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Focus Room</h1>
        <p className="text-muted-foreground mt-1">Deep work starts here</p>
      </div>

      <Card className="p-8 rounded-2xl text-center">
        <Timer className="h-12 w-12 mx-auto text-primary/30 mb-6" />
        
        <div className="max-w-xs mx-auto mb-6">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a course (optional)" /></SelectTrigger>
            <SelectContent>
              {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="text-6xl font-bold tracking-tight font-mono mb-6">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>

        <Button onClick={startTimer} size="lg" className="rounded-2xl h-14 px-10 bg-primary hover:bg-primary/90">
          <Play className="h-5 w-5 mr-2" /> Start Pomodoro (25 min)
        </Button>

        {totalFocused > 0 && (
          <p className="text-sm text-muted-foreground mt-6">
            Total focused today: <span className="font-semibold text-foreground">{totalFocused} minutes</span>
          </p>
        )}
      </Card>
    </div>
  );
}
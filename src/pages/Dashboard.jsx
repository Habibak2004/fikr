import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Target, Clock, TrendingUp, BookOpen, ArrowRight,
  CheckCircle2, Calendar, Brain, Users, Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { format, differenceInDays, isAfter } from "date-fns";
import SemesterManager from "../components/dashboard/SemesterManager";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: courses = [] } = useQuery({
    queryKey: ["courses", user?.email],
    queryFn: () => base44.entities.Course.filter({ created_by: user.email }, "-created_date", 50),
    enabled: !!user?.email,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments", user?.email],
    queryFn: () => base44.entities.Assignment.filter({ created_by: user.email }, "-due_date", 50),
    enabled: !!user?.email,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["focus-sessions", user?.email],
    queryFn: () => base44.entities.FocusSession.filter({ created_by: user.email }, "-created_date", 200),
    enabled: !!user?.email,
  });

  const { data: studySessions = [] } = useQuery({
    queryKey: ["study-sessions", user?.email],
    queryFn: () => base44.entities.StudySession.filter({ created_by: user.email }, "-created_date", 200),
    enabled: !!user?.email,
  });

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayMinutes = sessions.filter(s => s.date === todayStr).reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  const focusGoal = 120;
  const focusPercent = Math.min(100, Math.round((todayMinutes / focusGoal) * 100));

  // Calculate real study streak from FocusSession + StudySession dates
  const studyStreak = (() => {
    const sessionDates = new Set([
      ...sessions.map(s => s.date),
      ...studySessions.map(s => s.date),
    ].filter(Boolean));
    let streak = 0;
    let check = new Date();
    // If no session today, start checking from yesterday
    if (!sessionDates.has(format(check, "yyyy-MM-dd"))) {
      check.setDate(check.getDate() - 1);
    }
    while (sessionDates.has(format(check, "yyyy-MM-dd"))) {
      streak++;
      check.setDate(check.getDate() - 1);
    }
    return streak;
  })();

  const upcoming = assignments
    .filter(a => !a.completed && a.due_date && isAfter(new Date(a.due_date), new Date()))
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);

  const nextExam = assignments
    .filter(a => (a.type === "exam" || a.type === "quiz") && a.due_date && isAfter(new Date(a.due_date), new Date()))
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];

  const daysToExam = nextExam ? differenceInDays(new Date(nextExam.due_date), new Date()) : null;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-bold">
          {greeting()}, {user?.full_name?.split(" ")[0] || "Student"}
        </h1>
        <p className="text-muted-foreground mt-1">Here's your study overview for today.</p>
      </motion.div>

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="semesters">Semesters</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-8">

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Target} label="Focus Score" value={`${focusPercent}%`} sub={`${todayMinutes}m / ${focusGoal}m goal`} color="bg-primary/10 text-primary" delay={0} />
        <StatCard icon={TrendingUp} label="Study Streak" value={`${studyStreak} day${studyStreak !== 1 ? "s" : ""}`} sub={studyStreak > 0 ? "Keep it up!" : "Start a session today!"} color="bg-accent/10 text-accent" delay={0.05} />
        <StatCard icon={BookOpen} label="Active Courses" value={courses.filter(c => c.status === "active").length} sub={`${courses.length} total enrolled`} color="bg-secondary/10 text-secondary" delay={0.1} />
        <StatCard icon={Clock} label="Exam Countdown" value={daysToExam != null ? `${daysToExam}d` : "—"} sub={nextExam ? nextExam.name : "No upcoming exams"} color="bg-destructive/10 text-destructive" delay={0.15} />
      </div>

      {/* Focus Tracker + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Focus */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-6 rounded-2xl">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">Daily Focus</h3>
            <div className="flex items-center justify-center mb-6">
              <div className="relative h-36 w-36">
                <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--primary))" strokeWidth="10"
                    strokeDasharray={`${focusPercent * 3.14} 314`} strokeLinecap="round" className="transition-all duration-700" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{todayMinutes}m</span>
                  <span className="text-xs text-muted-foreground">of {focusGoal}m</span>
                </div>
              </div>
            </div>
            <Link to="/focus">
              <Button className="w-full rounded-xl bg-primary hover:bg-primary/90">
                <Zap className="h-4 w-4 mr-2" /> Start Focus Session
              </Button>
            </Link>
          </Card>
        </motion.div>

        {/* Upcoming Deadlines */}
        <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="p-6 rounded-2xl h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Upcoming Deadlines</h3>
              <Link to="/planner" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mb-3 text-primary/30" />
                <p className="text-sm">You're all caught up!</p>
                <p className="text-xs mt-1">Add courses and assignments to see them here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((a) => {
                  const days = differenceInDays(new Date(a.due_date), new Date());
                  const urgency = days <= 1 ? "text-destructive bg-destructive/10" : days <= 3 ? "text-amber-600 bg-amber-50" : "text-muted-foreground bg-muted";
                  return (
                    <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                      <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: a.course_color || "hsl(var(--primary))" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.course_name}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-lg ${urgency}`}>
                        {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="rounded-2xl bg-gradient-to-br from-secondary/10 to-primary/10 border-0 p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-secondary/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold">Community Study Sprint</h3>
                <p className="text-sm text-muted-foreground">Join 24 students studying together right now</p>
              </div>
            </div>
            <Link to="/community">
              <Button variant="outline" className="rounded-xl">
                Join Sprint <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>
        </TabsContent>

        <TabsContent value="semesters" className="mt-6">
          <SemesterManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="p-5 rounded-2xl hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
          <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Flame, Brain, TrendingUp, Clock, Sparkles } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, subDays } from "date-fns";
import { motion } from "framer-motion";

export default function Insights() {
  const { data: sessions = [] } = useQuery({
    queryKey: ["focus-sessions"],
    queryFn: () => base44.entities.FocusSession.list("-created_date", 200),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list("-created_date", 50),
  });

  // Focus score over time (last 14 days)
  const today = new Date();
  const focusByDay = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(today, 13 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayMinutes = sessions.filter(s => s.date === dateStr).reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    return { date: format(date, "MMM d"), minutes: dayMinutes, score: Math.min(100, Math.round((dayMinutes / 120) * 100)) };
  });

  // Study streak
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const date = format(subDays(today, i), "yyyy-MM-dd");
    const has = sessions.some(s => s.date === date);
    if (has || i === 0) streak++;
    else break;
  }

  // Total this week
  const weekMinutes = focusByDay.slice(-7).reduce((s, d) => s + d.minutes, 0);

  // Mastery by subject
  const subjectData = courses.map(c => ({
    name: c.code,
    progress: c.progress || 0,
    color: c.color || "#0061a4",
  }));

  const totalMinutes = sessions.reduce((s, sess) => s + (sess.duration_minutes || 0), 0);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Insights</h1>
        <p className="text-muted-foreground mt-1">Your academic performance at a glance</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Target, label: "Focus Score", value: `${focusByDay[focusByDay.length - 1]?.score || 0}%`, color: "bg-primary/10 text-primary" },
          { icon: Flame, label: "Study Streak", value: `${streak} days`, color: "bg-accent/10 text-accent" },
          { icon: Clock, label: "This Week", value: `${weekMinutes}m`, color: "bg-secondary/10 text-secondary" },
          { icon: Brain, label: "Total Study", value: `${Math.round(totalMinutes / 60)}h`, color: "bg-green-100 text-green-700" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-5 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Focus Over Time */}
      <Card className="p-6 rounded-2xl">
        <h3 className="font-semibold mb-1">Focus Score Over Time</h3>
        <p className="text-xs text-muted-foreground mb-4">Last 14 days</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={focusByDay}>
              <defs>
                <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
              <Tooltip />
              <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fill="url(#focusGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Minutes */}
        <Card className="p-6 rounded-2xl">
          <h3 className="font-semibold mb-1">Daily Study Time</h3>
          <p className="text-xs text-muted-foreground mb-4">Minutes per day</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={focusByDay.slice(-7)}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="minutes" fill="hsl(var(--secondary))" radius={[6, 6, 0, 0]} fillOpacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Mastery by Subject */}
        <Card className="p-6 rounded-2xl">
          <h3 className="font-semibold mb-1">Mastery by Subject</h3>
          <p className="text-xs text-muted-foreground mb-4">Course completion progress</p>
          {subjectData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Add courses to see mastery data</p>
          ) : (
            <div className="space-y-4">
              {subjectData.map((s) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{s.name}</span>
                    <span className="text-sm font-bold">{s.progress}%</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.progress}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* AI Summary */}
      <Card className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">AI Performance Summary</h3>
            <p className="text-xs text-muted-foreground">Generated by Fikr Intelligence</p>
          </div>
        </div>
        <div className="space-y-2 text-sm text-foreground/80">
          <p>• You've studied <strong>{Math.round(totalMinutes / 60)} hours</strong> total across all courses.</p>
          <p>• Your current study streak is <strong>{streak} days</strong> — {streak >= 7 ? "amazing consistency!" : "try to study daily for better retention."}</p>
          <p>• This week you focused for <strong>{weekMinutes} minutes</strong> — {weekMinutes >= 600 ? "excellent effort!" : "try to hit 600 minutes (10 hours) for optimal results."}</p>
          {courses.length > 0 && <p>• Focus more on courses below 50% completion to maintain balanced progress.</p>}
        </div>
      </Card>
    </div>
  );
}
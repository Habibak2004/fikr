import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, Flag, Clock, Sparkles, AlertTriangle } from "lucide-react";
import { format, differenceInDays, isAfter, isBefore } from "date-fns";
import { motion } from "framer-motion";

const SEMESTER_START = new Date("2026-01-19");
const SEMESTER_END = new Date("2026-05-15");
const TOTAL_DAYS = differenceInDays(SEMESTER_END, SEMESTER_START);
const ELAPSED_DAYS = Math.max(0, differenceInDays(new Date(), SEMESTER_START));
const SEMESTER_PROGRESS = Math.min(100, Math.round((ELAPSED_DAYS / TOTAL_DAYS) * 100));

const milestones = [
  { date: "2026-01-19", label: "Semester Start", type: "start" },
  { date: "2026-02-06", label: "Last Day to Add/Drop", type: "critical" },
  { date: "2026-03-09", label: "Spring Break Begins", type: "break" },
  { date: "2026-03-16", label: "Spring Break Ends", type: "break" },
  { date: "2026-03-27", label: "Last Day to Withdraw", type: "critical" },
  { date: "2026-04-20", label: "Registration Opens", type: "info" },
  { date: "2026-05-04", label: "Last Day of Classes", type: "critical" },
  { date: "2026-05-08", label: "Finals Begin", type: "exam" },
  { date: "2026-05-15", label: "Finals End / Semester End", type: "end" },
];

export default function AcademicCalendar() {
  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => base44.entities.Assignment.list("-due_date", 200),
  });

  const upcomingExams = assignments
    .filter(a => (a.type === "exam" || a.type === "quiz") && a.due_date && isAfter(new Date(a.due_date), new Date()))
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);

  const typeColors = {
    start: "bg-green-100 text-green-700",
    end: "bg-primary/10 text-primary",
    critical: "bg-red-100 text-red-700",
    break: "bg-amber-100 text-amber-700",
    exam: "bg-secondary/10 text-secondary",
    info: "bg-muted text-muted-foreground",
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Academic Calendar</h1>
        <p className="text-muted-foreground mt-1">Spring 2026 semester overview</p>
      </div>

      {/* Semester Progress */}
      <Card className="p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Semester Progress</h3>
          <span className="text-sm font-medium text-primary">{SEMESTER_PROGRESS}%</span>
        </div>
        <Progress value={SEMESTER_PROGRESS} className="h-3 rounded-full mb-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{format(SEMESTER_START, "MMM d")}</span>
          <span>{differenceInDays(SEMESTER_END, new Date())} days remaining</span>
          <span>{format(SEMESTER_END, "MMM d")}</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Semester Timeline</h3>
          {milestones.map((m, i) => {
            const isPast = isBefore(new Date(m.date), new Date()) && !isAfter(new Date(m.date), new Date());
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <div className={`flex items-center gap-4 p-4 rounded-2xl ${isPast ? "bg-muted/50" : "bg-card border border-border/60"}`}>
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold">{format(new Date(m.date), "MMM")}</span>
                    <span className="text-lg font-bold">{format(new Date(m.date), "d")}</span>
                  </div>
                  <div className="h-10 w-[2px] bg-border rounded-full" />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isPast ? "text-muted-foreground" : ""}`}>{m.label}</p>
                  </div>
                  <Badge className={`text-[10px] ${typeColors[m.type]}`}>{m.type}</Badge>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Countdown</h4>
            </div>
            <p className="text-4xl font-bold text-primary">{differenceInDays(SEMESTER_END, new Date())}d</p>
            <p className="text-sm text-muted-foreground mt-1">until semester ends</p>
          </Card>

          <Card className="p-5 rounded-2xl">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Upcoming Exams</h4>
            {upcomingExams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No exams scheduled</p>
            ) : (
              <div className="space-y-2">
                {upcomingExams.map(e => (
                  <div key={e.id} className="flex items-center justify-between p-2 rounded-xl bg-muted/50">
                    <span className="text-sm truncate">{e.name}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(e.due_date), "MMM d")}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Button variant="outline" className="w-full rounded-xl">
            <Sparkles className="h-4 w-4 mr-2" /> AI Schedule Sync
          </Button>
        </div>
      </div>
    </div>
  );
}
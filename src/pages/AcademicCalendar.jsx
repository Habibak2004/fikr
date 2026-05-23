import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import { Settings2, Sparkles, AlertTriangle, CalendarClock, Info, ChevronDown } from "lucide-react";
import { format, differenceInDays, isAfter, differenceInWeeks } from "date-fns";
import { Link } from "react-router-dom";
import SemesterConfig from "@/components/calendar/SemesterConfig";

const DEFAULT_SEMESTER = { label: "Spring 2026", start: "2026-01-19", end: "2026-05-15" };

const DEFAULT_MILESTONES = [
  { date: "2026-01-19", label: "Semester Start",    sub: "Jan 19",     type: "done" },
  { date: "2026-02-06", label: "Add/Drop Ends",     sub: "Feb 6",      type: "done" },
  { date: "2026-02-16", label: "Presidents Day",    sub: "No Classes", type: "done" },
  { date: "2026-03-09", label: "Midterm Week",      sub: "Mar 9–13",   type: "active" },
  { date: "2026-03-16", label: "Spring Break",      sub: "Mar 16–20",  type: "upcoming" },
  { date: "2026-04-06", label: "Registration",      sub: "Opens",      type: "upcoming" },
  { date: "2026-04-20", label: "Withdraw Deadline", sub: "Apr 20",     type: "upcoming" },
  { date: "2026-05-04", label: "Last Day Classes",  sub: "May 4",      type: "upcoming" },
  { date: "2026-05-08", label: "Final Exams",       sub: "May 8–15",   type: "upcoming" },
  { date: "2026-05-22", label: "Grades Released",   sub: "May 22",     type: "upcoming" },
];

const criticalDeadlines = [
  { label: "Last Day to Drop (without W)", detail: "Tonight at 11:59 PM",        urgency: "URGENT",   icon: AlertTriangle, iconColor: "text-red-500",           iconBg: "bg-red-50",     badgeColor: "bg-red-100 text-red-600" },
  { label: "Last Day to Add",              detail: "Monday, May 11 • 3 days left",urgency: "UPCOMING", icon: CalendarClock, iconColor: "text-primary",           iconBg: "bg-primary/10", badgeColor: "bg-primary/10 text-primary" },
  { label: "Withdrawal Deadline",          detail: "Friday, May 15 • 7 days left",urgency: "PLANNING", icon: CalendarClock, iconColor: "text-muted-foreground",  iconBg: "bg-muted",      badgeColor: "bg-muted text-muted-foreground" },
];

export default function AcademicCalendar() {
  const [semester, setSemester] = useState(DEFAULT_SEMESTER);
  const [importedEvents, setImportedEvents] = useState([]);
  const [showConfig, setShowConfig] = useState(false);

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => base44.entities.Assignment.list("-due_date", 200),
  });

  const now = new Date();

  const semesterStart = new Date(semester.start);
  const semesterEnd   = new Date(semester.end);
  const totalDays     = differenceInDays(semesterEnd, semesterStart);
  const elapsedDays   = Math.max(0, differenceInDays(now, semesterStart));
  const semesterProgress = Math.min(100, Math.round((elapsedDays / totalDays) * 100));
  const weeksRemaining  = Math.max(0, differenceInWeeks(semesterEnd, now));

  const milestones = useMemo(() => {
    const isSpring2026 = semester.label === "Spring 2026";
    let combined;
    if (importedEvents.length > 0) {
      // Always use imported events when available
      combined = [...importedEvents];
    } else if (isSpring2026) {
      // Default semester: show hardcoded milestones
      combined = [...DEFAULT_MILESTONES];
    } else {
      // Other semesters with no import: show just start/end
      combined = [
        { date: semester.start, label: "Semester Start", sub: format(new Date(semester.start + "T12:00:00"), "MMM d"), type: "upcoming" },
        { date: semester.end,   label: "Semester End",   sub: format(new Date(semester.end   + "T12:00:00"), "MMM d"), type: "upcoming" },
      ];
    }
    combined.sort((a, b) => new Date(a.date) - new Date(b.date));
    return combined;
  }, [semester, importedEvents]);

  const nextMilestone = milestones.find(m => isAfter(new Date(m.date), now)) || milestones[milestones.length - 1];
  const daysUntilNext = nextMilestone ? differenceInDays(new Date(nextMilestone.date), now) : 0;

  const handleSemesterChange = (newSemester, events = []) => {
    setSemester(newSemester);
    setImportedEvents(events);
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Academic Calendar & Deadlines</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {semester.label} • {weeksRemaining} Weeks Remaining
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-xl gap-2 text-primary border-primary/30"
          onClick={() => setShowConfig(true)}
        >
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">{semester.label}</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Top Two-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Next Milestone Card */}
        <div className="bg-white border rounded-2xl p-6 relative overflow-hidden">
          <span className="inline-block text-[10px] font-bold tracking-widest uppercase bg-primary/10 text-primary px-2.5 py-1 rounded-full mb-4">
            Next Milestone
          </span>
          {nextMilestone ? (
            <>
              <h2 className="text-4xl font-extrabold leading-tight mb-1">
                {daysUntilNext} Days Until
              </h2>
              <h2 className="text-4xl font-extrabold text-primary leading-tight mb-6">
                {nextMilestone.label}
              </h2>
            </>
          ) : (
            <h2 className="text-2xl font-extrabold text-muted-foreground mb-6">No upcoming milestones</h2>
          )}

          {/* Decorative ring */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 h-36 w-36 rounded-full border-[12px] border-primary/10 opacity-60" />

          <div className="mt-2">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="font-medium text-muted-foreground">Semester Progress</span>
              <span className="font-bold text-primary">{semesterProgress}%</span>
            </div>
            <Progress value={semesterProgress} className="h-2.5 rounded-full" />
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Info className="h-3 w-3" />
              {semester.start} → {semester.end}
            </p>
          </div>
        </div>

        {/* Critical Deadlines */}
        <div className="bg-white border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Critical Deadlines</h3>
            <span className="text-muted-foreground text-lg">···</span>
          </div>
          <div className="space-y-3">
            {criticalDeadlines.map((d, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border/60">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${d.iconBg}`}>
                  <d.icon className={`h-4 w-4 ${d.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">{d.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{d.detail}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${d.badgeColor}`}>
                  {d.urgency}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Semester Timeline */}
      <div className="bg-white border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold">Semester Timeline</h3>
            {importedEvents.length > 0 && (
              <p className="text-xs text-primary mt-0.5">{importedEvents.length} imported school events included</p>
            )}
          </div>
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
          <div className="flex gap-0 relative min-w-max">
            {/* Connecting line */}
            <div className="absolute top-[52px] left-[56px] right-[56px] h-0.5 bg-border" />

            {Object.entries(
              milestones.reduce((acc, m) => {
                const key = format(new Date(m.date + "T12:00:00"), "yyyy-MM");
                if (!acc[key]) acc[key] = [];
                acc[key].push(m);
                return acc;
              }, {})
            ).map(([monthKey, events]) => {
              const monthLabel = format(new Date(monthKey + "-01"), "MMMM").toUpperCase();
              const hasActive = events.some(e => e.type === "active");
              return (
                <div key={monthKey} className="flex flex-col items-center text-center w-44 flex-shrink-0 px-2">
                  <p className={`text-[10px] font-bold tracking-widest uppercase mb-3 ${hasActive ? "text-primary" : "text-muted-foreground"}`}>
                    {monthLabel}
                  </p>
                  {/* Dot on the timeline line */}
                  <div className={`h-5 w-5 rounded-full z-10 border-2 flex items-center justify-center mb-3 bg-white ${hasActive ? "border-primary border-[3px]" : "border-border"}`}>
                    {events.every(e => e.type === "done") && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                  </div>
                  {/* Events listed under the dot */}
                  <div className="space-y-1.5 w-full">
                    {events.map((m, i) => {
                      const isActive   = m.type === "active";
                      const isDone     = m.type === "done";
                      const isImported = importedEvents.some(e => e.date === m.date && e.label === m.label);
                      return (
                        <div key={i} className="text-left">
                          <p className={`text-xs font-semibold leading-tight ${isActive ? "text-primary" : isImported ? "text-secondary" : isDone ? "text-foreground" : "text-muted-foreground"}`}>
                            {format(new Date(m.date + "T12:00:00"), "MMM d")} — {m.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Planning Card */}
        <div className="bg-white border rounded-2xl p-5 flex gap-4 items-start">
          <img
            src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=100&h=100&fit=crop"
            alt="Planning"
            className="h-16 w-16 rounded-xl object-cover flex-shrink-0"
          />
          <div>
            <p className="font-bold text-base">Planning for Next Semester?</p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Course registration for Summer 2026 begins soon. Review your degree audit today.
            </p>
            <Link to="/courses" className="text-sm text-primary font-semibold hover:underline">
              Open Degree Audit →
            </Link>
          </div>
        </div>

        {/* AI Schedule Sync */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex gap-4 items-center">
          <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-primary text-base">AI Study Schedule Sync</p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Our AI can automatically generate a study breakdown based on these calendar milestones.
            </p>
            <Link to="/coach">
              <Button size="sm" className="rounded-xl bg-primary hover:bg-primary/90">Generate Schedule</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Semester Config Modal */}
      <AnimatePresence>
        {showConfig && (
          <SemesterConfig
            currentSemester={semester}
            onSemesterChange={handleSemesterChange}
            onClose={() => setShowConfig(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
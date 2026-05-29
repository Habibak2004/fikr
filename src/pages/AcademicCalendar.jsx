import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import { Settings2, Sparkles, CalendarClock, Info, ChevronDown, Star, Trash2, Plus, LayoutList, CalendarDays, Calendar, NotebookPen } from "lucide-react";
import { format, differenceInDays, isAfter, differenceInWeeks } from "date-fns";
import { Link } from "react-router-dom";
import SemesterConfig from "@/components/calendar/SemesterConfig";
import WeeklyView from "@/components/calendar/WeeklyView";
import MonthlyView from "@/components/calendar/MonthlyView";
import SemesterReflectionModal from "@/components/calendar/SemesterReflectionModal";
import { addDays } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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

const DEFAULT_CRITICAL_DEADLINES = [
  { label: "Last Day to Drop (without W)", detail: "Tonight at 11:59 PM",         urgency: "URGENT" },
  { label: "Last Day to Add",              detail: "Monday, May 11 • 3 days left", urgency: "UPCOMING" },
  { label: "Withdrawal Deadline",          detail: "Friday, May 15 • 7 days left", urgency: "PLANNING" },
];

export default function AcademicCalendar() {
  const { data: semesters = [] } = useQuery({
    queryKey: ["semesters"],
    queryFn: () => base44.entities.Semester.list("-created_date"),
  });

  const [semester, setSemester] = useState(() => {
    try {
      const s = localStorage.getItem("fikr_semester");
      if (s) return JSON.parse(s);
    } catch {}
    // Fallback to first semester from entities or default
    if (semesters.length > 0) {
      return { id: semesters[0].id, label: semesters[0].name, start: semesters[0].start_date, end: semesters[0].end_date };
    }
    return { label: "Spring 2026", start: "2026-01-19", end: "2026-05-15" };
  });
  const [importedEvents, setImportedEvents] = useState(() => {
    try { const e = localStorage.getItem("fikr_imported_events"); return e ? JSON.parse(e) : []; } catch { return []; }
  });
  const [showConfig, setShowConfig] = useState(false);
  const [criticalDeadlines, setCriticalDeadlines] = useState(() => {
    try {
      const d = localStorage.getItem("fikr_critical_deadlines");
      if (d !== null) return JSON.parse(d); // null means never saved; use defaults
      return DEFAULT_CRITICAL_DEADLINES;
    } catch { return DEFAULT_CRITICAL_DEADLINES; }
  });
  const [customMilestones, setCustomMilestones] = useState(() => {
    try { const m = localStorage.getItem("fikr_custom_milestones"); return m ? JSON.parse(m) : []; } catch { return []; }
  });
  const [editingDeadlines, setEditingDeadlines] = useState(false);
  const [editingTimeline, setEditingTimeline] = useState(false);
  const [viewRange, setViewRange] = useState(() => {
    try {
      const saved = localStorage.getItem("fikr_view_range");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { startDate: "", endDate: "" };
  });
  const [newDeadline, setNewDeadline] = useState({ label: "", detail: "", urgency: "UPCOMING", date: "" });
  const [newMilestone, setNewMilestone] = useState({ date: "", label: "", sub: "", type: "upcoming" });
  const [calendarView, setCalendarView] = useState("timeline"); // "timeline" | "weekly" | "monthly"
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showReflection, setShowReflection] = useState(false);
  const [reflectionType, setReflectionType] = useState("end_of_semester");
  const [today, setToday] = useState(new Date());
  const queryClient = useQueryClient();

  const saveReflectionMutation = useMutation({
    mutationFn: (reflectionData) => base44.entities.Reflection.create(reflectionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reflections"] });
    },
  });

  // Update "today" at midnight daily so countdowns refresh automatically
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = tomorrow - now;
    const timer = setTimeout(() => {
      setToday(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
    }, msUntilMidnight);
    return () => clearTimeout(timer);
  }, [today]);

  // Compute check-in dates from semester bounds
  const checkInMilestones = useMemo(() => {
    const start = new Date(semester.start + "T12:00:00");
    const end   = new Date(semester.end   + "T12:00:00");
    const total = differenceInDays(end, start);
    return [
      { date: semester.start, label: "Semester Setup Check-In", type: "checkin", reflectionType: "semester_setup", emoji: "🌱" },
      { date: format(addDays(start, Math.round(total * 0.33)), "yyyy-MM-dd"), label: "One-Third Check-In", type: "checkin", reflectionType: "one_third", emoji: "⅓" },
      { date: format(addDays(start, Math.round(total * 0.5)),  "yyyy-MM-dd"), label: "Mid-Semester Check-In", type: "checkin", reflectionType: "mid_semester", emoji: "🔄" },
      { date: semester.end,   label: "End-of-Semester Check-In", type: "checkin", reflectionType: "end_of_semester", emoji: "🎓" },
    ];
  }, [semester]);

  const saveCriticalDeadlines = (updated) => {
    setCriticalDeadlines(updated);
    try { localStorage.setItem("fikr_critical_deadlines", JSON.stringify(updated ?? [])); } catch {}
  };

  const saveViewRange = (updated) => {
    setViewRange(updated);
    try { localStorage.setItem("fikr_view_range", JSON.stringify(updated)); } catch {}
  };

  const saveCustomMilestones = (updated) => {
    setCustomMilestones(updated);
    try { localStorage.setItem("fikr_custom_milestones", JSON.stringify(updated)); } catch {}
  };

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => base44.entities.Assignment.list("-due_date", 200),
  });

  const { data: allCourses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list("-created_date", 50),
  });

  // Courses matching the active semester label
  const semesterCourses = allCourses.filter(c => c.semester === semester.label);

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
      combined = [...importedEvents];
    } else if (isSpring2026) {
      combined = [...DEFAULT_MILESTONES];
    } else {
      combined = [
        { date: semester.start, label: "Semester Start", sub: format(new Date(semester.start + "T12:00:00"), "MMM d"), type: "upcoming" },
        { date: semester.end,   label: "Semester End",   sub: format(new Date(semester.end   + "T12:00:00"), "MMM d"), type: "upcoming" },
      ];
    }
    // Merge custom milestones and check-ins
    combined = [...combined, ...customMilestones, ...checkInMilestones];
    combined.sort((a, b) => a.date.slice(0, 10).localeCompare(b.date.slice(0, 10)));
    return combined;
  }, [semester, importedEvents, customMilestones, checkInMilestones]);

  const nextMilestone = milestones.find(m => isAfter(new Date(m.date), now)) || milestones[milestones.length - 1];
  const daysUntilNext = nextMilestone ? differenceInDays(new Date(nextMilestone.date), now) : 0;

  // Reflection countdowns based on semester dates
  const reflectionCountdowns = useMemo(() => {
    const start = new Date(semester.start + "T12:00:00");
    const end = new Date(semester.end + "T12:00:00");
    const total = differenceInDays(end, start);
    const setupDate = start;
    const oneThirdDate = addDays(start, Math.round(total * 0.33));
    const midDate = addDays(start, Math.round(total * 0.5));
    return [
      { label: "Semester Setup", date: setupDate, days: Math.max(0, differenceInDays(setupDate, today)) },
      { label: "1/3 Check-In", date: oneThirdDate, days: Math.max(0, differenceInDays(oneThirdDate, today)) },
      { label: "Mid-Semester", date: midDate, days: Math.max(0, differenceInDays(midDate, today)) },
      { label: "End of Semester", date: end, days: Math.max(0, differenceInDays(end, today)) },
    ];
  }, [semester, today]);

  const handleSemesterChange = (newSemester, events = []) => {
    setSemester(newSemester);
    setImportedEvents(events);
    saveViewRange({ startDate: "", endDate: "" });
    try {
      localStorage.setItem("fikr_semester", JSON.stringify(newSemester));
      localStorage.setItem("fikr_imported_events", JSON.stringify(events));
    } catch {}
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
              {format(new Date(semester.start), "MMM d, yyyy")} → {format(new Date(semester.end), "MMM d, yyyy")}
            </p>
          </div>

          {/* Reflection Countdowns */}
          <div className="mt-5 pt-4 border-t border-border/60">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Reflection Checkpoints</p>
            <div className="grid grid-cols-3 gap-2">
              {reflectionCountdowns.map((r, i) => (
                <div key={i} className="bg-amber-50 rounded-lg p-2 text-center">
                  <p className="text-[10px] font-semibold text-amber-700 mb-0.5">{r.label}</p>
                  <p className="text-lg font-bold text-amber-800">{r.days}</p>
                  <p className="text-[9px] text-amber-600">days</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Critical Deadlines */}
        <div className="bg-white border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Critical Deadlines</h3>
            <button
              onClick={() => setEditingDeadlines(e => !e)}
              className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors ${editingDeadlines ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}
            >
              {editingDeadlines ? "Done" : "Edit"}
            </button>
          </div>
          <div className="space-y-2">
            {criticalDeadlines.map((d, i) => {
              const urgencyStyles = {
                URGENT:   { badge: "bg-red-100 text-red-600",       icon: "text-red-500",          bg: "bg-red-50" },
                UPCOMING: { badge: "bg-primary/10 text-primary",    icon: "text-primary",          bg: "bg-primary/10" },
                PLANNING: { badge: "bg-muted text-muted-foreground", icon: "text-muted-foreground", bg: "bg-muted" },
              }[d.urgency] || { badge: "bg-muted text-muted-foreground", icon: "text-muted-foreground", bg: "bg-muted" };

              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border/60">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${urgencyStyles.bg}`}>
                    <CalendarClock className={`h-4 w-4 ${urgencyStyles.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingDeadlines ? (
                      <>
                        <input
                          className="text-sm font-semibold w-full border-b border-border/60 outline-none bg-transparent mb-0.5"
                          value={d.label}
                          onChange={ev => {
                            const updated = [...criticalDeadlines];
                            updated[i] = { ...updated[i], label: ev.target.value };
                            saveCriticalDeadlines(updated);
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            className="text-xs border rounded-md px-1.5 py-0.5 bg-white outline-none w-32 shrink-0"
                            value={d.date || ""}
                            onChange={ev => {
                              const updated = [...criticalDeadlines];
                              updated[i] = { ...updated[i], date: ev.target.value };
                              saveCriticalDeadlines(updated);
                            }}
                          />
                          <input
                            className="text-xs text-muted-foreground flex-1 border-b border-border/40 outline-none bg-transparent"
                            value={d.detail}
                            placeholder="Detail..."
                            onChange={ev => {
                              const updated = [...criticalDeadlines];
                              updated[i] = { ...updated[i], detail: ev.target.value };
                              saveCriticalDeadlines(updated);
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold leading-tight">{d.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {d.date && <span className="font-medium text-foreground">{format(new Date(d.date + "T12:00:00"), "MMM d")} · </span>}
                          {d.detail}
                        </p>
                      </>
                    )}
                  </div>
                  {editingDeadlines ? (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <select
                        value={d.urgency}
                        onChange={ev => {
                          const updated = [...criticalDeadlines];
                          updated[i] = { ...updated[i], urgency: ev.target.value };
                          saveCriticalDeadlines(updated);
                        }}
                        className="text-[10px] font-bold rounded-md px-1.5 py-0.5 border outline-none"
                      >
                        <option value="URGENT">URGENT</option>
                        <option value="UPCOMING">UPCOMING</option>
                        <option value="PLANNING">PLANNING</option>
                      </select>
                      <button onClick={() => saveCriticalDeadlines(criticalDeadlines.filter((_, idx) => idx !== i))}>
                        <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                      </button>
                    </div>
                  ) : (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap flex-shrink-0 ${urgencyStyles.badge}`}>
                      {d.urgency}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Add new deadline */}
            {editingDeadlines && (
              <div className="space-y-2">
                {/* Pick from timeline */}
                {milestones.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Add from timeline</p>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      {milestones.filter(m => !criticalDeadlines.some(d => d.label === m.label)).map((m, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            saveCriticalDeadlines([...criticalDeadlines, {
                              label: m.label,
                              date: m.date.slice(0, 10),
                              detail: "",
                              urgency: "UPCOMING",
                            }]);
                          }}
                          className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-border/60 bg-white hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors"
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual entry */}
                <div className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-primary/30 bg-primary/5">
                  <div className="flex-1 space-y-1.5">
                    <input
                      placeholder="Custom deadline label..."
                      className="text-sm w-full border-b border-border/60 outline-none bg-transparent"
                      value={newDeadline.label}
                      onChange={ev => setNewDeadline(p => ({ ...p, label: ev.target.value }))}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        className="text-xs border rounded-md px-1.5 py-0.5 bg-white outline-none w-32 shrink-0"
                        value={newDeadline.date}
                        onChange={ev => setNewDeadline(p => ({ ...p, date: ev.target.value }))}
                      />
                      <input
                        placeholder="Detail (optional)"
                        className="text-xs text-muted-foreground flex-1 border-b border-border/40 outline-none bg-transparent"
                        value={newDeadline.detail}
                        onChange={ev => setNewDeadline(p => ({ ...p, detail: ev.target.value }))}
                      />
                    </div>
                  </div>
                  <select
                    value={newDeadline.urgency}
                    onChange={ev => setNewDeadline(p => ({ ...p, urgency: ev.target.value }))}
                    className="text-[10px] font-bold rounded-md px-1.5 py-0.5 border outline-none flex-shrink-0"
                  >
                    <option value="URGENT">URGENT</option>
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="PLANNING">PLANNING</option>
                  </select>
                  <button
                    onClick={() => {
                      if (!newDeadline.label.trim()) return;
                      saveCriticalDeadlines([...criticalDeadlines, { ...newDeadline }]);
                      setNewDeadline({ label: "", detail: "", urgency: "UPCOMING", date: "" });
                    }}
                    className="flex-shrink-0 h-7 w-7 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Views */}
      <div className="bg-white border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold">
              {calendarView === "timeline" ? "Semester Timeline" : calendarView === "weekly" ? "Weekly View" : "Monthly View"}
            </h3>
            {importedEvents.length > 0 && calendarView === "timeline" && (
              <p className="text-xs text-primary mt-0.5">{importedEvents.length} imported school events included</p>
            )}
          </div>
          <div className="flex items-center gap-2">
          {calendarView === "timeline" && (
            <button
              onClick={() => setEditingTimeline(e => !e)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${editingTimeline ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}
            >
              {editingTimeline ? "Done" : "Edit Timeline"}
            </button>
          )}
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
            {[
              { id: "timeline", icon: LayoutList, label: "Timeline" },
              { id: "weekly",   icon: CalendarDays, label: "Week" },
              { id: "monthly",  icon: Calendar, label: "Month" },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setCalendarView(id)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  calendarView === id ? "bg-white shadow text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
          </div>
        </div>

        {calendarView === "weekly" && (
          <WeeklyView
            currentDate={calendarDate}
            onDateChange={setCalendarDate}
            assignments={assignments}
            milestones={milestones}
            criticalDeadlines={criticalDeadlines}
          />
        )}

        {calendarView === "monthly" && (
          <MonthlyView
            currentDate={calendarDate}
            onDateChange={setCalendarDate}
            assignments={assignments}
            milestones={milestones}
            criticalDeadlines={criticalDeadlines}
          />
        )}

        {calendarView === "timeline" && (
        <div>
        {editingTimeline && (
          <div className="mb-5 p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Add Timeline Event</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-muted-foreground">View Range:</span>
                <input
                  type="date"
                  value={viewRange.startDate || ""}
                  onChange={(e) => saveViewRange({ ...viewRange, startDate: e.target.value })}
                  className="text-xs border rounded-md px-2 py-1 bg-white outline-none w-32"
                  placeholder="Start"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <input
                  type="date"
                  value={viewRange.endDate || ""}
                  onChange={(e) => saveViewRange({ ...viewRange, endDate: e.target.value })}
                  className="text-xs border rounded-md px-2 py-1 bg-white outline-none w-32"
                  placeholder="End"
                />
                <button
                  onClick={() => saveViewRange({ startDate: "", endDate: "" })}
                  className="text-[10px] font-semibold text-primary hover:underline ml-1"
                >
                  Reset
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-end">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Date</p>
                <input type="date" value={newMilestone.date} onChange={e => setNewMilestone(p => ({ ...p, date: e.target.value }))}
                  className="text-xs border rounded-lg px-2 py-1.5 bg-white outline-none focus:ring-1 focus:ring-primary/30 w-36" />
              </div>
              <div className="flex-1 min-w-40">
                <p className="text-[10px] text-muted-foreground mb-1">Label</p>
                <input placeholder="Event name..." value={newMilestone.label} onChange={e => setNewMilestone(p => ({ ...p, label: e.target.value }))}
                  className="text-xs border rounded-lg px-2 py-1.5 bg-white outline-none focus:ring-1 focus:ring-primary/30 w-full" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Type</p>
                <select value={newMilestone.type} onChange={e => setNewMilestone(p => ({ ...p, type: e.target.value }))}
                  className="text-xs border rounded-lg px-2 py-1.5 bg-white outline-none">
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <button
                onClick={() => {
                  if (!newMilestone.date || !newMilestone.label.trim()) return;
                  saveCustomMilestones([...customMilestones, { ...newMilestone, sub: newMilestone.date, _custom: true }]);
                  setNewMilestone({ date: "", label: "", sub: "", type: "upcoming" });
                }}
                className="h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            {customMilestones.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Your custom events</p>
                <div className="flex flex-wrap gap-1.5">
                  {customMilestones.map((m, i) => (
                    <div key={i} className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg border border-border/60 bg-white">
                      <span>{format(new Date(m.date + "T12:00:00"), "MMM d")} — {m.label}</span>
                      <button onClick={() => saveCustomMilestones(customMilestones.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 ml-1">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="overflow-x-auto -mx-6 px-6">
          <div className="flex gap-0 relative min-w-max">
            {/* Connecting line */}
            <div className="absolute top-[52px] left-[36px] right-[36px] h-0.5 bg-border" />

            {(() => {
              const regularMilestones = milestones.filter(m => m.type !== "checkin");
              const checkins = milestones.filter(m => m.type === "checkin");
              let checkinQueue = [...checkins].sort((a, b) => a.date.localeCompare(b.date));

              const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

              // Build global week buckets — use custom viewRange dates if set, otherwise use semester dates
              const semStart = new Date(semester.start + "T12:00:00");
              const semEnd   = new Date(semester.end   + "T12:00:00");
              const displayStart = viewRange.startDate ? new Date(viewRange.startDate + "T12:00:00") : new Date(semStart.getFullYear(), semStart.getMonth(), 1);
              const displayEnd   = viewRange.endDate ? new Date(viewRange.endDate + "T12:00:00") : new Date(semEnd.getFullYear(), semEnd.getMonth() + 1, 0);
              // Week 1 starts at displayStart (not the Monday before)
              const weekStart = new Date(displayStart);
              const totalWeeks = Math.ceil((displayEnd - weekStart) / (7 * 24 * 60 * 60 * 1000)) + 1;

              // Initialize all weeks (empty)
              const weekMap = {};
              for (let w = 0; w < totalWeeks; w++) {
                weekMap[w] = { weekNum: w, start: new Date(weekStart.getTime() + w * 7 * 24 * 60 * 60 * 1000), events: [] };
              }

              // Assign each regular milestone to its week
              for (const m of regularMilestones) {
                if (!m.date || typeof m.date !== "string") continue;
                const datePart = m.date.slice(0, 10);
                if (!datePart.match(/^\d{4}-\d{2}-\d{2}$/)) continue;
                const d = new Date(datePart + "T12:00:00");
                const weekNum = Math.floor((d - weekStart) / (7 * 24 * 60 * 60 * 1000));
                if (weekMap[weekNum]) weekMap[weekNum].events.push({ ...m, date: datePart });
              }
              const weeks = Object.values(weekMap).sort((a, b) => a.weekNum - b.weekNum);

              // Pull out setup checkin to render first
              const setupCheckin = checkinQueue.find(c => c.reflectionType === "semester_setup");
              if (setupCheckin) checkinQueue = checkinQueue.filter(c => c.reflectionType !== "semester_setup");

              const renderCheckinCol = (m, key) => (
                <div key={key} className="flex flex-col items-center text-center w-32 flex-shrink-0 px-2">
                  <p className="text-[10px] font-bold tracking-widest uppercase mb-3 text-amber-600">REFLECT</p>
                  <button
                    onClick={() => { setReflectionType(m.reflectionType); setShowReflection(true); }}
                    className="h-5 w-5 rounded-full z-10 border-2 border-amber-400 flex items-center justify-center mb-3 bg-amber-50 hover:bg-amber-100 transition-colors"
                  >
                    <div className="h-2 w-2 rounded-full bg-amber-400" />
                  </button>
                  <button
                    onClick={() => { setReflectionType(m.reflectionType); setShowReflection(true); }}
                    className="text-xs font-semibold leading-tight text-amber-600 hover:text-amber-700 hover:underline transition-colors"
                  >
                    {m.emoji} {m.label.replace(" Check-In", "")}
                  </button>
                </div>
              );

              const nodes = [];
              if (setupCheckin) nodes.push(renderCheckinCol(setupCheckin, "setup"));

              let lastMonth = null;

              for (const wk of weeks) {
                const isFirstWeek = wk.weekNum === 0;
                const wkEnd = new Date(wk.start.getTime() + 6 * 24 * 60 * 60 * 1000);
                // Determine the month to display: use the 1st of the month if this week contains it, otherwise use the week start
                let monthDay = wk.start;
                for (let d = 0; d < 7; d++) {
                  const day = new Date(wk.start.getTime() + d * 24 * 60 * 60 * 1000);
                  if (day.getDate() === 1) { monthDay = day; break; }
                }
                const wkMonthKey = format(monthDay, "yyyy-MM");
                const wkMonthIdx = monthDay.getMonth();
                const monthChanged = isFirstWeek || wkMonthKey !== lastMonth;
                const globalWeekNum = wk.weekNum + 1; // 1-based
                const hasActive = wk.events.some(e => e.type === "active");
                const allDone = wk.events.every(e => e.type === "done");

                nodes.push(
                  <div key={`wk-${wk.weekNum}`} className="flex flex-col items-start text-left w-44 flex-shrink-0 px-3">
                    {/* Month label — only when month changes */}
                    <p className={`text-[10px] font-bold tracking-widest uppercase mb-3 ${monthChanged ? (hasActive ? "text-primary" : "text-muted-foreground") : "text-transparent select-none"}`}>
                      {monthChanged ? MONTH_NAMES[wkMonthIdx] : "·"}
                    </p>
                    {/* Dot */}
                    <div className={`h-5 w-5 rounded-full z-10 border-2 flex items-center justify-center mb-2 bg-white ${hasActive ? "border-primary border-[3px]" : "border-border"}`}>
                      {allDone && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                    </div>
                    {/* Week label */}
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-1.5">
                      Week {globalWeekNum} <span className="font-normal">({format(wk.start, "MMM d")}–{format(wkEnd, "MMM d")})</span>
                    </p>
                    {/* Events */}
                    <div className="space-y-1 w-full">
                      {wk.events.map((ev, i) => {
                        const isActive   = ev.type === "active";
                        const isDone     = ev.type === "done";
                        const isImported = importedEvents.some(e => e.date === ev.date && e.label === ev.label);
                        const isBreak    = /break|recess|holiday|no class|vacation/i.test(ev.label);
                        const isStarred  = criticalDeadlines.some(d => d.label === ev.label);
                        return (
                          <div key={i} className="flex items-start gap-1 group">
                            <p className={`text-xs font-semibold leading-tight flex-1 ${
                              isBreak ? "text-emerald-600" : isActive ? "text-primary" : isImported ? "text-secondary" : isDone ? "text-foreground" : "text-muted-foreground"
                            }`}>
                              <span className="font-bold">{format(new Date(ev.date + "T12:00:00"), "MMM d")}</span> — {ev.label}
                            </p>
                            <button
                              title={isStarred ? "Remove" : "Star"}
                              onClick={() => {
                                if (isStarred) {
                                  saveCriticalDeadlines(criticalDeadlines.filter(d => d.label !== ev.label));
                                } else {
                                  saveCriticalDeadlines([...criticalDeadlines, {
                                    label: ev.label, date: ev.date.slice(0, 10),
                                    detail: format(new Date(ev.date + "T12:00:00"), "MMM d"), urgency: "UPCOMING",
                                  }]);
                                }
                              }}
                              className={`flex-shrink-0 transition-opacity ${isStarred ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`}
                            >
                              <Star className={`h-3 w-3 ${isStarred ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );

                lastMonth = wkMonthKey;

                // Insert check-ins whose date falls within this week (wkEnd already defined above)
                const wkCheckins = checkinQueue.filter(c => {
                  const d = new Date(c.date.slice(0,10) + "T12:00:00");
                  return d >= wk.start && d <= wkEnd;
                });
                wkCheckins.forEach((c, i) => nodes.push(renderCheckinCol(c, `ci-wk${wk.weekNum}-${i}`)));
                checkinQueue = checkinQueue.filter(c => {
                  const d = new Date(c.date.slice(0,10) + "T12:00:00");
                  return !(d >= wk.monday && d <= wkEnd);
                });
              }

              // Remaining check-ins
              checkinQueue.forEach((c, i) => nodes.push(renderCheckinCol(c, `trail-${i}`)));

              return nodes;
            })()}
          </div>
        </div>
        </div>
        )}
      </div>

      {/* Bottom Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

        {/* Semester Reflection */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 items-center">
          <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow text-2xl">
            🎓
          </div>
          <div className="flex-1">
            <p className="font-bold text-amber-800 text-base">Semester Reflection</p>
            <p className="text-xs text-amber-700/70 mt-1 mb-3">
              Take a moment to reflect on {semester.label} — your wins, challenges, and lessons learned.
            </p>
            <Button size="sm" onClick={() => { setReflectionType("end_of_semester"); setShowReflection(true); }} className="rounded-xl bg-amber-700 hover:bg-amber-800 text-white">
              <NotebookPen className="h-3.5 w-3.5 mr-1.5" /> Start Reflection
            </Button>
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

      <SemesterReflectionModal
        open={showReflection}
        onClose={() => setShowReflection(false)}
        semesterLabel={semester.label}
        courses={semesterCourses}
        reflectionType={reflectionType}
        onSave={saveReflectionMutation.mutate}
      />
    </div>
  );
}
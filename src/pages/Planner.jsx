import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Bell, ChevronRight, LayoutList, CalendarDays, Calendar, Sparkles } from "lucide-react";
import { isBefore } from "date-fns";
import WeeklyView from "@/components/calendar/WeeklyView";
import MonthlyView from "@/components/calendar/MonthlyView";
import { Link } from "react-router-dom";

import AIGuidanceBanner from "@/components/planner/AIGuidanceBanner";
import QuickWins from "@/components/planner/QuickWins";
import AICommandBar from "@/components/planner/AICommandBar";
import TaskTimeline from "@/components/planner/TaskTimeline";
import LifeRadar from "@/components/planner/LifeRadar";
import IdeaPad from "@/components/planner/IdeaPad";
import TodayEngine from "@/components/planner/TodayEngine";

export default function Planner() {
  const [showAdd, setShowAdd] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [catchupMode, setCatchupMode] = useState(false);
  const [pausedTask, setPausedTask] = useState(null);
  const [taskView, setTaskView] = useState("today"); // "today" | "list" | "weekly" | "monthly"
  const [calendarDate, setCalendarDate] = useState(new Date());
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => setUserEmail(u?.email)).catch(() => {});
  }, []);

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments", userEmail],
    queryFn: () => base44.entities.Assignment.filter({ created_by: userEmail }, "-due_date", 200),
    enabled: !!userEmail,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses", userEmail],
    queryFn: () => base44.entities.Course.filter({ created_by: userEmail }, "-created_date", 50),
    enabled: !!userEmail,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }) => base44.entities.Assignment.update(id, { completed, status: completed ? "submitted" : "pending" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assignments"] }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Assignment.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["assignments"] }); setShowAdd(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Assignment.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assignments"] }),
  });

  const now = new Date();
  const overdue = assignments.filter(a => !a.completed && a.due_date && isBefore(new Date(a.due_date), now));
  const isOverloaded = overdue.length >= 3 || assignments.filter(a => !a.completed).length > 10;

  const handleModeChange = (mode) => {
    if (mode === "catchup") setCatchupMode(true);
  };

  const handleStartFocus = (task) => {
    setPausedTask(task);
    window.open("/focus", "_blank");
  };

  const handleToggle = (a) => {
    toggleMutation.mutate({ id: a.id, completed: !a.completed });
  };

  // Catch-up mode: simplified view
  if (catchupMode) {
    const topThree = assignments.filter(a => !a.completed).slice(0, 3);
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
        <div className="text-center py-6">
          <p className="text-3xl mb-3">🌿</p>
          <h1 className="text-2xl font-bold mb-2">Let's stabilize first.</h1>
          <p className="text-muted-foreground">We've simplified your view. Just three things to focus on.</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
          You don't need to do everything. You just need to do the next right thing.
        </div>

        <div className="space-y-3">
          {topThree.map((a, i) => (
            <div key={a.id} className="bg-white border border-border rounded-2xl p-4 flex items-center gap-3">
              <span className="h-7 w-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <div className="flex-1">
                <p className="font-medium text-sm">{a.name}</p>
                {a.course_name && <p className="text-xs text-muted-foreground">{a.course_name}</p>}
              </div>
              <button
                onClick={() => handleToggle(a)}
                className="text-xs text-muted-foreground hover:text-green-600 border rounded-lg px-2.5 py-1.5 transition-colors hover:border-green-300"
              >
                Done
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setCatchupMode(false)}>
            Show full planner
          </Button>
          <Link to="/reset-room" className="flex-1">
            <Button className="w-full rounded-xl">Restorative Reset</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight">Planner</h1>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
            <Bell className="h-4 w-4" />
          </button>
          <Button
            onClick={() => setShowAdd(true)}
            size="sm"
            className="rounded-xl bg-primary hover:bg-primary/90 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Add Task
          </Button>
        </div>
      </div>

      {/* AI Command Bar */}
      <div className="mb-5">
        <AICommandBar
          assignments={assignments}
          onModeChange={handleModeChange}
          onAddTasks={(tasks) => tasks.forEach(t => createMutation.mutate({ name: t.name, due_date: t.due_date || "", priority: t.priority || "medium", type: "homework", course_id: "" }))}
        />
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

        {/* LEFT: Timeline + Quick features */}
        <div className="space-y-5 min-w-0">

          {/* Quick Wins */}
          <div className="bg-white border border-border/60 rounded-2xl p-5">
            <QuickWins />
          </div>

          {/* AI Guidance Banner */}
          <AIGuidanceBanner assignments={assignments} />

          {/* Overload warning */}
          {isOverloaded && !catchupMode && (
            <button
              onClick={() => setCatchupMode(true)}
              className="w-full flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 hover:bg-amber-100 transition-colors"
            >
              <div className="text-left">
                <p className="text-sm font-semibold text-amber-800">High cognitive load detected</p>
                <p className="text-xs text-amber-700 mt-0.5">Switch to Catch-Up Mode to stabilize.</p>
              </div>
              <ChevronRight className="h-4 w-4 text-amber-600 flex-shrink-0" />
            </button>
          )}

          {/* Task Timeline */}
          <div className="bg-white/60 rounded-2xl p-5 border border-border/40">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-base">
                {taskView === "today" ? "Today's Priorities" : taskView === "list" ? "All Tasks" : taskView === "weekly" ? "This Week" : "This Month"}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {assignments.filter(a => !a.completed).length} remaining
                </span>
                <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
                  {[
                    { id: "today",   icon: Sparkles,    label: "Today" },
                    { id: "list",    icon: LayoutList,  label: "All" },
                    { id: "weekly",  icon: CalendarDays, label: "Week" },
                    { id: "monthly", icon: Calendar,     label: "Month" },
                  ].map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setTaskView(id)}
                      title={label}
                      className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all ${
                        taskView === id ? "bg-white shadow text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {taskView === "today" && (
              <TodayEngine
                assignments={assignments}
                onStartFocus={handleStartFocus}
                onToggle={handleToggle}
              />
            )}
            {taskView === "list" && (
              <TaskTimeline
                assignments={assignments}
                courses={courses}
                pausedTask={pausedTask}
                onStartFocus={handleStartFocus}
                onToggle={handleToggle}
                onUpdate={(id, data) => updateMutation.mutate({ id, data })}
                onQuickAdd={(name) => createMutation.mutate({ name, priority: "medium", type: "homework", course_id: "" })}
                allAssignments={assignments}
                onEdit={(task) => setEditingTask(task)}
              />
            )}
            {taskView === "weekly" && (
              <WeeklyView
                currentDate={calendarDate}
                onDateChange={setCalendarDate}
                assignments={assignments}
                milestones={[]}
                criticalDeadlines={[]}
              />
            )}
            {taskView === "monthly" && (
              <MonthlyView
                currentDate={calendarDate}
                onDateChange={setCalendarDate}
                assignments={assignments}
                milestones={[]}
                criticalDeadlines={[]}
              />
            )}
          </div>
        </div>

        {/* RIGHT: Life Radar */}
        <div className="bg-white border border-border/60 rounded-2xl p-5 h-fit lg:sticky lg:top-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center">
              <span className="text-[11px]">📡</span>
            </div>
            <h2 className="font-bold text-sm">Life Radar</h2>
          </div>
          <LifeRadar assignments={assignments} />
          <div className="mt-5 pt-5 border-t border-border/40">
            <IdeaPad />
          </div>
        </div>
      </div>

      <AddAssignmentModal open={showAdd} onClose={() => setShowAdd(false)} courses={courses} onSave={d => createMutation.mutate(d)} />
      {editingTask && (
        <EditAssignmentModal
          task={editingTask}
          courses={courses}
          onClose={() => setEditingTask(null)}
          onSave={(id, data) => { updateMutation.mutate({ id, data }); setEditingTask(null); }}
        />
      )}
    </div>
  );
}

function EditAssignmentModal({ task, onClose, courses, onSave }) {
  const [form, setForm] = useState({
    name: task.name || "",
    course_id: task.course_id || "",
    type: task.type || "homework",
    due_date: task.due_date ? task.due_date.slice(0, 16) : "",
    priority: task.priority || "medium",
    notes: task.notes || "",
    weight: task.weight || "",
  });

  const handleSave = () => {
    if (!form.name) return;
    const course = courses.find(c => c.id === form.course_id);
    onSave(task.id, {
      ...form,
      course_name: course?.name || task.course_name || "",
      course_color: course?.color || task.course_color || "#0061a4",
      weight: form.weight ? Number(form.weight) : undefined,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="rounded-xl mt-1" /></div>
          <div>
            <Label>Course (optional)</Label>
            <Select value={form.course_id} onValueChange={v => setForm(p => ({ ...p, course_id: v }))}>
              <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Select course" /></SelectTrigger>
              <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{["homework", "exam", "quiz", "project", "paper", "lab", "other"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{["low", "medium", "high"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Due Date</Label><Input type="datetime-local" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} className="rounded-xl mt-1" /></div>
          <div><Label>Grade Weight % (optional)</Label><Input type="number" min="0" max="100" value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))} className="rounded-xl mt-1" placeholder="e.g. 20" /></div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="rounded-xl mt-1" rows={2} /></div>
          <Button onClick={handleSave} className="w-full rounded-xl bg-primary hover:bg-primary/90">Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddAssignmentModal({ open, onClose, courses, onSave }) {
  const [form, setForm] = useState({ name: "", course_id: "", type: "homework", due_date: "", priority: "medium", notes: "" });

  const handleSave = () => {
    if (!form.name) return;
    const course = courses.find(c => c.id === form.course_id);
    onSave({ ...form, course_name: course?.name || "", course_color: course?.color || "#0061a4" });
    setForm({ name: "", course_id: "", type: "homework", due_date: "", priority: "medium", notes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="rounded-xl mt-1" placeholder="What needs to happen?" /></div>
          <div>
            <Label>Course (optional)</Label>
            <Select value={form.course_id} onValueChange={v => setForm(p => ({ ...p, course_id: v }))}>
              <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Select course" /></SelectTrigger>
              <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{["homework", "exam", "quiz", "project", "paper", "lab", "other"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{["low", "medium", "high"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Due Date</Label><Input type="datetime-local" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} className="rounded-xl mt-1" /></div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="rounded-xl mt-1" rows={2} /></div>
          <Button onClick={handleSave} className="w-full rounded-xl bg-primary hover:bg-primary/90">Add Task</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Filter, CalendarDays, AlertTriangle } from "lucide-react";
import { format, differenceInDays, isAfter, isBefore, addDays, startOfWeek, endOfWeek } from "date-fns";
import { motion } from "framer-motion";

export default function Planner() {
  const [showAdd, setShowAdd] = useState(false);
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const queryClient = useQueryClient();

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => base44.entities.Assignment.list("-due_date", 200),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list("-created_date", 50),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }) => base44.entities.Assignment.update(id, { completed, status: completed ? "submitted" : "pending" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assignments"] }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Assignment.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["assignments"] }); setShowAdd(false); },
  });

  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const nextWeekEnd = addDays(weekEnd, 7);

  const filtered = assignments.filter(a => {
    if (filterCourse !== "all" && a.course_id !== filterCourse) return false;
    if (filterType !== "all" && a.type !== filterType) return false;
    return true;
  });

  const groups = {
    overdue: filtered.filter(a => !a.completed && a.due_date && isBefore(new Date(a.due_date), now)),
    thisWeek: filtered.filter(a => !a.completed && a.due_date && isAfter(new Date(a.due_date), now) && isBefore(new Date(a.due_date), weekEnd)),
    nextWeek: filtered.filter(a => !a.completed && a.due_date && isAfter(new Date(a.due_date), weekEnd) && isBefore(new Date(a.due_date), nextWeekEnd)),
    upcoming: filtered.filter(a => !a.completed && a.due_date && isAfter(new Date(a.due_date), nextWeekEnd)),
    completed: filtered.filter(a => a.completed),
  };

  const urgencyClass = (dueDate) => {
    if (!dueDate) return "";
    const days = differenceInDays(new Date(dueDate), now);
    if (days < 1) return "border-l-4 border-l-destructive";
    if (days <= 3) return "border-l-4 border-l-amber-500";
    return "";
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Planner</h1>
          <p className="text-muted-foreground mt-1">All your deadlines in one place</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="rounded-xl bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" /> Add Assignment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterCourse} onValueChange={setFilterCourse}>
          <SelectTrigger className="w-40 rounded-xl"><SelectValue placeholder="All Courses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36 rounded-xl"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {["homework", "exam", "quiz", "project", "paper", "lab"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Groups */}
      {Object.entries(groups).map(([key, items]) => {
        if (items.length === 0 && key === "completed") return null;
        const labels = { overdue: "Overdue", thisWeek: "This Week", nextWeek: "Next Week", upcoming: "Upcoming", completed: "Completed" };
        const colors = { overdue: "text-destructive", thisWeek: "text-primary", nextWeek: "text-secondary", upcoming: "text-muted-foreground", completed: "text-green-600" };

        return (
          <div key={key}>
            <div className="flex items-center gap-2 mb-3">
              {key === "overdue" && <AlertTriangle className="h-4 w-4 text-destructive" />}
              <h3 className={`font-semibold text-sm uppercase tracking-wide ${colors[key]}`}>{labels[key]}</h3>
              <Badge variant="outline" className="text-[10px]">{items.length}</Badge>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground mb-6 pl-4">Nothing here — great job! 🎉</p>
            ) : (
              <div className="space-y-2 mb-6">
                {items.map((a, i) => (
                  <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className={`p-4 rounded-2xl flex items-center gap-3 hover:shadow-md transition-shadow ${urgencyClass(a.due_date)}`}>
                      <Checkbox checked={a.completed} onCheckedChange={(v) => toggleMutation.mutate({ id: a.id, completed: v })} />
                      <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: a.course_color || "hsl(var(--primary))" }} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${a.completed ? "line-through text-muted-foreground" : ""}`}>{a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.course_name}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] hidden sm:flex">{a.type}</Badge>
                      {a.due_date && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(a.due_date), "MMM d")}</span>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <AddAssignmentModal open={showAdd} onClose={() => setShowAdd(false)} courses={courses} onSave={d => createMutation.mutate(d)} />
    </div>
  );
}

function AddAssignmentModal({ open, onClose, courses, onSave }) {
  const [form, setForm] = useState({ name: "", course_id: "", type: "homework", due_date: "", priority: "medium", notes: "" });

  const handleSave = () => {
    if (!form.name) return;
    const course = courses.find(c => c.id === form.course_id);
    onSave({
      ...form,
      course_name: course?.name || "",
      course_color: course?.color || "#0061a4",
    });
    setForm({ name: "", course_id: "", type: "homework", due_date: "", priority: "medium", notes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader><DialogTitle>Add Assignment</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="rounded-xl mt-1" /></div>
          <div>
            <Label>Course</Label>
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
                <SelectContent>{["homework", "exam", "quiz", "project", "paper", "lab"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
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
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="rounded-xl mt-1" /></div>
          <Button onClick={handleSave} className="w-full rounded-xl bg-primary hover:bg-primary/90">Add Assignment</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
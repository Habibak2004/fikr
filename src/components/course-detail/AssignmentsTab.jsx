import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, CheckCircle2, Clock, AlertCircle, Loader, BellRing } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

const typeColors = {
  homework: "border border-blue-400 text-blue-600",
  exam:     "border border-red-400 text-red-500",
  quiz:     "border border-purple-400 text-purple-600",
  project:  "border border-orange-400 text-orange-500",
  paper:    "border border-violet-400 text-violet-600",
  lab:      "border border-green-400 text-green-600",
  presentation: "border border-pink-400 text-pink-500",
  other:    "border border-gray-300 text-gray-500",
};

const typeLabels = {
  homework: "Homework", exam: "Exam", quiz: "Quiz", project: "Project",
  paper: "Essay / Paper", lab: "Lab", presentation: "Presentation", other: "Other"
};

const statusConfig = {
  pending:     { label: "Upcoming",    Icon: Clock,        color: "text-primary" },
  submitted:   { label: "Submitted",   Icon: CheckCircle2, color: "text-green-600" },
  graded:      { label: "Completed",   Icon: CheckCircle2, color: "text-green-600" },
  late:        { label: "Late",        Icon: AlertCircle,  color: "text-red-500" },
  missed:      { label: "Missed",      Icon: AlertCircle,  color: "text-red-500" },
  in_progress: { label: "In Progress", Icon: Loader,       color: "text-amber-500" },
};

const priorityOptions = [
  { value: "low",    label: "Low",    dot: "bg-green-500" },
  { value: "medium", label: "Medium", dot: "bg-amber-500" },
  { value: "high",   label: "High",   dot: "bg-red-500" },
];

const EMPTY_FORM = { name: "", description: "", type: "homework", weight: "", grade: "", status: "pending", due_date: "", priority: "medium", reminder: false };

function gradeDisplay(grade) {
  if (grade == null) return <span className="text-muted-foreground">–</span>;
  if (grade >= 10) return <span className="text-primary font-bold">{grade}/100</span>;
  const letters = ["F","D","C-","C","C+","B-","B","B+","A-","A"];
  return <span className="text-primary font-bold">{letters[Math.min(Math.round(grade), 9)]}</span>;
}

function formatDateForInput(dateStr) {
  if (!dateStr) return "";
  try { return new Date(dateStr).toISOString().slice(0, 16); }
  catch { return ""; }
}

function AssignmentModal({ open, onClose, onSave, initial, title, isSaving }) {
  const [form, setForm] = useState(initial);
  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleSave = () => {
    if (!form.name) return;
    onSave({
      name: form.name,
      description: form.description || undefined,
      type: form.type,
      weight: form.weight !== "" ? +form.weight : undefined,
      grade: form.grade !== "" ? +form.grade : undefined,
      status: form.status,
      due_date: form.due_date || undefined,
      priority: form.priority,
      reminder: form.reminder,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-extrabold">{title}</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="text-sm font-semibold mb-1.5 block">Assignment Name</label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Final Research Paper" className="rounded-xl" />
          </div>

          {/* Type + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Type</label>
              <Select value={form.type} onValueChange={v => set("type", v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Due Date</label>
              <Input type="datetime-local" value={form.due_date} onChange={e => set("due_date", e.target.value)} className="rounded-xl" />
            </div>
          </div>

          {/* Weight + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Weight (%)</label>
              <Input type="number" value={form.weight} onChange={e => set("weight", e.target.value)} placeholder="e.g. 15" className="rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Priority</label>
              <div className="flex gap-2">
                {priorityOptions.map(p => (
                  <button
                    key={p.value}
                    onClick={() => set("priority", p.value)}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2 text-sm font-semibold transition-all ${form.priority === p.value ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${p.dot}`} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Status + Grade (for editing) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Status</label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Grade (0–100)</label>
              <Input type="number" value={form.grade} onChange={e => set("grade", e.target.value)} placeholder="—" className="rounded-xl" />
            </div>
          </div>

          {/* Notes / Description */}
          <div>
            <label className="text-sm font-semibold mb-1.5 block">Notes / Description</label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Specific instructions, topics, links, or sub-tasks…" className="rounded-xl resize-none h-24" />
          </div>

          {/* Reminder */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border">
            <div className="flex items-center gap-3">
              <BellRing className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">Set study reminder</p>
                <p className="text-xs text-muted-foreground">AI-optimised schedule alerts</p>
              </div>
            </div>
            <Switch checked={form.reminder} onCheckedChange={v => set("reminder", v)} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-xl px-6">Cancel</Button>
          <Button onClick={handleSave} disabled={!form.name || isSaving} className="rounded-xl px-6 bg-primary hover:bg-primary/90">
            {isSaving ? "Saving…" : "Save Assignment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AssignmentsTab({ courseId, assignments, courseName, courseColor }) {
  const [adding, setAdding] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["assignments", courseId] });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Assignment.create(data),
    onSuccess: () => { invalidate(); setAdding(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Assignment.update(id, data),
    onSuccess: () => { invalidate(); setEditingAssignment(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Assignment.delete(id),
    onSuccess: invalidate,
  });

  return (
    <div className="bg-white border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <h3 className="text-2xl font-extrabold">Assignments & Grades</h3>
        <button onClick={() => setAdding(true)} className="text-sm text-primary font-semibold hover:underline">
          + Add
        </button>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-[2.5fr_90px_80px_110px_140px_36px] px-6 pb-2 border-b">
        <span className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">Assignment</span>
        <span className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">Type</span>
        <span className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">Weight</span>
        <span className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">Grade</span>
        <span className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">Status</span>
        <span />
      </div>

      {/* Rows */}
      {assignments.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-muted-foreground">
          No assignments yet. Upload a syllabus or add one manually.
        </div>
      ) : (
        assignments.map((a) => {
          const s = statusConfig[a.status] || statusConfig.pending;
          const { Icon } = s;
          return (
            <div
              key={a.id}
              className="grid grid-cols-[2.5fr_90px_80px_110px_140px_36px] items-center px-6 py-5 border-b last:border-b-0 hover:bg-muted/20 group transition-colors cursor-pointer"
              onClick={() => setEditingAssignment(a)}
            >
              <div>
                <p className="text-base font-bold leading-snug">{a.name}</p>
                {a.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.description}</p>}
                {a.due_date && (() => { const d = new Date(a.due_date); return isNaN(d) ? null : <p className="text-xs text-muted-foreground mt-0.5">Due: {format(d, "MMM dd, yyyy")}</p>; })()}
              </div>
              <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md bg-transparent ${typeColors[a.type] || typeColors.other}`}>
                  {a.type === "homework" ? "HW" : a.type === "presentation" ? "PRES" : a.type === "paper" ? "ESSAY" : (a.type || "other").toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-foreground">{a.weight ? `${a.weight}%` : "–"}</span>
              <span className="text-sm">{gradeDisplay(a.grade)}</span>
              <div className={`flex items-center gap-1.5 ${s.color}`}>
                <Icon className="h-4 w-4" />
                <span className="text-sm font-semibold">{s.label}</span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => deleteMutation.mutate(a.id)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Add Modal */}
      {adding && (
        <AssignmentModal
          open={adding}
          onClose={() => setAdding(false)}
          title="Add New Assignment"
          initial={EMPTY_FORM}
          isSaving={createMutation.isPending}
          onSave={(data) => createMutation.mutate({ ...data, course_id: courseId, course_name: courseName, course_color: courseColor })}
        />
      )}

      {/* Edit Modal */}
      {editingAssignment && (
        <AssignmentModal
          open={!!editingAssignment}
          onClose={() => setEditingAssignment(null)}
          title="Edit Assignment"
          initial={{
            name: editingAssignment.name || "",
            description: editingAssignment.description || "",
            type: editingAssignment.type || "homework",
            weight: editingAssignment.weight ?? "",
            grade: editingAssignment.grade ?? "",
            status: editingAssignment.status || "pending",
            due_date: formatDateForInput(editingAssignment.due_date),
            priority: editingAssignment.priority || "medium",
            reminder: editingAssignment.reminder || false,
          }}
          isSaving={updateMutation.isPending}
          onSave={(data) => updateMutation.mutate({ id: editingAssignment.id, data })}
        />
      )}
    </div>
  );
}
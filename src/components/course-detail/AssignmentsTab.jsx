import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Trash2, CheckCircle2, Clock, AlertCircle, Loader, Pencil } from "lucide-react";
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
  homework: "HW", exam: "EXAM", quiz: "QUIZ", project: "PROJECT",
  paper: "ESSAY", lab: "LAB", presentation: "PRES", other: "OTHER"
};

const statusConfig = {
  pending:     { label: "Upcoming",     Icon: Clock,        color: "text-primary" },
  submitted:   { label: "Submitted",    Icon: CheckCircle2, color: "text-green-600" },
  graded:      { label: "Completed",    Icon: CheckCircle2, color: "text-green-600" },
  late:        { label: "Late",         Icon: AlertCircle,  color: "text-red-500" },
  missed:      { label: "Missed",       Icon: AlertCircle,  color: "text-red-500" },
  in_progress: { label: "In Progress",  Icon: Loader,       color: "text-amber-500" },
};

function gradeDisplay(grade) {
  if (grade == null) return <span className="text-muted-foreground">–</span>;
  if (grade >= 10) return <span className="text-primary font-bold">{grade}/100</span>;
  const letters = ["F","D","C-","C","C+","B-","B","B+","A-","A"];
  return <span className="text-primary font-bold">{letters[Math.min(Math.round(grade), 9)]}</span>;
}

function formatDateForInput(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toISOString().slice(0, 16);
  } catch { return ""; }
}

function EditRow({ a, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: a.name || "",
    type: a.type || "homework",
    weight: a.weight ?? "",
    grade: a.grade ?? "",
    status: a.status || "pending",
    due_date: formatDateForInput(a.due_date),
  });

  const handleSave = () => {
    onSave({
      name: form.name,
      type: form.type,
      weight: form.weight !== "" ? +form.weight : undefined,
      grade:  form.grade  !== "" ? +form.grade  : undefined,
      status: form.status,
      due_date: form.due_date || undefined,
    });
  };

  return (
    <div className="grid grid-cols-[2.5fr_90px_80px_110px_140px_36px] items-center px-6 py-3 border-b bg-primary/5 gap-2">
      <div className="flex flex-col gap-1">
        <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Name" className="h-8 rounded-lg text-sm" />
        <Input type="datetime-local" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} className="h-8 rounded-lg text-xs" />
      </div>
      <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
        <SelectTrigger className="h-8 rounded-lg text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
      </Select>
      <Input type="number" value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))} placeholder="%" className="h-8 w-16 rounded-lg text-sm" />
      <Input type="number" value={form.grade} onChange={e => setForm(p => ({ ...p, grade: e.target.value }))} placeholder="—" className="h-8 w-16 rounded-lg text-sm" />
      <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
        <SelectTrigger className="h-8 rounded-lg text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>{Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
      </Select>
      <div className="flex gap-1">
        <button onClick={handleSave} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-green-50 text-green-600"><Check className="h-3.5 w-3.5" /></button>
        <button onClick={onCancel} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
      </div>
    </div>
  );
}

export default function AssignmentsTab({ courseId, assignments, courseName, courseColor }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newItem, setNewItem] = useState({ name: "", type: "homework", weight: "", grade: "", status: "pending", due_date: "" });
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["assignments", courseId] });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Assignment.create(data),
    onSuccess: () => { invalidate(); setAdding(false); setNewItem({ name: "", type: "homework", weight: "", grade: "", status: "pending", due_date: "" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Assignment.update(id, data),
    onSuccess: () => { invalidate(); setEditingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Assignment.delete(id),
    onSuccess: invalidate,
  });

  const handleCreate = () => {
    if (!newItem.name) return;
    createMutation.mutate({
      ...newItem,
      weight: newItem.weight !== "" ? +newItem.weight : undefined,
      grade:  newItem.grade  !== "" ? +newItem.grade  : undefined,
      course_id: courseId,
      course_name: courseName,
      course_color: courseColor,
    });
  };

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

      {/* Add Row */}
      {adding && (
        <div className="grid grid-cols-[2.5fr_90px_80px_110px_140px_36px] items-center px-6 py-3 border-b bg-primary/5 gap-2">
          <div className="flex flex-col gap-1">
            <Input value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} placeholder="Name" className="h-8 rounded-lg text-sm" />
            <Input type="datetime-local" value={newItem.due_date} onChange={e => setNewItem(p => ({ ...p, due_date: e.target.value }))} className="h-8 rounded-lg text-xs" />
          </div>
          <Select value={newItem.type} onValueChange={v => setNewItem(p => ({ ...p, type: v }))}>
            <SelectTrigger className="h-8 rounded-lg text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="number" value={newItem.weight} onChange={e => setNewItem(p => ({ ...p, weight: e.target.value }))} placeholder="%" className="h-8 w-16 rounded-lg text-sm" />
          <Input type="number" value={newItem.grade} onChange={e => setNewItem(p => ({ ...p, grade: e.target.value }))} placeholder="—" className="h-8 w-16 rounded-lg text-sm" />
          <Select value={newItem.status} onValueChange={v => setNewItem(p => ({ ...p, status: v }))}>
            <SelectTrigger className="h-8 rounded-lg text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
          </Select>
          <div className="flex gap-1">
            <button onClick={handleCreate} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-green-50 text-green-600"><Check className="h-3.5 w-3.5" /></button>
            <button onClick={() => setAdding(false)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
          </div>
        </div>
      )}

      {/* Rows */}
      {assignments.length === 0 && !adding ? (
        <div className="px-6 py-12 text-center text-sm text-muted-foreground">
          No assignments yet. Upload a syllabus or add one manually.
        </div>
      ) : (
        assignments.map((a) => {
          if (editingId === a.id) {
            return (
              <EditRow
                key={a.id}
                a={a}
                onSave={(data) => updateMutation.mutate({ id: a.id, data })}
                onCancel={() => setEditingId(null)}
              />
            );
          }

          const s = statusConfig[a.status] || statusConfig.pending;
          const { Icon } = s;
          return (
            <div key={a.id} className="grid grid-cols-[2.5fr_90px_80px_110px_140px_36px] items-center px-6 py-5 border-b last:border-b-0 hover:bg-muted/20 group transition-colors cursor-pointer" onClick={() => setEditingId(a.id)}>
              {/* Name + Due */}
              <div>
                <p className="text-base font-bold leading-snug">{a.name}</p>
                {a.due_date && (
                  <p className="text-xs text-muted-foreground mt-0.5">Due: {format(new Date(a.due_date), "MMM dd, yyyy")}</p>
                )}
              </div>
              {/* Type */}
              <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md bg-transparent ${typeColors[a.type] || typeColors.other}`}>
                  {typeLabels[a.type] || a.type?.toUpperCase()}
                </span>
              </div>
              {/* Weight */}
              <span className="text-sm text-foreground">{a.weight ? `${a.weight}%` : "–"}</span>
              {/* Grade */}
              <span className="text-sm">{gradeDisplay(a.grade)}</span>
              {/* Status */}
              <div className={`flex items-center gap-1.5 ${s.color}`}>
                <Icon className="h-4 w-4" />
                <span className="text-sm font-semibold">{s.label}</span>
              </div>
              {/* Actions */}
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
    </div>
  );
}
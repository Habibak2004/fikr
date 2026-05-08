import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Check, X, Trash2, CheckCircle2, Clock, Circle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const typeColors = {
  homework: "bg-blue-100 text-blue-700",
  exam: "bg-red-100 text-red-700",
  quiz: "bg-purple-100 text-purple-700",
  project: "bg-orange-100 text-orange-700",
  paper: "bg-violet-100 text-violet-700",
  lab: "bg-green-100 text-green-700",
  presentation: "bg-pink-100 text-pink-700",
  other: "bg-gray-100 text-gray-600"
};

const typeLabels = {
  homework: "HW", exam: "EXAM", quiz: "QUIZ", project: "PROJECT",
  paper: "ESSAY", lab: "LAB", presentation: "PRES", other: "OTHER"
};

const statusConfig = {
  pending: { label: "Upcoming", icon: Clock, color: "text-primary" },
  submitted: { label: "Submitted", icon: CheckCircle2, color: "text-green-600" },
  graded: { label: "Completed", icon: CheckCircle2, color: "text-green-600" },
  late: { label: "Late", icon: AlertCircle, color: "text-red-500" },
  missed: { label: "Missed", icon: AlertCircle, color: "text-red-500" }
};

export default function AssignmentsTab({ courseId, assignments, courseName, courseColor }) {
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", type: "homework", weight: "", grade: "", status: "pending", due_date: "" });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Assignment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", courseId] });
      setAdding(false);
      setNewItem({ name: "", type: "homework", weight: "", grade: "", status: "pending", due_date: "" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Assignment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assignments", courseId] })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Assignment.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assignments", courseId] })
  });

  const handleCreate = () => {
    if (!newItem.name) return;
    createMutation.mutate({
      ...newItem,
      weight: newItem.weight ? +newItem.weight : undefined,
      grade: newItem.grade !== "" ? +newItem.grade : undefined,
      course_id: courseId,
      course_name: courseName,
      course_color: courseColor
    });
  };

  return (
    <div className="bg-white border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between border-b">
        <h3 className="text-lg font-bold">Assignments & Grades</h3>
        <button
          onClick={() => setAdding(true)}
          className="text-sm text-primary font-medium hover:underline">
          
          + Add
        </button>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-[2fr_80px_70px_90px_120px_44px] border-b bg-muted/30 py-3 px-2">
        <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Assignment</span>
        <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Type</span>
        <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Weight</span>
        <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Grade</span>
        <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Status</span>
        <span></span>
      </div>

      {/* Add Row */}
      {adding &&
      <div className="grid grid-cols-[2fr_80px_70px_90px_120px_44px] items-center py-3 border-b bg-primary/5 gap-2 px-1">
          <Input
          value={newItem.name}
          onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
          placeholder="Assignment name"
          className="h-8 rounded-lg text-sm" />
        
          <Select value={newItem.type} onValueChange={(v) => setNewItem((p) => ({ ...p, type: v }))}>
            <SelectTrigger className="h-8 rounded-lg text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="number" value={newItem.weight} onChange={(e) => setNewItem((p) => ({ ...p, weight: e.target.value }))} placeholder="%" className="h-8 rounded-lg w-14 text-sm mx-4" />
          <Input type="number" value={newItem.grade} onChange={(e) => setNewItem((p) => ({ ...p, grade: e.target.value }))} placeholder="—" className="h-8 rounded-lg w-16 text-sm mx-3" />
          <Select value={newItem.status} onValueChange={(v) => setNewItem((p) => ({ ...p, status: v }))}>
            <SelectTrigger className="h-8 rounded-lg text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            <button onClick={handleCreate} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-green-50 text-green-600"><Check className="h-3.5 w-3.5" /></button>
            <button onClick={() => setAdding(false)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
          </div>
        </div>
      }

      {/* Assignment Rows */}
      {assignments.length === 0 && !adding ?
      <div className="px-6 py-10 text-center text-sm text-muted-foreground">
          No assignments yet. Upload a syllabus or add one manually.
        </div> :

      assignments.map((a) => {
        const status = statusConfig[a.status] || statusConfig.pending;
        const StatusIcon = status.icon;
        return (
          <div key={a.id} className="grid grid-cols-[2fr_80px_70px_90px_120px_44px] items-center px-6 py-4 border-b last:border-b-0 hover:bg-muted/20 group transition-colors">
              {/* Name + Due */}
              <div>
                <p className="text-sm font-semibold leading-tight">{a.name}</p>
                {a.due_date &&
              <p className="text-xs text-muted-foreground mt-0.5">Due: {format(new Date(a.due_date), "MMM dd, yyyy")}</p>
              }
              </div>
              {/* Type badge */}
              <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${typeColors[a.type] || typeColors.other}`}>
                  {typeLabels[a.type] || a.type?.toUpperCase()}
                </span>
              </div>
              {/* Weight */}
              <span className="text-sm text-muted-foreground">{a.weight ? `${a.weight}%` : "—"}</span>
              {/* Grade */}
              <span className={`text-sm font-semibold ${a.grade != null ? "text-primary" : "text-muted-foreground"}`}>
                {a.grade != null ? a.grade >= 10 ? `${a.grade}/100` : String.fromCharCode(64 + Math.round(a.grade / 100 * 4 + 1)) : "—"}
              </span>
              {/* Status */}
              <div className={`flex items-center gap-1.5 ${status.color}`}>
                <StatusIcon className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{status.label}</span>
              </div>
              {/* Delete */}
              <button
              onClick={() => deleteMutation.mutate(a.id)}
              className="h-7 w-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-muted-foreground hover:text-destructive transition-all">
              
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>);

      })
      }
    </div>);

}
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Check, X, Trash2 } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  submitted: "bg-primary/10 text-primary",
  graded: "bg-green-100 text-green-700",
  late: "bg-red-100 text-red-700",
  missed: "bg-muted text-muted-foreground",
};

const typeLabels = {
  homework: "HW", exam: "Exam", quiz: "Quiz", project: "Project",
  paper: "Paper", lab: "Lab", presentation: "Pres", other: "Other"
};

export default function AssignmentsTab({ courseId, assignments, courseName, courseColor }) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", type: "homework", weight: 0, grade: null, status: "pending" });
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Assignment.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["assignments", courseId] }); setEditingId(null); },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Assignment.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["assignments", courseId] }); setAdding(false); setNewItem({ name: "", type: "homework", weight: 0, grade: null, status: "pending" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Assignment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assignments", courseId] }),
  });

  const startEdit = (a) => { setEditingId(a.id); setEditData({ grade: a.grade, status: a.status, weight: a.weight }); };

  const saveEdit = () => updateMutation.mutate({ id: editingId, data: editData });

  return (
    <Card className="rounded-2xl overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b">
        <h3 className="font-semibold">Assignments & Grades</h3>
        <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="rounded-xl">
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adding && (
              <TableRow>
                <TableCell><Input value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} placeholder="Name" className="h-8 rounded-lg" /></TableCell>
                <TableCell>
                  <Select value={newItem.type} onValueChange={v => setNewItem(p => ({ ...p, type: v }))}>
                    <SelectTrigger className="h-8 w-24 rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Input type="number" value={newItem.weight} onChange={e => setNewItem(p => ({ ...p, weight: +e.target.value }))} className="h-8 w-16 rounded-lg" /></TableCell>
                <TableCell>—</TableCell>
                <TableCell><Badge className="bg-amber-100 text-amber-700 text-[10px]">pending</Badge></TableCell>
                <TableCell>—</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => createMutation.mutate({ ...newItem, course_id: courseId, course_name: courseName, course_color: courseColor })}><Check className="h-3.5 w-3.5 text-green-600" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setAdding(false)}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {assignments.map((a) => (
              <TableRow key={a.id} className="hover:bg-muted/30">
                <TableCell className="font-medium text-sm">{a.name}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{typeLabels[a.type] || a.type}</Badge></TableCell>
                <TableCell>
                  {editingId === a.id ? (
                    <Input type="number" value={editData.weight ?? ""} onChange={e => setEditData(p => ({ ...p, weight: +e.target.value }))} className="h-7 w-14 rounded-lg" />
                  ) : (
                    <span className="text-sm">{a.weight ? `${a.weight}%` : "—"}</span>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === a.id ? (
                    <Input type="number" value={editData.grade ?? ""} onChange={e => setEditData(p => ({ ...p, grade: +e.target.value }))} className="h-7 w-14 rounded-lg" />
                  ) : (
                    <span className="text-sm font-medium">{a.grade != null ? a.grade : "—"}</span>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === a.id ? (
                    <Select value={editData.status} onValueChange={v => setEditData(p => ({ ...p, status: v }))}>
                      <SelectTrigger className="h-7 w-24 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.keys(statusColors).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : (
                    <Badge className={`text-[10px] ${statusColors[a.status] || statusColors.pending}`}>{a.status}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{a.due_date ? format(new Date(a.due_date), "MMM d") : "—"}</TableCell>
                <TableCell>
                  {editingId === a.id ? (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}><Check className="h-3.5 w-3.5 text-green-600" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {assignments.length === 0 && !adding && (
              <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">No assignments yet. Upload a syllabus to auto-populate.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ["#0061a4", "#4648d4", "#904d00", "#16a34a", "#dc2626", "#7c3aed", "#0891b2", "#db2777"];
const ICONS = ["📚", "🧪", "💻", "📐", "🎨", "📊", "🌍", "⚖️", "🔬", "📖"];

export default function AddCourseModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({ name: "", code: "", professor: "", semester: "Fall 2026", semester_start: "", semester_end: "", color: COLORS[0], icon: "📚" });

  const handleSave = () => {
    if (!form.name || !form.code) return;
    onSave(form);
    setForm({ name: "", code: "", professor: "", semester: "Fall 2026", color: COLORS[0], icon: "📚" });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add New Course</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>Course Name</Label>
            <Input placeholder="e.g. Introduction to Computer Science" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="rounded-xl mt-1" />
          </div>
          <div>
            <Label>Course Code</Label>
            <Input placeholder="e.g. CS101" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} className="rounded-xl mt-1" />
          </div>
          <div>
            <Label>Professor</Label>
            <Input placeholder="e.g. Dr. Smith" value={form.professor} onChange={e => setForm(p => ({ ...p, professor: e.target.value }))} className="rounded-xl mt-1" />
          </div>
          <div>
            <Label>Semester</Label>
            <Select value={form.semester} onValueChange={v => setForm(p => ({ ...p, semester: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Fall 2026">Fall 2026</SelectItem>
                <SelectItem value="Spring 2026">Spring 2026</SelectItem>
                <SelectItem value="Summer 2026">Summer 2026</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Semester Start</Label>
              <Input type="date" value={form.semester_start || ""} onChange={e => setForm(p => ({ ...p, semester_start: e.target.value }))} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>Semester End</Label>
              <Input type="date" value={form.semester_end || ""} onChange={e => setForm(p => ({ ...p, semester_end: e.target.value }))} className="rounded-xl mt-1" />
            </div>
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex gap-2 mt-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                  className={`h-8 w-8 rounded-full transition-all ${form.color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div>
            <Label>Icon</Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {ICONS.map(i => (
                <button key={i} onClick={() => setForm(p => ({ ...p, icon: i }))}
                  className={`h-9 w-9 rounded-xl text-lg flex items-center justify-center transition-all ${form.icon === i ? "bg-primary/10 ring-2 ring-primary" : "bg-muted hover:bg-muted/80"}`}>
                  {i}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleSave} className="w-full rounded-xl bg-primary hover:bg-primary/90 mt-2">
            Add Course
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
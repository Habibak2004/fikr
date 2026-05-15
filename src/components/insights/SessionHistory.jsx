import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Clock, BookOpen, Plus, Trash2, Smile } from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";

const locationLabels = {
  home: "🏠 Home", library: "📚 Library", cafe: "☕ Café",
  classroom: "🏫 Classroom", dorm: "🛏️ Dorm", other: "📍 Other",
};

const moodLabels = {
  great: "🤩 Great", good: "😊 Good", okay: "😐 Okay",
  tired: "😴 Tired", stressed: "😤 Stressed",
};

const typeLabels = {
  pomodoro: "Pomodoro", deep_work: "Deep Work", review: "Review",
  homework: "Homework", exam_prep: "Exam Prep",
};

const EMPTY = {
  date: format(new Date(), "yyyy-MM-dd"),
  course_id: "",
  duration_minutes: 25,
  location: "home",
  location_note: "",
  session_type: "pomodoro",
  notes: "",
  mood: "good",
};

function LogModal({ open, onClose, courses, onSave, isSaving }) {
  const [form, setForm] = useState(EMPTY);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    const course = courses.find(c => c.id === form.course_id);
    onSave({
      ...form,
      duration_minutes: Number(form.duration_minutes),
      course_name: course?.name || "",
      course_color: course?.color || "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-extrabold">Log Study Session</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Date</label>
              <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Duration (min)</label>
              <Input type="number" value={form.duration_minutes} onChange={e => set("duration_minutes", e.target.value)} className="rounded-xl" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Course</label>
            <Select value={form.course_id} onValueChange={v => set("course_id", v)}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select course (optional)" /></SelectTrigger>
              <SelectContent>
                {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Location</label>
              <Select value={form.location} onValueChange={v => set("location", v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(locationLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Session Type</label>
              <Select value={form.session_type} onValueChange={v => set("session_type", v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.location === "other" && (
            <Input value={form.location_note} onChange={e => set("location_note", e.target.value)} placeholder="Describe location…" className="rounded-xl" />
          )}

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Mood</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(moodLabels).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => set("mood", k)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${form.mood === k ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Notes (optional)</label>
            <Input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="What did you cover?" className="rounded-xl" />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-xl px-6">Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving} className="rounded-xl px-6 bg-primary hover:bg-primary/90">
            {isSaving ? "Saving…" : "Log Session"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SessionHistory({ courses, userEmail }) {
  const [showLog, setShowLog] = useState(false);
  const queryClient = useQueryClient();

  const { data: studySessions = [] } = useQuery({
    queryKey: ["study-sessions", userEmail],
    queryFn: () => base44.entities.StudySession.filter({ created_by: userEmail }, "-created_date", 100),
    enabled: !!userEmail,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.StudySession.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["study-sessions"] }); setShowLog(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.StudySession.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["study-sessions"] }),
  });

  // Group by date
  const grouped = studySessions.reduce((acc, s) => {
    const key = s.date || format(new Date(s.created_date), "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <Card className="p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-lg">Session History</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Every study session you've logged</p>
        </div>
        <Button onClick={() => setShowLog(true)} size="sm" className="rounded-xl bg-primary hover:bg-primary/90 gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Log Session
        </Button>
      </div>

      {sortedDates.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          <p className="text-3xl mb-2">📖</p>
          <p>No sessions logged yet. Start tracking your study time!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => (
            <div key={dateKey}>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                {format(parseISO(dateKey), "EEEE, MMMM d, yyyy")}
              </p>
              <div className="space-y-2">
                {grouped[dateKey].map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 p-4 rounded-xl border bg-muted/20 group hover:bg-muted/40 transition-colors"
                  >
                    {/* Color dot */}
                    <div
                      className="h-9 w-9 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: s.course_color || "hsl(var(--primary))" }}
                    >
                      {s.course_name ? s.course_name.slice(0, 2).toUpperCase() : "📖"}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        {s.course_name || "General Study"}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />{s.duration_minutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {locationLabels[s.location] || s.location}
                          {s.location_note ? ` — ${s.location_note}` : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />{typeLabels[s.session_type] || s.session_type}
                        </span>
                        {s.mood && <span>{moodLabels[s.mood] || s.mood}</span>}
                      </div>
                      {s.notes && <p className="text-xs text-muted-foreground mt-1 truncate italic">{s.notes}</p>}
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => deleteMutation.mutate(s.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <LogModal
        open={showLog}
        onClose={() => setShowLog(false)}
        courses={courses}
        isSaving={createMutation.isPending}
        onSave={(data) => createMutation.mutate(data)}
      />
    </Card>
  );
}
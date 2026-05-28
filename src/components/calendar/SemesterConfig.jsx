import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Link2, Loader2, ChevronDown, Check, Trash2, Plus } from "lucide-react";

export default function SemesterConfig({ currentSemester, onSemesterChange, onClose }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSemester, setNewSemester] = useState({ name: "", start_date: "", end_date: "" });

  const { data: semesters = [] } = useQuery({
    queryKey: ["semesters"],
    queryFn: () => base44.entities.Semester.list("-created_date"),
  });

  useEffect(() => {
    if (semesters.length > 0 && !selected) {
      const current = semesters.find(s => s.id === currentSemester?.id) || semesters[0];
      setSelected(current);
    }
  }, [semesters, currentSemester, selected]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Semester.create(data),
    onSuccess: (newSemesterData) => {
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      setSelected(newSemesterData);
      setShowAddForm(false);
      setNewSemester({ name: "", start_date: "", end_date: "" });
    },
  });
  const [calendarUrl, setCalendarUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importedEvents, setImportedEvents] = useState([]);

  const handleImport = async () => {
    if (!calendarUrl.trim()) return;
    setImporting(true);
    setImportError(null);
    setImportedEvents([]);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Visit this academic calendar page and extract ALL dates, deadlines, holidays, and important events for the ${selected.name} semester (${selected.start_date} to ${selected.end_date}).

URL: ${calendarUrl}

Return ONLY valid JSON:
{
  "school_name": "school name",
  "events": [
    { "date": "YYYY-MM-DD", "label": "Event name", "sub": "Short detail", "type": "upcoming" }
  ]
}

Rules:
- Only include events that fall within ${selected.start_date} to ${selected.end_date}
- type = "done" if before 2026-05-23, else "upcoming"
- "sub" = brief 1-5 word detail (e.g. "No Classes", "Deadline", "Begins")
- Include ALL events found for the semester — aim for 10+ events`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          school_name: { type: "string" },
          events: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string" },
                label: { type: "string" },
                sub: { type: "string" },
                type: { type: "string" },
              },
            },
          },
        },
      },
    });

    setImporting(false);
    if (result?.events?.length) {
      setImportedEvents(result.events);
    } else {
      setImportError("Couldn't parse calendar. Make sure the link is a public .ics URL and try again.");
    }
  };

  const handleApply = () => {
    if (!selected) return;
    onSemesterChange({
      id: selected.id,
      name: selected.name,
      start: selected.start_date,
      end: selected.end_date,
    }, importedEvents);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold mb-1">Semester Settings</h2>
        <p className="text-sm text-muted-foreground mb-5">Select your semester and optionally import your school's calendar.</p>

        {/* Semester Selector */}
        <div className="mb-5">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">Active Semester</label>
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full flex items-center justify-between border rounded-xl px-4 py-3 text-sm font-medium hover:bg-muted/30 transition-colors"
            >
              {selected ? `${selected.name} (${selected.start_date} → ${selected.end_date})` : "Select a semester"}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full mt-1 w-full bg-white border rounded-xl shadow-lg z-10 overflow-hidden max-h-60 overflow-y-auto"
                >
                  {semesters.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSelected(s); setShowDropdown(false); setImportedEvents([]); }}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/30 transition-colors"
                    >
                      <span>{s.name}</span>
                      <span className="text-xs text-muted-foreground">{s.start_date} → {s.end_date}</span>
                      {selected?.id === s.id && <Check className="h-3.5 w-3.5 text-primary ml-2" />}
                    </button>
                  ))}
                  <button
                    onClick={() => { setShowAddForm(true); setShowDropdown(false); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-primary hover:bg-primary/5 transition-colors border-t"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add New Semester
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Add Semester Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 p-4 border rounded-xl bg-primary/5 space-y-3"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Add New Semester</p>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                <Input
                  placeholder="e.g., Fall 2026"
                  value={newSemester.name}
                  onChange={(e) => setNewSemester({ ...newSemester, name: e.target.value })}
                  className="rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
                  <Input
                    type="date"
                    value={newSemester.start_date}
                    onChange={(e) => setNewSemester({ ...newSemester, start_date: e.target.value })}
                    className="rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
                  <Input
                    type="date"
                    value={newSemester.end_date}
                    onChange={(e) => setNewSemester({ ...newSemester, end_date: e.target.value })}
                    className="rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => createMutation.mutate(newSemester)}
                  disabled={!newSemester.name || !newSemester.start_date || !newSemester.end_date}
                  size="sm"
                  className="flex-1"
                >
                  Create Semester
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setShowAddForm(false); setNewSemester({ name: "", start_date: "", end_date: "" }); }}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Calendar URL Import */}
        <div className="mb-5">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
            Import School Calendar (optional)
          </label>
          <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
            Paste your school's .ics calendar link. Find it in your school's registrar or academic calendar page.
          </p>
          <div className="flex gap-2">
            <Input
              value={calendarUrl}
              onChange={(e) => setCalendarUrl(e.target.value)}
              placeholder="https://school.edu/calendar.ics"
              className="rounded-xl text-sm"
            />
            <Button
              onClick={handleImport}
              disabled={importing || !calendarUrl.trim()}
              className="rounded-xl shrink-0"
              size="sm"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            </Button>
          </div>
          {importError && <p className="text-xs text-red-500 mt-2">{importError}</p>}
        </div>

        {/* Imported Events Preview — editable */}
        {importedEvents.length > 0 && (
          <div className="mb-5 border rounded-xl p-3 bg-primary/5 max-h-56 overflow-y-auto">
            <p className="text-xs font-semibold text-primary mb-2">
              {importedEvents.length} events imported — edit or remove as needed
            </p>
            <div className="space-y-1.5">
              {importedEvents.map((e, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={e.date}
                    onChange={(ev) => {
                      const updated = [...importedEvents];
                      updated[i] = { ...updated[i], date: ev.target.value };
                      setImportedEvents(updated);
                    }}
                    className="text-xs border rounded-md px-1.5 py-1 bg-white w-32 shrink-0"
                  />
                  <input
                    type="text"
                    value={e.label}
                    onChange={(ev) => {
                      const updated = [...importedEvents];
                      updated[i] = { ...updated[i], label: ev.target.value };
                      setImportedEvents(updated);
                    }}
                    className="text-xs border rounded-md px-1.5 py-1 bg-white flex-1 min-w-0"
                  />
                  <button
                    onClick={() => setImportedEvents(importedEvents.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground hover:text-red-500 shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={handleApply} className="w-full rounded-xl">
          Apply Changes
        </Button>
      </motion.div>
    </div>
  );
}
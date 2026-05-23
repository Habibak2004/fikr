import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Link2, Loader2, ChevronDown, Check } from "lucide-react";

const PRESET_SEMESTERS = [
  { label: "Spring 2026", start: "2026-01-19", end: "2026-05-15" },
  { label: "Summer 2026", start: "2026-06-01", end: "2026-08-14" },
  { label: "Fall 2026",   start: "2026-08-24", end: "2026-12-18" },
  { label: "Spring 2027", start: "2027-01-18", end: "2027-05-14" },
];

export default function SemesterConfig({ currentSemester, onSemesterChange, onClose }) {
  const [selected, setSelected] = useState(currentSemester || PRESET_SEMESTERS[0]);
  const [calendarUrl, setCalendarUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importedEvents, setImportedEvents] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleImport = async () => {
    if (!calendarUrl.trim()) return;
    setImporting(true);
    setImportError(null);
    setImportedEvents([]);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Visit this academic calendar page and extract ALL dates, deadlines, holidays, and important events for the ${selected.label} semester (${selected.start} to ${selected.end}).

URL: ${calendarUrl}

Return ONLY valid JSON:
{
  "school_name": "school name",
  "events": [
    { "date": "YYYY-MM-DD", "label": "Event name", "sub": "Short detail", "type": "upcoming" }
  ]
}

Rules:
- Only include events that fall within ${selected.start} to ${selected.end}
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
    onSemesterChange({
      ...selected,
      importedEvents: importedEvents.length ? importedEvents : undefined,
      schoolName: importedEvents.length ? undefined : undefined,
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
              {selected.label}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full mt-1 w-full bg-white border rounded-xl shadow-lg z-10 overflow-hidden"
                >
                  {PRESET_SEMESTERS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => { setSelected(s); setShowDropdown(false); setImportedEvents([]); }}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/30 transition-colors"
                    >
                      <span>{s.label}</span>
                      <span className="text-xs text-muted-foreground">{s.start} → {s.end}</span>
                      {selected.label === s.label && <Check className="h-3.5 w-3.5 text-primary ml-2" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

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

        {/* Imported Events Preview */}
        {importedEvents.length > 0 && (
          <div className="mb-5 border rounded-xl p-3 bg-primary/5 max-h-48 overflow-y-auto">
            <p className="text-xs font-semibold text-primary mb-2">
              {importedEvents.length} events imported — will be added to your timeline
            </p>
            <div className="space-y-1">
              {importedEvents.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground w-20 shrink-0">{e.date}</span>
                  <span className="font-medium">{e.label}</span>
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
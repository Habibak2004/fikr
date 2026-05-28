import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Mail, Leaf, BookOpen, ChevronDown, ChevronUp, Sparkles, RotateCcw, Plus, Pencil } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { base44 } from "@/api/base44Client";
import BlockerPanel from "@/components/planner/BlockerPanel";
import AssignmentAttachments from "@/components/planner/AssignmentAttachments";
import StartByBadge from "@/components/planner/StartByBadge";

const RESISTANCE_LABELS = {
  low: { label: "EASY START", color: "bg-emerald-100 text-emerald-700" },
  medium: { label: "MEDIUM RESISTANCE", color: "bg-amber-100 text-amber-700" },
  high: { label: "HIGH RESISTANCE", color: "bg-red-100 text-red-700" },
};

function getResistance(a) {
  const days = a.due_date ? differenceInDays(new Date(a.due_date), new Date()) : 99;
  if (a.priority === "high" || days <= 1) return "high";
  if (a.priority === "medium" || days <= 4) return "medium";
  return "low";
}

function getNodeIcon(a) {
  if (a.type === "email" || /email|follow|professor|housing|financial/i.test(a.name)) return "comm";
  if (a.type === "exam" || a.type === "quiz") return "academic";
  return "academic";
}

function NodeDot({ type, active }) {
  const base = "h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 z-10 transition-all";
  if (type === "comm") return (
    <div className={`${base} ${active ? "border-secondary bg-secondary text-white" : "border-secondary/40 bg-secondary/10 text-secondary"}`}>
      <Mail className="h-4 w-4" />
    </div>
  );
  if (type === "restore") return (
    <div className={`${base} ${active ? "border-emerald-500 bg-emerald-500 text-white" : "border-emerald-300 bg-emerald-50 text-emerald-600"}`}>
      <Leaf className="h-4 w-4" />
    </div>
  );
  return (
    <div className={`${base} ${active ? "border-primary bg-primary text-white" : "border-border bg-white text-muted-foreground"}`}>
      <BookOpen className="h-4 w-4" />
    </div>
  );
}

function AcademicCard({ a, onStart, onToggle, onUpdate, onEdit, school, allAssignments }) {
  const [expanded, setExpanded] = useState(false);
  const [miniSteps, setMiniSteps] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const dateInputRef = useRef(null);
  const resistance = getResistance(a);
  const days = a.due_date ? differenceInDays(new Date(a.due_date), new Date()) : null;

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    if (newDate && onUpdate) onUpdate(a.id, { due_date: newDate });
    setEditingDate(false);
  };

  const generateSteps = async () => {
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Break down this task into 3-4 tiny, non-intimidating micro-steps for an ADHD student who is struggling to start.
Task: "${a.name}" (type: ${a.type})
Each step should take 2-5 minutes and feel achievable. Start with the absolute smallest possible action.
Return JSON: { "steps": ["step1", "step2", "step3"] }`,
      response_json_schema: { type: "object", properties: { steps: { type: "array", items: { type: "string" } } } },
    });
    setMiniSteps(result?.steps || []);
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-border/70 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${RESISTANCE_LABELS[resistance].color}`}>
          {RESISTANCE_LABELS[resistance].label}
        </span>
        <div className="flex items-center gap-2">
          {editingDate ? (
            <input
              ref={dateInputRef}
              type="datetime-local"
              autoFocus
              defaultValue={a.due_date ? a.due_date.slice(0, 16) : ""}
              onBlur={handleDateChange}
              onChange={handleDateChange}
              className="text-[10px] border border-primary/40 rounded-md px-1.5 py-0.5 bg-white outline-none focus:ring-1 focus:ring-primary/30 w-36"
            />
          ) : (
            <button
              onClick={() => setEditingDate(true)}
              className={`flex items-center gap-1 text-[10px] font-semibold group ${days === null ? "text-muted-foreground" : days < 0 ? "text-red-500" : days <= 1 ? "text-red-500" : days <= 3 ? "text-amber-600" : "text-muted-foreground"}`}
            >
              {a.due_date && <span className="opacity-70">{format(new Date(a.due_date), "MMM d")}</span>}
              <span>{days === null ? "Set deadline" : days === 0 ? "· Due today" : days < 0 ? `· ${Math.abs(days)}d overdue` : `· ${days}d left`}</span>
              <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
            </button>
          )}
          <button onClick={() => setExpanded(e => !e)} className="text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <p className="font-semibold text-[15px] mb-1">{a.name}</p>
      {a.course_name && <p className="text-xs text-muted-foreground mb-3">{a.course_name}</p>}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {miniSteps ? (
              <div className="mb-3 space-y-1.5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Start here →</p>
                {miniSteps.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    {s}
                  </div>
                ))}
              </div>
            ) : (
              <button
                onClick={generateSteps}
                disabled={loading}
                className="mb-3 text-xs font-medium text-primary hover:underline flex items-center gap-1"
              >
                {loading ? <><RotateCcw className="h-3 w-3 animate-spin" /> Breaking down...</> : <><Sparkles className="h-3 w-3" /> Break this down for me</>}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => onStart(a)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          <Play className="h-3 w-3" /> Start Focus Session
        </button>
        <button
          onClick={() => onToggle(a)}
          className="text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-xl hover:bg-muted transition-colors"
        >
          Mark done
        </button>
        {onEdit && (
          <button
            onClick={() => onEdit(a)}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary px-2 py-1.5 rounded-xl hover:bg-muted transition-colors ml-auto"
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
        )}
      </div>

      <StartByBadge assignment={a} otherAssignments={allAssignments} onUpdate={onUpdate} />
      <AssignmentAttachments assignment={a} onUpdate={onUpdate} />
      <BlockerPanel task={a} school={school} />
    </motion.div>
  );
}

function CommCard({ a, onToggle, onEdit, school }) {
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState("professional");
  const resistance = getResistance(a);

  const generateDraft = async () => {
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Write a short, ${tone} email for a college student.
Subject context: "${a.name}"
Keep it under 5 sentences. Be warm, clear, and not overly formal. Include a subject line.
Return JSON: { "subject": "...", "body": "..." }`,
      response_json_schema: { type: "object", properties: { subject: { type: "string" }, body: { type: "string" } } },
    });
    setDraft(result);
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-secondary/30 rounded-2xl p-4 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${RESISTANCE_LABELS[resistance].color}`}>
          {RESISTANCE_LABELS[resistance].label}
        </span>
        <span className="text-[10px] font-semibold text-muted-foreground">
          Difficulty: {resistance === "high" ? "4/5" : resistance === "medium" ? "2/5" : "1/5"}
        </span>
        {a.status === "pending" && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600">Waiting for response</span>
        )}
      </div>

      <p className="font-semibold text-[15px] mb-3">{a.name}</p>

      {draft ? (
        <div className="mb-3 bg-muted/40 rounded-xl p-3 space-y-2">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">Subject</p>
            <input
              value={draft.subject}
              onChange={e => setDraft(d => ({ ...d, subject: e.target.value }))}
              className="w-full text-xs text-foreground border border-border/60 rounded-lg px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">Body</p>
            <textarea
              value={draft.body}
              onChange={e => setDraft(d => ({ ...d, body: e.target.value }))}
              rows={5}
              className="w-full text-xs text-foreground border border-border/60 rounded-lg px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-none leading-relaxed"
            />
          </div>
          <a
            href={`mailto:?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Open in Gmail →
          </a>
        </div>
      ) : null}

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={generateDraft}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          {loading ? <RotateCcw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {draft ? "Re-draft" : "Draft Email"}
        </button>
        {draft && (
          <select
            value={tone}
            onChange={e => setTone(e.target.value)}
            className="text-xs border rounded-lg px-2 py-1.5 outline-none bg-white"
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="apologetic">Apologetic</option>
            <option value="follow-up">Follow-up</option>
          </select>
        )}
        <button onClick={() => onToggle(a)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-xl hover:bg-muted transition-colors">
          Mark done
        </button>
        {onEdit && (
          <button
            onClick={() => onEdit(a)}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary px-2 py-1.5 rounded-xl hover:bg-muted transition-colors ml-auto"
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
        )}
      </div>

      <BlockerPanel task={a} school={school} />
    </motion.div>
  );
}

function PausedCard({ a, onResume }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 bg-muted/40 border border-border/60 rounded-2xl p-4"
    >
      <div className="h-10 w-10 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0">
        <Pause className="h-4 w-4 text-foreground/60" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-0.5">Paused Session</p>
        <p className="font-semibold text-sm truncate">{a.name}</p>
        <p className="text-[11px] text-muted-foreground italic mt-0.5">A partial session still counts. Momentum returns quickly.</p>
      </div>
      <button
        onClick={() => onResume(a)}
        className="flex-shrink-0 text-xs font-semibold border border-border rounded-xl px-3 py-2 hover:bg-white hover:shadow-sm transition-all"
      >
        Resume (14m left)
      </button>
    </motion.div>
  );
}

function QuickAddRow({ onAdd }) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  };

  return (
    <div className="flex gap-3 items-center mt-2">
      <div className="h-9 w-9 rounded-full border-2 border-dashed border-border flex items-center justify-center flex-shrink-0">
        <Plus className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === "Enter" && submit()}
        placeholder="Quick add a task... (press Enter)"
        className="flex-1 text-sm py-2 px-3 rounded-xl border border-dashed border-border/70 bg-white/60 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/50 transition-all"
      />
    </div>
  );
}

export default function TaskTimeline({ assignments = [], courses = [], pausedTask, onStartFocus, onToggle, onUpdate, onQuickAdd, onEdit, allAssignments = [] }) {
  // Derive school name from localStorage (user can set it once in ContactRoutingPanel)
  const schoolName = localStorage.getItem("fikr_school_name") || null;

  const isCommTask = (a) => /email|follow|professor|housing|financial|internship|contact/i.test(a.name) || a.type === "other";

  const pending = assignments.filter(a => !a.completed);
  const sorted = [...pending].sort((a, b) => {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date) - new Date(b.due_date);
  });

  if (sorted.length === 0) {
    return (
      <div>
        <div className="text-center py-10 text-muted-foreground">
          <p className="text-2xl mb-2">🌿</p>
          <p className="font-medium">No pending tasks. You're clear.</p>
        </div>
        {onQuickAdd && <QuickAddRow onAdd={onQuickAdd} />}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[18px] top-4 bottom-4 w-0.5 bg-border/60 rounded-full" />

      <div className="space-y-4">
        {pausedTask && (
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 mt-1">
              <div className="h-9 w-9 rounded-full border-2 border-border bg-muted flex items-center justify-center z-10">
                <Pause className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex-1 pt-0.5">
              <PausedCard a={pausedTask} onResume={onStartFocus} />
            </div>
          </div>
        )}

        {sorted.map((a, i) => {
          const isComm = isCommTask(a);
          const nodeType = isComm ? "comm" : "academic";
          const isFirst = !pausedTask && i === 0;

          return (
            <div key={a.id} className="flex gap-4 items-start">
              <div className="flex-shrink-0 mt-1">
                <NodeDot type={nodeType} active={isFirst} />
              </div>
              <div className="flex-1 pt-0.5">
                {isComm
                  ? <CommCard a={a} onToggle={onToggle} onEdit={onEdit} school={schoolName} />
                  : <AcademicCard a={a} onStart={onStartFocus} onToggle={onToggle} onUpdate={onUpdate} onEdit={onEdit} school={schoolName} allAssignments={allAssignments} />
                }
              </div>
            </div>
          );
        })}
      </div>
      {onQuickAdd && <QuickAddRow onAdd={onQuickAdd} />}
    </div>
  );
}
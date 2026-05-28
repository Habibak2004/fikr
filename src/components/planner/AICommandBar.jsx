import { useState } from "react";
import { Search, Loader2, Sparkles, Check, ChevronRight, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

const SUGGESTIONS = ["plan my evening", "I'm overwhelmed", "low energy mode", "what should I do next?", "help me catch up"];

// Mode: "chat" | "task_intake"
export default function AICommandBar({ assignments = [], onModeChange, onAddTasks }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  // Task intake state
  const [intakeTasks, setIntakeTasks] = useState([]); // [{name, due_date, priority}]
  const [intakeIndex, setIntakeIndex] = useState(0);
  const [intakeInput, setIntakeInput] = useState("");
  const [intakeStep, setIntakeStep] = useState("due"); // "due" | "priority"
  const [mode, setMode] = useState("chat");

  const detectTaskList = (text) => {
    // Multi-line, bullet list, or comma-separated
    return text.includes("\n") || /^[-•*]\s/.test(text) || text.split(",").length >= 2;
  };

  const parseTasksFromText = async (text) => {
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract a list of tasks from the following text. Each task should be a clear, actionable item.
Text: "${text}"
Return JSON: { "tasks": ["task 1", "task 2", ...] }
Rules: Clean up the task names. Remove bullets/numbers. Return only the tasks array.`,
      response_json_schema: { type: "object", properties: { tasks: { type: "array", items: { type: "string" } } } },
    });
    setLoading(false);
    return result?.tasks || [];
  };

  const submit = async () => {
    const text = query.trim();
    if (!text) return;

    // If it looks like a task list, enter intake mode
    if (detectTaskList(text)) {
      setLoading(true);
      const tasks = await parseTasksFromText(text);
      if (tasks.length > 0) {
        setIntakeTasks(tasks.map(name => ({ name, due_date: "", priority: "medium" })));
        setIntakeIndex(0);
        setIntakeStep("due");
        setIntakeInput("");
        setMode("task_intake");
        setQuery("");
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    // Otherwise chat mode
    setLoading(true);
    setResponse(null);
    const pending = assignments.filter(a => !a.completed);
    const overdue = pending.filter(a => a.due_date && new Date(a.due_date) < new Date());
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an empathetic executive functioning assistant for an ADHD/overwhelmed student.
User said: "${text}"
Context: ${pending.length} pending tasks, ${overdue.length} overdue.
Tasks: ${pending.slice(0, 5).map(a => `${a.name} (due: ${a.due_date ? new Date(a.due_date).toLocaleDateString() : 'no date'})`).join(", ")}

Respond in 1-2 sentences: be warm, specific, actionable. Suggest one concrete next step. If overwhelmed, suggest stabilizing first. Never be preachy.`,
    });
    setLoading(false);
    setResponse(result);
    if (/overwhelm|low energy|catch up|stabilize/i.test(text)) onModeChange?.("catchup");
  };

  const handleIntakeInput = (e) => {
    if (e.key !== "Enter") return;
    const val = intakeInput.trim().toLowerCase();
    const current = intakeTasks[intakeIndex];

    if (intakeStep === "due") {
      // Accept "today", "tomorrow", date string, or "skip"
      let due_date = "";
      if (val === "today") { const d = new Date(); due_date = d.toISOString().slice(0, 10) + "T23:59:00"; }
      else if (val === "tomorrow") { const d = new Date(Date.now() + 86400000); due_date = d.toISOString().slice(0, 10) + "T23:59:00"; }
      else if (val && val !== "skip" && val !== "no") {
        // Try parsing a date
        const parsed = new Date(intakeInput);
        if (!isNaN(parsed)) due_date = parsed.toISOString();
      }
      const updated = [...intakeTasks];
      updated[intakeIndex] = { ...current, due_date };
      setIntakeTasks(updated);
      setIntakeInput("");
      setIntakeStep("priority");
    } else if (intakeStep === "priority") {
      let priority = "medium";
      if (/high|urgent|asap|important/i.test(val)) priority = "high";
      else if (/low|later|easy/i.test(val)) priority = "low";
      else if (val === "skip" || val === "") priority = "medium";
      const updated = [...intakeTasks];
      updated[intakeIndex] = { ...current, priority };
      setIntakeTasks(updated);
      setIntakeInput("");

      if (intakeIndex + 1 < intakeTasks.length) {
        setIntakeIndex(intakeIndex + 1);
        setIntakeStep("due");
      } else {
        // All done — save
        onAddTasks?.(updated);
        setMode("chat");
        setIntakeTasks([]);
        setIntakeIndex(0);
        setResponse("Done! All tasks have been added to your planner. 🎉");
      }
    }
  };

  const skipAll = () => {
    onAddTasks?.(intakeTasks);
    setMode("chat");
    setIntakeTasks([]);
    setIntakeIndex(0);
    setResponse("Tasks added with default settings.");
  };

  const cancelIntake = () => {
    setMode("chat");
    setIntakeTasks([]);
    setIntakeIndex(0);
    setIntakeInput("");
  };

  if (mode === "task_intake") {
    const current = intakeTasks[intakeIndex];
    const question = intakeStep === "due"
      ? `When is "${current.name}" due? (today / tomorrow / a date / skip)`
      : `Priority for "${current.name}"? (high / medium / low / skip)`;

    return (
      <div className="bg-white border border-primary/20 rounded-2xl p-4 space-y-3">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Adding {intakeTasks.length} tasks</span>
          </div>
          <button onClick={cancelIntake} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Task list mini-preview */}
        <div className="flex gap-1.5 flex-wrap">
          {intakeTasks.map((t, i) => (
            <span key={i} className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
              i < intakeIndex ? "bg-emerald-100 text-emerald-700" :
              i === intakeIndex ? "bg-primary/10 text-primary ring-1 ring-primary/30" :
              "bg-muted text-muted-foreground"
            }`}>
              {i < intakeIndex && <Check className="h-2.5 w-2.5 inline mr-0.5" />}
              {t.name}
            </span>
          ))}
        </div>

        {/* Question */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2">{question}</p>
          <div className="flex gap-2">
            <input
              autoFocus
              value={intakeInput}
              onChange={e => setIntakeInput(e.target.value)}
              onKeyDown={handleIntakeInput}
              placeholder={intakeStep === "due" ? "e.g. tomorrow, May 30, skip..." : "e.g. high, medium, low, skip..."}
              className="flex-1 text-sm py-2 px-3 rounded-xl border border-border/70 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
            <button
              onClick={() => handleIntakeInput({ key: "Enter" })}
              className="px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 flex items-center gap-1"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <button onClick={skipAll} className="text-xs text-muted-foreground hover:text-foreground underline">
          Skip all & add with defaults
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="Paste a task list, or ask for help..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border/60 bg-white text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
        />
        {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
      </div>

      {!response && !loading && (
        <div className="flex gap-1.5 flex-wrap">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => { setQuery(s); setTimeout(submit, 0); }}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors border border-transparent hover:border-primary/20"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {response && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2.5 bg-primary/6 border border-primary/15 rounded-xl px-4 py-3"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground/85 leading-relaxed">{response}</p>
            <button onClick={() => { setResponse(null); setQuery(""); }} className="text-muted-foreground hover:text-foreground ml-auto flex-shrink-0 text-xs">✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
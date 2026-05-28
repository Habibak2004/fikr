import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Brain, Zap, GitBranch, Loader2, ChevronDown, ChevronUp, Sparkles, ExternalLink, Search, Mail, X } from "lucide-react";
import ContactRoutingPanel from "@/components/planner/ContactRoutingPanel";

const BLOCKER_TYPES = {
  missing_info: {
    label: "Missing Routing Information",
    icon: Search,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700",
  },
  emotional: {
    label: "Emotional Resistance",
    icon: Brain,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    badge: "bg-violet-100 text-violet-700",
  },
  overload: {
    label: "Cognitive Overload",
    icon: Zap,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-700",
  },
  paralysis: {
    label: "Decision Paralysis",
    icon: GitBranch,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    badge: "bg-rose-100 text-rose-700",
  },
};

function InlineDraft({ draft, onClose }) {
  const [subject, setSubject] = useState(draft.subject || "");
  const [body, setBody] = useState(draft.body || "");
  const [to, setTo] = useState(draft.to || "");
  const [extraContext, setExtraContext] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [showContextInput, setShowContextInput] = useState(false);

  const regenerate = async () => {
    if (!extraContext.trim()) return;
    setRegenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Rewrite this email draft for a college student with the additional context provided.

Original subject: "${subject}"
Original body: "${body}"
Recipient: "${to || draft.department}"
Additional context from the student: "${extraContext}"

Incorporate the new context naturally. Keep it concise (under 6 sentences), warm, and professional.
Return JSON: { "subject": "...", "body": "..." }`,
      response_json_schema: {
        type: "object",
        properties: { subject: { type: "string" }, body: { type: "string" } },
      },
    });
    if (result) {
      setSubject(result.subject);
      setBody(result.body);
      setExtraContext("");
      setShowContextInput(false);
    }
    setRegenerating(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mt-2 rounded-xl border border-blue-300 bg-white p-3 space-y-2 shadow-sm"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5 text-blue-600" />
          <span className="text-xs font-semibold text-blue-700">Email Draft — {draft.department}</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div>
        <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">To</p>
        <input
          value={to}
          onChange={e => setTo(e.target.value)}
          placeholder="recipient@university.edu"
          className="w-full text-xs border border-border/60 rounded-lg px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
        />
      </div>
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Subject</p>
        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="w-full text-xs border border-border/60 rounded-lg px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
        />
      </div>
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Body</p>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={5}
          className="w-full text-xs border border-border/60 rounded-lg px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 resize-none leading-relaxed"
        />
      </div>

      {/* Add context section */}
      {showContextInput ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5 space-y-2">
          <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">Add context to refine draft</p>
          <textarea
            autoFocus
            value={extraContext}
            onChange={e => setExtraContext(e.target.value)}
            placeholder="e.g. My student ID is 12345, deadline is June 1st, I've already emailed once with no reply, I need to mention my specific room assignment..."
            rows={3}
            className="w-full text-xs border border-blue-200 rounded-lg px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 resize-none leading-relaxed"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={regenerate}
              disabled={!extraContext.trim() || regenerating}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              {regenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              {regenerating ? "Regenerating..." : "Regenerate draft"}
            </button>
            <button onClick={() => { setShowContextInput(false); setExtraContext(""); }} className="text-xs text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowContextInput(true)}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          <Sparkles className="h-3 w-3" /> Add context & regenerate
        </button>
      )}

      <a
        href={`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors w-fit"
      >
        <Mail className="h-3 w-3" /> Open in Mail App
      </a>
    </motion.div>
  );
}

export default function BlockerPanel({ task, school }) {
  const [open, setOpen] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inlineDraft, setInlineDraft] = useState(null);

  const analyze = async () => {
    if (analysis) { setOpen(o => !o); return; }
    setLoading(true);
    setOpen(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an executive functioning coach helping a college student who is stuck on a task.

Task: "${task.name}"
Type: ${task.type || "unknown"}
Course: ${task.course_name || "none"}

Analyze WHY this student might be stuck. Identify the PRIMARY blocker type and give concrete, compassionate recovery steps.

Blocker types:
- "missing_info": they lack routing info, contacts, location, or next-step clarity (use this for housing, applications, contacting offices, admin tasks)
- "emotional": fear, anxiety, perfectionism, embarrassment, avoidance
- "overload": task feels huge, too many steps, unclear scope
- "paralysis": too many choices, fear of wrong decision

Return JSON:
{
  "blocker_type": "missing_info" | "emotional" | "overload" | "paralysis",
  "why_stuck": "1-2 sentence empathetic explanation of WHY this specific task is hard",
  "reframe": "1 sentence reframe to make it feel possible",
  "next_action": "The single clearest first micro-step (under 5 min)",
  "suggested_actions": ["action 1", "action 2", "action 3"],
  "search_query": "a Google search query that would help (if missing_info), or null"
}`,
      response_json_schema: {
        type: "object",
        properties: {
          blocker_type: { type: "string" },
          why_stuck: { type: "string" },
          reframe: { type: "string" },
          next_action: { type: "string" },
          suggested_actions: { type: "array", items: { type: "string" } },
          search_query: { type: "string" },
        },
      },
    });
    setAnalysis(result);
    setLoading(false);
  };

  const blocker = analysis ? BLOCKER_TYPES[analysis.blocker_type] || BLOCKER_TYPES.missing_info : null;
  const Icon = blocker?.icon || AlertTriangle;
  const isMissingInfo = analysis?.blocker_type === "missing_info";

  return (
    <div className="mt-3">
      <button
        onClick={analyze}
        className="flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <AlertTriangle className="h-3 w-3" />}
        {loading ? "Diagnosing blocker..." : analysis ? (open ? "Hide analysis" : "Show blocker analysis") : "Why am I stuck?"}
        {analysis && !loading && (open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </button>

      <AnimatePresence>
        {open && analysis && blocker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-2"
          >
            <div className={`rounded-xl border ${blocker.border} ${blocker.bg} p-3 space-y-3`}>
              {/* Header */}
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Icon className={`h-3.5 w-3.5 ${blocker.color}`} />
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${blocker.badge}`}>
                  {blocker.label}
                </span>
              </div>

              {/* Why stuck */}
              <p className="text-xs text-foreground/80 leading-relaxed">{analysis.why_stuck}</p>

              {/* Reframe */}
              <div className="flex items-start gap-1.5">
                <Sparkles className={`h-3 w-3 mt-0.5 flex-shrink-0 ${blocker.color}`} />
                <p className={`text-xs font-medium ${blocker.color} leading-relaxed`}>{analysis.reframe}</p>
              </div>

              {/* Next action */}
              <div className="bg-white rounded-lg px-3 py-2 border border-white/80 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-0.5">Start here</p>
                <p className="text-xs font-semibold text-foreground">{analysis.next_action}</p>
              </div>

              {/* Suggested actions */}
              {analysis.suggested_actions?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Recovery steps</p>
                  {analysis.suggested_actions.map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-foreground/75">
                      <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5 bg-white ${blocker.color}`}>
                        {i + 1}
                      </span>
                      {s}
                    </div>
                  ))}
                </div>
              )}

              {/* Search link */}
              {analysis.search_query && (
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(analysis.search_query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1.5 text-xs font-semibold ${blocker.color} hover:underline`}
                >
                  <ExternalLink className="h-3 w-3" />
                  Search: "{analysis.search_query}"
                </a>
              )}

              {/* Contact Routing — only for missing_info */}
              {isMissingInfo && (
                <div className="border-t border-blue-200 pt-3">
                  <ContactRoutingPanel
                    task={task}
                    school={school}
                    onOpenDraft={(draft) => setInlineDraft(draft)}
                  />
                  <AnimatePresence>
                    {inlineDraft && (
                      <InlineDraft draft={inlineDraft} onClose={() => setInlineDraft(null)} />
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Brain, Zap, GitBranch, Loader2, ChevronDown, ChevronUp, Sparkles, ExternalLink, Search } from "lucide-react";

const BLOCKER_TYPES = {
  missing_info: {
    label: "Missing Information",
    icon: Search,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    description: "You may not know who to contact, where to go, or what the next step is.",
  },
  emotional: {
    label: "Emotional Resistance",
    icon: Brain,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    badge: "bg-violet-100 text-violet-700",
    description: "This task might carry anxiety, perfectionism, or fear of judgment.",
  },
  overload: {
    label: "Cognitive Overload",
    icon: Zap,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-700",
    description: "The task feels too large or complex to know where to begin.",
  },
  paralysis: {
    label: "Decision Paralysis",
    icon: GitBranch,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    badge: "bg-rose-100 text-rose-700",
    description: "Multiple paths or options are making it hard to commit to one.",
  },
};

export default function BlockerPanel({ task }) {
  const [open, setOpen] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

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
- "missing_info": they lack routing info, contacts, location, or next-step clarity
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
  "search_query": "a Google search query that would help unblock them (if missing_info), or null"
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

  return (
    <div className="mt-3">
      <button
        onClick={analyze}
        className="flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <AlertTriangle className="h-3 w-3" />
        )}
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
                <div className={`h-7 w-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <Icon className={`h-3.5 w-3.5 ${blocker.color}`} />
                </div>
                <div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${blocker.badge}`}>
                    {blocker.label}
                  </span>
                </div>
              </div>

              {/* Why stuck */}
              <p className="text-xs text-foreground/80 leading-relaxed">{analysis.why_stuck}</p>

              {/* Reframe */}
              <div className="flex items-start gap-1.5">
                <Sparkles className={`h-3 w-3 mt-0.5 flex-shrink-0 ${blocker.color}`} />
                <p className={`text-xs font-medium ${blocker.color} leading-relaxed`}>{analysis.reframe}</p>
              </div>

              {/* Next action highlight */}
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

              {/* Search link for missing_info */}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
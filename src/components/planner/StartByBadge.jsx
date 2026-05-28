import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { CalendarClock, Loader2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Zap, Clock } from "lucide-react";
import { differenceInDays, format, parseISO } from "date-fns";

function getZone(startByDate) {
  const daysUntilStart = differenceInDays(new Date(startByDate), new Date());
  if (daysUntilStart < 0) return "overdue";
  if (daysUntilStart <= 1) return "crunch";
  if (daysUntilStart <= 3) return "warning";
  return "safe";
}

const ZONE_CONFIG = {
  safe: {
    label: "✓ Safe Zone",
    bg: "bg-emerald-50 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
  },
  warning: {
    label: "⚠ Approaching Crunch Zone",
    bg: "bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-700",
    icon: AlertTriangle,
    iconColor: "text-amber-600",
  },
  crunch: {
    label: "⛔ High Risk of Last-Minute Stress",
    bg: "bg-red-50 border-red-200",
    badge: "bg-red-100 text-red-700",
    icon: Zap,
    iconColor: "text-red-600",
  },
  overdue: {
    label: "⛔ Should Have Started Already",
    bg: "bg-red-50 border-red-200",
    badge: "bg-red-100 text-red-700",
    icon: Zap,
    iconColor: "text-red-600",
  },
};

export default function StartByBadge({ assignment, otherAssignments = [], onUpdate }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const sb = assignment.start_by_analysis;

  const run = async () => {
    if (sb) { setOpen(o => !o); return; }
    setLoading(true);
    setOpen(true);

    const today = new Date().toISOString().slice(0, 10);
    const dueDate = assignment.due_date ? new Date(assignment.due_date).toISOString().slice(0, 10) : "unknown";
    const daysUntilDue = assignment.due_date ? differenceInDays(new Date(assignment.due_date), new Date()) : null;

    const overallLoad = otherAssignments.filter(a => !a.completed && a.id !== assignment.id).length;
    const highPriorityCount = otherAssignments.filter(a => !a.completed && a.priority === "high" && a.id !== assignment.id).length;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a realistic academic planner AI helping a student with ADHD/executive function challenges.
      
Task: "${assignment.name}"
Type: ${assignment.type || "general"}
Course: ${assignment.course_name || "none"}
Priority: ${assignment.priority || "medium"}
Due Date: ${dueDate} (${daysUntilDue !== null ? daysUntilDue + " days from today" : "no deadline"})
Today: ${today}
Number of attached documents: ${(assignment.documents || []).length}
Number of attached links: ${(assignment.links || []).length}
Other active tasks: ${overallLoad} total, ${highPriorityCount} high-priority

Think REALISTICALLY, not optimistically. Account for:
- Procrastination buffer (ADHD users need 2-3x more buffer)
- Document collection or waiting for replies (applications, emails → +3-7 days)
- Emotional resistance (high-resistance tasks need activation buffer)
- Cognitive load from other tasks
- Multi-step complexity

Return JSON:
{
  "estimated_hours": <number, realistic total time>,
  "cognitive_load": "low" | "medium" | "high",
  "resistance_level": "low" | "medium" | "high",
  "has_waiting_dependency": <boolean, true if task requires waiting for reply/document from someone else>,
  "waiting_dependency_note": "<what the student is waiting for, or null>",
  "start_by_date": "<YYYY-MM-DD, the latest realistic start date>",
  "start_by_reason": "<1-2 sentences explaining WHY this date — be empathetic and specific>",
  "dependencies": [
    { "step": "<step name>", "start_by": "<YYYY-MM-DD>", "note": "<why this step needs to start then>" }
  ],
  "adaptive_message": "<If the student is already past the ideal start window, give a compassionate, specific 1-sentence recovery action>",
  "zone": "safe" | "warning" | "crunch"
}`,
      response_json_schema: {
        type: "object",
        properties: {
          estimated_hours: { type: "number" },
          cognitive_load: { type: "string" },
          resistance_level: { type: "string" },
          has_waiting_dependency: { type: "boolean" },
          waiting_dependency_note: { type: "string" },
          start_by_date: { type: "string" },
          start_by_reason: { type: "string" },
          dependencies: { type: "array", items: { type: "object", properties: { step: { type: "string" }, start_by: { type: "string" }, note: { type: "string" } } } },
          adaptive_message: { type: "string" },
          zone: { type: "string" },
        },
      },
    });

    if (result) {
      onUpdate(assignment.id, { start_by_analysis: result });
    }
    setLoading(false);
  };

  const zone = sb ? getZone(sb.start_by_date) : null;
  const zoneConfig = zone ? ZONE_CONFIG[zone] : null;
  const ZoneIcon = zoneConfig?.icon || Clock;

  const startByDays = sb ? differenceInDays(new Date(sb.start_by_date), new Date()) : null;

  return (
    <div className="mt-2">
      <button
        onClick={run}
        className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
          sb
            ? zoneConfig?.iconColor + " hover:opacity-80"
            : "text-primary/70 hover:text-primary"
        }`}
      >
        {loading
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : sb
            ? <ZoneIcon className="h-3 w-3" />
            : <CalendarClock className="h-3 w-3" />
        }
        {loading
          ? "Calculating start date..."
          : sb
            ? <>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${zoneConfig?.badge}`}>{zoneConfig?.label}</span>
                <span className="text-[10px] text-muted-foreground">
                  Start by {format(parseISO(sb.start_by_date), "MMM d")}
                  {startByDays !== null && startByDays <= 0 ? " (now!)" : startByDays !== null ? ` (in ${startByDays}d)` : ""}
                </span>
                {open ? <ChevronUp className="h-3 w-3 ml-0.5" /> : <ChevronDown className="h-3 w-3 ml-0.5" />}
              </>
            : "When should I start this?"
        }
      </button>

      <AnimatePresence>
        {open && sb && zoneConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-2"
          >
            <div className={`rounded-xl border ${zoneConfig.bg} p-3 space-y-3`}>
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-0.5">Recommended Start By</p>
                  <p className="text-lg font-extrabold text-foreground">{format(parseISO(sb.start_by_date), "MMMM d")}</p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-[10px] text-muted-foreground">~{sb.estimated_hours}h total</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                    sb.cognitive_load === "high" ? "bg-red-100 text-red-700" :
                    sb.cognitive_load === "medium" ? "bg-amber-100 text-amber-700" :
                    "bg-emerald-100 text-emerald-700"
                  }`}>
                    {sb.cognitive_load} load
                  </span>
                </div>
              </div>

              {/* Reason */}
              <p className="text-xs text-foreground/80 leading-relaxed">{sb.start_by_reason}</p>

              {/* Waiting dependency */}
              {sb.has_waiting_dependency && sb.waiting_dependency_note && (
                <div className="flex items-start gap-1.5 bg-white/70 rounded-lg px-2.5 py-2 border border-amber-200">
                  <Clock className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-0.5">Waiting Dependency</p>
                    <p className="text-xs text-amber-800">{sb.waiting_dependency_note}</p>
                  </div>
                </div>
              )}

              {/* Step-by-step start dates */}
              {sb.dependencies?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Step Breakdown</p>
                  {sb.dependencies.map((dep, i) => {
                    const depZone = getZone(dep.start_by);
                    const depDays = differenceInDays(new Date(dep.start_by), new Date());
                    return (
                      <div key={i} className="flex items-start gap-2 bg-white/60 rounded-lg px-2.5 py-2 border border-white/80">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 mt-0.5 ${ZONE_CONFIG[depZone]?.badge}`}>
                          {format(parseISO(dep.start_by), "MMM d")}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{dep.step}</p>
                          {dep.note && <p className="text-[10px] text-muted-foreground leading-snug">{dep.note}</p>}
                        </div>
                        {depDays <= 0 && (
                          <span className="text-[9px] font-bold text-red-600 flex-shrink-0">Now!</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Adaptive message — shown when past start window */}
              {startByDays !== null && startByDays <= 1 && sb.adaptive_message && (
                <div className="flex items-start gap-1.5 bg-white/70 rounded-lg px-2.5 py-2 border border-red-200">
                  <Zap className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700 font-medium leading-relaxed">{sb.adaptive_message}</p>
                </div>
              )}

              {/* Recalculate */}
              <button
                onClick={async () => {
                  onUpdate(assignment.id, { start_by_analysis: null });
                  setOpen(false);
                  setTimeout(run, 100);
                }}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              >
                Recalculate
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
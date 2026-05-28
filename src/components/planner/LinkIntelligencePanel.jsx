import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  Sparkles, Loader2, ChevronDown, ChevronUp, CheckCircle2, Circle,
  AlertTriangle, Clock, FileText, Calendar, Phone, Mail, ExternalLink,
  Shield, Zap, RefreshCw
} from "lucide-react";

const TASK_TYPE_COLORS = {
  housing: "bg-blue-50 border-blue-200 text-blue-700",
  financial_aid: "bg-green-50 border-green-200 text-green-700",
  scholarship: "bg-purple-50 border-purple-200 text-purple-700",
  internship: "bg-orange-50 border-orange-200 text-orange-700",
  application: "bg-pink-50 border-pink-200 text-pink-700",
  onboarding: "bg-teal-50 border-teal-200 text-teal-700",
  forms: "bg-slate-50 border-slate-200 text-slate-700",
  other: "bg-muted border-border text-muted-foreground",
};

const EFFORT_COLORS = {
  low: "text-emerald-600 bg-emerald-50",
  medium: "text-amber-600 bg-amber-50",
  high: "text-red-600 bg-red-50",
};

export default function LinkIntelligencePanel({ assignment, url, onUpdate, onGenerateSubtasks }) {
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState(assignment.link_intelligence || null);
  const [expanded, setExpanded] = useState(!!result);
  const [completedSteps, setCompletedSteps] = useState(
    () => (result?.required_steps || []).map((_, i) => result?.completed_steps?.[i] || false)
  );
  const [completedDocs, setCompletedDocs] = useState(
    () => (result?.required_documents || []).map(d => d.completed || false)
  );
  const [activeSection, setActiveSection] = useState("steps");

  const parseLink = async () => {
    setParsing(true);
    setExpanded(true);
    const res = await base44.functions.invoke("parseAdminLink", {
      url,
      task_name: assignment.name,
    });
    const parsed = res.data?.result;
    if (parsed) {
      setResult(parsed);
      setCompletedSteps((parsed.required_steps || []).map(() => false));
      setCompletedDocs((parsed.required_documents || []).map(() => false));
      onUpdate(assignment.id, { link_intelligence: parsed });
    }
    setParsing(false);
  };

  const toggleStep = (i) => {
    const updated = completedSteps.map((v, idx) => idx === i ? !v : v);
    setCompletedSteps(updated);
    if (result) {
      const updatedIntelligence = { ...result, completed_steps: updated };
      setResult(updatedIntelligence);
      onUpdate(assignment.id, { link_intelligence: updatedIntelligence });
    }
  };

  const toggleDoc = (i) => {
    const updated = completedDocs.map((v, idx) => idx === i ? !v : v);
    setCompletedDocs(updated);
    if (result) {
      const updatedDocs = result.required_documents.map((d, idx) => ({ ...d, completed: updated[idx] }));
      const updatedIntelligence = { ...result, required_documents: updatedDocs };
      setResult(updatedIntelligence);
      onUpdate(assignment.id, { link_intelligence: updatedIntelligence });
    }
  };

  const stepsCompleted = completedSteps.filter(Boolean).length;
  const stepsTotal = result?.required_steps?.length || 0;
  const docsCompleted = completedDocs.filter(Boolean).length;
  const docsTotal = result?.required_documents?.length || 0;
  const missingDocs = docsTotal - docsCompleted;
  const typeColor = TASK_TYPE_COLORS[result?.task_type] || TASK_TYPE_COLORS.other;

  if (!result && !parsing) {
    return (
      <button
        onClick={parseLink}
        className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        <Sparkles className="h-3 w-3" />
        Analyze this link with AI
      </button>
    );
  }

  return (
    <div className="mt-2">
      {parsing ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center gap-2">
          <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-primary">Analyzing page...</p>
            <p className="text-[10px] text-primary/70">Extracting steps, documents, and deadlines</p>
          </div>
        </div>
      ) : result && (
        <div className="rounded-xl border border-border/60 bg-white overflow-hidden">
          {/* Header */}
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold text-foreground">AI Breakdown</p>
                <p className="text-[10px] text-muted-foreground">
                  {stepsCompleted}/{stepsTotal} steps · {docsCompleted}/{docsTotal} docs
                  {missingDocs > 0 && <span className="text-amber-600"> · {missingDocs} missing</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); parseLink(); }}
                title="Re-analyze"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
              {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 space-y-3">
                  {/* AI Message */}
                  {result.ai_message && (
                    <div className="flex items-start gap-2 bg-primary/5 rounded-lg px-2.5 py-2">
                      <Sparkles className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] font-medium text-primary leading-relaxed">{result.ai_message}</p>
                    </div>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {result.task_type && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${typeColor}`}>
                        {result.task_type.replace("_", " ").toUpperCase()}
                      </span>
                    )}
                    {result.estimated_total_minutes && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />~{result.estimated_total_minutes} min total
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  {stepsTotal > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Progress</p>
                        <p className="text-[10px] text-muted-foreground">{Math.round((stepsCompleted / stepsTotal) * 100)}%</p>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${(stepsCompleted / stepsTotal) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {result.warnings?.length > 0 && (
                    <div className="space-y-1">
                      {result.warnings.map((w, i) => (
                        <div key={i} className="flex items-start gap-1.5 bg-amber-50 rounded-lg px-2.5 py-1.5">
                          <AlertTriangle className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-[11px] text-amber-800">{w}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Section tabs */}
                  <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
                    {[
                      { id: "steps", label: "Steps", count: stepsTotal },
                      { id: "docs", label: "Docs", count: docsTotal },
                      { id: "deadlines", label: "Dates", count: result.deadlines?.length || 0 },
                      { id: "contact", label: "Contact", count: result.contact_info?.length || 0 },
                    ].filter(s => s.count > 0).map(({ id, label, count }) => (
                      <button
                        key={id}
                        onClick={() => setActiveSection(id)}
                        className={`flex-1 text-[10px] font-bold py-1 rounded-md transition-all ${
                          activeSection === id ? "bg-white shadow text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {label} {count > 0 && <span className="opacity-60">({count})</span>}
                      </button>
                    ))}
                  </div>

                  {/* Steps */}
                  {activeSection === "steps" && result.required_steps?.length > 0 && (
                    <div className="space-y-1.5">
                      {result.required_steps.map((step, i) => (
                        <div key={i} className={`flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors ${completedSteps[i] ? "bg-muted/40 opacity-60" : "bg-white border border-border/40"}`}>
                          <button onClick={() => toggleStep(i)} className="mt-0.5 flex-shrink-0">
                            {completedSteps[i]
                              ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                              : <Circle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                            }
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold ${completedSteps[i] ? "line-through text-muted-foreground" : "text-foreground"}`}>{step.title}</p>
                            {step.description && <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>}
                            {step.blocker && (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertTriangle className="h-2.5 w-2.5 text-amber-500" />
                                <p className="text-[10px] text-amber-700">{step.blocker}</p>
                              </div>
                            )}
                          </div>
                          {step.estimated_minutes && (
                            <span className="text-[9px] text-muted-foreground flex-shrink-0 mt-0.5">~{step.estimated_minutes}m</span>
                          )}
                        </div>
                      ))}
                      {/* Generate subtasks */}
                      {onGenerateSubtasks && (
                        <button
                          onClick={() => onGenerateSubtasks(result)}
                          className="w-full mt-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-primary border border-primary/30 rounded-lg py-1.5 hover:bg-primary/5 transition-colors"
                        >
                          <Zap className="h-3 w-3" /> Convert to planner subtasks
                        </button>
                      )}
                    </div>
                  )}

                  {/* Documents */}
                  {activeSection === "docs" && result.required_documents?.length > 0 && (
                    <div className="space-y-1.5">
                      {missingDocs > 0 && (
                        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                          <AlertTriangle className="h-3 w-3 text-amber-600 flex-shrink-0" />
                          <p className="text-[11px] font-semibold text-amber-700">{missingDocs} document{missingDocs > 1 ? "s" : ""} still needed</p>
                        </div>
                      )}
                      {result.required_documents.map((doc, i) => (
                        <div key={i} className={`rounded-lg border px-2.5 py-2 transition-colors ${completedDocs[i] ? "bg-muted/30 border-border/30 opacity-60" : "bg-white border-border/50"}`}>
                          <div className="flex items-start gap-2">
                            <button onClick={() => toggleDoc(i)} className="mt-0.5 flex-shrink-0">
                              {completedDocs[i]
                                ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                                : <FileText className="h-4 w-4 text-secondary" />
                              }
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold ${completedDocs[i] ? "line-through text-muted-foreground" : "text-foreground"}`}>{doc.name}</p>
                              {doc.description && <p className="text-[10px] text-muted-foreground mt-0.5">{doc.description}</p>}
                              {doc.how_to_get && (
                                <p className="text-[10px] text-primary/80 mt-0.5 italic">→ {doc.how_to_get}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Deadlines */}
                  {activeSection === "deadlines" && result.deadlines?.length > 0 && (
                    <div className="space-y-1.5">
                      {result.deadlines.map((d, i) => (
                        <div key={i} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 border ${d.is_priority ? "bg-red-50 border-red-200" : "bg-white border-border/40"}`}>
                          <Calendar className={`h-3.5 w-3.5 flex-shrink-0 ${d.is_priority ? "text-red-500" : "text-muted-foreground"}`} />
                          <div>
                            <p className={`text-xs font-semibold ${d.is_priority ? "text-red-700" : "text-foreground"}`}>{d.label}</p>
                            {d.date && <p className={`text-[10px] ${d.is_priority ? "text-red-600" : "text-muted-foreground"}`}>{d.date}</p>}
                          </div>
                          {d.is_priority && (
                            <span className="ml-auto text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md">PRIORITY</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Contact */}
                  {activeSection === "contact" && result.contact_info?.length > 0 && (
                    <div className="space-y-1.5">
                      {result.contact_info.map((c, i) => (
                        <div key={i} className="bg-white border border-border/40 rounded-lg px-2.5 py-2 space-y-1">
                          <p className="text-xs font-semibold text-foreground">{c.name}</p>
                          <div className="flex flex-wrap gap-2">
                            {c.email && (
                              <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-[10px] text-primary hover:underline">
                                <Mail className="h-2.5 w-2.5" />{c.email}
                              </a>
                            )}
                            {c.phone && (
                              <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:underline">
                                <Phone className="h-2.5 w-2.5" />{c.phone}
                              </a>
                            )}
                            {c.website && (
                              <a href={c.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-primary hover:underline">
                                <ExternalLink className="h-2.5 w-2.5" />Website
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Eligibility */}
                  {result.eligibility_requirements?.length > 0 && (
                    <div className="bg-muted/40 rounded-lg px-2.5 py-2 space-y-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Shield className="h-3 w-3 text-muted-foreground" />
                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Eligibility</p>
                      </div>
                      {result.eligibility_requirements.map((req, i) => (
                        <p key={i} className="text-[10px] text-foreground/80 flex items-start gap-1.5">
                          <span className="text-muted-foreground mt-0.5">•</span>{req}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
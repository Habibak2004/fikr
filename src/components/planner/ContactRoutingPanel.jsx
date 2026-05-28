import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Loader2, Mail, ExternalLink, ChevronDown, ChevronUp, Shield, AlertCircle, Building2, Sparkles } from "lucide-react";

const CONFIDENCE_STYLES = {
  high:   { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  medium: { badge: "bg-amber-100 text-amber-700",     dot: "bg-amber-400"   },
  low:    { badge: "bg-slate-100 text-slate-500",      dot: "bg-slate-400"   },
};

function ContactCard({ contact, onDraft, isPrimary }) {
  const conf = CONFIDENCE_STYLES[contact.confidence] || CONFIDENCE_STYLES.low;
  return (
    <div className={`rounded-xl border bg-white p-3 ${isPrimary ? "border-blue-300 shadow-sm" : "border-border/60"}`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground leading-tight">{contact.department}</p>
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="text-[11px] text-blue-600 hover:underline">{contact.email}</a>
            )}
          </div>
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap flex-shrink-0 ${conf.badge}`}>
          {contact.confidence}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{contact.reason}</p>
      {contact.website && (
        <a
          href={contact.website.startsWith("http") ? contact.website : `https://${contact.website}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline mb-2"
        >
          <ExternalLink className="h-3 w-3" /> Visit website
        </a>
      )}
      <button
        onClick={() => onDraft(contact)}
        className="flex items-center gap-1.5 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1.5 rounded-lg transition-colors"
      >
        <Mail className="h-3 w-3" /> Draft Email to This Contact
      </button>
    </div>
  );
}

export default function ContactRoutingPanel({ task, onOpenDraft }) {
  const [open, setOpen] = useState(false);
  const [routing, setRouting] = useState(null);
  const [loading, setLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(null); // contact dept name

  const findContacts = async () => {
    if (routing) { setOpen(o => !o); return; }
    setLoading(true);
    setOpen(true);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an administrative assistant helping a college student figure out WHO to contact for this task.

Task: "${task.name}"
Course: ${task.course_name || "none"}

Search for real departments, offices, and contacts at a typical US university that would handle this request. Use your knowledge of how US universities are organized.

Return JSON:
{
  "routing_summary": "1 sentence explaining the bureaucratic path for this task",
  "primary_contact": {
    "department": "Official department name",
    "email": "likely email format like housing@university.edu (use generic if unsure)",
    "reason": "Why this department handles this",
    "confidence": "high" | "medium" | "low",
    "website": "likely URL path like university.edu/housing or null"
  },
  "alternatives": [
    {
      "department": "Alt department name",
      "email": "alt email or null",
      "reason": "Why they might also be involved",
      "confidence": "medium" | "low",
      "website": null
    }
  ],
  "navigation_tip": "1 practical tip for navigating this office or process"
}`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          routing_summary: { type: "string" },
          primary_contact: {
            type: "object",
            properties: {
              department: { type: "string" },
              email: { type: "string" },
              reason: { type: "string" },
              confidence: { type: "string" },
              website: { type: "string" },
            },
          },
          alternatives: {
            type: "array",
            items: {
              type: "object",
              properties: {
                department: { type: "string" },
                email: { type: "string" },
                reason: { type: "string" },
                confidence: { type: "string" },
                website: { type: "string" },
              },
            },
          },
          navigation_tip: { type: "string" },
        },
      },
    });
    setRouting(result);
    setLoading(false);
  };

  const handleDraft = async (contact) => {
    setDraftLoading(contact.department);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Write a short, professional email for a college student.
Subject context: "${task.name}"
Recipient: ${contact.department}${contact.email ? ` (${contact.email})` : ""}
Keep it under 5 sentences. Be warm, clear, and polite. Include a subject line.
Return JSON: { "subject": "...", "body": "...", "to": "${contact.email || ""}" }`,
      response_json_schema: {
        type: "object",
        properties: {
          subject: { type: "string" },
          body: { type: "string" },
          to: { type: "string" },
        },
      },
    });
    setDraftLoading(null);
    if (result) onOpenDraft?.({ ...result, department: contact.department });
  };

  return (
    <div className="mt-2">
      <button
        onClick={findContacts}
        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Building2 className="h-3 w-3" />}
        {loading ? "Finding contacts..." : routing ? (open ? "Hide contacts" : "Show contacts & routing") : "Find who to contact"}
        {routing && !loading && (open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </button>

      <AnimatePresence>
        {open && routing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-2"
          >
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 space-y-3">
              {/* Summary */}
              <p className="text-xs text-foreground/80 leading-relaxed">{routing.routing_summary}</p>

              {/* Primary contact */}
              {routing.primary_contact && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-blue-700 mb-1.5">Recommended Contact</p>
                  <ContactCard
                    contact={routing.primary_contact}
                    isPrimary
                    onDraft={handleDraft}
                  />
                </div>
              )}

              {/* Alternatives */}
              {routing.alternatives?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">Also Try</p>
                  <div className="space-y-2">
                    {routing.alternatives.map((c, i) => (
                      <ContactCard key={i} contact={c} isPrimary={false} onDraft={handleDraft} />
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation tip */}
              {routing.navigation_tip && (
                <div className="flex items-start gap-1.5 bg-white rounded-lg px-3 py-2 border border-blue-100">
                  <Sparkles className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-foreground/75 leading-relaxed">{routing.navigation_tip}</p>
                </div>
              )}

              {draftLoading && (
                <div className="flex items-center gap-1.5 text-xs text-blue-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Drafting email to {draftLoading}...
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
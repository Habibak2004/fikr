import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Paperclip, Link2, Plus, X, Upload, ExternalLink, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import LinkIntelligencePanel from "@/components/planner/LinkIntelligencePanel";

const ADMIN_KEYWORDS = /housing|intern|apply|application|financial.?aid|scholarship|onboard|enrollment|registrar|admission|bursar|fafsa|fellowship|grant|portal|form|deadline|submit|office|department|student.?service/i;

function isAdminLink(url, taskName = "") {
  return ADMIN_KEYWORDS.test(url) || ADMIN_KEYWORDS.test(taskName);
}

// Any link is potentially analyzable — show the button always
function isAnalyzable(_url, _taskName) {
  return true;
}

export default function AssignmentAttachments({ assignment, onUpdate }) {
  const [activeTab, setActiveTab] = useState("links");
  const [newLink, setNewLink] = useState({ label: "", url: "" });
  const [newDocName, setNewDocName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [aiLink, setAiLink] = useState(() => {
    // Pre-select the first link if intelligence already exists
    const links = assignment.links || [];
    return links.find(l => isAnalyzable(l.url, assignment.name)) || null;
  });

  const links = assignment.links || [];
  const documents = assignment.documents || [];

  const saveLinks = (updated) => onUpdate(assignment.id, { links: updated });
  const saveDocs = (updated) => onUpdate(assignment.id, { documents: updated });

  const addLink = () => {
    if (!newLink.url.trim()) return;
    const label = newLink.label.trim() || newLink.url;
    const url = newLink.url.trim().startsWith("http") ? newLink.url.trim() : `https://${newLink.url.trim()}`;
    const newEntry = { label, url };
    saveLinks([...links, newEntry]);
    // Auto-select for AI analysis
    if (isAnalyzable(url, assignment.name) && !aiLink) {
      setAiLink(newEntry);
    }
    setNewLink({ label: "", url: "" });
  };

  const removeLink = (i) => {
    const removed = links[i];
    saveLinks(links.filter((_, idx) => idx !== i));
    if (aiLink && aiLink.url === removed.url) setAiLink(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    saveDocs([...documents, { name: newDocName || file.name, url: file_url }]);
    setNewDocName("");
    setUploading(false);
  };

  const removeDoc = (i) => saveDocs(documents.filter((_, idx) => idx !== i));

  const handleGenerateSubtasks = (intelligence) => {
    const subtasks = (intelligence.required_steps || []).map(step => ({
      name: step.title,
      priority: step.blocker ? "high" : "medium",
      type: "homework",
      course_id: assignment.course_id || "",
      course_name: assignment.course_name || "",
      course_color: assignment.course_color || "",
      notes: [step.description, step.blocker ? `⚠ ${step.blocker}` : ""].filter(Boolean).join("\n"),
    }));
    if (subtasks.length > 0 && onUpdate._createMany) {
      onUpdate._createMany(subtasks);
    }
  };

  const totalCount = links.length + documents.length;
  const hasIntelligence = !!assignment.link_intelligence;

  return (
    <div className="mt-2 space-y-2">
      {/* AI Intelligence panel — shown for admin links */}
      {aiLink && (
        <LinkIntelligencePanel
          assignment={assignment}
          url={aiLink.url}
          onUpdate={onUpdate}
        />
      )}

      {/* Attachments toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Paperclip className="h-3 w-3" />
        {totalCount > 0 ? `${totalCount} attachment${totalCount > 1 ? "s" : ""}` : "Add documents & links"}
        {open ? " ▲" : " ▼"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-3">
              {/* Tab toggle */}
              <div className="flex gap-1 bg-white rounded-lg p-0.5 border border-border/40 w-fit">
                {[
                  { id: "links", icon: Link2, label: "Links" },
                  { id: "documents", icon: Paperclip, label: "Documents" },
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all ${
                      activeTab === id ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                    {id === "links" && links.length > 0 && <span className="bg-white/30 text-[9px] rounded-full px-1">{links.length}</span>}
                    {id === "documents" && documents.length > 0 && <span className="bg-white/30 text-[9px] rounded-full px-1">{documents.length}</span>}
                  </button>
                ))}
              </div>

              {/* Links tab */}
              {activeTab === "links" && (
                <div className="space-y-2">
                  {links.map((l, i) => (
                    <div key={i} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 border ${aiLink?.url === l.url ? "bg-primary/5 border-primary/30" : "bg-white border-border/40"}`}>
                      <Link2 className="h-3 w-3 text-primary flex-shrink-0" />
                      <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-xs font-medium text-primary hover:underline truncate flex items-center gap-1">
                        {l.label}
                        <ExternalLink className="h-2.5 w-2.5 flex-shrink-0 opacity-60" />
                      </a>
                      {isAnalyzable(l.url, assignment.name) && aiLink?.url !== l.url && (
                        <button
                          onClick={() => setAiLink(l)}
                          className="text-[9px] font-bold text-primary/70 hover:text-primary px-1.5 py-0.5 rounded-md border border-primary/20 hover:border-primary/40 transition-colors flex-shrink-0"
                        >
                          ✦ Analyze
                        </button>
                      )}
                      <button onClick={() => removeLink(i)} className="text-muted-foreground hover:text-red-500 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-1.5">
                    <input
                      placeholder="Label (optional)"
                      value={newLink.label}
                      onChange={e => setNewLink(p => ({ ...p, label: e.target.value }))}
                      className="text-xs border border-border/60 rounded-lg px-2 py-1.5 bg-white outline-none focus:ring-1 focus:ring-primary/30 w-24 flex-shrink-0"
                    />
                    <input
                      placeholder="Paste URL..."
                      value={newLink.url}
                      onChange={e => setNewLink(p => ({ ...p, url: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && addLink()}
                      className="text-xs border border-border/60 rounded-lg px-2 py-1.5 bg-white outline-none focus:ring-1 focus:ring-primary/30 flex-1 min-w-0"
                    />
                    <button
                      onClick={addLink}
                      disabled={!newLink.url.trim()}
                      className="h-7 w-7 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 flex-shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {newLink.url && isAnalyzable(newLink.url, assignment.name) && (
                    <p className="text-[10px] text-primary/70 flex items-center gap-1">
                      ✦ Admin link detected — AI will analyze this automatically
                    </p>
                  )}
                </div>
              )}

              {/* Documents tab */}
              {activeTab === "documents" && (
                <div className="space-y-2">
                  {documents.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-1.5 border border-border/40">
                      <Paperclip className="h-3 w-3 text-secondary flex-shrink-0" />
                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-xs font-medium text-foreground hover:text-primary truncate flex items-center gap-1">
                        {d.name}
                        <ExternalLink className="h-2.5 w-2.5 flex-shrink-0 opacity-40" />
                      </a>
                      <button onClick={() => removeDoc(i)} className="text-muted-foreground hover:text-red-500 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-1.5">
                    <input
                      placeholder="Document name (optional)"
                      value={newDocName}
                      onChange={e => setNewDocName(e.target.value)}
                      className="text-xs border border-border/60 rounded-lg px-2 py-1.5 bg-white outline-none focus:ring-1 focus:ring-primary/30 flex-1 min-w-0"
                    />
                    <label className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors flex-shrink-0 ${uploading ? "bg-muted text-muted-foreground" : "bg-secondary text-white hover:bg-secondary/90"}`}>
                      {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                      {uploading ? "Uploading..." : "Upload"}
                      <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
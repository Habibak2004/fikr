import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Send, Loader2, X, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

// Parse numbered steps out of any assistant message
function extractSteps(text) {
  if (!text) return [];
  const lines = text.split("\n");
  const steps = [];
  const stepRegex = /^[\*\-]?\s*(?:\*\*)?(\d+[\.\)])\s*(?:\*\*)?(.+?)(?:\*\*)?\s*[:—\-]?\s*(.*)/;
  const boldHeaderRegex = /^\*\*(.+?)\*\*[:\s]+(.*)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const m = stepRegex.exec(line);
    if (m) {
      const titleRaw = m[2].replace(/\*\*/g, "").trim();
      const detailRaw = m[3].replace(/\*\*/g, "").trim();
      const durationMatch = (titleRaw + " " + detailRaw).match(/\((\d+[\-–]\d+\s*min|\d+\s*min)\)/i);
      steps.push({
        title: titleRaw.replace(/\(.*?\)/g, "").trim(),
        detail: detailRaw || undefined,
        duration: durationMatch ? durationMatch[1] : undefined,
      });
    }
  }
  return steps;
}

export default function FocusCoachPanel({ selectedCourse, courses, onStepsGenerated, onStepActivated }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [userGoal, setUserGoal] = useState("");
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const courseName = courses.find(c => c.id === selectedCourse)?.name;

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments", selectedCourse],
    queryFn: () => selectedCourse
      ? base44.entities.Assignment.filter({ course_id: selectedCourse }, "-due_date", 50)
      : base44.entities.Assignment.list("-due_date", 50),
    enabled: showGoalInput,
  });

  const pendingAssignments = assignments.filter(a => !a.completed && a.status !== "submitted" && a.status !== "graded");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Extract steps from latest assistant message and pass up
  useEffect(() => {
    const assistantMsgs = messages.filter(m => m.role === "assistant" && m.content);
    if (assistantMsgs.length === 0) return;
    const latest = assistantMsgs[assistantMsgs.length - 1].content;
    const parsed = extractSteps(latest);
    if (parsed.length > 0) {
      onStepsGenerated(parsed);
      onStepActivated(0);
    }
  }, [messages]);

  const openGoalInput = () => {
    setSelectedAssignment("");
    setUserGoal("");
    setShowGoalInput(true);
  };

  const startSession = async (goal) => {
    const pickedAssignment = pendingAssignments.find(a => a.id === selectedAssignment);
    setShowGoalInput(false);
    setOpen(true);
    setCollapsed(false);
    setInitializing(true);

    const conv = await base44.agents.createConversation({
      agent_name: "focus_coach",
      metadata: { name: "Focus Session" },
    });
    setConversation(conv);

    base44.agents.subscribeToConversation(conv.id, (data) => {
      setMessages(data.messages || []);
    });

    let assignmentContext = "";
    if (pickedAssignment) {
      assignmentContext = ` I'm working on: "${pickedAssignment.name}".`
        + (pickedAssignment.description ? ` Details: ${pickedAssignment.description}.` : "")
        + (pickedAssignment.type ? ` Type: ${pickedAssignment.type}.` : "")
        + (pickedAssignment.due_date ? ` Due: ${format(new Date(pickedAssignment.due_date), "MMM d, yyyy")}.` : "")
        + (pickedAssignment.weight ? ` Worth ${pickedAssignment.weight}% of my grade.` : "");
    }

    const goalPart = goal?.trim() ? ` My goal: "${goal.trim()}".` : "";

    const contextMsg = courseName
      ? `I'm starting a focus session for "${courseName}".${assignmentContext}${goalPart} Break my session into 3–5 clear numbered steps I can follow, each with a short description and estimated time. Format each step as: 1. Step Title (X min) — brief description.`
      : `I'm starting a focus session.${assignmentContext}${goalPart} Look at my upcoming assignments and break the session into 3–5 clear numbered steps with estimated times. Format each step as: 1. Step Title (X min) — brief description.`;

    await base44.agents.addMessage(conv, { role: "user", content: contextMsg });
    setInitializing(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !conversation || loading) return;
    const text = input.trim();
    setInput("");
    setLoading(true);
    await base44.agents.addMessage(conversation, { role: "user", content: text });
    setLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const visibleMessages = messages.filter(m => m.role !== "system" && m.content);
  const isStreaming = messages.some(m => m.role === "assistant" && !m.content && m.tool_calls?.length);

  return (
    <>
      {!open && !showGoalInput && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={openGoalInput}
            className="w-full flex items-center gap-3 px-5 py-4 bg-white/70 backdrop-blur-sm border border-stone-200/60 rounded-2xl shadow-sm hover:bg-white/90 hover:border-primary/30 transition-all group"
          >
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-stone-700 group-hover:text-primary transition-colors">Ask Focus Coach to plan my session</p>
              <p className="text-xs text-stone-400">Break it into steps & build a roadmap</p>
            </div>
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {showGoalInput && !open && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="w-full">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-primary/20 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Focus Coach</span>
              </div>
              <p className="text-sm text-stone-500">What do you want to work on? I'll break it into steps.</p>

              {pendingAssignments.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-stone-400 mb-1.5 block">Pick an assignment</label>
                  <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
                    <SelectTrigger className="rounded-xl text-sm border-stone-200">
                      <SelectValue placeholder="Select an assignment (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {pendingAssignments.map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}{a.due_date && ` — due ${format(new Date(a.due_date), "MMM d")}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-stone-400 mb-1.5 block">Or describe what you want to do</label>
                <Input
                  autoFocus={pendingAssignments.length === 0}
                  value={userGoal}
                  onChange={e => setUserGoal(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && startSession(userGoal)}
                  placeholder="e.g. Review Chapter 4, finish the lab report…"
                  className="rounded-xl text-sm border-stone-200"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => startSession(userGoal)} className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-sm">
                  <Sparkles className="h-4 w-4 mr-2" />
                  {selectedAssignment || userGoal.trim() ? "Plan my session" : "Suggest what to study"}
                </Button>
                <Button onClick={() => setShowGoalInput(false)} variant="ghost" className="rounded-xl text-sm">Cancel</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} className="w-full">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-primary/20 shadow-sm">
              {/* Coach header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-primary/5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">Focus Coach</span>
                  {courseName && <span className="text-xs text-stone-400">— {courseName}</span>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setCollapsed(c => !c)} className="text-stone-400 hover:text-stone-600 p-1">
                    {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </button>
                  <button onClick={() => setOpen(false)} className="text-stone-400 hover:text-stone-600 p-1">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {!collapsed && (
                <>
                  <div className="h-64 overflow-y-auto p-4 space-y-3">
                    {initializing && (
                      <div className="flex items-center gap-2 text-stone-400 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" /> Building your plan…
                      </div>
                    )}

                    {visibleMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm ${
                          msg.role === "user"
                            ? "bg-primary text-white"
                            : "bg-stone-100 text-stone-800"
                        }`}>
                          {msg.role === "user" ? (
                            <p>{msg.content}</p>
                          ) : (
                            <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 prose-stone">
                              {msg.content}
                            </ReactMarkdown>
                          )}
                        </div>
                      </div>
                    ))}

                    {(loading || isStreaming) && (
                      <div className="flex justify-start">
                        <div className="bg-stone-100 rounded-2xl px-3 py-2">
                          <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>

                  <div className="flex items-center gap-2 p-3 border-t border-stone-100">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask a follow-up…"
                      className="rounded-xl text-sm border-stone-200"
                      disabled={loading || initializing}
                    />
                    <Button
                      onClick={handleSend}
                      size="icon"
                      className="rounded-xl shrink-0 bg-primary hover:bg-primary/90"
                      disabled={!input.trim() || loading || initializing}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
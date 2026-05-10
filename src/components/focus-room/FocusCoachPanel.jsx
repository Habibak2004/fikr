import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

function parseTaskJSON(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "assistant" || !m.content) continue;
    const jsonMatch = m.content.match(/\{[\s\S]*"sessionGoal"[\s\S]*\}/);
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[0]); } catch { /* continue */ }
    }
  }
  return null;
}

function getLastAssistantText(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === "assistant" && m.content && !m.content.match(/\{[\s\S]*"sessionGoal"/)) {
      return m.content.trim();
    }
  }
  return null;
}

export default function FocusCoachPanel({ selectedCourse, courses, onPlanReady }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userGoal, setUserGoal] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | setup | loading | clarifying | replying | done
  const [clarifyingQuestion, setClarifyingQuestion] = useState("");
  const [clarifyReply, setClarifyReply] = useState("");
  const unsubscribeRef = useRef(null);

  const courseName = courses.find(c => c.id === selectedCourse)?.name;

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments", selectedCourse],
    queryFn: () => selectedCourse
      ? base44.entities.Assignment.filter({ course_id: selectedCourse }, "-due_date", 50)
      : base44.entities.Assignment.list("-due_date", 50),
    enabled: phase === "setup",
  });

  const pendingAssignments = assignments.filter(
    a => !a.completed && a.status !== "submitted" && a.status !== "graded"
  );

  const subscribeAndListen = (conv) => {
    if (unsubscribeRef.current) unsubscribeRef.current();
    const unsub = base44.agents.subscribeToConversation(conv.id, (data) => {
      const msgs = data.messages || [];
      setMessages(msgs);

      // Check if we got a final plan
      const parsed = parseTaskJSON(msgs);
      if (parsed?.tasks?.length) {
        setPhase("done");
        onPlanReady(parsed);
        unsub();
        unsubscribeRef.current = null;
        return;
      }

      // Check if the last assistant message is a clarifying question (not JSON)
      const lastAssistant = getLastAssistantText(msgs);
      if (lastAssistant && msgs[msgs.length - 1]?.role === "assistant") {
        setClarifyingQuestion(lastAssistant);
        setPhase("clarifying");
      }
    });
    unsubscribeRef.current = unsub;
  };

  const startSession = async () => {
    const pickedAssignment = pendingAssignments.find(a => a.id === selectedAssignment);
    setPhase("loading");

    const conv = await base44.agents.createConversation({
      agent_name: "focus_coach",
      metadata: { name: "Focus Session" },
    });
    setConversation(conv);
    subscribeAndListen(conv);

    let assignmentContext = "";
    if (pickedAssignment) {
      assignmentContext = ` Working on: "${pickedAssignment.name}".`
        + (pickedAssignment.description ? ` Context: ${pickedAssignment.description}.` : "")
        + (pickedAssignment.type ? ` Type: ${pickedAssignment.type}.` : "")
        + (pickedAssignment.due_date ? ` Due: ${format(new Date(pickedAssignment.due_date), "MMM d")}.` : "")
        + (pickedAssignment.weight ? ` Worth ${pickedAssignment.weight}%.` : "");
    }

    const goalPart = userGoal.trim() ? ` Goal: "${userGoal.trim()}".` : "";
    const courseCtx = courseName ? ` Course: "${courseName}".` : "";

    const prompt = `Generate a focused session plan for me.${courseCtx}${assignmentContext}${goalPart} If you have enough detail to name specific sections, question numbers, or worksheet chunks — return ONLY the JSON. If you need more information to give literal task names (e.g. which section, which questions), ask ONE short clarifying question instead of returning JSON.`;

    await base44.agents.addMessage(conv, { role: "user", content: prompt });
  };

  const sendClarification = async () => {
    if (!clarifyReply.trim() || !conversation) return;
    setPhase("replying");
    const reply = clarifyReply.trim();
    setClarifyReply("");
    await base44.agents.addMessage(conversation, {
      role: "user",
      content: reply + " Now return ONLY the JSON plan with sessionGoal and tasks.",
    });
  };

  const regenerate = () => {
    if (unsubscribeRef.current) { unsubscribeRef.current(); unsubscribeRef.current = null; }
    setPhase("setup");
    setMessages([]);
    setConversation(null);
    setClarifyingQuestion("");
    setClarifyReply("");
    onPlanReady(null);
  };

  // ── IDLE ──
  if (phase === "idle") {
    return (
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setPhase("setup")}
        className="w-full flex items-center gap-3 px-5 py-4 bg-white/70 backdrop-blur-sm border border-stone-200/60 rounded-2xl shadow-sm hover:bg-white/90 hover:border-primary/30 transition-all group text-left"
      >
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-stone-700 group-hover:text-primary transition-colors">
            Build my focus plan
          </p>
          <p className="text-xs text-stone-400 mt-0.5">AI breaks your session into small, concrete tasks</p>
        </div>
      </motion.button>
    );
  }

  // ── LOADING / REPLYING ──
  if (phase === "loading" || phase === "replying") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white/80 rounded-2xl border border-stone-200/60 p-8 flex flex-col items-center gap-4 text-center"
      >
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
        </div>
        <div>
          <p className="text-sm font-bold text-stone-700">
            {phase === "replying" ? "Got it, building your plan…" : "Building your focus plan…"}
          </p>
          <p className="text-xs text-stone-400 mt-1">Breaking your goals into small, actionable steps</p>
        </div>
      </motion.div>
    );
  }

  // ── CLARIFYING ──
  if (phase === "clarifying") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl border border-primary/20 shadow-sm p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-primary">Focus Coach</span>
        </div>
        <p className="text-sm text-stone-700 leading-relaxed">{clarifyingQuestion}</p>
        <div className="flex gap-2">
          <Input
            autoFocus
            value={clarifyReply}
            onChange={e => setClarifyReply(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendClarification()}
            placeholder="Type your answer…"
            className="rounded-xl text-sm border-stone-200 flex-1"
          />
          <Button
            onClick={sendClarification}
            disabled={!clarifyReply.trim()}
            className="rounded-xl bg-primary hover:bg-primary/90 px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <button onClick={regenerate} className="text-xs text-stone-400 hover:text-primary underline">
          Start over
        </button>
      </motion.div>
    );
  }

  // ── DONE ──
  if (phase === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary/5 border border-primary/20 rounded-2xl px-5 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-primary">Plan ready! Check your task cards →</p>
        </div>
        <button onClick={regenerate} className="text-xs text-stone-400 hover:text-primary underline">
          Regenerate
        </button>
      </motion.div>
    );
  }

  // ── SETUP ──
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl border border-primary/20 shadow-sm p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-primary">Focus Coach</span>
        </div>
        <p className="text-sm text-stone-500 leading-relaxed">
          Tell me what you're working on and I'll build a concrete, step-by-step plan — no vague advice.
        </p>

        {pendingAssignments.length > 0 && (
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-1.5 block">Pick an assignment</label>
            <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
              <SelectTrigger className="rounded-xl text-sm border-stone-200">
                <SelectValue placeholder="Select assignment (optional)" />
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
          <label className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-1.5 block">Or describe what you need to do</label>
          <Input
            autoFocus
            value={userGoal}
            onChange={e => setUserGoal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && startSession()}
            placeholder="e.g. Prepare for Circuits midterm, finish lab report section 3…"
            className="rounded-xl text-sm border-stone-200"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={startSession} className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-sm">
            <Sparkles className="h-4 w-4 mr-2" /> Build my plan
          </Button>
          <Button onClick={() => setPhase("idle")} variant="ghost" className="rounded-xl text-sm text-stone-500">
            Cancel
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Send, Loader2, Sparkles, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

export default function StudyCoach() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your Fikr Study Coach 🧠\n\nI can help you with:\n- **Personalized study advice** based on your courses\n- **Exam preparation** strategies\n- **Time management** tips\n- **Concept explanations** for any topic\n\nWhat would you like help with?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list("-created_date", 50),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => base44.entities.Assignment.list("-due_date", 50),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    const courseContext = courses.map(c => `${c.code}: ${c.name} (${c.progress || 0}% complete)`).join("\n");
    const assignmentContext = assignments.slice(0, 10).map(a => `${a.name} (${a.course_name}) - due: ${a.due_date || "TBD"}, status: ${a.status}`).join("\n");

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Fikr Study Coach, an AI study companion for university students. Be encouraging, specific, and actionable.

Student's courses:
${courseContext || "No courses yet"}

Upcoming assignments:
${assignmentContext || "No assignments yet"}

Conversation so far:
${messages.map(m => `${m.role}: ${m.content}`).join("\n")}

Student: ${userMsg}

Respond as the study coach. Use markdown for formatting. Keep responses focused and helpful.`,
    });

    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setLoading(false);
  };

  const suggestions = [
    "How should I prepare for my upcoming exam?",
    "Help me create a study schedule for this week",
    "What's the best way to review my notes?",
    "I'm feeling overwhelmed, what should I prioritize?"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] lg:h-screen max-w-3xl mx-auto">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Study Coach</h1>
            <p className="text-xs text-muted-foreground">Powered by Fikr Intelligence</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border/60"
              }`}>
                {msg.role === "user" ? (
                  <p className="text-sm">{msg.content}</p>
                ) : (
                  <ReactMarkdown className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 prose-p:my-1 prose-li:my-0 prose-ul:my-1 prose-ol:my-1 prose-headings:my-2">
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
              {msg.role === "user" && (
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-card border border-border/60 rounded-2xl px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {messages.length === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            {suggestions.map((s) => (
              <button key={s} onClick={() => { setInput(s); }}
                className="text-left p-3 rounded-xl border border-border/60 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-6 pt-3">
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask your study coach..."
            className="rounded-xl flex-1"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()} className="rounded-xl bg-primary hover:bg-primary/90">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Loader2, MessageSquare, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

export default function FocusCoachPanel({ selectedCourse, courses }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const courseName = courses.find(c => c.id === selectedCourse)?.name;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startSession = async () => {
    setOpen(true);
    setInitializing(true);
    const conv = await base44.agents.createConversation({
      agent_name: "focus_coach",
      metadata: { name: "Focus Session" },
    });
    setConversation(conv);

    const unsubscribe = base44.agents.subscribeToConversation(conv.id, (data) => {
      setMessages(data.messages || []);
    });

    // Send the initial context prompt automatically
    const contextMsg = courseName
      ? `I'm about to start a 25-minute Pomodoro session for "${courseName}". Please analyze my pending assignments and study materials for this course and give me a prioritized agenda for this session.`
      : `I'm about to start a 25-minute Pomodoro session. Please look at all my upcoming assignments and give me the top 2–3 things I should focus on right now.`;

    await base44.agents.addMessage(conv, { role: "user", content: contextMsg });
    setInitializing(false);

    return unsubscribe;
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const visibleMessages = messages.filter(m => m.role !== "system" && m.content);
  const isStreaming = messages.some(m => m.role === "assistant" && !m.content && m.tool_calls?.length);

  return (
    <>
      {!open && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Button
            onClick={startSession}
            variant="outline"
            className="rounded-2xl h-12 px-6 border-primary/30 text-primary hover:bg-primary/5 gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Ask Focus Coach to prioritize my tasks
          </Button>
        </motion.div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="w-full"
          >
            <Card className="rounded-2xl overflow-hidden border border-primary/20">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-primary/5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">Focus Coach</span>
                  {courseName && (
                    <span className="text-xs text-muted-foreground">— {courseName}</span>
                  )}
                </div>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="h-72 overflow-y-auto p-4 space-y-4">
                {initializing && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing your tasks…
                  </div>
                )}

                {visibleMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}>
                      {msg.role === "user" ? (
                        <p>{msg.content}</p>
                      ) : (
                        <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                ))}

                {(loading || isStreaming) && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-xl px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              <div className="flex items-center gap-2 p-3 border-t">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a follow-up…"
                  className="rounded-xl text-sm"
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
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
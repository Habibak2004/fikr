import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckCircle2, Circle, Zap, X, Trash2 } from "lucide-react";

export default function FinishRightNow() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  const addTask = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    // Support pasting multiple lines at once
    const lines = trimmed.split("\n").map(l => l.trim()).filter(Boolean);
    setTasks(prev => [...prev, ...lines.map(name => ({ id: Date.now() + Math.random(), name, done: false }))]);
    setInput("");
  };

  const toggle = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove = (id) => setTasks(prev => prev.filter(t => t.id !== id));
  const clearDone = () => setTasks(prev => prev.filter(t => !t.done));

  const pending = tasks.filter(t => !t.done);
  const done = tasks.filter(t => t.done);

  return (
    <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCollapsed(c => !c)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="h-7 w-7 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-sm leading-tight">Finish Right Now</h3>
            <p className="text-[11px] text-muted-foreground">
              {tasks.length === 0 ? "Sprint through tasks fast" : `${pending.length} left · ${done.length} done`}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-2">
          {done.length > 0 && (
            <button onClick={clearDone} className="text-[11px] font-semibold text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1">
              <Trash2 className="h-3 w-3" /> Clear done
            </button>
          )}
          <button onClick={() => setCollapsed(c => !c)} className="text-xs text-muted-foreground hover:text-foreground">
            {collapsed ? "▼" : "▲"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {/* Task list */}
            {tasks.length > 0 && (
              <div className="space-y-1.5 mb-3">
                <AnimatePresence initial={false}>
                  {tasks.map(t => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8, height: 0 }}
                      className={`flex items-center gap-2.5 bg-white rounded-xl px-3 py-2.5 border transition-all ${t.done ? "border-border/30 opacity-50" : "border-border/60 shadow-sm"}`}
                    >
                      <button onClick={() => toggle(t.id)} className="flex-shrink-0 transition-transform hover:scale-110">
                        {t.done
                          ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          : <Circle className="h-5 w-5 text-border hover:text-emerald-400 transition-colors" />
                        }
                      </button>
                      <span className={`flex-1 text-sm font-medium ${t.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {t.name}
                      </span>
                      <button onClick={() => remove(t.id)} className="flex-shrink-0 text-muted-foreground/40 hover:text-red-400 transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2 items-start">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addTask(); }
                }}
                placeholder={"Add tasks… paste a list or type one per line\nPress Enter to add"}
                rows={input.split("\n").length > 1 ? Math.min(input.split("\n").length + 1, 5) : 2}
                className="flex-1 text-sm py-2.5 px-3 rounded-xl border border-border/60 bg-white outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/50 resize-none transition-all leading-relaxed"
              />
              <button
                onClick={addTask}
                disabled={!input.trim()}
                className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-all flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {tasks.length === 0 && (
              <p className="text-[11px] text-muted-foreground mt-2 text-center">
                Tip: paste a whole list and all lines become tasks instantly ⚡
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
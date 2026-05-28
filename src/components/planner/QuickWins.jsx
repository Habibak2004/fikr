import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowRight, Check, Mail, Upload, User, FileText, Calendar } from "lucide-react";
import { estimateCognitiveLoad } from "@/lib/priorityEngine";

const categoryColors = {
  quick: "bg-emerald-50 text-emerald-700 border-emerald-200",
  admin: "bg-amber-50 text-amber-700 border-amber-200",
  academic: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function QuickWins({ assignments = [] }) {
  const [wins, setWins] = useState([]);
  const [done, setDone] = useState([]);
  const [totalDopamine, setTotalDopamine] = useState(0);

  useEffect(() => {
    // Filter for low cognitive load tasks (cog load <= 4)
    const pending = assignments.filter(a => !a.completed);
    const quickWins = pending
      .map(a => ({
        ...a,
        cogLoad: estimateCognitiveLoad(a),
      }))
      .filter(a => a.cogLoad <= 4)
      .slice(0, 5)
      .map(a => ({
        id: a.id,
        label: a.name,
        course: a.course_name,
        cogLoad: a.cogLoad,
        category: a.cogLoad <= 2 ? "quick" : /email|contact|submit|upload/i.test(a.name) ? "admin" : "academic",
        dopamine: a.cogLoad <= 2 ? "+5" : "+8",
      }));
    setWins(quickWins);
  }, [assignments]);

  const complete = (id) => {
    const w = wins.find(w => w.id === id);
    if (!w) return;
    setDone(d => [...d, id]);
    setTotalDopamine(t => t + parseInt(w.dopamine));
    setTimeout(() => setWins(prev => prev.filter(w => w.id !== id)), 500);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-4 w-4 text-amber-500" />
        <span className="font-semibold text-sm">Quick Wins</span>
        {totalDopamine > 0 && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">+{totalDopamine} Dopamine</span>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        <AnimatePresence>
          {wins.map((w) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              layout
              className="flex-shrink-0 w-44 bg-white border border-border/70 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => complete(w.id)}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${categoryColors[w.category] || "bg-muted text-muted-foreground border-border"}`}>
                  {w.category === "quick" ? "⚡ Quick" : w.category === "admin" ? "📧 Admin" : "📚 Academic"} · Cog {w.cogLoad}/10
                </span>
              </div>
              <p className="text-sm font-medium leading-snug text-foreground">{w.label}</p>
              {w.course && <p className="text-[10px] text-muted-foreground">{w.course}</p>}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-600 font-semibold">{w.dopamine}</span>
                <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors text-muted-foreground">
                  <Check className="h-4 w-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {wins.length === 0 && (
          <div className="text-sm text-muted-foreground py-3 px-1">
            {assignments.length === 0 ? "Add tasks to see quick wins!" : "No quick wins right now. Try completing some tasks!"}
          </div>
        )}
      </div>
    </div>
  );
}
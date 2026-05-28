import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowRight, Check, Plus, Droplets, Mail, Upload, User } from "lucide-react";

const DEFAULT_WINS = [
  { id: "w1", label: "Send email to professor", time: "< 2m", category: "Admin", icon: "mail", dopamine: "+8" },
  { id: "w2", label: "Upload assignment to portal", time: "< 5m", category: "Academic", icon: "upload", dopamine: "+12" },
  { id: "w3", label: "Drink a glass of water", time: "< 1m", category: "Self", icon: "drop", dopamine: "+5" },
];

const icons = {
  mail: <Mail className="h-4 w-4" />,
  upload: <Upload className="h-4 w-4" />,
  drop: <Droplets className="h-4 w-4" />,
  user: <User className="h-4 w-4" />,
};

const categoryColors = {
  Admin: "bg-amber-50 text-amber-700 border-amber-200",
  Academic: "bg-blue-50 text-blue-700 border-blue-200",
  Self: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function QuickWins() {
  const [wins, setWins] = useState(DEFAULT_WINS);
  const [done, setDone] = useState([]);
  const [totalDopamine, setTotalDopamine] = useState(0);

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
                  {w.category} · {w.time}
                </span>
              </div>
              <p className="text-sm font-medium leading-snug text-foreground">{w.label}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-600 font-semibold">{w.dopamine}</span>
                <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors text-muted-foreground">
                  {icons[w.icon] || <ArrowRight className="h-4 w-4" />}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {wins.length === 0 && (
          <div className="text-sm text-muted-foreground py-3 px-1">All quick wins done! 🎉</div>
        )}
      </div>
    </div>
  );
}
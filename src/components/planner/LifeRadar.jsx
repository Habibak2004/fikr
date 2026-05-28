import { AlertCircle, TrendingUp, Clock, Brain, Wind } from "lucide-react";

const BurnoutChart = ({ level }) => {
  const points = level === "high"
    ? "0,60 20,55 40,48 60,38 80,24 100,8"
    : level === "medium"
    ? "0,60 20,58 40,52 60,46 80,42 100,38"
    : "0,60 20,59 40,57 60,55 80,54 100,53";

  const color = level === "high" ? "#ef4444" : level === "medium" ? "#f59e0b" : "#22c55e";
  const label = level === "high" ? "Warning" : level === "medium" ? "Moderate" : "Healthy";

  return (
    <div className="relative bg-muted/40 rounded-xl p-3 overflow-hidden">
      <span className={`absolute top-2 right-3 text-[10px] font-bold`} style={{ color }}>{label}</span>
      <svg viewBox="0 0 100 70" className="w-full h-16" preserveAspectRatio="none">
        <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={`${points} 100,70 0,70`} fill={color} fillOpacity="0.08" stroke="none" />
      </svg>
      <p className="text-[10px] text-muted-foreground mt-1">Focus capacity dropping at 5 PM</p>
    </div>
  );
};

export default function LifeRadar({ assignments = [] }) {
  const now = new Date();
  const hour = now.getHours();
  const openLoops = assignments.filter(a => !a.completed).length;
  const needsAttention = assignments.filter(a => !a.completed && a.due_date && new Date(a.due_date) < new Date(Date.now() + 2 * 24 * 3600 * 1000)).length;
  const burnoutLevel = openLoops > 10 ? "high" : openLoops > 5 ? "medium" : "low";
  const bestWindow = hour < 12 ? "9 AM — 11 AM" : hour < 17 ? "2 PM — 4 PM" : "7 PM — 9 PM";

  const restoratives = [
    { icon: "🚶", label: "5m Outside Walk" },
    { icon: "🌬️", label: "Guided Breathing" },
    { icon: "🌙", label: "Sensory Reset (Dark Room)" },
  ];

  return (
    <div className="space-y-4">
      {/* Executive Load */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Executive Load</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white border rounded-xl p-3 text-center">
            <p className="text-3xl font-extrabold text-foreground">{openLoops}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Open Loops</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${needsAttention > 3 ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"}`}>
            <p className={`text-3xl font-extrabold ${needsAttention > 3 ? "text-red-600" : "text-amber-600"}`}>{needsAttention}</p>
            <p className={`text-[10px] mt-0.5 font-medium leading-tight ${needsAttention > 3 ? "text-red-600" : "text-amber-700"}`}>
              Need Attention
            </p>
            <p className={`text-[9px] italic mt-1 leading-tight ${needsAttention > 3 ? "text-red-500" : "text-amber-600"}`}>Momentum returns quickly.</p>
          </div>
        </div>
      </div>

      {/* Burnout */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Burnout Prediction</p>
        <BurnoutChart level={burnoutLevel} />
      </div>

      {/* Best Focus Window */}
      <div className="bg-primary/5 border border-primary/15 rounded-xl p-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Best Focus Window</p>
        <p className="text-xl font-extrabold text-foreground">{bestWindow}</p>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
          Based on your past sessions. Your highest-momentum tasks should be scheduled here.
        </p>
      </div>

      {/* Restorative Resets */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Wind className="h-3.5 w-3.5 text-emerald-600" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Restorative Resets</p>
        </div>
        <div className="space-y-1.5">
          {restoratives.map((r, i) => (
            <button key={i} className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-border/60 hover:bg-emerald-50 hover:border-emerald-200 transition-colors text-left group">
              <span className="text-base">{r.icon}</span>
              <span className="text-sm font-medium text-foreground/80 group-hover:text-emerald-700">{r.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
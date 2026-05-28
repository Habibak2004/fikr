import { useState } from "react";
import { Brain, TrendingUp, AlertTriangle, Zap, Clock, Target, Shield, Activity } from "lucide-react";
import { motion } from "framer-motion";
import {
  predictBurnoutRisk,
  suggestFocusWindows,
  classifyBlocker,
  sequenceTasks,
  buildUserState,
} from "@/lib/advancedPriorityEngine";

function BurnoutGauge({ risk }) {
  const color = risk >= 7 ? "text-red-500" : risk >= 4 ? "text-amber-500" : "text-emerald-500";
  const bgColor = risk >= 7 ? "bg-red-50" : risk >= 4 ? "bg-amber-50" : "bg-emerald-50";
  const label = risk >= 7 ? "High" : risk >= 4 ? "Moderate" : "Low";

  return (
    <div className={`${bgColor} border border-${color.replace('text-', '')}/30 rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Shield className={`h-4 w-4 ${color}`} />
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Burnout Risk (3 days)</p>
      </div>
      <div className="flex items-end justify-between">
        <p className={`text-2xl font-extrabold ${color}`}>{label}</p>
        <div className="flex items-center gap-1">
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${color.replace('text-', 'bg-')} transition-all duration-500`}
              style={{ width: `${risk * 10}%` }}
            />
          </div>
          <span className={`text-sm font-bold ${color}`}>{Math.round(risk)}/10</span>
        </div>
      </div>
    </div>
  );
}

function FocusWindows({ windows }) {
  if (!windows || windows.length === 0) return null;

  const typeColors = {
    deep_work: "bg-primary/10 text-primary border-primary/30",
    moderate_work: "bg-amber-50 text-amber-700 border-amber-200",
    light_work: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  const typeIcons = {
    deep_work: <Brain className="h-3.5 w-3.5" />,
    moderate_work: <Activity className="h-3.5 w-3.5" />,
    light_work: <Zap className="h-3.5 w-3.5" />,
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Target className="h-4 w-4 text-primary" />
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Optimal Focus Windows</p>
      </div>
      {windows.map((w, i) => (
        <div key={i} className={`${typeColors[w.type]} border rounded-xl p-3`}>
          <div className="flex items-center gap-2 mb-1">
            {typeIcons[w.type]}
            <span className="text-xs font-bold">{w.period}</span>
          </div>
          <p className="text-[11px] opacity-80">{w.recommendation}</p>
          {w.tasks && w.tasks.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {w.tasks.slice(0, 2).map((t, j) => (
                <span key={j} className="text-[10px] bg-white/60 px-1.5 py-0.5 rounded-md font-medium truncate max-w-[150px]">
                  {t.name}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TaskSequence({ sequence }) {
  if (!sequence || sequence.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Suggested Order</p>
      </div>
      <div className="space-y-1.5">
        {sequence.slice(0, 5).map((task, i) => {
          const cogLoad = task.cognitive_load || 5;
          const loadColor = cogLoad >= 7 ? "text-red-500" : cogLoad >= 5 ? "text-amber-500" : "text-emerald-500";
          
          return (
            <div key={task.id} className="flex items-center gap-2 text-sm">
              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <span className="flex-1 truncate">{task.name}</span>
              <span className={`text-[10px] font-medium ${loadColor}`}>
                {cogLoad >= 7 ? "Heavy" : cogLoad >= 5 ? "Moderate" : "Light"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BlockerAnalysis({ assignments }) {
  const [analyzed, setAnalyzed] = useState(null);

  const analyze = () => {
    const pending = assignments.filter(a => !a.completed);
    const blockers = pending.map(t => ({
      task: t,
      blocker: classifyBlocker(t),
    })).filter(b => b.blocker.type !== "unknown");

    setAnalyzed(blockers);
  };

  const blockerColors = {
    high_activation_cost: "bg-orange-50 text-orange-700 border-orange-200",
    emotional_resistance: "bg-pink-50 text-pink-700 border-pink-200",
    cognitive_overload: "bg-purple-50 text-purple-700 border-purple-200",
    dependency_blocked: "bg-blue-50 text-blue-700 border-blue-200",
    avoidance_cycle: "bg-red-50 text-red-700 border-red-200",
  };

  const blockerIcons = {
    high_activation_cost: "🚧",
    emotional_resistance: "😰",
    cognitive_overload: "🧠",
    dependency_blocked: "⏸️",
    avoidance_cycle: "🔄",
  };

  return (
    <div className="space-y-3">
      <button
        onClick={analyze}
        className="w-full text-xs font-semibold text-primary hover:underline flex items-center gap-1"
      >
        <Brain className="h-3 w-3" />
        Analyze Blockers
      </button>

      {analyzed && analyzed.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          {analyzed.slice(0, 3).map(({ task, blocker }, i) => (
            <div
              key={i}
              className={`${blockerColors[blocker.type] || "bg-gray-50"} border rounded-xl p-3`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{blockerIcons[blocker.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold mb-0.5">{blocker.label}</p>
                  <p className="text-[11px] opacity-80 truncate">{task.name}</p>
                  <p className="text-[10px] mt-1.5 italic opacity-70">{blocker.suggestion}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {analyzed && analyzed.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-3">
          No significant blockers detected 🌿
        </p>
      )}
    </div>
  );
}

export default function InsightsPanel({ assignments, energyLevel }) {
  const [expanded, setExpanded] = useState(false);
  const userState = buildUserState(energyLevel, assignments);
  const burnoutRisk = predictBurnoutRisk(assignments, 3);
  const focusWindows = suggestFocusWindows(assignments, userState);
  const sequence = sequenceTasks(assignments, userState);

  return (
    <div className="bg-white border border-border/60 rounded-2xl p-4">
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center justify-between w-full mb-3"
      >
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-bold text-sm">AI Insights</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {expanded ? "Hide" : "Show"} analysis
        </span>
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-4"
        >
          <BurnoutGauge risk={burnoutRisk} />
          <FocusWindows windows={focusWindows} />
          <TaskSequence sequence={sequence} />
          <BlockerAnalysis assignments={assignments} />
        </motion.div>
      )}
    </div>
  );
}
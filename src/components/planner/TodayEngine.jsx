import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Leaf, ChevronDown, ChevronUp, RefreshCw, Brain, Play, CheckCircle2, ArrowRight, AlertTriangle, Clock, Pencil } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { buildAdaptivePlan, buildUserState, estimateCognitiveLoad } from "@/lib/advancedPriorityEngine";
import { base44 } from "@/api/base44Client";

const ENERGY_LABELS = ["", "Drained", "Low", "Tired", "Below avg", "Okay", "Good", "Energized", "Sharp", "Peak", "🔥 Flow"];

function EnergySelector({ value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Your energy right now</span>
        <span className="text-xs font-bold text-primary">{ENERGY_LABELS[value]}</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={e => {
          const newVal = Number(e.target.value);
          localStorage.setItem("fikr_energy_level", String(newVal));
          onChange(newVal);
        }}
        className="w-full accent-primary h-1.5 rounded-full cursor-pointer"
      />
      <div className="flex justify-between text-[9px] text-muted-foreground/60 font-medium">
        <span>Drained</span>
        <span>Peak</span>
      </div>
    </div>
  );
}

function MajorTaskCard({ task, onStartFocus, onToggle, onEdit, rank }) {
  const cogLoad = estimateCognitiveLoad(task);
  const days = task.due_date ? differenceInDays(new Date(task.due_date), new Date()) : null;

  const loadColor = cogLoad >= 7 ? "text-red-500" : cogLoad >= 5 ? "text-amber-500" : "text-emerald-500";
  const loadLabel = cogLoad >= 7 ? "Heavy" : cogLoad >= 5 ? "Moderate" : "Light";

  const rankStyles = [
    "bg-primary text-white border-primary",
    "bg-secondary/80 text-white border-secondary",
    "bg-muted text-foreground border-border",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.07 }}
      className={`bg-white border rounded-2xl p-4 hover:shadow-md transition-all ${task.critical_path ? "border-red-400 bg-red-50/30" : "border-border/70"}`}
    >
      <div className="flex items-start gap-3">
        {/* Rank badge */}
        <div className={`h-7 w-7 rounded-full border-2 flex items-center justify-center text-xs font-extrabold flex-shrink-0 mt-0.5 ${rankStyles[rank] || rankStyles[2]}`}>
          {rank + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[15px] leading-tight">{task.name}</p>
          {task.course_name && (
            <p className="text-xs text-muted-foreground mt-0.5">{task.course_name}</p>
          )}
          {task.critical_path && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                <AlertTriangle className="h-2.5 w-2.5" />
                CRITICAL — BLOCKS PROGRESS
              </span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Cognitive load pill */}
            <span className={`text-[10px] font-bold flex items-center gap-1 ${loadColor}`}>
              <Brain className="h-2.5 w-2.5" />
              {loadLabel} cognitive load
            </span>

            {/* Deadline */}
            {days !== null && (
              <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                days < 0 ? "text-red-500" : days === 0 ? "text-red-500" : days <= 2 ? "text-amber-600" : "text-muted-foreground"
              }`}>
                <Clock className="h-2.5 w-2.5" />
                {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
              </span>
            )}

            {/* Start By zone */}
            {task.start_by_analysis?.urgency_zone === "crunch" && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                <AlertTriangle className="h-2.5 w-2.5" />
                Start today
              </span>
            )}

            {/* Critical path consequence */}
            {task.critical_path && (
              <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md">
                ⚠️ Failure to complete blocks future progress
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
        <button
          onClick={() => onStartFocus(task)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          <Play className="h-3 w-3" /> Focus
        </button>
        <button
          onClick={() => onToggle(task)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
        >
          <CheckCircle2 className="h-3 w-3" /> Done
        </button>
        {onEdit && (
          <button
            onClick={() => onEdit(task)}
            className="ml-auto text-xs font-medium text-muted-foreground hover:text-primary px-2 py-1.5 rounded-xl hover:bg-muted transition-colors flex items-center gap-1"
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
        )}
      </div>
    </motion.div>
  );
}

function QuickWinCard({ task, onToggle, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 bg-emerald-50 border border-emerald-200/70 rounded-xl px-3.5 py-2.5 hover:bg-emerald-100/60 transition-colors"
    >
      <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
        <Zap className="h-3 w-3 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-emerald-900 truncate">{task.name}</p>
        {task.course_name && <p className="text-[11px] text-emerald-700/70">{task.course_name}</p>}
      </div>
      <button
        onClick={() => onToggle(task)}
        className="flex-shrink-0 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 border border-emerald-300 rounded-lg px-2 py-1 hover:bg-emerald-200 transition-colors"
      >
        Done
      </button>
    </motion.div>
  );
}

function RestorativeCard({ message }) {
  return (
    <div className="flex items-start gap-3 bg-violet-50 border border-violet-200/60 rounded-xl px-3.5 py-3">
      <div className="h-6 w-6 rounded-full bg-violet-400 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Leaf className="h-3 w-3 text-white" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600 mb-0.5">Restorative Suggestion</p>
        <p className="text-sm text-violet-900">{message}</p>
      </div>
    </div>
  );
}

function DeprioritizedList({ tasks, onToggle, onStartFocus }) {
  const [open, setOpen] = useState(false);
  if (tasks.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <div className="h-px flex-1 bg-border/60" />
        <span>{open ? "Hide" : "Show"} {tasks.length} deprioritized tasks</span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        <div className="h-px flex-1 bg-border/60" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-3 space-y-2"
          >
            {tasks.map(({ task, score, cogLoad }) => {
              const days = task.due_date ? differenceInDays(new Date(task.due_date), new Date()) : null;
              return (
                <div key={task.id} className="flex items-center gap-3 bg-muted/40 border border-border/50 rounded-xl px-3 py-2.5 opacity-70 hover:opacity-100 transition-opacity">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground/80 truncate">{task.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.course_name && <span className="text-[10px] text-muted-foreground">{task.course_name}</span>}
                      {days !== null && <span className="text-[10px] text-muted-foreground">{days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => onStartFocus(task)} className="text-[10px] font-medium text-muted-foreground hover:text-primary px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors">Focus</button>
                    <button onClick={() => onToggle(task)} className="text-[10px] font-medium text-muted-foreground hover:text-green-600 px-2 py-1 rounded-lg hover:bg-green-50 transition-colors">Done</button>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TodayEngine({ assignments, onStartFocus, onToggle, onEdit }) {
  const [energyLevel, setEnergyLevel] = useState(() => {
    const saved = localStorage.getItem("fikr_energy_level");
    return saved ? Number(saved) : 5;
  });
  const [plan, setPlan] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastBuilt, setLastBuilt] = useState(null);
  const [aiReasoning, setAiReasoning] = useState(null);

  useEffect(() => {
    const generateAdaptivePlan = async () => {
      setRefreshing(true);
      const pending = assignments.filter(a => !a.completed);
      
      if (pending.length === 0) {
        setPlan({ majors: [], quickWins: [], restorative: null, allScored: [], cognitiveLoadBalance: "optimal" });
        setAiReasoning(null);
        setRefreshing(false);
        return;
      }

      try {
        // Build user state model
        const userState = buildUserState(energyLevel, assignments);
        
        // Use advanced engine for behavioral-aware planning
        const adaptivePlan = buildAdaptivePlan(assignments, userState);
        
        // Generate AI reasoning
        const taskSummary = pending.slice(0, 6).map(t => 
          `- "${t.name}" (${t.due_date ? `due ${new Date(t.due_date).toLocaleDateString()}` : 'no deadline'}, ${t.critical_path ? 'critical' : 'standard'})`
        ).join('\n');
        
        const aiResult = await base44.integrations.Core.InvokeLLM({
          prompt: `You're an expert academic productivity coach. Based on these tasks and the user's current state, provide a brief, warm prioritization insight.

User State:
- Energy: ${energyLevel}/10
- Cognitive Capacity: ${userState.cognitiveCapacity}/10
- Burnout Risk: ${userState.burnoutRisk >= 7 ? 'High' : userState.burnoutRisk >= 4 ? 'Moderate' : 'Low'}
- Current Overload: ${userState.currentOverloadScore >= 6 ? 'High' : 'Manageable'}
- Time of Day: ${userState.isPeakHours ? 'Peak focus hours (morning)' : 'Standard hours'}

Tasks:
${taskSummary}

Cognitive Load Balance: ${adaptivePlan.cognitiveLoadBalance}

Provide a 1-2 sentence insight about how to approach these tasks given their energy and state. Be encouraging and specific.`,
        });
        
        setPlan(adaptivePlan);
        setAiReasoning(aiResult);
      } catch (e) {
        console.error('Adaptive planning failed:', e);
        // Fallback: simple plan
        setPlan({
          majors: pending.slice(0, 3),
          quickWins: pending.filter(t => estimateCognitiveLoad(t) <= 4).slice(0, 2),
          restorative: "Take a moment to breathe and start with one small step.",
          allScored: pending.map(t => ({ task: t, score: 50 })),
        });
      }
      
      setLastBuilt(new Date());
      setTimeout(() => setRefreshing(false), 400);
    };
    
    generateAdaptivePlan();
  }, [energyLevel, assignments.length]);

  if (!plan) return null;

  const prioritizedIds = new Set([
    ...plan.majors.map(t => t.id),
    ...plan.quickWins.map(t => t.id),
  ]);
  const deprioritized = plan.allScored.filter(s => !prioritizedIds.has(s.task.id));

  const pending = assignments.filter(a => !a.completed);
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? "Good morning" :
    hour < 17 ? "Good afternoon" :
    "Good evening";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-extrabold text-base text-foreground">Today's Priorities</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1 ml-9">
            {pending.length === 0
              ? "All caught up! 🌿"
              : `AI-selected from ${pending.length} tasks based on your energy & deadlines`}
          </p>
        </div>
        <button
          onClick={() => {
            setRefreshing(true);
            const userState = buildUserState(energyLevel, assignments);
            const adaptivePlan = buildAdaptivePlan(assignments, userState);
            setPlan(adaptivePlan);
            setLastBuilt(new Date());
            setTimeout(() => setRefreshing(false), 400);
          }}
          disabled={refreshing}
          title="Recalculate priorities"
          className="h-7 w-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors flex-shrink-0 mt-0.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* AI Reasoning */}
      {aiReasoning && (
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-xl p-3.5">
          <div className="flex items-start gap-2.5">
            <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Brain className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">AI Priority Strategy</p>
              <p className="text-sm text-foreground/90 leading-relaxed">{aiReasoning}</p>
            </div>
          </div>
        </div>
      )}

      {/* Energy Slider */}
      <div className="bg-muted/40 rounded-xl px-4 py-3 border border-border/40">
        <EnergySelector value={energyLevel} onChange={setEnergyLevel} />
      </div>

      {pending.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-2xl mb-2">🌿</p>
          <p className="font-medium">No pending tasks. You're clear.</p>
        </div>
      ) : (
        <>
          {/* Major Tasks */}
          {plan.majors.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Focus on these</p>
              <div className="space-y-3">
                {plan.majors.map((task, i) => (
                  <MajorTaskCard
                    key={task.id}
                    task={task}
                    rank={i}
                    onStartFocus={onStartFocus}
                    onToggle={onToggle}
                    onEdit={onEdit}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quick Wins */}
          {plan.quickWins.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-emerald-500" />
                Quick wins
              </p>
              <div className="space-y-2">
                {plan.quickWins.map((task, i) => (
                  <QuickWinCard key={task.id} task={task} index={i} onToggle={onToggle} />
                ))}
              </div>
            </div>
          )}

          {/* Restorative */}
          {plan.restorative && <RestorativeCard message={plan.restorative} />}

          {/* Deprioritized */}
          <DeprioritizedList
            tasks={deprioritized}
            onToggle={onToggle}
            onStartFocus={onStartFocus}
          />
        </>
      )}
    </div>
  );
}
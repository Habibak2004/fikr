import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Loader2, ChevronRight } from "lucide-react";
import PlantStage from "@/components/focus-room/garden/PlantStage";

const ADMIN_CATEGORIES = [
  { id: "admin_training", label: "🎓 Training / Certification", code: "TRAIN" },
  { id: "admin_email", label: "📧 Emails & Admin", code: "ADMIN" },
  { id: "admin_work", label: "💼 Work Tasks", code: "WORK" },
  { id: "admin_personal", label: "🧠 Personal Project", code: "PROJ" },
  { id: "admin_other", label: "📋 Other", code: "OTHER" },
];

const TIME_OPTIONS = ["15 min", "30 min", "45 min", "1 hour", "1.5 hours", "2 hours"];
const ENERGY_OPTIONS = [
  { id: "low", label: "🪫 Low — just surviving", desc: "Small, manageable steps" },
  { id: "medium", label: "⚡ Medium — I can do this", desc: "Steady focused work" },
  { id: "high", label: "🔥 High — let's go", desc: "Deep work, hard tasks first" },
];

// Questions shown when no description exists or to supplement it
const BREAKDOWN_QUESTIONS = [
  { id: "goal", label: "What's your main goal for this session?", placeholder: "e.g. Finish the intro paragraph, review chapter 3…" },
  { id: "blocker", label: "Any blockers or things you're unsure about?", placeholder: "e.g. Not sure how to structure it, need to find sources…" },
];

export default function GardenSetup({ onPlanReady }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showAdminCategories, setShowAdminCategories] = useState(false);
  const [userEmail, setUserEmail] = useState(null);

  // Step flow: "select" → "questions" → "generating"
  const [step, setStep] = useState("select");
  const [answers, setAnswers] = useState({ time: "", energy: "", goal: "", blocker: "" });
  const [generating, setGenerating] = useState(false);

  const { data: courses = [] } = useQuery({
    queryKey: ["courses", userEmail],
    queryFn: () => base44.entities.Course.filter({ created_by: userEmail }, "-created_date", 50),
    enabled: !!userEmail,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments", selectedCourse?.id, userEmail],
    queryFn: () => base44.entities.Assignment.filter({ course_id: selectedCourse.id, created_by: userEmail, completed: false }),
    enabled: !!selectedCourse && !!userEmail,
  });

  const { data: allAssignments = [] } = useQuery({
    queryKey: ["all-assignments", userEmail],
    queryFn: () => base44.entities.Assignment.filter({ created_by: userEmail, completed: false }, "-due_date", 100),
    enabled: !!userEmail,
  });

  const urlParams = new URLSearchParams(window.location.search);
  const urlTaskId = urlParams.get("taskId");
  const urlTaskType = urlParams.get("type");

  useEffect(() => {
    base44.auth.me().then(u => setUserEmail(u?.email)).catch(() => {});
    if (urlTaskType === "admin") setShowAdminCategories(true);
  }, []);

  useEffect(() => {
    if (urlTaskId && allAssignments.length > 0) {
      const found = allAssignments.find(a => a.id === urlTaskId);
      if (found) {
        setSelectedAssignment(found);
        if (!found.course_id) setShowAdminCategories(true);
      }
    }
  }, [urlTaskId, allAssignments]);

  const activeTask = selectedAssignment || (selectedAdmin ? { name: selectedAdmin.label } : null);
  const taskDescription = selectedAssignment?.description || "";
  const canProceed = activeTask || selectedCourse;

  const handleStartQuestions = () => setStep("questions");

  const handleGenerate = async () => {
    setGenerating(true);
    setStep("generating");

    const courseCtx = selectedCourse ? `Course: ${selectedCourse.name} (${selectedCourse.code}).` : "";
    const taskCtx = activeTask ? `Task: "${activeTask.name}".` : "";
    const descCtx = taskDescription ? `Task description: "${taskDescription}".` : "";
    const timeCtx = answers.time ? `Available time: ${answers.time}.` : "";
    const energyCtx = answers.energy ? `Energy level: ${answers.energy}.` : "";
    const goalCtx = answers.goal ? `Session goal: "${answers.goal}".` : "";
    const blockerCtx = answers.blocker ? `Blockers/uncertainties: "${answers.blocker}".` : "";

    const prompt = `You are a study session planner. Create a focused, realistic task breakdown for this session.

${courseCtx} ${taskCtx} ${descCtx}
${timeCtx} ${energyCtx} ${goalCtx} ${blockerCtx}

Generate 3–6 concrete, actionable micro-tasks that fit within the available time. Each task should take 5–20 minutes. Adapt difficulty to the energy level. If there's a blocker, address it in the first task.

Return ONLY this JSON (no markdown, no explanation):
{
  "tasks": [
    { "title": "task name", "duration_minutes": 15, "difficulty": "easy|medium|hard" }
  ]
}`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  duration_minutes: { type: "number" },
                  difficulty: { type: "string" },
                },
              },
            },
          },
        },
      });

      onPlanReady({
        tasks: result?.tasks || [],
        courseId: selectedCourse?.id,
        courseName: selectedCourse?.name || selectedAdmin?.label || selectedAssignment?.course_name,
        courseCode: selectedCourse?.code || selectedAdmin?.code,
        assignmentName: activeTask?.name,
      });
    } catch (e) {
      setGenerating(false);
      setStep("questions");
    }
  };

  if (step === "generating") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: "linear-gradient(160deg, #0a0f1a 0%, #0d1f2d 50%, #0f1a2e 100%)" }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
          <PlantStage completedCount={0} />
          <Loader2 className="h-6 w-6 text-emerald-400 animate-spin mx-auto" />
          <p className="text-emerald-300 text-sm font-medium">Building your session plan…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "linear-gradient(160deg, #0a0f1a 0%, #0d1f2d 50%, #0f1a2e 100%)" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-5">

        {/* Header */}
        <div className="text-center space-y-2 pb-2">
          <div className="flex items-center justify-center gap-2">
            <Leaf className="h-5 w-5 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Fikr Focus Garden</span>
          </div>
          <div className="flex justify-center py-2">
            <PlantStage completedCount={0} />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {step === "select" ? "Let's start your session" : "Quick check-in"}
          </h1>
          <p className="text-sm text-slate-400">
            {step === "select" ? "Pick what you're working on" : "Help us tailor your plan"}
          </p>
        </div>

        <AnimatePresence mode="wait">

          {/* ── STEP 1: SELECT ── */}
          {step === "select" && (
            <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

              {/* Tab toggle */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">What are you working on?</p>
                <div className="flex gap-2">
                  <button onClick={() => { setShowAdminCategories(false); setSelectedAdmin(null); }}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: !showAdminCategories ? "#4a7c59" : "rgba(255,255,255,0.07)",
                      color: !showAdminCategories ? "white" : "#94a3b8",
                      border: `1.5px solid ${!showAdminCategories ? "#4a7c59" : "rgba(255,255,255,0.1)"}`,
                    }}>📚 Class Work</button>
                  <button onClick={() => { setShowAdminCategories(true); setSelectedCourse(null); setSelectedAssignment(null); }}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: showAdminCategories ? "#4a7c59" : "rgba(255,255,255,0.07)",
                      color: showAdminCategories ? "white" : "#94a3b8",
                      border: `1.5px solid ${showAdminCategories ? "#4a7c59" : "rgba(255,255,255,0.1)"}`,
                    }}>💼 Admin / Personal</button>
                </div>
              </div>

              {/* Class work: course pills */}
              {!showAdminCategories && (
                <div className="flex flex-wrap gap-2">
                  {courses.map(c => (
                    <button key={c.id} onClick={() => { setSelectedCourse(c); setSelectedAssignment(null); }}
                      className="px-3.5 py-2 rounded-2xl text-sm font-semibold transition-all"
                      style={{
                        background: selectedCourse?.id === c.id ? "#4a7c59" : "white",
                        color: selectedCourse?.id === c.id ? "white" : "#4a7c59",
                        border: `1.5px solid ${selectedCourse?.id === c.id ? "#4a7c59" : "#d1fae5"}`,
                      }}>
                      {c.icon && <span className="mr-1">{c.icon}</span>}{c.code}
                    </button>
                  ))}
                  {courses.length === 0 && (
                    <p className="text-sm text-slate-500 italic">No courses yet — you can still start a session.</p>
                  )}
                </div>
              )}

              {/* Assignment picker for selected course */}
              <AnimatePresence>
                {selectedCourse && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Which assignment?</p>
                    <div className="flex flex-col gap-2">
                      {assignments.map(a => (
                        <button key={a.id} onClick={() => setSelectedAssignment(a)}
                          className="w-full text-left px-4 py-3 rounded-2xl text-sm transition-all"
                          style={{
                            background: selectedAssignment?.id === a.id ? "#f0fdf4" : "white",
                            color: "#374151",
                            border: `1.5px solid ${selectedAssignment?.id === a.id ? "#4a7c59" : "#e5e7eb"}`,
                          }}>
                          <p className="font-semibold">{a.name}</p>
                          {a.description && <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{a.description}</p>}
                          {a.due_date && <p className="text-xs text-stone-400 mt-0.5">Due {new Date(a.due_date).toLocaleDateString()}</p>}
                        </button>
                      ))}
                      <button onClick={() => setSelectedAssignment({ name: "Free study" })}
                        className="w-full text-left px-4 py-3 rounded-2xl text-sm text-stone-400 transition-all hover:bg-stone-50"
                        style={{ border: "1.5px dashed #e5e7eb" }}>
                        Just study freely
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Admin / Personal */}
              {showAdminCategories && (
                <div className="space-y-3">
                  {allAssignments.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">From your planner</p>
                      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1" style={{ scrollbarWidth: "none" }}>
                        {allAssignments.map(a => (
                          <button key={a.id} onClick={() => { setSelectedAssignment(a); setSelectedAdmin(null); }}
                            className="w-full text-left px-4 py-3 rounded-2xl text-sm transition-all"
                            style={{
                              background: selectedAssignment?.id === a.id ? "#f0fdf4" : "rgba(255,255,255,0.06)",
                              color: selectedAssignment?.id === a.id ? "#374151" : "#cbd5e1",
                              border: `1.5px solid ${selectedAssignment?.id === a.id ? "#4a7c59" : "rgba(255,255,255,0.1)"}`,
                            }}>
                            <p className="font-semibold truncate">{a.name}</p>
                            {a.description && (
                              <p className="text-[11px] mt-0.5 opacity-60 line-clamp-1">{a.description}</p>
                            )}
                            {!a.description && (a.course_name || a.type) && (
                              <p className="text-[11px] mt-0.5 opacity-60">{a.course_name || a.type}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Or pick a category</p>
                    <div className="flex flex-col gap-1.5">
                      {ADMIN_CATEGORIES.map(cat => (
                        <button key={cat.id} onClick={() => { setSelectedAdmin(cat); setSelectedAssignment(null); }}
                          className="w-full text-left px-4 py-3 rounded-2xl text-sm transition-all"
                          style={{
                            background: selectedAdmin?.id === cat.id ? "#f0fdf4" : "rgba(255,255,255,0.06)",
                            color: selectedAdmin?.id === cat.id ? "#374151" : "#cbd5e1",
                            border: `1.5px solid ${selectedAdmin?.id === cat.id ? "#4a7c59" : "rgba(255,255,255,0.1)"}`,
                          }}>
                          <p className="font-semibold">{cat.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleStartQuestions}
                disabled={!canProceed}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #5a9a6f, #4a7c59)" }}>
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {/* ── STEP 2: QUESTIONS ── */}
          {step === "questions" && (
            <motion.div key="questions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">

              {/* Task context pill */}
              {activeTask && (
                <div className="px-4 py-2.5 rounded-2xl text-sm font-medium text-emerald-300"
                  style={{ background: "rgba(74,124,89,0.2)", border: "1px solid rgba(74,124,89,0.4)" }}>
                  Working on: <span className="font-bold">{activeTask.name}</span>
                  {taskDescription && (
                    <p className="text-xs mt-1 opacity-70 font-normal line-clamp-2">{taskDescription}</p>
                  )}
                </div>
              )}

              {/* Time available */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">How much time do you have?</p>
                <div className="flex flex-wrap gap-2">
                  {TIME_OPTIONS.map(t => (
                    <button key={t} onClick={() => setAnswers(a => ({ ...a, time: t }))}
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: answers.time === t ? "#4a7c59" : "rgba(255,255,255,0.07)",
                        color: answers.time === t ? "white" : "#94a3b8",
                        border: `1.5px solid ${answers.time === t ? "#4a7c59" : "rgba(255,255,255,0.12)"}`,
                      }}>{t}</button>
                  ))}
                </div>
              </div>

              {/* Energy level */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">What's your energy level?</p>
                <div className="flex flex-col gap-2">
                  {ENERGY_OPTIONS.map(e => (
                    <button key={e.id} onClick={() => setAnswers(a => ({ ...a, energy: e.id }))}
                      className="w-full text-left px-4 py-3 rounded-2xl text-sm transition-all"
                      style={{
                        background: answers.energy === e.id ? "rgba(74,124,89,0.2)" : "rgba(255,255,255,0.05)",
                        border: `1.5px solid ${answers.energy === e.id ? "#4a7c59" : "rgba(255,255,255,0.1)"}`,
                      }}>
                      <p className="font-semibold text-slate-200">{e.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{e.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Breakdown questions — only show if no description */}
              {!taskDescription && BREAKDOWN_QUESTIONS.map(q => (
                <div key={q.id} className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{q.label}</p>
                  <textarea
                    value={answers[q.id]}
                    onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                    placeholder={q.placeholder}
                    rows={2}
                    className="w-full rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
              ))}

              {/* If description exists, show goal question only */}
              {taskDescription && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{BREAKDOWN_QUESTIONS[0].label}</p>
                  <textarea
                    value={answers.goal}
                    onChange={e => setAnswers(a => ({ ...a, goal: e.target.value }))}
                    placeholder={BREAKDOWN_QUESTIONS[0].placeholder}
                    rows={2}
                    className="w-full rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep("select")}
                  className="px-5 py-3 rounded-2xl text-sm font-semibold text-slate-400 transition-all hover:text-slate-200"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.1)" }}>
                  Back
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!answers.time || !answers.energy}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #5a9a6f, #4a7c59)" }}>
                  🌱 Build my plan
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}
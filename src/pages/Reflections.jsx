import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import {
  BookOpen, Star, BarChart2, FileText, Lightbulb, ChevronRight,
  Clock, CheckCircle2, Plus, Brain, TrendingUp, Sparkles
} from "lucide-react";
import ReflectionModal from "@/components/reflections/ReflectionModal";
import LongitudinalInsights from "@/components/reflections/LongitudinalInsights";

const CHECKPOINT_TYPES = [
  {
    id: "semester_setup",
    label: "Semester Setup",
    subtitle: "Start the semester with intention",
    icon: BookOpen,
    color: "bg-blue-50 border-blue-200 text-blue-700",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    badge: "Beginning",
    badgeColor: "bg-blue-100 text-blue-700",
    description: "Set goals, expectations, commitments, and write a letter to your future self.",
  },
  {
    id: "one_third",
    label: "One-Third Check-In",
    subtitle: "Early enough to course-correct",
    icon: TrendingUp,
    color: "bg-amber-50 border-amber-200 text-amber-700",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    badge: "Week 4–5",
    badgeColor: "bg-amber-100 text-amber-700",
    description: "Identify early issues and get a personalized 30-day improvement plan.",
  },
  {
    id: "mid_semester",
    label: "Mid-Semester Review",
    subtitle: "Course-correct before finals",
    icon: BarChart2,
    color: "bg-purple-50 border-purple-200 text-purple-700",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    badge: "Week 7–9",
    badgeColor: "bg-purple-100 text-purple-700",
    description: "Evaluate progress and get an action plan through finals.",
  },
  {
    id: "end_of_semester",
    label: "End-of-Semester Debrief",
    subtitle: "Learn, reflect, plan ahead",
    icon: Star,
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    badge: "Finals",
    badgeColor: "bg-emerald-100 text-emerald-700",
    description: "Full debrief + next semester playbook powered by everything you've reflected on.",
  },
  {
    id: "exam",
    label: "Exam Reflection",
    subtitle: "Turn every exam into a lesson",
    icon: FileText,
    color: "bg-rose-50 border-rose-200 text-rose-700",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    badge: "After Exam",
    badgeColor: "bg-rose-100 text-rose-700",
    description: "Debrief every exam: prep review, mistake analysis, topic confidence, and a next-time plan.",
  },
];

export default function Reflections() {
  const qc = useQueryClient();
  const [activeModal, setActiveModal] = useState(null); // { type, existingReflection? }

  const { data: reflections = [] } = useQuery({
    queryKey: ["reflections"],
    queryFn: () => base44.entities.Reflection.list("-created_date", 100),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list("-created_date", 50),
  });

  const { data: semesters = [] } = useQuery({
    queryKey: ["semesters"],
    queryFn: () => base44.entities.Semester.list("-created_date"),
  });

  const deleteReflection = useMutation({
    mutationFn: (id) => base44.entities.Reflection.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reflections"] }),
  });

  // Group reflections by type, most recent first
  const byType = (type) => reflections.filter(r => r.type === type).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const activeSemester = semesters[0] || null;
  const semesterLabel = activeSemester?.name || "Current Semester";

  const totalReflections = reflections.length;
  const completedTypes = [...new Set(reflections.map(r => r.type))].length;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" /> Reflection System
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your personal academic learning journal — {semesterLabel}
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="text-center">
            <p className="font-bold text-2xl text-primary">{totalReflections}</p>
            <p className="text-muted-foreground text-xs">Reflections</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="font-bold text-2xl text-primary">{completedTypes}/5</p>
            <p className="text-muted-foreground text-xs">Types done</p>
          </div>
        </div>
      </div>

      {/* Checkpoint Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Reflection Checkpoints
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHECKPOINT_TYPES.map((cp) => {
            const history = byType(cp.id);
            const latest = history[0];
            const Icon = cp.icon;
            return (
              <div key={cp.id} className={`border rounded-2xl p-5 ${cp.color} flex flex-col gap-3`}>
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cp.iconBg}`}>
                    <Icon className={`h-5 w-5 ${cp.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm">{cp.label}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cp.badgeColor}`}>{cp.badge}</span>
                    </div>
                    <p className="text-xs opacity-70 mt-0.5">{cp.description}</p>
                  </div>
                </div>

                {history.length > 0 && (
                  <div className="space-y-1.5">
                    {history.slice(0, 2).map((r) => (
                      <div key={r.id} className="flex items-center gap-2 bg-white/60 rounded-xl px-3 py-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        <span className="text-xs font-medium flex-1 truncate">
                          {r.exam_name ? `${r.exam_name} · ` : ""}
                          {r.semester_label || semesterLabel}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(r.created_date), "MMM d")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  size="sm"
                  onClick={() => setActiveModal({ type: cp.id })}
                  className="w-full rounded-xl mt-auto bg-white/80 hover:bg-white text-foreground border border-white/50 shadow-sm font-semibold gap-1.5"
                  variant="outline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {history.length > 0 ? "New Reflection" : "Start Reflection"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Longitudinal Insights */}
      {reflections.length >= 2 && (
        <LongitudinalInsights reflections={reflections} courses={courses} />
      )}

      {/* Recent Reflections */}
      {reflections.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" /> Recent Reflections
          </h2>
          <div className="space-y-2">
            {reflections.slice(0, 10).map((r) => {
              const cp = CHECKPOINT_TYPES.find(c => c.id === r.type);
              const Icon = cp?.icon || FileText;
              return (
                <div key={r.id} className="bg-white border rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cp?.iconBg || "bg-muted"}`}>
                    <Icon className={`h-4 w-4 ${cp?.iconColor || "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{cp?.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {r.exam_name ? `${r.exam_name} · ` : ""}
                      {r.course_name ? `${r.course_name} · ` : ""}
                      {r.semester_label || semesterLabel}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{format(new Date(r.created_date), "MMM d, yyyy")}</span>
                  {r.ai_summary && (
                    <Lightbulb className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" title="Has AI summary" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeModal && (
        <ReflectionModal
          type={activeModal.type}
          semesterLabel={semesterLabel}
          courses={courses}
          onClose={() => setActiveModal(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["reflections"] });
            setActiveModal(null);
          }}
        />
      )}
    </div>
  );
}
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSemesterSetupSteps } from "./steps/SemesterSetupSteps";
import { getOneThirdSteps } from "./steps/OneThirdSteps";
import { getMidSemesterSteps } from "./steps/MidSemesterSteps";
import { getEndOfSemesterSteps } from "./steps/EndOfSemesterSteps";
import { getExamSteps } from "./steps/ExamSteps";
import StepRenderer from "./StepRenderer";

const TYPE_LABELS = {
  semester_setup: "Semester Setup Reflection",
  one_third: "One-Third Check-In",
  mid_semester: "Mid-Semester Review",
  end_of_semester: "End-of-Semester Debrief",
  exam: "Exam Reflection",
};

const AI_PROMPTS = {
  semester_setup: (answers, courses) => `
A student is beginning a new semester. Here is their semester setup reflection:
${JSON.stringify(answers, null, 2)}
Courses: ${courses.map(c => c.name).join(", ")}

Generate a structured JSON response with:
- roadmap: 3-4 sentence semester success roadmap
- predicted_challenges: array of 3 specific predicted challenges
- recommended_workload: brief weekly workload recommendation
- early_warnings: array of 2-3 specific areas to monitor
- encouragement: 2-sentence warm opening encouragement
`,
  one_third: (answers) => `
A student completed their one-third semester check-in:
${JSON.stringify(answers, null, 2)}

Generate a structured JSON response with:
- strengths: array of 2-3 current strengths
- risks: array of 2-3 current risks
- early_warning_signs: array of specific warning signs detected
- burnout_risk: "low" | "moderate" | "high" with 1-sentence explanation
- improvement_plan: array of 5 specific daily/weekly actions for the next 30 days
- encouragement: 2-sentence warm message
`,
  mid_semester: (answers) => `
A student completed their mid-semester reflection:
${JSON.stringify(answers, null, 2)}

Generate a structured JSON response with:
- academic_health: "on track" | "at risk" | "struggling" with explanation
- strengths: array of 2-3 strengths
- weaknesses: array of 2-3 areas to improve
- risk_areas: array of specific risks
- action_plan: array of 5 specific actions through finals
- encouragement: 2-sentence warm message
`,
  end_of_semester: (answers, courses) => `
A student completed their end-of-semester reflection:
${JSON.stringify(answers, null, 2)}
Courses reflected on: ${courses.map(c => c.name).join(", ")}

Generate a structured JSON response with:
- academic_strengths: array of 3 strengths
- academic_challenges: array of 3 challenges
- learning_patterns: array of 2-3 patterns identified
- productivity_patterns: array of 2 patterns
- time_management_insights: 2-sentence insight
- recommended_changes: array of 4 specific changes for next semester
- next_semester_playbook: array of 5 specific playbook items
- encouragement: 2-sentence warm closing message
`,
  exam: (answers) => `
A student completed an exam reflection:
${JSON.stringify(answers, null, 2)}

Generate a structured JSON response with:
- root_causes: array of 2-3 root causes of any struggles
- strengths: array of 2 things that went well
- knowledge_gaps: array of specific topic gaps
- study_strategy_recommendations: array of 3 specific strategies
- preparation_plan: array of 4 specific actions for the next exam
- encouragement: 1-2 sentence warm message
`,
};

export default function ReflectionModal({ type, semesterLabel, courses, onClose, onSaved }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [courseReflections, setCourseReflections] = useState({});
  const [aiReport, setAiReport] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(1);

  const steps = useMemo(() => {
    switch (type) {
      case "semester_setup": return getSemesterSetupSteps(courses);
      case "one_third": return getOneThirdSteps(courses);
      case "mid_semester": return getMidSemesterSteps(courses);
      case "end_of_semester": return getEndOfSemesterSteps(courses);
      case "exam": return getExamSteps(courses);
      default: return [];
    }
  }, [type, courses]);

  const isSummaryStep = step === steps.length;
  const totalSteps = steps.length + 1;
  const progress = Math.round((step / (totalSteps - 1)) * 100);
  const currentStep = steps[step];

  const updateAnswer = (key, value) => setAnswers(a => ({ ...a, [key]: value }));
  const updateCourseReflection = (courseId, key, value) =>
    setCourseReflections(cr => ({ ...cr, [courseId]: { ...(cr[courseId] || {}), [key]: value } }));

  const goNext = async () => {
    setDirection(1);
    if (step === steps.length - 1) {
      // Last real step → generate AI + show summary
      setLoading(true);
      setStep(s => s + 1);
      try {
        const promptFn = AI_PROMPTS[type];
        const prompt = promptFn ? promptFn(answers, courses) : "";
        const res = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: { type: "object" },
        });
        setAiReport(res);
        // Save to DB
        const crArray = Object.entries(courseReflections).map(([cid, data]) => {
          const course = courses.find(c => c.id === cid) || {};
          return { course_id: cid, course_name: course.name, course_code: course.code, data };
        });
        await base44.entities.Reflection.create({
          type,
          semester_label: semesterLabel,
          exam_name: answers.exam_name,
          course_id: answers.course_id,
          course_name: answers.course_name,
          answers,
          course_reflections: crArray,
          ai_report: res,
          ai_summary: typeof res?.encouragement === "string" ? res.encouragement : null,
          completed: true,
        });
        onSaved();
      } catch {
        setAiReport({ encouragement: "Your reflection has been saved. Keep going — every reflection makes you a stronger student." });
      }
      setLoading(false);
    } else {
      setStep(s => s + 1);
    }
  };

  const goBack = () => {
    setDirection(-1);
    setStep(s => Math.max(0, s - 1));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-base font-bold">{TYPE_LABELS[type]}</DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden flex-shrink-0">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right -mt-1 flex-shrink-0">
          {isSummaryStep ? "AI Summary" : `Step ${step + 1} of ${steps.length}`}
        </p>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
          <AnimatePresence mode="wait" custom={direction}>
            {isSummaryStep ? (
              <motion.div key="summary" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4 py-2">
                <div className="flex items-center gap-2 justify-center text-primary mb-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-semibold text-sm">Your AI-Powered Reflection Report</span>
                </div>
                {loading ? (
                  <div className="flex flex-col items-center gap-3 py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Analyzing your reflection…</p>
                  </div>
                ) : (
                  <AISummaryDisplay report={aiReport} type={type} />
                )}
              </motion.div>
            ) : (
              <motion.div
                key={step}
                custom={direction}
                initial={{ opacity: 0, x: direction * 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -30 }}
                transition={{ duration: 0.25 }}
                className="py-2"
              >
                <StepRenderer
                  step={currentStep}
                  answers={answers}
                  courseReflections={courseReflections}
                  onAnswer={updateAnswer}
                  onCourseAnswer={updateCourseReflection}
                  courses={courses}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-3 border-t flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={goBack} disabled={step === 0 || isSummaryStep} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          {isSummaryStep ? (
            <Button onClick={onClose} className="rounded-xl bg-primary" size="sm">Done — Close</Button>
          ) : (
            <Button onClick={goNext} className="rounded-xl bg-primary gap-1" size="sm">
              {step === steps.length - 1 ? (
                <><Sparkles className="h-3.5 w-3.5" /> Generate Report</>
              ) : (
                <>Next <ChevronRight className="h-4 w-4" /></>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AISummaryDisplay({ report, type }) {
  if (!report) return null;

  const Section = ({ title, items, color = "bg-primary/5 text-primary" }) => {
    if (!items || (Array.isArray(items) && items.length === 0)) return null;
    return (
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
        {Array.isArray(items) ? (
          <ul className="space-y-1.5">
            {items.map((item, i) => (
              <li key={i} className={`text-sm px-3 py-2 rounded-lg ${color}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm px-3 py-2 rounded-lg bg-muted">{items}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {report.encouragement && (
        <div className="bg-primary/10 rounded-2xl p-4 text-sm text-primary font-medium leading-relaxed">
          ✨ {report.encouragement}
        </div>
      )}

      {/* Semester Setup */}
      {type === "semester_setup" && (
        <>
          <Section title="Your Semester Roadmap" items={report.roadmap} color="bg-blue-50 text-blue-800" />
          <Section title="Predicted Challenges" items={report.predicted_challenges} color="bg-amber-50 text-amber-800" />
          <Section title="Early Warning Areas" items={report.early_warnings} color="bg-rose-50 text-rose-800" />
          <Section title="Weekly Workload Guide" items={report.recommended_workload} color="bg-muted text-foreground" />
        </>
      )}

      {/* One Third */}
      {type === "one_third" && (
        <>
          <Section title="Current Strengths" items={report.strengths} color="bg-emerald-50 text-emerald-800" />
          <Section title="Current Risks" items={report.risks} color="bg-amber-50 text-amber-800" />
          {report.burnout_risk && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Burnout Risk</p>
              <p className={`text-sm px-3 py-2 rounded-lg font-medium ${report.burnout_risk?.toLowerCase?.().includes?.("high") ? "bg-rose-100 text-rose-800" : report.burnout_risk?.toLowerCase?.().includes?.("moderate") ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                {typeof report.burnout_risk === "object" ? JSON.stringify(report.burnout_risk) : report.burnout_risk}
              </p>
            </div>
          )}
          <Section title="30-Day Improvement Plan" items={report.improvement_plan} color="bg-primary/5 text-primary" />
        </>
      )}

      {/* Mid Semester */}
      {type === "mid_semester" && (
        <>
          {report.academic_health && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Academic Health</p>
              <p className="text-sm px-3 py-2 rounded-lg bg-muted font-medium">{typeof report.academic_health === "object" ? JSON.stringify(report.academic_health) : report.academic_health}</p>
            </div>
          )}
          <Section title="Strengths" items={report.strengths} color="bg-emerald-50 text-emerald-800" />
          <Section title="Areas to Improve" items={report.weaknesses} color="bg-amber-50 text-amber-800" />
          <Section title="Action Plan Through Finals" items={report.action_plan} color="bg-primary/5 text-primary" />
        </>
      )}

      {/* End of Semester */}
      {type === "end_of_semester" && (
        <>
          <Section title="Academic Strengths" items={report.academic_strengths} color="bg-emerald-50 text-emerald-800" />
          <Section title="Challenges" items={report.academic_challenges} color="bg-amber-50 text-amber-800" />
          <Section title="Learning Patterns" items={report.learning_patterns} color="bg-blue-50 text-blue-800" />
          <Section title="Recommended Changes" items={report.recommended_changes} color="bg-purple-50 text-purple-800" />
          <Section title="Next Semester Playbook" items={report.next_semester_playbook} color="bg-primary/5 text-primary" />
        </>
      )}

      {/* Exam */}
      {type === "exam" && (
        <>
          <Section title="Root Causes" items={report.root_causes} color="bg-amber-50 text-amber-800" />
          <Section title="Strengths" items={report.strengths} color="bg-emerald-50 text-emerald-800" />
          <Section title="Knowledge Gaps" items={report.knowledge_gaps} color="bg-rose-50 text-rose-800" />
          <Section title="Study Strategy Recommendations" items={report.study_strategy_recommendations} color="bg-blue-50 text-blue-800" />
          <Section title="Next Exam Preparation Plan" items={report.preparation_plan} color="bg-primary/5 text-primary" />
        </>
      )}
    </div>
  );
}
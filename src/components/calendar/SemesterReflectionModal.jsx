import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { Sparkles, ChevronRight, ChevronLeft, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SEMESTER_QUESTIONS = [
  { id: "highlight", label: "✨ Proudest moment", prompt: "What was your biggest academic win this semester?" },
  { id: "hardest", label: "😤 Hardest challenge", prompt: "What was the most difficult part of this semester — and how did you get through it?" },
  { id: "growth", label: "🌱 Personal growth", prompt: "How have you grown as a student or person this semester?" },
  { id: "habits", label: "📅 Study habits", prompt: "What study habits worked well? What would you change?" },
  { id: "next", label: "🔭 Next semester goals", prompt: "What are 1–2 specific goals you want to carry into next semester?" },
];

const RATING_LABELS = ["Really rough", "Challenging", "Okay overall", "Pretty good", "Amazing"];

// Steps: 0 = semester rating, 1..N = semester questions, N+1..N+courses.length = per-course, last = AI summary
const CHECKIN_LABELS = {
  semester_setup: "🌱 Semester Setup",
  one_third: "⅓ One-Third Check-In",
  mid_semester: "🔄 Mid-Semester Check-In",
  end_of_semester: "🎓 End-of-Semester",
};

export default function SemesterReflectionModal({ open, onClose, semesterId, semesterLabel, courses = [], reflectionType = "end_of_semester", onSave }) {
  const [step, setStep] = useState(0);
  const [semesterRating, setSemesterRating] = useState(0);
  const [semesterAnswers, setSemesterAnswers] = useState({});
  const [courseRatings, setCourseRatings] = useState({});
  const [courseNotes, setCourseNotes] = useState({});
  const [aiSummary, setAiSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const semesterQCount = SEMESTER_QUESTIONS.length;
  const courseCount = courses.length;
  // Step layout: 0=semRating, 1..semesterQCount=semQuestions, semesterQCount+1..semesterQCount+courseCount=courses, last=summary
  const summaryStep = semesterQCount + courseCount + 1;
  const totalSteps = summaryStep + 1;

  const isRatingStep = step === 0;
  const isSummaryStep = step === summaryStep;
  const semQIdx = step >= 1 && step <= semesterQCount ? step - 1 : null; // index into SEMESTER_QUESTIONS
  const courseIdx = step > semesterQCount && step <= semesterQCount + courseCount ? step - semesterQCount - 1 : null; // index into courses

  const currentSemQ = semQIdx !== null ? SEMESTER_QUESTIONS[semQIdx] : null;
  const currentCourse = courseIdx !== null ? courses[courseIdx] : null;

  const progress = Math.round((step / (totalSteps - 1)) * 100);

  const handleNext = async () => {
    if (step === summaryStep - 1) {
      // Generate summary
      setLoading(true);
      setStep(s => s + 1);
      try {
        const semText = SEMESTER_QUESTIONS.map(q => `${q.label}: ${semesterAnswers[q.id] || "(skipped)"}`).join("\n");
        const courseText = courses.map(c =>
          `${c.name} (${c.code || ""}): ${courseRatings[c.id] || "?"}/5 stars — ${courseNotes[c.id] || "(no notes)"}`
        ).join("\n");

        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `A student just completed a full semester reflection for: "${semesterLabel || "this semester"}".
Overall semester rating: ${semesterRating}/5 stars.

Semester reflections:
${semText}

Per-course reflections:
${courseText || "(no courses)"}

Write a warm, encouraging 3–4 sentence closing reflection. Acknowledge their overall journey, mention 1-2 specific courses if relevant, highlight a genuine strength, and offer forward-looking encouragement for next semester. Be specific and human — not generic.`,
        });
        setAiSummary(res);
      } catch {
        setAiSummary("You showed real resilience this semester. Every struggle you faced was a lesson in disguise. Carry your strengths forward — next semester is a fresh page.");
      }
      setLoading(false);
    } else {
      setStep(s => s + 1);
    }
  };

  const handleClose = () => {
    setStep(0);
    setSemesterRating(0);
    setSemesterAnswers({});
    setCourseRatings({});
    setCourseNotes({});
    setAiSummary(null);
    onClose();
  };

  const handleSave = () => {
    if (!onSave) {
      handleClose();
      return;
    }
    const reflectionData = {
      type: reflectionType,
      semester_id: semesterId,
      semester_label: semesterLabel,
      answers: {
        overall_rating: semesterRating,
        ...semesterAnswers,
      },
      course_reflections: courses.map(c => ({
        course_id: c.id,
        course_name: c.name,
        course_code: c.code || "",
        data: {
          rating: courseRatings[c.id] || 0,
          notes: courseNotes[c.id] || "",
        },
      })),
      ai_summary: aiSummary,
      completed: true,
    };
    onSave(reflectionData);
    handleClose();
  };

  const isLastBeforeSummary = step === summaryStep - 1;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-2xl max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{CHECKIN_LABELS[reflectionType] || "🎓 Semester Reflection"}</span>
            <span className="text-muted-foreground font-normal text-sm">— {semesterLabel}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Progress bar */}
        <div className="h-1 bg-muted rounded-full overflow-hidden -mx-1">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Semester star rating */}
          {isRatingStep && (
            <motion.div key="rating" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="py-4 space-y-5">
              <p className="text-center text-muted-foreground text-sm">How would you rate this semester overall?</p>
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setSemesterRating(n)} className="transition-transform hover:scale-110 active:scale-95">
                    <Star className="h-9 w-9" fill={n <= semesterRating ? "hsl(var(--accent))" : "none"} stroke={n <= semesterRating ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))"} />
                  </button>
                ))}
              </div>
              {semesterRating > 0 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center font-medium text-sm">
                  {RATING_LABELS[semesterRating - 1]}
                </motion.p>
              )}
            </motion.div>
          )}

          {/* Semester open questions */}
          {currentSemQ && (
            <motion.div key={currentSemQ.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="py-4 space-y-3">
              <div className="text-center space-y-1">
                <p className="font-medium text-sm">{currentSemQ.label}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{currentSemQ.prompt}</p>
              </div>
              <Textarea
                placeholder="Type your thoughts… (or skip)"
                value={semesterAnswers[currentSemQ.id] || ""}
                onChange={e => setSemesterAnswers(a => ({ ...a, [currentSemQ.id]: e.target.value }))}
                className="rounded-xl min-h-[110px] resize-none text-sm"
                autoFocus
              />
            </motion.div>
          )}

          {/* Per-course step */}
          {currentCourse && (
            <motion.div key={`course-${currentCourse.id}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="py-4 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: (currentCourse.color || "#0061a4") + "20" }}>
                  {currentCourse.icon || "📚"}
                </div>
                <div>
                  <p className="font-semibold text-sm">{currentCourse.name}</p>
                  {currentCourse.code && <p className="text-xs text-muted-foreground">{currentCourse.code}</p>}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2 text-center">Rate this course</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setCourseRatings(r => ({ ...r, [currentCourse.id]: n }))} className="transition-transform hover:scale-110 active:scale-95">
                      <Star className="h-7 w-7" fill={n <= (courseRatings[currentCourse.id] || 0) ? "hsl(var(--accent))" : "none"} stroke={n <= (courseRatings[currentCourse.id] || 0) ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))"} />
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                placeholder="Any thoughts on this course? (wins, struggles, professor, etc.) — optional"
                value={courseNotes[currentCourse.id] || ""}
                onChange={e => setCourseNotes(n => ({ ...n, [currentCourse.id]: e.target.value }))}
                className="rounded-xl min-h-[90px] resize-none text-sm"
              />
            </motion.div>
          )}

          {/* Summary step */}
          {isSummaryStep && (
            <motion.div key="summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="py-4 space-y-4">
              <div className="flex items-center gap-2 justify-center text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Your Semester Summary</span>
              </div>
              {loading ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="h-6 w-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">Crafting your summary…</p>
                </div>
              ) : (
                <div className="bg-muted/50 rounded-2xl p-5 text-sm leading-relaxed text-foreground">
                  {aiSummary}
                </div>
              )}
              {courses.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {courses.map(c => (
                    <span key={c.id} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                      {c.icon || "📚"} {c.name}
                      {courseRatings[c.id] && <span className="text-amber-500">{"★".repeat(courseRatings[c.id])}</span>}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-center text-xs text-muted-foreground">⭐ {semesterRating}/5 · {semesterLabel}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0 || isSummaryStep}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>

          <span className="text-xs text-muted-foreground">{step + 1} / {totalSteps}</span>

          {isSummaryStep ? (
            <Button onClick={handleSave} className="rounded-xl bg-primary hover:bg-primary/90" size="sm">Save & Close</Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={isRatingStep && semesterRating === 0}
              className="rounded-xl bg-primary hover:bg-primary/90 gap-1"
              size="sm"
            >
              {isLastBeforeSummary ? (
                <><Sparkles className="h-3.5 w-3.5" /> Generate summary</>
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
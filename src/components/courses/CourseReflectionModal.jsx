import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { Sparkles, ChevronRight, ChevronLeft, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const QUESTIONS = [
  { id: "highlight", label: "✨ Best moment", prompt: "What was your biggest win or proudest moment in this class?" },
  { id: "struggle", label: "😤 Hardest part", prompt: "What was the most challenging concept or assignment? How did you handle it?" },
  { id: "learned", label: "🧠 Key takeaway", prompt: "What's the most important thing you actually learned — academically or about yourself?" },
  { id: "grade_feel", label: "📊 Grade vs effort", prompt: "How do you feel about your grade relative to the effort you put in?" },
  { id: "next_time", label: "🔄 Do differently", prompt: "What would you do differently if you took a similar class again?" },
  { id: "professor", label: "🎓 Professor reflection", prompt: "How was your experience with the professor? What teaching style worked (or didn't) for you?" },
];

const RATING_LABELS = ["Terrible", "Rough", "Okay", "Good", "Great"];

export default function CourseReflectionModal({ open, onClose, course }) {
  const [step, setStep] = useState(0); // 0 = rating, 1..N = questions, last = AI summary
  const [rating, setRating] = useState(0);
  const [answers, setAnswers] = useState({});
  const [aiSummary, setAiSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const totalSteps = QUESTIONS.length + 2; // rating + questions + summary
  const isRatingStep = step === 0;
  const isSummaryStep = step === QUESTIONS.length + 1;
  const currentQ = !isRatingStep && !isSummaryStep ? QUESTIONS[step - 1] : null;

  const handleNext = async () => {
    if (step === QUESTIONS.length) {
      // Generate AI summary
      setLoading(true);
      setStep(s => s + 1);
      try {
        const answerText = QUESTIONS.map(q => `${q.label}: ${answers[q.id] || "(skipped)"}`).join("\n");
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `A student just completed a reflection for their course: "${course?.name}" (${course?.code || ""}).
Overall rating: ${rating}/5 stars.

Their reflections:
${answerText}

Write a warm, personalized 3–4 sentence closing reflection summary for them. Acknowledge their experience, highlight 1-2 genuine strengths you noticed in their answers, and end with one forward-looking encouragement for their next semester. Be specific to their answers — not generic. Keep it concise and human.`,
        });
        setAiSummary(res);
      } catch {
        setAiSummary("You showed real self-awareness through this reflection. Every challenge you faced became part of your growth. Carry these lessons forward — the next semester is a fresh start.");
      }
      setLoading(false);
    } else {
      setStep(s => s + 1);
    }
  };

  const handleClose = () => {
    setStep(0);
    setRating(0);
    setAnswers({});
    setAiSummary(null);
    onClose();
  };

  const canAdvance = isRatingStep ? rating > 0 : true;
  const progress = Math.round((step / (totalSteps - 1)) * 100);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-2xl max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span style={{ color: course?.color || "hsl(var(--primary))" }}>{course?.icon || "📚"}</span>
            <span>Reflect on {course?.name}</span>
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
          {/* Step 0: Star rating */}
          {isRatingStep && (
            <motion.div key="rating" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="py-4 space-y-5">
              <p className="text-center text-muted-foreground text-sm">How would you rate this class overall?</p>
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setRating(n)} className="transition-transform hover:scale-110 active:scale-95">
                    <Star
                      className="h-9 w-9"
                      fill={n <= rating ? "hsl(var(--accent))" : "none"}
                      stroke={n <= rating ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))"}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center font-medium text-sm">
                  {RATING_LABELS[rating - 1]} semester
                </motion.p>
              )}
            </motion.div>
          )}

          {/* Steps 1-N: Questions */}
          {currentQ && (
            <motion.div key={currentQ.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="py-4 space-y-3">
              <div className="text-center space-y-1">
                <p className="font-medium text-sm">{currentQ.label}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{currentQ.prompt}</p>
              </div>
              <Textarea
                placeholder="Type your thoughts… (or skip)"
                value={answers[currentQ.id] || ""}
                onChange={e => setAnswers(a => ({ ...a, [currentQ.id]: e.target.value }))}
                className="rounded-xl min-h-[110px] resize-none text-sm"
                autoFocus
              />
            </motion.div>
          )}

          {/* Final step: AI Summary */}
          {isSummaryStep && (
            <motion.div key="summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="py-4 space-y-4">
              <div className="flex items-center gap-2 justify-center text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Your Reflection Summary</span>
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
              <div className="text-center">
                <p className="text-xs text-muted-foreground">⭐ {rating}/5 · {course?.semester || "This semester"}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
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
            <Button onClick={handleClose} className="rounded-xl bg-primary hover:bg-primary/90 gap-1" size="sm">
              Done
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canAdvance}
              className="rounded-xl bg-primary hover:bg-primary/90 gap-1"
              size="sm"
            >
              {step === QUESTIONS.length ? (
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
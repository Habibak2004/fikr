import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { Sparkles, ChevronRight, ChevronLeft, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const QUESTIONS = [
  { id: "highlight", label: "✨ Proudest moment", prompt: "What was your biggest academic win this semester?" },
  { id: "hardest", label: "😤 Hardest challenge", prompt: "What was the most difficult part of this semester — and how did you get through it?" },
  { id: "growth", label: "🌱 Personal growth", prompt: "How have you grown as a student or person this semester?" },
  { id: "habits", label: "📅 Study habits", prompt: "What study habits worked well? What would you change?" },
  { id: "next", label: "🔭 Next semester goals", prompt: "What are 1–2 specific goals you want to carry into next semester?" },
];

const RATING_LABELS = ["Really rough", "Challenging", "Okay overall", "Pretty good", "Amazing semester"];

export default function SemesterReflectionModal({ open, onClose, semesterLabel }) {
  const [step, setStep] = useState(0);
  const [rating, setRating] = useState(0);
  const [answers, setAnswers] = useState({});
  const [aiSummary, setAiSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const totalSteps = QUESTIONS.length + 2;
  const isRatingStep = step === 0;
  const isSummaryStep = step === QUESTIONS.length + 1;
  const currentQ = !isRatingStep && !isSummaryStep ? QUESTIONS[step - 1] : null;
  const progress = Math.round((step / (totalSteps - 1)) * 100);

  const handleNext = async () => {
    if (step === QUESTIONS.length) {
      setLoading(true);
      setStep(s => s + 1);
      try {
        const answerText = QUESTIONS.map(q => `${q.label}: ${answers[q.id] || "(skipped)"}`).join("\n");
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `A student just completed a full semester reflection for: "${semesterLabel || "this semester"}".
Overall rating: ${rating}/5 stars.

Their reflections:
${answerText}

Write a warm, encouraging 3–4 sentence closing reflection. Acknowledge their journey, highlight a genuine strength from their answers, and offer one forward-looking encouragement for next semester. Be specific and human — not generic.`,
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
    setRating(0);
    setAnswers({});
    setAiSummary(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-2xl max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>🎓</span>
            <span>Semester Reflection — {semesterLabel}</span>
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
          {isRatingStep && (
            <motion.div key="rating" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="py-4 space-y-5">
              <p className="text-center text-muted-foreground text-sm">How would you rate this semester overall?</p>
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
                  {RATING_LABELS[rating - 1]}
                </motion.p>
              )}
            </motion.div>
          )}

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
              <p className="text-center text-xs text-muted-foreground">⭐ {rating}/5 · {semesterLabel}</p>
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
            <Button onClick={handleClose} className="rounded-xl bg-primary hover:bg-primary/90" size="sm">Done</Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={isRatingStep && rating === 0}
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
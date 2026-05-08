import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, RotateCcw, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PracticeTab({ course }) {
  const [mode, setMode] = useState(null); // 'flashcards' | 'quiz'
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});

  const generate = async (type) => {
    setLoading(true);
    setMode(type);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate ${type === "flashcards" ? "10 flashcards" : "5 multiple choice quiz questions"} for the course: ${course.name} (${course.code}).
        ${course.syllabus_text ? `Syllabus content: ${course.syllabus_text}` : "Generate general content for this course."}
        ${type === "flashcards" ? "Each card should have a front (question) and back (answer)." : "Each question should have 4 options and indicate the correct answer index (0-3)."}`,
      response_json_schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: type === "flashcards" ? {
              type: "object",
              properties: { front: { type: "string" }, back: { type: "string" } }
            } : {
              type: "object",
              properties: {
                question: { type: "string" },
                options: { type: "array", items: { type: "string" } },
                correct_index: { type: "number" }
              }
            }
          }
        }
      }
    });
    setCards(result.items || []);
    setCurrentIndex(0);
    setFlipped(false);
    setQuizAnswers({});
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="p-12 rounded-2xl text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Generating {mode === "flashcards" ? "flashcards" : "quiz"}...</p>
      </Card>
    );
  }

  if (!mode) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-8 rounded-2xl text-center cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all" onClick={() => generate("flashcards")}>
          <Brain className="h-12 w-12 mx-auto text-primary mb-4" />
          <h3 className="font-semibold text-lg mb-2">AI Flashcards</h3>
          <p className="text-sm text-muted-foreground">Auto-generated from your syllabus content</p>
        </Card>
        <Card className="p-8 rounded-2xl text-center cursor-pointer hover:border-secondary/30 hover:shadow-lg transition-all" onClick={() => generate("quiz")}>
          <Zap className="h-12 w-12 mx-auto text-secondary mb-4" />
          <h3 className="font-semibold text-lg mb-2">Quiz Mode</h3>
          <p className="text-sm text-muted-foreground">Test your knowledge with multiple choice</p>
        </Card>
      </div>
    );
  }

  if (mode === "flashcards" && cards.length > 0) {
    const card = cards[currentIndex];
    return (
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline">{currentIndex + 1} / {cards.length}</Badge>
          <Button size="sm" variant="ghost" onClick={() => { setMode(null); setCards([]); }}><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>
        </div>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-lg cursor-pointer"
          onClick={() => setFlipped(!flipped)}
        >
          <Card className="p-8 rounded-2xl min-h-[200px] flex items-center justify-center text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-2">{flipped ? "Answer" : "Question"}</p>
              <p className="text-lg font-medium">{flipped ? card.back : card.front}</p>
              {!flipped && <p className="text-xs text-muted-foreground mt-4">Tap to reveal answer</p>}
            </div>
          </Card>
        </motion.div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="rounded-xl" onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setFlipped(false); }} disabled={currentIndex === 0}>Previous</Button>
          <Button className="rounded-xl bg-primary" onClick={() => { setCurrentIndex(Math.min(cards.length - 1, currentIndex + 1)); setFlipped(false); }} disabled={currentIndex === cards.length - 1}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
        </div>
      </div>
    );
  }

  if (mode === "quiz" && cards.length > 0) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <Badge variant="outline">Quiz Mode</Badge>
          <Button size="sm" variant="ghost" onClick={() => { setMode(null); setCards([]); }}><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>
        </div>
        {cards.map((q, qi) => (
          <Card key={qi} className="p-5 rounded-2xl">
            <p className="font-medium mb-3">{qi + 1}. {q.question}</p>
            <div className="grid grid-cols-1 gap-2">
              {q.options?.map((opt, oi) => {
                const selected = quizAnswers[qi] === oi;
                const isCorrect = q.correct_index === oi;
                const answered = quizAnswers[qi] !== undefined;
                return (
                  <button key={oi} onClick={() => !answered && setQuizAnswers(p => ({ ...p, [qi]: oi }))}
                    className={`text-left p-3 rounded-xl border text-sm transition-all ${
                      answered && isCorrect ? "bg-green-50 border-green-300 text-green-700" :
                      answered && selected && !isCorrect ? "bg-red-50 border-red-300 text-red-700" :
                      selected ? "bg-primary/10 border-primary" : "hover:bg-muted"
                    }`}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
        {Object.keys(quizAnswers).length === cards.length && (
          <Card className="p-5 rounded-2xl bg-primary/5 text-center">
            <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="font-semibold">Score: {cards.filter((q, i) => quizAnswers[i] === q.correct_index).length}/{cards.length}</p>
          </Card>
        )}
      </div>
    );
  }

  return null;
}
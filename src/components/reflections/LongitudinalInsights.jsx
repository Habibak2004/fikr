import { useState } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Brain, Loader2, Sparkles, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

export default function LongitudinalInsights({ reflections, courses }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const summary = reflections.map(r => ({
        type: r.type,
        semester: r.semester_label,
        date: r.created_date,
        answers: r.answers,
        ai_report: r.ai_report,
      }));

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI academic coach analyzing a student's complete reflection history across ${reflections.length} reflections spanning multiple checkpoints.

Reflection data:
${JSON.stringify(summary, null, 2)}

Identify genuine patterns and generate a comprehensive Student Learning Profile. Be specific, personalized, and evidence-based — not generic.

Return a JSON object with:
- academic_patterns: array of 3-4 specific recurring academic patterns (e.g. "Consistently underestimates workload in STEM courses")
- study_patterns: array of 3-4 specific study patterns (e.g. "Active recall consistently outperforms passive review in reflections")
- adhd_focus_patterns: array of 2-3 ADHD/focus patterns if evidence exists
- wellbeing_patterns: array of 2-3 wellbeing/burnout patterns
- biggest_growth: 1-2 sentence description of biggest area of growth
- persistent_challenges: array of 2-3 challenges that appear repeatedly
- recommendations: array of 4-5 highly specific, personalized recommendations based on all patterns
- student_profile_summary: 3-4 sentence personalized student learning profile
`,
        response_json_schema: { type: "object" },
        model: "claude_sonnet_4_6",
      });
      setReport(res);
    } catch {
      setReport({
        student_profile_summary: "Based on your reflections, you show consistent growth and self-awareness. Keep reflecting — the more data you build, the more personalized your insights become.",
        recommendations: ["Continue logging reflections at each checkpoint for richer insights."],
      });
    }
    setLoading(false);
  };

  const Section = ({ icon: Icon, title, items, color }) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="space-y-2">
        <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${color}`}>
          <Icon className="h-3.5 w-3.5" /> {title}
        </div>
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-foreground/90 pl-3 border-l-2 border-muted leading-relaxed">{item}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-primary/5 to-purple-50 border border-primary/20 rounded-2xl p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-bold">Your Student Learning Profile</p>
            <p className="text-xs text-muted-foreground">AI patterns identified across {reflections.length} reflections</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={generate}
          disabled={loading}
          className="rounded-xl bg-primary hover:bg-primary/90 gap-1.5"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {report ? "Refresh Analysis" : "Generate Profile"}
        </Button>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analyzing your reflection history…</p>
        </div>
      )}

      {report && !loading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {report.student_profile_summary && (
            <div className="bg-white rounded-xl p-4 text-sm leading-relaxed font-medium border border-primary/10">
              🎯 {report.student_profile_summary}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Section icon={TrendingUp} title="Academic Patterns" items={report.academic_patterns} color="text-blue-600" />
            <Section icon={Lightbulb} title="Study Patterns" items={report.study_patterns} color="text-amber-600" />
            <Section icon={Brain} title="Focus & ADHD Patterns" items={report.adhd_focus_patterns} color="text-purple-600" />
            <Section icon={AlertTriangle} title="Well-Being Patterns" items={report.wellbeing_patterns} color="text-rose-600" />
          </div>

          {report.biggest_growth && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-1.5">Biggest Growth</p>
              <p className="text-sm text-emerald-800">{report.biggest_growth}</p>
            </div>
          )}

          {report.persistent_challenges?.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-2">Persistent Challenges</p>
              <ul className="space-y-1">
                {report.persistent_challenges.map((c, i) => <li key={i} className="text-sm text-amber-800">{c}</li>)}
              </ul>
            </div>
          )}

          {report.recommendations?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Personalized Recommendations</p>
              <ul className="space-y-2">
                {report.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-primary font-bold flex-shrink-0">{i + 1}.</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {!report && !loading && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Complete reflections across multiple checkpoints to unlock your personalized learning profile.
        </p>
      )}
    </div>
  );
}
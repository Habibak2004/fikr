import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
  BookOpen, Star, BarChart2, FileText, Lightbulb, Clock, 
  CheckCircle2, Brain, TrendingUp, Sparkles, X
} from "lucide-react";

const TYPE_LABELS = {
  semester_setup: "Semester Setup Reflection",
  one_third: "One-Third Check-In",
  mid_semester: "Mid-Semester Review",
  end_of_semester: "End-of-Semester Debrief",
  exam: "Exam Reflection",
};

const TYPE_ICONS = {
  semester_setup: BookOpen,
  one_third: TrendingUp,
  mid_semester: BarChart2,
  end_of_semester: Star,
  exam: FileText,
};

export default function ViewReflectionModal({ reflection, onClose }) {
  const Icon = TYPE_ICONS[reflection.type] || FileText;
  const typeLabel = TYPE_LABELS[reflection.type] || "Reflection";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">{typeLabel}</DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {reflection.semester_label} • {format(new Date(reflection.created_date), "MMM d, yyyy")}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* AI Summary */}
          {reflection.ai_summary && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-primary">AI Summary</span>
              </div>
              <p className="text-sm leading-relaxed text-foreground">{reflection.ai_summary}</p>
            </div>
          )}

          {/* Answers */}
          {reflection.answers && Object.keys(reflection.answers).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Your Responses</h3>
              <div className="space-y-3">
                {Object.entries(reflection.answers).map(([key, value]) => {
                  if (key === "overall_rating") return null; // Skip rating, show separately
                  if (!value) return null;
                  return (
                    <div key={key} className="bg-muted/30 rounded-xl p-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        {key.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                      </p>
                      <p className="text-sm leading-relaxed">{value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Course Reflections */}
          {reflection.course_reflections && reflection.course_reflections.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Course Reflections</h3>
              <div className="grid grid-cols-1 gap-3">
                {reflection.course_reflections.map((cr, i) => (
                  <Card key={i} className="border-border/60">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: (cr.course_code ? "#0061a4" : "#6b7280") + "20" }}>
                          📚
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{cr.course_name}</p>
                          {cr.course_code && <p className="text-xs text-muted-foreground">{cr.course_code}</p>}
                        </div>
                      </div>
                      {cr.data && Object.entries(cr.data).map(([key, value]) => {
                        if (!value) return null;
                        return (
                          <div key={key} className="mt-2">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">
                              {key.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                            </p>
                            <p className="text-sm">{typeof value === "object" ? JSON.stringify(value) : value}</p>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* AI Report (structured) */}
          {reflection.ai_report && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">AI Analysis</h3>
              <div className="bg-muted/30 rounded-2xl p-5 space-y-4">
                {Object.entries(reflection.ai_report).map(([key, value]) => {
                  if (!value) return null;
                  return (
                    <div key={key}>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        {key.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                      </p>
                      {Array.isArray(value) ? (
                        <ul className="space-y-1.5">
                          {value.map((item, i) => (
                            <li key={i} className="text-sm bg-white rounded-lg px-3 py-2">{item}</li>
                          ))}
                        </ul>
                      ) : typeof value === "object" ? (
                        <p className="text-sm bg-white rounded-lg px-3 py-2">{JSON.stringify(value, null, 2)}</p>
                      ) : (
                        <p className="text-sm bg-white rounded-lg px-3 py-2">{value}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t">
          <Button onClick={onClose} variant="outline" size="sm">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
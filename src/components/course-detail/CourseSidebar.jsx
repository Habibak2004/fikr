import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, FileText, Brain, Headphones } from "lucide-react";
import { differenceInDays, isAfter } from "date-fns";

export default function CourseSidebar({ course, assignments }) {
  const nextDeadline = assignments
    .filter(a => !a.completed && a.due_date && isAfter(new Date(a.due_date), new Date()))
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];

  const daysLeft = nextDeadline ? differenceInDays(new Date(nextDeadline.due_date), new Date()) : null;

  // Calculate grade projection
  const graded = assignments.filter(a => a.grade != null && a.weight);
  const totalWeight = graded.reduce((s, a) => s + (a.weight || 0), 0);
  const weightedSum = graded.reduce((s, a) => s + ((a.grade || 0) * (a.weight || 0) / 100), 0);
  const projection = totalWeight > 0 ? Math.round(weightedSum / totalWeight * 100) : null;

  const getLetterGrade = (p) => {
    if (p >= 93) return "A";
    if (p >= 90) return "A-";
    if (p >= 87) return "B+";
    if (p >= 83) return "B";
    if (p >= 80) return "B-";
    if (p >= 77) return "C+";
    if (p >= 73) return "C";
    if (p >= 70) return "C-";
    return "D";
  };

  return (
    <div className="space-y-4">
      {/* Next Deadline */}
      <Card className="p-5 rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Next Deadline</h4>
        </div>
        {nextDeadline ? (
          <>
            <p className="text-3xl font-bold text-primary">{daysLeft}d</p>
            <p className="text-sm text-muted-foreground mt-1">{nextDeadline.name}</p>
            <Badge className={`mt-2 text-[10px] ${daysLeft <= 1 ? "bg-red-100 text-red-700" : daysLeft <= 3 ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"}`}>
              {daysLeft <= 1 ? "Urgent" : daysLeft <= 3 ? "Soon" : "On Track"}
            </Badge>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
        )}
      </Card>

      {/* Grade Projection */}
      <Card className="p-5 rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Grade Projection</h4>
        </div>
        {projection != null ? (
          <>
            <p className="text-3xl font-bold">{getLetterGrade(projection)}</p>
            <p className="text-sm text-muted-foreground mt-1">{projection}% weighted average</p>
            <div className="flex items-center gap-1 mt-2 text-green-600 text-xs font-medium">
              <TrendingUp className="h-3 w-3" /> Trending up
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Enter grades to see projection</p>
        )}
      </Card>

      {/* Weights Breakdown */}
      {course.weights && course.weights.length > 0 && (
        <Card className="p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Grade Weights</h4>
          </div>
          <div className="space-y-2">
            {course.weights.map((w, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm">{w.category}</span>
                <span className="text-sm font-medium">{w.weight}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Study Aids */}
      <Card className="p-5 rounded-2xl">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Study Aids</h4>
        <div className="space-y-2">
          {[
            { icon: FileText, label: "Formula Sheets" },
            { icon: Headphones, label: "Recordings" },
            { icon: Brain, label: "AI Quiz" },
          ].map((aid) => (
            <button key={aid.label} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted transition-colors text-left">
              <aid.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{aid.label}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
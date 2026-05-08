import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, TrendingUp, FileText, Brain, Headphones, CalendarClock } from "lucide-react";
import { differenceInDays, isAfter, format } from "date-fns";
import { Link } from "react-router-dom";

export default function CourseSidebar({ course, assignments }) {
  const nextDeadline = assignments
    .filter(a => !a.completed && a.due_date && isAfter(new Date(a.due_date), new Date()))
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];

  const daysLeft = nextDeadline ? differenceInDays(new Date(nextDeadline.due_date), new Date()) : null;

  const graded = assignments.filter(a => a.grade != null && a.weight);
  const totalWeight = graded.reduce((s, a) => s + (a.weight || 0), 0);
  const weightedSum = graded.reduce((s, a) => s + ((a.grade || 0) * (a.weight || 0) / 100), 0);
  const projectionPct = totalWeight > 0 ? Math.round(weightedSum / totalWeight * 100) : null;

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

  const pointsEarned = graded.reduce((s, a) => s + (a.grade || 0), 0);
  const pointsTotal = graded.length * 100;

  return (
    <div className="space-y-4">
      {/* Next Major Deadline — bold dark card */}
      {nextDeadline ? (
        <div className="rounded-2xl bg-primary p-5 text-white">
          <p className="text-[10px] font-bold tracking-widest uppercase text-white/60 mb-2">Next Major Deadline</p>
          <h3 className="text-xl font-extrabold leading-tight mb-1">{nextDeadline.name}</h3>
          {nextDeadline.due_date && (
            <p className="text-xs text-white/70 mb-3">{format(new Date(nextDeadline.due_date), "MMM dd, yyyy")}</p>
          )}
          <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-semibold">
            <Clock className="h-3 w-3" />
            {daysLeft === 0 ? "Due Today" : `${daysLeft} Days Left`}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-muted p-5">
          <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-1">Next Major Deadline</p>
          <p className="text-sm text-muted-foreground">No upcoming deadlines 🎉</p>
        </div>
      )}

      {/* Grade Projection */}
      <div className="bg-white border rounded-2xl p-5">
        <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-3">Grade Projection</p>
        {projectionPct != null ? (
          <>
            <p className="text-xs text-muted-foreground mb-1">Current Estimated Grade</p>
            <p className="text-4xl font-extrabold mb-1">{getLetterGrade(projectionPct)}</p>
            <p className="text-xs text-green-600 font-medium mb-3">+{projectionPct}% weighted avg</p>
            {pointsTotal > 0 && (
              <>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Points Earned</span>
                  <span className="font-semibold">{pointsEarned} / {pointsTotal}</span>
                </div>
                <Progress value={(pointsEarned / pointsTotal) * 100} className="h-1.5 rounded-full" />
              </>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Enter grades to see projection</p>
        )}
      </div>

      {/* Study Aids */}
      <div className="bg-white border rounded-2xl p-5">
        <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-3">Study Aids</p>
        <div className="divide-y">
          {[
            { icon: FileText, label: "Formula Sheet", sub: "PDF", href: "/materials" },
            { icon: Headphones, label: "Lecture Recordings", sub: "Videos", href: "/materials" },
            { icon: Brain, label: "AI Practice Quiz", sub: "Interactive", href: "/practice" },
          ].map((aid) => (
            <div key={aid.label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <aid.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{aid.label}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{aid.sub}</p>
                </div>
              </div>
              <span className="text-muted-foreground text-xs">›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
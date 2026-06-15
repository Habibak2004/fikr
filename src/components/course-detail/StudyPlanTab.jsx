import { useState } from "react";
import { differenceInWeeks, addWeeks, format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Sparkles, Loader2, Clock, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const difficultyColors = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

export default function StudyPlanTab({ course }) {
  const [syllabusText, setSyllabusText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const queryClient = useQueryClient();

  const hasPlan = course.study_plan && course.study_plan.length > 0;

  const handleUploadSyllabus = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.txt,.doc,.docx";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Course.update(course.id, { syllabus_url: file_url });
      generatePlan(file_url);
    };
    input.click();
  };

  const generatePlan = async (fileUrl) => {
    setGenerating(true);
    const resolvedFileUrl = fileUrl || course.syllabus_url;

    // Calculate actual term length from course dates
    let termWeeks = 15; // default full semester
    if (course.semester_start && course.semester_end) {
      const weeks = differenceInWeeks(new Date(course.semester_end), new Date(course.semester_start));
      if (weeks > 0) termWeeks = weeks;
    }
    const termDescription = termWeeks <= 6
      ? `a ${termWeeks}-week accelerated/summer term`
      : termWeeks <= 10
      ? `a ${termWeeks}-week compressed semester`
      : `a ${termWeeks}-week semester`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Fikr Intelligence, an AI study planner. Carefully analyze the provided syllabus ${resolvedFileUrl ? "(attached as a file)" : "text"} for the course "${course.name}" (${course.code}).

${syllabusText ? `Syllabus text:\n${syllabusText}` : ""}

IMPORTANT: This is ${termDescription}${course.semester_start && course.semester_end ? ` running from ${course.semester_start} to ${course.semester_end}` : ""}. The study plan MUST be exactly ${termWeeks} weeks long — not a standard 12 or 15-week plan. Compress or expand the pacing accordingly.

From the syllabus, extract:
1. All assignments, exams, quizzes, projects, and deadlines with their due dates and grade weights.
2. Key topics and chapters covered each week.

Then generate a realistic ${termWeeks}-week study plan with 3-4 sessions per week, aligned to the course schedule and deadlines found in the syllabus.

Important: base the session titles and topics directly on what is in the syllabus. Respect the compressed pacing for shorter terms.`,
      ...(resolvedFileUrl ? { file_urls: [resolvedFileUrl] } : {}),
      response_json_schema: {
        type: "object",
        properties: {
          study_plan: {
            type: "array",
            items: {
              type: "object",
              properties: {
                week: { type: "number" },
                title: { type: "string" },
                sessions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      day: { type: "string" },
                      duration_minutes: { type: "number" },
                      difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                      completed: { type: "boolean" },
                      topics: { type: "array", items: { type: "string" } }
                    }
                  }
                }
              }
            }
          },
          assignments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string" },
                weight: { type: "number" },
                due_date: { type: "string" }
              }
            }
          }
        }
      }
    });

    await base44.entities.Course.update(course.id, { study_plan: result.study_plan });
    
    if (result.assignments?.length) {
      for (const a of result.assignments) {
        await base44.entities.Assignment.create({
          ...a,
          course_id: course.id,
          course_name: course.name,
          course_color: course.color,
        });
      }
    }
    
    queryClient.invalidateQueries({ queryKey: ["course", course.id] });
    queryClient.invalidateQueries({ queryKey: ["assignments"] });
    setGenerating(false);
  };

  const toggleWeek = (week) => {
    setExpandedWeeks(prev => ({ ...prev, [week]: !prev[week] }));
  };

  if (generating) {
    return (
      <Card className="p-12 rounded-2xl text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-2">Fikr Intelligence is analyzing your syllabus...</h3>
        <p className="text-sm text-muted-foreground">Extracting assignments, building your study plan, and calculating grade weights.</p>
      </Card>
    );
  }

  if (!hasPlan) {
    return (
      <Card className="p-8 rounded-2xl text-center">
        <Sparkles className="h-12 w-12 mx-auto text-primary/30 mb-4" />
        <h3 className="font-semibold text-lg mb-2">Generate Your Study Plan</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
          Upload your syllabus PDF or paste the text below. Fikr Intelligence will analyze it and create a personalized study schedule.
        </p>
        <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
          <Button onClick={handleUploadSyllabus} variant="outline" className="w-full rounded-xl h-24 border-dashed border-2 flex flex-col gap-2">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm">Upload Syllabus PDF</span>
          </Button>
          <p className="text-xs text-muted-foreground">or paste syllabus text</p>
          <Textarea
            placeholder="Paste your syllabus content here..."
            value={syllabusText}
            onChange={e => setSyllabusText(e.target.value)}
            className="rounded-xl min-h-[120px]"
          />
          <Button onClick={() => generatePlan()} disabled={!syllabusText && !course.syllabus_url}
            className="w-full rounded-xl bg-primary hover:bg-primary/90">
            <Sparkles className="h-4 w-4 mr-2" /> Generate Study Plan
          </Button>
        </div>
      </Card>
    );
  }

  const semesterStart = course.semester_start ? new Date(course.semester_start) : null;

  return (
    <div className="space-y-3">
      {course.study_plan.map((week) => {
        const weekStart = semesterStart ? addWeeks(semesterStart, week.week - 1) : null;
        const weekEnd = weekStart ? addWeeks(weekStart, 1) : null;
        const dateRange = weekStart ? `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d")}` : null;
        return (
        <Collapsible key={week.week} open={expandedWeeks[week.week]} onOpenChange={() => toggleWeek(week.week)}>
          <CollapsibleTrigger asChild>
            <Card className="p-4 rounded-2xl cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {expandedWeeks[week.week] ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">Week {week.week}</p>
                      {dateRange && <span className="text-xs text-muted-foreground">{dateRange}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{week.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{week.sessions?.filter(s => s.completed).length || 0}/{week.sessions?.length || 0}</span>
                </div>
              </div>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="ml-8 mt-2 space-y-2">
              {week.sessions?.map((session, si) => (
                <div key={si} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/60">
                  <Checkbox checked={session.completed} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{session.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{session.day}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{session.duration_minutes}m</span>
                    </div>
                  </div>
                  <Badge className={`text-[10px] ${difficultyColors[session.difficulty] || difficultyColors.medium}`}>
                    {session.difficulty}
                  </Badge>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
        );
      })}
    </div>
  );
}
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

// Renders a single step in a reflection flow

export default function StepRenderer({ step, answers, courseReflections, onAnswer, onCourseAnswer, courses }) {
  if (!step) return null;

  return (
    <div className="space-y-5">
      {step.title && (
        <div className="space-y-1">
          <h3 className="font-bold text-base">{step.title}</h3>
          {step.subtitle && <p className="text-sm text-muted-foreground">{step.subtitle}</p>}
        </div>
      )}

      <div className="space-y-4">
        {step.questions?.map((q) => (
          <QuestionField
            key={q.id}
            question={q}
            value={answers[q.id]}
            onChange={(val) => onAnswer(q.id, val)}
          />
        ))}

        {/* Per-course questions */}
        {step.perCourse && courses.map((course) => (
          <div key={course.id} className="border rounded-xl p-4 space-y-3 bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="text-lg">{course.icon || "📚"}</span>
              <div>
                <p className="font-semibold text-sm">{course.name}</p>
                {course.code && <p className="text-xs text-muted-foreground">{course.code}</p>}
              </div>
            </div>
            {step.perCourse.map((q) => (
              <QuestionField
                key={`${course.id}-${q.id}`}
                question={q}
                value={(courseReflections[course.id] || {})[q.id]}
                onChange={(val) => onCourseAnswer(course.id, q.id, val)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestionField({ question, value, onChange }) {
  const q = question;

  if (q.type === "textarea") {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{q.label}</label>
        {q.hint && <p className="text-xs text-muted-foreground">{q.hint}</p>}
        <Textarea
          placeholder={q.placeholder || "Your thoughts…"}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-xl min-h-[90px] resize-none text-sm"
        />
      </div>
    );
  }

  if (q.type === "stars") {
    const rating = value || 0;
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{q.label}</label>
        {q.hint && <p className="text-xs text-muted-foreground">{q.hint}</p>}
        <div className="flex gap-2">
          {Array.from({ length: q.max || 5 }).map((_, i) => (
            <button key={i} onClick={() => onChange(i + 1)} className="transition-transform hover:scale-110">
              <Star className="h-7 w-7" fill={i < rating ? "#f59e0b" : "none"} stroke={i < rating ? "#f59e0b" : "hsl(var(--muted-foreground))"} />
            </button>
          ))}
        </div>
        {q.labels && rating > 0 && (
          <p className="text-xs text-muted-foreground">{q.labels[rating - 1]}</p>
        )}
      </div>
    );
  }

  if (q.type === "scale") {
    const val = value ?? null;
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{q.label}</label>
        {q.hint && <p className="text-xs text-muted-foreground">{q.hint}</p>}
        <div className="flex gap-1.5 flex-wrap">
          {Array.from({ length: q.max || 10 }).map((_, i) => (
            <button
              key={i}
              onClick={() => onChange(i + 1)}
              className={cn(
                "h-8 w-8 rounded-lg text-sm font-semibold border transition-colors",
                val === i + 1 ? "bg-primary text-white border-primary" : "bg-white border-border hover:border-primary/50"
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
        {q.scaleLabels && (
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{q.scaleLabels[0]}</span>
            <span>{q.scaleLabels[1]}</span>
          </div>
        )}
      </div>
    );
  }

  if (q.type === "select") {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{q.label}</label>
        {q.hint && <p className="text-xs text-muted-foreground">{q.hint}</p>}
        <div className="flex flex-wrap gap-2">
          {q.options.map((opt) => {
            const optVal = typeof opt === "string" ? opt : opt.value;
            const optLabel = typeof opt === "string" ? opt : opt.label;
            return (
              <button
                key={optVal}
                onClick={() => onChange(optVal)}
                className={cn(
                  "text-sm px-3 py-1.5 rounded-lg border transition-colors font-medium",
                  value === optVal ? "bg-primary text-white border-primary" : "bg-white border-border hover:border-primary/40 hover:text-primary"
                )}
              >
                {optLabel}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (q.type === "multiselect") {
    const selected = value || [];
    const toggle = (v) => {
      const arr = selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v];
      onChange(arr);
    };
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{q.label}</label>
        {q.hint && <p className="text-xs text-muted-foreground">{q.hint}</p>}
        <div className="flex flex-wrap gap-2">
          {q.options.map((opt) => {
            const optVal = typeof opt === "string" ? opt : opt.value;
            const optLabel = typeof opt === "string" ? opt : opt.label;
            return (
              <button
                key={optVal}
                onClick={() => toggle(optVal)}
                className={cn(
                  "text-sm px-3 py-1.5 rounded-lg border transition-colors font-medium",
                  selected.includes(optVal) ? "bg-primary text-white border-primary" : "bg-white border-border hover:border-primary/40 hover:text-primary"
                )}
              >
                {optLabel}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (q.type === "text") {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{q.label}</label>
        {q.hint && <p className="text-xs text-muted-foreground">{q.hint}</p>}
        <input
          type={q.inputType || "text"}
          placeholder={q.placeholder || ""}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary/30 bg-white"
        />
      </div>
    );
  }

  if (q.type === "number") {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{q.label}</label>
        {q.hint && <p className="text-xs text-muted-foreground">{q.hint}</p>}
        <input
          type="number"
          placeholder={q.placeholder || ""}
          value={value || ""}
          min={q.min}
          max={q.max}
          onChange={(e) => onChange(e.target.value)}
          className="w-32 text-sm border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary/30 bg-white"
        />
      </div>
    );
  }

  if (q.type === "letter") {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{q.label}</label>
        {q.hint && <p className="text-xs text-muted-foreground italic">{q.hint}</p>}
        <Textarea
          placeholder={q.placeholder || "Dear Future Me…"}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-xl min-h-[160px] resize-none text-sm font-medium"
        />
      </div>
    );
  }

  return null;
}
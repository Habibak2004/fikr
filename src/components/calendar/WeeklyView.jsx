import { useMemo } from "react";
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isToday, addWeeks, subWeeks } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7am - 8pm

function getEventsForDay(date, assignments, milestones, criticalDeadlines) {
  const items = [];

  assignments.forEach(a => {
    if (a.due_date && isSameDay(new Date(a.due_date), date)) {
      items.push({ label: a.name, sub: a.course_name, color: "bg-primary/10 border-primary/40 text-primary", dot: "bg-primary", time: format(new Date(a.due_date), "h:mm a") });
    }
  });

  milestones.forEach(m => {
    const d = new Date(m.date.slice(0, 10) + "T12:00:00");
    if (isSameDay(d, date)) {
      items.push({ label: m.label, sub: m.sub || "", color: "bg-secondary/10 border-secondary/40 text-secondary", dot: "bg-secondary", time: "All day" });
    }
  });

  criticalDeadlines.forEach(d => {
    if (d.date && isSameDay(new Date(d.date + "T12:00:00"), date)) {
      items.push({ label: d.label, sub: d.detail, color: "bg-red-50 border-red-200 text-red-700", dot: "bg-red-400", time: d.urgency });
    }
  });

  return items;
}

export default function WeeklyView({ currentDate, onDateChange, assignments, milestones, criticalDeadlines }) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const dayEvents = useMemo(() =>
    days.map(d => ({
      date: d,
      items: getEventsForDay(d, assignments, milestones, criticalDeadlines),
    })),
    [currentDate, assignments, milestones, criticalDeadlines]
  );

  return (
    <div className="bg-white border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <h3 className="font-bold text-base">
          {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDateChange(subWeeks(currentDate, 1))}
            className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDateChange(new Date())}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => onDateChange(addWeeks(currentDate, 1))}
            className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-7 divide-x">
        {dayEvents.map(({ date, items }) => {
          const today = isToday(date);
          return (
            <div key={date.toISOString()} className="min-h-[160px] p-2 flex flex-col gap-1">
              {/* Day header */}
              <div className={`flex flex-col items-center mb-2`}>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {format(date, "EEE")}
                </span>
                <span className={`text-base font-extrabold rounded-full h-8 w-8 flex items-center justify-center mt-0.5 ${
                  today ? "bg-primary text-white" : "text-foreground"
                }`}>
                  {format(date, "d")}
                </span>
              </div>

              {/* Events */}
              <div className="space-y-1 flex-1">
                {items.length === 0 && (
                  <p className="text-[10px] text-muted-foreground/40 text-center pt-2">—</p>
                )}
                {items.map((item, i) => (
                  <div key={i} className={`rounded-lg border px-1.5 py-1 text-[10px] font-medium leading-tight ${item.color}`}>
                    <div className="flex items-center gap-1 mb-0.5">
                      <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${item.dot}`} />
                      <span className="font-semibold truncate">{item.label}</span>
                    </div>
                    {item.sub && <p className="truncate opacity-70 pl-2.5">{item.sub}</p>}
                    <p className="opacity-60 pl-2.5">{item.time}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
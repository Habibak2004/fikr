import { useMemo, useState } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameDay, isSameMonth, isToday,
  addMonths, subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

function getEventsForDay(date, assignments, milestones, criticalDeadlines) {
  const items = [];

  assignments.forEach(a => {
    if (a.due_date && isSameDay(new Date(a.due_date), date)) {
      items.push({ label: a.name, color: "bg-primary/15 text-primary", dot: "bg-primary" });
    }
  });

  milestones.forEach(m => {
    const d = new Date(m.date.slice(0, 10) + "T12:00:00");
    if (isSameDay(d, date)) {
      items.push({ label: m.label, color: "bg-secondary/15 text-secondary", dot: "bg-secondary" });
    }
  });

  criticalDeadlines.forEach(d => {
    if (d.date && isSameDay(new Date(d.date + "T12:00:00"), date)) {
      items.push({ label: d.label, color: "bg-red-50 text-red-600", dot: "bg-red-400" });
    }
  });

  return items;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function DayModal({ day, items, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{format(day, "EEEE")}</p>
            <p className="text-xl font-extrabold">{format(day, "MMMM d")}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No tasks this day.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className={`rounded-xl border px-3 py-2.5 ${item.color}`}>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${item.dot}`} />
                  <span className="font-semibold text-sm">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MonthlyView({ currentDate, onDateChange, assignments, milestones, criticalDeadlines }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const dayEvents = useMemo(() =>
    days.map(d => ({
      date: d,
      inMonth: isSameMonth(d, currentDate),
      items: getEventsForDay(d, assignments, milestones, criticalDeadlines),
    })),
    [currentDate, assignments, milestones, criticalDeadlines]
  );

  const selectedDayData = selectedDay ? dayEvents.find(d => isSameDay(d.date, selectedDay)) : null;

  return (
    <div className="bg-white border rounded-2xl overflow-hidden">
      {selectedDay && selectedDayData && (
        <DayModal day={selectedDay} items={selectedDayData.items} onClose={() => setSelectedDay(null)} />
      )}
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <h3 className="font-bold text-base">{format(currentDate, "MMMM yyyy")}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDateChange(subMonths(currentDate, 1))}
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
            onClick={() => onDateChange(addMonths(currentDate, 1))}
            className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 border-b">
        {DAY_LABELS.map(d => (
          <div key={d} className="py-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 divide-x divide-y">
        {dayEvents.map(({ date, inMonth, items }) => {
          const today = isToday(date);
          return (
            <div
              key={date.toISOString()}
              className={`min-h-[90px] p-1.5 flex flex-col cursor-pointer hover:bg-muted/10 transition-colors ${!inMonth ? "bg-muted/20" : ""}`}
              onClick={() => setSelectedDay(date)}
            >
              <span className={`text-xs font-bold self-start h-6 w-6 flex items-center justify-center rounded-full mb-1 ${
                today ? "bg-primary text-white" : inMonth ? "text-foreground" : "text-muted-foreground/40"
              }`}>
                {format(date, "d")}
              </span>
              <div className="space-y-0.5 flex-1 overflow-hidden">
                {items.slice(0, 3).map((item, i) => (
                  <div key={i} className={`rounded px-1 py-0.5 text-[9px] font-semibold leading-tight flex items-center gap-1 ${item.color}`}>
                    <div className={`h-1 w-1 rounded-full flex-shrink-0 ${item.dot}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                ))}
                {items.length > 3 && (
                  <p className="text-[9px] text-muted-foreground pl-2">+{items.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
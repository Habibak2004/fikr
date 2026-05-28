import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Flame, Moon, Sun, Coffee } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";
import { differenceInWeeks, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

export default function Heatmap() {
  const [selectedSemester, setSelectedSemester] = useState("");

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => base44.entities.Assignment.list("-due_date", 200),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list("-created_date", 50),
  });

  // Extract unique semesters from courses
  const semesters = [...new Set(courses.map(c => c.semester).filter(Boolean))];
  const activeSemester = selectedSemester || semesters[0];

  // Filter assignments by selected semester (matching course semester)
  const semesterAssignments = assignments.filter(a => {
    if (!a.due_date) return false;
    const course = courses.find(c => c.id === a.course_id);
    return !selectedSemester || course?.semester === selectedSemester;
  });

  // Calculate semester weeks dynamically
  const semesterWeeks = (() => {
    if (semesterAssignments.length === 0) return [];
    
    const dates = semesterAssignments.map(a => new Date(a.due_date)).filter(d => !isNaN(d));
    if (dates.length === 0) return [];
    
    const minDate = startOfWeek(new Date(Math.min(...dates)));
    const maxDate = endOfWeek(new Date(Math.max(...dates)));
    const totalWeeks = differenceInWeeks(maxDate, minDate) + 1;
    
    return Array.from({ length: Math.min(totalWeeks, 16) }, (_, i) => {
      const weekNum = i + 1;
      const weekStart = new Date(minDate);
      weekStart.setDate(weekStart.getDate() + i * 7);
      const weekEnd = endOfWeek(weekStart);
      
      const count = semesterAssignments.filter(a => {
        if (!a.due_date) return false;
        const d = new Date(a.due_date);
        return isWithinInterval(d, { start: weekStart, end: weekEnd });
      }).length;
      
      return { week: `W${weekNum}`, count, weekNum, startDate: weekStart };
    });
  })();

  const maxCount = Math.max(...semesterWeeks.map(w => w.count), 1);
  const busiestWeek = semesterWeeks.length > 0 ? semesterWeeks.reduce((max, w) => w.count > max.count ? w : max, semesterWeeks[0]) : { weekNum: 0, count: 0 };

  const getIntensityColor = (count) => {
    if (count === 0) return "bg-primary/5";
    const ratio = count / maxCount;
    if (ratio <= 0.25) return "bg-primary/15";
    if (ratio <= 0.5) return "bg-primary/30";
    if (ratio <= 0.75) return "bg-primary/50";
    return "bg-primary/80";
  };

  const barData = semesterWeeks.map(w => ({ name: w.week, value: w.count }));

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Workload Heatmap</h1>
          <p className="text-muted-foreground mt-1">Visualize your semester intensity</p>
        </div>
        {semesters.length > 0 && (
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="w-48 rounded-xl">
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              {semesters.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Heatmap Grid */}
      <Card className="p-6 rounded-2xl">
        <h3 className="font-semibold mb-4">{activeSemester || "Current Semester"}</h3>
        {semesterWeeks.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No assignments found for this semester</p>
        ) : (
          <>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {semesterWeeks.map((w) => (
                <motion.div
                  key={w.week}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: w.weekNum * 0.03 }}
                  className={`aspect-square rounded-xl ${getIntensityColor(w.count)} flex flex-col items-center justify-center cursor-default`}
                  title={`Week ${w.weekNum}: ${w.count} items`}
                >
                  <span className="text-[10px] font-bold">{w.weekNum}</span>
                  <span className="text-[9px] text-muted-foreground">{w.count}</span>
                </motion.div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-4">
              <span className="text-xs text-muted-foreground">Less</span>
              {["bg-primary/5", "bg-primary/15", "bg-primary/30", "bg-primary/50", "bg-primary/80"].map((c, i) => (
                <div key={i} className={`h-4 w-4 rounded ${c}`} />
              ))}
              <span className="text-xs text-muted-foreground">More</span>
            </div>
          </>
        )}
      </Card>

      {/* Bar Chart */}
      <Card className="p-6 rounded-2xl">
        <h3 className="font-semibold mb-4">Workload by Week</h3>
        {semesterWeeks.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No data to display</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.value === busiestWeek.count ? "hsl(var(--destructive))" : "hsl(var(--primary))"} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {semesterWeeks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Busiest Week */}
          <Card className="p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="h-5 w-5 text-destructive" />
              <h3 className="font-semibold">Busiest Week</h3>
            </div>
            <p className="text-3xl font-bold">Week {busiestWeek.weekNum}</p>
            <p className="text-sm text-muted-foreground mt-1">{busiestWeek.count} assignments due</p>
            <Badge className="mt-2 bg-destructive/10 text-destructive text-xs">Plan ahead — start early!</Badge>
          </Card>

          {/* AI Forecast */}
          <Card className="p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">AI Forecast</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Based on your current workload pattern:</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><Badge className="bg-amber-100 text-amber-700 text-[10px]">Warning</Badge> Week {busiestWeek.weekNum} may cause burnout</li>
              <li className="flex items-center gap-2"><Badge className="bg-green-100 text-green-700 text-[10px]">Tip</Badge> Spread Week {busiestWeek.weekNum} work to prior week</li>
            </ul>
          </Card>
        </div>
      )}

      {/* Optimal Study Windows */}
      <Card className="p-6 rounded-2xl">
        <h3 className="font-semibold mb-4">Optimal Study Windows</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50">
            <Sun className="h-8 w-8 text-amber-500" />
            <div>
              <p className="font-medium text-sm">Morning (8-11 AM)</p>
              <p className="text-xs text-muted-foreground">Best for problem solving</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5">
            <Coffee className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium text-sm">Afternoon (2-5 PM)</p>
              <p className="text-xs text-muted-foreground">Good for reading & review</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/5">
            <Moon className="h-8 w-8 text-secondary" />
            <div>
              <p className="font-medium text-sm">Evening (7-10 PM)</p>
              <p className="text-xs text-muted-foreground">Best for creative work</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="text-center">
        <Button variant="outline" className="rounded-2xl px-8 h-12" onClick={() => {}}>
          <Moon className="h-4 w-4 mr-2" /> Enter Zen Mode
        </Button>
      </div>
    </div>
  );
}
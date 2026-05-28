import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, BookOpen, Flame, Brain, ArrowRight, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import AddCourseModal from "@/components/courses/AddCourseModal";

export default function Courses() {
  const [showAdd, setShowAdd] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [userEmail, setUserEmail] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(u => setUserEmail(u?.email)).catch(() => {}); }, []);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses", userEmail],
    queryFn: () => base44.entities.Course.filter({ created_by: userEmail }, "-created_date", 50),
    enabled: !!userEmail,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Course.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["courses"] }); setShowAdd(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const assignments = await base44.entities.Assignment.filter({ course_id: id });
      await Promise.all(assignments.map(a => base44.entities.Assignment.delete(a.id)));
      await base44.entities.Course.delete(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Course.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["courses"] }); setEditCourse(null); },
  });

  const { data: focusSessions = [] } = useQuery({
    queryKey: ["focus-sessions", userEmail],
    queryFn: () => base44.entities.FocusSession.filter({ created_by: userEmail }, "-created_date", 200),
    enabled: !!userEmail,
  });

  const { data: studySessions = [] } = useQuery({
    queryKey: ["study-sessions", userEmail],
    queryFn: () => base44.entities.StudySession.filter({ created_by: userEmail }, "-created_date", 200),
    enabled: !!userEmail,
  });

  const studyStreak = (() => {
    const sessionDates = new Set([
      ...focusSessions.map(s => s.date),
      ...studySessions.map(s => s.date),
    ].filter(Boolean));
    let streak = 0;
    const check = new Date();
    if (!sessionDates.has(format(check, "yyyy-MM-dd"))) check.setDate(check.getDate() - 1);
    while (sessionDates.has(format(check, "yyyy-MM-dd"))) {
      streak++;
      check.setDate(check.getDate() - 1);
    }
    return streak;
  })();

  const activeCourses = courses.filter(c => c.status === "active");
  const avgProgress = activeCourses.length ? Math.round(activeCourses.reduce((s, c) => s + (c.progress || 0), 0) / activeCourses.length) : 0;

  const statusColors = {
    active: "bg-primary/10 text-primary",
    completed: "bg-green-100 text-green-700",
    dropped: "bg-muted text-muted-foreground",
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Classes</h1>
          <p className="text-muted-foreground mt-1">Manage your courses and track progress</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="rounded-xl bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" /> Add Course
        </Button>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : courses.length === 0 ? (
        <Card className="p-12 rounded-2xl text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="font-semibold text-lg mb-2">No courses yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Add your first course to get started with AI-powered study plans.</p>
          <Button onClick={() => setShowAdd(true)} className="rounded-xl bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" /> Add Your First Course
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course, i) => (
            <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="relative group">
              <Link to={`/courses/${course.id}`}>
                <Card className="p-5 rounded-2xl hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer group h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: (course.color || "#0061a4") + "15" }}>
                        {course.icon || "📚"}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">{course.code}</p>
                        <h3 className="font-semibold text-sm leading-tight">{course.name}</h3>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={`text-[10px] ${statusColors[course.status || "active"]}`}>
                        {course.status || "active"}
                      </Badge>
                      {course.semester && <Badge className="text-[9px] bg-muted text-muted-foreground font-normal">{course.semester}</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    {course.professor && <span>Prof. {course.professor}</span>}
                    {course.professor && course.semester && <span>•</span>}
                    {course.semester && <span>{course.semester}</span>}
                  </div>
                  <div className="mt-auto">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{course.progress || 0}%</span>
                    </div>
                    <Progress value={course.progress || 0} className="h-1.5 rounded-full" />
                  </div>
                  <div className="flex items-center justify-end mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-primary font-medium flex items-center gap-1">
                      View Details <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Card>
              </Link>
              {/* Actions menu — outside Link so clicks don't navigate */}
              <div className="absolute top-3 right-3" onClick={e => e.preventDefault()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-7 w-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setEditCourse(course); setEditFields({ name: course.name, code: course.code || "", professor: course.professor || "", semester: course.semester || "", semester_start: course.semester_start || "", semester_end: course.semester_end || "", status: course.status || "active" }); }}>
                      <Pencil className="h-4 w-4 mr-2" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => deleteMutation.mutate(course.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Bottom Stats */}
      {courses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 rounded-2xl flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Overall Progress</p>
              <p className="text-lg font-bold">{avgProgress}%</p>
            </div>
          </Card>
          <Card className="p-5 rounded-2xl flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Flame className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Study Streak</p>
              <p className="text-lg font-bold">{studyStreak} day{studyStreak !== 1 ? "s" : ""}</p>
            </div>
          </Card>
          <Card className="p-5 rounded-2xl flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Brain className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">AI Recommendation</p>
              <p className="text-sm font-medium">
                {activeCourses.length > 0
                  ? `Focus on ${[...activeCourses].sort((a, b) => (a.progress || 0) - (b.progress || 0))[0].name} today`
                  : "Add a course to get started"}
              </p>
            </div>
          </Card>
        </div>
      )}

      <AddCourseModal open={showAdd} onClose={() => setShowAdd(false)} onSave={(data) => createMutation.mutate(data)} />

      <Dialog open={!!editCourse} onOpenChange={() => setEditCourse(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Course Name</Label>
                <Input value={editFields.name || ""} onChange={e => setEditFields(f => ({ ...f, name: e.target.value }))} className="rounded-xl" autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Course Code</Label>
                <Input value={editFields.code || ""} onChange={e => setEditFields(f => ({ ...f, code: e.target.value }))} className="rounded-xl" placeholder="e.g. CS101" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Professor</Label>
              <Input value={editFields.professor || ""} onChange={e => setEditFields(f => ({ ...f, professor: e.target.value }))} className="rounded-xl" placeholder="Prof. Smith" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Semester / Term</Label>
                <Input value={editFields.semester || ""} onChange={e => setEditFields(f => ({ ...f, semester: e.target.value }))} className="rounded-xl" placeholder="e.g. Fall 2026" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={editFields.status || "active"} onValueChange={v => setEditFields(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="dropped">Dropped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Semester Start</Label>
                <Input type="date" value={editFields.semester_start || ""} onChange={e => setEditFields(f => ({ ...f, semester_start: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Semester End</Label>
                <Input type="date" value={editFields.semester_end || ""} onChange={e => setEditFields(f => ({ ...f, semester_end: e.target.value }))} className="rounded-xl" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditCourse(null)}>Cancel</Button>
            <Button
              onClick={() => editMutation.mutate({ id: editCourse?.id, data: editFields })}
              disabled={!editFields.name?.trim() || editMutation.isPending}
              className="bg-primary hover:bg-primary/90 rounded-xl"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
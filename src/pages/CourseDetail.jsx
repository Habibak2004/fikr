import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import StudyPlanTab from "@/components/course-detail/StudyPlanTab";
import AssignmentsTab from "@/components/course-detail/AssignmentsTab";
import PracticeTab from "@/components/course-detail/PracticeTab";
import MaterialsTab from "@/components/course-detail/MaterialsTab";
import CourseSidebar from "@/components/course-detail/CourseSidebar";

export default function CourseDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = window.location.pathname.split("/courses/")[1];
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const courses = await base44.entities.Course.filter({ id: courseId });
      return courses[0];
    },
    enabled: !!courseId,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments", courseId],
    queryFn: () => base44.entities.Assignment.filter({ course_id: courseId }, "-due_date", 100),
    enabled: !!courseId,
  });

  if (isLoading || !course) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-none lg:rounded-b-3xl bg-white border-b px-6 lg:px-10 pt-6 pb-8 mb-6">
        <Link to="/courses" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Classes
        </Link>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            {course.semester && (
              <span className="inline-block text-[10px] font-bold tracking-widest uppercase text-primary bg-primary/10 px-2.5 py-1 rounded-full mb-3">
                {course.semester}
              </span>
            )}
            <h1 className="text-3xl font-extrabold leading-tight mb-2">
              {course.code} – {course.name}
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg">
              {course.professor ? `Taught by Prof. ${course.professor}.` : "No professor listed."} {course.syllabus_text ? course.syllabus_text.slice(0, 120) + "…" : ""}
            </p>
          </div>
          <Link to="/focus" className="flex-shrink-0">
            <Button className="rounded-2xl h-14 px-7 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 flex-col gap-0 leading-tight">
              <Play className="h-4 w-4 mb-0.5" />
              <span className="text-xs font-semibold">Resume Study</span>
            </Button>
          </Link>
        </div>

        {/* Progress Bar */}
        <div className="mt-8 bg-white border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm">Course Progress</span>
            <span className="text-primary font-bold text-sm">{course.progress || 0}%</span>
          </div>
          <Progress value={course.progress || 0} className="h-2.5 rounded-full" />
          <div className="flex items-center gap-4 mt-2.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary inline-block"></span>{Math.round((course.progress || 0) / 100 * 22)}/22 Topics Covered</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground/30 inline-block"></span>{22 - Math.round((course.progress || 0) / 100 * 22)} Remaining</span>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="px-6 lg:px-10 flex flex-col lg:flex-row gap-6 pb-12">
        <div className="flex-1 min-w-0">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-muted rounded-xl p-1 mb-6 w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
              <TabsTrigger value="plan" className="rounded-lg">Study Plan</TabsTrigger>
              <TabsTrigger value="practice" className="rounded-lg">Practice</TabsTrigger>
              <TabsTrigger value="materials" className="rounded-lg">Materials</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6">
              <AssignmentsTab courseId={courseId} assignments={assignments} courseName={course.name} courseColor={course.color} />
              {/* Syllabus Weights */}
              {course.weights && course.weights.length > 0 && (
                <div className="bg-white border rounded-2xl p-5">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-4">Syllabus Weights</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {course.weights.map((w, i) => (
                      <div key={i}>
                        <p className="text-xs text-muted-foreground mb-1">{w.category}</p>
                        <p className="text-2xl font-bold">{w.weight}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="plan">
              <StudyPlanTab course={course} />
            </TabsContent>
            <TabsContent value="practice">
              <PracticeTab course={course} />
            </TabsContent>
            <TabsContent value="materials">
              <MaterialsTab courseId={courseId} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <CourseSidebar course={course} assignments={assignments} />
        </div>
      </div>
    </div>
  );
}
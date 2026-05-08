import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Upload, Clock, Users, Trophy, BookOpen,
  Brain, FileText, Play, CheckCircle2, Loader2, Sparkles
} from "lucide-react";
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
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Back + Header */}
      <Link to="/courses" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Classes
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: (course.color || "#0061a4") + "15" }}>
            {course.icon || "📚"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{course.name}</h1>
              <Badge className="bg-primary/10 text-primary">{course.code}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {course.professor && `Prof. ${course.professor} · `}{course.semester}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Progress value={course.progress || 0} className="w-32 h-2" />
            <span className="text-sm font-medium">{course.progress || 0}%</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" /> 24 peers
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Trophy className="h-4 w-4" /> Rank #5
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <Tabs defaultValue="plan" className="w-full">
            <TabsList className="bg-muted rounded-xl p-1 mb-6 w-full justify-start overflow-x-auto">
              <TabsTrigger value="plan" className="rounded-lg">Study Plan</TabsTrigger>
              <TabsTrigger value="assignments" className="rounded-lg">Assignments</TabsTrigger>
              <TabsTrigger value="practice" className="rounded-lg">Practice</TabsTrigger>
              <TabsTrigger value="materials" className="rounded-lg">Materials</TabsTrigger>
            </TabsList>
            <TabsContent value="plan">
              <StudyPlanTab course={course} />
            </TabsContent>
            <TabsContent value="assignments">
              <AssignmentsTab courseId={courseId} assignments={assignments} courseName={course.name} courseColor={course.color} />
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
        <div className="w-full lg:w-80 flex-shrink-0">
          <CourseSidebar course={course} assignments={assignments} />
        </div>
      </div>

      {/* Floating Study Button */}
      <Link to="/focus" className="fixed bottom-24 lg:bottom-8 right-6 z-40">
        <Button className="rounded-2xl h-14 px-6 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25">
          <Play className="h-5 w-5 mr-2" /> Start Studying
        </Button>
      </Link>
    </div>
  );
}
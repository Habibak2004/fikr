import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ThumbsUp, ThumbsDown, MessageSquare, Plus, TrendingUp,
  Trophy, Users, HelpCircle, Lightbulb, FileText, BookMarked
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

const typeConfig = {
  question: { icon: HelpCircle, color: "bg-primary/10 text-primary", label: "Question" },
  tip: { icon: Lightbulb, color: "bg-amber-100 text-amber-700", label: "Tip" },
  note: { icon: FileText, color: "bg-green-100 text-green-700", label: "Note" },
  resource: { icon: BookMarked, color: "bg-secondary/10 text-secondary", label: "Resource" },
};

export default function Community() {
  const [showNew, setShowNew] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.filter({ created_by: user?.email }, "-created_date", 50),
    enabled: !!user,
  });

  // Auto-select first course if none selected
  useEffect(() => {
    if (courses.length > 0 && !selectedCourse) {
      setSelectedCourse(courses[0].id);
    }
  }, [courses.length]);

  const { data: posts = [] } = useQuery({
    queryKey: ["community-posts", selectedCourse],
    queryFn: () => base44.entities.CommunityPost.filter({ course_id: selectedCourse }, "-created_date", 100),
    enabled: !!selectedCourse,
  });

  const voteMutation = useMutation({
    mutationFn: ({ id, upvotes }) => base44.entities.CommunityPost.update(id, { upvotes }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["community-posts"] }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CommunityPost.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["community-posts"] }); setShowNew(false); },
  });

  const topContributors = [...new Map(posts.map(p => [p.author_email, { name: p.author_name, count: posts.filter(pp => pp.author_email === p.author_email).length }])).entries()]
    .sort((a, b) => b[1].count - a[1].count).slice(0, 5);

  const trending = selectedCourse ? [...new Set(posts.flatMap(p => p.tags || []))].slice(0, 8) : [];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Community</h1>
          <p className="text-muted-foreground mt-1">Course discussions and peer support</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedCourse || ""} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-48 rounded-xl"><SelectValue placeholder="Select a course" /></SelectTrigger>
            <SelectContent>
              {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowNew(true)} disabled={!selectedCourse} className="rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50">
            <Plus className="h-4 w-4 mr-2" /> New Post
          </Button>
        </div>
      </div>

      {courses.length === 0 && (
        <Card className="p-8 rounded-2xl text-center mb-6">
          <BookMarked className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="font-medium">No courses yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Add a course to start participating in community discussions</p>
        </Card>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Feed */}
        <div className="flex-1 space-y-4">
          {!selectedCourse ? (
            <Card className="p-12 rounded-2xl text-center">
              <BookMarked className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-medium">Select a course</h3>
              <p className="text-sm text-muted-foreground mt-1">Choose a course from the dropdown to view discussions</p>
            </Card>
          ) : posts.length === 0 ? (
            <Card className="p-12 rounded-2xl text-center">
              <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-medium">No posts in this course yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Be the first to start a discussion!</p>
            </Card>
          ) : (
            posts.map((post, i) => {
              const config = typeConfig[post.type] || typeConfig.note;
              const TypeIcon = config.icon;
              return (
                <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="p-5 rounded-2xl hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                        {(post.author_name || "?")[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{post.author_name || "Anonymous"}</span>
                          <Badge className={`text-[10px] ${config.color}`}><TypeIcon className="h-3 w-3 mr-1" />{config.label}</Badge>
                          {post.course_name && <span className="text-xs text-muted-foreground">{post.course_name}</span>}
                          <span className="text-xs text-muted-foreground">{post.created_date ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true }) : ""}</span>
                        </div>
                        <h4 className="font-medium mt-1">{post.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{post.content}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <button onClick={() => voteMutation.mutate({ id: post.id, upvotes: (post.upvotes || 0) + 1 })}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                            <ThumbsUp className="h-3.5 w-3.5" /> {post.upvotes || 0}
                          </button>
                          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                            <ThumbsDown className="h-3.5 w-3.5" /> {post.downvotes || 0}
                          </button>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageSquare className="h-3.5 w-3.5" /> {post.replies_count || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-72 space-y-4 flex-shrink-0">
          <Card className="p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Active Now</h4>
            </div>
            <p className="text-2xl font-bold text-primary">24 students</p>
          </Card>

          {trending.length > 0 && (
            <Card className="p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Trending</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {trending.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
              </div>
            </Card>
          )}

          <Card className="p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Top Contributors</h4>
            </div>
            {topContributors.length === 0 ? (
              <p className="text-sm text-muted-foreground">Be the first to contribute!</p>
            ) : (
              <div className="space-y-2">
                {topContributors.map(([email, data], i) => (
                  <div key={email} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                      {(data.name || "?")[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{data.name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{data.count} posts</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <NewPostModal open={showNew} onClose={() => setShowNew(false)} courses={courses} user={user} selectedCourse={selectedCourse} onSave={d => createMutation.mutate(d)} />
    </div>
  );
}

function NewPostModal({ open, onClose, courses, user, selectedCourse, onSave }) {
  const [form, setForm] = useState({ title: "", content: "", type: "question", tags: "" });

  const handleSave = () => {
    if (!form.title || !form.content || !selectedCourse) return;
    const course = courses.find(c => c.id === selectedCourse);
    onSave({
      ...form,
      course_id: selectedCourse,
      course_name: course?.name || "",
      author_name: user?.full_name || "Anonymous",
      author_email: user?.email || "",
      tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [],
    });
    setForm({ title: "", content: "", type: "question", tags: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader><DialogTitle>New Post</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="mb-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
          <p className="text-xs text-primary font-medium">Posting to: {courses.find(c => c.id === selectedCourse)?.name || "Select a course"}</p>
        </div>

        <div>
          <Label>Type</Label>
          <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
            <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(typeConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
          <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="rounded-xl mt-1" /></div>
          <div><Label>Content</Label><Textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} className="rounded-xl mt-1 min-h-[120px]" /></div>
          <div><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="e.g. midterm, study-tips" className="rounded-xl mt-1" /></div>
          <Button onClick={handleSave} className="w-full rounded-xl bg-primary hover:bg-primary/90">Post</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
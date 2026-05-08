import { Link } from "react-router-dom";
import { Target, Brain, Zap, Users, BookOpen, BarChart3, ArrowRight, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const features = [
  { icon: Brain, title: "AI Study Plans", desc: "Upload your syllabus and get a personalized weekly study schedule built by AI.", color: "bg-primary/10 text-primary" },
  { icon: Zap, title: "Active Recall", desc: "AI-generated flashcards and quizzes from your course materials.", color: "bg-secondary/10 text-secondary" },
  { icon: Users, title: "Community", desc: "Connect with students who've taken your classes. Share notes and tips.", color: "bg-accent/10 text-accent" },
  { icon: BarChart3, title: "Grade Projector", desc: "See your projected grade in real time as you complete assignments.", color: "bg-primary/10 text-primary" },
  { icon: BookOpen, title: "Smart Planner", desc: "All your deadlines in one place with urgency indicators and reminders.", color: "bg-secondary/10 text-secondary" },
  { icon: Sparkles, title: "Workload Forecaster", desc: "AI warns you about burnout weeks and suggests optimal study windows.", color: "bg-accent/10 text-accent" },
];

const testimonials = [
  { name: "Sarah M.", uni: "MIT", quote: "Fikr turned my chaotic semester into a manageable study plan. My GPA went from 3.2 to 3.8.", avatar: "S" },
  { name: "James K.", uni: "Stanford", quote: "The AI flashcards are incredible. I spend less time making study materials and more time actually learning.", avatar: "J" },
  { name: "Priya R.", uni: "Oxford", quote: "The community feature connected me with alumni who shared past exams. Game changer.", avatar: "P" },
];

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <Target className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Fikr</span>
          </div>
          <Link to="/dashboard">
            <Button size="sm" className="rounded-xl bg-primary hover:bg-primary/90">
              Get Started <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" /> For seekers of knowledge
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-foreground">
            Your AI-powered<br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">study companion</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Upload your syllabus, get a personalized study plan, track assignments and grades, 
            and connect with students who've taken your classes.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard">
              <Button size="lg" className="rounded-2xl px-8 h-14 text-base bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
                Start Studying Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="rounded-2xl px-8 h-14 text-base">
              Watch Demo
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features Bento Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.5 }}>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Everything you need to excel</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">Powered by Fikr Intelligence — your personal academic AI.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <div className={`h-11 w-11 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Loved by students worldwide</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-card border border-border/60"
            >
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map(s => <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-4">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{t.avatar}</div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.uni}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="rounded-3xl bg-gradient-to-br from-primary to-secondary p-12 md:p-16 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to transform your studies?</h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto">Join thousands of students using Fikr to study smarter, not harder.</p>
          <Link to="/dashboard">
            <Button size="lg" className="rounded-2xl px-8 h-14 text-base bg-white text-primary hover:bg-white/90 shadow-lg">
              Get Started — It's Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <span className="font-bold">Fikr</span>
            <span className="text-xs text-muted-foreground ml-2">For seekers of knowledge</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Fikr. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
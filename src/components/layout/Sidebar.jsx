import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, CalendarDays, Target,
  Users, Brain, BarChart3, Timer, Flame, Map
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: BookOpen, label: "My Classes", path: "/courses" },
  { icon: CalendarDays, label: "Planner", path: "/planner" },
  { icon: Map, label: "Calendar", path: "/calendar" },
  { icon: Flame, label: "Heatmap", path: "/heatmap" },
  { icon: Timer, label: "Focus Room", path: "/garden" },
  { icon: Users, label: "Community", path: "/community" },
  { icon: Brain, label: "Study Coach", path: "/coach" },
  { icon: BarChart3, label: "Garden", path: "/insights" },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-card border-r border-border">
      <Link to="/dashboard" className="flex items-center gap-3 px-6 py-6">
        <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
          <Target className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight text-foreground">Fikr</span>
          <p className="text-[10px] text-muted-foreground -mt-0.5 tracking-widest uppercase">For seekers of knowledge</p>
        </div>
      </Link>

      <nav className="flex-1 px-3 space-y-1 mt-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className={cn("h-[18px] w-[18px]", isActive && "text-primary")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
          <p className="text-xs font-semibold text-foreground">Study Streak</p>
          <p className="text-2xl font-bold text-primary mt-1">🔥 7 days</p>
          <p className="text-[11px] text-muted-foreground mt-1">Keep it going!</p>
        </div>
      </div>
    </aside>
  );
}
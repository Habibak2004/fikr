import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, BookOpen, CalendarDays, Target,
  Users, Brain, BarChart3, Timer, Flame, Map, Sparkles,
  LogOut, Settings, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: BookOpen, label: "My Classes", path: "/courses" },
  { icon: CalendarDays, label: "Planner", path: "/planner" },
  { icon: Map, label: "Calendar", path: "/calendar" },
  { icon: Flame, label: "Heatmap", path: "/heatmap" },
  { icon: Timer, label: "Focus Room", path: "/garden" },
  { icon: Users, label: "Community", path: "/community" },
  { icon: Brain, label: "Study Coach", path: "/coach" },
  { icon: BarChart3, label: "Insights", path: "/insights" },
  { icon: Sparkles, label: "Reset Room", path: "/reset-room" },
];

export default function Sidebar() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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

      <div className="p-4 space-y-3">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
          <p className="text-xs font-semibold text-foreground">Study Streak</p>
          <p className="text-2xl font-bold text-primary mt-1">7 days</p>
          <p className="text-[11px] text-muted-foreground mt-1">Keep it going!</p>
        </div>

        {/* User Profile */}
        <div className="relative" ref={menuRef}>
          {showMenu && (
            <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-border rounded-2xl shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold truncate">{user?.full_name || "Student"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="border-t border-border py-1">
                <button
                  onClick={() => base44.auth.logout()}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowMenu(v => !v)}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted transition-colors"
          >
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.full_name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold truncate">{user?.full_name || "Student"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <ChevronUp className={cn("h-4 w-4 text-muted-foreground transition-transform", showMenu && "rotate-180")} />
          </button>
        </div>
      </div>
    </aside>
  );
}
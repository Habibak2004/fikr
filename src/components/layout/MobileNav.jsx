import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, CalendarDays, Timer, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileItems = [
  { icon: LayoutDashboard, label: "Home", path: "/dashboard" },
  { icon: BookOpen, label: "Classes", path: "/courses" },
  { icon: CalendarDays, label: "Planner", path: "/planner" },
  { icon: Timer, label: "Focus", path: "/garden" },
  { icon: BarChart3, label: "Garden", path: "/insights" },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border">
      <div className="flex justify-around py-2 px-2">
        {mobileItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
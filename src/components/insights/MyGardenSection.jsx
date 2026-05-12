import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import PlantStage from "@/components/focus-room/garden/PlantStage";
import { format } from "date-fns";

export default function MyGardenSection() {
  const { data: gardenSessions = [], isLoading } = useQuery({
    queryKey: ["garden-sessions"],
    queryFn: () => base44.entities.GardenSession.list("-date", 50),
  });

  if (isLoading) return null;

  if (gardenSessions.length === 0) {
    return (
      <Card className="p-6 rounded-2xl">
        <h3 className="font-semibold mb-1">My Garden</h3>
        <p className="text-xs text-muted-foreground mb-6">Plants grown from your focus sessions</p>
        <div className="flex flex-col items-center py-10 gap-3 text-center">
          <span className="text-4xl">🌱</span>
          <p className="text-sm text-muted-foreground">No plants yet — complete a focus session to grow your first lotus.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 rounded-2xl">
      <h3 className="font-semibold mb-1">My Garden</h3>
      <p className="text-xs text-muted-foreground mb-6">
        {gardenSessions.length} plant{gardenSessions.length !== 1 ? "s" : ""} grown from your focus sessions
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {gardenSessions.map((session, i) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-b from-emerald-50/60 to-transparent border border-emerald-100 hover:border-emerald-200 transition-colors"
          >
            <PlantStage completedCount={session.bloom_stage ?? 0} />

            <div className="text-center space-y-0.5 w-full">
              {(session.course_code || session.course_name) && (
                <p className="text-xs font-bold text-emerald-700 truncate">
                  {session.course_code || session.course_name}
                </p>
              )}
              {session.assignment_name && (
                <p className="text-[11px] text-stone-500 truncate leading-snug">
                  {session.assignment_name}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                {session.date ? format(new Date(session.date), "MMM d") : ""}
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                {session.duration_minutes > 0 && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                    {session.duration_minutes}m
                  </span>
                )}
                <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                  Stage {session.bloom_stage ?? 0}/7
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, RefreshCw, Sparkles, Clock, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";

const PRIORITY_COLOR = { high: "text-red-500", medium: "text-amber-500", low: "text-stone-400" };

function SessionChip({ session }) {
  return (
    <div className="flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-xl px-3 py-2">
      <Clock className="h-3 w-3 text-primary shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-stone-700 truncate">{session.label}</p>
        <p className="text-[10px] text-stone-400">
          {format(parseISO(session.date), "EEE, MMM d")} · {session.start_time}–{session.end_time}
        </p>
      </div>
    </div>
  );
}

function AssignmentCard({ item }) {
  const [open, setOpen] = useState(false);
  const hrs = Math.round(item.estimated_minutes / 60 * 10) / 10;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 transition-colors"
      >
        <CheckCircle2 className="h-4 w-4 text-stone-300 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-stone-800 truncate">{item.name}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">
            ~{hrs}h estimated · {item.sessions?.length || 0} sessions planned
          </p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-stone-400" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
      </button>
      <AnimatePresence>
        {open && item.sessions?.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 border-t border-stone-100 pt-3">
              {item.sessions.map((s, i) => <SessionChip key={i} session={s} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CalendarSync() {
  const [syncState, setSyncState]   = useState("idle"); // idle | syncing | predicting | done | error
  const [schedule, setSchedule]     = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [error, setError]           = useState("");

  const runSync = async () => {
    setSyncState("syncing");
    setError("");
    try {
      const res = await base44.functions.invoke("syncGoogleCalendar", {});
      setSyncResult(res.data);
      setSyncState("predicting");

      const pred = await base44.functions.invoke("predictStudySlots", {});
      setSchedule(pred.data);
      setSyncState("done");
    } catch (e) {
      setError(e.message || "Something went wrong.");
      setSyncState("error");
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Calendar className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-stone-800">Google Calendar Sync</p>
          <p className="text-[11px] text-stone-400">Syncs your calendar, then schedules study sessions around your life</p>
        </div>
        <Button
          onClick={runSync}
          disabled={syncState === "syncing" || syncState === "predicting"}
          className="rounded-xl h-9 px-4 text-xs gap-1.5"
        >
          {syncState === "syncing" || syncState === "predicting" ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {syncState === "syncing" ? "Syncing…" : syncState === "predicting" ? "Planning…" : "Sync & Plan"}
        </Button>
      </div>

      {/* Body */}
      <div className="p-5">
        {syncState === "idle" && (
          <div className="text-center py-8">
            <Calendar className="h-10 w-10 text-stone-200 mx-auto mb-3" />
            <p className="text-sm text-stone-500 font-medium">Connect your calendar to get a smart study plan</p>
            <p className="text-xs text-stone-400 mt-1">We'll find gaps in your schedule and slot in focused study sessions</p>
          </div>
        )}

        {(syncState === "syncing" || syncState === "predicting") && (
          <div className="py-10 flex flex-col items-center gap-4">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-stone-700">
                {syncState === "syncing" ? "Fetching your calendar events…" : "AI is finding the best study windows…"}
              </p>
              <p className="text-xs text-stone-400 mt-1">
                {syncState === "syncing" ? "Pulling the next 60 days" : "Scheduling around your busy times"}
              </p>
            </div>
          </div>
        )}

        {syncState === "error" && (
          <div className="py-6 text-center">
            <p className="text-sm text-red-500 font-semibold">Sync failed</p>
            <p className="text-xs text-stone-400 mt-1">{error}</p>
            <Button onClick={runSync} variant="outline" className="mt-4 rounded-xl text-xs h-8">Try again</Button>
          </div>
        )}

        {syncState === "done" && schedule && (
          <div className="space-y-4">
            {/* Sync summary */}
            {syncResult && (
              <div className="flex items-center gap-2 text-[11px] text-stone-500 bg-stone-50 rounded-xl px-4 py-2.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>
                  Synced <strong>{syncResult.total}</strong> events
                  {syncResult.created > 0 && ` · ${syncResult.created} new`}
                  {syncResult.updated > 0 && ` · ${syncResult.updated} updated`}
                </span>
              </div>
            )}

            {/* AI plan */}
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold text-stone-700">Your AI Study Schedule</p>
            </div>

            {schedule.assignments?.length > 0 ? (
              <div className="space-y-3">
                {schedule.assignments.map((item, i) => (
                  <AssignmentCard key={i} item={item} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-400 text-center py-6">No upcoming assignments to schedule.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
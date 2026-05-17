import { motion } from "framer-motion";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import CompanionAvatar from "./CompanionAvatar";

export default function AnalysisView({ photoUrl, analysisData, energyLevel, onStart }) {
  if (!analysisData) return null;

  const {
    stress_zone_count,
    estimated_minutes,
    priority_actions = [],
    companion_opening,
    room_wisdom,
    room_summary,
    stress_zones = [],
  } = analysisData;

  return (
    <div className="min-h-screen bg-[#f7f5f2] p-6 lg:p-10">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-semibold text-[#2c2416] mb-8 flex items-center gap-2"
        >
          <span className="text-base">📷</span> Reset Room Analysis
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Photo */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative rounded-2xl overflow-hidden bg-black"
            >
              <img src={photoUrl} alt="Your space" className="w-full object-cover max-h-72" />
              <div className="absolute top-3 left-3">
                <span className="bg-white/90 backdrop-blur text-xs font-medium text-[#2c2416] px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                  Analysis Complete
                </span>
              </div>
              {/* Subtle stress zone overlay dots */}
              <div className="absolute inset-0 pointer-events-none">
                {stress_zones.slice(0, 3).map((zone, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${20 + i * 25}%`,
                      top: `${30 + (i % 2) * 20}%`,
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.2 }}
                  >
                    <div className="relative">
                      <motion.div
                        className="h-8 w-8 rounded-full border-2 border-orange-400/60 bg-orange-400/20"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.9, 0.6] }}
                        transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }}
                      />
                      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-white bg-black/50 px-1.5 rounded whitespace-nowrap">
                        {zone}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {room_summary && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-[#5a4f42] text-sm leading-relaxed bg-white rounded-2xl p-5 border border-[#e8e0d6]"
              >
                {room_summary}
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                onClick={onStart}
                className="w-full h-12 rounded-2xl font-medium text-base"
                style={{ backgroundColor: "#4a3b2a", color: "white" }}
              >
                Start Gentle Reset
              </Button>
            </motion.div>
          </div>

          {/* Right: Companion + Stats */}
          <div className="space-y-4">
            {/* Companion */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-5 border border-[#e8e0d6] text-center"
            >
              <CompanionAvatar mood="encouraging" message={companion_opening} size="sm" />
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white rounded-2xl p-4 border border-[#e8e0d6]"
              >
                <p className="text-[10px] text-[#9a8f82] uppercase tracking-widest mb-2">Stress Zones</p>
                <p className="text-3xl font-semibold text-[#2c2416]">
                  {String(stress_zone_count || stress_zones.length || 0).padStart(2, "0")}
                </p>
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-1" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl p-4 border border-[#e8e0d6]"
              >
                <p className="text-[10px] text-[#9a8f82] uppercase tracking-widest mb-2">Est. Time</p>
                <p className="text-3xl font-semibold text-[#2c2416]">{estimated_minutes || "?"}<span className="text-base font-normal">m</span></p>
                <Clock className="h-4 w-4 text-[#c4a882] mt-1" />
              </motion.div>
            </div>

            {/* Priority Actions */}
            {priority_actions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl p-4 border border-[#e8e0d6]"
              >
                <p className="text-[10px] text-[#9a8f82] uppercase tracking-widest mb-3">Priority Actions</p>
                <div className="space-y-2">
                  {priority_actions.slice(0, 3).map((action, i) => (
                    <div key={i} className="flex items-center gap-2.5 py-1.5 border-b border-[#f0ece6] last:border-0">
                      <span className="text-base">{action.emoji || "✦"}</span>
                      <div>
                        <p className="text-xs font-medium text-[#2c2416]">{action.label}</p>
                        <p className="text-[10px] text-[#9a8f82]">{action.zone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Room Wisdom */}
            {room_wisdom && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="rounded-2xl p-4 border border-[#e8e0d6]"
                style={{ backgroundColor: "#3d3020" }}
              >
                <p className="text-[10px] text-[#c4a882] uppercase tracking-widest mb-2">Room Wisdom</p>
                <p className="text-white/90 text-sm italic leading-relaxed">"{room_wisdom}"</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
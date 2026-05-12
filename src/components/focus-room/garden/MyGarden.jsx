import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import PlantStage from "@/components/focus-room/garden/PlantStage";
import { Leaf, Sprout } from "lucide-react";
import { Link } from "react-router-dom";

// Deterministic but varied positions for each flower in the garden
function getFlowerPosition(index) {
  const cols = 4;
  const row = Math.floor(index / cols);
  const col = index % cols;
  // Slight random-looking offsets based on index (but deterministic)
  const xJitter = ((index * 137) % 20) - 10; // -10 to +10
  const yJitter = ((index * 97) % 14) - 7;   // -7 to +7
  return { col, row, xJitter, yJitter };
}

function GardenFlower({ session, index, onClick }) {
  const pos = getFlowerPosition(index);
  const isFullBloom = session.bloom_stage >= 5;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: "backOut" }}
      onClick={() => onClick(session)}
      className="cursor-pointer flex flex-col items-center"
      style={{
        transform: `translate(${pos.xJitter}px, ${pos.yJitter}px)`,
      }}
    >
      <motion.div
        whileHover={{ scale: 1.15, y: -4 }}
        whileTap={{ scale: 0.92 }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        {/* Glow for full bloom */}
        {isFullBloom && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ background: "radial-gradient(circle, rgba(167,139,250,0.3) 0%, transparent 70%)" }}
          />
        )}
        <div className="w-16 h-20">
          <PlantStage completedCount={session.bloom_stage} />
        </div>
      </motion.div>
      {/* Course tag under flower */}
      {session.course_code && (
        <span className="text-[9px] font-bold text-stone-400 mt-0.5 truncate max-w-[64px] text-center">
          {session.course_code}
        </span>
      )}
    </motion.div>
  );
}

function FlowerDetail({ session, onClose }) {
  const stageLabels = [
    "Seeds of potential", "Lily pad awakened", "First bud", "Rising stem",
    "Half-bloom", "Lotus opening", "Full bloom", "Transcendent bloom"
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ ease: "backOut", duration: 0.35 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl p-6 space-y-4"
        style={{ background: "white", border: "1.5px solid #d1fae5" }}
      >
        <div className="flex justify-center">
          <div className="w-28 h-36">
            <PlantStage completedCount={session.bloom_stage} />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">
            {stageLabels[Math.min(session.bloom_stage, 7)]}
          </p>
          <h3 className="text-lg font-bold text-stone-800">
            {session.assignment_name || session.course_name || "Free study"}
          </h3>
          {session.course_code && (
            <p className="text-sm text-stone-400">{session.course_code}</p>
          )}
        </div>
        <div className="flex justify-center gap-4 text-sm text-stone-500">
          <div className="text-center">
            <p className="font-bold text-stone-700">{session.tasks_completed}</p>
            <p className="text-xs text-stone-400">tasks done</p>
          </div>
          {session.duration_minutes && (
            <div className="text-center">
              <p className="font-bold text-stone-700">{session.duration_minutes}m</p>
              <p className="text-xs text-stone-400">focus time</p>
            </div>
          )}
          <div className="text-center">
            <p className="font-bold text-stone-700">
              {new Date(session.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
            <p className="text-xs text-stone-400">planted</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl text-sm font-semibold text-stone-500 hover:bg-stone-50 transition-colors"
          style={{ border: "1.5px solid #e5e7eb" }}
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function MyGarden({ hideHeader = false }) {
  const [selectedSession, setSelectedSession] = useState(null);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["garden-sessions"],
    queryFn: () => base44.entities.GardenSession.list("-date", 100),
  });

  const totalBlooms = sessions.filter(s => s.bloom_stage >= 5).length;
  const totalSessions = sessions.length;

  return (
    <div style={hideHeader ? {} : { background: "linear-gradient(160deg, #fafdf7 0%, #f0fdf4 50%, #fdf9f5 100%)", minHeight: "100vh" }}>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        {!hideHeader && (
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-emerald-500" />
                <h1 className="text-xl font-bold text-stone-800">My Garden</h1>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                {totalSessions === 0 ? "Your flowers will bloom here after each session" :
                  `${totalSessions} session${totalSessions !== 1 ? "s" : ""} · ${totalBlooms} full bloom${totalBlooms !== 1 ? "s" : ""}`}
              </p>
            </div>
            <Link
              to="/garden"
              className="px-4 py-2 rounded-2xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #5a9a6f, #4a7c59)" }}
            >
              + New session
            </Link>
          </div>
        )}

        {/* Garden bed */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 py-16 text-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-6xl"
            >
              🌱
            </motion.div>
            <div className="space-y-1">
              <p className="font-bold text-stone-600">Your garden is empty</p>
              <p className="text-sm text-stone-400 leading-relaxed max-w-xs">
                Complete a focus session and your first flower will be planted here.
              </p>
            </div>
          </motion.div>
        ) : (
          <div
            className="relative rounded-3xl overflow-hidden p-5"
            style={{
              background: "linear-gradient(180deg, #e8f8f0 0%, #d1fae5 60%, #bbf7d0 100%)",
              border: "1.5px solid #a7f3d0",
              minHeight: "320px"
            }}
          >
            {/* Ground strip */}
            <div
              className="absolute bottom-0 left-0 right-0 h-10 rounded-b-3xl"
              style={{ background: "linear-gradient(180deg, #a3c995 0%, #7daf7a 100%)" }}
            />
            {/* Decorative grass tufts */}
            {[10, 25, 42, 58, 72, 88].map((left, i) => (
              <div key={i} className="absolute bottom-8 text-base select-none" style={{ left: `${left}%` }}>
                🌿
              </div>
            ))}

            {/* Flowers grid */}
            <div
              className="relative grid gap-2 pb-8"
              style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
            >
              {sessions.map((session, i) => (
                <GardenFlower
                  key={session.id}
                  session={session}
                  index={i}
                  onClick={setSelectedSession}
                />
              ))}
            </div>
          </div>
        )}

        {/* Stats strip */}
        {sessions.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Sessions", value: totalSessions, emoji: "🌱" },
              { label: "Full blooms", value: totalBlooms, emoji: "🌸" },
              { label: "This week", value: sessions.filter(s => {
                const d = new Date(s.date);
                const now = new Date();
                const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
                return d >= weekAgo;
              }).length, emoji: "🗓️" },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl p-3 text-center"
                style={{ background: "white", border: "1.5px solid #d1fae5" }}>
                <p className="text-lg">{stat.emoji}</p>
                <p className="text-xl font-bold text-stone-700">{stat.value}</p>
                <p className="text-[10px] text-stone-400 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flower detail sheet */}
      <AnimatePresence>
        {selectedSession && (
          <FlowerDetail session={selectedSession} onClose={() => setSelectedSession(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
import { motion } from "framer-motion";
import { CheckCircle, Sparkles, LayoutDashboard, Play } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CompanionAvatar from "./CompanionAvatar";

export default function CompletionScreen({ photoUrl, sessionStats, onRestart }) {
  const navigate = useNavigate();
  const { completed = 0, total = 0 } = sessionStats || {};
  const cognitiveReduction = Math.min(94, Math.round((completed / Math.max(total, 1)) * 94));

  return (
    <div className="min-h-screen bg-[#f7f5f2] px-6 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header badge */}
        <div className="flex items-center justify-center mb-8">
          <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
            SESSION COMPLETE
          </span>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="h-16 w-16 rounded-full bg-[#f0e8de] flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="h-8 w-8 text-[#c4a882]" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-semibold text-[#2c2416] tracking-tight mb-3">
            Restoration Complete.
          </h1>
          <p className="text-[#9a8f82] max-w-md mx-auto leading-relaxed">
            Your physical environment has been harmonized. You can breathe again and focus on what truly matters.
          </p>
        </motion.div>

        {/* Before / After comparison */}
        {photoUrl && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl overflow-hidden grid grid-cols-2 mb-8 border border-[#e8e0d6]"
          >
            <div className="relative">
              <img src={photoUrl} alt="Initial state" className="w-full h-48 object-cover" />
              <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full">
                INITIAL STATE
              </span>
            </div>
            <div className="relative bg-[#f0ece6] flex flex-col items-center justify-center p-6">
              <Sparkles className="h-8 w-8 text-[#c4a882] mb-3" />
              <h3 className="font-semibold text-[#2c2416] text-center leading-tight mb-1">
                Refined Sanctuary
              </h3>
              <p className="text-[#9a8f82] text-xs text-center leading-relaxed">
                Cognitive clutter cleared. Order restored through intentional action.
              </p>
              <span className="absolute top-2 right-2 bg-[#3d3020] text-white text-[10px] px-2 py-1 rounded-full">
                RESTORED
              </span>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-white rounded-2xl p-5 border border-[#e8e0d6]">
            <div className="h-8 w-8 rounded-lg bg-[#f0e8de] flex items-center justify-center mb-3">
              <CheckCircle className="h-4 w-4 text-[#c4a882]" />
            </div>
            <p className="text-3xl font-semibold text-[#2c2416]">{completed}</p>
            <p className="text-[10px] text-[#9a8f82] uppercase tracking-wider mt-1">Micro-tasks finished</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#e8e0d6]">
            <div className="h-8 w-8 rounded-lg bg-[#f0e8de] flex items-center justify-center mb-3">
              <Sparkles className="h-4 w-4 text-[#c4a882]" />
            </div>
            <p className="text-3xl font-semibold text-[#2c2416]">{Math.max(0, total - (sessionStats?.skipped || 0))}</p>
            <p className="text-[10px] text-[#9a8f82] uppercase tracking-wider mt-1">Stress zones cleared</p>
          </div>
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: "#f0d8cc" }}
          >
            <div className="h-8 w-8 rounded-lg bg-white/50 flex items-center justify-center mb-3">
              <Sparkles className="h-4 w-4 text-[#8a5c3a]" />
            </div>
            <p className="text-3xl font-semibold text-[#8a5c3a]">{cognitiveReduction}%</p>
            <p className="text-[10px] text-[#a07050] uppercase tracking-wider mt-1">Cognitive load reduction</p>
          </div>
        </motion.div>

        {/* Companion closing message */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 border border-[#e8e0d6] flex gap-5 items-center mb-8"
        >
          <div className="flex-shrink-0">
            <CompanionAvatar mood="celebrating" size="sm" message="Your environment is ready for you now." />
          </div>
          <p className="text-[#5a4f42] italic leading-relaxed text-sm flex-1">
            "Your environment is ready for you now. Great job reclaiming your space. The transition from chaos to calm is where true productivity begins."
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Button
            onClick={() => navigate("/garden")}
            className="flex-1 h-12 rounded-2xl font-medium flex items-center justify-center gap-2"
            style={{ backgroundColor: "#c4a882", color: "white" }}
          >
            <Play className="h-4 w-4" />
            Start Focus Session
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="flex-1 h-12 rounded-2xl font-medium border-[#e8e0d6] text-[#5a4f42] flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            Return to Dashboard
          </Button>
        </motion.div>

        <button
          onClick={onRestart}
          className="w-full text-center text-xs text-[#b8afa5] mt-4 hover:text-[#9a8f82] transition-colors"
        >
          Start another reset
        </button>
      </div>
    </div>
  );
}
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const COMPANION_MESSAGES = {
  idle: [
    "Coach is resetting with you",
    "I'm right here with you",
    "Take your time — no rush",
    "One small step at a time",
  ],
  encouraging: [
    "That's real progress.",
    "You're doing beautifully.",
    "Each step matters.",
    "This is working.",
  ],
  stuck: [
    "That's okay. Let's go smaller.",
    "No pressure — let's breathe first.",
    "Even noticing is a step.",
    "We'll restart gently.",
  ],
  celebrating: [
    "Yes! That counts.",
    "Your space is breathing.",
    "Tiny wins add up.",
    "Look at that — progress.",
  ],
};

// Soft pulsing ambient orb companion
function AmbientOrb({ mood = "idle" }) {
  const moodColors = {
    idle: ["#d4c5b0", "#e8ddd0", "#f0e8de"],
    encouraging: ["#c4d4b5", "#d5e5c5", "#e5f0d8"],
    stuck: ["#c5b5d4", "#d5c5e5", "#e5d5f0"],
    celebrating: ["#d4b5b5", "#e8c5c5", "#f0d8d8"],
  };
  const colors = moodColors[mood] || moodColors.idle;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Outer ambient ring */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: "90%", height: "90%", backgroundColor: colors[2], opacity: 0.4 }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Mid ring */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: "72%", height: "72%", backgroundColor: colors[1], opacity: 0.6 }}
        animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      {/* Core */}
      <motion.div
        className="relative rounded-full flex items-center justify-center shadow-lg"
        style={{ width: "52%", height: "52%", backgroundColor: colors[0] }}
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
      >
        <span className="text-2xl select-none">✦</span>
      </motion.div>
    </div>
  );
}

export default function CompanionAvatar({ mood = "idle", message = null, size = "md" }) {
  const [currentMsg, setCurrentMsg] = useState(
    message || COMPANION_MESSAGES[mood]?.[0]
  );
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (message) {
      setCurrentMsg(message);
      return;
    }
    const msgs = COMPANION_MESSAGES[mood] || COMPANION_MESSAGES.idle;
    setCurrentMsg(msgs[0]);
    setMsgIndex(0);
  }, [mood, message]);

  useEffect(() => {
    if (message) return;
    const msgs = COMPANION_MESSAGES[mood] || COMPANION_MESSAGES.idle;
    const interval = setInterval(() => {
      setMsgIndex((prev) => {
        const next = (prev + 1) % msgs.length;
        setCurrentMsg(msgs[next]);
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [mood, message]);

  const sizes = {
    sm: { container: "w-32 h-32", orb: "w-28 h-28" },
    md: { container: "w-44 h-44", orb: "w-40 h-40" },
    lg: { container: "w-56 h-56", orb: "w-52 h-52" },
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizes[size].orb} relative`}>
        <AmbientOrb mood={mood} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMsg}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl px-4 py-2 shadow-sm border border-[#e8e0d6] max-w-[180px]"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <motion.span
              className="inline-block w-1.5 h-1.5 rounded-full bg-green-400"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-[10px] text-[#9a8f82] font-medium">Coach is with you</span>
          </div>
          <p className="text-[11px] text-[#5a4f42] leading-snug text-center">{currentMsg}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
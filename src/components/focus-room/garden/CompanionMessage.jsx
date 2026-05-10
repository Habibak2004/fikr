import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const MESSAGES = {
  start:    ["Take a breath. Let's do the first one together.", "Ready when you are 🌱", "Just one question. You've got this."],
  progress: ["Nice, one done.", "Your plant is growing 🌿", "Keep going — you're doing it.", "One more. You're on a roll.", "Look at your plant. It's growing."],
  stuck:    ["That's okay. Being stuck is normal.", "Want to try a smaller piece?", "No rush. Let's break it down.", "Sometimes smaller is smarter."],
  timer_low:["Almost out of time. Partial progress counts too.", "It's okay if you don't finish — mark what you did."],
  complete: ["Session done 🌸 Your plant is proud of you.", "You showed up. That matters.", "Look how far you came today."],
  break:    ["Take a gentle breath. You earned it.", "Rest a moment. The plant is safe 🌿", "Come back when you're ready."],
  smaller:  ["One tiny piece is still real progress.", "Smaller is a smart choice.", "Let's do just this one thing."],
  checkin:  ["Still with you.", "You're doing great.", "One step at a time.", "The plant is watching 🌱"],
};

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function CompanionMessage({ context = "checkin", customMessage }) {
  const [message, setMessage] = useState(customMessage || getRandom(MESSAGES[context] || MESSAGES.checkin));

  useEffect(() => {
    setMessage(customMessage || getRandom(MESSAGES[context] || MESSAGES.checkin));
  }, [context, customMessage]);

  return (
    <AnimatePresence mode="wait">
      <motion.div key={message}
        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-start gap-2.5">
        <div className="h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-sm shadow-sm"
          style={{ background: "linear-gradient(135deg, #a8d5b5, #6dbf8a)", border: "1.5px solid #c8ebd4" }}>
          🌿
        </div>
        <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed text-stone-600 max-w-[220px]"
          style={{ background: "#f0fdf4", border: "1px solid #d1fae5" }}>
          {message}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
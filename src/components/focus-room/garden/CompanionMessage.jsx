import { motion, AnimatePresence } from "framer-motion";

// Context-aware message pool
const MESSAGES = {
  start:      ["Take a breath. Let's do the first one together.", "Just one question at a time. You've got this.", "Ready when you are 🌱"],
  progress:   ["Nice, one done.", "Your plant is growing.", "Keep going — you're doing it.", "One more, you're on a roll.", "Look at your plant growing 🌿"],
  stuck:      ["That's okay. Want to try a smaller piece?", "Being stuck is normal. Let's break it down.", "No rush. What part feels hard?", "Let's make it smaller. You don't have to do it all at once."],
  timer_low:  ["Almost out of time. Even partial progress counts.", "It's okay if you don't finish — mark what you did."],
  complete:   ["Session done! Your plant thanks you 🌸", "You did it. That took real effort.", "Look how far you've come today."],
  checkin:    ["Still here with you.", "Still with me?", "How's it going?", "You're doing great, one step at a time."],
  break:      ["Take a gentle breath. You earned this.", "Rest a moment. The plant is safe 🌿", "Good pause. Come back when you're ready."],
  smaller:    ["Let's make it even simpler.", "One tiny piece is still progress.", "Smaller is smarter sometimes."],
};

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function CompanionMessage({ context = "start", customMessage = null }) {
  const message = customMessage || getRandom(MESSAGES[context] || MESSAGES.checkin);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.4 }}
        className="flex items-start gap-2.5"
      >
        {/* Companion avatar */}
        <div
          className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-base shadow-sm"
          style={{ background: "linear-gradient(135deg, #a8d5b5, #7ec8a0)", border: "1.5px solid #c8ebd4" }}
        >
          🌿
        </div>
        <div
          className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed text-stone-600 max-w-[220px]"
          style={{ background: "#f0fdf4", border: "1px solid #d1fae5" }}
        >
          {message}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
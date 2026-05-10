import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function StuckModal({ task, onSmallerStep, onSkip, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.15)", backdropFilter: "blur(4px)" }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-sm"
        style={{ border: "1.5px solid #fde68a" }}
      >
        <div className="flex justify-between items-start mb-4">
          <p className="text-base font-bold text-stone-700">That's okay 🌤️</p>
          <button onClick={onClose} className="h-7 w-7 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-stone-500 mb-5 leading-relaxed">
          Being stuck happens to everyone. What would feel most helpful right now?
        </p>

        <div className="space-y-2.5">
          <button
            onClick={onSmallerStep}
            className="w-full py-3 px-4 rounded-2xl text-sm font-semibold text-left flex items-center gap-3 transition-all hover:opacity-90 text-white"
            style={{ background: "linear-gradient(135deg, #5a9a6f, #4a7c59)" }}
          >
            <span>🌱</span>
            <div>
              <p>Make it smaller</p>
              <p className="font-normal text-green-100 text-xs">Break it into tiny micro-steps</p>
            </div>
          </button>

          <button
            onClick={onSkip}
            className="w-full py-3 px-4 rounded-2xl text-sm font-medium text-stone-600 text-left flex items-center gap-3 transition-colors hover:bg-stone-50"
            style={{ border: "1.5px solid #e5e7eb" }}
          >
            <span>⏭️</span>
            <div>
              <p>Skip for now</p>
              <p className="text-xs text-stone-400">Move to the next question</p>
            </div>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 rounded-2xl text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            Stay on this question
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
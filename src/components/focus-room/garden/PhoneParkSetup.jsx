import { useState } from "react";
import { motion } from "framer-motion";
import { QrCode } from "lucide-react";

export default function PhoneParkSetup({ task, onParked, onSkip }) {
  const [showQR, setShowQR] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: "linear-gradient(160deg, #fafdf7 0%, #f0fdf4 55%, #fdf9f5 100%)" }}
    >
      <div className="w-full max-w-sm space-y-7 text-center">

        {/* Plant illustration */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-6xl select-none"
        >
          🌱
        </motion.div>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-stone-800">Park your phone to begin</h1>
          <p className="text-stone-400 text-sm leading-relaxed max-w-xs mx-auto">
            Place it face down, across the room, or somewhere slightly inconvenient.
            Your phone will help protect your focus while you work.
          </p>
        </div>

        {/* Current task pill */}
        {task && (
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm"
            style={{ background: "#f0fdf4", border: "1.5px solid #d1fae5" }}>
            <span className="text-green-600 font-semibold">Mission:</span>
            <span className="text-stone-600 truncate max-w-[180px]">
              {task.title}{task.subtitle ? ` — ${task.subtitle}` : ""}
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          {/* Primary */}
          <button
            onClick={() => onParked("manual")}
            className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #5a9a6f, #4a7c59)", boxShadow: "0 4px 20px rgba(90,154,111,0.25)" }}
          >
            📵 I parked my phone
          </button>

          {/* QR option */}
          {!showQR ? (
            <button
              onClick={() => setShowQR(true)}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold text-stone-600 flex items-center justify-center gap-2 transition-colors hover:bg-green-50"
              style={{ border: "1.5px solid #d1fae5" }}
            >
              <QrCode className="h-4 w-4 text-green-500" />
              Scan QR to park on another device
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 text-center space-y-3"
              style={{ background: "white", border: "1.5px solid #d1fae5" }}
            >
              {/* Simple SVG QR placeholder — represents "scan this to confirm park" */}
              <div className="mx-auto w-24 h-24 rounded-xl flex items-center justify-center"
                style={{ background: "#f0fdf4", border: "1.5px solid #d1fae5" }}>
                <QrCode className="h-12 w-12 text-green-500" />
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                Scan this on the device you're parking, then tap <strong className="text-stone-600">I parked my phone</strong> below.
              </p>
              <button onClick={() => onParked("qr")}
                className="px-5 py-2.5 rounded-2xl text-sm font-bold text-white"
                style={{ background: "#5a9a6f" }}>
                ✓ Done, phone is parked
              </button>
            </motion.div>
          )}

          {/* Skip */}
          <button
            onClick={onSkip}
            className="w-full py-3 text-xs text-stone-300 hover:text-stone-400 transition-colors"
          >
            Skip for now →
          </button>
        </div>

        {/* Tip */}
        <p className="text-[11px] text-stone-300 leading-relaxed">
          This isn't a rule — it's a tiny act of self-care 🌿
        </p>
      </div>
    </motion.div>
  );
}
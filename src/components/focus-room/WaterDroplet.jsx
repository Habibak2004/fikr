import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// A water droplet that grows during a 7-min interval.
// When ready, user can drag it to the tree (or tap to feed).

function DropletSVG({ fillPct = 0, size = 64 }) {
  // fillPct: 0–1
  const clipHeight = fillPct * 0.75; // fill up to 75% of the drop
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 40 48">
      <defs>
        <clipPath id="dropClip">
          {/* teardrop shape */}
          <path d="M20 2 Q32 16 32 28 A12 12 0 0 1 8 28 Q8 16 20 2Z" />
        </clipPath>
        <linearGradient id="waterFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="dropOutline" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bfdbfe" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
      </defs>

      {/* Drop outline */}
      <path d="M20 2 Q32 16 32 28 A12 12 0 0 1 8 28 Q8 16 20 2Z"
        fill="#e0f2fe" stroke="#60a5fa" strokeWidth="1.5" />

      {/* Water fill — grows from bottom */}
      <g clipPath="url(#dropClip)">
        <rect
          x="0"
          y={48 - clipHeight * 48}
          width="40"
          height={clipHeight * 48}
          fill="url(#waterFill)"
          opacity="0.85"
        />
        {/* Wave on top of fill */}
        {fillPct > 0.05 && (
          <motion.path
            d={`M0 ${48 - clipHeight * 48} Q10 ${48 - clipHeight * 48 - 3} 20 ${48 - clipHeight * 48} Q30 ${48 - clipHeight * 48 + 3} 40 ${48 - clipHeight * 48}`}
            fill="none"
            stroke="#93c5fd"
            strokeWidth="2"
            animate={{ d: [
              `M0 ${48 - clipHeight * 48} Q10 ${48 - clipHeight * 48 - 3} 20 ${48 - clipHeight * 48} Q30 ${48 - clipHeight * 48 + 3} 40 ${48 - clipHeight * 48}`,
              `M0 ${48 - clipHeight * 48} Q10 ${48 - clipHeight * 48 + 3} 20 ${48 - clipHeight * 48} Q30 ${48 - clipHeight * 48 - 3} 40 ${48 - clipHeight * 48}`,
              `M0 ${48 - clipHeight * 48} Q10 ${48 - clipHeight * 48 - 3} 20 ${48 - clipHeight * 48} Q30 ${48 - clipHeight * 48 + 3} 40 ${48 - clipHeight * 48}`,
            ]}}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </g>

      {/* Shine */}
      <ellipse cx="14" cy="16" rx="3" ry="5" fill="white" opacity="0.5" transform="rotate(-20 14 16)" />
    </svg>
  );
}

export default function WaterDroplet({ fillPct = 0, isReady = false, onFeed, index = 0 }) {
  const [fed, setFed] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFeed = () => {
    if (!isReady || fed) return;
    setFed(true);
    setTimeout(() => onFeed?.(), 600);
  };

  if (fed) return null;

  return (
    <motion.div
      className="flex flex-col items-center gap-1 cursor-pointer select-none"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 300, damping: 20 }}
    >
      <AnimatePresence mode="wait">
        {isReady ? (
          <motion.div
            key="ready"
            onClick={handleFeed}
            drag
            dragSnapToOrigin
            onDragStart={() => setDragging(true)}
            onDragEnd={(e, info) => {
              setDragging(false);
              // If dragged up (toward tree), feed
              if (info.offset.y < -60) {
                setFed(true);
                setTimeout(() => onFeed?.(), 300);
              }
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={!dragging ? { y: [0, -5, 0] } : {}}
            transition={!dragging ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
            className="relative"
            title="Drag to tree or tap to water!"
          >
            <DropletSVG fillPct={1} size={52} />
            {/* Ready pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-blue-400 pointer-events-none"
              style={{ borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%" }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <p className="text-[9px] text-blue-500 font-bold text-center mt-0.5">Tap/drag!</p>
          </motion.div>
        ) : (
          <motion.div key="filling">
            <DropletSVG fillPct={fillPct} size={44} />
            <p className="text-[8px] text-stone-300 text-center mt-0.5">{Math.round(fillPct * 100)}%</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
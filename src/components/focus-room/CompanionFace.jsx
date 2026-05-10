import { motion } from "framer-motion";

// mood: "idle" | "happy" | "thinking" | "encouraging" | "break"
export default function CompanionFace({ mood = "idle", isSpeaking = false, size = 80 }) {
  const eyeY = 36;
  const mouthY = 56;

  const mouthPaths = {
    idle:        "M 30 56 Q 40 62 50 56",
    happy:       "M 28 54 Q 40 66 52 54",
    thinking:    "M 32 58 Q 40 56 48 58",
    encouraging: "M 28 54 Q 40 67 52 54",
    break:       "M 30 56 Q 40 60 50 56",
  };

  const eyeSquint = mood === "happy" || mood === "encouraging";
  const blink = true;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background glow */}
      <motion.circle
        cx="40" cy="40" r="38"
        fill="url(#faceGrad)"
        animate={isSpeaking ? { r: [38, 40, 38] } : { r: 38 }}
        transition={{ duration: 0.4, repeat: isSpeaking ? Infinity : 0, ease: "easeInOut" }}
      />

      {/* Subtle outer ring when speaking */}
      {isSpeaking && (
        <motion.circle
          cx="40" cy="40" r="38"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="3"
          animate={{ r: [38, 44, 38], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <defs>
        <radialGradient id="faceGrad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#7BB8E8" />
          <stop offset="100%" stopColor="#4A7FB5" />
        </radialGradient>
      </defs>

      {/* Left eye */}
      {eyeSquint ? (
        <motion.path
          d="M 23 34 Q 28 30 33 34"
          stroke="white" strokeWidth="2.5" strokeLinecap="round"
          fill="none"
        />
      ) : (
        <motion.ellipse
          cx="28" cy={eyeY - 2} rx="4" ry="4.5"
          fill="white"
          animate={blink ? { ry: [4.5, 0.5, 4.5] } : {}}
          transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
        />
      )}

      {/* Right eye */}
      {eyeSquint ? (
        <motion.path
          d="M 47 34 Q 52 30 57 34"
          stroke="white" strokeWidth="2.5" strokeLinecap="round"
          fill="none"
        />
      ) : (
        <motion.ellipse
          cx="52" cy={eyeY - 2} rx="4" ry="4.5"
          fill="white"
          animate={blink ? { ry: [4.5, 0.5, 4.5] } : {}}
          transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 4, delay: 0.05, ease: "easeInOut" }}
        />
      )}

      {/* Eye pupils (only when not squinting) */}
      {!eyeSquint && (
        <>
          <circle cx="29" cy={eyeY - 1} r="1.8" fill="#2d5a87" />
          <circle cx="53" cy={eyeY - 1} r="1.8" fill="#2d5a87" />
          {/* Catchlights */}
          <circle cx="30.5" cy={eyeY - 2.5} r="0.8" fill="white" />
          <circle cx="54.5" cy={eyeY - 2.5} r="0.8" fill="white" />
        </>
      )}

      {/* Mouth */}
      <motion.path
        d={mouthPaths[mood] || mouthPaths.idle}
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        animate={{ d: mouthPaths[mood] || mouthPaths.idle }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      />

      {/* Cheek blush when happy */}
      {(mood === "happy" || mood === "encouraging") && (
        <>
          <ellipse cx="20" cy="46" rx="6" ry="4" fill="rgba(255,180,180,0.35)" />
          <ellipse cx="60" cy="46" rx="6" ry="4" fill="rgba(255,180,180,0.35)" />
        </>
      )}

      {/* Thinking dot */}
      {mood === "thinking" && (
        <motion.g animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
          <circle cx="58" cy="22" r="2.5" fill="white" opacity="0.7" />
          <circle cx="64" cy="16" r="2" fill="white" opacity="0.5" />
          <circle cx="69" cy="11" r="1.5" fill="white" opacity="0.3" />
        </motion.g>
      )}
    </motion.svg>
  );
}
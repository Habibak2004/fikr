import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Upload, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import CompanionAvatar from "./CompanionAvatar";

const MODE_OPTIONS = [
  { id: "quick", label: "Quick Reset", emoji: "⚡", desc: "5–10 minutes" },
  { id: "study", label: "Study Reset", emoji: "📚", desc: "Clear for focus" },
  { id: "desk", label: "Desk Reset", emoji: "🖥️", desc: "Just the workspace" },
  { id: "laundry", label: "Laundry Rescue", emoji: "👕", desc: "Textiles only" },
  { id: "floor", label: "Floor Recovery", emoji: "🧹", desc: "Reclaim floor space" },
  { id: "emergency", label: "5-Min Emergency", emoji: "🆘", desc: "Absolute minimum" },
  { id: "deep", label: "Deep Clean", emoji: "✨", desc: "Full restoration" },
  { id: "cant_start", label: "I Can't Start", emoji: "💙", desc: "Ultra-gentle" },
];

export default function PhotoUpload({ energyLevel, onAnalyzed, onBack }) {
  const [mode, setMode] = useState("quick");
  const [dragOver, setDragOver] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const ANALYZE_STEPS = [
    "Scanning room environment...",
    "Identifying stress zones...",
    "Mapping clutter patterns...",
    "Calibrating to your energy level...",
    "Generating gentle action plan...",
  ];

  const processFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    setError(null);
    setAnalyzing(true);

    // Animate steps
    let stepIdx = 0;
    const stepInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < ANALYZE_STEPS.length) setAnalyzeStep(stepIdx);
    }, 900);

    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    const energyDescriptions = {
      barely: "barely functioning, exhausted, overwhelmed",
      low: "low energy, a bit sluggish",
      moderate: "moderate energy, balanced",
      locked: "high energy, locked in and focused",
    };

    const prompt = `You are an emotionally intelligent AI assistant helping a neurodivergent student reset their room environment. 
The user's current energy level is: ${energyDescriptions[energyLevel] || "moderate"}.
Reset mode selected: ${mode}.

Analyze this room image and respond ONLY with valid JSON (no markdown, no extra text):

{
  "stress_zones": [list of 2-4 specific zones that need attention, e.g. "Desk surface", "Floor near bed"],
  "stress_zone_count": number,
  "estimated_minutes": number (realistic based on energy level and mode),
  "room_summary": "2-sentence emotionally safe description of what you see, using supportive language. Never use 'messy' or 'dirty'.",
  "priority_actions": [
    { "label": "short action label", "zone": "zone name", "emoji": "relevant emoji" }
  ],
  "phases": {
    "phase1": [
      { "task": "specific gentle micro-task", "zone": "where", "minutes": 1-3, "phase": 1 }
    ],
    "phase2": [
      { "task": "specific task", "zone": "where", "minutes": 2-5, "phase": 2 }
    ],
    "phase3": [
      { "task": "specific task", "zone": "where", "minutes": 3-8, "phase": 3 }
    ]
  },
  "companion_opening": "A warm, emotionally safe 1-sentence message from an AI coach. Use language like 'This space is carrying a lot' or 'We'll restore one small area at a time.' Never shame the user.",
  "room_wisdom": "A short, calming quote about space and mind (max 12 words)",
  "detected_objects": ["list of objects detected like clothes, dishes, papers etc"],
  "functional_issues": ["list of functional issues like blocked pathway, unusable desk"]
}

IMPORTANT: 
- Phase 1 tasks should be under 3 minutes each, very easy wins
- If energy is "barely" or "low", only include phase 1 tasks (max 4-5 tasks total)
- Phase 3 only for "locked" energy level
- Use emotionally safe, supportive language throughout
- Tasks should be hyper-specific and actionable
- For "cant_start" mode: maximum 3 tasks, all under 1 minute`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          stress_zones: { type: "array", items: { type: "string" } },
          stress_zone_count: { type: "number" },
          estimated_minutes: { type: "number" },
          room_summary: { type: "string" },
          priority_actions: { type: "array", items: { type: "object" } },
          phases: { type: "object" },
          companion_opening: { type: "string" },
          room_wisdom: { type: "string" },
          detected_objects: { type: "array", items: { type: "string" } },
          functional_issues: { type: "array", items: { type: "string" } },
        },
      },
    });

    clearInterval(stepInterval);
    onAnalyzed(file_url, { ...result, mode });
  };

  const handleFile = (file) => processFile(file);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (analyzing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f5f2] px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <CompanionAvatar mood="idle" message="Gently reading your space..." size="lg" />
          <div className="mt-10 space-y-3">
            {ANALYZE_STEPS.map((step, i) => (
              <motion.div
                key={step}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: i <= analyzeStep ? 1 : 0.2, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: i <= analyzeStep ? "#c4a882" : "#e8e0d6" }}
                />
                <p className="text-sm text-[#5a4f42] text-left">{step}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f5f2] px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-[#9a8f82] text-sm mb-8 hover:text-[#5a4f42] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h2 className="text-3xl font-semibold text-[#2c2416] mb-2">Share your space.</h2>
          <p className="text-[#9a8f82] mb-8 leading-relaxed">
            Your photo helps us understand what your environment needs. This is a judgment-free zone.
          </p>

          {/* Mode selection */}
          <div className="mb-8">
            <p className="text-xs text-[#9a8f82] uppercase tracking-widest mb-3 font-medium">Reset Mode</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MODE_OPTIONS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`px-3 py-2.5 rounded-xl text-left transition-all duration-200 border ${
                    mode === m.id
                      ? "bg-[#2c2416] text-white border-[#2c2416]"
                      : "bg-white text-[#5a4f42] border-[#e8e0d6] hover:border-[#c4a882]"
                  }`}
                >
                  <span className="text-base">{m.emoji}</span>
                  <p className="text-xs font-medium mt-1 leading-tight">{m.label}</p>
                  <p className={`text-[10px] mt-0.5 ${mode === m.id ? "text-white/60" : "text-[#9a8f82]"}`}>{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Upload area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
              dragOver ? "border-[#c4a882] bg-[#fdf8f3]" : "border-[#d8d0c4] bg-white hover:border-[#c4a882] hover:bg-[#fdf8f3]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <motion.div animate={{ scale: dragOver ? 1.05 : 1 }} transition={{ duration: 0.2 }}>
              <div className="h-14 w-14 rounded-2xl bg-[#f0e8de] flex items-center justify-center mx-auto mb-4">
                <Upload className="h-6 w-6 text-[#c4a882]" />
              </div>
              <p className="font-medium text-[#2c2416] mb-1">Upload a photo of your space</p>
              <p className="text-sm text-[#9a8f82]">Drag & drop or tap to browse</p>
            </motion.div>
          </div>

          {error && <p className="text-red-400 text-sm mt-3 text-center">{error}</p>}

          <p className="text-center text-xs text-[#b8afa5] mt-6 leading-relaxed">
            <Sparkles className="inline h-3 w-3 mr-1" />
            Your photo is analyzed privately and never stored for training.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
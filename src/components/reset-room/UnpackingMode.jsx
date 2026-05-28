import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Package, Plus, CheckCircle2, MapPin, Sparkles, ChevronRight, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CONTAINER_TYPES = [
  { id: "suitcase", emoji: "🧳", label: "Suitcase", desc: "Just got back from a trip" },
  { id: "boxes", emoji: "📦", label: "Moving boxes", desc: "Moving in or reorganizing" },
  { id: "shopping", emoji: "🛍️", label: "Shopping bags", desc: "Groceries or new purchases" },
  { id: "backpack", emoji: "🎒", label: "Backpack / bag", desc: "School or travel bag" },
  { id: "laundry", emoji: "🧺", label: "Laundry", desc: "Clean clothes to put away" },
  { id: "misc", emoji: "🗂️", label: "Miscellaneous pile", desc: "Random stuff that accumulated" },
];

const ZONE_SUGGESTIONS = ["Desk", "Wardrobe", "Bathroom", "Kitchen", "Shelf", "Under bed", "Drawer", "Closet", "Bedside table"];

export default function UnpackingMode({ energyLevel, onDone, onSkip }) {
  const [phase, setPhase] = useState("pick"); // pick → list → guide → done
  const [selectedContainers, setSelectedContainers] = useState([]);
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [newZone, setNewZone] = useState("");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState([]);

  const toggleContainer = (id) => {
    setSelectedContainers(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    setItems(prev => [...prev, { id: Date.now(), name: newItem.trim(), zone: newZone.trim() || "" }]);
    setNewItem("");
    setNewZone("");
  };

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const generatePlan = async () => {
    setLoading(true);
    const containerNames = selectedContainers.map(id => CONTAINER_TYPES.find(c => c.id === id)?.label).join(", ");
    const itemList = items.map(i => `${i.name}${i.zone ? ` → ${i.zone}` : ""}`).join("; ");

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `A student is unpacking their ${containerNames || "bags and boxes"} and needs gentle, step-by-step guidance.
Energy level: ${energyLevel || "moderate"}.
Items to unpack: ${itemList || "general contents — clothes, accessories, books, toiletries, etc."}.

Generate a practical unpacking plan as a JSON array of steps. Each step should be one small, clear action.
Group related items together (e.g. all clothes first, then toiletries, etc.).
Keep the language warm and encouraging — never critical.
Tailor step size to the energy level: "barely" = very tiny steps, "locked" = efficient grouped steps.

Return ONLY JSON: { "steps": [ { "action": "...", "zone": "...", "emoji": "..." } ] }
Maximum 12 steps. Each action should take under 2 minutes.`,
        response_json_schema: {
          type: "object",
          properties: {
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  zone: { type: "string" },
                  emoji: { type: "string" }
                }
              }
            }
          }
        }
      });
      setPlan(res?.steps || []);
      setPhase("guide");
    } catch {
      setPlan([{ action: "Take everything out of your container and lay it flat", zone: "Floor", emoji: "📋" },
               { action: "Group similar items together", zone: "Floor", emoji: "📦" },
               { action: "Put away items one group at a time", zone: "Their homes", emoji: "✅" }]);
      setPhase("guide");
    }
    setLoading(false);
  };

  const advance = () => {
    if (currentIdx + 1 >= plan.length) {
      setPhase("done");
    } else {
      setCurrentIdx(i => i + 1);
    }
  };

  // Phase: pick container type
  if (phase === "pick") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-[#f7f5f2]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <div className="text-5xl mb-4">📦</div>
            <h1 className="text-3xl md:text-4xl font-semibold text-[#2c2416] tracking-tight mb-3">
              What are you unpacking?
            </h1>
            <p className="text-[#9a8f82] text-sm max-w-sm mx-auto leading-relaxed">
              Select everything you need to unpack. We'll build a step-by-step plan tailored to your energy level.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            {CONTAINER_TYPES.map((c, i) => {
              const selected = selectedContainers.includes(c.id);
              return (
                <motion.button
                  key={c.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => toggleContainer(c.id)}
                  className="text-left p-4 rounded-2xl border-2 transition-all duration-200"
                  style={{
                    borderColor: selected ? "#c4a882" : "#e8e0d6",
                    backgroundColor: selected ? "#fdf8f3" : "white",
                  }}
                >
                  <div className="text-3xl mb-2">{c.emoji}</div>
                  <p className="font-medium text-[#2c2416] text-sm">{c.label}</p>
                  <p className="text-[#9a8f82] text-xs mt-0.5">{c.desc}</p>
                  {selected && (
                    <CheckCircle2 className="h-4 w-4 mt-2" style={{ color: "#c4a882" }} />
                  )}
                </motion.button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onSkip}
              className="flex-1 h-12 rounded-2xl border border-[#e8e0d6] bg-white text-[#9a8f82] text-sm hover:border-[#c4a882] transition-all"
            >
              Skip
            </button>
            <button
              onClick={() => setPhase("list")}
              disabled={selectedContainers.length === 0}
              className="flex-grow-[2] h-12 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40"
              style={{ backgroundColor: "#4a3b2a", color: "white" }}
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Phase: list items (optional)
  if (phase === "list") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-[#f7f5f2]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-[#2c2416] mb-2">What's inside?</h2>
            <p className="text-[#9a8f82] text-sm">
              Optionally list specific items — helps us build a smarter plan. Or skip and we'll handle it generally.
            </p>
          </div>

          {/* Add item */}
          <div className="bg-white rounded-3xl border border-[#e8e0d6] p-5 shadow-sm mb-4">
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addItem()}
                placeholder="Item name (e.g. winter jacket)"
                className="flex-1 bg-[#f7f5f2] rounded-xl px-3 py-2.5 text-sm text-[#2c2416] placeholder-[#c4bdb5] outline-none focus:ring-1 focus:ring-[#c4a882]/50"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#c4bdb5]" />
                <input
                  type="text"
                  value={newZone}
                  onChange={e => setNewZone(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addItem()}
                  placeholder="Where does it go? (optional)"
                  className="w-full bg-[#f7f5f2] rounded-xl pl-8 pr-3 py-2.5 text-sm text-[#2c2416] placeholder-[#c4bdb5] outline-none focus:ring-1 focus:ring-[#c4a882]/50"
                />
              </div>
              <button
                onClick={addItem}
                disabled={!newItem.trim()}
                className="h-10 w-10 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all"
                style={{ backgroundColor: "#4a3b2a", color: "white" }}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {/* Zone chips */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {ZONE_SUGGESTIONS.map(z => (
                <button
                  key={z}
                  onClick={() => setNewZone(z)}
                  className="px-2.5 py-1 rounded-full text-[11px] border transition-all"
                  style={{
                    borderColor: newZone === z ? "#c4a882" : "#e8e0d6",
                    backgroundColor: newZone === z ? "#fdf8f3" : "white",
                    color: newZone === z ? "#7a5c3a" : "#9a8f82"
                  }}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>

          {/* Item list */}
          <AnimatePresence>
            {items.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-[#e8e0d6] mb-2"
              >
                <Package className="h-4 w-4 text-[#c4a882] flex-shrink-0" />
                <span className="flex-1 text-sm text-[#2c2416]">{item.name}</span>
                {item.zone && (
                  <span className="text-xs text-[#9a8f82] flex items-center gap-1">
                    <MapPin className="h-3 w-3" />{item.zone}
                  </span>
                )}
                <button onClick={() => removeItem(item.id)} className="text-[#c4bdb5] hover:text-[#9a8f82]">
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setPhase("pick")}
              className="h-12 px-5 rounded-2xl border border-[#e8e0d6] bg-white text-[#9a8f82] text-sm hover:border-[#c4a882] transition-all"
            >
              Back
            </button>
            <button
              onClick={generatePlan}
              disabled={loading}
              className="flex-1 h-12 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              style={{ backgroundColor: "#4a3b2a", color: "white" }}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Building your plan...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Build my unpacking plan
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Phase: guided unpacking
  if (phase === "guide") {
    const step = plan[currentIdx];
    const progress = Math.round(((currentIdx) / plan.length) * 100);
    return (
      <div className="min-h-screen bg-[#f7f5f2] flex flex-col">
        {/* Progress bar */}
        <div className="relative h-1 bg-[#e8e0d6] flex-shrink-0">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: "#c4a882" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-lg">
            <p className="text-xs text-center text-[#9a8f82] uppercase tracking-widest mb-8">
              Step {currentIdx + 1} of {plan.length}
            </p>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.35 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-[#e8e0d6] text-center mb-6"
              >
                <div className="text-5xl mb-5">{step.emoji || "📦"}</div>
                <p className="text-2xl font-medium text-[#2c2416] leading-snug mb-3">{step.action}</p>
                {step.zone && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "#fdf8f3", color: "#7a5c3a" }}>
                    <MapPin className="h-3 w-3" /> {step.zone}
                  </span>
                )}
              </motion.div>
            </AnimatePresence>

            <button
              onClick={advance}
              className="w-full h-13 rounded-2xl font-medium text-base flex items-center justify-center gap-2 transition-all duration-200 active:scale-98"
              style={{ backgroundColor: "#4a3b2a", color: "white", padding: "14px" }}
            >
              <CheckCircle2 className="h-5 w-5" />
              {currentIdx + 1 >= plan.length ? "All done!" : "Done — next step"}
            </button>

            <button
              onClick={advance}
              className="w-full mt-3 h-11 rounded-2xl border border-[#e8e0d6] bg-white text-[#9a8f82] text-sm hover:border-[#c4a882] transition-all"
            >
              Skip this step
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Phase: done
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-[#f7f5f2]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center"
      >
        <div className="text-6xl mb-6">✨</div>
        <h2 className="text-3xl font-semibold text-[#2c2416] mb-3">All unpacked!</h2>
        <p className="text-[#9a8f82] text-sm leading-relaxed mb-8 max-w-sm mx-auto">
          Your space is looking great. Now let's finish the full reset so everything feels just right.
        </p>
        <button
          onClick={() => onDone(items)}
          className="w-full h-13 rounded-2xl font-medium text-base flex items-center justify-center gap-2 transition-all"
          style={{ backgroundColor: "#4a3b2a", color: "white", padding: "14px" }}
        >
          Continue to full reset <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={onSkip}
          className="mt-3 w-full h-11 rounded-2xl border border-[#e8e0d6] bg-white text-[#9a8f82] text-sm hover:border-[#c4a882] transition-all"
        >
          Skip — room is good now
        </button>
      </motion.div>
    </div>
  );
}
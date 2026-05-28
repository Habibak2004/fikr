import { useState, useEffect } from "react";
import { Lightbulb } from "lucide-react";

const STORAGE_KEY = "fikr_idea_pad";

export default function IdeaPad() {
  const [text, setText] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || ""; } catch { return ""; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, text); } catch {}
  }, [text]);

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3">
        <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Idea Pad</p>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Jot down ideas, thoughts, anything..."
        className="w-full h-36 resize-none rounded-xl border border-border/60 bg-amber-50/60 px-3 py-2.5 text-sm text-foreground/80 placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 transition-all leading-relaxed"
      />
    </div>
  );
}
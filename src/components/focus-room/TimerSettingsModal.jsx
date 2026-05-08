import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

function Stepper({ label, value, onChange, min = 1, max = 120 }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-sm font-semibold text-stone-600">{label}</span>
      <div className="flex items-center gap-4">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="h-10 w-10 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center text-stone-600 hover:bg-stone-100 transition-colors"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="text-4xl font-bold font-mono w-16 text-center text-stone-800">{value}</div>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="h-10 w-10 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center text-stone-600 hover:bg-stone-100 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <span className="text-xs text-stone-400">minutes</span>
    </div>
  );
}

export default function TimerSettingsModal({ open, onClose, focusMinutes, breakMinutes, onSave }) {
  const [focus, setFocus] = useState(focusMinutes);
  const [breakTime, setBreakTime] = useState(breakMinutes);

  const handleSave = () => onSave({ focus, breakTime });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden border-stone-200">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-stone-100">
          <DialogTitle className="text-lg font-extrabold text-stone-800">⏱ Timer Settings</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-8 flex justify-around gap-4">
          <Stepper label="🎯 Focus" value={focus} onChange={setFocus} min={1} max={120} />
          <div className="w-px bg-stone-100 self-stretch" />
          <Stepper label="☕ Break" value={breakTime} onChange={setBreakTime} min={1} max={60} />
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl border-stone-200">Cancel</Button>
          <Button onClick={handleSave} className="flex-1 rounded-xl bg-primary hover:bg-primary/90">Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
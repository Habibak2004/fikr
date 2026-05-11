import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music2, Volume2, VolumeX, ChevronDown } from "lucide-react";

const TRACKS = [
  { id: "forest_rain", label: "Forest Rain", emoji: "🌧️", url: "https://cdn.pixabay.com/audio/2022/03/10/audio_270f44b645.mp3" },
  { id: "ocean", label: "Deep Ocean", emoji: "🌊", url: "https://cdn.pixabay.com/audio/2021/09/06/audio_6ded9b6b23.mp3" },
  { id: "brown_noise", label: "Brown Noise", emoji: "🟤", url: "https://cdn.pixabay.com/audio/2022/01/18/audio_d0c6ff1fcc.mp3" },
  { id: "campfire", label: "Campfire", emoji: "🔥", url: "https://cdn.pixabay.com/audio/2022/03/24/audio_7b3df56e63.mp3" },
  { id: "white_noise", label: "White Noise", emoji: "☁️", url: "https://cdn.pixabay.com/audio/2021/08/09/audio_dc39bea3bc.mp3" },
];

export default function AmbientPlayer() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!selected) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(selected.url);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;
    if (playing) audio.play().catch(() => {});
  }, [selected]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  const selectTrack = (track) => {
    const wasPlaying = playing;
    setSelected(track);
    setOpen(false);
    // Auto-play on selection
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
        setPlaying(true);
      }
    }, 50);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

  return (
    <div className="relative">
      {/* Main widget pill */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
        style={{ background: "white", border: "1.5px solid #d1fae5", boxShadow: "0 2px 12px rgba(90,154,111,0.08)" }}>

        {/* Play/mute button */}
        <button
          onClick={selected ? togglePlay : () => setOpen(o => !o)}
          className="h-7 w-7 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          style={{ background: playing ? "#5a9a6f" : "#f0fdf4", border: "1.5px solid #d1fae5" }}
          title={selected ? (playing ? "Pause" : "Play") : "Pick a sound"}>
          {playing
            ? <Volume2 className="h-3.5 w-3.5 text-white" />
            : <VolumeX className="h-3.5 w-3.5 text-green-400" />}
        </button>

        {/* Track selector button */}
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-800 transition-colors">
          {selected ? (
            <span>{selected.emoji} {selected.label}</span>
          ) : (
            <span className="flex items-center gap-1 text-stone-400"><Music2 className="h-3.5 w-3.5" /> Ambient</span>
          )}
          <ChevronDown className={`h-3 w-3 text-stone-300 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {/* Volume slider — only when playing */}
        {selected && (
          <input
            type="range" min="0" max="1" step="0.05"
            value={volume}
            onChange={e => setVolume(parseFloat(e.target.value))}
            className="w-16 h-1 accent-green-500 cursor-pointer"
            title="Volume"
          />
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 w-48 rounded-2xl overflow-hidden z-50"
            style={{ background: "white", border: "1.5px solid #d1fae5", boxShadow: "0 8px 24px rgba(90,154,111,0.12)" }}>
            {TRACKS.map(track => (
              <button key={track.id}
                onClick={() => selectTrack(track)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-green-50"
                style={{ borderBottom: "1px solid #f0fdf4", color: selected?.id === track.id ? "#4a7c59" : "#374151" }}>
                <span className="text-base">{track.emoji}</span>
                <span className={selected?.id === track.id ? "font-semibold" : ""}>{track.label}</span>
                {selected?.id === track.id && playing && (
                  <span className="ml-auto text-[10px] text-green-500 font-bold">▶</span>
                )}
              </button>
            ))}
            <button
              onClick={() => { if (audioRef.current) { audioRef.current.pause(); } setPlaying(false); setSelected(null); setOpen(false); }}
              className="w-full px-4 py-2.5 text-xs text-stone-400 text-left hover:bg-stone-50 transition-colors">
              ✕ Turn off
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
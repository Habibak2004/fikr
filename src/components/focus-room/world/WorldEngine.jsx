// World archetype definitions and progression engine

export const ARCHETYPES = {
  observatory: {
    id: "observatory",
    name: "Observatory Realm",
    emoji: "🌌",
    tagline: "Restoring the stars, one answer at a time",
    keywords: ["math", "physics", "calculus", "statistics", "algebra", "chemistry", "astronomy"],
    companionName: "Lyra",
    color: "#1a1a4e",
    accentColor: "#a78bfa",
    glowColor: "rgba(167,139,250,0.3)",
    progressWords: ["A new star glimmers", "The telescope stirs", "A constellation forms", "The sky brightens"],
  },
  forest: {
    id: "forest",
    name: "Spirit Forest",
    emoji: "🌿",
    tagline: "The forest grows with every insight",
    keywords: ["biology", "psychology", "ecology", "medicine", "botany", "neuroscience", "health"],
    companionName: "Mira",
    color: "#0d2b1a",
    accentColor: "#4ade80",
    glowColor: "rgba(74,222,128,0.3)",
    progressWords: ["A seedling stirs", "Petals unfurl", "A river clears", "The canopy thickens"],
  },
  city: {
    id: "city",
    name: "Network City",
    emoji: "🌃",
    tagline: "Reconnecting the grid, node by node",
    keywords: ["computer", "engineering", "software", "algorithm", "data", "network", "programming", "code"],
    companionName: "Nyx",
    color: "#0a0f1e",
    accentColor: "#38bdf8",
    glowColor: "rgba(56,189,248,0.3)",
    progressWords: ["A node comes online", "A circuit closes", "A skyline flickers", "The grid hums"],
  },
  library: {
    id: "library",
    name: "Forgotten Library",
    emoji: "📚",
    tagline: "Ancient knowledge restored, page by page",
    keywords: ["history", "literature", "philosophy", "english", "writing", "humanities", "art", "social"],
    companionName: "Lore",
    color: "#1a0f00",
    accentColor: "#f59e0b",
    glowColor: "rgba(245,158,11,0.3)",
    progressWords: ["A page is restored", "A tome awakens", "The archive brightens", "A new chapter opens"],
  },
  journey: {
    id: "journey",
    name: "Endless Journey",
    emoji: "🚂",
    tagline: "Moving forward, one station at a time",
    keywords: [],
    companionName: "Sage",
    color: "#0f1a2e",
    accentColor: "#94a3b8",
    glowColor: "rgba(148,163,184,0.3)",
    progressWords: ["The train moves on", "A new station nears", "Landscapes unfold", "The journey deepens"],
  },
  kingdom: {
    id: "kingdom",
    name: "Floating Kingdom",
    emoji: "🏰",
    tagline: "Rebuilding towers above the clouds",
    keywords: ["advanced", "theoretical", "architecture", "structural", "mechanical", "aerospace", "quantum"],
    companionName: "Aether",
    color: "#1a0a2e",
    accentColor: "#e879f9",
    glowColor: "rgba(232,121,249,0.3)",
    progressWords: ["A stone settles into place", "A bridge takes shape", "A tower rises", "The kingdom stirs"],
  },
};

export function getArchetypeForCourse(courseName = "", courseCode = "") {
  const text = (courseName + " " + courseCode).toLowerCase();
  for (const [key, arch] of Object.entries(ARCHETYPES)) {
    if (arch.keywords.some(k => text.includes(k))) return arch;
  }
  return ARCHETYPES.journey; // default
}

// XP needed to level up (level 0–5)
export const LEVEL_THRESHOLDS = [0, 3, 8, 16, 28, 45];

export function getWorldLevel(totalTasksCompleted) {
  let level = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalTasksCompleted >= LEVEL_THRESHOLDS[i]) { level = i; break; }
  }
  return Math.min(level, 5);
}

export function getLevelProgress(totalTasksCompleted) {
  const level = getWorldLevel(totalTasksCompleted);
  if (level >= 5) return 1;
  const current = LEVEL_THRESHOLDS[level];
  const next = LEVEL_THRESHOLDS[level + 1];
  return (totalTasksCompleted - current) / (next - current);
}

export const LEVEL_NAMES = [
  "Dormant",
  "Awakening",
  "Stirring",
  "Blossoming",
  "Radiant",
  "Restored",
];
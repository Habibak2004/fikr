/**
 * Priority Engine — Adaptive AI-powered task scoring
 * Scores tasks based on urgency, cognitive load, momentum, burnout, and human behavior patterns.
 */

import { differenceInDays, differenceInHours } from "date-fns";

const now = () => new Date();

// ------- Cognitive Load Estimator -------
// Returns 0 (easy) → 10 (very hard)
export function estimateCognitiveLoad(task) {
  let load = 3; // baseline

  // Type-based load
  const highLoadTypes = ["exam", "paper", "project", "presentation"];
  const lowLoadTypes = ["quiz", "homework", "lab"];
  if (highLoadTypes.includes(task.type)) load += 3;
  if (lowLoadTypes.includes(task.type)) load -= 1;

  // Keyword detection for emotional resistance
  const hardWords = /reflection|analysis|essay|research|thesis|comprehensive|cumulative|design|proposal/i;
  const easyWords = /read|review|submit|upload|check|email|fill|sign|confirm/i;
  if (hardWords.test(task.name)) load += 2;
  if (easyWords.test(task.name)) load -= 2;

  // High priority = probably harder
  if (task.priority === "high") load += 1;

  // Weight-based (high grade weight = more anxiety)
  if (task.weight >= 30) load += 2;
  else if (task.weight >= 15) load += 1;

  return Math.max(0, Math.min(10, load));
}

// ------- Urgency Score -------
// Returns 0–30 based on how soon the deadline is
export function urgencyScore(task) {
  if (!task.due_date) return 5;
  const days = differenceInDays(new Date(task.due_date), now());
  if (days < 0) return 30;        // overdue
  if (days === 0) return 28;      // due today
  if (days === 1) return 24;
  if (days <= 3) return 18;
  if (days <= 7) return 12;
  if (days <= 14) return 6;
  return 2;
}

// ------- Impact Score -------
// Returns 0–20 based on grade weight and task type
export function impactScore(task) {
  let score = 5;
  if (task.weight >= 40) score += 15;
  else if (task.weight >= 25) score += 10;
  else if (task.weight >= 15) score += 7;
  else if (task.weight >= 10) score += 4;

  if (task.type === "exam") score += 8;
  if (task.type === "paper" || task.type === "project") score += 5;
  if (task.priority === "high") score += 4;
  if (task.priority === "low") score -= 3;

  return Math.min(20, score);
}

// ------- Momentum Potential -------
// Tasks that are quick / easy to start build momentum — score 0–15
export function momentumScore(task) {
  const cogLoad = estimateCognitiveLoad(task);
  let score = 0;

  // Low activation energy = high momentum value
  if (cogLoad <= 3) score += 10;
  else if (cogLoad <= 5) score += 5;
  else score += 1;

  // Admin/email tasks are quick wins
  if (/email|contact|submit|upload|confirm|sign|fill|check|review/i.test(task.name)) score += 5;

  // Short estimated time (by type)
  const fastTypes = ["quiz", "other"];
  if (fastTypes.includes(task.type)) score += 3;

  return Math.min(15, score);
}

// ------- Start By Pressure -------
// If the task has an AI start_by_analysis, use its urgency zone
export function startByScore(task) {
  const zone = task.start_by_analysis?.urgency_zone;
  if (zone === "crunch") return 15;
  if (zone === "warning") return 8;
  if (zone === "overdue") return 20;
  // Fallback: estimate from deadline minus estimated prep
  if (!task.due_date) return 0;
  const days = differenceInDays(new Date(task.due_date), now());
  if (days <= 1) return 15;
  if (days <= 3) return 8;
  return 0;
}

// ------- Dependency Risk -------
// Tasks blocking other tasks or marked as blockers
export function dependencyScore(task, allTasks) {
  let score = 0;
  const taskName = task.name.toLowerCase();
  // Check if other tasks mention this task as a dependency
  const blockersCount = allTasks.filter(t =>
    t.id !== task.id &&
    !t.completed &&
    t.notes?.toLowerCase().includes(taskName)
  ).length;
  score += blockersCount * 4;

  // Link intelligence suggests waiting deps
  if (task.link_intelligence?.blockers?.length > 0) score += 5;
  return Math.min(10, score);
}

// ------- Avoidance / Procrastination Risk -------
// High cognitive load tasks that are also urgent = likely to be avoided
export function avoidanceRisk(task) {
  const cogLoad = estimateCognitiveLoad(task);
  const urgency = urgencyScore(task);
  // High load + high urgency = high avoidance risk
  if (cogLoad >= 7 && urgency >= 15) return 8;
  if (cogLoad >= 6 && urgency >= 10) return 5;
  if (cogLoad >= 8) return 4;
  return 0;
}

// ------- Time of Day Adjustment -------
// Morning: favor deep work. Afternoon: balanced. Evening: favor low-load tasks.
export function timeOfDayMultiplier(task) {
  const hour = now().getHours();
  const cogLoad = estimateCognitiveLoad(task);

  if (hour >= 9 && hour < 13) {
    // Peak morning: boost deep work
    return cogLoad >= 6 ? 1.15 : 1.0;
  }
  if (hour >= 13 && hour < 18) {
    // Afternoon: neutral
    return 1.0;
  }
  // Evening/night: favor easy tasks
  return cogLoad <= 4 ? 1.1 : 0.85;
}

// ------- MASTER SCORE -------
export function computePriorityScore(task, allTasks, energyLevel = 5) {
  if (task.completed) return -1;

  const urgency = urgencyScore(task);
  const impact = impactScore(task);
  const momentum = momentumScore(task);
  const startBy = startByScore(task);
  const deps = dependencyScore(task, allTasks);
  const avoidance = avoidanceRisk(task);
  const cogLoad = estimateCognitiveLoad(task);
  const todMult = timeOfDayMultiplier(task);

  // Energy adjustment: low energy = boost easy tasks, penalize heavy ones
  // This is the PRIMARY driver of task re-ranking based on energy
  let energyMod = 0;
  const energyFactor = (energyLevel - 5) / 5; // -0.8 at level 1, 0 at level 5, +1 at level 10
  
  // Low energy strongly penalizes high-load tasks, boosts low-load
  // High energy boosts high-load tasks (deep work opportunity)
  energyMod = (1 - energyFactor) * (5 - cogLoad) * 2;
  
  // Additional boost/penalty at extremes
  if (energyLevel <= 2) {
    energyMod += cogLoad <= 3 ? 15 : cogLoad >= 7 ? -15 : 0;
  }
  if (energyLevel >= 9) {
    energyMod += cogLoad >= 6 ? 12 : -6;
  }

  const rawScore =
    urgency * 1.0 +
    impact * 0.8 +
    momentum * 0.7 +
    startBy * 0.9 +
    deps * 0.6 +
    avoidance * 0.5 +
    energyMod;

  return Math.round(rawScore * todMult);
}

// ------- TODAY ENGINE -------
// Returns { majors: Task[], quickWins: Task[], restorative: string, allScored: {task, score}[] }
export function buildTodayPlan(tasks, energyLevel = 5) {
  const pending = tasks.filter(t => !t.completed);
  if (pending.length === 0) return { majors: [], quickWins: [], restorative: null, allScored: [] };

  const scored = pending
    .map(t => ({ task: t, score: computePriorityScore(t, pending, energyLevel), cogLoad: estimateCognitiveLoad(t) }))
    .sort((a, b) => b.score - a.score);

  // Quick wins: low cognitive load tasks that still have decent score
  const quickWinCandidates = scored.filter(s => s.cogLoad <= 4 && s.score > 5);
  const quickWins = quickWinCandidates.slice(0, 2).map(s => s.task);

  // Majors: top scoring tasks that aren't already quick wins
  const quickWinIds = new Set(quickWins.map(t => t.id));
  const majorCandidates = scored.filter(s => !quickWinIds.has(s.task.id));
  const majors = majorCandidates.slice(0, 3).map(s => s.task);

  // Restorative recommendation based on current load
  const avgCogLoad = scored.slice(0, 5).reduce((sum, s) => sum + s.cogLoad, 0) / Math.min(scored.length, 5);
  let restorative = null;
  if (avgCogLoad >= 7) restorative = "Take a 10-min walk before starting — high cognitive load detected.";
  else if (energyLevel <= 3) restorative = "Try a 5-min breathing exercise to reduce activation resistance.";
  else if (pending.filter(t => t.due_date && differenceInDays(new Date(t.due_date), new Date()) < 0).length > 0) restorative = "Clear one overdue task first to reduce background anxiety.";
  else restorative = "Short movement break between tasks supports sustained focus.";

  return { majors, quickWins, restorative, allScored: scored };
}

// ------- INSIGHT LABELS -------
export function getInsightLabel(task, allTasks, energyLevel = 5) {
  const score = computePriorityScore(task, allTasks, energyLevel);
  const cogLoad = estimateCognitiveLoad(task);
  const urgency = urgencyScore(task);
  const days = task.due_date ? differenceInDays(new Date(task.due_date), new Date()) : null;

  if (days !== null && days < 0) return { label: "Overdue", color: "text-red-600 bg-red-50" };
  if (days === 0) return { label: "Due today", color: "text-red-600 bg-red-50" };
  if (task.start_by_analysis?.urgency_zone === "crunch") return { label: "Start by today", color: "text-amber-700 bg-amber-50" };
  if (cogLoad <= 3 && score >= 15) return { label: "Quick unblock", color: "text-emerald-700 bg-emerald-50" };
  if (cogLoad >= 8 && energyLevel <= 4) return { label: "Save for peak hours", color: "text-violet-700 bg-violet-50" };
  if (days !== null && days <= 2) return { label: "High urgency", color: "text-orange-700 bg-orange-50" };
  return null;
}
/**
 * Advanced Prioritization Engine — Multi-factor behavioral execution system
 * 
 * Architecture:
 * 1. Task Feature Extraction Layer
 * 2. Behavioral State Modeling Layer
 * 3. Dynamic Priority Scoring Layer
 * 4. Recommendation Engine Layer
 * 5. Adaptive Feedback Loop Layer
 * 6. ML Personalization Layer (future-ready)
 */

import { differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";

const now = () => new Date();

// ============================================================================
// CONFIGURATION — Configurable weights (future: learnable via ML)
// ============================================================================
export const SCORING_WEIGHTS = {
  urgency: 1.0,
  impact: 0.8,
  momentum: 0.7,
  startBy: 0.9,
  dependency: 0.6,
  completionProbability: 0.5,
  avoidance: 0.5,
  energyMismatch: 0.8,
  overload: 0.6,
  interruption: 0.4,
};

export const TASK_CATEGORIES = {
  academic: {
    cognitiveIntensity: "heavy",
    deepWorkRequired: true,
    examProximityWeight: 1.5,
  },
  communication: {
    cognitiveIntensity: "moderate",
    emotionalResistanceWeight: 1.3,
    responseDelayFactor: 0.8,
  },
  administrative: {
    cognitiveIntensity: "light",
    momentumBoost: 1.2,
  },
  restorative: {
    cognitiveIntensity: "light",
    burnoutReduction: 1.5,
  },
  career: {
    cognitiveIntensity: "moderate",
    longTermImpact: 1.4,
  },
  maintenance: {
    cognitiveIntensity: "light",
    urgencyDecay: 0.9,
  },
};

// ============================================================================
// LAYER 1: TASK FEATURE EXTRACTION
// ============================================================================

/**
 * Extract comprehensive features from task metadata
 */
export function extractTaskFeatures(task, allTasks = []) {
  const category = categorizeTask(task);
  const cognitiveLoad = estimateCognitiveLoad(task, category);
  const emotionalResistance = estimateEmotionalResistance(task, category);
  const urgency = calculateUrgencyScore(task);
  const impact = calculateImpactScore(task);
  const momentum = calculateMomentumValue(task, cognitiveLoad);
  const dependencyRisk = calculateDependencyRisk(task, allTasks);
  const completionProbability = estimateCompletionProbability(task, emotionalResistance, cognitiveLoad);
  const activationCost = calculateActivationCost(task, emotionalResistance);
  const interruptionRisk = estimateInterruptionRisk(task);
  const historicalAvoidance = calculateAvoidanceScore(task);

  return {
    id: task.id,
    category,
    cognitiveLoad,
    emotionalResistance,
    urgency,
    impact,
    momentum,
    dependencyRisk,
    completionProbability,
    activationCost,
    interruptionRisk,
    historicalAvoidance,
    startByPressure: calculateStartByPressure(task),
    burnoutContribution: estimateBurnoutContribution(task, cognitiveLoad),
  };
}

/**
 * Categorize task based on type and content
 */
export function categorizeTask(task) {
  const name = task.name.toLowerCase();
  
  // Communication tasks
  if (/email|contact|professor|advisor|department|financial|housing|follow.?up/i.test(name)) {
    return "communication";
  }
  
  // Restorative tasks
  if (/break|rest|walk|breathe|meditate|reset|recover/i.test(name)) {
    return "restorative";
  }
  
  // Administrative tasks
  if (/submit|upload|form|register|sign|confirm|check|verify|admin/i.test(name)) {
    return "administrative";
  }
  
  // Career tasks
  if (/internship|resume|cover|application|career|job|interview/i.test(name)) {
    return "career";
  }
  
  // Maintenance tasks
  if (/clean|organize|update|review|maintain|backup/i.test(name)) {
    return "maintenance";
  }
  
  // Default: academic
  return "academic";
}

/**
 * Estimate cognitive load (0-10 scale)
 */
export function estimateCognitiveLoad(task, category = "academic") {
  let load = 3; // baseline

  // Type-based load
  const highLoadTypes = ["exam", "paper", "project", "presentation", "thesis"];
  const moderateLoadTypes = ["homework", "lab", "reading"];
  const lowLoadTypes = ["quiz", "other", "administrative"];
  
  if (highLoadTypes.includes(task.type)) load += 4;
  else if (moderateLoadTypes.includes(task.type)) load += 2;
  else if (lowLoadTypes.includes(task.type)) load -= 1;

  // Category adjustments
  if (category === "communication") load += 1;
  if (category === "academic" && task.type === "exam") load += 2;

  // Keyword detection for emotional/cognitive resistance
  const hardWords = /reflection|analysis|essay|research|thesis|comprehensive|cumulative|design|proposal|critical|evaluate/i;
  const easyWords = /read|review|submit|upload|check|email|fill|sign|confirm|watch|listen/i;
  
  if (hardWords.test(task.name)) load += 2;
  if (easyWords.test(task.name)) load -= 2;

  // Priority and weight indicators
  if (task.priority === "high") load += 1;
  if (task.weight >= 30) load += 2;
  else if (task.weight >= 15) load += 1;

  // Critical path penalty
  if (task.critical_path) load += 1;

  return Math.max(0, Math.min(10, load));
}

/**
 * Estimate emotional resistance (0-10 scale)
 * Separate from cognitive load - a 5-min email can have high resistance
 */
export function estimateEmotionalResistance(task, category = "academic") {
  let resistance = 3; // baseline

  // Communication tasks often have high emotional resistance
  if (category === "communication") {
    resistance += 3;
    if (/difficult|confront|complaint|problem|issue/i.test(task.name)) {
      resistance += 2;
    }
  }

  // Ambiguity increases resistance
  const vagueWords = /figure|decide|plan|start|begin/i;
  if (vagueWords.test(task.name)) resistance += 2;

  // Past avoidance signals
  if (task.notes?.toLowerCase().includes("postpone") || 
      task.notes?.toLowerCase().includes("later")) {
    resistance += 2;
  }

  // High stakes = higher resistance
  if (task.weight >= 30) resistance += 1;
  if (task.critical_path) resistance += 2;

  // Overdue tasks accumulate resistance
  if (task.due_date) {
    const daysOverdue = differenceInDays(now(), new Date(task.due_date));
    if (daysOverdue > 0) {
      resistance += Math.min(3, Math.floor(daysOverdue / 2));
    }
  }

  return Math.max(0, Math.min(10, resistance));
}

/**
 * Calculate urgency score (0-30 scale)
 */
export function calculateUrgencyScore(task) {
  if (!task.due_date) return 5;
  
  const days = differenceInDays(new Date(task.due_date), now());
  const hours = differenceInHours(new Date(task.due_date), now());
  
  // Critical: overdue
  if (days < 0) return 30;
  
  // Due today
  if (days === 0) {
    if (hours <= 2) return 30;  // Next 2 hours
    if (hours <= 6) return 28;  // Next 6 hours
    return 26;
  }
  
  // Next 1-3 days
  if (days === 1) return 24;
  if (days === 2) return 20;
  if (days === 3) return 18;
  
  // Week range
  if (days <= 7) return 12;
  if (days <= 14) return 6;
  
  return 2;
}

/**
 * Calculate impact score (0-55 scale)
 */
export function calculateImpactScore(task) {
  let score = 5; // baseline

  // Grade weight impact
  if (task.weight >= 40) score += 15;
  else if (task.weight >= 25) score += 10;
  else if (task.weight >= 15) score += 7;
  else if (task.weight >= 10) score += 4;

  // Type impact
  if (task.type === "exam") score += 8;
  if (task.type === "paper" || task.type === "project") score += 5;
  if (task.type === "presentation") score += 4;

  // Priority impact
  if (task.priority === "high") score += 4;
  if (task.priority === "low") score -= 3;

  // Critical path: massive boost (blocks future progress)
  if (task.critical_path) score += 35;

  // Long-term career impact
  if (/internship|application|resume/i.test(task.name)) score += 8;

  return Math.min(55, score);
}

/**
 * Calculate momentum value (0-15 scale)
 * Quick wins that build positive momentum
 */
export function calculateMomentumValue(task, cognitiveLoad) {
  let score = 0;

  // Low activation energy = high momentum
  if (cognitiveLoad <= 3) score += 10;
  else if (cognitiveLoad <= 5) score += 5;
  else score += 1;

  // Quick administrative tasks
  if (/email|contact|submit|upload|confirm|sign|fill|check|review/i.test(task.name)) {
    score += 5;
  }

  // Fast task types
  const fastTypes = ["quiz", "other", "administrative"];
  if (fastTypes.includes(task.type) || fastTypes.includes(task.category)) {
    score += 3;
  }

  return Math.min(15, score);
}

/**
 * Calculate dependency risk (0-10 scale)
 */
export function calculateDependencyRisk(task, allTasks) {
  let score = 0;
  const taskName = task.name.toLowerCase();

  // Check if other tasks depend on this one
  const dependentTasks = allTasks.filter(t =>
    t.id !== task.id &&
    !t.completed &&
    (t.notes?.toLowerCase().includes(taskName) ||
     t.description?.toLowerCase().includes(taskName))
  ).length;

  score += dependentTasks * 4;

  // Link intelligence blockers
  if (task.link_intelligence?.blockers?.length > 0) {
    score += 5;
  }

  // Waiting state detection
  if (task.status === "waiting" || task.status === "pending_review") {
    score += 3;
  }

  return Math.min(10, score);
}

/**
 * Estimate completion probability (0-1 scale)
 */
export function estimateCompletionProbability(task, emotionalResistance, cognitiveLoad) {
  let probability = 0.7; // baseline

  // High resistance reduces probability
  if (emotionalResistance >= 7) probability -= 0.3;
  else if (emotionalResistance >= 5) probability -= 0.15;

  // High cognitive load reduces probability
  if (cognitiveLoad >= 8) probability -= 0.2;
  else if (cognitiveLoad >= 6) probability -= 0.1;

  // Overdue tasks have lower probability
  if (task.due_date && differenceInDays(now(), new Date(task.due_date)) > 0) {
    probability -= 0.15;
  }

  // Historical avoidance
  if (task.historical_avoidance_score) {
    probability -= task.historical_avoidance_score * 0.3;
  }

  return Math.max(0.1, Math.min(0.95, probability));
}

/**
 * Calculate activation cost (0-10 scale)
 * How hard is it to START the task (separate from completion)
 */
export function calculateActivationCost(task, emotionalResistance) {
  let cost = emotionalResistance * 0.7;

  // Ambiguous tasks have higher activation cost
  if (/decide|figure|plan|start/i.test(task.name)) {
    cost += 2;
  }

  // Missing information
  if (task.notes?.toLowerCase().includes("need") ||
      task.notes?.toLowerCase().includes("missing")) {
    cost += 2;
  }

  return Math.max(0, Math.min(10, cost));
}

/**
 * Estimate interruption risk (0-10 scale)
 */
export function estimateInterruptionRisk(task) {
  let risk = 3; // baseline

  // Long tasks have higher interruption risk
  if (task.estimated_duration && task.estimated_duration > 90) {
    risk += 3;
  }

  // Complex tasks
  if (task.estimated_steps && task.estimated_steps > 5) {
    risk += 2;
  }

  // Communication tasks (waiting for responses)
  if (/email|contact|follow.?up/i.test(task.name)) {
    risk += 2;
  }

  return Math.max(0, Math.min(10, risk));
}

/**
 * Calculate historical avoidance score (0-1 scale)
 */
export function calculateAvoidanceScore(task) {
  // This would be populated from behavioral telemetry
  // For now, estimate based on task characteristics
  let score = 0;

  const cogLoad = estimateCognitiveLoad(task);
  const urgency = calculateUrgencyScore(task);

  // High load + high urgency = likely avoidance
  if (cogLoad >= 7 && urgency >= 15) score = 0.8;
  else if (cogLoad >= 6 && urgency >= 10) score = 0.5;
  else if (cogLoad >= 8) score = 0.4;

  return score;
}

/**
 * Calculate start-by pressure (0-20 scale)
 */
export function calculateStartByPressure(task) {
  const zone = task.start_by_analysis?.urgency_zone;
  if (zone === "crunch") return 20;
  if (zone === "warning") return 12;
  if (zone === "overdue") return 25;

  // Fallback calculation
  if (!task.due_date) return 0;
  
  const days = differenceInDays(new Date(task.due_date), now());
  const estimatedPrepDays = 3; // Default prep time
  
  if (days <= estimatedPrepDays) return 15;
  if (days <= estimatedPrepDays + 2) return 8;
  
  return 0;
}

/**
 * Estimate burnout contribution (0-10 scale)
 */
export function estimateBurnoutContribution(task, cognitiveLoad) {
  let burnout = cognitiveLoad * 0.6;

  // High pressure tasks
  if (task.priority === "high" && task.due_date) {
    const days = differenceInDays(new Date(task.due_date), now());
    if (days <= 2) burnout += 2;
  }

  // Critical path stress
  if (task.critical_path) burnout += 2;

  return Math.max(0, Math.min(10, burnout));
}

// ============================================================================
// LAYER 2: BEHAVIORAL STATE MODELING
// ============================================================================

/**
 * Build current user state model
 */
export function buildUserState(energyLevel = 5, tasks = []) {
  const hour = now().getHours();
  
  // Time-based factors
  let focusQuality = 5;
  if (hour >= 9 && hour < 12) focusQuality = 8;  // Peak morning
  else if (hour >= 14 && hour < 17) focusQuality = 6;  // Afternoon
  else if (hour >= 20) focusQuality = 3;  // Evening
  
  // Calculate overload from pending high-load tasks
  const pending = tasks.filter(t => !t.completed);
  const highLoadCount = pending.filter(t => estimateCognitiveLoad(t) >= 7).length;
  const overloadScore = Math.min(10, highLoadCount * 2);

  // Calculate momentum from recent completions (would use telemetry in production)
  const momentumScore = energyLevel * 0.8;

  // Burnout risk
  const avgCogLoad = pending.length > 0
    ? pending.reduce((sum, t) => sum + estimateCognitiveLoad(t), 0) / pending.length
    : 0;
  const burnoutRisk = avgCogLoad * 0.7 + (overloadScore * 0.3);

  return {
    energyLevel,
    cognitiveCapacity: Math.max(1, 10 - overloadScore),
    burnoutRisk: Math.min(10, burnoutRisk),
    focusQuality,
    currentOverloadScore: overloadScore,
    momentumScore,
    stressLevel: overloadScore * 0.6 + (burnoutRisk * 0.4),
    timeOfDay: hour,
    isPeakHours: hour >= 9 && hour < 13,
  };
}

// ============================================================================
// LAYER 3: DYNAMIC PRIORITY SCORING
// ============================================================================

/**
 * Compute comprehensive priority score
 */
export function computePriorityScore(task, allTasks, userState) {
  if (task.completed) return -1;

  const features = extractTaskFeatures(task, allTasks);
  
  const {
    urgency,
    impact,
    momentum,
    startByPressure,
    dependencyRisk,
    completionProbability,
    emotionalResistance,
    cognitiveLoad,
    activationCost,
  } = features;

  const {
    energyLevel,
    cognitiveCapacity,
    currentOverloadScore,
    isPeakHours,
  } = userState;

  // Base weighted score
  let rawScore =
    SCORING_WEIGHTS.urgency * urgency +
    SCORING_WEIGHTS.impact * impact +
    SCORING_WEIGHTS.momentum * momentum +
    SCORING_WEIGHTS.startBy * startByPressure +
    SCORING_WEIGHTS.dependency * dependencyRisk +
    SCORING_WEIGHTS.completionProbability * (completionProbability * 30) +
    SCORING_WEIGHTS.avoidance * (features.historicalAvoidance * 20);

  // Energy mismatch penalty
  const energyMismatch = Math.abs(energyLevel - (10 - cognitiveLoad));
  rawScore -= SCORING_WEIGHTS.energyMismatch * energyMismatch * 2;

  // Overload penalty
  rawScore -= SCORING_WEIGHTS.overload * currentOverloadScore * 1.5;

  // Activation cost penalty (high friction = lower priority)
  rawScore -= activationCost * 1.2;

  // Time-of-day adjustment
  if (isPeakHours && cognitiveLoad >= 7) {
    rawScore *= 1.15;  // Boost deep work during peak hours
  } else if (!isPeakHours && cognitiveLoad >= 8) {
    rawScore *= 0.85;  // Penalize heavy tasks off-peak
  }

  // Critical path override
  if (task.critical_path) {
    rawScore = Math.max(rawScore, 150);  // Ensure critical tasks are top priority
  }

  return Math.round(rawScore);
}

// ============================================================================
// LAYER 4: RECOMMENDATION ENGINE
// ============================================================================

/**
 * Generate adaptive daily plan
 */
export function buildAdaptivePlan(tasks, userState) {
  const pending = tasks.filter(t => !t.completed);
  
  if (pending.length === 0) {
    return {
      majors: [],
      quickWins: [],
      restorative: "You're all caught up! Consider restorative activities or getting ahead.",
      allScored: [],
      cognitiveLoadBalance: "optimal",
    };
  }

  // Score all tasks
  const scored = pending.map(task => ({
    task,
    score: computePriorityScore(task, pending, userState),
    features: extractTaskFeatures(task, pending),
  })).sort((a, b) => b.score - a.score);

  // Select quick wins (low cognitive load, decent score)
  const quickWinCandidates = scored.filter(s => 
    s.features.cognitiveLoad <= 4 && s.score > 10
  );
  const quickWins = quickWinCandidates.slice(0, 2).map(s => s.task);

  // Select major tasks (high impact, not already quick wins)
  const quickWinIds = new Set(quickWins.map(t => t.id));
  const majorCandidates = scored.filter(s => 
    !quickWinIds.has(s.task.id) && s.features.cognitiveLoad >= 5
  );
  const majors = majorCandidates.slice(0, 3).map(s => s.task);

  // Cognitive load balancing
  const majorLoads = majors.map(t => extractTaskFeatures(t).cognitiveLoad);
  const avgLoad = majorLoads.length > 0 ? majorLoads.reduce((a, b) => a + b, 0) / majorLoads.length : 0;
  
  let cognitiveLoadBalance = "optimal";
  if (avgLoad >= 8) cognitiveLoadBalance = "heavy";
  else if (avgLoad <= 4) cognitiveLoadBalance = "light";

  // Restorative recommendation
  let restorative = null;
  if (userState.burnoutRisk >= 7) {
    restorative = "High burnout risk detected. Take a 15-min restorative break before starting.";
  } else if (userState.energyLevel <= 3) {
    restorative = "Low energy detected. Start with a quick win to build momentum.";
  } else if (avgLoad >= 7) {
    restorative = "High cognitive load ahead. Schedule a 10-min movement break between tasks.";
  } else if (pending.some(t => t.due_date && differenceInDays(new Date(t.due_date), now()) < 0)) {
    restorative = "Clear one overdue task first to reduce background anxiety.";
  }

  return {
    majors,
    quickWins,
    restorative,
    allScored: scored,
    cognitiveLoadBalance,
    userState,
  };
}

// ============================================================================
// LAYER 5: ADAPTIVE FEEDBACK LOOP (Future ML Integration Points)
// ============================================================================

/**
 * Record task completion telemetry for future learning
 */
export function recordCompletionTelemetry(task, completionData) {
  // This would persist to database in production
  // For now, just structure the data for future ML
  return {
    taskId: task.id,
    completedAt: now().toISOString(),
    energyLevelAtStart: completionData.energyLevel,
    timeToComplete: completionData.durationMinutes,
    interruptions: completionData.interruptions || 0,
    pauses: completionData.pauses || 0,
    wasAvoided: completionData.wasAvoided || false,
    difficultyRating: completionData.difficultyRating,
    emotionalStateBefore: completionData.emotionalStateBefore,
    emotionalStateAfter: completionData.emotionalStateAfter,
  };
}

/**
 * Generate insight labels for UI
 */
export function getAdaptiveInsightLabel(task, userState) {
  const features = extractTaskFeatures(task);
  const days = task.due_date ? differenceInDays(new Date(task.due_date), now()) : null;

  if (days !== null && days < 0) {
    return { label: "Overdue", color: "text-red-600 bg-red-50", priority: "critical" };
  }
  
  if (days === 0) {
    return { label: "Due today", color: "text-red-600 bg-red-50", priority: "urgent" };
  }
  
  if (task.critical_path) {
    return { label: "Critical path", color: "text-red-600 bg-red-50", priority: "critical" };
  }
  
  if (features.startByPressure >= 15) {
    return { label: "Start by today", color: "text-amber-700 bg-amber-50", priority: "high" };
  }
  
  if (features.cognitiveLoad <= 3 && features.momentum >= 10) {
    return { label: "Quick win", color: "text-emerald-700 bg-emerald-50", priority: "medium" };
  }
  
  if (features.cognitiveLoad >= 8 && userState.energyLevel <= 4) {
    return { label: "Save for peak hours", color: "text-violet-700 bg-violet-50", priority: "low" };
  }
  
  if (features.emotionalResistance >= 7) {
    return { label: "High resistance", color: "text-orange-700 bg-orange-50", priority: "medium" };
  }
  
  return null;
}

/**
 * Blocker classification for diagnostic UI
 */
export function classifyBlocker(task) {
  const features = extractTaskFeatures(task);
  
  if (features.activationCost >= 7) {
    return {
      type: "high_activation_cost",
      label: "Hard to start",
      suggestion: "Break into smaller first step",
      icon: "🚧",
    };
  }
  
  if (features.emotionalResistance >= 7) {
    return {
      type: "emotional_resistance",
      label: "Emotional friction",
      suggestion: "Acknowledge discomfort, start with 2-minute version",
      icon: "😰",
    };
  }
  
  if (features.cognitiveLoad >= 8) {
    return {
      type: "cognitive_overload",
      label: "Mentally demanding",
      suggestion: "Schedule for peak energy hours",
      icon: "🧠",
    };
  }
  
  if (features.dependencyRisk >= 5) {
    return {
      type: "dependency_blocked",
      label: "Waiting on something",
      suggestion: "Identify and address the blocker",
      icon: "⏸️",
    };
  }
  
  if (features.urgency >= 20 && features.completionProbability < 0.5) {
    return {
      type: "avoidance_cycle",
      label: "Avoidance pattern",
      suggestion: "Do just 2 minutes — momentum will carry you",
      icon: "🔄",
    };
  }
  
  return {
    type: "unknown",
    label: "Unclear blockers",
    suggestion: "Break down the task or clarify requirements",
    icon: "❓",
  };
}

/**
 * Calculate optimal task sequencing
 */
export function sequenceTasks(tasks, userState) {
  const scored = tasks
    .filter(t => !t.completed)
    .map(t => ({
      task: t,
      score: computePriorityScore(t, tasks, userState),
      features: extractTaskFeatures(t),
    }))
    .sort((a, b) => b.score - a.score);

  const sequence = [];
  let currentLoad = 0;

  for (const item of scored) {
    // Avoid stacking heavy tasks
    if (item.features.cognitiveLoad >= 7 && currentLoad >= 15) {
      continue; // Skip for now, will add later
    }

    sequence.push(item.task);
    currentLoad += item.features.cognitiveLoad;

    // Reset load after quick wins
    if (item.features.cognitiveLoad <= 3) {
      currentLoad = Math.max(0, currentLoad - 3);
    }
  }

  return sequence;
}

/**
 * Predict burnout risk over next N days
 */
export function predictBurnoutRisk(tasks, daysAhead = 3) {
  const pending = tasks.filter(t => !t.completed);
  const futureDeadlines = pending.filter(t => {
    if (!t.due_date) return false;
    const taskDate = new Date(t.due_date);
    const future = new Date();
    future.setDate(future.getDate() + daysAhead);
    return taskDate <= future;
  });

  const highLoadCount = futureDeadlines.filter(t => estimateCognitiveLoad(t) >= 7).length;
  const criticalCount = futureDeadlines.filter(t => t.critical_path).length;

  let risk = highLoadCount * 1.5 + criticalCount * 3;

  // Time compression factor
  if (futureDeadlines.length > 5) {
    risk *= 1.3;
  }

  return Math.min(10, risk);
}

/**
 * Suggest optimal focus windows based on task load and circadian rhythms
 */
export function suggestFocusWindows(tasks, userState) {
  const hour = userState.timeOfDay || now().getHours();
  const pending = tasks.filter(t => !t.completed);
  const highPriority = pending.filter(t => computePriorityScore(t, pending, userState) > 50);

  const windows = [];

  // Morning deep work (9-12)
  if (hour < 12) {
    const deepWorkTasks = highPriority.filter(t => estimateCognitiveLoad(t) >= 6);
    if (deepWorkTasks.length > 0) {
      windows.push({
        period: "Morning (now - 12pm)",
        type: "deep_work",
        tasks: deepWorkTasks.slice(0, 2),
        recommendation: "Tackle cognitively demanding tasks now while fresh",
      });
    }
  }

  // Afternoon moderate work (13-17)
  if (hour >= 13 && hour < 17) {
    const moderateTasks = highPriority.filter(t => {
      const load = estimateCognitiveLoad(t);
      return load >= 4 && load <= 6;
    });
    if (moderateTasks.length > 0) {
      windows.push({
        period: "Afternoon (1pm - 5pm)",
        type: "moderate_work",
        tasks: moderateTasks.slice(0, 2),
        recommendation: "Good time for steady progress on medium-difficulty tasks",
      });
    }
  }

  // Evening wrap-up (after 17)
  const lightTasks = highPriority.filter(t => estimateCognitiveLoad(t) <= 4);
  if (lightTasks.length > 0 && (hour >= 17 || hour < 9)) {
    windows.push({
      period: hour >= 17 ? "Evening (after 5pm)" : "Early morning (before 9am)",
      type: "light_work",
      tasks: lightTasks.slice(0, 3),
      recommendation: "Use lower-energy hours for quick wins and admin tasks",
    });
  }

  return windows;
}

/**
 * ML-ready feature vector for future personalization
 */
export function extractMLFeatures(task, userState, completionHistory = []) {
  const features = extractTaskFeatures(task);
  
  return {
    // Task features
    cognitiveLoad: features.cognitiveLoad,
    emotionalResistance: features.emotionalResistance,
    urgency: features.urgency,
    impact: features.impact,
    momentum: features.momentum,
    activationCost: features.activationCost,
    
    // User state features
    energyLevel: userState.energyLevel,
    burnoutRisk: userState.burnoutRisk,
    isPeakHours: userState.isPeakHours ? 1 : 0,
    
    // Historical features (would populate from DB)
    historicalCompletionRate: completionHistory.length > 0
      ? completionHistory.filter(c => c.completed).length / completionHistory.length
      : 0.5,
    
    // Temporal features
    dayOfWeek: now().getDay(),
    hourOfDay: now().getHours(),
    
    // Target variable (for training)
    willComplete: null, // To be filled after outcome
  };
}
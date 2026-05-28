# Advanced Prioritization Engine — Technical Documentation

## Overview

The Advanced Prioritization Engine is a multi-factor behavioral execution system designed to intelligently balance urgency, cognition, emotion, energy, momentum, stress, and human limitations. It functions as an adaptive executive-functioning recommendation system—not a static deadline sorter.

---

## Architecture Layers

### 1. Task Feature Extraction Layer

**Purpose**: Extract comprehensive metadata from raw task data.

**Key Functions**:
- `extractTaskFeatures(task, allTasks)` — Master feature extraction
- `categorizeTask(task)` — Classify into: academic, communication, administrative, restorative, career, maintenance
- `estimateCognitiveLoad(task, category)` — 0-10 scale cognitive intensity
- `estimateEmotionalResistance(task, category)` — 0-10 emotional activation cost
- `calculateUrgencyScore(task)` — 0-30 deadline pressure
- `calculateImpactScore(task)` — 0-55 consequence magnitude
- `calculateMomentumValue(task, cognitiveLoad)` — 0-15 quick-win potential
- `calculateDependencyRisk(task, allTasks)` — 0-10 blocker detection
- `estimateCompletionProbability(task, emotionalResistance, cognitiveLoad)` — 0-1 likelihood
- `calculateActivationCost(task, emotionalResistance)` — 0-10 start friction
- `estimateInterruptionRisk(task)` — 0-10 disruption likelihood
- `calculateAvoidanceScore(task)` — 0-1 historical avoidance pattern
- `calculateStartByPressure(task)` — 0-20 recommended start urgency
- `estimateBurnoutContribution(task, cognitiveLoad)` — 0-10 stress accumulation

**Task Categories**:
Each category has different prioritization behavior:
- **academic**: Heavy cognitive load, deep work required, exam proximity weighting
- **communication**: Moderate load, high emotional resistance, response delay factors
- **administrative**: Light load, momentum boost
- **restorative**: Light load, burnout reduction
- **career**: Moderate load, long-term impact
- **maintenance**: Light load, urgency decay

---

### 2. Behavioral State Modeling Layer

**Purpose**: Continuously update user state model for adaptive recommendations.

**User State Variables**:
```javascript
{
  energyLevel: 1-10,
  cognitiveCapacity: 1-10 (inverse of overload),
  burnoutRisk: 0-10,
  focusQuality: 0-10 (time-of-day based),
  currentOverloadScore: 0-10,
  momentumScore: 0-10,
  stressLevel: 0-10,
  timeOfDay: 0-23,
  isPeakHours: boolean (9am-12pm = peak)
}
```

**Key Functions**:
- `buildUserState(energyLevel, tasks)` — Build comprehensive state model
- Time-based focus quality adjustment (peak morning, afternoon dip, evening decline)
- Overload calculation from pending high-load tasks
- Momentum estimation from energy level

---

### 3. Dynamic Priority Scoring Layer

**Purpose**: Compute weighted multi-factor priority scores.

**Scoring Formula**:
```javascript
priority_score =
  (urgency_weight × urgency_score) +
  (impact_weight × impact_score) +
  (momentum_weight × momentum_value) +
  (dependency_weight × dependency_risk) +
  (startBy_weight × startBy_pressure) +
  (completionProbability_weight × completion_probability × 30) -
  (energyMismatch_weight × |energyLevel - (10 - cognitiveLoad)| × 2) -
  (overload_weight × currentOverload × 1.5) -
  (activationCost × 1.2)
```

**Configurable Weights** (future: learnable via ML):
```javascript
SCORING_WEIGHTS = {
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
}
```

**Adjustments**:
- **Time-of-day multiplier**: Boost deep work during peak hours (9am-12pm)
- **Critical path override**: Ensure critical tasks score ≥150
- **Energy mismatch penalty**: Penalize high-load tasks when energy is low

**Key Functions**:
- `computePriorityScore(task, allTasks, userState)` — Master scoring function

---

### 4. Recommendation Engine Layer

**Purpose**: Generate adaptive daily plans optimized for behavioral follow-through.

**Output Structure**:
```javascript
{
  majors: Task[],        // Top 3 high-impact tasks
  quickWins: Task[],     // 1-2 low-load momentum builders
  restorative: string,   // Personalized recovery suggestion
  allScored: ScoredTask[], // All tasks with scores
  cognitiveLoadBalance: "light" | "optimal" | "heavy",
  userState: UserState
}
```

**Selection Logic**:
- **Quick Wins**: Cognitive load ≤4, score >10
- **Majors**: High impact, cognitive load ≥5, not already quick wins
- **Cognitive Load Balancing**: Avoid stacking 3+ heavy tasks consecutively

**Key Functions**:
- `buildAdaptivePlan(tasks, userState)` — Generate comprehensive daily plan
- `getAdaptiveInsightLabel(task, userState)` — UI insight badges
- `classifyBlocker(task)` — Blocker type detection for diagnostic UI

**Blocker Types**:
- `high_activation_cost` — Hard to start
- `emotional_resistance` — Emotional friction
- `cognitive_overload` — Mentally demanding
- `dependency_blocked` — Waiting on something
- `avoidance_cycle` — Procrastination pattern

---

### 5. Adaptive Feedback Loop Layer

**Purpose**: Track behavioral telemetry for continuous recalibration.

**Telemetry Data Structure**:
```javascript
{
  taskId: string,
  completedAt: ISO8601,
  energyLevelAtStart: 1-10,
  timeToComplete: minutes,
  interruptions: count,
  pauses: count,
  wasAvoided: boolean,
  difficultyRating: 1-10,
  emotionalStateBefore: string,
  emotionalStateAfter: string
}
```

**Key Functions**:
- `recordCompletionTelemetry(task, completionData)` — Log completion events

**Future Use**:
- Recalibrate resistance scoring based on actual completion patterns
- Adjust energy mismatch weights per user
- Learn optimal task sequencing per individual

---

### 6. ML Personalization Layer (Future-Ready)

**Purpose**: Prepare architecture for machine learning integration.

**Potential Models**:
1. **Task Completion Probability Prediction**
   - Algorithm: XGBoost / Random Forest
   - Features: 20+ extracted features + historical data
   - Target: Binary completion (yes/no)

2. **Burnout Prediction**
   - Algorithm: Logistic Regression / LSTM
   - Features: Task load, energy trends, sleep estimates
   - Target: Burnout risk score (0-10)

3. **Optimal Task Sequencing**
   - Algorithm: Reinforcement Learning / Contextual Bandits
   - Reward: Completion rate × user satisfaction
   - State: Current task queue + user state

4. **Personalized Weight Learning**
   - Algorithm: Bayesian Optimization
   - Tune: SCORING_WEIGHTS per user
   - Objective: Maximize follow-through probability

**Key Functions**:
- `extractMLFeatures(task, userState, completionHistory)` — Feature vector for ML
- `predictBurnoutRisk(tasks, daysAhead)` — Short-term burnout forecast
- `suggestFocusWindows(tasks, userState)` — Optimal scheduling
- `sequenceTasks(tasks, userState)` — Cognitively-balanced ordering

---

## Integration with AI (LLM)

The engine uses LLM integration for:
1. **Final ranking override**: AI reviews heuristic scores and adjusts based on nuanced factors
2. **Reasoning generation**: Explain prioritization strategy in natural language
3. **Contextual insights**: Personalized recommendations based on user state

**LLM Prompt Structure**:
- Input: Task features + user state + cognitive load balance
- Output: JSON with ranked task IDs + reasoning + restorative suggestion

**Fallback**: If LLM fails, engine falls back to heuristic-based planning.

---

## Usage Examples

### Basic Planning
```javascript
import { buildAdaptivePlan, buildUserState } from "@/lib/advancedPriorityEngine";

const userState = buildUserState(energyLevel, assignments);
const plan = buildAdaptivePlan(assignments, userState);

// plan.majors → Top 3 tasks
// plan.quickWins → Momentum builders
// plan.restorative → Recovery suggestion
```

### Blocker Detection
```javascript
import { classifyBlocker } from "@/lib/advancedPriorityEngine";

const blocker = classifyBlocker(task);
// blocker.type, blocker.label, blocker.suggestion
```

### Focus Window Suggestions
```javascript
import { suggestFocusWindows } from "@/lib/advancedPriorityEngine";

const windows = suggestFocusWindows(tasks, userState);
// windows[].period, windows[].type, windows[].tasks
```

### Burnout Prediction
```javascript
import { predictBurnoutRisk } from "@/lib/advancedPriorityEngine";

const risk = predictBurnoutRisk(assignments, 3); // Next 3 days
// risk: 0-10 scale
```

---

## Performance Characteristics

- **Time Complexity**: O(n log n) for planning (sorting dominates)
- **Space Complexity**: O(n) for feature storage
- **LLM Calls**: 1 per plan generation (async, non-blocking)
- **Fallback**: Heuristic-only mode if LLM unavailable

---

## Extensibility Points

1. **Custom Task Categories**: Add to `TASK_CATEGORIES` config
2. **New Scoring Factors**: Add to `SCORING_WEIGHTS` and `computePriorityScore`
3. **ML Integration**: Replace heuristic weights with learned model
4. **Telemetry Persistence**: Connect `recordCompletionTelemetry` to database
5. **Custom Blocker Types**: Extend `classifyBlocker` function

---

## Design Philosophy

The engine optimizes for **behavioral follow-through probability**, not raw productivity volume. It recognizes that:
- Low energy ≠ laziness (requires adaptive task matching)
- High cognitive load tasks need peak hours
- Emotional resistance is real and must be accommodated
- Momentum matters more than perfection
- Rest prevents burnout and improves long-term output

The system should feel **predictive, intelligent, and behaviorally aware**—not like a static productivity app.
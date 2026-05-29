export function getMidSemesterSteps(courses = []) {
  return [
    {
      title: "Academic Reflection — Mid-Semester 🎯",
      subtitle: "We're halfway through. Let's take stock.",
      questions: [
        { id: "courses_going_well", type: "textarea", label: "Which courses are going well?", placeholder: "What's working in these courses?" },
        { id: "courses_struggling", type: "textarea", label: "Which courses are struggling?", placeholder: "Be specific — what's making them difficult?" },
        { id: "hardest_assignments", type: "textarea", label: "Which assignments have been hardest?", placeholder: "Types, specific ones, patterns you've noticed…" },
        { id: "proudest_accomplishment", type: "textarea", label: "What academic accomplishment are you most proud of so far?", placeholder: "Even small wins count." },
      ],
    },
    {
      title: "Per-Course Mid-Point Check",
      subtitle: "A quick check-in for each of your courses.",
      perCourse: [
        { id: "mid_status", type: "select", label: "Current status", options: ["Going great", "On track", "Slightly behind", "Struggling", "In trouble"] },
        { id: "mid_grade_estimate", type: "select", label: "Estimated current grade", options: ["A", "B", "C", "D", "Not sure"] },
        { id: "mid_notes", type: "textarea", label: "What's one thing to change for this course?", placeholder: "Specific action…" },
      ],
    },
    {
      title: "Learning & Study Methods",
      subtitle: "What's producing results — and what should stop?",
      questions: [
        { id: "effective_study_methods", type: "multiselect", label: "Study methods producing real results", options: ["Active recall", "Practice problems", "Flashcards", "Explaining concepts aloud", "Office hours", "Study groups", "Summarizing in own words", "Past exams", "Tutoring"] },
        { id: "ineffective_study_methods", type: "multiselect", label: "Study methods to stop using", options: ["Passive re-reading", "Highlighting only", "Cramming the night before", "Multitasking", "Skimming without engaging", "Watching videos without notes"] },
        { id: "remaining_difficult_concepts", type: "textarea", label: "What concepts still feel difficult?", placeholder: "Topics across any courses that aren't clicking…" },
      ],
    },
    {
      title: "Time Management",
      subtitle: "How are you managing your time at the midpoint?",
      questions: [
        { id: "time_status", type: "select", label: "Do you feel ahead, on track, or behind?", options: ["Ahead — feeling good", "On track", "Slightly behind", "Behind in several areas", "Significantly behind"] },
        { id: "time_more_than_expected", type: "textarea", label: "What is taking more time than expected?", placeholder: "Specific courses, projects, activities…" },
        { id: "time_delay_causes", type: "multiselect", label: "What is causing the most delays?", options: ["Difficulty of content", "Unclear instructions", "Procrastination", "Perfectionism", "Lack of time", "Unexpected events", "Poor estimation", "Too many competing priorities"] },
      ],
    },
    {
      title: "Focus & ADHD Reflection",
      subtitle: "Let's understand your attention patterns at the mid-point.",
      questions: [
        { id: "mid_start_difficulty", type: "multiselect", label: "What makes starting work difficult?", options: ["Overwhelm", "Boredom", "Unclear task", "Perfectionism", "Fatigue", "Emotional state", "Distractions", "Task too big"] },
        { id: "mid_harmful_distractions", type: "multiselect", label: "What distractions are most harmful?", options: ["Phone", "Social media", "YouTube", "Games", "People", "Noise", "My own thoughts", "Hunger"] },
        { id: "mid_helpful_environments", type: "multiselect", label: "Which environments help you focus best?", options: ["Library", "Home (alone)", "Café", "Study room", "Outdoors", "Classroom after hours", "With music", "With silence"] },
        { id: "mid_productive_habits", type: "multiselect", label: "Which habits have improved your productivity?", options: ["Pomodoro", "To-do lists", "Weekly planning", "Time blocking", "Phone-free sessions", "Morning routine", "Exercise", "Consistent sleep"] },
      ],
    },
    {
      title: "Well-Being at Mid-Semester",
      subtitle: "Your mental and physical health shapes your academic success.",
      questions: [
        { id: "mid_stress", type: "scale", label: "Current stress level", max: 10, scaleLabels: ["Very low", "Extremely high"] },
        { id: "mid_burnout", type: "scale", label: "Burnout level", max: 10, scaleLabels: ["None", "Completely burned out"] },
        { id: "mid_sleep_quality", type: "select", label: "Sleep quality", options: ["Excellent", "Good", "Fair", "Poor", "Very poor"] },
        { id: "mid_social_balance", type: "select", label: "Social balance", options: ["Great — healthy social life", "Decent — some connection", "Isolated — not enough", "Overstretched — too much"] },
        { id: "mid_wellbeing_notes", type: "textarea", label: "What's affecting your well-being most right now?", placeholder: "Stress sources, support systems, what you need…" },
      ],
    },
  ];
}
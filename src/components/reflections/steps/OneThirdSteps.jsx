export function getOneThirdSteps(courses = []) {
  return [
    {
      title: "Academic Check-In 📚",
      subtitle: "About 4-5 weeks in — let's see how your courses are going.",
      questions: [
        { id: "hardest_course_now", type: "text", label: "Which course currently feels hardest?", placeholder: "Course name" },
        { id: "easiest_course_now", type: "text", label: "Which course feels easiest?", placeholder: "Course name" },
        { id: "most_concerned_course", type: "text", label: "Which course are you most concerned about?", placeholder: "Course name" },
        { id: "confusing_concepts", type: "textarea", label: "Which concepts already feel confusing?", placeholder: "List topics that aren't clicking yet…" },
        { id: "avoided_assignments", type: "textarea", label: "Are there any assignments or projects you've been avoiding?", placeholder: "Be honest — this is private." },
      ],
    },
    {
      title: "Expectations vs. Reality",
      subtitle: "How does this semester compare to what you expected?",
      questions: [
        { id: "semester_vs_expected", type: "select", label: "Is this semester harder, easier, or about what you expected?", options: ["Much harder than expected", "A bit harder", "About what I expected", "A bit easier", "Much easier than expected"] },
        { id: "on_track_for_grades", type: "select", label: "Are you on track for your target grades?", options: ["Yes, on track", "Some courses are falling behind", "Behind in most courses", "Way behind — need help"] },
        { id: "commitments_more_time", type: "multiselect", label: "Are any commitments taking more time than expected?", options: ["Work", "Clubs/organizations", "Family", "Research", "Social life", "Personal issues", "None — manageable"] },
        { id: "keeping_up_coursework", type: "select", label: "Are you keeping up with coursework?", options: ["Fully up to date", "Slightly behind", "Behind in most things", "Significantly behind"] },
      ],
    },
    {
      title: "Study Habits Assessment",
      subtitle: "What's working and what isn't?",
      questions: [
        { id: "study_consistency", type: "select", label: "How consistently are you studying?", options: ["Daily", "Most days", "A few times a week", "Only before deadlines", "Barely at all"] },
        { id: "working_study_methods", type: "multiselect", label: "Which study methods are working?", options: ["Active recall", "Practice problems", "Summarizing notes", "Group study", "YouTube / videos", "Flashcards", "Rewriting notes", "Office hours", "Tutoring", "Pomodoro sessions"] },
        { id: "not_working_methods", type: "multiselect", label: "Which study methods are NOT helping?", options: ["Passive re-reading", "Highlighting only", "Long unbroken study sessions", "Cramming", "Skipping class", "Waiting until last minute", "Multitasking"] },
        { id: "sought_help_when_confused", type: "select", label: "Have you sought help when confused?", options: ["Yes, regularly", "A few times", "Not yet but plan to", "No — avoiding it"] },
      ],
    },
    {
      title: "Task Completion & Delays",
      subtitle: "Let's understand what's causing any delays.",
      questions: [
        { id: "completing_before_deadlines", type: "select", label: "Are you completing assignments before deadlines?", options: ["Always on time", "Usually on time", "Often last-minute", "Sometimes late", "Frequently late"] },
        { id: "most_delayed_tasks", type: "multiselect", label: "What tasks are most likely to be delayed?", options: ["Reading assignments", "Problem sets", "Essays / papers", "Projects", "Studying for exams", "Discussion posts", "Lab reports", "All of the above"] },
        { id: "delay_reasons", type: "multiselect", label: "Why are they delayed?", options: ["Confusion about content", "Perfectionism", "Overwhelm", "Distraction", "Poor planning", "Lack of motivation", "Starting is the hardest part", "Don't know where to start"] },
      ],
    },
    {
      title: "Focus & Attention",
      subtitle: "Understanding your focus patterns helps us help you.",
      questions: [
        { id: "starting_work_difficulty", type: "multiselect", label: "What makes starting work difficult right now?", options: ["Overwhelm", "Unclear where to start", "Perfectionism", "Emotional blocks", "Fatigue", "Distractions nearby", "Task feels too big", "Low motivation"] },
        { id: "common_distractions_now", type: "multiselect", label: "What distractions are most common for you this semester?", options: ["Phone / social media", "YouTube", "Gaming", "Noise", "People around me", "My own thoughts", "Hunger / fatigue", "Other apps"] },
        { id: "helpful_focus_strategies", type: "multiselect", label: "Which focus strategies have been helping?", options: ["Pomodoro timer", "Phone in another room", "Library / quiet space", "Music / ambient sound", "Clear task list", "Accountability partner", "Short breaks", "Reward system"] },
        { id: "momentum_killers", type: "textarea", label: "What causes you to lose momentum most often?", placeholder: "e.g. Checking my phone, getting stuck on one question…" },
      ],
    },
    {
      title: "Well-Being Check",
      subtitle: "Your well-being matters as much as your grades.",
      questions: [
        { id: "stress_level", type: "scale", label: "Current stress level", max: 10, scaleLabels: ["Very low", "Extremely high"] },
        { id: "energy_level", type: "scale", label: "Average daily energy level", max: 10, scaleLabels: ["Depleted", "Energized"] },
        { id: "sleep_quality", type: "select", label: "Sleep quality this semester", options: ["Great — 7-9 hours consistently", "Okay — some inconsistency", "Poor — often under 6 hours", "Bad — regularly sleep-deprived"] },
        { id: "motivation_level", type: "scale", label: "Motivation level", max: 10, scaleLabels: ["No motivation", "Highly motivated"] },
        { id: "wellbeing_notes", type: "textarea", label: "Anything else about your well-being you want to note?", placeholder: "Mental health, social life, physical health…" },
      ],
    },
    {
      title: "Campus Life & Balance",
      subtitle: "Life outside the classroom matters too.",
      questions: [
        { id: "extracurriculars_manageable", type: "select", label: "Are your extracurricular commitments manageable?", options: ["Very manageable", "Manageable", "A bit stretched", "Overcommitted"] },
        { id: "overcommitted_areas", type: "multiselect", label: "Which areas feel overcommitted?", options: ["Work", "Clubs", "Research", "Social life", "Family", "Everything", "None"] },
        { id: "activities_helping_growth", type: "textarea", label: "What activities are helping you grow?", placeholder: "Clubs, friendships, hobbies, events…" },
        { id: "activities_draining", type: "textarea", label: "What activities are draining your energy?", placeholder: "Obligations, commitments, relationships that take more than they give…" },
      ],
    },
  ];
}
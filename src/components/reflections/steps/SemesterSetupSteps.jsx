export function getSemesterSetupSteps(courses = []) {
  return [
    {
      title: "Welcome to Your Semester Setup 🌟",
      subtitle: "Let's set intentions for an amazing semester. This will take about 10 minutes.",
      questions: [
        { id: "semester_three_words", type: "text", label: "Describe what you want this semester to be in 3 words", placeholder: "e.g. Focused, Balanced, Accomplished" },
        { id: "semester_success_looks_like", type: "textarea", label: "What would make this semester feel truly successful?", placeholder: "Be specific — grades, growth, habits, experiences…" },
      ],
    },
    {
      title: "Academic Goals",
      subtitle: "Let's set intentions for each of your courses.",
      perCourse: [
        { id: "target_grade", type: "select", label: "Target grade", options: ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "Pass"] },
        { id: "confidence", type: "scale", label: "Confidence level", max: 10, scaleLabels: ["Not confident", "Very confident"] },
        { id: "expected_difficulty", type: "select", label: "Expected difficulty", options: ["Easy", "Manageable", "Challenging", "Very Hard"] },
      ],
    },
    {
      title: "Course Feelings",
      subtitle: "How do you feel going into each class?",
      questions: [
        { id: "most_excited_course", type: "text", label: "Which course are you most excited about?", placeholder: "Course name" },
        { id: "most_worried_course", type: "text", label: "Which course are you most worried about?", placeholder: "Course name" },
        { id: "excited_why", type: "textarea", label: "Why are you excited about it?", placeholder: "What draws you to it?" },
        { id: "worried_why", type: "textarea", label: "What specifically worries you about the harder course?", placeholder: "Be honest — this helps us support you." },
      ],
    },
    {
      title: "Semester Goals",
      subtitle: "Beyond grades — what do you want to achieve?",
      questions: [
        { id: "top_goal_1", type: "text", label: "Top goal #1", placeholder: "e.g. Build a daily study habit" },
        { id: "top_goal_2", type: "text", label: "Top goal #2", placeholder: "e.g. Attend office hours weekly" },
        { id: "top_goal_3", type: "text", label: "Top goal #3", placeholder: "e.g. Get an internship" },
        { id: "skills_to_improve", type: "multiselect", label: "Skills you want to improve", options: ["Time management", "Note-taking", "Reading speed", "Writing", "Math", "Coding", "Communication", "Networking", "Research", "Focus"] },
        { id: "habits_to_build", type: "multiselect", label: "Habits you want to build", options: ["Daily review", "Morning routine", "Exercise", "Sleep by 11pm", "No phone during study", "Weekly planning", "Pomodoro sessions", "Reading for fun"] },
      ],
    },
    {
      title: "Career & Long-Term Vision",
      subtitle: "Connecting today's work to tomorrow's goals.",
      questions: [
        { id: "career_path", type: "text", label: "What career path are you currently considering?", placeholder: "e.g. Software Engineering, Medicine, Finance…" },
        { id: "experiences_hoping_for", type: "textarea", label: "What experiences do you hope to gain this semester?", placeholder: "Internships, research, projects, clubs…" },
        { id: "important_opportunities", type: "textarea", label: "What specific opportunities matter most to you this semester?", placeholder: "Projects, organizations, networking…" },
      ],
    },
    {
      title: "Commitments & Responsibilities",
      subtitle: "Let's make sure we account for everything on your plate.",
      questions: [
        { id: "commitments", type: "multiselect", label: "What commitments do you have outside of classes?", options: ["Part-time job", "Full-time job", "Club/organization", "Research", "Family responsibilities", "Volunteering", "Athletics", "Internship", "Side project", "Other"] },
        { id: "commitment_hours_weekly", type: "number", label: "Total hours per week on non-academic commitments", placeholder: "e.g. 15", min: 0, max: 80 },
        { id: "commitment_notes", type: "textarea", label: "Anything important to note about your commitments?", placeholder: "e.g. Work shifts vary, family pick-up on Tuesdays…" },
      ],
    },
    {
      title: "Time & Study Preferences",
      subtitle: "Help us build the right schedule for you.",
      questions: [
        { id: "study_hours_weekly", type: "number", label: "How many hours are you willing to study per week?", placeholder: "e.g. 20", min: 1, max: 80 },
        { id: "preferred_study_times", type: "multiselect", label: "Preferred study times", options: ["Early morning (before 8am)", "Morning (8am–12pm)", "Afternoon (12pm–5pm)", "Evening (5pm–9pm)", "Night (9pm–12am)", "Late night (after 12am)"] },
        { id: "preferred_study_locations", type: "multiselect", label: "Preferred study locations", options: ["Home / Dorm", "Library", "Café", "Classroom", "Study room", "Outdoors", "Varies"] },
        { id: "ideal_sleep_schedule", type: "text", label: "Ideal sleep schedule", placeholder: "e.g. 11pm–7am" },
      ],
    },
    {
      title: "Concerns & Anticipated Challenges",
      subtitle: "Honesty here is your superpower.",
      questions: [
        { id: "biggest_worry", type: "textarea", label: "What worries you most about this semester?", placeholder: "Be honest — this stays private." },
        { id: "anticipated_challenges", type: "multiselect", label: "What challenges do you anticipate?", options: ["Procrastination", "Overwhelm", "Difficult coursework", "Balancing work/school", "Mental health", "Social pressure", "Financial stress", "Motivation dips", "Focus issues", "Family obligations"] },
        { id: "past_semester_problems", type: "textarea", label: "What caused problems in previous semesters?", placeholder: "What patterns have you noticed?" },
      ],
    },
    {
      title: "Focus & Executive Function Baseline",
      subtitle: "Understanding how your brain works helps us support you better.",
      questions: [
        { id: "starting_difficulty_causes", type: "multiselect", label: "What usually makes starting assignments difficult?", options: ["Feeling overwhelmed", "Not knowing where to start", "Perfectionism", "The task feels too big", "Fear of failure", "Lack of motivation", "Too many distractions", "Emotional state"] },
        { id: "main_distractions", type: "multiselect", label: "What distractions affect you most?", options: ["Phone / social media", "YouTube / streaming", "Gaming", "Noise", "Other people", "Hunger/fatigue", "Overthinking", "My own thoughts"] },
        { id: "what_helps_focus", type: "multiselect", label: "What helps you focus?", options: ["Music", "Silence", "Timers / Pomodoro", "Clear task list", "Accountability partner", "Reward system", "Good environment", "Breaks", "Body doubling"] },
        { id: "best_study_environments", type: "textarea", label: "Describe your best study environment in detail", placeholder: "Lighting, sound, space, tools…" },
        { id: "fall_behind_causes", type: "multiselect", label: "What causes you to fall behind?", options: ["Avoiding hard tasks", "Poor planning", "Unexpected events", "Emotional blocks", "Underestimating time", "Procrastination spiral", "Too much on plate"] },
      ],
    },
    {
      title: "Letter to Your Future Self ✉️",
      subtitle: "Write freely. This is just for you.",
      questions: [
        {
          id: "letter_to_self",
          type: "letter",
          label: "Dear Future Me — at the end of this semester…",
          hint: "What do you hope to have accomplished? What do you want to remember? Why are you doing this?",
          placeholder: "Dear Future Me,\n\nI'm starting this semester with the hope that…",
        },
      ],
    },
  ];
}
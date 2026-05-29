export function getEndOfSemesterSteps(courses = []) {
  return [
    {
      title: "Semester Overview 🎓",
      subtitle: "You made it. Let's look back honestly and with pride.",
      questions: [
        { id: "semester_three_words", type: "text", label: "Describe this semester in three words", placeholder: "e.g. Grueling, Growing, Grateful" },
        { id: "most_proud_of", type: "textarea", label: "What are you most proud of this semester?", placeholder: "Academic, personal, anything…" },
        { id: "most_difficult", type: "textarea", label: "What was most difficult?", placeholder: "Don't minimize it — acknowledging hard things is part of growth." },
        { id: "what_surprised_you", type: "textarea", label: "What surprised you most this semester?", placeholder: "About yourself, your courses, your life…" },
      ],
    },
    {
      title: "Course-by-Course Debrief",
      subtitle: "Reflect on what you learned and how you learned it.",
      perCourse: [
        { id: "topics_clicked", type: "textarea", label: "What topics clicked?", placeholder: "Where did things make sense?" },
        { id: "topics_difficult", type: "textarea", label: "What topics remained difficult?", placeholder: "Honest gaps…" },
        { id: "best_learning_method", type: "multiselect", label: "What helped you learn most effectively?", options: ["Active recall", "Practice problems", "Office hours", "Study groups", "Videos / YouTube", "Re-writing notes", "Flashcards", "Tutoring", "Reading ahead"] },
        { id: "study_what_worked", type: "textarea", label: "What study habits worked for this course?", placeholder: "" },
        { id: "study_what_didnt", type: "textarea", label: "What study habits didn't work?", placeholder: "" },
        { id: "started_early_enough", type: "select", label: "Did you start preparing early enough?", options: ["Always", "Usually", "Sometimes", "Rarely", "Never"] },
        { id: "final_grade_estimate", type: "select", label: "Estimated final grade", options: ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F", "Pass", "Withdraw"] },
      ],
    },
    {
      title: "Time Management Debrief",
      subtitle: "Understanding your time patterns leads to better planning.",
      questions: [
        { id: "frequently_delayed_assignments", type: "multiselect", label: "Which assignments were most frequently delayed?", options: ["Reading", "Problem sets", "Essays", "Projects", "Exam studying", "Lab reports", "Discussion posts", "All of the above"] },
        { id: "helpful_planning_systems", type: "multiselect", label: "Which planning systems helped?", options: ["Digital calendar", "Paper planner", "Task manager app", "Fikr Planner", "Reminders", "Weekly review", "Day-of lists", "Backward planning from deadlines"] },
        { id: "failed_planning_systems", type: "multiselect", label: "Which planning systems failed or you abandoned?", options: ["Planner I never updated", "Calendar I didn't check", "Task lists that got overwhelming", "Mental notes only", "Relying on reminders alone"] },
      ],
    },
    {
      title: "Growth & Self-Discovery",
      subtitle: "The most important learning happens inside.",
      questions: [
        { id: "skill_improved_most", type: "textarea", label: "What skill improved the most this semester?", placeholder: "Academic, personal, professional…" },
        { id: "challenge_overcome", type: "textarea", label: "What challenge did you overcome that you're proud of?", placeholder: "Something you got through." },
        { id: "learned_about_yourself", type: "textarea", label: "What did you learn about yourself as a student?", placeholder: "How you work, focus, struggle, succeed…" },
      ],
    },
    {
      title: "Well-Being Reflection",
      subtitle: "A healthy student is a successful student.",
      questions: [
        { id: "happiest_moments", type: "textarea", label: "When were you happiest this semester?", placeholder: "What was happening? Who were you with?" },
        { id: "most_stressed_moments", type: "textarea", label: "When were you most stressed?", placeholder: "Patterns, triggers, circumstances…" },
        { id: "most_burned_out_periods", type: "textarea", label: "When were you most burned out?", placeholder: "What led to it? How did you recover?" },
      ],
    },
    {
      title: "Future Planning: Start / Stop / Continue",
      subtitle: "Turning reflection into action for next semester.",
      questions: [
        { id: "continue_doing", type: "textarea", label: "What should you CONTINUE doing next semester?", placeholder: "What worked — keep it." },
        { id: "start_doing", type: "textarea", label: "What should you START doing next semester?", placeholder: "New strategies, habits, approaches…" },
        { id: "stop_doing", type: "textarea", label: "What should you STOP doing next semester?", placeholder: "What clearly wasn't serving you?" },
      ],
    },
    {
      title: "Letter to Your Future Self ✉️",
      subtitle: "You'll receive this at the start of next semester.",
      questions: [
        {
          id: "end_letter_to_self",
          type: "letter",
          label: "Dear Future Me — here's what I want you to remember…",
          hint: "Lessons learned, advice for next semester, mistakes to avoid, encouragement.",
          placeholder: "Dear Future Me,\n\nThis semester taught me…\n\nNext semester, please remember…\n\nYou can do this because…",
        },
      ],
    },
  ];
}
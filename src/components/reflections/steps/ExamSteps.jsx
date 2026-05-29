export function getExamSteps(courses = []) {
  return [
    {
      title: "Which Exam Are You Reflecting On?",
      subtitle: "This reflection helps you learn from every exam.",
      questions: [
        { id: "exam_name", type: "text", label: "Exam name", placeholder: "e.g. Calc II Midterm, Bio Final, Physics Quiz 3" },
        { id: "course_name", type: "text", label: "Course", placeholder: "Course name" },
        { id: "exam_date", type: "text", label: "Date of the exam", placeholder: "e.g. May 15" },
      ],
    },
    {
      title: "Emotional Check-In",
      subtitle: "How are you feeling right now?",
      questions: [
        { id: "exam_feeling", type: "select", label: "How do you feel about the exam?", options: ["Really proud", "Pretty good", "Okay — mixed", "Disappointed", "Stressed / anxious", "Unsure — waiting for results"] },
        { id: "exam_confidence_after", type: "scale", label: "Confidence level after the exam", max: 10, scaleLabels: ["Not confident at all", "Very confident"] },
        { id: "exam_difficulty_vs_expected", type: "select", label: "Was it easier or harder than expected?", options: ["Much easier", "A bit easier", "About what I expected", "A bit harder", "Much harder"] },
      ],
    },
    {
      title: "Preparation Review",
      subtitle: "How did you prepare — and what worked?",
      questions: [
        { id: "study_start_when", type: "select", label: "When did you start studying?", options: ["1+ weeks before", "5-6 days before", "3-4 days before", "1-2 days before", "Night before", "Day of", "I didn't study"] },
        { id: "study_hours_total", type: "number", label: "Total hours studied", placeholder: "e.g. 8", min: 0, max: 100 },
        { id: "study_methods_used", type: "multiselect", label: "Which study methods did you use?", options: ["Active recall", "Flashcards", "Practice problems", "Past exams", "Group study", "Re-reading notes", "Watching videos", "Highlighting", "Office hours", "Tutoring"] },
        { id: "most_helpful_method", type: "text", label: "Which method helped most?", placeholder: "e.g. Past exams" },
        { id: "did_practice_exams", type: "select", label: "Did you complete practice exams?", options: ["Yes — full exams under timed conditions", "Yes — but without time pressure", "Some — partial attempts", "No"] },
        { id: "did_practice_problems", type: "select", label: "Did you complete practice problems?", options: ["Yes — many", "Yes — a few", "Very few", "No"] },
      ],
    },
    {
      title: "Topic Confidence Analysis",
      subtitle: "Rate your confidence on the main topics covered.",
      questions: [
        { id: "topic_1_name", type: "text", label: "Topic 1", placeholder: "e.g. Integration by parts" },
        { id: "topic_1_confidence", type: "select", label: "Topic 1 — confidence", options: ["Confident", "Somewhat confident", "Guessed", "Completely lost"] },
        { id: "topic_2_name", type: "text", label: "Topic 2", placeholder: "e.g. Differential equations" },
        { id: "topic_2_confidence", type: "select", label: "Topic 2 — confidence", options: ["Confident", "Somewhat confident", "Guessed", "Completely lost"] },
        { id: "topic_3_name", type: "text", label: "Topic 3", placeholder: "e.g. Series convergence" },
        { id: "topic_3_confidence", type: "select", label: "Topic 3 — confidence", options: ["Confident", "Somewhat confident", "Guessed", "Completely lost"] },
        { id: "weakest_topic", type: "textarea", label: "What was your weakest area on this exam?", placeholder: "Be specific — this drives your next study plan." },
      ],
    },
    {
      title: "Mistake Analysis",
      subtitle: "Understanding mistakes turns them into growth.",
      questions: [
        { id: "mistake_types", type: "multiselect", label: "What types of mistakes did you make?", options: ["Didn't know the concept", "Forgot a formula", "Misread the question", "Ran out of time", "Test anxiety", "Careless error", "Couldn't apply concept I knew", "Didn't practice enough", "Studied wrong material"] },
        { id: "mistake_analysis_notes", type: "textarea", label: "Tell me more about the mistakes. What went wrong?", placeholder: "Think through specific questions or moments…" },
      ],
    },
    {
      title: "Time Management During the Exam",
      subtitle: "Time is its own skill on exams.",
      questions: [
        { id: "exam_finished", type: "select", label: "Did you finish the exam?", options: ["Yes — finished with time to spare", "Yes — just finished in time", "Almost — a few questions incomplete", "No — left significant portions blank"] },
        { id: "longest_section", type: "text", label: "What section or question type took longest?", placeholder: "e.g. Essay questions, word problems…" },
        { id: "time_pressure_effect", type: "select", label: "Did time pressure affect your performance?", options: ["Not at all", "Slightly", "Moderately", "Significantly — I would have done much better with more time"] },
      ],
    },
    {
      title: "ADHD & Focus During Prep",
      subtitle: "Understanding focus patterns improves future preparation.",
      questions: [
        { id: "overwhelm_during_prep", type: "select", label: "Did overwhelm affect your preparation?", options: ["Not at all", "A little", "Moderately", "A lot", "It prevented me from studying effectively"] },
        { id: "distraction_during_prep", type: "select", label: "Did distraction affect your preparation?", options: ["Not at all", "A little", "Moderately", "A lot"] },
        { id: "avoided_difficult_topics", type: "select", label: "Did you avoid studying difficult topics?", options: ["No — I faced them directly", "Slightly", "Yes — I skipped hard parts", "Yes — significantly"] },
        { id: "study_difficulty_causes", type: "multiselect", label: "What made studying difficult?", options: ["Anxiety", "Procrastination", "Distraction", "Didn't know how to study this material", "Ran out of time", "Unclear what to study", "Fatigue", "Emotional state"] },
      ],
    },
    {
      title: "Wins & Forward Planning",
      subtitle: "Every exam teaches you something — let's capture it.",
      questions: [
        { id: "exam_what_went_well", type: "textarea", label: "What went well?", placeholder: "Even small things — what should you repeat?" },
        { id: "exam_improved_most", type: "textarea", label: "What improved most compared to your last exam?", placeholder: "Progress, no matter how small…" },
        { id: "would_change", type: "textarea", label: "What would you change about your preparation?", placeholder: "Specific and honest…" },
        { id: "advice_next_exam", type: "textarea", label: "What advice would you give yourself before the next exam?", placeholder: "Write it as if texting a friend who's about to take it." },
      ],
    },
  ];
}
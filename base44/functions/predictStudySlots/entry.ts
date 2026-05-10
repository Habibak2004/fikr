import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Load assignments and calendar events
  const [assignments, calendarEvents] = await Promise.all([
    base44.entities.Assignment.filter({ completed: false }, '-due_date', 50),
    base44.asServiceRole.entities.CalendarEvent.list('-start_time', 200),
  ]);

  if (!assignments.length) return Response.json({ slots: [], message: 'No pending assignments.' });

  const now = new Date();
  const upcoming = assignments
    .filter(a => a.due_date && new Date(a.due_date) > now)
    .map(a => ({
      id: a.id,
      name: a.name,
      course: a.course_name || '',
      type: a.type || 'homework',
      due_date: a.due_date,
      priority: a.priority || 'medium',
      weight: a.weight || null,
    }));

  const busySlots = calendarEvents
    .filter(e => !e.all_day && e.start_time && e.end_time)
    .map(e => ({ title: e.title, start: e.start_time, end: e.end_time }));

  const prompt = `You are an academic scheduling assistant for a student with ADHD.

Today is ${now.toISOString()}.

PENDING ASSIGNMENTS:
${JSON.stringify(upcoming, null, 2)}

BUSY CALENDAR SLOTS (next 60 days):
${JSON.stringify(busySlots.slice(0, 80), null, 2)}

Your job:
1. Estimate how long each assignment will take (in minutes) based on its type, priority, and weight.
2. Find gaps in the student's calendar where they could study (prefer morning/afternoon, avoid late nights, keep sessions 25–50 min each).
3. Schedule concrete study sessions for each assignment leading up to its due date.
4. Spread work out — never pile everything on one day.

Rules:
- Prefer 2–3 days before deadline for final review.
- For high-priority or high-weight assignments, schedule multiple sessions.
- Use ADHD-friendly session lengths: 25–30 min.
- Return the schedule only for the next 14 days.

Return ONLY a JSON object:
{
  "assignments": [
    {
      "id": "assignment_id",
      "name": "Assignment name",
      "estimated_minutes": 90,
      "sessions": [
        { "date": "2026-05-12", "start_time": "10:00", "end_time": "10:30", "label": "Start reading Ch. 4" }
      ]
    }
  ]
}`;

  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: 'object',
      properties: {
        assignments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              estimated_minutes: { type: 'number' },
              sessions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    date: { type: 'string' },
                    start_time: { type: 'string' },
                    end_time: { type: 'string' },
                    label: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return Response.json(result);
});
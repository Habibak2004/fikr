import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { url, task_name } = await req.json();
    if (!url) return Response.json({ error: 'URL required' }, { status: 400 });

    // Fetch the page content
    let pageText = "";
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; StudentPlanner/1.0)" },
        signal: AbortSignal.timeout(10000),
      });
      const html = await res.text();
      // Strip HTML tags and collapse whitespace
      pageText = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 8000); // limit tokens
    } catch (_) {
      pageText = "";
    }

    const prompt = `You are an expert at analyzing administrative university/housing/scholarship/internship web pages for college students with ADHD.

Task context: "${task_name || "Administrative task"}"
URL: ${url}
Page content (may be partial or empty if blocked):
---
${pageText || "(Page content unavailable — infer from URL and task name)"}
---

Extract ALL actionable information and return structured JSON. Be thorough. If page content is unavailable, use the URL and task name to make educated inferences about what this kind of process typically requires.

Return JSON:
{
  "is_admin_task": true | false,
  "task_type": "housing" | "financial_aid" | "scholarship" | "internship" | "application" | "onboarding" | "forms" | "other",
  "summary": "1-2 sentence plain English summary of what this process involves",
  "estimated_total_minutes": number,
  "required_steps": [
    { "title": "step title", "description": "what to do", "estimated_minutes": number, "order": number, "blocker": "any blocker or null" }
  ],
  "required_documents": [
    { "name": "document name", "description": "why needed", "how_to_get": "where to find/get it", "completed": false }
  ],
  "deadlines": [
    { "label": "deadline name", "date": "date string or null", "is_priority": true | false }
  ],
  "action_items": [
    { "title": "action item", "effort": "low" | "medium" | "high", "blockers": [] }
  ],
  "contact_info": [
    { "name": "office/person name", "email": "email or null", "phone": "phone or null", "website": "url or null" }
  ],
  "eligibility_requirements": ["requirement 1", "requirement 2"],
  "warnings": ["any gotchas, dependencies, or things commonly missed"],
  "ai_message": "1 sentence proactive insight e.g. 'This application requires 3 documents and takes ~35 min.'"
}`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          is_admin_task: { type: "boolean" },
          task_type: { type: "string" },
          summary: { type: "string" },
          estimated_total_minutes: { type: "number" },
          required_steps: { type: "array", items: { type: "object" } },
          required_documents: { type: "array", items: { type: "object" } },
          deadlines: { type: "array", items: { type: "object" } },
          action_items: { type: "array", items: { type: "object" } },
          contact_info: { type: "array", items: { type: "object" } },
          eligibility_requirements: { type: "array", items: { type: "string" } },
          warnings: { type: "array", items: { type: "string" } },
          ai_message: { type: "string" },
        },
      },
    });

    return Response.json({ result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
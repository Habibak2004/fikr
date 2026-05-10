import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
try {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
  const authHeader = { Authorization: `Bearer ${accessToken}` };

  // Load sync token
  const syncRecords = await base44.asServiceRole.entities.SyncState.filter({ key: 'googlecalendar' });
  const syncRecord = syncRecords[0] || null;

  let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=100&singleEvents=true&orderBy=startTime';
  if (syncRecord?.sync_token) {
    url += `&syncToken=${syncRecord.sync_token}`;
  } else {
    // First sync — fetch next 60 days
    const from = new Date().toISOString();
    const to = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
    url += `&timeMin=${from}&timeMax=${to}`;
  }

  let res = await fetch(url, { headers: authHeader });

  if (res.status === 410) {
    // syncToken expired — fresh sync
    const from = new Date().toISOString();
    const to = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
    url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=100&singleEvents=true&orderBy=startTime&timeMin=${from}&timeMax=${to}`;
    res = await fetch(url, { headers: authHeader });
  }

  if (!res.ok) {
    const err = await res.text();
    return Response.json({ error: 'Google API error', detail: err }, { status: 502 });
  }

  const allItems = [];
  let pageData = await res.json();
  let newSyncToken = null;

  while (true) {
    allItems.push(...(pageData.items || []));
    if (pageData.nextSyncToken) newSyncToken = pageData.nextSyncToken;
    if (!pageData.nextPageToken) break;
    const nextRes = await fetch(url + `&pageToken=${pageData.nextPageToken}`, { headers: authHeader });
    if (!nextRes.ok) break;
    pageData = await nextRes.json();
  }

  // Upsert events into CalendarEvent entity
  const existing = await base44.asServiceRole.entities.CalendarEvent.list('-start_time', 500);
  const existingMap = {};
  for (const e of existing) existingMap[e.google_event_id] = e;

  let created = 0, updated = 0, deleted = 0;

  // Process in small batches to avoid rate limits
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    if (i > 0 && i % 10 === 0) await sleep(300);

    if (item.status === 'cancelled') {
      if (existingMap[item.id]) {
        await base44.asServiceRole.entities.CalendarEvent.delete(existingMap[item.id].id);
        deleted++;
      }
      continue;
    }
    const allDay = !!item.start?.date && !item.start?.dateTime;
    const eventData = {
      google_event_id: item.id,
      title: item.summary || '(No title)',
      start_time: item.start?.dateTime || item.start?.date || null,
      end_time: item.end?.dateTime || item.end?.date || null,
      all_day: allDay,
      location: item.location || '',
      description: item.description || '',
      status: item.status || 'confirmed',
    };
    if (existingMap[item.id]) {
      await base44.asServiceRole.entities.CalendarEvent.update(existingMap[item.id].id, eventData);
      updated++;
    } else {
      await base44.asServiceRole.entities.CalendarEvent.create(eventData);
      created++;
    }
  }

  // Save sync token
  if (newSyncToken) {
    if (syncRecord) {
      await base44.asServiceRole.entities.SyncState.update(syncRecord.id, { sync_token: newSyncToken });
    } else {
      await base44.asServiceRole.entities.SyncState.create({ key: 'googlecalendar', sync_token: newSyncToken });
    }
  }

  return Response.json({ ok: true, created, updated, deleted, total: allItems.length });
} catch (err) {
  return Response.json({ error: err.message }, { status: 500 });
}
});
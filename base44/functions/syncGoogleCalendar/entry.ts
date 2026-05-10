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

    const from = new Date().toISOString();
    const to = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

    let baseUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=250&singleEvents=true`;
    if (syncRecord?.sync_token) {
      baseUrl += `&syncToken=${syncRecord.sync_token}`;
    } else {
      baseUrl += `&orderBy=startTime&timeMin=${from}&timeMax=${to}`;
    }

    let res = await fetch(baseUrl, { headers: authHeader });

    // syncToken expired — fresh full sync
    if (res.status === 410) {
      baseUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=250&singleEvents=true&orderBy=startTime&timeMin=${from}&timeMax=${to}`;
      res = await fetch(baseUrl, { headers: authHeader });
    }

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: 'Google API error', detail: err }, { status: 502 });
    }

    // Collect all pages
    const allItems = [];
    let pageData = await res.json();
    let newSyncToken = null;

    while (true) {
      allItems.push(...(pageData.items || []));
      if (pageData.nextSyncToken) newSyncToken = pageData.nextSyncToken;
      if (!pageData.nextPageToken) break;
      const nextRes = await fetch(baseUrl + `&pageToken=${pageData.nextPageToken}`, { headers: authHeader });
      if (!nextRes.ok) break;
      pageData = await nextRes.json();
    }

    if (allItems.length === 0) {
      return Response.json({ ok: true, created: 0, updated: 0, deleted: 0, total: 0 });
    }

    // Load existing records once
    const existing = await base44.asServiceRole.entities.CalendarEvent.list('-start_time', 500);
    const existingMap = {};
    for (const e of existing) existingMap[e.google_event_id] = e;

    const toCreate = [];
    const toDelete = [];
    let updated = 0;

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    for (const item of allItems) {
      if (item.status === 'cancelled') {
        if (existingMap[item.id]) toDelete.push(existingMap[item.id].id);
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
        // Only update if something actually changed
        const ex = existingMap[item.id];
        if (ex.title !== eventData.title || ex.start_time !== eventData.start_time || ex.end_time !== eventData.end_time) {
          await base44.asServiceRole.entities.CalendarEvent.update(ex.id, eventData);
          updated++;
          await sleep(150);
        }
      } else {
        toCreate.push(eventData);
      }
    }

    // Bulk create new events in batches of 20
    let created = 0;
    for (let i = 0; i < toCreate.length; i += 20) {
      const batch = toCreate.slice(i, i + 20);
      await base44.asServiceRole.entities.CalendarEvent.bulkCreate(batch);
      created += batch.length;
      if (i + 20 < toCreate.length) await sleep(400);
    }

    // Delete cancelled events one by one with small delay
    let deleted = 0;
    for (const id of toDelete) {
      await base44.asServiceRole.entities.CalendarEvent.delete(id);
      deleted++;
      await sleep(150);
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
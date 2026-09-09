#!/usr/bin/env node
/*  STRATUS EVENT CENTER, bake the live event list into static HTML.

    events.html and index.html render their event lists from events.json in
    JavaScript, so a crawler that does not run JS sees an empty div and the
    venue's calendar is invisible to Google's event carousel and to AI
    assistants. This writes, between comment markers, one MusicEvent JSON-LD
    node per upcoming event plus a plain HTML list. app.js still replaces the
    live containers on load, so nothing visual changes for a person.
    Idempotent. Runs from pull-and-push.sh after fetch_events.py.            */
import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const SITE = 'https://stratuseventcenteraz.com';
const raw = JSON.parse(readFileSync(new URL('events.json', ROOT), 'utf8'));
const events = Array.isArray(raw) ? raw : (raw.events || []);

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const to24 = (t) => { const m = String(t || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i); if (!m) return '20:00';
  let h = Number(m[1]) % 12; if (/pm/i.test(m[3])) h += 12; return `${String(h).padStart(2, '0')}:${m[2]}`; };
const abs = (u) => /^https?:/.test(u || '') ? u : (u ? `${SITE}/${u}` : undefined);

const PLACE = { '@type': 'Place', name: 'Stratus Event Center',
  address: { '@type': 'PostalAddress', streetAddress: '4344 W Indian School Rd, Ste 32', addressLocality: 'Phoenix', addressRegion: 'AZ', postalCode: '85031', addressCountry: 'US' } };

const today = new Date(); today.setHours(0, 0, 0, 0);
const upcoming = events.filter((e) => e && e.date && e.title && new Date((e.end || e.date) + 'T23:59:59-07:00') >= today)
  .sort((a, b) => a.date.localeCompare(b.date));

const node = (ev) => {
  const n = { '@type': 'MusicEvent', '@id': `${SITE}/events.html#${ev.date}-${ev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: ev.title, startDate: `${ev.date}T${to24(ev.time)}:00-07:00`,
    eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: PLACE, url: ev.info || ev.url || `${SITE}/events.html` };
  if (ev.end) n.endDate = `${ev.end}T02:00:00-07:00`;
  if (ev.desc) n.description = ev.desc;
  if (ev.flyer) n.image = abs(ev.flyer);
  if (Array.isArray(ev.lineup) && ev.lineup.length) n.performer = ev.lineup.map((p) => ({ '@type': 'PerformingGroup', name: p }));
  if (ev.url) n.offers = { '@type': 'Offer', url: ev.url, availability: 'https://schema.org/InStock' };
  if (/18/.test(ev.ages || '')) n.typicalAgeRange = '18+';
  return n;
};

const list = upcoming.map((ev) => `<article class="seo-ev"><h3><a href="${esc(ev.info || ev.url || '#')}">${esc(ev.title)}</a></h3><p><time datetime="${esc(ev.date)}">${esc(ev.date)}</time>${ev.time ? `, doors ${esc(ev.time)}` : ''}${ev.ages ? `, ${esc(ev.ages)}` : ''}</p>${ev.desc ? `<p>${esc(ev.desc)}</p>` : ''}</article>`).join('\n');

const ld = upcoming.length
  ? `<!--SEO:LD-->\n<script type="application/ld+json" id="evschema">\n${JSON.stringify({ '@context': 'https://schema.org', '@graph': upcoming.map(node) }, null, 1)}\n</script>\n<!--/SEO:LD-->\n`
  : '<!--SEO:LD--><!--/SEO:LD-->\n';

for (const [file, hostId] of [['events.html', 'events-list'], ['index.html', 'events-cards']]) {
  const path = new URL(file, ROOT);
  let html = readFileSync(path, 'utf8'); const before = html;
  html = /<!--SEO:LD-->[\s\S]*?<!--\/SEO:LD-->\n?/.test(html) ? html.replace(/<!--SEO:LD-->[\s\S]*?<!--\/SEO:LD-->\n?/, ld) : html.replace('</head>', `${ld}</head>`);
  const block = `<!--SEO:EVENTS-->\n${list}\n<!--/SEO:EVENTS-->`;
  html = html.replace(new RegExp(`(<div[^>]*id="${hostId}"[^>]*>)(?:\\s*<!--SEO:EVENTS-->[\\s\\S]*?<!--\\/SEO:EVENTS-->\\s*)?(</div>)`), (_m, o, c) => `${o}${block}${c}`);
  if (html !== before) { writeFileSync(path, html); console.log(`baked ${upcoming.length} events into ${file}`); } else console.log(`no change: ${file}`);
}

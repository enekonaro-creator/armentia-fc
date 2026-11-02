/* Shared by the browser and Node checks. No guessed kick-off times. */
(function (root) {
  const timed = match => /T\d{2}:\d{2}.*(?:Z|[+-]\d{2}:\d{2})$/.test(match.date) && !Number.isNaN(Date.parse(match.date));
  const utc = date => new Date(date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const escape = text => String(text).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  function verifiedVenue(name, venues = {}) {
    const venue = Object.hasOwn(venues, name) ? venues[name] : null;
    if (!venue || venue.verified !== true || typeof venue.mapUrl !== 'string') return null;
    try {
      const url = new URL(venue.mapUrl);
      if (url.protocol !== 'https:' || !['www.google.com', 'maps.google.com', 'maps.app.goo.gl'].includes(url.hostname)) return null;
      return venue;
    } catch { return null; }
  }
  function fold(line) {
    const lines = []; let part = '', bytes = 0;
    for (const c of line) { const size = new TextEncoder().encode(c).length; if (bytes + size > 75) { lines.push(part); part = ' '; bytes = 1; } part += c; bytes += size; }
    return [...lines, part].join('\r\n');
  }
  function calendar(matches, season) {
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Armentia FC//Matches//EU', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Armentia FC'];
    for (const m of matches.filter(timed)) {
      const summary = m.home ? `Armentia FC - ${m.opponent}` : `${m.opponent} - Armentia FC`;
      lines.push('BEGIN:VEVENT', `UID:${escape(season.replace('/', '-') + '-j' + m.round)}@armentiafc.com`, `DTSTAMP:${utc(new Date())}`, `DTSTART:${utc(m.date)}`, `SUMMARY:${escape(summary)}`, `LOCATION:${escape(m.venue || '')}`, 'DESCRIPTION:Confirma el horario en https://armentiafc.com antes de desplazarte.', 'URL:https://armentiafc.com/#partidak', 'END:VEVENT');
    }
    lines.push('END:VCALENDAR'); return lines.map(fold).join('\r\n') + '\r\n';
  }
  function preserveScore(match, previous) {
    if (!previous?.scoreOverride) return match;
    const o = previous.scoreOverride;
    if (![o.goalsFor, o.goalsAgainst].every(x => Number.isInteger(x) && x >= 0)) throw new Error('Invalid club score override');
    const official = Number.isInteger(match.goalsFor) ? {goalsFor: match.goalsFor, goalsAgainst: match.goalsAgainst} : null;
    return {...match, goalsFor: o.goalsFor, goalsAgainst: o.goalsAgainst, scoreOverride: o, officialScore: official, scoreDisputed: !official || official.goalsFor !== o.goalsFor || official.goalsAgainst !== o.goalsAgainst};
  }
  root.ArmentiaMatchTools = {timed, calendar, preserveScore, verifiedVenue};
})(globalThis);

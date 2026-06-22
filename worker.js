// WC26 Live Scores Worker v2 — uses football-data.org (free, reliable)
// Cron: every 15 min. Only fetches during active match windows.
// Zero Anthropic cost. Saves to Supabase live_scores table.

const SB_URL  = 'https://yhithuegsfwdhunanopt.supabase.co';
const SB_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloaXRodWVnc2Z3ZGh1bmFub3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMDU3MDcsImV4cCI6MjA5MjY4MTcwN30.IAHM7e9ckepeceNWx3rPpwnbn6ia2qnfbMgryE7fTvs';
const FD_KEY  = 'f6594eaa91e24cd69570ab6c666cd58c';
const FD_URL  = 'https://api.football-data.org/v4/competitions/WC/matches';

// ── Fixtures for match window detection (EDT→UTC +4h) ────────────────────────
const GROUP_MATCHES = [
  {id:1,  group:'A', t1:'Mexico',       t2:'South Africa',  et:'3:00 PM',  date:'2026-06-11'},
  {id:2,  group:'A', t1:'South Korea',  t2:'Czechia',       et:'10:00 PM', date:'2026-06-11'},
  {id:3,  group:'B', t1:'Canada',       t2:'Bosnia & Herz.',et:'3:00 PM',  date:'2026-06-12'},
  {id:4,  group:'D', t1:'USA',          t2:'Paraguay',      et:'9:00 PM',  date:'2026-06-12'},
  {id:5,  group:'B', t1:'Qatar',        t2:'Switzerland',   et:'3:00 PM',  date:'2026-06-13'},
  {id:6,  group:'C', t1:'Brazil',       t2:'Morocco',       et:'6:00 PM',  date:'2026-06-13'},
  {id:7,  group:'C', t1:'Haiti',        t2:'Scotland',      et:'9:00 PM',  date:'2026-06-13'},
  {id:8,  group:'D', t1:'Australia',    t2:'Turkey',        et:'12:00 AM', date:'2026-06-14'},
  {id:9,  group:'E', t1:'Germany',      t2:'Curacao',       et:'1:00 PM',  date:'2026-06-14'},
  {id:10, group:'F', t1:'Netherlands',  t2:'Japan',         et:'4:00 PM',  date:'2026-06-14'},
  {id:11, group:'E', t1:'Ivory Coast',  t2:'Ecuador',       et:'7:00 PM',  date:'2026-06-14'},
  {id:12, group:'F', t1:'Sweden',       t2:'Tunisia',       et:'10:00 PM', date:'2026-06-14'},
  {id:13, group:'G', t1:'Belgium',      t2:'Egypt',         et:'1:00 PM',  date:'2026-06-15'},
  {id:14, group:'G', t1:'Iran',         t2:'New Zealand',   et:'10:00 AM', date:'2026-06-15'},
  {id:15, group:'H', t1:'Spain',        t2:'Cape Verde',    et:'4:00 PM',  date:'2026-06-15'},
  {id:16, group:'H', t1:'Saudi Arabia', t2:'Uruguay',       et:'7:00 PM',  date:'2026-06-15'},
  {id:17, group:'I', t1:'France',       t2:'Senegal',       et:'1:00 PM',  date:'2026-06-16'},
  {id:18, group:'I', t1:'Iraq',         t2:'Norway',        et:'4:00 PM',  date:'2026-06-16'},
  {id:19, group:'J', t1:'Argentina',    t2:'Algeria',       et:'7:00 PM',  date:'2026-06-16'},
  {id:20, group:'J', t1:'Austria',      t2:'Jordan',        et:'10:00 AM', date:'2026-06-16'},
  {id:21, group:'K', t1:'Portugal',     t2:'DR Congo',      et:'1:00 PM',  date:'2026-06-17'},
  {id:22, group:'K', t1:'Uzbekistan',   t2:'Colombia',      et:'4:00 PM',  date:'2026-06-17'},
  {id:23, group:'L', t1:'England',      t2:'Croatia',       et:'7:00 PM',  date:'2026-06-17'},
  {id:24, group:'L', t1:'Ghana',        t2:'Panama',        et:'10:00 AM', date:'2026-06-17'},
  {id:25, group:'A', t1:'South Africa', t2:'South Korea',   et:'10:00 AM', date:'2026-06-18'},
  {id:26, group:'A', t1:'Czechia',      t2:'Mexico',        et:'1:00 PM',  date:'2026-06-18'},
  {id:27, group:'B', t1:'Switzerland',  t2:'Bosnia & Herz.',et:'4:00 PM',  date:'2026-06-18'},
  {id:28, group:'C', t1:'Scotland',     t2:'Brazil',        et:'7:00 PM',  date:'2026-06-18'},
  {id:29, group:'D', t1:'Paraguay',     t2:'Australia',     et:'10:00 AM', date:'2026-06-19'},
  {id:30, group:'B', t1:'Canada',       t2:'Qatar',         et:'1:00 PM',  date:'2026-06-19'},
  {id:31, group:'C', t1:'Morocco',      t2:'Haiti',         et:'4:00 PM',  date:'2026-06-19'},
  {id:32, group:'D', t1:'Turkey',       t2:'Paraguay',      et:'11:00 PM', date:'2026-06-19'},
  {id:33, group:'F', t1:'Japan',        t2:'Sweden',        et:'10:00 AM', date:'2026-06-20'},
  {id:34, group:'E', t1:'Germany',      t2:'Ivory Coast',   et:'1:00 PM',  date:'2026-06-20'},
  {id:35, group:'E', t1:'Ecuador',      t2:'Curacao',       et:'4:00 PM',  date:'2026-06-20'},
  {id:36, group:'F', t1:'Tunisia',      t2:'Netherlands',   et:'7:00 PM',  date:'2026-06-20'},
  {id:37, group:'G', t1:'Egypt',        t2:'Iran',          et:'10:00 AM', date:'2026-06-21'},
  {id:38, group:'H', t1:'Uruguay',      t2:'Spain',         et:'1:00 PM',  date:'2026-06-21'},
  {id:39, group:'G', t1:'New Zealand',  t2:'Belgium',       et:'4:00 PM',  date:'2026-06-21'},
  {id:40, group:'H', t1:'Cape Verde',   t2:'Saudi Arabia',  et:'7:00 PM',  date:'2026-06-21'},
  {id:41, group:'I', t1:'Senegal',      t2:'Iraq',          et:'10:00 AM', date:'2026-06-22'},
  {id:42, group:'J', t1:'Jordan',       t2:'Argentina',     et:'1:00 PM',  date:'2026-06-22'},
  {id:43, group:'I', t1:'Norway',       t2:'France',        et:'4:00 PM',  date:'2026-06-22'},
  {id:44, group:'J', t1:'Algeria',      t2:'Austria',       et:'7:00 PM',  date:'2026-06-22'},
  {id:45, group:'K', t1:'Colombia',     t2:'Portugal',      et:'10:00 AM', date:'2026-06-23'},
  {id:46, group:'L', t1:'Croatia',      t2:'Ghana',         et:'1:00 PM',  date:'2026-06-23'},
  {id:47, group:'K', t1:'DR Congo',     t2:'Uzbekistan',    et:'4:00 PM',  date:'2026-06-23'},
  {id:48, group:'L', t1:'Panama',       t2:'England',       et:'7:00 PM',  date:'2026-06-23'},
  {id:49, group:'A', t1:'Mexico',       t2:'South Korea',   et:'10:00 AM', date:'2026-06-25'},
  {id:50, group:'A', t1:'South Africa', t2:'Czechia',       et:'10:00 AM', date:'2026-06-25'},
  {id:51, group:'B', t1:'Canada',       t2:'Switzerland',   et:'2:00 PM',  date:'2026-06-25'},
  {id:52, group:'B', t1:'Bosnia & Herz.',t2:'Qatar',        et:'2:00 PM',  date:'2026-06-25'},
  {id:53, group:'C', t1:'Brazil',       t2:'Haiti',         et:'10:00 AM', date:'2026-06-26'},
  {id:54, group:'C', t1:'Morocco',      t2:'Scotland',      et:'10:00 AM', date:'2026-06-26'},
  {id:55, group:'E', t1:'Curacao',      t2:'Ivory Coast',   et:'2:00 PM',  date:'2026-06-26'},
  {id:56, group:'E', t1:'Ecuador',      t2:'Germany',       et:'2:00 PM',  date:'2026-06-26'},
  {id:57, group:'D', t1:'Australia',    t2:'USA',           et:'10:00 AM', date:'2026-06-26'},
  {id:58, group:'D', t1:'Paraguay',     t2:'Turkey',        et:'10:00 AM', date:'2026-06-26'},
  {id:59, group:'D', t1:'Turkey',       t2:'USA',           et:'10:00 PM', date:'2026-06-25'},
  {id:60, group:'F', t1:'Japan',        t2:'Tunisia',       et:'10:00 AM', date:'2026-06-27'},
  {id:61, group:'F', t1:'Sweden',       t2:'Netherlands',   et:'10:00 AM', date:'2026-06-27'},
  {id:62, group:'G', t1:'Belgium',      t2:'Iran',          et:'2:00 PM',  date:'2026-06-27'},
  {id:63, group:'G', t1:'New Zealand',  t2:'Egypt',         et:'2:00 PM',  date:'2026-06-27'},
  {id:64, group:'H', t1:'Spain',        t2:'Saudi Arabia',  et:'10:00 AM', date:'2026-06-28'},
  {id:65, group:'H', t1:'Cape Verde',   t2:'Uruguay',       et:'10:00 AM', date:'2026-06-28'},
  {id:66, group:'I', t1:'France',       t2:'Iraq',          et:'2:00 PM',  date:'2026-06-28'},
  {id:67, group:'I', t1:'Norway',       t2:'Senegal',       et:'2:00 PM',  date:'2026-06-28'},
  {id:68, group:'J', t1:'Argentina',    t2:'Austria',       et:'10:00 AM', date:'2026-06-29'},
  {id:69, group:'J', t1:'Algeria',      t2:'Jordan',        et:'10:00 AM', date:'2026-06-29'},
  {id:70, group:'K', t1:'Portugal',     t2:'Uzbekistan',    et:'2:00 PM',  date:'2026-06-29'},
  {id:71, group:'K', t1:'Colombia',     t2:'DR Congo',      et:'2:00 PM',  date:'2026-06-29'},
  {id:72, group:'L', t1:'England',      t2:'Panama',        et:'10:00 AM', date:'2026-06-30'},
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function matchKickoffUTC(m) {
  const [t, ap] = m.et.split(' ');
  let [h, mn] = t.split(':').map(Number);
  if (!mn) mn = 0;
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  const utcH = h + 4; // EDT (UTC-4) → UTC
  const d = new Date(m.date + 'T00:00:00Z');
  d.setUTCHours(utcH, mn, 0, 0);
  return d;
}

// Determines which of our hardcoded fixtures are "active" right now.
// Primary source: our own ET-based schedule (always available, no API call needed).
// Cross-check: if we have a recent saved match with a real utcDate from the API,
// prefer that — handles any kickoff-time drift or rescheduling automatically.
function getActiveMatches(now, savedData) {
  savedData = savedData || [];
  return GROUP_MATCHES.filter(m => {
    let kickoff = matchKickoffUTC(m);

    // Look for this match in saved data — if found and it has a real utcDate, use it instead
    const mt1 = normTeam(m.t1), mt2 = normTeam(m.t2);
    const saved = savedData.find(s => {
      const st1 = normTeam(s.t1), st2 = normTeam(s.t2);
      return (st1 === mt1 && st2 === mt2) || (st1 === mt2 && st2 === mt1);
    });
    if (saved?.utcDate) kickoff = new Date(saved.utcDate);

    const ceiling = new Date(kickoff.getTime() + 115 * 60 * 1000);
    return now >= kickoff && now <= ceiling;
  });
}

function normTeam(name) {
  if (!name) return '';
  let n = name.toLowerCase()
    .replace(/ü/g, 'u').replace(/ç/g, 'c').replace(/é/g, 'e')
    .replace(/ô/g, 'o').replace(/ñ/g, 'n').replace(/['']/g, '')
    .replace(/[^a-z0-9]/g, '');
  const aliases = {
    'turkey': 'turkey', 'turkiye': 'turkey',
    'ivorycoast': 'cotedivoire', 'cotedivoire': 'cotedivoire',
    'unitedstates': 'usa',
    'czechrepublic': 'czechia',
    'curacao': 'curacao', 'curao': 'curacao',
    'bosniaandherzegovina': 'bosniaherzegovina',
    'bosniaherzegovina': 'bosniaherzegovina',
    'bosniaherz': 'bosniaherzegovina', // our app's abbreviated "Bosnia & Herz."
    'drcongo': 'drcongo', 'congodr': 'drcongo',
  };
  return aliases[n] || n;
}

async function getLastSavedScores() {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/live_scores?id=eq.1&select=live_data`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (!res.ok) return [];
    const rows = await res.json();
    return rows?.[0]?.live_data ? JSON.parse(rows[0].live_data) : [];
  } catch (e) { return []; }
}

function isAlreadyFT(savedData, match) {
  const a = normTeam(match.t1), b = normTeam(match.t2);
  return savedData.some(s => {
    if (s.status !== 'FT') return false;
    const sa = normTeam(s.t1), sb = normTeam(s.t2);
    return (sa === a && sb === b) || (sa === b && sb === a);
  });
}

// ── Map football-data.org match to our internal format ───────────────────────
// fd status enum: SCHEDULED, TIMED, LIVE, IN_PLAY, PAUSED, FINISHED, SUSPENDED, POSTPONED, CANCELED
function mapFDMatch(m) {
  try {
    const t1 = m.homeTeam?.shortName || m.homeTeam?.name || '';
    const t2 = m.awayTeam?.shortName || m.awayTeam?.name || '';
    if (!t1 || !t2) return null;

    const rawStatus = (m.status || '').toUpperCase();
    let status = 'SCH';
    if (['LIVE', 'IN_PLAY'].includes(rawStatus)) status = 'LIVE';
    if (rawStatus === 'PAUSED')                  status = 'HT'; // half-time (or break)
    if (rawStatus === 'SUSPENDED')                status = 'LIVE'; // temporary stoppage, still "live" for our purposes
    if (rawStatus === 'FINISHED')                 status = 'FT';
    if (status === 'SCH') return null;

    const s1 = m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? 0;
    const s2 = m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? 0;
    const minute = m.minute || null;
    const injuryTime = m.injuryTime || null; // stoppage time added, e.g. minute=90 injuryTime=4 → "90+4"
    const group = m.group?.replace('GROUP_', '') || null;
    const utcDate = m.utcDate || null; // authoritative kickoff time straight from the API

    return { t1, t2, s1, s2, status, minute, injuryTime, group, utcDate };
  } catch (e) { return null; }
}

// ── Main fetch and store ─────────────────────────────────────────────────────
async function fetchAndStore(active, savedData) {
  const res = await fetch(FD_URL, {
    headers: { 'X-Auth-Token': FD_KEY, 'Accept': 'application/json' }
  });

  if (!res.ok) throw new Error(`football-data.org HTTP ${res.status}: ${await res.text().then(t=>t.slice(0,100))}`);

  const data = await res.json();
  const matches = data.matches || [];
  console.log('[WC26 v2] Got', matches.length, 'matches from football-data.org');

  // Map all returned matches
  const fresh = matches.map(mapFDMatch).filter(Boolean);
  console.log('[WC26 v2] Mapped matches:', fresh.map(m => `${m.t1} vs ${m.t2} (${m.status})`).join(', '));

  // Merge into saved data
  const merged = [...savedData];
  for (const g of fresh) {
    const gt1 = normTeam(g.t1), gt2 = normTeam(g.t2);
    const idx = merged.findIndex(s => {
      const st1 = normTeam(s.t1), st2 = normTeam(s.t2);
      return (st1 === gt1 && st2 === gt2) || (st1 === gt2 && st2 === gt1);
    });
    if (idx >= 0) merged[idx] = g;
    else merged.push(g);
  }

  // Save to Supabase
  const sbRes = await fetch(`${SB_URL}/rest/v1/live_scores`, {
    method: 'POST',
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ id: 1, live_data: JSON.stringify(merged), updated_at: new Date().toISOString() }),
  });
  if (!sbRes.ok) throw new Error(`Supabase ${sbRes.status}`);

  return { fetched: fresh.length, total: merged.length };
}

// ── Worker cycle ─────────────────────────────────────────────────────────────
async function runCycle() {
  const now = new Date();
  const savedData = await getLastSavedScores();
  const active = getActiveMatches(now, savedData);

  // Always fetch — gets LIVE scores during matches, FT results otherwise.
  // football-data.org free tier: 10 req/min, we use 1/min so well within limits.
  const result = await fetchAndStore(active, savedData);
  return { active: active.map(m => `${m.t1} vs ${m.t2}`), ...result };
}

// ── Squad lookup (cached in Supabase, fetched once per team) ────────────────
async function getCachedSquad(teamName) {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/team_squads?team_name=eq.${encodeURIComponent(teamName)}&select=squad_json`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0]?.squad_json ? JSON.parse(rows[0].squad_json) : null;
  } catch (e) { return null; }
}

async function cacheSquad(teamName, squad) {
  try {
    await fetch(`${SB_URL}/rest/v1/team_squads`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ team_name: teamName, squad_json: JSON.stringify(squad), updated_at: new Date().toISOString() }),
    });
  } catch (e) { /* non-fatal */ }
}

async function fetchTeamSquad(teamName) {
  // Check cache first — squads rarely change during the tournament
  const cached = await getCachedSquad(teamName);
  if (cached) return { squad: cached, fromCache: true };

  // Find team in football-data.org's WC teams list
  const res = await fetch('https://api.football-data.org/v4/competitions/WC/teams', {
    headers: { 'X-Auth-Token': FD_KEY, 'Accept': 'application/json' }
  });
  if (!res.ok) throw new Error(`football-data.org HTTP ${res.status}`);
  const data = await res.json();
  const teams = data.teams || [];

  const team = teams.find(t => normTeam(t.name) === normTeam(teamName) || normTeam(t.shortName) === normTeam(teamName));
  if (!team) throw new Error(`Team not found: ${teamName}`);

  const squad = {
    crest: team.crest || null,
    players: (team.squad || []).map(p => ({
      name: p.name, position: p.position, dateOfBirth: p.dateOfBirth,
      nationality: p.nationality, shirtNumber: p.shirtNumber,
    })),
  };

  await cacheSquad(teamName, squad);
  return { squad, fromCache: false };
}

// ── Export ───────────────────────────────────────────────────────────────────
export default {
  async scheduled(event, env, ctx) {
    try {
      const result = await runCycle();
      if (result.skipped) console.log('[WC26 v2] Skipped:', result.reason);
      else console.log('[WC26 v2] Fetched', result.fetched, '| Total saved:', result.total, '| Active:', result.active?.join(', '));
    } catch (e) {
      console.error('[WC26 v2] Error:', e.message);
    }
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/status') {
      const now = new Date();
      const savedData = await getLastSavedScores();
      const active = getActiveMatches(now, savedData);
      return new Response(JSON.stringify({
        active: active.length > 0,
        activeMatches: active.map(m => `${m.t1} vs ${m.t2}`),
        now: now.toISOString(),
      }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    if (url.pathname === '/trigger') {
      try {
        const result = await runCycle();
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch(e) {
        return new Response(JSON.stringify({ ok: false, error: e.message }), {
          status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    if (url.pathname === '/squad') {
      const team = url.searchParams.get('team');
      if (!team) {
        return new Response(JSON.stringify({ ok: false, error: 'Missing ?team= param' }), {
          status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      try {
        const result = await fetchTeamSquad(team);
        return new Response(JSON.stringify({ ok: true, ...result }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: e.message }), {
          status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      message: 'WC26 Scores Worker v2 — football-data.org (free, $0/call)',
      endpoints: ['/status', '/trigger', '/squad?team=NAME'],
    }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  },
};

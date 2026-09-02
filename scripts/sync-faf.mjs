import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sitePath = resolve(root, "data/site.json");
const configPath = resolve(root, "data/faf-config.json");
const dryRun = process.argv.includes("--dry-run");
const config = JSON.parse(await readFile(configPath, "utf8"));
config.teamUrl = process.env.FAF_TEAM_URL?.trim() || config.teamUrl;
config.standingsUrl = process.env.FAF_STANDINGS_URL?.trim() || config.standingsUrl;

if (!config.teamUrl || !config.standingsUrl) {
  console.log("Sincronización pendiente: faltan los enlaces FAF de la temporada 2026/27.");
  process.exit(0);
}

const normalize = (value) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/\s+/g, " ")
  .trim()
  .toUpperCase();

const aliases = config.teamAliases.map(normalize);
const isArmentia = (name) => aliases.includes(normalize(name));

function decode(value) {
  const named = {
    amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ",
    aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú",
    ntilde: "ñ", uuml: "ü", Aacute: "Á", Eacute: "É", Iacute: "Í",
    Oacute: "Ó", Uacute: "Ú", Ntilde: "Ñ", Uuml: "Ü"
  };
  return value
    .replace(/&([a-z]+);/gi, (_, entity) => named[entity] ?? named[entity.toLowerCase()] ?? `&${entity};`)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function text(value) {
  return decode(value.replace(/<br\s*\/?\s*>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function tables(html) {
  return [...html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)].map((match) => match[0]);
}

function rows(table) {
  return [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((match) => match[1]);
}

function cells(row) {
  return [...row.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((match) => match[1]);
}

function madridOffset(year, month, day) {
  const lastSunday = (targetMonth) => {
    const last = new Date(Date.UTC(year, targetMonth, 0));
    return last.getUTCDate() - last.getUTCDay();
  };
  const summer = month > 3 && month < 10
    || (month === 3 && day >= lastSunday(3))
    || (month === 10 && day < lastSunday(10));
  return summer ? "+02:00" : "+01:00";
}

function parseDate(raw) {
  const match = raw.match(/(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (!match) throw new Error(`Fecha FAF no reconocida: ${raw}`);
  const [, day, month, year, hour = "00", minute = "00"] = match;
  return `${year}-${month}-${day}T${hour}:${minute}:00${madridOffset(Number(year), Number(month), Number(day))}`;
}

async function createFafSession(origin) {
  let url = `${origin}/pnfg/NPortada`;
  let cookie = "";
  for (let redirect = 0; redirect < 5; redirect += 1) {
    const response = await fetch(url, {
      redirect: "manual",
      headers: { cookie, "user-agent": "ArmentiaFC/1.0 (+https://armentiafc.com)" }
    });
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";", 1)[0];
    const location = response.headers.get("location");
    if (!location) {
      if (!cookie) throw new Error("La FAF no ha iniciado una sesión de lectura.");
      return cookie;
    }
    url = new URL(location, url).href;
  }
  throw new Error("La FAF ha devuelto demasiadas redirecciones.");
}

async function fetchFaf(url, cookie) {
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      cookie,
      "user-agent": "ArmentiaFC/1.0 (+https://armentiafc.com)"
    }
  });
  const html = await response.text();
  if (!response.ok || html.length < 5000 || !/<table\b/i.test(html)) {
    throw new Error(`La FAF no devolvió datos utilizables (${response.status}, ${html.length} bytes).`);
  }
  return html;
}

function parseMatches(html) {
  const table = tables(html).find((item) => /Jor\./i.test(text(item)) && /Resultado/i.test(text(item)));
  if (!table) throw new Error("No se ha encontrado la tabla de partidos de la FAF.");

  const matches = [];
  for (const row of rows(table)) {
    const rowCells = cells(row);
    if (rowCells.length !== 3 || !/^\d+$/.test(text(rowCells[0]))) continue;
    if (/Descansa/i.test(text(rowCells[1]))) continue;

    const headings = [...rowCells[1].matchAll(/<h5\b[^>]*>([\s\S]*?)<\/h5>/gi)].map((match) => text(match[1]));
    const dateIndex = headings.findIndex((value) => /\d{2}-\d{2}-\d{4}/.test(value));
    const teams = headings.slice(0, dateIndex);
    if (dateIndex < 0 || teams.length < 2) continue;

    const homeTeam = teams[0];
    const awayTeam = teams[1];
    if (!isArmentia(homeTeam) && !isArmentia(awayTeam)) continue;
    const scores = [...rowCells[2].matchAll(/<b\b[^>]*>\s*(\d+)\s*<\/b>/gi)].map((match) => Number(match[1]));
    const home = isArmentia(homeTeam);
    const match = {
      round: Number(text(rowCells[0])),
      opponent: home ? awayTeam : homeTeam,
      date: parseDate(headings[dateIndex]),
      home,
      venue: "",
      competition: config.competition
    };
    if (scores.length === 2) {
      match.goalsFor = home ? scores[0] : scores[1];
      match.goalsAgainst = home ? scores[1] : scores[0];
    }
    matches.push(match);
  }

  if (!matches.length) throw new Error("La tabla FAF no contiene partidos reconocibles de Armentia FC.");
  return matches.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function parseStandings(html) {
  const table = tables(html).find((item) => /Equipos/i.test(text(item)) && /Partidos Casa/i.test(text(item)) && /Partidos Fuera/i.test(text(item)));
  if (!table) throw new Error("No se ha encontrado la clasificación de la FAF.");

  const standings = [];
  for (const row of rows(table)) {
    const values = cells(row).map(text);
    if (values.length < 14 || !/^\d+$/.test(values[1])) continue;
    const numbers = values.map((value) => Number.parseInt(value, 10));
    standings.push({
      position: numbers[1],
      team: values[2],
      points: numbers[3],
      played: numbers[4] + numbers[8],
      won: numbers[5] + numbers[9],
      drawn: numbers[6] + numbers[10],
      lost: numbers[7] + numbers[11],
      goalsFor: numbers[12],
      goalsAgainst: numbers[13],
      isArmentia: isArmentia(values[2])
    });
  }
  if (!standings.length || !standings.some((team) => team.isArmentia)) {
    throw new Error("La clasificación no contiene a Armentia FC con los alias configurados.");
  }
  return standings;
}

const fafOrigin = new URL(config.teamUrl).origin;
const latestStandingsUrl = new URL(config.standingsUrl);
for (const key of [...latestStandingsUrl.searchParams.keys()]) {
  if (key.toLowerCase() === "codjornada") latestStandingsUrl.searchParams.delete(key);
}
const sessionCookie = await createFafSession(fafOrigin);
const teamHtml = await fetchFaf(config.teamUrl, sessionCookie);
const standingsHtml = await fetchFaf(latestStandingsUrl.href, sessionCookie);
const matches = parseMatches(teamHtml);
const standings = parseStandings(standingsHtml);
const played = matches.filter((match) => Number.isInteger(match.goalsFor));
const upcoming = matches.filter((match) => !Number.isInteger(match.goalsFor) && new Date(match.date) >= new Date());

if (dryRun) {
  console.log(JSON.stringify({ matches: matches.length, standings: standings.length, lastMatch: played.at(-1), nextMatch: upcoming[0] ?? null }, null, 2));
  process.exit(0);
}

const site = JSON.parse(await readFile(sitePath, "utf8"));
const changed = JSON.stringify({ matches: site.matches, standings: site.standings }) !== JSON.stringify({ matches, standings });
site.matches = matches;
site.standings = standings;
site.lastMatch = played.at(-1) ?? null;
site.nextMatch = upcoming[0] ?? null;
site.standingsUrl = latestStandingsUrl.href;
site.dataSource = {
  type: "faf",
  updatedAt: changed ? new Date().toISOString() : site.dataSource?.updatedAt ?? new Date().toISOString()
};

await writeFile(sitePath, `${JSON.stringify(site, null, 2)}\n`, "utf8");
console.log(`FAF sincronizada: ${matches.length} partidos y ${standings.length} equipos.`);

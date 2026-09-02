import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dataPath = resolve(root, "data/site.json");
const data = JSON.parse(await readFile(dataPath, "utf8"));
const fafConfig = JSON.parse(await readFile(resolve(root, "data/faf-config.json"), "utf8"));
const html = await readFile(resolve(root, "index.html"), "utf8");
const css = await readFile(resolve(root, "style.css"), "utf8");
const errors = [];

function check(condition, message) {
  if (!condition) errors.push(message);
}

function checkMatch(match, label, needsScore = false) {
  if (match === null) return;
  check(typeof match === "object", `${label} debe ser un objeto o null.`);
  if (!match || typeof match !== "object") return;

  check(typeof match.opponent === "string" && match.opponent.trim(), `${label}.opponent es obligatorio.`);
  check(typeof match.date === "string" && !Number.isNaN(Date.parse(match.date)), `${label}.date debe ser una fecha ISO válida.`);
  check(typeof match.home === "boolean", `${label}.home debe ser true o false.`);
  check(typeof match.venue === "string", `${label}.venue debe ser texto.`);
  check(typeof match.competition?.eu === "string", `${label}.competition.eu es obligatorio.`);
  check(typeof match.competition?.es === "string", `${label}.competition.es es obligatorio.`);

  if (needsScore) {
    check(Number.isInteger(match.goalsFor) && match.goalsFor >= 0, `${label}.goalsFor debe ser un entero positivo o cero.`);
    check(Number.isInteger(match.goalsAgainst) && match.goalsAgainst >= 0, `${label}.goalsAgainst debe ser un entero positivo o cero.`);
  }
}

check(/^20\d{2}\/\d{2}$/.test(data.season), "season debe tener formato 2026/27.");
check(["eu", "es"].includes(data.defaultLanguage), "defaultLanguage debe ser eu o es.");
check(["provisional", "confirmed"].includes(data.rosterStatus), "rosterStatus debe ser provisional o confirmed.");
check(Array.isArray(data.players) && data.players.length > 0, "Debe existir al menos un jugador.");
check(Array.isArray(data.sponsors) && data.sponsors.length > 0, "Debe existir al menos un patrocinador.");
check(Array.isArray(data.gallery) && data.gallery.length > 0, "La galería no puede estar vacía.");
check(Array.isArray(data.matches), "matches debe ser una lista.");
check(Array.isArray(data.standings), "standings debe ser una lista.");
check(Array.isArray(data.playerStats), "playerStats debe ser una lista.");
check(Array.isArray(fafConfig.teamAliases) && fafConfig.teamAliases.length > 0, "Debe existir al menos un alias FAF del equipo.");
check(typeof fafConfig.teamUrl === "string" && typeof fafConfig.standingsUrl === "string", "Los enlaces FAF deben ser texto.");

const jerseyNumbers = new Set();
for (const player of data.players) {
  check(Number.isInteger(player.number) && player.number > 0 && player.number < 100, `Dorsal inválido: ${player.number}`);
  check(typeof player.name === "string" && player.name.trim(), `El dorsal ${player.number} no tiene nombre.`);
  check(!jerseyNumbers.has(player.number), `Dorsal repetido: ${player.number}`);
  jerseyNumbers.add(player.number);
}

for (const stat of data.playerStats) {
  check(jerseyNumbers.has(stat.number), `Las estadísticas usan un dorsal inexistente: ${stat.number}`);
  check(Number.isInteger(stat.goals) && stat.goals >= 0, `Goles inválidos para el dorsal ${stat.number}.`);
  check(Number.isInteger(stat.assists) && stat.assists >= 0, `Asistencias inválidas para el dorsal ${stat.number}.`);
}

for (const [index, match] of data.matches.entries()) {
  checkMatch(match, `matches[${index}]`, Number.isInteger(match?.goalsFor));
  check(Number.isInteger(match.round) && match.round > 0, `matches[${index}].round debe ser una jornada válida.`);
}

for (const [index, team] of data.standings.entries()) {
  check(Number.isInteger(team.position) && team.position > 0, `standings[${index}].position no es válida.`);
  check(typeof team.team === "string" && team.team.trim(), `standings[${index}].team es obligatorio.`);
  for (const field of ["points", "played", "won", "drawn", "lost", "goalsFor", "goalsAgainst"]) {
    check(Number.isInteger(team[field]) && team[field] >= 0, `standings[${index}].${field} no es válido.`);
  }
  check(typeof team.isArmentia === "boolean", `standings[${index}].isArmentia debe ser booleano.`);
}

const languages = Object.keys(data.translations);
check(languages.includes("eu") && languages.includes("es"), "Faltan las traducciones eu o es.");
const euKeys = Object.keys(data.translations.eu ?? {}).sort();
const esKeys = Object.keys(data.translations.es ?? {}).sort();
check(JSON.stringify(euKeys) === JSON.stringify(esKeys), "Las claves de traducción de eu y es no coinciden.");

for (const language of ["eu", "es"]) {
  for (const [key, value] of Object.entries(data.translations[language] ?? {})) {
    check(typeof value === "string" && value.trim(), `Traducción vacía: ${language}.${key}`);
  }
}

checkMatch(data.nextMatch, "nextMatch");
checkMatch(data.lastMatch, "lastMatch", true);

const assetPaths = new Set([
  ...data.sponsors.map((item) => item.logo),
  ...data.gallery.map((item) => item.src),
  "assets/images/escudo.png",
  "assets/images/gallery/equipo.jpg"
]);

for (const relativePath of assetPaths) {
  try {
    await access(resolve(root, relativePath));
  } catch {
    errors.push(`No existe el recurso: ${relativePath}`);
  }
}

const htmlIds = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
for (const match of html.matchAll(/href="#([^"]+)"/g)) {
  check(htmlIds.has(match[1]), `El enlace #${match[1]} no tiene un destino en index.html.`);
}

const cssBalance = [...css].reduce((balance, character) => {
  if (character === "{") return balance + 1;
  if (character === "}") return balance - 1;
  return balance;
}, 0);
check(cssBalance === 0, "style.css tiene llaves descompensadas.");
check(html.includes('src="script.js"'), "index.html no carga script.js.");
check(html.includes('href="style.css"'), "index.html no carga style.css.");

if (errors.length) {
  console.error(`Validación fallida (${errors.length} errores):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Validación correcta: ${data.players.length} jugadores, ${data.sponsors.length} patrocinadores y ${data.gallery.length} fotos.`);

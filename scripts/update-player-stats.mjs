import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const filePath = resolve(import.meta.dirname, "../data/site.json");
const data = JSON.parse(await readFile(filePath, "utf8"));
const number = Number.parseInt(process.env.PLAYER_NUMBER ?? "", 10);
const goals = Number.parseInt(process.env.GOALS ?? "0", 10);
const assists = Number.parseInt(process.env.ASSISTS ?? "0", 10);
const mode = process.env.MODE ?? "add";

if (!data.players.some((player) => player.number === number)) throw new Error(`No existe ningún jugador con el dorsal ${number}.`);
if (![goals, assists].every((value) => Number.isInteger(value) && value >= 0)) throw new Error("Goles y asistencias deben ser enteros positivos o cero.");
if (!["add", "set"].includes(mode)) throw new Error("MODE debe ser add o set.");

data.playerStats ??= [];
const existing = data.playerStats.find((player) => player.number === number);
if (existing) {
  existing.goals = mode === "add" ? existing.goals + goals : goals;
  existing.assists = mode === "add" ? existing.assists + assists : assists;
} else {
  data.playerStats.push({ number, goals, assists });
}
data.playerStats.sort((a, b) => a.number - b.number);

await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(`Estadísticas actualizadas para el dorsal ${number}.`);

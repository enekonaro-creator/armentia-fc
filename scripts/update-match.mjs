import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const filePath = resolve(import.meta.dirname, "../data/site.json");
const data = JSON.parse(await readFile(filePath, "utf8"));
const mode = process.env.MODE;

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta el campo obligatorio ${name}.`);
  return value;
}

function parseHome(value) {
  if (value === "home") return true;
  if (value === "away") return false;
  throw new Error("HOME_AWAY debe ser home o away.");
}

function baseMatch() {
  const date = required("DATE_TIME");
  if (Number.isNaN(Date.parse(date))) {
    throw new Error("DATE_TIME debe ser una fecha ISO válida, por ejemplo 2026-09-12T18:00:00+02:00.");
  }

  return {
    opponent: required("OPPONENT"),
    date,
    home: parseHome(required("HOME_AWAY")),
    venue: process.env.VENUE?.trim() ?? "",
    competition: {
      eu: process.env.COMPETITION_EU?.trim() || "2026/27 Liga",
      es: process.env.COMPETITION_ES?.trim() || "Liga 2026/27"
    }
  };
}

switch (mode) {
  case "next": {
    data.nextMatch = baseMatch();
    break;
  }
  case "result": {
    const goalsFor = Number.parseInt(required("GOALS_FOR"), 10);
    const goalsAgainst = Number.parseInt(required("GOALS_AGAINST"), 10);
    if (!Number.isInteger(goalsFor) || goalsFor < 0 || !Number.isInteger(goalsAgainst) || goalsAgainst < 0) {
      throw new Error("Los goles deben ser enteros positivos o cero.");
    }

    data.lastMatch = { ...baseMatch(), goalsFor, goalsAgainst };
    if (data.nextMatch?.opponent.toLowerCase() === data.lastMatch.opponent.toLowerCase()) {
      data.nextMatch = null;
    }
    break;
  }
  case "clear-next": {
    data.nextMatch = null;
    break;
  }
  default:
    throw new Error("MODE debe ser next, result o clear-next.");
}

await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(`data/site.json actualizado en modo ${mode}.`);

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const [html, css, javascript, data] = await Promise.all([
  readFile(resolve(root, "index.html"), "utf8"),
  readFile(resolve(root, "style.css"), "utf8"),
  readFile(resolve(root, "script.js"), "utf8"),
  readFile(resolve(root, "data/site.json"), "utf8")
]);

const previewScript = javascript.replace(
  /const response = await fetch\("data\/site\.json", \{ cache: "no-cache" \}\);[\s\S]*?state\.data = await response\.json\(\);/,
  `state.data = ${data.trim()};`
);

const preview = html
  .replace('<link rel="stylesheet" href="style.css">', `<style>${css}</style>`)
  .replace('<script src="script.js" defer></script>', "")
  .replace("</body>", `<script>${previewScript}</script></body>`)
  .replaceAll("assets/", "https://armentiafc.com/assets/");

await writeFile(resolve(root, ".preview.html"), preview, "utf8");
console.log("Vista previa creada en .preview.html");

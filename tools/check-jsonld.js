/*
 * Valide tous les blocs <script type="application/ld+json"> du site :
 * un JSON-LD malformé est ignoré silencieusement par Google — autant échouer ici.
 * Usage : node tools/check-jsonld.js   (code de sortie 1 si un bloc est invalide)
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "site");
let count = 0, errors = 0;

(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (path.extname(e.name) !== ".html") continue;
    const content = fs.readFileSync(p, "utf8");
    const blocks = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
    blocks.forEach(function (block, i) {
      const json = block
        .replace(/<\/?script[^>]*>/g, "")
        .split("__SITE_URL__").join("https://exemple.test/");
      try {
        JSON.parse(json);
        count++;
      } catch (err) {
        errors++;
        console.error("INVALIDE : " + path.relative(ROOT, p) + " (bloc " + (i + 1) + ") — " + err.message);
      }
    });
  }
})(ROOT);

console.log(count + " blocs JSON-LD valides, " + errors + " invalides");
process.exit(errors ? 1 : 0);

/*
 * Préparation du site avant déploiement (exécuté par la CI uniquement,
 * jamais commité : il modifie les fichiers en place dans le runner).
 *
 * 1. Remplace le jeton __SITE_URL__ (canonical, og:url, robots.txt) par l'URL réelle.
 * 2. Génère site/sitemap.xml à partir des pages HTML présentes.
 *
 * Usage : SITE_URL=https://exemple.github.io/facturelibre/ node tools/prepare-deploy.js
 */
"use strict";
const fs = require("fs");
const path = require("path");

const SITE = process.env.SITE_URL;
if (!SITE || !/^https?:\/\/.+\/$/.test(SITE)) {
  console.error("SITE_URL manquant ou invalide (doit finir par « / ») : " + SITE);
  process.exit(1);
}

const ROOT = path.join(__dirname, "..", "site");
const today = new Date().toISOString().slice(0, 10);
let tokensReplaced = 0;
const pages = [];

(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(p); continue; }
    const ext = path.extname(entry.name);
    if (ext !== ".html" && ext !== ".txt") continue;

    let content = fs.readFileSync(p, "utf8");
    const hits = (content.match(/__SITE_URL__/g) || []).length;
    if (hits) {
      content = content.split("__SITE_URL__").join(SITE);
      fs.writeFileSync(p, content);
      tokensReplaced += hits;
    }
    if (ext === ".html" && entry.name !== "404.html") {
      let rel = path.relative(ROOT, p).split(path.sep).join("/");
      if (rel.endsWith("index.html")) rel = rel.slice(0, -"index.html".length);
      pages.push(rel);
    }
  }
})(ROOT);

function priority(rel) {
  if (rel === "") return "1.0";
  if (rel === "pro.html") return "0.8";
  if (rel.startsWith("guides/")) return "0.7";
  return "0.3";
}

const xml = ['<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
  .concat(pages.sort().map(rel =>
    "  <url><loc>" + SITE + rel + "</loc><lastmod>" + today + "</lastmod><priority>" + priority(rel) + "</priority></url>"))
  .concat(["</urlset>", ""]).join("\n");

fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml);
console.log("URL injectée : " + SITE + " (" + tokensReplaced + " jetons remplacés)");
console.log("sitemap.xml : " + pages.length + " pages");

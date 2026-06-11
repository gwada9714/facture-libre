/*
 * Ping IndexNow après déploiement : signale les URLs du site aux moteurs
 * compatibles (Bing, Yandex, Seznam…). Gratuit, sans compte.
 * La clé est publique par conception : elle est hébergée à la racine du site
 * (site/<clé>.txt) et prouve que l'émetteur contrôle le domaine.
 *
 * Usage : SITE_URL=https://exemple.github.io/facture-libre/ node tools/indexnow.js
 */
"use strict";
const https = require("https");
const fs = require("fs");
const path = require("path");

const KEY = "f24f03e034c2b39b0697cd9795528ab7";
const SITE = process.env.SITE_URL || "https://gwada9714.github.io/facture-libre/";
if (!/^https:\/\/.+\/$/.test(SITE)) {
  console.error("SITE_URL invalide (doit finir par « / ») : " + SITE);
  process.exit(1);
}

/* Même périmètre que le sitemap : toutes les pages HTML sauf la 404. */
const ROOT = path.join(__dirname, "..", "site");
const urls = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (path.extname(e.name) !== ".html" || e.name === "404.html") continue;
    let rel = path.relative(ROOT, p).split(path.sep).join("/");
    if (rel.endsWith("index.html")) rel = rel.slice(0, -"index.html".length);
    urls.push(SITE + rel);
  }
})(ROOT);

const payload = JSON.stringify({
  host: new URL(SITE).host,
  key: KEY,
  keyLocation: SITE + KEY + ".txt",
  urlList: urls.sort()
});

const req = https.request({
  hostname: "api.indexnow.org",
  path: "/indexnow",
  method: "POST",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload)
  }
}, function (res) {
  /* 200 = pris en compte, 202 = accepté (vérification de clé en cours). */
  console.log("IndexNow : HTTP " + res.statusCode + " — " + urls.length + " URLs soumises");
  process.exit(res.statusCode === 200 || res.statusCode === 202 ? 0 : 1);
});
req.on("error", function (e) {
  console.error("IndexNow injoignable : " + e.message);
  process.exit(1);
});
req.write(payload);
req.end();

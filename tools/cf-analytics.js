/*
 * Rapport de trafic FactureLibre — Cloudflare Web Analytics (sans cookie), en lecture seule.
 *
 * Le token API n'est JAMAIS dans ce dépôt : il est lu depuis un fichier local hors dépôt
 *   %USERPROFILE%\.claude\facturelibre-secrets\cf-token.txt
 *   ligne 1 = token (Account Analytics: Read), ligne 2 = Account ID.
 * Le siteTag GraphQL (différent du token de balise public) est constant ci-dessous.
 *
 * Usage : node tools/cf-analytics.js [jours]      (défaut : 30)
 */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");

const SECRET = path.join(os.homedir(), ".claude", "facturelibre-secrets", "cf-token.txt");
const SITE_TAG = "36e35ea7491748cd8fa1c214c4f01c5a"; // RUM siteTag (≠ token de balise eb13f7…)
const WINDOW = Math.max(1, Math.min(365, parseInt(process.argv[2], 10) || 30));

function days(n) { return new Date(Date.now() - n * 864e5).toISOString().slice(0, 10); }

let TOKEN, ACC;
try {
  const L = fs.readFileSync(SECRET, "utf8").split(/\r?\n/);
  TOKEN = (L[0] || "").trim();
  ACC = (L[1] || "").trim();
} catch (e) {
  console.error("Token introuvable : " + SECRET + "\n(voir HUMAN_SETUP § D / tuto token)");
  process.exit(1);
}
if (!TOKEN || !ACC) { console.error("Fichier token incomplet (ligne 1 = token, ligne 2 = account id)."); process.exit(1); }

const F = `{ date_geq:"${days(WINDOW)}", date_leq:"${days(0)}", siteTag:"${SITE_TAG}" }`;
const query = `query{ viewer{ accounts(filter:{accountTag:"${ACC}"}){
  byDate: rumPageloadEventsAdaptiveGroups(limit:90, filter:${F}, orderBy:[date_ASC]){ count sum{visits} dimensions{date} }
  byPath: rumPageloadEventsAdaptiveGroups(limit:15, filter:${F}, orderBy:[count_DESC]){ count dimensions{requestPath} }
  byRef:  rumPageloadEventsAdaptiveGroups(limit:15, filter:${F}, orderBy:[count_DESC]){ count dimensions{refererHost} }
  byCountry: rumPageloadEventsAdaptiveGroups(limit:15, filter:${F}, orderBy:[count_DESC]){ count dimensions{countryName} }
}}}`;

(async () => {
  let j;
  try {
    const r = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: { "Authorization": "Bearer " + TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify({ query: query })
    });
    j = await r.json();
    if (!r.ok) { console.error("HTTP " + r.status); process.exit(1); }
  } catch (e) { console.error("Cloudflare injoignable : " + e.message); process.exit(1); }
  if (j.errors) { console.error("Erreurs GraphQL : " + JSON.stringify(j.errors)); process.exit(1); }

  const a = j.data.viewer.accounts[0];
  const pages = a.byDate.reduce((s, x) => s + x.count, 0);
  const visits = a.byDate.reduce((s, x) => s + x.sum.visits, 0);
  const ext = a.byRef.filter(x => x.dimensions.refererHost && x.dimensions.refererHost !== "gwada9714.github.io");

  console.log("FactureLibre — trafic sur " + WINDOW + " jours (" + days(WINDOW) + " → " + days(0) + ")");
  console.log("  Pages vues : " + pages + "   |   Visites (entrées) : " + visits);
  console.log("  Référents externes : " + (ext.length ? ext.map(x => x.dimensions.refererHost + " (" + x.count + ")").join(", ") : "aucun"));
  if (pages === 0) { console.log("  (aucune donnée sur la période)"); return; }
  console.log("\n  Par jour :");
  a.byDate.forEach(x => console.log("    " + x.dimensions.date + "  pages=" + x.count + "  visites=" + x.sum.visits));
  console.log("\n  Top pages :");
  a.byPath.forEach(x => console.log("    " + String(x.count).padStart(4) + "  " + x.dimensions.requestPath));
  console.log("\n  Provenance :");
  a.byRef.forEach(x => console.log("    " + String(x.count).padStart(4) + "  " + (x.dimensions.refererHost || "(direct / sans référent)")));
  console.log("\n  Pays :");
  a.byCountry.forEach(x => console.log("    " + String(x.count).padStart(4) + "  " + x.dimensions.countryName));
})();

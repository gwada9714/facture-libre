/*
 * Tests du moteur de calcul (site/assets/calc.js).
 * Zéro dépendance : node tools/test-calc.js
 * Échoue avec un code de sortie 1 si une assertion casse (utilisé comme gate de déploiement en CI).
 */
"use strict";
const assert = require("assert");
const C = require("../site/assets/calc.js");

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  OK   " + name); }
  catch (e) { failed++; console.error("  FAIL " + name + "\n       " + e.message); }
}

/* ---- Totaux ---- */

test("franchise de TVA : aucune TVA facturée", () => {
  const t = C.computeTotals([{ qty: 3, unitPrice: 100, vatRate: 20 }], { franchise: true });
  assert.strictEqual(t.totalHT, 300);
  assert.strictEqual(t.totalTVA, 0);
  assert.strictEqual(t.totalTTC, 300);
  assert.deepStrictEqual(t.vatByRate, {});
});

test("TVA 20 % : 100 HT -> 20 de TVA, 120 TTC", () => {
  const t = C.computeTotals([{ qty: 1, unitPrice: 100, vatRate: 20 }], {});
  assert.strictEqual(t.totalTVA, 20);
  assert.strictEqual(t.totalTTC, 120);
  assert.deepStrictEqual(t.vatByRate, { "20": 20 });
});

test("taux mixtes : ventilation 20 % et 10 %", () => {
  const t = C.computeTotals([
    { qty: 1, unitPrice: 100, vatRate: 20 },
    { qty: 2, unitPrice: 50, vatRate: 10 }
  ], {});
  assert.strictEqual(t.totalHT, 200);
  assert.strictEqual(t.vatByRate["20"], 20);
  assert.strictEqual(t.vatByRate["10"], 10);
  assert.strictEqual(t.totalTTC, 230);
});

test("pas de piège de flottants : 3 × 19,99 = 59,97", () => {
  const t = C.computeTotals([{ qty: 3, unitPrice: 19.99, vatRate: 0 }], {});
  assert.strictEqual(t.totalHT, 59.97);
});

test("quantité décimale : 0,5 × 33,33 = 16,67 (arrondi au centime)", () => {
  const t = C.computeTotals([{ qty: 0.5, unitPrice: 33.33 }], { franchise: true });
  assert.strictEqual(t.totalHT, 16.67);
});

test("TVA 5,5 % sur 200 = 11,00", () => {
  const r = C.computeLine({ qty: 1, unitPrice: 200, vatRate: 5.5 }, 0, false);
  assert.strictEqual(r.htCents, 20000);
  assert.strictEqual(r.tvaCents, 1100);
});

test("remise globale 10 % : 100 -> 90 HT, TVA sur le montant remisé", () => {
  const t = C.computeTotals([{ qty: 1, unitPrice: 100, vatRate: 20 }], { discountPct: 10 });
  assert.strictEqual(t.totalHT, 90);
  assert.strictEqual(t.totalTVA, 18);
});

test("remise aberrante (150 %) clampée à 100 %", () => {
  const t = C.computeTotals([{ qty: 1, unitPrice: 100 }], { discountPct: 150, franchise: true });
  assert.strictEqual(t.totalHT, 0);
});

test("entrées invalides neutralisées (qty négative, prix non numérique)", () => {
  const t = C.computeTotals([
    { qty: -3, unitPrice: 100 },
    { qty: 2, unitPrice: "abc" }
  ], { franchise: true });
  assert.strictEqual(t.totalHT, 0);
});

test("taux de TVA fourni en chaîne ('20') accepté", () => {
  const t = C.computeTotals([{ qty: 1, unitPrice: 50, vatRate: "20" }], {});
  assert.strictEqual(t.totalTVA, 10);
});

test("facture vide : tous les totaux à zéro", () => {
  const t = C.computeTotals([], {});
  assert.strictEqual(t.totalTTC, 0);
});

/* ---- Numérotation ---- */

test("formatInvoiceNumber : FAC-2026-007", () => {
  assert.strictEqual(C.formatInvoiceNumber("FAC", 2026, 7), "FAC-2026-007");
  assert.strictEqual(C.formatInvoiceNumber("", 2026, 1234), "FAC-2026-1234");
});

test("parseTrailingSeq : extrait la séquence finale", () => {
  assert.strictEqual(C.parseTrailingSeq("FAC-2026-012"), 12);
  assert.strictEqual(C.parseTrailingSeq("2026/45"), 45);
  assert.strictEqual(C.parseTrailingSeq("brouillon"), null);
});

/* ---- Dates ---- */

test("addDays : +30 jours, passage de mois et d'année", () => {
  assert.strictEqual(C.addDays("2026-06-10", 30), "2026-07-10");
  assert.strictEqual(C.addDays("2026-12-15", 30), "2027-01-14");
});

test("formatDateFR : 2026-06-10 -> 10/06/2026", () => {
  assert.strictEqual(C.formatDateFR("2026-06-10"), "10/06/2026");
  assert.strictEqual(C.formatDateFR("n'importe quoi"), "");
});

/* ---- SIRET ---- */

test("SIRET valide (clé de Luhn), espaces tolérés", () => {
  assert.strictEqual(C.isValidSiret("732 829 320 00074"), true);
});

test("SIRET invalide rejeté", () => {
  assert.strictEqual(C.isValidSiret("73282932000075"), false);
  assert.strictEqual(C.isValidSiret("123"), false);
  assert.strictEqual(C.isValidSiret(""), false);
});

/* ---- Formatage monétaire ---- */

test("formatEUR : symbole € présent", () => {
  const s = C.formatEUR(1234.5);
  assert.ok(s.indexOf("€") !== -1, "le symbole € doit apparaître : " + s);
});

console.log("\n" + passed + " réussis, " + failed + " échoués");
process.exit(failed ? 1 : 0);

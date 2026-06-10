/*
 * FactureLibre — moteur de calcul.
 * Fonctions pures, sans dépendance ni accès DOM : testées par tools/test-calc.js (Node)
 * et utilisées telles quelles par le navigateur (app.js, pdf.js).
 *
 * Convention : tous les calculs monétaires se font en CENTIMES (entiers)
 * pour éliminer les erreurs d'arrondi des flottants (0.1 + 0.2 !== 0.3).
 * L'arrondi est fait ligne par ligne (pratique comptable usuelle), au centime,
 * demi-centime arrondi au supérieur.
 */
(function (root) {
  "use strict";

  function toCents(x) {
    var n = Number(x);
    return isFinite(n) ? Math.round(n * 100) : 0;
  }
  function fromCents(c) {
    return c / 100;
  }

  /**
   * Calcule une ligne de facture.
   * line: { qty, unitPrice, vatRate } — discountPct: remise globale en %,
   * appliquée ligne par ligne avant TVA — franchise: true = franchise en base
   * de TVA (art. 293 B du CGI), aucune TVA facturée.
   */
  function computeLine(line, discountPct, franchise) {
    var qty = Number(line && line.qty);
    if (!isFinite(qty) || qty < 0) qty = 0;
    var puCents = toCents(line && line.unitPrice);
    var htCents = Math.round(qty * puCents);
    var pct = clampPct(discountPct);
    if (pct > 0) htCents = Math.round(htCents * (1 - pct / 100));
    var rate = franchise ? 0 : normalizeRate(line && line.vatRate);
    var tvaCents = Math.round(htCents * rate / 100);
    return { htCents: htCents, tvaCents: tvaCents, ttcCents: htCents + tvaCents, rate: rate };
  }

  function clampPct(p) {
    var n = Number(p);
    if (!isFinite(n) || n < 0) return 0;
    return Math.min(100, n);
  }

  function normalizeRate(r) {
    var n = Number(r);
    if (!isFinite(n) || n < 0) return 0;
    return n;
  }

  /**
   * Totaux de la facture.
   * Retourne des montants en euros (Number) + ventilation de TVA par taux.
   */
  function computeTotals(lines, opts) {
    opts = opts || {};
    var discountPct = clampPct(opts.discountPct);
    var franchise = !!opts.franchise;
    var totalHT = 0, totalTVA = 0;
    var vatByRate = {};
    (lines || []).forEach(function (line) {
      var r = computeLine(line, discountPct, franchise);
      totalHT += r.htCents;
      totalTVA += r.tvaCents;
      if (!franchise && r.rate > 0 && r.htCents !== 0) {
        vatByRate[r.rate] = (vatByRate[r.rate] || 0) + r.tvaCents;
      }
    });
    var vatOut = {};
    Object.keys(vatByRate).forEach(function (k) { vatOut[k] = fromCents(vatByRate[k]); });
    return {
      totalHT: fromCents(totalHT),
      totalTVA: fromCents(totalTVA),
      totalTTC: fromCents(totalHT + totalTVA),
      vatByRate: vatOut,
      discountPct: discountPct,
      franchise: franchise
    };
  }

  /* ----- Formatage ----- */

  var euroFmt = (typeof Intl !== "undefined" && Intl.NumberFormat)
    ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" })
    : null;

  function formatEUR(x) {
    var n = Number(x) || 0;
    if (euroFmt) return euroFmt.format(n);
    return n.toFixed(2).replace(".", ",") + " €";
  }

  /* Quantités : pas de zéros inutiles (2 plutôt que 2,00 — mais 1,5 conservé). */
  function formatQty(x) {
    var n = Number(x) || 0;
    return String(Math.round(n * 1000) / 1000).replace(".", ",");
  }

  /* "2026-06-10" -> "10/06/2026" (sans dépendre du fuseau horaire). */
  function formatDateFR(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
    var p = iso.split("-");
    return p[2] + "/" + p[1] + "/" + p[0];
  }

  /* Ajoute n jours à une date ISO (midi local pour éviter les bascules DST). */
  function addDays(iso, days) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
    var d = new Date(iso + "T12:00:00");
    d.setDate(d.getDate() + (Number(days) || 0));
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var j = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + j;
  }

  /* ----- Numérotation ----- */

  /* FAC-2026-007 : préfixe libre, année, séquence sur 3 chiffres minimum. */
  function formatInvoiceNumber(prefix, year, seq) {
    var p = String(prefix || "FAC").trim() || "FAC";
    return p + "-" + year + "-" + String(seq).padStart(3, "0");
  }

  /* Extrait la séquence finale d'un numéro saisi à la main ("FAC-2026-012" -> 12). */
  function parseTrailingSeq(number) {
    var m = String(number || "").match(/(\d+)\s*$/);
    return m ? parseInt(m[1], 10) : null;
  }

  /* ----- Validations (avertissement seulement, jamais bloquant) ----- */

  /*
   * SIRET : 14 chiffres + clé de Luhn.
   * (Exception connue : certains établissements de La Poste ne respectent pas
   * la clé — d'où un simple avertissement, jamais un blocage.)
   */
  function isValidSiret(s) {
    var digits = String(s || "").replace(/[\s.]/g, "");
    if (!/^\d{14}$/.test(digits)) return false;
    var sum = 0;
    for (var i = 0; i < 14; i++) {
      var d = digits.charCodeAt(i) - 48;
      if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
      sum += d;
    }
    return sum % 10 === 0;
  }

  var api = {
    toCents: toCents,
    fromCents: fromCents,
    computeLine: computeLine,
    computeTotals: computeTotals,
    formatEUR: formatEUR,
    formatQty: formatQty,
    formatDateFR: formatDateFR,
    addDays: addDays,
    formatInvoiceNumber: formatInvoiceNumber,
    parseTrailingSeq: parseTrailingSeq,
    isValidSiret: isValidSiret
  };

  root.FLCalc = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);

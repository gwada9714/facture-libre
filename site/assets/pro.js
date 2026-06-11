/*
 * FactureLibre — activation Pro (sans serveur).
 * Le code saisi est haché en SHA-256 (Web Crypto) et comparé aux empreintes
 * publiées dans config.js : le code en clair n'apparaît jamais dans le dépôt
 * (public). L'activation est mémorisée dans le navigateur (localStorage).
 * Système déclaratif assumé pour la v1 — voir DECISIONS.md D-010.
 */
(function () {
  "use strict";

  var KEY = "fl.pro.v1";

  function validHashes() {
    var cfg = window.FLConfig || {};
    return Array.isArray(cfg.proCodeHashes) ? cfg.proCodeHashes : [];
  }

  function normalize(code) {
    return String(code || "").trim().toUpperCase().replace(/\s+/g, "");
  }

  function sha256Hex(text) {
    var data = new TextEncoder().encode(text);
    return crypto.subtle.digest("SHA-256", data).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return b.toString(16).padStart(2, "0");
      }).join("");
    });
  }

  function isPro() {
    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || "null");
      return !!(saved && validHashes().indexOf(saved.hash) !== -1);
    } catch (e) { return false; }
  }

  function activate(rawCode) {
    var code = normalize(rawCode);
    if (!code) return Promise.resolve({ ok: false, reason: "vide" });
    if (!(window.crypto && crypto.subtle)) return Promise.resolve({ ok: false, reason: "navigateur" });
    return sha256Hex(code).then(function (h) {
      if (validHashes().indexOf(h) === -1) return { ok: false, reason: "invalide" };
      try { localStorage.setItem(KEY, JSON.stringify({ hash: h, at: new Date().toISOString() })); } catch (e) {}
      return { ok: true };
    });
  }

  function promptActivate() {
    var code = prompt("Entrez votre code d'activation Pro (reçu sur la page de confirmation après l'achat) :");
    if (code === null) return;
    activate(code).then(function (r) {
      if (r.ok) {
        alert("FactureLibre Pro est activé sur ce navigateur. Merci de soutenir l'outil !");
        location.reload();
      } else if (r.reason === "navigateur") {
        alert("Activation impossible : ce navigateur ne propose pas Web Crypto (trop ancien ?).");
      } else {
        alert("Code invalide. Vérifiez la saisie (format FLPRO-XXXX-XXXX).");
      }
    });
  }

  window.FLPro = { isPro: isPro, activate: activate, promptActivate: promptActivate };
})();

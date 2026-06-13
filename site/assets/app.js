/*
 * FactureLibre — logique applicative.
 * Tout est local : état en mémoire + persistance localStorage (aucun réseau).
 * L'aperçu est reconstruit en DOM pur (textContent) : aucune donnée utilisateur
 * n'est injectée en innerHTML, par sécurité (XSS).
 */
(function () {
  "use strict";

  var C = window.FLCalc;
  var $ = function (sel) { return document.querySelector(sel); };
  /* Évalué au chargement : l'activation Pro recharge la page (pro.js). */
  var IS_PRO = !!(window.FLPro && window.FLPro.isPro());

  var LS = {
    emitter: "fl.emitter.v1",
    draft: "fl.draft.v1",
    counter: "fl.counter.v1",
    history: "fl.history.v1"
  };

  /* localStorage peut être indisponible (navigation privée stricte) : on dégrade sans casser. */
  function lsGet(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function lsSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* mode privé : tant pis */ }
  }

  var DEFAULT_MENTIONS = "Pas d'escompte pour règlement anticipé.\n" +
    "Pénalités de retard : trois fois le taux d'intérêt légal annuel. " +
    "Indemnité forfaitaire pour frais de recouvrement : 40 € (clients professionnels, art. L441-10 du Code de commerce).";

  /* Les mentions de retard de paiement n'ont pas de sens sur un avoir. */
  var DEFAULT_MENTIONS_AVOIR = "Avoir établi en régularisation de la facture susvisée. " +
    "Il vient en déduction du montant dû ; si la facture concernée a déjà été réglée, il donne lieu à remboursement.";

  var UNITS = ["unité", "heure", "jour", "forfait", "mois"];
  var VAT_RATES = ["20", "10", "5.5", "2.1", "0"];

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  /* ----- Compteur de numérotation (séquences annuelles, jamais décrémentées) -----
   * Deux séries distinctes (recommandation du guide « facture d'avoir ») :
   * factures FAC-AAAA-NNN, avoirs AV-AAAA-NNN. Stockées dans un seul objet,
   * rétrocompatible avec l'ancien format { year, seq }. */

  function getCounter() {
    var y = new Date().getFullYear();
    var c = lsGet(LS.counter, null);
    if (!c || c.year !== y) c = { year: y, seq: 1, avoirSeq: 1 };
    if (c.avoirSeq == null) c.avoirSeq = 1; // migration depuis l'ancien format
    return c;
  }
  function peekNumber(docType) {
    var c = getCounter();
    return docType === "avoir"
      ? C.formatInvoiceNumber("AV", c.year, c.avoirSeq)
      : C.formatInvoiceNumber("FAC", c.year, c.seq);
  }
  /* Consomme la bonne séquence en s'alignant sur le numéro réellement utilisé (saisie manuelle incluse). */
  function bumpCounter(usedNumber, docType) {
    var c = getCounter();
    var n = C.parseTrailingSeq(usedNumber);
    if (docType === "avoir") {
      c.avoirSeq = (n !== null) ? Math.max(c.avoirSeq, n + 1) : c.avoirSeq + 1;
    } else {
      c.seq = (n !== null) ? Math.max(c.seq, n + 1) : c.seq + 1;
    }
    lsSet(LS.counter, c);
  }

  /* ----- État ----- */

  function freshLine() {
    return { desc: "", qty: 1, unit: "unité", unitPrice: "", vatRate: "20" };
  }

  function freshState() {
    var em = lsGet(LS.emitter, null) || {
      name: "", address: "", siret: "", email: "", phone: "",
      iban: "", bic: "", vat: "", franchise: true, logo: null
    };
    return {
      emitter: em,
      client: { name: "", address: "", siret: "" },
      invoice: {
        docType: "facture", originalRef: "",
        number: peekNumber("facture"), date: todayISO(), due: C.addDays(todayISO(), 30), payment: "Virement bancaire"
      },
      lines: [freshLine()],
      discountPct: "",
      mentions: DEFAULT_MENTIONS,
      savedId: null
    };
  }

  var state = lsGet(LS.draft, null) || freshState();
  /* Robustesse : un brouillon corrompu ou d'une version antérieure ne doit pas bloquer l'outil. */
  if (!state || !state.emitter || !state.invoice || !Array.isArray(state.lines)) state = freshState();
  if (!state.lines.length) state.lines = [freshLine()];
  /* Migration des brouillons d'avant l'ajout des avoirs. */
  if (!state.invoice.docType) state.invoice.docType = "facture";
  if (state.invoice.originalRef == null) state.invoice.originalRef = "";

  function isAvoir() { return state.invoice.docType === "avoir"; }

  var persistTimer = null;
  function persist() {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(function () {
      lsSet(LS.draft, state);
      lsSet(LS.emitter, state.emitter);
    }, 250);
  }

  /* ----- Liaison des champs fixes ----- */

  var bindings = [
    ["#em-name", function () { return state.emitter.name; }, function (v) { state.emitter.name = v; }],
    ["#em-address", function () { return state.emitter.address; }, function (v) { state.emitter.address = v; }],
    ["#em-siret", function () { return state.emitter.siret; }, function (v) { state.emitter.siret = v; }],
    ["#em-email", function () { return state.emitter.email; }, function (v) { state.emitter.email = v; }],
    ["#em-phone", function () { return state.emitter.phone; }, function (v) { state.emitter.phone = v; }],
    ["#em-vat", function () { return state.emitter.vat; }, function (v) { state.emitter.vat = v; }],
    ["#em-iban", function () { return state.emitter.iban; }, function (v) { state.emitter.iban = v; }],
    ["#em-bic", function () { return state.emitter.bic; }, function (v) { state.emitter.bic = v; }],
    ["#cl-name", function () { return state.client.name; }, function (v) { state.client.name = v; }],
    ["#cl-address", function () { return state.client.address; }, function (v) { state.client.address = v; }],
    ["#cl-siret", function () { return state.client.siret; }, function (v) { state.client.siret = v; }],
    ["#inv-number", function () { return state.invoice.number; }, function (v) { state.invoice.number = v; }],
    ["#inv-ref", function () { return state.invoice.originalRef; }, function (v) { state.invoice.originalRef = v; }],
    ["#inv-date", function () { return state.invoice.date; }, function (v) { state.invoice.date = v; }],
    ["#inv-due", function () { return state.invoice.due; }, function (v) { state.invoice.due = v; }],
    ["#inv-payment", function () { return state.invoice.payment; }, function (v) { state.invoice.payment = v; }],
    ["#inv-discount", function () { return state.discountPct; }, function (v) { state.discountPct = v; }],
    ["#inv-mentions", function () { return state.mentions; }, function (v) { state.mentions = v; }]
  ];

  function hydrateInputs() {
    bindings.forEach(function (b) {
      var el = $(b[0]);
      if (el) el.value = b[1]() == null ? "" : b[1]();
    });
    $("#em-franchise").checked = !!state.emitter.franchise;
    $("#invoice-form").classList.toggle("franchise-on", !!state.emitter.franchise);
    renderDocType();
  }

  /* Reflète le type de document (facture/avoir) dans l'UI du formulaire. */
  function renderDocType() {
    var avoir = isAvoir();
    $("#invoice-form").classList.toggle("avoir-on", avoir);
    $("#doctype-facture").classList.toggle("is-active", !avoir);
    $("#doctype-avoir").classList.toggle("is-active", avoir);
    $("#doctype-facture").setAttribute("aria-checked", avoir ? "false" : "true");
    $("#doctype-avoir").setAttribute("aria-checked", avoir ? "true" : "false");
    $("#ref-field").hidden = !avoir;
    $("#inv-date-label").textContent = avoir ? "Date de l'avoir" : "Date d'émission";
  }

  function bindInputs() {
    bindings.forEach(function (b) {
      var el = $(b[0]);
      if (!el) return;
      el.addEventListener("input", function () {
        b[2](el.value);
        update();
      });
    });
    $("#em-franchise").addEventListener("change", function () {
      state.emitter.franchise = this.checked;
      $("#invoice-form").classList.toggle("franchise-on", this.checked);
      update();
    });
    $("#em-siret").addEventListener("input", function () { warnSiret(this, "#em-siret-warn"); });
    $("#cl-siret").addEventListener("input", function () { warnSiret(this, "#cl-siret-warn"); });

    $("#doctype-facture").addEventListener("click", function () { setDocType("facture"); });
    $("#doctype-avoir").addEventListener("click", function () { setDocType("avoir"); });
  }

  /* Un numéro « auto » suit le motif PREFIXE-AAAA-NNN ; un numéro saisi à la main
   * (format personnel) ne correspond pas et ne doit pas être écrasé à la bascule. */
  function looksAuto(number, type) {
    var prefix = type === "avoir" ? "AV" : "FAC";
    return new RegExp("^" + prefix + "-\\d{4}-\\d+$").test(String(number || ""));
  }

  /*
   * Bascule facture/avoir. Renumérote dans la bonne série tant que le numéro n'a pas
   * été personnalisé ; n'écrase les mentions que si elles sont restées au texte par
   * défaut (on respecte les saisies de l'utilisateur).
   */
  function setDocType(type) {
    if (state.invoice.docType === type) return;
    var prevType = state.invoice.docType;
    if (looksAuto(state.invoice.number, prevType)) state.invoice.number = peekNumber(type);
    if (type === "avoir" && state.mentions === DEFAULT_MENTIONS) state.mentions = DEFAULT_MENTIONS_AVOIR;
    else if (type === "facture" && state.mentions === DEFAULT_MENTIONS_AVOIR) state.mentions = DEFAULT_MENTIONS;
    state.invoice.docType = type;
    hydrateInputs();
    update();
  }

  /* Avertissement SIRET : informatif, jamais bloquant (exceptions connues, ex. La Poste). */
  function warnSiret(input, warnSel) {
    var v = input.value.replace(/[\s.]/g, "");
    var bad = v.length > 0 && !C.isValidSiret(v);
    input.setAttribute("aria-invalid", bad ? "true" : "false");
    $(warnSel).textContent = bad ? "Ce SIRET semble invalide (14 chiffres attendus) — vérifiez la saisie." : "";
  }

  /* ----- Lignes de prestations ----- */

  var linesBox = $("#lines");

  function makeField(cls, el) { el.classList.add(cls); return el; }

  function renderLines() {
    linesBox.textContent = "";
    state.lines.forEach(function (line, i) {
      var row = document.createElement("div");
      row.className = "line-row";

      var desc = makeField("f-desc", document.createElement("input"));
      desc.type = "text"; desc.placeholder = "Création du site vitrine — acompte"; desc.value = line.desc;
      desc.setAttribute("aria-label", "Désignation ligne " + (i + 1));
      desc.addEventListener("input", function () { line.desc = desc.value; update(); });

      var qty = makeField("f-qty", document.createElement("input"));
      qty.type = "number"; qty.min = "0"; qty.step = "0.01"; qty.value = line.qty;
      qty.setAttribute("aria-label", "Quantité ligne " + (i + 1));
      qty.addEventListener("input", function () { line.qty = qty.value; updateRowTotal(); update(); });

      var unit = makeField("f-unit", document.createElement("select"));
      unit.setAttribute("aria-label", "Unité ligne " + (i + 1));
      UNITS.forEach(function (u) {
        var o = document.createElement("option");
        o.value = u; o.textContent = u; if (u === line.unit) o.selected = true;
        unit.appendChild(o);
      });
      unit.addEventListener("change", function () { line.unit = unit.value; update(); });

      var pu = makeField("f-pu", document.createElement("input"));
      pu.type = "number"; pu.min = "0"; pu.step = "0.01"; pu.placeholder = "0,00"; pu.value = line.unitPrice;
      pu.setAttribute("aria-label", "Prix unitaire HT ligne " + (i + 1));
      pu.addEventListener("input", function () { line.unitPrice = pu.value; updateRowTotal(); update(); });

      var vat = makeField("f-vat", document.createElement("select"));
      vat.classList.add("vat-col");
      vat.setAttribute("aria-label", "Taux de TVA ligne " + (i + 1));
      VAT_RATES.forEach(function (r) {
        var o = document.createElement("option");
        o.value = r; o.textContent = r.replace(".", ",") + " %"; if (r === String(line.vatRate)) o.selected = true;
        vat.appendChild(o);
      });
      vat.addEventListener("change", function () { line.vatRate = vat.value; updateRowTotal(); update(); });

      var total = document.createElement("span");
      total.className = "line-total";

      var del = document.createElement("button");
      del.type = "button"; del.className = "btn-x"; del.textContent = "×";
      del.setAttribute("aria-label", "Supprimer la ligne " + (i + 1));
      del.addEventListener("click", function () {
        state.lines.splice(i, 1);
        if (!state.lines.length) state.lines.push(freshLine());
        renderLines();
        update();
      });

      function updateRowTotal() {
        var r = C.computeLine(line, state.discountPct, state.emitter.franchise);
        total.textContent = C.formatEUR(C.fromCents(r.htCents));
      }
      updateRowTotal();

      row.appendChild(desc); row.appendChild(qty); row.appendChild(unit);
      row.appendChild(pu); row.appendChild(vat); row.appendChild(total); row.appendChild(del);
      linesBox.appendChild(row);
    });
  }

  /* ----- Aperçu (DOM pur, jamais d'innerHTML avec données utilisateur) ----- */

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderPreview() {
    var sheet = $("#invoice-sheet");
    sheet.textContent = "";
    var avoir = isAvoir();
    sheet.classList.toggle("is-avoir", avoir);
    var totals = C.computeTotals(state.lines, { discountPct: state.discountPct, franchise: state.emitter.franchise });

    /* En-tête : émetteur + bloc méta */
    var head = el("div", "inv-head");
    var emBox = el("div", "inv-emitter");
    if (IS_PRO && state.emitter.logo && state.emitter.logo.dataUrl) {
      var logoImg = document.createElement("img");
      logoImg.className = "inv-logo";
      logoImg.src = state.emitter.logo.dataUrl;
      logoImg.alt = "";
      emBox.appendChild(logoImg);
    }
    emBox.appendChild(el("div", "name", state.emitter.name || "Votre nom"));
    if (state.emitter.address) emBox.appendChild(el("div", null, state.emitter.address));
    if (state.emitter.siret) emBox.appendChild(el("div", null, "SIRET : " + state.emitter.siret));
    if (state.emitter.vat && !state.emitter.franchise) emBox.appendChild(el("div", null, "TVA : " + state.emitter.vat));
    var contact = [state.emitter.email, state.emitter.phone].filter(Boolean).join(" · ");
    if (contact) emBox.appendChild(el("div", null, contact));
    head.appendChild(emBox);

    var meta = el("div", "inv-meta");
    meta.appendChild(el("div", "inv-title", avoir ? "AVOIR" : "FACTURE"));
    var mt = document.createElement("table");
    var metaRows = [[avoir ? "Avoir n°" : "N°", state.invoice.number || "—"],
                    [avoir ? "Émis le" : "Émise le", C.formatDateFR(state.invoice.date) || "—"]];
    if (!avoir) metaRows.push(["Échéance", C.formatDateFR(state.invoice.due) || "—"]);
    metaRows.forEach(function (pair) {
      var tr = document.createElement("tr");
      tr.appendChild(el("td", null, pair[0]));
      tr.appendChild(el("td", null, pair[1]));
      mt.appendChild(tr);
    });
    meta.appendChild(mt);
    head.appendChild(meta);
    sheet.appendChild(head);

    /* Avoir : référence à la facture d'origine (mention qui donne son sens au document) */
    if (avoir) {
      var ref = el("div", "inv-ref");
      ref.appendChild(el("span", "tag", "Avoir sur facture "));
      ref.appendChild(document.createTextNode(state.invoice.originalRef || "n° … (à préciser)"));
      sheet.appendChild(ref);
    }

    /* Client */
    var cl = el("div", "inv-client");
    cl.appendChild(el("div", "tag", "Facturé à"));
    cl.appendChild(el("div", "name", state.client.name || "Nom du client"));
    if (state.client.address) cl.appendChild(el("div", null, state.client.address));
    if (state.client.siret) cl.appendChild(el("div", null, "SIRET : " + state.client.siret));
    sheet.appendChild(cl);

    /* Tableau des prestations */
    var table = document.createElement("table");
    table.className = "inv-table";
    var thead = document.createElement("thead");
    var hr = document.createElement("tr");
    hr.appendChild(el("th", null, "Désignation"));
    hr.appendChild(el("th", "num", "Qté"));
    hr.appendChild(el("th", null, "Unité"));
    hr.appendChild(el("th", "num", "PU HT"));
    if (!state.emitter.franchise) hr.appendChild(el("th", "num", "TVA"));
    hr.appendChild(el("th", "num", "Total HT"));
    thead.appendChild(hr);
    table.appendChild(thead);
    var tbody = document.createElement("tbody");
    var hasContent = false;
    state.lines.forEach(function (line) {
      if (!line.desc && !Number(line.unitPrice)) return;
      hasContent = true;
      var r = C.computeLine(line, state.discountPct, state.emitter.franchise);
      var tr = document.createElement("tr");
      tr.appendChild(el("td", null, line.desc || "—"));
      tr.appendChild(el("td", "num", C.formatQty(line.qty)));
      tr.appendChild(el("td", null, line.unit));
      tr.appendChild(el("td", "num", C.formatEUR(line.unitPrice || 0)));
      if (!state.emitter.franchise) tr.appendChild(el("td", "num", String(r.rate).replace(".", ",") + " %"));
      tr.appendChild(el("td", "num", C.formatEUR(C.fromCents(r.htCents))));
      tbody.appendChild(tr);
    });
    if (!hasContent) {
      var tr0 = document.createElement("tr");
      var td0 = el("td", "inv-empty", "Ajoutez vos prestations à gauche : l'aperçu se met à jour instantanément.");
      td0.colSpan = state.emitter.franchise ? 5 : 6;
      tr0.appendChild(td0);
      tbody.appendChild(tr0);
    }
    table.appendChild(tbody);
    sheet.appendChild(table);

    /* Totaux */
    var tot = el("div", "inv-totals");
    if (Number(state.discountPct) > 0) {
      tot.appendChild(rowKV("Remise appliquée", String(state.discountPct).replace(".", ",") + " %", "muted"));
    }
    tot.appendChild(rowKV("Total HT", C.formatEUR(totals.totalHT)));
    if (state.emitter.franchise) {
      tot.appendChild(rowKV("TVA", "non applicable", "muted"));
    } else {
      Object.keys(totals.vatByRate).sort(function (a, b) { return b - a; }).forEach(function (rate) {
        tot.appendChild(rowKV("TVA " + String(rate).replace(".", ",") + " %", C.formatEUR(totals.vatByRate[rate])));
      });
    }
    tot.appendChild(rowKV(avoir ? "Montant de l'avoir" : "Net à payer", C.formatEUR(totals.totalTTC), "grand"));
    sheet.appendChild(tot);

    /* Franchise : mention obligatoire bien visible */
    if (state.emitter.franchise) {
      var fr = el("div", null, "TVA non applicable, art. 293 B du CGI");
      fr.style.cssText = "font-size:.8em;color:#666;text-align:right;margin-top:4px;font-style:italic";
      sheet.appendChild(fr);
    }

    /* Règlement (facture) ou remboursement/imputation (avoir) */
    var pay = el("div", "inv-pay");
    var payLines = [];
    if (avoir) {
      pay.appendChild(el("div", "t", "Remboursement"));
      payLines.push("Montant à votre crédit : " + C.formatEUR(totals.totalTTC) + ".");
      payLines.push("À imputer sur la facture " + (state.invoice.originalRef || "concernée") + ", ou à rembourser.");
    } else {
      pay.appendChild(el("div", "t", "Règlement"));
      if (state.invoice.payment) payLines.push("Mode de règlement : " + state.invoice.payment);
      if (state.emitter.iban) payLines.push("IBAN : " + state.emitter.iban + (state.emitter.bic ? " — BIC : " + state.emitter.bic : ""));
      if (state.invoice.due) payLines.push("À régler au plus tard le " + C.formatDateFR(state.invoice.due));
    }
    payLines.forEach(function (l) { pay.appendChild(el("div", null, l)); });
    sheet.appendChild(pay);

    /* Mentions */
    if (state.mentions) sheet.appendChild(el("div", "inv-mentions", state.mentions));

    /* La discrète ligne de promotion disparaît en Pro. */
    if (!IS_PRO) {
      var foot = el("div", "inv-foot", "Document créé avec FactureLibre — générateur gratuit pour micro-entrepreneurs");
      sheet.appendChild(foot);
    }
  }

  function rowKV(k, v, cls) {
    var row = el("div", "row" + (cls ? " " + cls : ""));
    row.appendChild(el("span", null, k));
    row.appendChild(el("span", null, v));
    return row;
  }

  function update() {
    renderPreview();
    persist();
  }

  /* ----- Historique ----- */

  function getHistory() { return lsGet(LS.history, []); }

  function saveToHistory() {
    var totals = C.computeTotals(state.lines, { discountPct: state.discountPct, franchise: state.emitter.franchise });
    var hist = getHistory();
    if (!state.savedId) state.savedId = "f" + Date.now() + Math.random().toString(36).slice(2, 7);
    var entry = {
      id: state.savedId,
      number: state.invoice.number,
      docType: state.invoice.docType,
      client: state.client.name,
      date: state.invoice.date,
      ttc: totals.totalTTC,
      savedAt: new Date().toISOString(),
      state: JSON.parse(JSON.stringify({ // instantané profond, sans savedId imbriqué
        emitter: state.emitter, client: state.client, invoice: state.invoice,
        lines: state.lines, discountPct: state.discountPct, mentions: state.mentions
      }))
    };
    var idx = hist.findIndex(function (h) { return h.id === entry.id; });
    if (idx >= 0) hist[idx] = entry; else hist.unshift(entry);
    if (hist.length > 100) hist.length = 100;
    lsSet(LS.history, hist);
    bumpCounter(state.invoice.number, state.invoice.docType);
    renderHistory();
    persist();
  }

  function renderHistory() {
    var hist = getHistory();
    var ul = $("#history-list");
    ul.textContent = "";
    $("#history-empty").style.display = hist.length ? "none" : "";
    hist.forEach(function (h) {
      var li = document.createElement("li");
      li.appendChild(el("span", "num", h.number));
      var who = (h.docType === "avoir" ? "Avoir · " : "") + (h.client || "—") + " · " + (C.formatDateFR(h.date) || "");
      li.appendChild(el("span", "who", who));
      li.appendChild(el("span", "amt", C.formatEUR(h.ttc)));
      var acts = el("span", "acts");
      acts.appendChild(histBtn("Rouvrir", function () { loadEntry(h, true); }));
      acts.appendChild(histBtn("Dupliquer", function () { loadEntry(h, false); }));
      /* Un avoir ne s'établit que sur une facture (pas sur un autre avoir). */
      if (h.docType !== "avoir") acts.appendChild(histBtn("Avoir", function () { makeAvoirFrom(h); }));
      acts.appendChild(histBtn("Suppr.", function () {
        if (!confirm("Supprimer " + h.number + " de l'historique ?")) return;
        lsSet(LS.history, getHistory().filter(function (x) { return x.id !== h.id; }));
        renderHistory();
      }));
      li.appendChild(acts);
      ul.appendChild(li);
    });
  }

  function histBtn(label, fn) {
    var b = document.createElement("button");
    b.type = "button"; b.textContent = label;
    b.addEventListener("click", fn);
    return b;
  }

  function loadEntry(h, keepIdentity) {
    var s = JSON.parse(JSON.stringify(h.state));
    state.emitter = s.emitter; state.client = s.client; state.invoice = s.invoice;
    state.lines = s.lines && s.lines.length ? s.lines : [freshLine()];
    state.discountPct = s.discountPct; state.mentions = s.mentions;
    /* Rétrocompat : entrées archivées avant l'ajout des avoirs. */
    if (!state.invoice.docType) state.invoice.docType = "facture";
    if (state.invoice.originalRef == null) state.invoice.originalRef = "";
    if (keepIdentity) {
      state.savedId = h.id;
    } else {
      state.savedId = null;
      state.invoice.number = peekNumber(state.invoice.docType);
      state.invoice.date = todayISO();
      state.invoice.due = isAvoir() ? "" : C.addDays(todayISO(), 30);
    }
    hydrateInputs(); renderLines(); update();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* Établit un avoir à partir d'une facture archivée : reprend client et lignes,
   * référence la facture d'origine, numérote dans la série AV (le guide « facture d'avoir »). */
  function makeAvoirFrom(h) {
    var s = JSON.parse(JSON.stringify(h.state));
    state.emitter = s.emitter; state.client = s.client;
    state.lines = s.lines && s.lines.length ? s.lines : [freshLine()];
    state.discountPct = s.discountPct;
    state.mentions = DEFAULT_MENTIONS_AVOIR;
    state.savedId = null;
    state.invoice = {
      docType: "avoir",
      originalRef: h.number + " du " + (C.formatDateFR(h.date) || ""),
      number: peekNumber("avoir"),
      date: todayISO(),
      due: "",
      payment: s.invoice && s.invoice.payment ? s.invoice.payment : "Virement bancaire"
    };
    hydrateInputs(); renderLines(); update();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ----- Actions ----- */

  function validateBeforeExport() {
    var missing = [];
    if (!state.emitter.name.trim()) missing.push("votre nom (section 1)");
    if (!state.emitter.siret.trim()) missing.push("votre SIRET (section 1)");
    if (!state.client.name.trim()) missing.push("le nom du client (section 2)");
    var hasLine = state.lines.some(function (l) { return l.desc.trim() && Number(l.qty) > 0; });
    if (!hasLine) missing.push("au moins une prestation avec désignation (section 4)");
    if (isAvoir() && !state.invoice.originalRef.trim()) missing.push("la facture d'origine concernée (section 3)");
    if (missing.length) {
      alert("Avant d'exporter, complétez : \n– " + missing.join("\n– "));
      return false;
    }
    return true;
  }

  function bindActions() {
    $("#btn-add-line").addEventListener("click", function () {
      state.lines.push(freshLine());
      renderLines();
      update();
      var rows = linesBox.querySelectorAll(".line-row .f-desc");
      rows[rows.length - 1].focus();
    });

    $("#btn-pdf").addEventListener("click", function () {
      if (!validateBeforeExport()) return;
      saveToHistory();
      var totals = C.computeTotals(state.lines, { discountPct: state.discountPct, franchise: state.emitter.franchise });
      try {
        window.FLPDF.generate(state, totals);
      } catch (e) {
        alert("L'export PDF a rencontré un problème (" + e.message + "). Utilisez « Imprimer » > « Enregistrer en PDF » en attendant.");
      }
    });

    $("#btn-print").addEventListener("click", function () { window.print(); });

    $("#btn-new").addEventListener("click", function () {
      var hasWork = state.client.name || state.lines.some(function (l) { return l.desc; });
      if (hasWork && !state.savedId) {
        if (confirm("Archiver la facture en cours dans « Mes factures » avant d'en créer une nouvelle ?\n(Annuler = nouvelle facture sans archiver)")) {
          saveToHistory();
        }
      }
      var em = state.emitter;
      state = freshState();
      state.emitter = em;
      hydrateInputs(); renderLines(); update();
    });
  }

  /* ----- Pro : logo, export CSV, activation ----- */

  function handleLogoFile(file) {
    if (!file) return;
    if (!/^image\/(png|jpeg)$/.test(file.type)) {
      $("#logo-warn").textContent = "Format accepté : PNG ou JPEG.";
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        /* Réduction à 600 px max : un logo en localStorage doit rester léger. */
        var MAX = 600;
        var scale = Math.min(1, MAX / img.width);
        var canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        var isPng = file.type === "image/png";
        state.emitter.logo = {
          dataUrl: isPng ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.85),
          w: canvas.width,
          h: canvas.height
        };
        $("#logo-warn").textContent = "";
        renderLogoUI();
        update();
      };
      img.onerror = function () { $("#logo-warn").textContent = "Image illisible."; };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function renderLogoUI() {
    var has = !!(state.emitter.logo && state.emitter.logo.dataUrl);
    var prev = $("#logo-preview"), clear = $("#btn-logo-clear");
    if (!prev) return;
    prev.hidden = !has;
    clear.hidden = !has;
    if (has) prev.src = state.emitter.logo.dataUrl;
  }

  function exportCSV() {
    if (!IS_PRO) {
      if (confirm("L'export CSV pour la comptabilité fait partie de FactureLibre Pro. Voir l'offre ?")) {
        location.href = "pro.html";
      }
      return;
    }
    var hist = getHistory();
    if (!hist.length) { alert("Aucune facture dans l'historique à exporter."); return; }
    var sep = ";";
    function num(x) { return x.toFixed(2).replace(".", ","); }
    function field(s) { s = String(s == null ? "" : s); return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
    var lines = [["Type", "Numero", "Date", "Client", "Total HT", "TVA", "Total TTC"].join(sep)];
    hist.slice().reverse().forEach(function (h) {
      var t = C.computeTotals(h.state.lines, { discountPct: h.state.discountPct, franchise: h.state.emitter.franchise });
      /* Un avoir vient en déduction : montants négatifs pour une somme comptable juste. */
      var avoir = h.docType === "avoir";
      var sign = avoir ? -1 : 1;
      lines.push([avoir ? "Avoir" : "Facture", field(h.number), C.formatDateFR(h.date), field(h.client),
        num(sign * t.totalHT), num(sign * t.totalTVA), num(sign * t.totalTTC)].join(sep));
    });
    /* BOM UTF-8 : Excel français ouvre le fichier avec les accents corrects. */
    var blob = new Blob([String.fromCharCode(0xFEFF) + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "factures-" + todayISO() + ".csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function initProUI() {
    var logoInput = $("#em-logo");
    if (logoInput) {
      if (IS_PRO) {
        logoInput.addEventListener("change", function () { handleLogoFile(this.files[0]); this.value = ""; });
        $("#btn-logo-clear").addEventListener("click", function () {
          state.emitter.logo = null;
          renderLogoUI();
          update();
        });
      } else {
        logoInput.disabled = true;
        $("#logo-warn").textContent = "Fonctionnalité Pro — disponible après activation.";
      }
    }
    var csv = $("#btn-csv");
    if (csv) csv.addEventListener("click", exportCSV);
    var act = $("#link-pro-activate");
    if (act) {
      if (IS_PRO) {
        act.textContent = "Pro actif ✓";
        act.addEventListener("click", function (e) { e.preventDefault(); });
      } else {
        act.addEventListener("click", function (e) {
          e.preventDefault();
          window.FLPro.promptActivate();
        });
      }
    }
    renderLogoUI();
  }

  /*
   * Analytics : la balise Cloudflare Web Analytics (sans cookie) est intégrée
   * statiquement dans chaque page HTML — voir HUMAN_SETUP § D. Rien à faire ici.
   */

  /* ----- Démarrage ----- */

  hydrateInputs();
  bindInputs();
  bindActions();
  initProUI();
  renderLines();
  renderHistory();
  renderPreview();
})();

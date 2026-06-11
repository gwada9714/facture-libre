/*
 * FactureLibre — export PDF (jsPDF, vendorisé).
 * Mise en page programmatique en mm sur A4 : texte vectoriel net, fichier léger
 * (pas de capture d'écran de l'aperçu). Polices standard PDF (Helvetica) :
 * accents français couverts par l'encodage WinAnsi.
 */
(function () {
  "use strict";

  var C = window.FLCalc;

  var INK = [28, 43, 74];
  var RED = [191, 59, 31];
  var GRAY = [110, 110, 110];
  var LIGHT = [247, 246, 242];
  var ZEBRA = [251, 250, 246];
  var RULE = [238, 233, 221];

  var PAGE_W = 210, MARGIN = 18, RIGHT = PAGE_W - MARGIN; // 192
  var BREAK_Y = 258;

  /* Intl insère des espaces insécables fines (U+202F) absentes des polices PDF standard. */
  function money(x) {
    return C.formatEUR(x).replace(/[  ]/g, " ");
  }

  function generate(state, totals) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: "mm", format: "a4" });
    var franchise = !!state.emitter.franchise;
    var pro = !!(window.FLPro && window.FLPro.isPro());
    var y;

    function text(str, x, yy, opts) { doc.text(String(str), x, yy, opts || {}); }
    function setFont(size, style, color) {
      doc.setFont("helvetica", style || "normal");
      doc.setFontSize(size);
      var c = color || [29, 29, 31];
      doc.setTextColor(c[0], c[1], c[2]);
    }

    /* ---- En-tête : émetteur (gauche) + titre et méta (droite) ---- */
    var yL = 22;
    if (pro && state.emitter.logo && state.emitter.logo.dataUrl) {
      var lg = state.emitter.logo;
      var ratio = (lg.w && lg.h) ? lg.w / lg.h : 1;
      var hMM = 16, wMM = hMM * ratio;
      if (wMM > 48) { wMM = 48; hMM = wMM / ratio; }
      var fmt = lg.dataUrl.indexOf("image/png") !== -1 ? "PNG" : "JPEG";
      doc.addImage(lg.dataUrl, fmt, MARGIN, 14, wMM, hMM);
      yL = 14 + hMM + 8;
    }
    setFont(13, "bold", INK);
    text(state.emitter.name || "", MARGIN, yL); yL += 6;
    setFont(9, "normal", [60, 60, 60]);
    emitterLines(state).forEach(function (l) {
      doc.splitTextToSize(l, 92).forEach(function (seg) { text(seg, MARGIN, yL); yL += 4.2; });
    });

    var yR = 24;
    setFont(21, "bold", INK);
    text("FACTURE", RIGHT, yR, { align: "right" }); yR += 8;
    setFont(9, "normal", [60, 60, 60]);
    [["N° ", state.invoice.number || "—", true],
     ["Émise le ", C.formatDateFR(state.invoice.date) || "—", false],
     ["Échéance ", C.formatDateFR(state.invoice.due) || "—", false]].forEach(function (m) {
      doc.setFont("helvetica", m[2] ? "bold" : "normal");
      text(m[0] + m[1], RIGHT, yR, { align: "right" }); yR += 4.6;
    });

    y = Math.max(yL, yR) + 6;

    /* ---- Bloc client (encadré gris, à droite) ---- */
    var clLines = [];
    if (state.client.address) String(state.client.address).split("\n").forEach(function (l) {
      doc.setFontSize(9);
      doc.splitTextToSize(l, 74).forEach(function (seg) { clLines.push(seg); });
    });
    if (state.client.siret) clLines.push("SIRET : " + state.client.siret);
    var boxH = 12 + clLines.length * 4.2;
    var boxX = 112, boxW = RIGHT - boxX;
    doc.setFillColor(LIGHT[0], LIGHT[1], LIGHT[2]);
    doc.roundedRect(boxX, y, boxW, boxH, 1.5, 1.5, "F");
    setFont(6.8, "normal", [136, 136, 136]);
    text("FACTURÉ À", boxX + 4, y + 4.6);
    setFont(10, "bold", [29, 29, 31]);
    text(state.client.name || "—", boxX + 4, y + 9.6);
    setFont(9, "normal", [60, 60, 60]);
    var cy = y + 14;
    clLines.forEach(function (l) { text(l, boxX + 4, cy); cy += 4.2; });
    y += boxH + 8;

    /* ---- Tableau des prestations ---- */
    var cols = franchise
      ? [{ k: "desc", w: 86 }, { k: "qty", w: 14, num: true }, { k: "unit", w: 18 }, { k: "pu", w: 26, num: true }, { k: "tot", w: 30, num: true }]
      : [{ k: "desc", w: 70 }, { k: "qty", w: 14, num: true }, { k: "unit", w: 18 }, { k: "pu", w: 26, num: true }, { k: "tva", w: 16, num: true }, { k: "tot", w: 30, num: true }];
    var heads = { desc: "Désignation", qty: "Qté", unit: "Unité", pu: "PU HT", tva: "TVA", tot: "Total HT" };
    var xs = [MARGIN];
    cols.forEach(function (c) { xs.push(xs[xs.length - 1] + c.w); });

    function tableHead() {
      doc.setFillColor(INK[0], INK[1], INK[2]);
      doc.rect(MARGIN, y, RIGHT - MARGIN, 7, "F");
      setFont(7.6, "normal", [251, 249, 242]);
      cols.forEach(function (c, i) {
        var label = heads[c.k].toUpperCase();
        if (c.num) text(label, xs[i + 1] - 2, y + 4.7, { align: "right" });
        else text(label, xs[i] + 2, y + 4.7);
      });
      y += 7;
    }

    function pageBreak(rowH) {
      if (y + rowH <= BREAK_Y) return;
      doc.addPage();
      y = 20;
      tableHead();
    }

    tableHead();
    var zebra = false;
    state.lines.forEach(function (line) {
      if (!line.desc && !Number(line.unitPrice)) return;
      var r = C.computeLine(line, state.discountPct, franchise);
      doc.setFontSize(9);
      var descSegs = doc.splitTextToSize(line.desc || "—", cols[0].w - 4);
      var rowH = Math.max(1, descSegs.length) * 4.3 + 3.2;
      pageBreak(rowH);
      if (zebra) {
        doc.setFillColor(ZEBRA[0], ZEBRA[1], ZEBRA[2]);
        doc.rect(MARGIN, y, RIGHT - MARGIN, rowH, "F");
      }
      zebra = !zebra;
      setFont(9, "normal", [29, 29, 31]);
      descSegs.forEach(function (seg, si) { text(seg, MARGIN + 2, y + 4.6 + si * 4.3); });
      var vals = {
        qty: C.formatQty(line.qty),
        unit: line.unit || "",
        pu: money(line.unitPrice || 0),
        tva: String(r.rate).replace(".", ",") + " %",
        tot: money(C.fromCents(r.htCents))
      };
      cols.forEach(function (c, i) {
        if (c.k === "desc") return;
        if (c.num) text(vals[c.k], xs[i + 1] - 2, y + 4.6, { align: "right" });
        else text(vals[c.k], xs[i] + 2, y + 4.6);
      });
      doc.setDrawColor(RULE[0], RULE[1], RULE[2]);
      doc.setLineWidth(0.2);
      doc.line(MARGIN, y + rowH, RIGHT, y + rowH);
      y += rowH;
    });
    y += 6;

    /* ---- Totaux (colonne droite) ---- */
    var totX = 118;
    function totalRow(label, value, opts) {
      opts = opts || {};
      pageBreak(6);
      setFont(opts.big ? 11.5 : 9.3, opts.bold ? "bold" : "normal", opts.muted ? GRAY : (opts.ink ? INK : [29, 29, 31]));
      text(label, totX, y);
      text(value, RIGHT, y, { align: "right" });
      y += opts.big ? 7 : 5.4;
    }
    if (Number(state.discountPct) > 0) {
      totalRow("Remise appliquée", String(state.discountPct).replace(".", ",") + " %", { muted: true });
    }
    totalRow("Total HT", money(totals.totalHT));
    if (franchise) {
      totalRow("TVA", "non applicable", { muted: true });
    } else {
      Object.keys(totals.vatByRate).sort(function (a, b) { return b - a; }).forEach(function (rate) {
        totalRow("TVA " + String(rate).replace(".", ",") + " %", money(totals.vatByRate[rate]));
      });
    }
    pageBreak(12);
    doc.setDrawColor(RED[0], RED[1], RED[2]);
    doc.setLineWidth(0.7);
    doc.line(totX, y - 1.5, RIGHT, y - 1.5);
    y += 3.5;
    totalRow("Net à payer", money(totals.totalTTC), { bold: true, big: true, ink: true });

    if (franchise) {
      pageBreak(5);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
      text("TVA non applicable, art. 293 B du CGI", RIGHT, y, { align: "right" });
      y += 7;
    } else {
      y += 3;
    }

    /* ---- Règlement ---- */
    var payLines = [];
    if (state.invoice.payment) payLines.push("Mode de règlement : " + state.invoice.payment);
    if (state.emitter.iban) payLines.push("IBAN : " + state.emitter.iban + (state.emitter.bic ? "   BIC : " + state.emitter.bic : ""));
    if (state.invoice.due) payLines.push("À régler au plus tard le " + C.formatDateFR(state.invoice.due));
    if (payLines.length) {
      var ph = 7 + payLines.length * 4.4;
      pageBreak(ph + 4);
      doc.setFillColor(LIGHT[0], LIGHT[1], LIGHT[2]);
      doc.roundedRect(MARGIN, y, RIGHT - MARGIN, ph, 1.5, 1.5, "F");
      setFont(9, "bold", INK);
      text("Règlement", MARGIN + 4, y + 5.2);
      setFont(8.8, "normal", [60, 60, 60]);
      var py = y + 10;
      payLines.forEach(function (l) { text(l, MARGIN + 4, py); py += 4.4; });
      y += ph + 7;
    }

    /* ---- Mentions ---- */
    if (state.mentions) {
      doc.setFontSize(7.4);
      var segs = doc.splitTextToSize(String(state.mentions), RIGHT - MARGIN);
      pageBreak(segs.length * 3.6 + 4);
      setFont(7.4, "normal", GRAY);
      segs.forEach(function (seg) { text(seg, MARGIN, y); y += 3.6; });
    }

    /* ---- Pied de page (toutes les pages) ---- */
    var pages = doc.getNumberOfPages();
    for (var p = 1; p <= pages; p++) {
      doc.setPage(p);
      setFont(7, "normal", [153, 153, 153]);
      /* La ligne de promotion disparaît en Pro ; la pagination reste. */
      if (!pro) text("Facture créée avec FactureLibre — générateur gratuit pour micro-entrepreneurs", PAGE_W / 2, 290, { align: "center" });
      if (pages > 1) text("page " + p + "/" + pages, RIGHT, 290, { align: "right" });
    }

    var fileName = String(state.invoice.number || "facture").replace(/[\\/:*?"<>|]+/g, "-") + ".pdf";
    doc.save(fileName);
  }

  function emitterLines(state) {
    var out = [];
    if (state.emitter.address) String(state.emitter.address).split("\n").forEach(function (l) { if (l.trim()) out.push(l.trim()); });
    if (state.emitter.siret) out.push("SIRET : " + state.emitter.siret);
    if (state.emitter.vat && !state.emitter.franchise) out.push("N° TVA : " + state.emitter.vat);
    var contact = [state.emitter.email, state.emitter.phone].filter(Boolean).join(" · ");
    if (contact) out.push(contact);
    return out;
  }

  window.FLPDF = { generate: generate };
})();

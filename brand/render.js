/*
 * Rasterise les visuels de marque SVG -> PNG aux dimensions exactes.
 * Usage : node brand/render.js   (devDependency : @resvg/resvg-js)
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const jobs = [
  { svg: "profile.svg", out: "profile.png", width: 1000 },   // photo de profil (carrée, affichée en cercle)
  { svg: "cover.svg", out: "cover.png", width: 1584 }         // bannière de couverture LinkedIn (1584x396)
];

for (const j of jobs) {
  const svg = fs.readFileSync(path.join(__dirname, j.svg), "utf8");
  const r = new Resvg(svg, { fitTo: { mode: "width", value: j.width }, font: { loadSystemFonts: true } });
  const png = r.render().asPng();
  fs.writeFileSync(path.join(__dirname, j.out), png);
  console.log(j.out + " : " + r.render().width + "x" + r.render().height + "  (" + Math.round(png.length / 1024) + " Ko)");
}

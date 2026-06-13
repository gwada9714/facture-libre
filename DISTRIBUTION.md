# DISTRIBUTION — Plan d'acquisition de trafic (budget 0 €)

> Garde-fous (DECISIONS.md D-007) : **jamais de spam**. Lire les règles de chaque communauté
> avant de poster, une soumission honnête par canal, pas de comptes multiples, pas de faux
> engagement. Chaque canal se mesure (Cloudflare Analytics → référents) : on double ce qui
> marche, on coupe le reste.

## 1. Ce qui est déjà automatique (aucune action)

| Mécanisme | Effet | Statut |
|---|---|---|
| sitemap.xml + robots.txt | Découverte par tous les moteurs | ✅ en ligne |
| **IndexNow à chaque déploiement** | Indexation accélérée Bing/Yandex/Seznam | ✅ automatisé (deploy.yml) |
| Pied de page des PDF générés | Chaque facture envoyée mentionne discrètement FactureLibre | ✅ actif (version gratuite) |
| Guides SEO longue traîne | Trafic organique Google (lent : 2-6 mois) | ✅ 3 guides, production continue |

## 2. Actions humaines à fort levier (ordre de priorité)

### P1 — Google Search Console ✅ FAIT (2026-06-11 → 06-13)
Propriété « Préfixe d'URL » `https://gwada9714.github.io/facture-libre/` vérifiée (fichier
googlee733e130791ebc98.html), sitemap soumis. **Résultat 2026-06-13** : accueil + guides
mentions/numérotation + pro = « sur Google / indexée » ; rich results FAQ + fil d'Ariane détectés.
Reste à surveiller : statut du sitemap (« Impossible de récupérer » = latence nouvelle propriété,
non bloquant ; si encore bloqué à J+7, supprimer puis re-soumettre) et l'apparition des premières
requêtes/clics dans l'onglet « Performances ».

### P2 — AlternativeTo (~10 min, création de compte) 🎯 prochaine action
Annuaire de logiciels très indexé, trafic durable. https://alternativeto.net/manage-item/
— créer la fiche « FactureLibre » (catégorie : Invoicing), en se déclarant créateur.
Texte EN prêt : voir § 3. Alternatives à renseigner : Invoice-Generator.com, Zervant, Henrri.

### P3 — Communautés françaises de micro-entrepreneurs (continu, ~15 min/semaine)
Forums et groupes (Facebook « auto-entrepreneurs », forums spécialisés, r/vosfinances en
respectant strictement leurs règles) : **répondre utilement aux questions sur la facturation**
(mentions obligatoires, numérotation…) et ne mentionner l'outil que quand il répond
précisément à la question posée. Lent, mais c'est le canal le plus qualifié.

### P4 — Product Hunt + Show HN (EN, ponctuel)
À tirer une fois quelques retours utilisateurs FR engrangés (l'outil est FR-only, l'audience
PH/HN est mondiale : l'angle qui les intéresse est « privacy-first, 100 % client-side, no backend »).
Textes prêts : § 3. Un seul tir chacun — soigner le timing (mardi-jeudi matin US).

### P5 — LinkedIn personnel (~5 min)
Post de lancement sur votre profil (texte § 3) — l'audience pro FR y est, et c'est gratuit.

## 3. Textes prêts à coller

**Tagline FR (annuaires, ≤ 100 car.)**
> Factures conformes pour micro-entrepreneurs : gratuit, sans inscription, vos données restent dans votre navigateur.

**Description FR (annuaires, posts)**
> FactureLibre génère des factures conformes pour les micro-entrepreneurs français : mentions
> obligatoires automatiques (TVA non applicable art. 293 B, pénalités de retard, indemnité de 40 €),
> numérotation séquentielle, export PDF, historique. Particularité : tout fonctionne dans votre
> navigateur — aucune donnée n'est envoyée sur un serveur, aucun compte à créer, et c'est gratuit.
> https://gwada9714.github.io/facture-libre/

**Tagline EN (AlternativeTo, PH)**
> Free, privacy-first invoice generator for French freelancers — 100% client-side, no signup, legally compliant.

**Description EN (AlternativeTo, PH, Show HN)**
> FactureLibre generates legally compliant invoices for French micro-entrepreneurs. Everything runs
> in the browser: no backend, no account, no data ever leaves your device (localStorage only).
> Auto-numbering, French legal mentions, VAT franchise handling, crisp PDF export (vendored jsPDF).
> Free tier is complete; a 29€/yr Pro adds logo, branding removal and accounting export.

**Show HN (titre)**
> Show HN: FactureLibre – compliant French invoices, 100% client-side, no backend

**Post LinkedIn FR (à personnaliser)**
> J'ai lancé FactureLibre : un générateur de factures gratuit pour micro-entrepreneurs.
> Pas d'inscription, pas de serveur — vos données ne quittent jamais votre navigateur.
> Mentions obligatoires, numérotation, PDF : tout y est, gratuitement.
> Si vous êtes indépendant (ou en connaissez), votre retour m'intéresse : [lien]

## 4. Suivi des canaux

| Canal | Compte requis | Statut | Date | Référents (CF Analytics) |
|---|---|---|---|---|
| IndexNow (Bing/Yandex) | non | ✅ automatisé | 2026-06-11 | — |
| Google Search Console | oui (Google) | ✅ vérifié, sitemap soumis, pages indexées | 2026-06-13 | aucun externe encore |
| AlternativeTo | oui | ☐ | | — |
| Communautés FR | oui | ☐ continu | | — |
| Product Hunt | oui | ☐ différé (après premiers retours) | | — |
| Show HN | oui | ☐ différé | | — |
| LinkedIn | oui | ☐ | | — |

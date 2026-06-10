# FactureLibre

**Générateur de factures conformes pour micro-entrepreneurs français.**
100 % gratuit, sans inscription, sans serveur : vos données ne quittent jamais votre navigateur.

> 🎯 Projet opéré en autonomie par un agent IA, avec un budget de **0 €** (free tiers uniquement).
> Voir [DECISIONS.md](DECISIONS.md) pour le journal des choix, [METRICS.md](METRICS.md) pour le suivi revenus/coûts.

## Quoi

- Création de factures conformes à la réglementation française (mentions obligatoires, franchise de TVA art. 293 B du CGI, pénalités de retard, indemnité forfaitaire de recouvrement…).
- Numérotation automatique séquentielle, calculs HT/TVA/TTC, remise, multi-lignes.
- Export **PDF** direct (généré dans le navigateur) + impression.
- Historique des factures sauvegardé en **localStorage** (rien n'est envoyé sur un serveur).
- Guides pratiques (mentions obligatoires, numérotation, facturation électronique 2026-2027).

## Pourquoi

Modèle économique retenu (voir scoring en [DECISIONS.md](DECISIONS.md)) : **micro-outil freemium 100 % client-side**.
- Coût marginal nul → compatible budget 0 €, scale illimité sur hébergement statique gratuit.
- Douleur récurrente (facturation mensuelle des indépendants) → trafic récurrent organique.
- Monétisation : version Pro (paiement Stripe, après KYC humain one-shot), puis affiliation banques pro.

## Lancer en local

Aucun build, aucune dépendance d'exécution :

```bash
# Option 1 : serveur statique
npx serve site
# Option 2 : Python
python -m http.server 8000 --directory site
# Option 3 : ouvrir directement site/index.html dans un navigateur
```

## Tests

```bash
node tools/test-calc.js
```

Teste le moteur de calcul (totaux, TVA par taux, remises, arrondis, validation SIRET).

## Structure

```
site/                  Le site déployable (statique pur)
  index.html           L'outil de facturation
  pro.html             Offre Pro (placeholder tant que Stripe n'est pas activé)
  guides/              Guides SEO de qualité
  assets/              CSS, JS (calc.js = moteur de calcul testé), vendor (jsPDF)
tools/                 Scripts Node (tests, sitemap)
.github/workflows/     CI : déploiement GitHub Pages + healthcheck hebdomadaire
HUMAN_SETUP.md         ⚠️ La checklist one-shot des actions humaines (comptes, KYC)
DECISIONS.md           Journal des décisions
METRICS.md             Suivi coûts / revenus / trafic
RUNBOOK.md             Comment le système tourne seul, comment intervenir
```

## Statut

- [x] MVP fonctionnel (outil + PDF + historique)
- [x] Pages légales + guides
- [x] CI de déploiement (GitHub Pages) + healthcheck
- [x] **Mise en ligne : https://gwada9714.github.io/facture-libre/** (2026-06-10)
- [ ] Analytics (Cloudflare Web Analytics) — HUMAN_SETUP.md § D
- [ ] Encaissement Pro (Stripe KYC) — HUMAN_SETUP.md § C

## Licence

Code sous licence MIT. Le contenu éditorial des guides reste © FactureLibre.
jsPDF (MIT) est vendorisé dans `site/assets/vendor/`.

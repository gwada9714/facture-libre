# METRICS — Suivi revenus / coûts / trafic

> Règle d'or du projet : **les coûts cumulés doivent rester à 0,00 €** tant que le revenu net cumulé
> ne les couvre pas (DECISIONS.md D-009). Aucune métrique n'est estimée ou « projetée » : seules les
> valeurs mesurées sont inscrites ici.

## État au 2026-06-10 (cycle 0 — construction)

| Métrique | Valeur | Source de mesure |
|---|---|---|
| **Coûts cumulés** | **0,00 €** | Aucun service payant utilisé (vérifié) |
| Revenu brut cumulé | 0,00 € | Stripe non activé (HUMAN_SETUP § C) |
| **Revenu net cumulé** | **0,00 €** | revenu brut − coûts |
| Visiteurs uniques | non mesurable | Analytics non activé (HUMAN_SETUP § D) |
| Pages en ligne | 8 (sitemap vérifié) | https://gwada9714.github.io/facture-libre/ |
| Pages indexées Google | 0 | Site mis en ligne le 2026-06-10, indexation en cours |
| Conversions Pro | 0 | Offre non activée |
| Unités produites | 1 outil + 3 guides + 8 pages | Dépôt git (mesure : sitemap) |
| Incidents ouverts | 0 | GitHub Issues (label healthcheck) |

## Définitions

- **Coût** : toute somme décaissée (hébergement, domaine, services). Les free tiers comptent 0 €.
  Le temps de calcul de l'agent n'entre pas dans le périmètre budgétaire du projet.
- **Revenu brut** : encaissements Stripe/Gumroad constatés (pas les paniers, pas les clics).
- **Revenu net** : revenu brut − commissions de paiement − coûts.
- **Conversion Pro** : paiement confirmé / visiteurs uniques de pro.html.

## Procédure de mise à jour (à chaque cycle, après activation des comptes)

1. Trafic : Cloudflare Web Analytics → visiteurs uniques 7 j / 30 j.
2. Revenus : dashboard Stripe → encaissements nets.
3. Indexation : Google Search Console → pages indexées, requêtes, clics.
4. Reporter les valeurs ici avec la date, en ajoutant une ligne d'historique ci-dessous.
5. Analyser : qu'est-ce qui a progressé ? Décision (doubler / couper) consignée dans DECISIONS.md.

## Historique des cycles

| Date | Coûts cumulés | Revenu net cumulé | Visiteurs (30 j) | Notes |
|---|---|---|---|---|
| 2026-06-10 | 0,00 € | 0,00 € | — | Cycle 0 : MVP construit ET mis en ligne (HUMAN_SETUP § A terminé). Prochain jalon : § C (Stripe) pour ouvrir le revenu |

## Limites free tier surveillées

| Service | Quota gratuit | Usage actuel | Risque |
|---|---|---|---|
| GitHub Pages | 100 Go/mois, soft limit | 0 | Très faible (site ~200 Ko) |
| GitHub Actions | 2 000 min/mois (repo public : illimité) | ~2 min/déploiement | Nul |
| Cloudflare Web Analytics | Illimité | — | Nul |

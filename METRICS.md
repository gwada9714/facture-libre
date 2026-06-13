# METRICS — Suivi revenus / coûts / trafic

> Règle d'or du projet : **les coûts cumulés doivent rester à 0,00 €** tant que le revenu net cumulé
> ne les couvre pas (DECISIONS.md D-009). Aucune métrique n'est estimée ou « projetée » : seules les
> valeurs mesurées sont inscrites ici.

## État au 2026-06-11 (cycle 0 — construction terminée, phase distribution ouverte)

| Métrique | Valeur | Source de mesure |
|---|---|---|
| **Coûts cumulés** | **0,00 €** | Aucun service payant utilisé (vérifié) |
| Revenu brut cumulé | 0,00 € | Dashboard Stripe (lien de paiement actif depuis le 2026-06-11) |
| **Revenu net cumulé** | **0,00 €** | revenu brut − coûts |
| Visiteurs uniques | mesuré (voir dashboard) | Cloudflare Web Analytics, sans cookie — actif sur les 9 pages depuis le 2026-06-11 |
| Pages en ligne | 9 (sitemap vérifié) | https://gwada9714.github.io/facture-libre/ |
| Pages indexées Google | ≥ 4 confirmées (2026-06-13) | GSC : accueil + 2 guides + pro « sur Google / indexée » ; rich results FAQ + fil d'Ariane détectés |
| Conversions Pro | 0 | Offre non activée |
| Unités produites | 1 outil (+ Pro) + 4 guides + 9 pages | Dépôt git (mesure : sitemap) |
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
| 2026-06-10 | 0,00 € | 0,00 € | — | Cycle 0 : MVP construit ET mis en ligne (HUMAN_SETUP § A terminé) |
| 2026-06-11 | 0,00 € | 0,00 € | — | Pro v1 livré + **rail de paiement ouvert** (Stripe actif, bouton Pro en ligne). Reste : § B mentions légales, § D analytics, distribution |
| 2026-06-11 (soir) | 0,00 € | 0,00 € | — | **HUMAN_SETUP 100 % soldé** (§ B mentions légales + SIREN, § D analytics 9 pages). IndexNow automatisé à chaque déploiement. Kit de distribution publié (DISTRIBUTION.md) — prochaine action humaine prioritaire : Search Console (P1) |
| 2026-06-12 | 0,00 € | 0,00 € | à lire (dashboard CF) | **Cycle 1** : système 100 % vert (healthcheck réel OK, 0 incident, paiement OK). 4e guide publié (facture d'avoir) + maillage interne. Collision de nom consignée (D-011). Indexation pas encore visible (J+2 : normal). Backlog produit : gestion native des avoirs |
| 2026-06-13 | 0,00 € | 0,00 € | à lire (dashboard CF) | **Cycle 2** : gestion native des avoirs livrée (D-012) — type Facture/Avoir, séries AV-, action « Avoir » depuis l'historique, PDF dédié, CSV comptable signé. Vérifiée de bout en bout. Le guide d'avoir pointe désormais une fonctionnalité réelle |
| 2026-06-13 | 0,00 € | 0,00 € | à lire (dashboard CF) | **Jalon indexation** : Google a indexé l'accueil + 2 guides + pro (vérifié GSC), rich results FAQ + fil d'Ariane détectés. Sitemap encore en « Impossible de récupérer » = latence GSC nouvelle propriété, NON bloquant (serveur 200/xml re-vérifié). Le flywheel SEO a démarré |

## Limites free tier surveillées

| Service | Quota gratuit | Usage actuel | Risque |
|---|---|---|---|
| GitHub Pages | 100 Go/mois, soft limit | 0 | Très faible (site ~200 Ko) |
| GitHub Actions | 2 000 min/mois (repo public : illimité) | ~2 min/déploiement | Nul |
| Cloudflare Web Analytics | Illimité | — | Nul |

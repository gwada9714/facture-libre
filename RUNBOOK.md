# RUNBOOK — Comment le système tourne seul, et comment intervenir

## Architecture (1 minute de lecture)

```
Utilisateur ──HTTPS──▶ GitHub Pages (statique, gratuit)
                          ▲
                          │ déploiement automatique (workflow « Déploiement »)
   git push main ─────────┘
                          │ tests calc.js = porte de déploiement
                          │ injection __SITE_URL__ + sitemap (prepare-deploy.js)

Healthcheck (cron lun/jeu) ──▶ site up ? ──non──▶ Issue GitHub + email au propriétaire
Données utilisateurs : 100 % dans le navigateur de chaque visiteur (localStorage).
Aucun serveur applicatif, aucune base de données, aucun secret.
```

## Ce qui est automatique (zéro intervention)

| Quoi | Déclencheur | Où regarder |
|---|---|---|
| Tests + déploiement | push sur `main` | Onglet Actions → « Déploiement » |
| Surveillance de disponibilité | cron lundi/jeudi 07h23 UTC | Onglet Actions → « Healthcheck » |
| Alerte d'incident | healthcheck en échec | Issues GitHub (+ email GitHub automatique) |
| Sitemap et URLs canoniques | à chaque déploiement | `prepare-deploy.js` dans le workflow |
| Activation du paiement Pro | `proPaymentLink` non vide dans config.js | site/assets/config.js |
| Activation analytics | `cloudflareAnalyticsToken` non vide | site/assets/config.js |

## Procédures d'intervention

### Le site est en panne (issue « Site injoignable »)
1. Vérifier https://www.githubstatus.com (panne GitHub = attendre).
2. Settings → Pages : la source doit être « GitHub Actions ».
3. Relancer le workflow « Déploiement » (onglet Actions → Run workflow).

### Un déploiement a cassé quelque chose (rollback)
```powershell
git revert HEAD --no-edit
git push
```
Le déploiement précédent est reconstruit et publié en ~1 min. Ne jamais utiliser `--force`.

### Modifier la configuration produit (prix, paiement, analytics, contact)
Éditer `site/assets/config.js`, commit, push. C'est tout.

### Passer à un domaine personnalisé (après premiers revenus)
1. Acheter le domaine, le configurer dans Settings → Pages → Custom domain.
2. Créer la variable de dépôt `SITE_URL` (Settings → Secrets and variables → Actions → Variables)
   avec la valeur `https://votredomaine.fr/`.
3. Relancer le déploiement. (Les canonicals et le sitemap suivront automatiquement.)

### Lancer le site en local / tester
```powershell
npm run serve    # http://localhost:3000 (ou npx serve site)
npm test         # tests du moteur de calcul
```

## Où vit l'état ?

| Donnée | Emplacement | Sauvegarde |
|---|---|---|
| Code + contenu | dépôt git (GitHub) | clones locaux |
| Factures des utilisateurs | localStorage de **leur** navigateur | aucune côté projet (par conception, RGPD) |
| Compteur de numérotation | localStorage utilisateur | idem |
| Configuration produit | site/assets/config.js (versionnée) | git |
| Métriques business | METRICS.md (manuel) + dashboards Stripe/Cloudflare | git |

## Limites connues et points de vigilance

- **localStorage = par navigateur** : un utilisateur qui change d'appareil ne retrouve pas son historique.
  Documenté dans l'outil ; la synchronisation chiffrée est une fonctionnalité Pro envisagée.
- **GitHub Pages** : pas de SLA. Le healthcheck couvre la détection ; le plan B (Cloudflare Pages) se
  déploie en pointant le même dépôt si une migration devenait nécessaire.
- **Réforme facturation électronique 2026-2027** : à réévaluer à chaque cycle (DECISIONS.md D-008).
- **Le cron GitHub** peut glisser de quelques minutes (file d'attente) : sans impact ici.
- Si le dépôt reste inactif 60 jours, GitHub peut suspendre les workflows planifiés : le moindre
  commit (ex. mise à jour de METRICS.md) les réactive.

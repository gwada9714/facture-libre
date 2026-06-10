# HUMAN_SETUP — Checklist one-shot des actions humaines

> Ces étapes exigent une **identité humaine vérifiée** (création de comptes, KYC, identité légale).
> Aucune IA ne peut les faire à votre place — c'est une contrainte légale, pas technique.
> Tout le reste est automatisé. Temps total estimé : **~45 min** (dont ~30 min d'attente KYC Stripe).

---

## § A — Mise en ligne (requis, ~10 min) 🔴 BLOQUANT

Le site est prêt à déployer. Il manque uniquement un compte GitHub authentifié.

1. ✅ ~~Créer un compte GitHub~~ — fait (compte `gwada9714`).
2. ✅ ~~Créer le dépôt public~~ — fait le 2026-06-10 via l'interface web :
   `https://github.com/gwada9714/facture-libre` (public, sans README initial).
3. ✅ ~~Pousser le code~~ — fait (identifiants Windows déjà enregistrés, 6 commits poussés).
4. ✅ ~~Activer GitHub Pages~~ — fait le 2026-06-10 (source : GitHub Actions).
5. ✅ ~~Relancer le déploiement~~ — fait (run n°3 : succès).
6. ✅ **Le site est en ligne : https://gwada9714.github.io/facture-libre/** (vérifié HTTP 200,
   sitemap 8 URLs). Le déploiement est désormais **automatique à chaque push**, plus aucune
   action humaine nécessaire pour publier.

## § B — Identité légale du site (requis avant promotion, ~5 min) 🟠

La loi française (LCEN) impose d'identifier l'éditeur d'un site.

1. Ouvrir `site/mentions-legales.html` et remplacer les champs `[À COMPLÉTER]` :
   nom/prénom (ou raison sociale), SIREN le cas échéant, email de contact.
2. Ouvrir `site/assets/config.js` et renseigner `contactEmail`.
3. Commit + push (le déploiement est automatique).

## § C — Encaissement (requis avant le 1er euro, ~20 min + délai KYC) 🟠

1. **Créer un compte Stripe** : https://dashboard.stripe.com/register — KYC : pièce d'identité,
   IBAN, statut (micro-entrepreneur accepté).
2. Dans Stripe : **Catalogue produits → Ajouter un produit** :
   - Nom : « FactureLibre Pro » — Prix : 29 €/an (récurrent annuel) *(prix modifiable dans `config.js`)*
3. **Créer un Payment Link** pour ce produit (bouton « Créer un lien de paiement »).
4. Coller l'URL dans `site/assets/config.js` → `proPaymentLink: "https://buy.stripe.com/..."`.
5. Commit + push. La page Pro active automatiquement le bouton de paiement.

> Alternative sans Stripe : Gumroad (KYC plus léger, commission ~10 %) — coller l'URL du produit
> Gumroad dans le même champ `proPaymentLink`.

## § D — Analytics sans cookies (recommandé, ~10 min) 🟡

1. **Créer un compte Cloudflare** (gratuit) : https://dash.cloudflare.com/sign-up
2. Web Analytics → « Add a site » → renseigner l'URL GitHub Pages → copier le **token** du snippet.
3. Coller le token dans `site/assets/config.js` → `cloudflareAnalyticsToken: "..."`.
4. Commit + push. (Sans cookie : aucune bannière de consentement requise.)

## § E — Optionnel (après premiers revenus uniquement)

- **Domaine personnalisé** (~10 €/an) : à financer par le premier revenu réel, jamais avant
  (contrainte budget 0 €). Vérifier d'abord la disponibilité de la marque.
- **Affiliation banques pro** (Shine, Qonto…) : candidater quand le trafic est démontrable.
- **Annuaires produit** (Product Hunt, betalist…) : nécessitent un compte personnel.

---

## Récapitulatif

| § | Action | Pourquoi humain ? | Statut |
|---|---|---|---|
| A | Compte GitHub + push + Pages | Propriété du compte, anti-bot | ✅ 2026-06-10 |
| B | Mentions légales | Identité légale de l'éditeur (LCEN) | ☐ |
| C | Stripe + KYC + Payment Link | Vérification d'identité financière (légal) | ☐ |
| D | Cloudflare Analytics | Création de compte | ☐ |
| E | Domaine / affiliations | Paiement + identité | ☐ |

Une fois § A–D cochés, **plus aucune intervention humaine n'est nécessaire** : déploiement,
healthcheck, et rapports sont automatisés (voir RUNBOOK.md).

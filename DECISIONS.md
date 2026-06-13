# Journal des décisions

Chaque entrée : contexte → décision → justification → réversibilité.

---

## D-001 — 2026-06-10 — Modèle économique : micro-outil freemium 100 % client-side

**Scoring** (revenu × automatisabilité × rapidité × conformité ÷ dépendance humaine, échelle 1-5) :

| Modèle | Rev. | Auto. | Rapid. | Conf. | Dép.H | Score |
|---|---|---|---|---|---|---|
| Site SEO programmatique + pub/affiliation | 3 | 5 | 1 | 3 | 3 | 15 |
| **Micro-outil freemium client-side** | 4 | 4 | 3 | 5 | 2 | **120** |
| Contenu faceless (TTS/vidéo) | 2 | 4 | 1 | 2 | 3 | 5 |
| Produits numériques marketplace | 3 | 3 | 4 | 4 | 2 | 72 |

**Décision** : micro-outil web freemium. Les modèles SEO programmatique et produits numériques
se greffent dessus plus tard comme canaux secondaires (guides → trafic ; modèles de factures → produits).
**Exclusions** : trading/achat de stock (capital requis), faceless (seuils de monétisation YouTube = mois d'attente,
politiques sur le contenu généré par IA = risque de conformité).

## D-002 — 2026-06-10 — Niche : générateur de factures pour micro-entrepreneurs FR

**Pourquoi** :
- Douleur **récurrente** (facturation mensuelle) → usage répété, bookmark, rétention sans coût d'acquisition.
- ~2,5 M de micro-entrepreneurs en France ; marché francophone nettement moins saturé que l'anglophone.
- Valeur réelle automatisable : mentions légales obligatoires, franchise de TVA, numérotation séquentielle.
- Angle éditorial fort : réforme de la facturation électronique 2026-2027 (voir D-008).
- Monétisation naturelle : Pro (logo, devis, récurrence), affiliation banques pro (forte commission, audience pertinente).

## D-003 — 2026-06-10 — Stack : statique pur, zéro build, zéro backend

**Décision** : HTML/CSS/JS vanilla, aucun framework, aucun build step, aucun backend.
**Justification** : coût marginal = 0 € (contrainte dure) ; surface de panne minimale (un site statique ne « tombe » pas) ;
RGPD par construction (aucune donnée ne quitte le navigateur, localStorage uniquement) ; déployable sur n'importe quel
hébergeur statique gratuit (GitHub Pages retenu, Cloudflare Pages en plan B documenté).
**jsPDF vendorisé** (MIT) plutôt que CDN : pas de dépendance réseau tierce à l'exécution, pas de risque supply-chain au runtime.
**Réversibilité** : totale (le moteur de calcul calc.js est isolé et testé, portable vers n'importe quelle stack).

## D-004 — 2026-06-10 — Hébergement : GitHub Pages (repo public)

**Décision** : GitHub Pages via GitHub Actions.
**Justification** : un seul compte nécessaire (GitHub) pour code + CI + hébergement + cron → minimise les points
de contact humains. Free tier : 100 Go/mois de bande passante, largement suffisant.
**Trade-off accepté** : Pages gratuit exige un repo **public**. Acceptable : le code d'un outil client-side est de
toute façon livré au navigateur. Licence MIT assumée (la défendabilité vient de la marque, du contenu et du SEO,
pas du secret du code).
**Plan B** : Cloudflare Pages (bande passante illimitée) une fois le compte Cloudflare créé (HUMAN_SETUP § D).

## D-005 — 2026-06-10 — Monétisation différée à l'activation Stripe (KYC humain)

**Décision** : l'outil est lancé 100 % gratuit. La page Pro présente l'offre (29 €/an) avec paiement désactivé
tant que `proPaymentLink` est vide dans `site/assets/config.js`.
**Justification** : encaisser de l'argent exige un KYC humain (incompressible légalement). Plutôt que d'attendre,
on lance, on accumule trafic + crédibilité, et l'activation du paiement devient un simple collage d'URL.
**Pas de collecte d'emails au lancement** : exigerait un backend ou un service tiers (surface RGPD + dépendance) ;
reporté après les premières métriques de trafic.

## D-006 — 2026-06-10 — Analytics différé, et cookieless par défaut

**Décision** : lancement sans analytics. Une fois le compte Cloudflare créé (humain, § D), activation de
Cloudflare Web Analytics (sans cookie, RGPD-friendly, pas de bannière de consentement nécessaire).
**Justification** : GA4 imposerait une bannière cookies (friction + surface juridique). GoatCounter hosted vise
l'usage personnel (usage commercial = zone grise ToS → écarté, garde-fou conformité).

## D-007 — 2026-06-10 — Qualité éditoriale : 3 guides rédigés à la main, pas de spam programmatique

**Décision** : au lancement, 3 guides de fond (mentions obligatoires, numérotation, facturation électronique),
rédigés avec soin, avec disclaimer « ceci n'est pas un conseil juridique » et renvoi aux sources officielles.
**Justification** : garde-fou « pas d'AI slop » ; Google pénalise le contenu de masse sans valeur ; 3 bons guides
+ 1 outil utile > 300 pages creuses. La production de contenu s'industrialisera seulement si les métriques le justifient.

## D-008 — 2026-06-10 — Risque identifié : réforme facturation électronique 2026-2027

**Contexte** : la France généralise la facturation électronique B2B (réception dès sept. 2026 pour les grandes
entreprises/ETI, émission étendue aux TPE/micro vers sept. 2027, via plateformes agréées PDP/PPF). Calendrier
susceptible d'évoluer.
**Impact** : un générateur de PDF reste pleinement légal pour le B2C et pour le B2B jusqu'aux échéances ;
ensuite, le PDF simple ne suffira plus pour le B2B.
**Décision** : (1) traiter le sujet en guide (opportunité SEO majeure, requêtes en croissance) ; (2) afficher
l'information honnêtement dans l'outil ; (3) réévaluer à chaque cycle — pivot possible : « FactureLibre devient
l'outil qui aide les micro-entrepreneurs à passer à la facturation électronique » (comparateur de PDP = affiliation).
**Garde-fou** : toujours renvoyer vers impots.gouv.fr pour les dates officielles, ne jamais affirmer un calendrier figé.

## D-010 — 2026-06-11 — Pro v1 : activation par code partagé (système déclaratif assumé)

**Contexte** : encaisser sans backend (contrainte 0 €) impose un mécanisme de déblocage sans
vérification serveur. **Décision** : code d'activation communiqué sur la page de confirmation
Stripe ; le navigateur compare le SHA-256 du code saisi aux empreintes publiées dans config.js
(le code en clair n'apparaît jamais dans le dépôt public, ni dans les commits).
**Trade-off accepté** : un code peut être partagé entre utilisateurs (honor system). À ce stade,
le coût d'un resquilleur est nul (pas de serveur) et le risque réel est faible ; la lutte
anti-partage coûterait plus qu'elle ne rapporte. **Critère de remplacement** : au premier signe
de partage massif ou à partir de ~20 clients payants, basculer vers des licences individuelles
vérifiées par un Cloudflare Worker (free tier) + clé secrète Stripe. **Pré-requis d'honnêteté** :
Pro v1 livre des fonctionnalités réelles dès l'activation (logo sur PDF, PDF sans mention,
export CSV comptable) ; la page Pro distingue explicitement « disponible » et « en développement ».

## D-009 — 2026-06-10 — Ce qui est volontairement reporté

- Collecte d'emails (backend requis) → après premières métriques.
- A/B testing → nécessite analytics + trafic minimal (Phase 3).
- Domaine personnalisé (~10 €/an) → financé par le premier revenu réel, jamais avant (contrainte 0 €).
- Affiliation banques pro → nécessite trafic démontrable pour candidater.
- Vérification du nom « FactureLibre » (antériorité/marque) → à faire avant tout achat de domaine.

## D-011 — 2026-06-12 — Collision de nom : « facturelibre » existe déjà sur GitHub

**Contexte** : la sonde d'indexation du cycle 1 révèle vartur/facturelibre (bibliothèque Python
Factur-X pour micro-entrepreneurs) et un écosystème « facturation libre » dense (factux, akretion).
**Analyse** : surfaces différentes (lib pour développeurs vs outil web grand public), aucune marque
déposée apparente, risque juridique faible à ce stade — mais concurrence possible sur la requête de
marque et confusion d'écosystème.
**Décision** : (1) ne pas renommer à chaud ; (2) AVANT tout achat de domaine ou campagne P4
(Product Hunt / Show HN), trancher : vérification INPI puis cohabitation assumée OU renommage
(coût encore faible : < 2 h aujourd'hui, bien plus cher après) ; (3) réévaluer à chaque cycle.

## D-012 — 2026-06-13 — Gestion native des avoirs (factures d'avoir)

**Contexte** : le guide « facture d'avoir » (cycle 1) a défini le besoin réglementaire ; l'outil ne
gérait que des factures. Un avoir est une demande récurrente et le complément naturel d'un générateur
de factures conforme.
**Décision** : type de document Facture/Avoir dans l'outil, avec : séries de numérotation distinctes
(FAC- et AV-, recommandation du guide), référence obligatoire à la facture d'origine (validée à
l'export), titre « AVOIR », bloc « Remboursement », mentions par défaut adaptées, et une action
« Avoir » dans l'historique qui établit l'avoir depuis une facture archivée (reprise client + lignes,
référence pré-remplie). Convention de montants : **positifs** sur le document (lisibilité, conforme au
guide) mais **négatifs dans l'export CSV** comptable (somme juste, nouvelle colonne « Type »).
**Justification** : zéro coût (toujours client-side), aucune nouvelle dépendance, le moteur calc.js
est inchangé (mêmes maths). Renforce le SEO (le guide peut désormais pointer une fonctionnalité réelle,
pas une promesse). **Réversibilité** : le type de document est un champ d'état ; rétrocompatibilité
assurée (brouillons et historique d'avant la fonctionnalité migrés en « facture » à la lecture).
**Vérifié** : flux facture intact (non-régression), flux avoir complet (aperçu + PDF + historique),
numérotation round-trip, validation, responsive mobile, zéro erreur console.

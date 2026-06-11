/*
 * FactureLibre — configuration du site.
 * Les champs vides sont activés par la checklist HUMAN_SETUP.md (racine du dépôt).
 */
window.FLConfig = {
  siteName: "FactureLibre",

  /* Injecté automatiquement au déploiement par tools/prepare-deploy.js */
  baseUrl: "__SITE_URL__",

  /* HUMAN_SETUP § B — email de contact affiché dans le pied de page et les pages légales. */
  contactEmail: "",

  /*
   * HUMAN_SETUP § C — lien de paiement (Stripe Payment Link ou Gumroad).
   * Tant que ce champ est vide, la page Pro affiche « bientôt disponible »
   * et aucun paiement n'est proposé.
   * ── Décision produit : le prix (proPriceDisplay) est un choix humain
   *    légitime — 29 €/an est la valeur par défaut recommandée (voir DECISIONS.md D-005).
   */
  proPaymentLink: "https://buy.stripe.com/9B67sN75B1jYdo54j0e7m00",
  proPriceDisplay: "29 €/an",

  /* HUMAN_SETUP § D — token Cloudflare Web Analytics (mesure sans cookie). */
  cloudflareAnalyticsToken: "",

  /*
   * Empreintes SHA-256 des codes d'activation Pro valides (voir assets/pro.js).
   * IMPORTANT — dépôt public : ne JAMAIS écrire un code en clair ici ni ailleurs
   * dans le dépôt. Le code est communiqué à l'acheteur par la page de
   * confirmation du paiement (HUMAN_SETUP § C).
   */
  proCodeHashes: [
    "5069503aedac8fb62a8a3bc6243b697f38b8e21c25fd0476d2c22123f3f712db"
  ]
};

import type { TranslationDict } from "@/lib/i18n/localize";

/**
 * French baseline (agent draft 2026-08-14). Starting point — the owner
 * overrides word-for-word in Ops → Settings → Languages.
 */
export const FR_TRANSLATIONS: TranslationDict = {
  "meta.siteName": "ZanTap",
  "meta.title": "ZanTap — Mettez votre commerce alimentaire en ligne, avec de l'aide",
  "meta.description":
    "ZanTap offre aux commerces alimentaires du Rwanda un lien de commande unique, les paiements MoMo et une vue cuisine en direct. Installation gratuite et accompagnée pour les premiers partenaires sélectionnés.",

  "nav.howItWorks": "Comment ça marche",
  "nav.offer": "L'offre",
  "nav.cta": "Commencer",
  "nav.openStorefrontDemo": "Voir une boutique en direct",

  "hero.availability": "Places de premiers partenaires ouvertes",
  "hero.kicker": "On commence au Rwanda",
  "hero.headline": "Mettez votre commerce alimentaire en ligne — avec de l'aide.",
  "hero.summary":
    "Nous configurons votre lien de commande, vos premiers plats au menu et votre flux MoMo. Votre équipe reçoit une vue cuisine en direct.",
  "hero.promise.0.step": "01",
  "hero.promise.0.title": "Les clients commandent",
  "hero.promise.0.detail": "Depuis un lien simple",
  "hero.promise.1.step": "02",
  "hero.promise.1.title": "Vous recevez le paiement",
  "hero.promise.1.detail": "Via MoMo",
  "hero.promise.2.step": "03",
  "hero.promise.2.title": "Votre cuisine s'active",
  "hero.promise.2.detail": "À chaque commande payée",
  "hero.deviceTag.title": "Votre boutique est en ligne",
  "hero.deviceTag.detail": "Partagez votre lien",
  "hero.audienceNote":
    "Pour les restaurants, bars, traiteurs et livraisons de repas à domicile.",

  "leadForm.kicker": "Installation gratuite anticipée",
  "leadForm.heading": "Parlez-nous de votre commerce.",
  "leadForm.subheading": "Nous vous contacterons sur WhatsApp.",
  "leadForm.fields.businessName.label": "Nom du commerce",
  "leadForm.fields.businessName.placeholder": "ex. La Cuisine de Mama Aline",
  "leadForm.fields.businessType.label": "Type de commerce",
  "leadForm.fields.businessType.placeholder": "Choisissez-en un",
  "leadForm.fields.businessType.options.0": "Restaurant",
  "leadForm.fields.businessType.options.1": "Bar & grill",
  "leadForm.fields.businessType.options.2": "Traiteur",
  "leadForm.fields.businessType.options.3": "Livraison de repas à domicile",
  "leadForm.fields.businessType.options.4": "Autre commerce alimentaire",
  "leadForm.fields.contactName.label": "Personne à contacter",
  "leadForm.fields.contactName.placeholder": "Votre nom complet",
  "leadForm.fields.phone.label": "Numéro WhatsApp",
  "leadForm.fields.phone.placeholder": "Numéro de téléphone",
  "leadForm.fields.phone.countryLabel": "Pays ou indicatif",
  "leadForm.fields.phone.searchPlaceholder": "Rechercher un pays ou indicatif",
  "leadForm.fields.phone.noResults": "Aucun pays trouvé.",
  "leadForm.fields.area.label": "Quartier",
  "leadForm.fields.area.placeholder": "ex. Kimihurura, Kigali",
  "leadForm.submit": "Demander l'installation",
  "leadForm.submitting": "Envoi en cours…",
  "leadForm.consent":
    "En envoyant ceci, vous acceptez que ZanTap vous contacte sur WhatsApp au sujet de votre installation.",
  "leadForm.reassurance": "Pas de contrat longue durée. Aucune pression.",
  "leadForm.errors.required": "Veuillez remplir tous les champs.",
  "leadForm.errors.phone": "Entrez un numéro WhatsApp valide pour le pays sélectionné.",
  "leadForm.errors.rateLimited": "Trop de demandes. Patientez un moment puis réessayez.",
  "leadForm.errors.submissionFailed":
    "Nous n'avons pas pu enregistrer votre demande. Veuillez réessayer.",
  "leadForm.success.title": "Vous êtes sur la liste.",
  "leadForm.success.detail": "Nous vous contacterons sur WhatsApp et prendrons la suite.",
  "leadForm.success.whatsappCta": "Continuer sur WhatsApp",
  "leadForm.success.whatsappNote":
    "Vérifiez le message, puis appuyez sur Envoyer dans WhatsApp.",

  "howItWorks.kicker": "La suite",
  "howItWorks.heading": "Simple dès le premier jour.",
  "howItWorks.steps.0.tag": "Jour 01",
  "howItWorks.steps.0.title": "Nous configurons ensemble",
  "howItWorks.steps.0.detail": "Vos informations, votre menu et MoMo.",
  "howItWorks.steps.1.tag": "Mise en ligne",
  "howItWorks.steps.1.title": "Vous partagez votre lien",
  "howItWorks.steps.1.detail": "WhatsApp, Instagram ou ailleurs.",
  "howItWorks.steps.2.tag": "Première commande",
  "howItWorks.steps.2.title": "Votre cuisine la voit",
  "howItWorks.steps.2.detail": "Payée et prête à préparer.",

  "product.kicker": "Une commande. Deux écrans.",
  "product.heading": "De leur téléphone à votre cuisine.",
  "product.storefront.title": "Votre propre menu mobile",
  "product.storefront.detail":
    "Partagez un seul lien. Les clients choisissent, commandent et paient par MoMo sans télécharger d'application.",
  "product.storefront.alt":
    "Une boutique ZanTap sur un téléphone montrant un menu et un panier",
  "product.kitchen.title": "Une cuisine plus claire",
  "product.kitchen.detail":
    "Chaque commande payée arrive sur votre tableau de cuisine — nouvelle, en préparation, prête. Plus besoin de fouiller les messages.",
  "product.kitchen.alt":
    "Le tableau de cuisine ZanTap montrant une nouvelle commande payée",
  "product.kitchen.cards.0.caption": "Votre boutique, en ligne en quelques minutes",
  "product.kitchen.cards.0.alt":
    "Écran de succès ZanTap avec le lien de la boutique et un code QR",
  "product.kitchen.cards.1.caption": "Les clients paient par MoMo",
  "product.kitchen.cards.1.alt":
    "Écran de paiement ZanTap demandant au client de payer avec MoMo",
  "product.kitchen.cards.2.caption": "Les commandes arrivent dans votre cuisine",
  "product.kitchen.cards.2.alt":
    "Tableau de cuisine ZanTap listant les commandes payées",

  "scrollWorld.kicker": "Une commande, du début à la fin",
  "scrollWorld.heading": "Parcourez le trajet.",
  "scrollWorld.hint": "Faites défiler pour parcourir",
  "scrollWorld.sections.0.label": "La boutique",
  "scrollWorld.sections.0.eyebrow": "Kigali, heure dorée",
  "scrollWorld.sections.0.title": "Tout commence à votre comptoir.",
  "scrollWorld.sections.0.body":
    "Votre bonne cuisine attire déjà du monde. ZanTap leur donne un moyen plus simple de vous joindre — où qu'ils soient.",
  "scrollWorld.sections.1.label": "La commande",
  "scrollWorld.sections.1.eyebrow": "Un lien simple",
  "scrollWorld.sections.1.title": "Ils commandent depuis leur téléphone.",
  "scrollWorld.sections.1.body":
    "Aucune application à télécharger. Votre menu, vos prix, un lien à partager sur WhatsApp, Instagram ou ailleurs.",
  "scrollWorld.sections.2.label": "Paiement MoMo",
  "scrollWorld.sections.2.eyebrow": "Payé avant de cuisiner",
  "scrollWorld.sections.2.title": "Paiement MoMo, confirmé.",
  "scrollWorld.sections.2.body":
    "Les clients paient avec MTN MoMo. Vous voyez l'argent avant que la cuisine ne démarre — sans courir après, sans deviner.",
  "scrollWorld.sections.3.label": "La cuisine",
  "scrollWorld.sections.3.eyebrow": "La vue cuisine",
  "scrollWorld.sections.3.title": "Chaque commande payée, sur un seul écran.",
  "scrollWorld.sections.3.body":
    "Nouvelle, en préparation, prête — votre équipe suit une file claire au lieu de faire défiler des messages.",
  "scrollWorld.sections.4.label": "Expédition",
  "scrollWorld.sections.4.eyebrow": "En livraison",
  "scrollWorld.sections.4.title": "De votre porte à la leur.",
  "scrollWorld.sections.4.body":
    "Assignez un livreur et envoyez la commande, avec un bordereau de livraison qui contient tout le nécessaire.",
  "scrollWorld.sections.5.label": "Grandir",
  "scrollWorld.sections.5.eyebrow": "Fait au Rwanda",
  "scrollWorld.sections.5.title": "Plus de commandes. Des soirées plus pleines.",
  "scrollWorld.sections.5.body":
    "Les premiers partenaires sélectionnés bénéficient d'une installation gratuite et accompagnée. Votre commerce alimentaire, en ligne — avec de l'aide.",
  "scrollWorld.sections.5.cta": "Commencer",
  "scrollWorld.media.momoLogoAlt": "Logo MoMo de MTN",
  "scrollWorld.media.momoScreenAlt": "Paiement MoMo sur un téléphone",
  "scrollWorld.media.storefrontScreenAlt": "Une boutique ZanTap sur un téléphone",
  "scrollWorld.media.kitchenScreenAlt": "Le tableau de cuisine ZanTap",

  "comparison.kicker": "Pourquoi changer ?",
  "comparison.heading": "La même cuisine. Un meilleur système.",
  "comparison.rows.0.problem": "Des commissions qui rongent vos marges",
  "comparison.rows.0.solution": "Des frais réduits — vos revenus restent à vous",
  "comparison.rows.1.problem": "Les plateformes concurrentes possèdent vos clients",
  "comparison.rows.1.solution": "Votre propre tableau de cuisine et votre lien",
  "comparison.rows.2.problem": "Suivi des ventes sur papier et approximations",
  "comparison.rows.2.solution": "Système de vente numérique, registres clairs",
  "comparison.rows.3.problem": "Aucune visibilité sur le stock ou la demande",
  "comparison.rows.3.solution": "Suivi du stock et de la demande, intégré",

  "offer.kicker": "Offre premiers partenaires",
  "offer.heading": "Nous vous aidons à tout installer. Vous commencez à recevoir des commandes.",
  "offer.intro": "Pour des commerces alimentaires partenaires sélectionnés au Rwanda.",
  "offer.includes.0": "Votre propre lien de commande",
  "offer.includes.1": "Configuration du premier menu",
  "offer.includes.2": "Configuration du paiement MoMo",
  "offer.includes.3": "Accompagnement personnel sur WhatsApp",
  "offer.cta": "Demander l'installation",
  "offer.smallPrint": "Pas de contrat longue durée. Aucune pression.",

  "close.kicker": "Fait ici. Prêt à grandir.",
  "close.heading": "Commencez au Rwanda. Grandissez en Afrique de l'Est.",
  "close.cta": "Commencer",

  "footer.tagline": "Tapez. Servez. Grandissez.",
  "footer.location": "Kigali, Rwanda",
  "footer.privacyLabel": "Confidentialité",
  "footer.termsLabel": "Conditions",

  stickyCta: "Commencer",
};

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'fr' | 'en';

export const translations = {
  fr: {
    common: {
      add: "Ajouter",
      edit: "Modifier",
      delete: "Supprimer",
      cancel: "Annuler",
      save: "Sauvegarder",
      confirm: "Confirmer",
      validate: "Valider",
      search: "Rechercher...",
      buy_now: "Acheter",
      loading: "Chargement...",
      error: "Erreur",
      success: "Succès",
      date: "Date",
      amount: "Montant",
      description: "Description",
      type: "Type",
      status: "Statut",
      actions: "Actions",
      reset: "Reset",
      apply: "Appliquer",
      all: "Tout",
    },
    nav: {
      dashboard: "Tableau de bord",
      inventory: "Inventaire",
      pricing: "Guide des Cotes",
      finances: "Comptabilité",
      logout: "Déconnexion",
      connected: "Connecté",
      sync: "Sauvegarde",
      theme_dark: "Sombre",
      theme_light: "Clair",
    },
    dashboard: {
      title: "Tableau de bord",
      subtitle: "Vue d'ensemble de l'activité",
      realtime: "Temps Réel",
      total_profit: "Profit Total",
      goal: "Objectif",
      avg_margin: "Marge Moy.",
      per_sale: "Par vente",
      stock_count: "Stock",
      active_items: "Articles actifs",
      profitability_chart: "Analyse de la Rentabilité (Top 15)",
    },
    inventory: {
      title: "Inventaire",
      subtitle: "Gestion du stock & Ventes",
      tab_stock: "Stock",
      tab_sales: "Ventes",
      paste_ad: "Coller Annonce",
      export_csv: "Exporter CSV",
      sort_id_desc: "ID Décroissant",
      sort_id_asc: "ID Croissant",
      sort_price_desc: "Prix Décroissant",
      sort_price_asc: "Prix Croissant",
      filters: "Filtres",
      item_card: {
        purchase: "Achat",
        listed: "Listé",
        sold: "Vendu",
        profit: "Marge",
        days: "j",
      },
      form: {
        new: "Nouveau",
        edit: "Modification",
        image: "Image",
        id_auto: "Auto",
        brand: "Marque",
        category: "Catégorie",
        select: "Sélectionner...",
        status: "Statut Actuel",
        reception: "Réception",
        sale_date: "Vente",
        size: "Taille",
        condition: "État",
        boost: "Option Boost",
        boost_desc: "Visibilité Vinted",
        cost: "COÛT",
        purchase_price: "Prix Achat",
        listed_price: "Prix Listé",
        sold_price: "Prix Final Vendu",
        est_margin: "Marge Brute Estimée",
        save_btn: "Sauvegarder l'article",
      },
      parser: {
        title: "Parser Vinted",
        desc: "Copiez tout le texte d'une annonce (Titre, Description, Marque...) et collez-le ici. L'IA remplira le formulaire pour vous.",
        placeholder: "Collez le texte de l'annonce ici...",
        btn: "Analyser & Remplir",
      }
    },
    finances: {
      title: "Comptabilité",
      subtitle: "Finance & Analyses",
      tab_cashflow: "Trésorerie",
      tab_analytics: "Sniper Analytics",
      cashflow: {
        real_cash: "Trésorerie Réelle (Cash)",
        pending: "en attente",
        entries: "Entrées (CA)",
        outputs: "Sorties (Achats + Boosts)",
        record_move: "Enregistrer un mouvement",
        history: "Journal des Flux",
        alert: "Attention : Trésorerie Critique",
        alert_desc: "Votre solde réel est inférieur à votre seuil de sécurité.",
      },
      team: {
        title: "Équipe & Parts",
        subtitle: "Gérez vos associés et accès",
        share: "Part",
        remaining: "Reste",
        invite: "Inviter un associé",
        add_member: "Ajouter Associé",
        shared_access: "Accès Partagés",
      },
      recurring: {
        title: "Dépenses Récurrentes",
        subtitle: "Abonnements, Logiciels, Forfaits...",
        next: "Prochain",
        inactive: "Inactif",
        empty: "Aucune dépense récurrente configurée",
        form_title: "Abonnement Récurrent",
        name_label: "Nom de la charge",
        amount_label: "Montant",
        freq_label: "Fréquence",
        monthly: "Mensuel",
        yearly: "Annuel",
        weekly: "Hebdo",
        due_date: "Prochaine Échéance",
      },
      analytics: {
        brand_star: "Marque Star",
        best_day: "Meilleur Jour",
        total_margin: "Marge Totale Réalisée",
        profit_by_brand: "Rentabilité par Marque",
        margin_by_cat: "Marge par Catégorie",
        roi_size: "ROI par Taille",
        sales_freq: "Fréquence de vente",
        not_enough_data: "Pas assez de ventes pour générer des analyses."
      }
    },
    pricing: {
      title: "Pricing Guide",
      subtitle: "Intelligence de Marché & Marges",
      compare: "Comparer",
      search_placeholder: "Rechercher un modèle...",
      all_brands: "Toutes les marques",
      sort_volume: "Trier par volume",
      sort_profit: "Trier par profit",
      sort_rotation: "Trier par rotation",
      avg_price: "P.V. Moy",
      rotation: "Rotation",
      avg_margin: "Marge Moy.",
      copies: "exemplaires",
      sold: "vendus",
      all_items: "Tous les articles enregistrés",
    },
    status: {
      EN_TRANSIT: "En Transit",
      EN_STOCK: "En Stock",
      ATTENTE_PAIEMENT: "Attente Paiement",
      VENDU: "Vendu",
      EN_COURS: "En cours",
      RETOURNÉ: "Retourné",
      LITIGE: "Litige",
    },
    subStatus: {
      A_PHOTOGRAPHIER: "À photographier",
      EN_LIGNE: "En ligne",
      A_EXPEDIER: "À expédier",
      AUCUN: "Aucun",
    }
  },
  en: {
    common: {
      add: "Add",
      edit: "Edit",
      delete: "Delete",
      cancel: "Cancel",
      save: "Save",
      confirm: "Confirm",
      validate: "Validate",
      search: "Search...",
      buy_now: "Buy Now",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      date: "Date",
      amount: "Amount",
      description: "Description",
      type: "Type",
      status: "Status",
      actions: "Actions",
      reset: "Reset",
      apply: "Apply",
      all: "All",
    },
    nav: {
      dashboard: "Dashboard",
      inventory: "Inventory",
      pricing: "Pricing Guide",
      finances: "Accounting",
      logout: "Logout",
      connected: "Connected",
      sync: "Sync",
      theme_dark: "Dark",
      theme_light: "Light",
    },
    dashboard: {
      title: "Dashboard",
      subtitle: "Activity Overview",
      realtime: "Realtime",
      total_profit: "Total Profit",
      goal: "Goal",
      avg_margin: "Avg Margin",
      per_sale: "Per sale",
      stock_count: "Stock",
      active_items: "Active items",
      profitability_chart: "Profitability Analysis (Top 15)",
    },
    inventory: {
      title: "Inventory",
      subtitle: "Stock Management & Sales",
      tab_stock: "Stock",
      tab_sales: "Sales",
      paste_ad: "Paste Ad",
      export_csv: "Export CSV",
      sort_id_desc: "ID Descending",
      sort_id_asc: "ID Ascending",
      sort_price_desc: "Price Descending",
      sort_price_asc: "Price Ascending",
      filters: "Filters",
      item_card: {
        purchase: "Buy",
        listed: "Listed",
        sold: "Sold",
        profit: "Profit",
        days: "d",
      },
      form: {
        new: "New",
        edit: "Edit",
        image: "Image",
        id_auto: "Auto",
        brand: "Brand",
        category: "Category",
        select: "Select...",
        status: "Current Status",
        reception: "Reception",
        sale_date: "Sale Date",
        size: "Size",
        condition: "Condition",
        boost: "Boost Option",
        boost_desc: "Vinted Visibility",
        cost: "COST",
        purchase_price: "Purchase Price",
        listed_price: "Listed Price",
        sold_price: "Final Sold Price",
        est_margin: "Est. Gross Margin",
        save_btn: "Save Item",
      },
      parser: {
        title: "Vinted Parser",
        desc: "Copy all text from an ad (Title, Description, Brand...) and paste it here. AI will fill the form for you.",
        placeholder: "Paste ad text here...",
        btn: "Analyze & Fill",
      }
    },
    finances: {
      title: "Accounting",
      subtitle: "Finance & Analytics",
      tab_cashflow: "Cashflow",
      tab_analytics: "Sniper Analytics",
      cashflow: {
        real_cash: "Real Cashflow",
        pending: "pending",
        entries: "Income (Revenue)",
        outputs: "Expenses (Buy + Boosts)",
        record_move: "Record Transaction",
        history: "Transaction Log",
        alert: "Warning: Critical Cashflow",
        alert_desc: "Your real balance is below your safety threshold.",
      },
      team: {
        title: "Team & Shares",
        subtitle: "Manage partners and access",
        share: "Share",
        remaining: "Remaining",
        invite: "Invite Partner",
        add_member: "Add Member",
        shared_access: "Shared Access",
      },
      recurring: {
        title: "Recurring Expenses",
        subtitle: "Subscriptions, Software, Plans...",
        next: "Next",
        inactive: "Inactive",
        empty: "No recurring expenses configured",
        form_title: "Recurring Subscription",
        name_label: "Expense Name",
        amount_label: "Amount",
        freq_label: "Frequency",
        monthly: "Monthly",
        yearly: "Yearly",
        weekly: "Weekly",
        due_date: "Next Due Date",
      },
      analytics: {
        brand_star: "Star Brand",
        best_day: "Best Day",
        total_margin: "Total Margin Realized",
        profit_by_brand: "Profitability by Brand",
        margin_by_cat: "Margin by Category",
        roi_size: "ROI by Size",
        sales_freq: "Sales Frequency",
        not_enough_data: "Not enough sales to generate analytics."
      }
    },
    pricing: {
      title: "Pricing Guide",
      subtitle: "Market Intelligence & Margins",
      compare: "Compare",
      search_placeholder: "Search model...",
      all_brands: "All Brands",
      sort_volume: "Sort by Volume",
      sort_profit: "Sort by Profit",
      sort_rotation: "Sort by Rotation",
      avg_price: "Avg Price",
      rotation: "Rotation",
      avg_margin: "Avg Margin",
      copies: "copies",
      sold: "sold",
      all_items: "All registered items",
    },
    status: {
      EN_TRANSIT: "In Transit",
      EN_STOCK: "In Stock",
      ATTENTE_PAIEMENT: "Payment Pending",
      VENDU: "Sold",
      EN_COURS: "Pending",
      RETOURNÉ: "Returned",
      LITIGE: "Dispute",
    },
    subStatus: {
      A_PHOTOGRAPHIER: "To photograph",
      EN_LIGNE: "Online",
      A_EXPEDIER: "To ship",
      AUCUN: "None",
    }
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.fr;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('vpro_lang') as Language) || 'fr';
  });

  useEffect(() => {
    localStorage.setItem('vpro_lang', language);
  }, [language]);

  const value = {
    language,
    setLanguage,
    t: translations[language]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

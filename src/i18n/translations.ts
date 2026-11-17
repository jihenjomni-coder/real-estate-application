import { CurrencyCode, LanguageCode } from '../types';

export const CURRENCY_RATES_FROM_AED: Record<CurrencyCode, number> = {
  AED: 1,
  USD: 0.2723,
  EUR: 0.251,
  TND: 0.852,
};

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  AED: 'AED',
  USD: '$',
  EUR: '€',
  TND: 'TND',
};

export function convertFromAED(amountInAed: number, currency: CurrencyCode): number {
  return Math.round(amountInAed * CURRENCY_RATES_FROM_AED[currency]);
}

export function convertToAED(amountInCurrency: number, currency: CurrencyCode): number {
  return Math.round(amountInCurrency / CURRENCY_RATES_FROM_AED[currency]);
}

export function formatMoney(
  amountInAed: number,
  currency: CurrencyCode,
  compact = false
): string {
  const val = convertFromAED(amountInAed, currency);
  const symbol = CURRENCY_SYMBOLS[currency];
  if (compact && Math.abs(val) >= 1_000_000) {
    const m = (val / 1_000_000).toFixed(2).replace(/\.00$/, '');
    return currency === 'USD' || currency === 'EUR' ? `${symbol}${m}M` : `${m}M ${symbol}`;
  }
  const formatted = new Intl.NumberFormat('en-US').format(val);
  return currency === 'USD' || currency === 'EUR'
    ? `${symbol}${formatted}`
    : `${formatted} ${symbol}`;
}

type TranslationDict = Record<string, string>;

const en: TranslationDict = {
  brand: 'Harbour & Crest',
  publicNavListings: 'Listings',
  publicNavServices: 'Advisory',
  publicNavNeighborhoods: 'Dubai Areas',
  publicNavCompare: 'Compare',
  publicNavPortal: 'Agency Portal',
  heroEyebrow: 'Dubai RERA Registered Brokerage · ORN 28419',
  heroTitle: 'Residential sales, leasing, and asset stewardship across Dubai.',
  heroSubtitle:
    'Explore verified residences, waterfront villas, and Grade-A commercial spaces from Downtown Dubai to Palm Jumeirah.',
  buy: 'Buy',
  rent: 'Rent',
  all: 'All',
  searchPlaceholder: 'Search community, building, or keyword...',
  aiSearchPlaceholder: 'Try AI search: "3-bedroom apartment near the sea under 18000"',
  searchAction: 'Search Properties',
  aiSearchAction: 'AI Search',
  navDashboard: 'Dashboard',
  navListings: 'Listings',
  navCrm: 'CRM & Leads',
  navVisits: 'Visits & Calendar',
  navDeals: 'Sales Deals',
  navRentals: 'Rentals & Mgmt',
  navDocuments: 'Documents',
  navAiStudio: 'AI Studio',
  navSettings: 'Settings',
  navPublicSite: 'Public Website',
  roleAdmin: 'Agency Admin',
  roleAgent: 'Broker / Agent',
  roleLandlord: 'Landlord / Owner',
  roleTenant: 'Tenant',
  rolePublic: 'Public Visitor',
  switchRole: 'Switch Role',
  statusAvailable: 'Available',
  statusDraft: 'Draft',
  statusUnderOffer: 'Under Offer',
  statusReserved: 'Reserved',
  statusSold: 'Sold',
  statusRented: 'Rented',
  statusOffMarket: 'Off Market',
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  edit: 'Edit',
  create: 'Create',
  exportCsv: 'Export CSV',
  generatePdf: 'Download PDF',
  sqm: 'm²',
  beds: 'Beds',
  baths: 'Baths',
  perMonth: '/ mo',
  perYear: '/ yr',
};

const fr: TranslationDict = {
  brand: 'Harbour & Crest',
  publicNavListings: 'Biens',
  publicNavServices: 'Conseil',
  publicNavNeighborhoods: 'Quartiers',
  publicNavCompare: 'Comparer',
  publicNavPortal: 'Portail Agence',
  heroEyebrow: 'Agence Agréée RERA Dubaï · ORN 28419',
  heroTitle: 'Vente, location et gestion patrimoniale à travers Dubaï.',
  heroSubtitle:
    'Découvrez des résidences vérifiées, villas en bord de mer et bureaux Grade-A de Downtown Dubai à Palm Jumeirah.',
  buy: 'Acheter',
  rent: 'Louer',
  all: 'Tous',
  searchPlaceholder: 'Quartier, résidence ou mot-clé...',
  aiSearchPlaceholder: 'Recherche IA : "Appartement 3 chambres près de la mer moins de 18000"',
  searchAction: 'Rechercher',
  aiSearchAction: 'Recherche IA',
  navDashboard: 'Tableau de bord',
  navListings: 'Biens',
  navCrm: 'CRM & Clients',
  navVisits: 'Visites & Agenda',
  navDeals: 'Transactions',
  navRentals: 'Gestion Locative',
  navDocuments: 'Documents',
  navAiStudio: 'Studio IA',
  navSettings: 'Paramètres',
  navPublicSite: 'Site Public',
  roleAdmin: 'Administrateur',
  roleAgent: 'Agent Immobilier',
  roleLandlord: 'Propriétaire',
  roleTenant: 'Locataire',
  rolePublic: 'Visiteur Public',
  switchRole: 'Changer de rôle',
  statusAvailable: 'Disponible',
  statusDraft: 'Brouillon',
  statusUnderOffer: 'Sous offre',
  statusReserved: 'Réservé',
  statusSold: 'Vendu',
  statusRented: 'Loué',
  statusOffMarket: 'Hors marché',
  save: 'Enregistrer',
  cancel: 'Annuler',
  delete: 'Supprimer',
  edit: 'Modifier',
  create: 'Créer',
  exportCsv: 'Exporter CSV',
  generatePdf: 'Télécharger PDF',
  sqm: 'm²',
  beds: 'Ch.',
  baths: 'Sdb',
  perMonth: '/ mois',
  perYear: '/ an',
};

const ar: TranslationDict = {
  brand: 'هاربور آند كريست',
  publicNavListings: 'العقارات',
  publicNavServices: 'الاستشارات',
  publicNavNeighborhoods: 'مناطق دبي',
  publicNavCompare: 'مقارنة',
  publicNavPortal: 'بوابة الوكالة',
  heroEyebrow: 'وساطة عقارية مرخصة من ريرا دبي · ORN 28419',
  heroTitle: 'مبيعات وتأجير وإدارة العقارات في أبرز مناطق دبي.',
  heroSubtitle:
    'استكشف شققاً فاخرة، فلل واجهة بحرية، ومكاتب تجارية في داون تاون دبي ونخلة جميرا ومارينا دبي.',
  buy: 'شراء',
  rent: 'إيجار',
  all: 'الكل',
  searchPlaceholder: 'ابحث بالمنطقة أو البرج أو الكلمة المفتاحية...',
  aiSearchPlaceholder: 'بحث ذكي: "شقة 3 غرف نوم قرب البحر بأقل من 18000"',
  searchAction: 'بحث عن عقار',
  aiSearchAction: 'بحث بالذكاء الاصطناعي',
  navDashboard: 'لوحة التحكم',
  navListings: 'العقارات',
  navCrm: 'العملاء والفرص',
  navVisits: 'الزيارات والتقويم',
  navDeals: 'صفقات البيع',
  navRentals: 'الإيجارات والصيانة',
  navDocuments: 'المستندات',
  navAiStudio: 'أدوات الذكاء الاصطناعي',
  navSettings: 'الإعدادات',
  navPublicSite: 'الموقع العام',
  roleAdmin: 'مدير الوكالة',
  roleAgent: 'وسيط عقاري',
  roleLandlord: 'مالك العقار',
  roleTenant: 'المستأجر',
  rolePublic: 'زائر الموقع',
  switchRole: 'تبديل الدور',
  statusAvailable: 'متاح',
  statusDraft: 'مسودة',
  statusUnderOffer: 'تحت العرض',
  statusReserved: 'محجوز',
  statusSold: 'مباع',
  statusRented: 'مؤجر',
  statusOffMarket: 'خارج السوق',
  save: 'حفظ',
  cancel: 'إلغاء',
  delete: 'حذف',
  edit: 'تعديل',
  create: 'إنشاء',
  exportCsv: 'تصدير CSV',
  generatePdf: 'تحميل PDF',
  sqm: 'م²',
  beds: 'غرف',
  baths: 'حمام',
  perMonth: '/ شهر',
  perYear: '/ سنة',
};

const DICTIONARIES: Record<LanguageCode, TranslationDict> = { en, fr, ar };

export function t(lang: LanguageCode, key: string): string {
  return DICTIONARIES[lang]?.[key] ?? en[key] ?? key;
}

import React, { useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  Building2,
  Grid,
  Heart,
  List,
  Loader2,
  Map as MapIcon,
  Moon,
  Search,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { useAppStore } from '../../hooks/useAppStore';
import { convertToAED, formatMoney, t } from '../../i18n/translations';
import { IMG } from '../../data/seedData';
import { CurrencyCode, LanguageCode, Property, PropertyType, SmartSearchFilters } from '../../types';
import { aiService } from '../../services/aiService';
import { EmptyState, PropertyImage, inputClassName } from '../../components/ui/Primitives';
import { LeafletMap } from '../../components/ui/LeafletMap';
import { PropertyCard } from './PropertyCard';
import { PropertyDetail } from './PropertyDetail';

type PublicPage = 'home' | 'listings' | 'detail' | 'compare' | 'favorites';

interface PublicSiteProps {
  onOpenRoleSwitcher: () => void;
  onEnterBackOffice: () => void;
}

export const PublicSite: React.FC<PublicSiteProps> = ({
  onOpenRoleSwitcher,
  onEnterBackOffice,
}) => {
  const {
    db,
    toggleTheme,
    setLanguage,
    setCurrency,
    toggleFavorite,
    toggleCompare,
    clearCompare,
    addToast,
  } = useAppStore();

  const lang = db.settings.language;
  const currency = db.settings.currency;

  const [page, setPage] = useState<PublicPage>('home');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Catalog filters
  const [txFilter, setTxFilter] = useState<'all' | 'sale' | 'rent'>('all');
  const [communityFilter, setCommunityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | PropertyType>('all');
  const [minBeds, setMinBeds] = useState<number>(0);
  const [minRooms, setMinRooms] = useState<number>(0);
  const [minSurface, setMinSurface] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [onlyFurnished, setOnlyFurnished] = useState(false);
  const [onlyParking, setOnlyParking] = useState(false);
  const [onlyPool, setOnlyPool] = useState(false);
  const [onlyElevator, setOnlyElevator] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'surface_desc'>(
    'newest'
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');

  // AI Smart Search
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [nearSeaFilter, setNearSeaFilter] = useState(false);

  const publicProperties = useMemo(
    () =>
      db.properties.filter(
        (p) => p.status !== 'draft' && p.status !== 'off_market'
      ),
    [db.properties]
  );

  const communities = useMemo(
    () => Array.from(new Set(publicProperties.map((p) => p.community))).sort(),
    [publicProperties]
  );

  const filteredListings = useMemo(() => {
    const minPriceAed = minPrice ? convertToAED(Number(minPrice), currency) : 0;
    const maxPriceAed = maxPrice ? convertToAED(Number(maxPrice), currency) : 0;
    const minSurfNum = minSurface ? Number(minSurface) : 0;
    const kw = keyword.trim().toLowerCase();

    const matches = publicProperties.filter((p) => {
      if (txFilter === 'sale' && p.transactionType === 'rent') return false;
      if (txFilter === 'rent' && p.transactionType === 'sale') return false;
      if (communityFilter !== 'all' && p.community !== communityFilter) return false;
      if (typeFilter !== 'all' && p.propertyType !== typeFilter) return false;
      if (minBeds > 0 && p.bedrooms < minBeds) return false;
      if (minRooms > 0 && p.rooms < minRooms) return false;
      if (minSurfNum > 0 && p.surface < minSurfNum) return false;

      const relevantPrice = txFilter === 'rent' ? p.rentAmount : p.price;
      if (minPriceAed > 0 && relevantPrice < minPriceAed) return false;
      if (maxPriceAed > 0 && relevantPrice > maxPriceAed) return false;

      if (onlyFurnished && !p.furnished) return false;
      if (onlyParking && !p.parking) return false;
      if (onlyPool && !p.pool) return false;
      if (onlyElevator && !p.elevator) return false;

      if (nearSeaFilter) {
        const coastal = ['Palm Jumeirah', 'Dubai Marina', 'JBR', 'Bluewaters Island', 'Dubai Creek Harbour'];
        if (!coastal.includes(p.community)) return false;
      }

      if (kw) {
        const hay = `${p.title} ${p.community} ${p.address} ${p.referenceCode} ${p.description}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });

    return [...matches].sort((a, b) => {
      if (sortBy === 'price_asc') {
        const pa = txFilter === 'rent' ? a.rentAmount : a.price;
        const pb = txFilter === 'rent' ? b.rentAmount : b.price;
        return pa - pb;
      }
      if (sortBy === 'price_desc') {
        const pa = txFilter === 'rent' ? a.rentAmount : a.price;
        const pb = txFilter === 'rent' ? b.rentAmount : b.price;
        return pb - pa;
      }
      if (sortBy === 'surface_desc') {
        return b.surface - a.surface;
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [
    publicProperties,
    txFilter,
    communityFilter,
    typeFilter,
    minBeds,
    minRooms,
    minSurface,
    minPrice,
    maxPrice,
    currency,
    onlyFurnished,
    onlyParking,
    onlyPool,
    onlyElevator,
    nearSeaFilter,
    keyword,
    sortBy,
  ]);

  const resetFilters = () => {
    setTxFilter('all');
    setCommunityFilter('all');
    setTypeFilter('all');
    setMinBeds(0);
    setMinRooms(0);
    setMinSurface('');
    setMinPrice('');
    setMaxPrice('');
    setOnlyFurnished(false);
    setOnlyParking(false);
    setOnlyPool(false);
    setOnlyElevator(false);
    setNearSeaFilter(false);
    setKeyword('');
    setAiSummary(null);
  };

  const applyAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    try {
      const filters: SmartSearchFilters = await aiService.smartSearch(aiQuery, communities);
      setTxFilter(filters.transactionType || 'all');
      setTypeFilter(filters.propertyType || 'all');
      setCommunityFilter(
        filters.community && communities.includes(filters.community) ? filters.community : 'all'
      );
      setMinBeds(filters.minBedrooms || 0);
      setOnlyFurnished(Boolean(filters.furnished));
      setOnlyPool(Boolean(filters.pool));
      setNearSeaFilter(Boolean(filters.nearSea));
      setKeyword(filters.keywords || '');
      if (filters.maxPriceAed && filters.maxPriceAed > 0) {
        // Convert AED max into current display currency input
        const rateRatio = convertToAED(1000, currency) / 1000;
        setMaxPrice(String(Math.round(filters.maxPriceAed / rateRatio)));
      } else {
        setMaxPrice('');
      }
      setAiSummary(filters.summary || `Matched filters for "${aiQuery}"`);
      setPage('listings');
      addToast('AI search applied', 'success', filters.summary);
    } catch (err) {
      addToast(
        'AI search unavailable',
        'error',
        err instanceof Error ? err.message : 'Check GEMINI_API_KEY configuration.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const openDetail = (id: string) => {
    setSelectedPropertyId(id);
    setPage('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const featuredProperties = useMemo(
    () => publicProperties.filter((p) => p.featured).slice(0, 6),
    [publicProperties]
  );

  const comparedProperties = useMemo(
    () =>
      db.compareIds
        .map((id) => db.properties.find((p) => p.id === id))
        .filter((p): p is Property => Boolean(p)),
    [db.compareIds, db.properties]
  );

  const favoriteProperties = useMemo(
    () =>
      db.favorites
        .map((id) => db.properties.find((p) => p.id === id))
        .filter((p): p is Property => Boolean(p)),
    [db.favorites, db.properties]
  );

  const communityHighlights = [
    { name: 'Palm Jumeirah', tagline: 'Private beachfront fronds & resort residences', img: IMG.PALM_VILLA },
    { name: 'Downtown Dubai', tagline: 'Boulevard towers & Opera District living', img: IMG.DOWNTOWN_APT },
    { name: 'Dubai Marina', tagline: 'Yacht berths, promenades & sky penthouses', img: IMG.MARINA_PENTHOUSE },
    { name: 'DIFC', tagline: 'Grade-A financial suites & urban residences', img: IMG.DIFC_OFFICE },
    { name: 'Dubai Hills Estate', tagline: 'Parkside family townhouses & golf villas', img: IMG.HILLS_TOWNHOUSE },
    { name: 'Dubai Creek Harbour', tagline: 'Lagoon waterfront & sunset skyline views', img: IMG.CREEK_RESIDENCE },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single clean wordmark */}
          <button
            type="button"
            onClick={() => setPage('home')}
            className="text-lg font-display font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            {t(lang, 'brand')}
          </button>

          {/* Zone 2: 4-5 clean single-line text links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setPage('listings')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                page === 'listings' ? 'text-teal-700 dark:text-teal-400 font-semibold' : ''
              }`}
            >
              {t(lang, 'publicNavListings')}
            </button>
            <button
              type="button"
              onClick={() => {
                setPage('home');
                setTimeout(() => {
                  document.getElementById('dubai-communities')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              {t(lang, 'publicNavNeighborhoods')}
            </button>
            <button
              type="button"
              onClick={() => {
                setPage('home');
                setTimeout(() => {
                  document.getElementById('agency-advisory')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              {t(lang, 'publicNavServices')}
            </button>
            <button
              type="button"
              onClick={() => setPage('favorites')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                page === 'favorites' ? 'text-teal-700 dark:text-teal-400 font-semibold' : ''
              }`}
            >
              Saved ({db.favorites.length})
            </button>
            <button
              type="button"
              onClick={() => setPage('compare')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                page === 'compare' ? 'text-teal-700 dark:text-teal-400 font-semibold' : ''
              }`}
            >
              {t(lang, 'publicNavCompare')} ({db.compareIds.length})
            </button>
          </nav>

          {/* Zone 3: 1 Primary CTA */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => {
                if (db.currentRole === 'public') {
                  onOpenRoleSwitcher();
                } else {
                  onEnterBackOffice();
                }
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-teal-600 text-white hover:bg-slate-800 dark:hover:bg-teal-500 transition-colors whitespace-nowrap shrink-0"
            >
              {t(lang, 'publicNavPortal')}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {page === 'home' && (
          <div className="flex flex-col gap-16 pb-16">
            {/* Hero Section */}
            <section className="relative bg-slate-900 text-white overflow-hidden">
              <div className="absolute inset-0">
                <PropertyImage
                  src={IMG.HERO}
                  alt="Dubai Marina and Downtown Dubai luxury residential skyline"
                  className="w-full h-full object-cover opacity-55"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-950/40" />
              </div>

              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex flex-col gap-10">
                <div className="max-w-3xl flex flex-col gap-4">
                  <p className="text-xs font-medium tracking-wide text-teal-300">
                    {t(lang, 'heroEyebrow')}
                  </p>
                  <h1 className="text-3xl sm:text-5xl font-display font-semibold tracking-tight text-white text-balance leading-[1.12]">
                    {t(lang, 'heroTitle')}
                  </h1>
                  <p className="text-base sm:text-lg text-slate-200 max-w-2xl leading-relaxed">
                    {t(lang, 'heroSubtitle')}
                  </p>
                </div>

                {/* Search & AI Natural Language Search Box */}
                <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col gap-4">
                  {/* Buy / Rent / All segmented tabs + utility toggles */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      {(['all', 'sale', 'rent'] as const).map((tx) => (
                        <button
                          key={tx}
                          type="button"
                          onClick={() => setTxFilter(tx)}
                          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                            txFilter === tx
                              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {tx === 'all' ? t(lang, 'all') : tx === 'sale' ? t(lang, 'buy') : t(lang, 'rent')}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                        aria-label="Select currency"
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-mono font-medium"
                      >
                        <option value="AED">AED</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="TND">TND</option>
                      </select>
                      <select
                        value={lang}
                        onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                        aria-label="Select language"
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium"
                      >
                        <option value="en">EN</option>
                        <option value="fr">FR</option>
                        <option value="ar">AR</option>
                      </select>
                      <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        {db.settings.theme === 'dark' ? (
                          <Sun className="w-3.5 h-3.5" />
                        ) : (
                          <Moon className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Standard Hero Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <select
                      value={communityFilter}
                      onChange={(e) => setCommunityFilter(e.target.value)}
                      className={inputClassName}
                    >
                      <option value="all">All Dubai Communities</option>
                      {communities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>

                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as 'all' | PropertyType)}
                      className={inputClassName}
                    >
                      <option value="all">All Property Types</option>
                      <option value="apartment">Apartment</option>
                      <option value="villa">Villa</option>
                      <option value="house">Townhouse / House</option>
                      <option value="office">Office</option>
                      <option value="commercial">Commercial / Retail</option>
                      <option value="land">Land Plot</option>
                    </select>

                    <select
                      value={minBeds}
                      onChange={(e) => setMinBeds(Number(e.target.value))}
                      className={inputClassName}
                    >
                      <option value={0}>Any Bedrooms</option>
                      <option value={1}>1+ Bedrooms</option>
                      <option value={2}>2+ Bedrooms</option>
                      <option value={3}>3+ Bedrooms</option>
                      <option value={4}>4+ Bedrooms</option>
                      <option value={5}>5+ Bedrooms</option>
                    </select>

                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder={`Max Price (${currency})`}
                      className={inputClassName}
                    />

                    <button
                      type="button"
                      onClick={() => setPage('listings')}
                      className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <Search className="w-4 h-4" />
                      {t(lang, 'searchAction')}
                    </button>
                  </div>

                  {/* Gemini AI Natural Language Search */}
                  <form
                    onSubmit={applyAiSearch}
                    className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                  >
                    <div className="relative flex-1">
                      <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={aiQuery}
                        onChange={(e) => setAiQuery(e.target.value)}
                        placeholder={t(lang, 'aiSearchPlaceholder')}
                        className={`${inputClassName} ps-9`}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={aiLoading}
                      className="px-4 py-2 rounded-lg border border-teal-700/30 bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-xs font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                    >
                      {aiLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      {t(lang, 'aiSearchAction')}
                    </button>
                  </form>
                </div>
              </div>
            </section>

            {/* Quantified Proof Strip (4 columns below hero) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { value: 'AED 1.4B+', label: 'Closed Dubai Sales Volume (2024–2026)' },
                  { value: '98.4%', label: 'Occupancy Across Managed Portfolio' },
                  { value: '14 Days', label: 'Average Lease Turnaround Time' },
                  { value: '520+', label: 'Registered Ejari & DLD Transactions' },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5"
                  >
                    <div className="text-2xl font-display font-semibold font-mono text-slate-900 dark:text-white tabular-nums">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Featured Properties */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-display font-semibold text-slate-900 dark:text-white">
                    Featured Dubai Portfolio
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Curated residences and waterfront estates inspected by our RERA advisory desk.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetFilters();
                    setPage('listings');
                  }}
                  className="text-sm font-medium text-teal-700 dark:text-teal-400 hover:underline whitespace-nowrap"
                >
                  Browse all {publicProperties.length} listings
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProperties.map((prop) => (
                  <PropertyCard
                    key={prop.id}
                    property={prop}
                    currency={currency}
                    isFavorite={db.favorites.includes(prop.id)}
                    isCompared={db.compareIds.includes(prop.id)}
                    onOpenDetail={openDetail}
                    onToggleFavorite={toggleFavorite}
                    onToggleCompare={toggleCompare}
                  />
                ))}
              </div>
            </section>

            {/* Dubai Communities */}
            <section
              id="dubai-communities"
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-6"
            >
              <div>
                <h2 className="text-2xl font-display font-semibold text-slate-900 dark:text-white">
                  Key Dubai Neighborhoods
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Select a district to filter active sales and leasing opportunities.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {communityHighlights.map((area) => {
                  const count = publicProperties.filter((p) => p.community === area.name).length;
                  return (
                    <button
                      key={area.name}
                      type="button"
                      onClick={() => {
                        resetFilters();
                        setCommunityFilter(area.name);
                        setPage('listings');
                      }}
                      className="group relative aspect-[16/10] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 text-start"
                    >
                      <PropertyImage
                        src={area.img}
                        alt={area.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent" />
                      <div className="absolute bottom-4 start-4 end-4 text-white">
                        <div className="text-xs font-mono text-teal-300 tabular-nums">
                          {count} active {count === 1 ? 'listing' : 'listings'}
                        </div>
                        <div className="text-lg font-display font-semibold mt-0.5">{area.name}</div>
                        <div className="text-xs text-slate-200 mt-0.5">{area.tagline}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Advisory Pillars */}
            <section
              id="agency-advisory"
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-6"
            >
              <div>
                <h2 className="text-2xl font-display font-semibold text-slate-900 dark:text-white">
                  Brokerage & Property Management Services
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: '01. Private Sales & Acquisitions',
                    body: 'End-to-end Dubai Land Department (DLD) transaction coordination, Form A/B/F compliance, bank valuation alignment, and developer NOC clearance.',
                  },
                  {
                    title: '02. Corporate & Residential Leasing',
                    body: 'Tenant vetting, Ejari contract registration, multi-cheque or transfer scheduling, and RERA rental index advisory for landlords.',
                  },
                  {
                    title: '03. Turnkey Asset Stewardship',
                    body: 'Monthly owner net statements, vetted MEP & chiller maintenance dispatch, and photographic move-in/move-out inspections.',
                  },
                ].map((pillar) => (
                  <div
                    key={pillar.title}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col gap-2"
                  >
                    <h3 className="text-base font-display font-semibold text-slate-900 dark:text-white">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {pillar.body}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {page === 'listings' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-display font-semibold text-slate-900 dark:text-white">
                  Dubai Properties ({filteredListings.length})
                </h1>
                {aiSummary && (
                  <p className="text-xs text-teal-700 dark:text-teal-400 mt-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{aiSummary}</span>
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
                >
                  <option value="newest">Sort: Newest Listed</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="surface_desc">Surface: Largest First</option>
                </select>

                <div className="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                    className={`p-1.5 rounded-md ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                    className={`p-1.5 rounded-md ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('map')}
                    aria-label="Map view"
                    className={`p-1.5 rounded-md ${
                      viewMode === 'map'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    <MapIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* AI Search + Filters Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-4">
              <form onSubmit={applyAiSearch} className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder={t(lang, 'aiSearchPlaceholder')}
                    className={`${inputClassName} ps-9`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                >
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {t(lang, 'aiSearchAction')}
                </button>
              </form>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                <select
                  value={txFilter}
                  onChange={(e) => setTxFilter(e.target.value as typeof txFilter)}
                  className={inputClassName}
                >
                  <option value="all">Buy & Rent</option>
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                </select>

                <select
                  value={communityFilter}
                  onChange={(e) => setCommunityFilter(e.target.value)}
                  className={inputClassName}
                >
                  <option value="all">All Areas</option>
                  {communities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as 'all' | PropertyType)}
                  className={inputClassName}
                >
                  <option value="all">All Types</option>
                  <option value="apartment">Apartment</option>
                  <option value="villa">Villa</option>
                  <option value="house">Townhouse</option>
                  <option value="office">Office</option>
                  <option value="commercial">Commercial</option>
                  <option value="land">Land</option>
                </select>

                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder={`Min (${currency})`}
                  className={inputClassName}
                />

                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder={`Max (${currency})`}
                  className={inputClassName}
                />

                <input
                  type="number"
                  value={minSurface}
                  onChange={(e) => setMinSurface(e.target.value)}
                  placeholder="Min m²"
                  className={inputClassName}
                />

                <select
                  value={minRooms}
                  onChange={(e) => setMinRooms(Number(e.target.value))}
                  className={inputClassName}
                >
                  <option value={0}>Any Rooms</option>
                  <option value={2}>2+ Rooms</option>
                  <option value={4}>4+ Rooms</option>
                  <option value={6}>6+ Rooms</option>
                  <option value={8}>8+ Rooms</option>
                </select>

                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Keyword..."
                  className={inputClassName}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 dark:text-slate-300">
                  {[
                    { label: 'Furnished', val: onlyFurnished, set: setOnlyFurnished },
                    { label: 'Parking', val: onlyParking, set: setOnlyParking },
                    { label: 'Swimming Pool', val: onlyPool, set: setOnlyPool },
                    { label: 'Elevator', val: onlyElevator, set: setOnlyElevator },
                    { label: 'Waterfront / Sea', val: nearSeaFilter, set: setNearSeaFilter },
                  ].map((chk) => (
                    <label key={chk.label} className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={chk.val}
                        onChange={(e) => chk.set(e.target.checked)}
                        className="rounded border-slate-300 accent-teal-600"
                      />
                      <span>{chk.label}</span>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white underline"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {/* Catalog Output */}
            {filteredListings.length === 0 ? (
              <EmptyState
                icon={<Building2 className="w-8 h-8" />}
                title="No matching Dubai properties"
                description="Try broadening your budget range, bedrooms, or community filter."
                action={
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-4 py-2 rounded-lg bg-teal-700 text-white text-xs font-medium"
                  >
                    Clear All Filters
                  </button>
                }
              />
            ) : viewMode === 'map' ? (
              <LeafletMap
                properties={filteredListings}
                currency={currency}
                height="560px"
                onSelectProperty={openDetail}
              />
            ) : (
              <div
                className={
                  viewMode === 'list'
                    ? 'flex flex-col gap-5'
                    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                }
              >
                {filteredListings.map((prop) => (
                  <PropertyCard
                    key={prop.id}
                    property={prop}
                    currency={currency}
                    layout={viewMode}
                    isFavorite={db.favorites.includes(prop.id)}
                    isCompared={db.compareIds.includes(prop.id)}
                    onOpenDetail={openDetail}
                    onToggleFavorite={toggleFavorite}
                    onToggleCompare={toggleCompare}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {page === 'detail' && selectedPropertyId && (
          <PropertyDetail
            propertyId={selectedPropertyId}
            onBack={() => setPage('listings')}
            onOpenDetail={openDetail}
          />
        )}

        {page === 'favorites' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
            <h1 className="text-2xl font-display font-semibold text-slate-900 dark:text-white">
              Saved Properties ({favoriteProperties.length})
            </h1>
            {favoriteProperties.length === 0 ? (
              <EmptyState
                icon={<Heart className="w-8 h-8" />}
                title="No saved properties yet"
                description="Click the heart icon on any listing to save residences to your shortlist."
                action={
                  <button
                    type="button"
                    onClick={() => setPage('listings')}
                    className="px-4 py-2 rounded-lg bg-teal-700 text-white text-xs font-medium"
                  >
                    Explore Listings
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteProperties.map((prop) => (
                  <PropertyCard
                    key={prop.id}
                    property={prop}
                    currency={currency}
                    isFavorite={true}
                    isCompared={db.compareIds.includes(prop.id)}
                    onOpenDetail={openDetail}
                    onToggleFavorite={toggleFavorite}
                    onToggleCompare={toggleCompare}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {page === 'compare' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-display font-semibold text-slate-900 dark:text-white">
                Property Comparison ({comparedProperties.length} / 3)
              </h1>
              {comparedProperties.length > 0 && (
                <button
                  type="button"
                  onClick={clearCompare}
                  className="text-xs font-medium text-rose-600 hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {comparedProperties.length === 0 ? (
              <EmptyState
                icon={<ArrowLeftRight className="w-8 h-8" />}
                title="Select up to 3 properties to compare"
                description="Use the compare button on any property card to benchmark price per m², amenities, and yields side by side."
                action={
                  <button
                    type="button"
                    onClick={() => setPage('listings')}
                    className="px-4 py-2 rounded-lg bg-teal-700 text-white text-xs font-medium"
                  >
                    Browse Listings
                  </button>
                }
              />
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
                <table className="w-full text-sm text-start border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4 text-xs font-semibold text-slate-500 w-44">Metric</th>
                      {comparedProperties.map((p) => (
                        <th key={p.id} className="p-4 align-top">
                          <div className="flex flex-col gap-2">
                            <div className="aspect-[4/3] rounded-lg overflow-hidden bg-slate-100">
                              <PropertyImage src={p.images[0]} alt={p.title} />
                            </div>
                            <button
                              type="button"
                              onClick={() => openDetail(p.id)}
                              className="text-start font-display font-semibold text-slate-900 dark:text-white hover:text-teal-700"
                            >
                              {p.title}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleCompare(p.id)}
                              className="text-start text-xs text-rose-600 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                    {[
                      { label: 'Community', fn: (p: Property) => p.community },
                      { label: 'Type', fn: (p: Property) => p.propertyType },
                      { label: 'Sale Price', fn: (p: Property) => formatMoney(p.price, currency) },
                      {
                        label: 'Monthly Rent',
                        fn: (p: Property) => (p.rentAmount > 0 ? `${formatMoney(p.rentAmount, currency)}/mo` : '—'),
                      },
                      {
                        label: 'Price / m²',
                        fn: (p: Property) =>
                          p.surface > 0 ? `${formatMoney(Math.round(p.price / p.surface), currency)}/m²` : '—',
                      },
                      { label: 'Surface', fn: (p: Property) => `${p.surface} m²` },
                      { label: 'Bedrooms / Baths', fn: (p: Property) => `${p.bedrooms} bd / ${p.bathrooms} ba` },
                      { label: 'Year Built', fn: (p: Property) => String(p.yearBuilt) },
                      { label: 'Energy Rating', fn: (p: Property) => `Class ${p.energyRating}` },
                      { label: 'Furnished', fn: (p: Property) => (p.furnished ? 'Yes' : 'No') },
                      { label: 'Swimming Pool', fn: (p: Property) => (p.pool ? 'Yes' : 'No') },
                      { label: 'Parking', fn: (p: Property) => (p.parking ? 'Included' : 'No') },
                    ].map((row) => (
                      <tr key={row.label}>
                        <td className="p-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                          {row.label}
                        </td>
                        {comparedProperties.map((p) => (
                          <td
                            key={p.id}
                            className="p-4 text-sm text-slate-800 dark:text-slate-200 capitalize"
                          >
                            {row.fn(p)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Compare Bar when properties are selected on Listings */}
      {page === 'listings' && db.compareIds.length > 0 && (
        <div className="fixed bottom-4 start-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-4">
          <span className="text-xs font-medium whitespace-nowrap">
            {db.compareIds.length} / 3 selected for comparison
          </span>
          <button
            type="button"
            onClick={() => setPage('compare')}
            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-semibold whitespace-nowrap"
          >
            Compare Now
          </button>
          <button
            type="button"
            onClick={clearCompare}
            aria-label="Clear comparison"
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs text-slate-500 dark:text-slate-400">
          <div>
            <div className="font-display font-semibold text-sm text-slate-900 dark:text-white">
              {db.settings.name}
            </div>
            <p className="mt-1">
              {db.settings.address} · {db.settings.reraOrn} · {db.settings.phone}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              aria-label="Footer currency"
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 font-mono"
            >
              <option value="AED">AED</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="TND">TND</option>
            </select>
            <select
              value={lang}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              aria-label="Footer language"
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </select>
            <button
              type="button"
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              {db.settings.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button
              type="button"
              onClick={onOpenRoleSwitcher}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-teal-700 dark:text-teal-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              Switch Demo Role
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

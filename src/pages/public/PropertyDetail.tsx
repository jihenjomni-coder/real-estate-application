import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  Calendar,
  Check,
  Heart,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import { useAppStore } from '../../hooks/useAppStore';
import { formatMoney } from '../../i18n/translations';
import { FormField, PropertyImage, StatusBadge, inputClassName } from '../../components/ui/Primitives';
import { LeafletMap } from '../../components/ui/LeafletMap';
import { PropertyCard } from './PropertyCard';

interface PropertyDetailProps {
  propertyId: string;
  onBack: () => void;
  onOpenDetail: (id: string) => void;
}

export const PropertyDetail: React.FC<PropertyDetailProps> = ({
  propertyId,
  onBack,
  onOpenDetail,
}) => {
  const {
    db,
    toggleFavorite,
    toggleCompare,
    addInquiry,
    upsertVisit,
    upsertClient,
    addToast,
  } = useAppStore();

  const property = db.properties.find((p) => p.id === propertyId);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Mortgage calculator state
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [interestRate, setInterestRate] = useState(4.25);
  const [loanYears, setLoanYears] = useState(25);

  // Book a visit form
  const [visitDate, setVisitDate] = useState('2026-11-22');
  const [visitTime, setVisitTime] = useState('11:00');
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitNotes, setVisitNotes] = useState('');
  const [visitError, setVisitError] = useState('');

  // Inquiry form
  const [inqName, setInqName] = useState('');
  const [inqEmail, setInqEmail] = useState('');
  const [inqPhone, setInqPhone] = useState('');
  const [inqMessage, setInqMessage] = useState('');
  const [inqError, setInqError] = useState('');

  const similarProperties = useMemo(() => {
    if (!property) return [];
    return db.properties
      .filter(
        (p) =>
          p.id !== property.id &&
          p.status !== 'draft' &&
          p.status !== 'off_market' &&
          (p.community === property.community || p.propertyType === property.propertyType)
      )
      .slice(0, 3);
  }, [db.properties, property]);

  if (!property) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 dark:text-teal-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Listings
        </button>
        <p className="mt-6 text-slate-600 dark:text-slate-300">Property not found.</p>
      </div>
    );
  }

  const agent = db.agents.find((a) => a.id === property.agentId) ?? db.agents[0];
  const currency = db.settings.currency;
  const pricePerSqm = property.surface > 0 ? Math.round(property.price / property.surface) : 0;

  // Monthly mortgage computation
  const principal = property.price * (1 - downPaymentPct / 100);
  const monthlyRate = interestRate / 100 / 12;
  const totalPayments = loanYears * 12;
  const monthlyMortgage =
    monthlyRate > 0
      ? (principal * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
        (Math.pow(1 + monthlyRate, totalPayments) - 1)
      : principal / totalPayments;

  const handleBookVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !visitorEmail.includes('@') || !visitorPhone.trim()) {
      setVisitError('Please provide your name, a valid email address, and phone number.');
      return;
    }
    const isoDate = `${visitDate}T${visitTime}:00`;
    // Conflict check for agent within 60 mins
    const requestedTime = new Date(isoDate).getTime();
    const conflict = db.visits.some(
      (v) =>
        v.agentId === agent.id &&
        v.status === 'scheduled' &&
        Math.abs(new Date(v.scheduledAt).getTime() - requestedTime) < 60 * 60 * 1000
    );
    if (conflict) {
      setVisitError(
        `${agent.name} already has a viewing scheduled around ${visitTime}. Please choose another time slot.`
      );
      return;
    }
    setVisitError('');

    const clientId = `client-web-${Date.now()}`;
    upsertClient({
      id: clientId,
      name: visitorName.trim(),
      email: visitorEmail.trim(),
      phone: visitorPhone.trim(),
      type: property.transactionType === 'rent' ? 'tenant' : 'buyer',
      pipelineStage: 'visit_scheduled',
      source: 'website',
      budgetMin: 0,
      budgetMax: property.transactionType === 'rent' ? property.rentAmount : property.price,
      preferredTransaction: property.transactionType === 'rent' ? 'rent' : 'sale',
      preferredZones: [property.community],
      preferredTypes: [property.propertyType],
      minBedrooms: property.bedrooms,
      assignedAgentId: agent.id,
      notes: `Booked viewing for ${property.referenceCode}`,
      activities: [
        {
          id: `act-${Date.now()}`,
          type: 'visit',
          summary: `Online viewing booked for ${property.title} on ${visitDate} at ${visitTime}`,
          date: new Date().toISOString(),
          authorName: visitorName.trim(),
        },
      ],
      createdAt: new Date().toISOString().slice(0, 10),
    });

    upsertVisit({
      id: `visit-${Date.now()}`,
      propertyId: property.id,
      clientId,
      agentId: agent.id,
      scheduledAt: isoDate,
      durationMinutes: 45,
      status: 'scheduled',
      notes: visitNotes.trim() || `Public website booking for ${property.referenceCode}`,
      feedback: null,
    });

    setVisitorName('');
    setVisitorEmail('');
    setVisitorPhone('');
    setVisitNotes('');
    addToast('Viewing scheduled', 'success', `Confirmed with ${agent.name} for ${visitDate} at ${visitTime}.`);
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inqName.trim() || !inqEmail.includes('@') || !inqMessage.trim()) {
      setInqError('Please complete your name, valid email, and message.');
      return;
    }
    setInqError('');
    addInquiry({
      id: `inq-${Date.now()}`,
      propertyId: property.id,
      name: inqName.trim(),
      email: inqEmail.trim(),
      phone: inqPhone.trim(),
      message: inqMessage.trim(),
      status: 'new',
      createdAt: new Date().toISOString(),
    });
    setInqName('');
    setInqEmail('');
    setInqPhone('');
    setInqMessage('');
    addToast('Inquiry sent', 'success', 'Your inquiry has been routed to the listing broker.');
  };

  const isFav = db.favorites.includes(property.id);
  const isComp = db.compareIds.includes(property.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10">
      {/* Top breadcrumb & actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Listings
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleCompare(property.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
              isComp
                ? 'bg-teal-600 text-white border-teal-600'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            {isComp ? 'In Compare' : 'Compare'}
          </button>
          <button
            type="button"
            onClick={() => toggleFavorite(property.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
              isFav
                ? 'bg-rose-600 text-white border-rose-600'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
            {isFav ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      {/* Main Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 cols: Gallery, Details, Calculator, Map */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Gallery */}
          <div className="flex flex-col gap-3">
            <div className="aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
              <PropertyImage
                src={property.images[activePhotoIdx] || property.images[0]}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            </div>
            {property.images.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                {property.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`aspect-[4/3] rounded-lg overflow-hidden border-2 transition-colors ${
                      idx === activePhotoIdx
                        ? 'border-teal-600'
                        : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <PropertyImage src={img} alt={`${property.title} view ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Header & Key Metrics */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono">{property.referenceCode}</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{property.propertyType}</span>
                  <span aria-hidden="true">·</span>
                  <span>{property.community}</span>
                  <StatusBadge status={property.status} />
                </div>
                <h1 className="mt-2 text-2xl sm:text-3xl font-display font-semibold text-slate-900 dark:text-slate-50 text-balance">
                  {property.title}
                </h1>
                <div className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>
                    {property.address}, {property.city}
                  </span>
                </div>
              </div>

              <div className="text-start sm:text-end">
                {property.transactionType !== 'rent' && (
                  <div className="text-2xl font-mono font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
                    {formatMoney(property.price, currency)}
                  </div>
                )}
                {property.transactionType !== 'sale' && (
                  <div className="text-lg font-mono font-semibold text-teal-700 dark:text-teal-400 tabular-nums">
                    {formatMoney(property.rentAmount, currency)} / mo
                  </div>
                )}
                {property.transactionType !== 'rent' && pricePerSqm > 0 && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                    {formatMoney(pricePerSqm, currency)} / m²
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-5 border-t border-slate-100 dark:border-slate-800 text-sm">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Surface Area</div>
                <div className="font-semibold font-mono tabular-nums mt-0.5">
                  {property.surface} m²
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Bedrooms</div>
                <div className="font-semibold font-mono tabular-nums mt-0.5">
                  {property.bedrooms || 'Commercial'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Bathrooms</div>
                <div className="font-semibold font-mono tabular-nums mt-0.5">
                  {property.bathrooms}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Year Built</div>
                <div className="font-semibold font-mono tabular-nums mt-0.5">
                  {property.yearBuilt}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Energy Rating</div>
                <div className="font-semibold font-mono tabular-nums mt-0.5">
                  Class {property.energyRating}
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-display font-semibold text-slate-900 dark:text-slate-50 mb-2">
                Property Overview
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-display font-semibold text-slate-900 dark:text-slate-50 mb-3">
                Specifications & Amenities
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-slate-700 dark:text-slate-300">
                {[
                  { label: 'Furnished', active: property.furnished },
                  { label: 'Covered Parking', active: property.parking },
                  { label: 'Swimming Pool', active: property.pool },
                  { label: 'Private / High-Speed Elevator', active: property.elevator },
                  {
                    label: `Floor: ${property.floor === 0 ? 'Ground / Villa' : `Level ${property.floor}`}`,
                    active: true,
                  },
                  {
                    label: `Service Charges: ${formatMoney(property.charges, currency)}/mo`,
                    active: true,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 text-xs ${
                      item.active
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-slate-400 dark:text-slate-600 line-through'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mortgage Calculator for Sale Properties */}
          {property.transactionType !== 'rent' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-display font-semibold text-slate-900 dark:text-slate-50">
                    UAE Mortgage Estimator
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Adjust down payment, fixed rate, and tenure for an indicative monthly payment.
                  </p>
                </div>
                <div className="text-end">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Est. Monthly Payment</div>
                  <div className="text-xl font-mono font-semibold text-teal-700 dark:text-teal-400 tabular-nums">
                    {formatMoney(Math.round(monthlyMortgage), currency)} / mo
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label={`Down Payment (${downPaymentPct}%)`}>
                  <input
                    type="range"
                    min={15}
                    max={80}
                    step={5}
                    value={downPaymentPct}
                    onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                    className="w-full accent-teal-600"
                  />
                  <span className="text-xs font-mono text-slate-500 tabular-nums">
                    {formatMoney(Math.round(property.price * (downPaymentPct / 100)), currency)}
                  </span>
                </FormField>

                <FormField label={`Interest Rate (${interestRate.toFixed(2)}%)`}>
                  <input
                    type="range"
                    min={2.5}
                    max={7.5}
                    step={0.25}
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full accent-teal-600"
                  />
                  <span className="text-xs font-mono text-slate-500 tabular-nums">
                    Loan: {formatMoney(Math.round(principal), currency)}
                  </span>
                </FormField>

                <FormField label={`Tenure (${loanYears} Years)`}>
                  <input
                    type="range"
                    min={5}
                    max={25}
                    step={5}
                    value={loanYears}
                    onChange={(e) => setLoanYears(Number(e.target.value))}
                    className="w-full accent-teal-600"
                  />
                  <span className="text-xs font-mono text-slate-500 tabular-nums">
                    {totalPayments} monthly installments
                  </span>
                </FormField>
              </div>
            </div>
          )}

          {/* Location Map */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col gap-3">
            <div>
              <h2 className="text-base font-display font-semibold text-slate-900 dark:text-slate-50">
                Location & Neighborhood
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {property.address}, {property.community}, Dubai ({property.lat.toFixed(4)},{' '}
                {property.lng.toFixed(4)})
              </p>
            </div>
            <LeafletMap properties={[property]} currency={currency} height="340px" zoom={14} />
          </div>
        </div>

        {/* Right 4 cols: Agent Card, Book a Visit, Direct Inquiry */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Agent Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-teal-700 text-white font-display font-semibold flex items-center justify-center text-sm shrink-0">
                {agent.avatarInitials}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {agent.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{agent.roleTitle}</div>
                <div className="text-xs font-mono text-teal-700 dark:text-teal-400 mt-0.5">
                  RERA {agent.reraBrn}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono">{agent.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{agent.email}</span>
              </div>
            </div>
          </div>

          {/* Book a Visit Form */}
          <form
            onSubmit={handleBookVisit}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col gap-4"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h2 className="text-base font-display font-semibold text-slate-900 dark:text-slate-50">
                Book a Private Viewing
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Preferred Date" required>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className={inputClassName}
                />
              </FormField>
              <FormField label="Time Slot" required>
                <input
                  type="time"
                  value={visitTime}
                  onChange={(e) => setVisitTime(e.target.value)}
                  className={inputClassName}
                />
              </FormField>
            </div>

            <FormField label="Full Name" required>
              <input
                type="text"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="Your full name"
                className={inputClassName}
              />
            </FormField>

            <FormField label="Email Address" required>
              <input
                type="email"
                value={visitorEmail}
                onChange={(e) => setVisitorEmail(e.target.value)}
                placeholder="name@company.com"
                className={inputClassName}
              />
            </FormField>

            <FormField label="Phone / WhatsApp" required>
              <input
                type="tel"
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
                placeholder="+971 50 ..."
                className={inputClassName}
              />
            </FormField>

            <FormField label="Viewing Notes">
              <input
                type="text"
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                placeholder="Optional requests or questions"
                className={inputClassName}
              />
            </FormField>

            {visitError && <p className="text-xs text-rose-600 dark:text-rose-400">{visitError}</p>}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium transition-colors whitespace-nowrap"
            >
              Confirm Viewing Appointment
            </button>
          </form>

          {/* Send Inquiry Form */}
          <form
            onSubmit={handleInquirySubmit}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col gap-4"
          >
            <h2 className="text-base font-display font-semibold text-slate-900 dark:text-slate-50">
              Request Brochure or Floor Plan
            </h2>

            <FormField label="Your Name" required>
              <input
                type="text"
                value={inqName}
                onChange={(e) => setInqName(e.target.value)}
                placeholder="Full name"
                className={inputClassName}
              />
            </FormField>
            <FormField label="Email" required>
              <input
                type="email"
                value={inqEmail}
                onChange={(e) => setInqEmail(e.target.value)}
                placeholder="email@domain.com"
                className={inputClassName}
              />
            </FormField>
            <FormField label="Phone">
              <input
                type="tel"
                value={inqPhone}
                onChange={(e) => setInqPhone(e.target.value)}
                placeholder="+971 ..."
                className={inputClassName}
              />
            </FormField>
            <FormField label="Message" required>
              <textarea
                rows={3}
                value={inqMessage}
                onChange={(e) => setInqMessage(e.target.value)}
                placeholder={`Ask about ${property.referenceCode}, service charges, or payment plans...`}
                className={inputClassName}
              />
            </FormField>

            {inqError && <p className="text-xs text-rose-600 dark:text-rose-400">{inqError}</p>}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 text-sm font-medium transition-colors whitespace-nowrap"
            >
              Send Inquiry
            </button>
          </form>
        </div>
      </div>

      {/* Similar Properties */}
      {similarProperties.length > 0 && (
        <section className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-5">
          <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-slate-50">
            Similar Dubai Residences
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similarProperties.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                currency={currency}
                isFavorite={db.favorites.includes(p.id)}
                isCompared={db.compareIds.includes(p.id)}
                onOpenDetail={onOpenDetail}
                onToggleFavorite={toggleFavorite}
                onToggleCompare={toggleCompare}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

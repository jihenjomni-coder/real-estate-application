import React from 'react';
import { ArrowLeftRight, Heart, MapPin } from 'lucide-react';
import { CurrencyCode, Property } from '../../types';
import { formatMoney } from '../../i18n/translations';
import { PropertyImage } from '../../components/ui/Primitives';

interface PropertyCardProps {
  property: Property;
  currency: CurrencyCode;
  isFavorite: boolean;
  isCompared: boolean;
  layout?: 'grid' | 'list';
  onOpenDetail: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleCompare: (id: string) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  currency,
  isFavorite,
  isCompared,
  layout = 'grid',
  onOpenDetail,
  onToggleFavorite,
  onToggleCompare,
}) => {
  const priceDisplay =
    property.transactionType === 'rent'
      ? `${formatMoney(property.rentAmount, currency)} / mo`
      : property.transactionType === 'both'
      ? `${formatMoney(property.price, currency)} · ${formatMoney(property.rentAmount, currency)}/mo`
      : formatMoney(property.price, currency);

  const txLabel =
    property.transactionType === 'both'
      ? 'Sale or Rent'
      : property.transactionType === 'rent'
      ? 'For Rent'
      : 'For Sale';

  return (
    <article
      className={`group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-colors hover:border-slate-300 dark:hover:border-slate-700 flex ${
        layout === 'list' ? 'flex-col md:flex-row' : 'flex-col'
      }`}
    >
      <div
        onClick={() => onOpenDetail(property.id)}
        className={`relative cursor-pointer overflow-hidden bg-slate-100 dark:bg-slate-800 ${
          layout === 'list' ? 'md:w-72 aspect-[4/3] md:aspect-auto shrink-0' : 'aspect-[4/3]'
        }`}
      >
        <PropertyImage
          src={property.images[0]}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/75 via-slate-950/25 to-transparent pointer-events-none" />
        <div className="absolute bottom-3 start-3 end-3 flex items-center justify-between text-white">
          <span className="text-sm font-mono font-semibold tabular-nums">{priceDisplay}</span>
        </div>
        <div className="absolute top-3 end-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare(property.id);
            }}
            title="Compare property"
            aria-label="Compare property"
            className={`p-2 rounded-lg backdrop-blur-sm transition-colors ${
              isCompared
                ? 'bg-teal-600 text-white'
                : 'bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 hover:bg-white'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(property.id);
            }}
            title="Save to favorites"
            aria-label="Save to favorites"
            className={`p-2 rounded-lg backdrop-blur-sm transition-colors ${
              isFavorite
                ? 'bg-rose-600 text-white'
                : 'bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 hover:bg-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="capitalize font-medium text-teal-700 dark:text-teal-400">
              {txLabel}
            </span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{property.propertyType}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{property.referenceCode}</span>
          </div>

          <h3
            onClick={() => onOpenDetail(property.id)}
            className="mt-1.5 text-base font-display font-semibold text-slate-900 dark:text-slate-50 cursor-pointer hover:text-teal-700 dark:hover:text-teal-400 transition-colors line-clamp-1"
          >
            {property.title}
          </h3>

          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {property.community}, {property.city}
            </span>
          </div>

          {layout === 'list' && (
            <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
              {property.description}
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 tabular-nums">
          <div className="flex items-center gap-2">
            {property.bedrooms > 0 && (
              <>
                <span>{property.bedrooms} Beds</span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span>{property.bathrooms} Baths</span>
            <span aria-hidden="true">·</span>
            <span>{property.surface} m²</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenDetail(property.id)}
            className="font-medium text-teal-700 dark:text-teal-400 hover:underline whitespace-nowrap shrink-0"
          >
            Details
          </button>
        </div>
      </div>
    </article>
  );
};

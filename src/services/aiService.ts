import {
  CurrencyCode,
  LanguageCode,
  PriceEstimateResult,
  Property,
  SmartSearchFilters,
} from '../types';

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const aiService = {
  async generateListingDescription(
    property: Partial<Property>,
    language: LanguageCode
  ): Promise<string> {
    const res = await postJson<{ description: string }>('/api/ai/description', {
      property,
      language,
    });
    return res.description;
  },

  async smartSearch(
    query: string,
    availableCommunities: string[]
  ): Promise<SmartSearchFilters> {
    return postJson<SmartSearchFilters>('/api/ai/smart-search', {
      query,
      availableCommunities,
    });
  },

  async estimatePrice(
    target: Partial<Property>,
    portfolio: Property[],
    _currency: CurrencyCode
  ): Promise<PriceEstimateResult> {
    const comparables = portfolio
      .filter(
        (p) =>
          p.id !== target.id &&
          (p.propertyType === target.propertyType || p.community === target.community)
      )
      .slice(0, 8)
      .map((p) => ({
        title: p.title,
        community: p.community,
        propertyType: p.propertyType,
        surface: p.surface,
        bedrooms: p.bedrooms,
        priceAed: p.price,
        monthlyRentAed: p.rentAmount,
        furnished: p.furnished,
        pool: p.pool,
      }));

    return postJson<PriceEstimateResult>('/api/ai/price-estimate', {
      target,
      comparables,
    });
  },

  async draftInquiryReply(
    inquiry: { name: string; message: string },
    property: Property | undefined,
    agentName: string,
    language: LanguageCode
  ): Promise<string> {
    const res = await postJson<{ reply: string }>('/api/ai/draft-reply', {
      inquiry,
      property: property
        ? {
            referenceCode: property.referenceCode,
            title: property.title,
            community: property.community,
            transactionType: property.transactionType,
            priceAed: property.price,
            monthlyRentAed: property.rentAmount,
            chargesAed: property.charges,
            surface: property.surface,
            bedrooms: property.bedrooms,
            furnished: property.furnished,
            status: property.status,
          }
        : undefined,
      agentName,
      language,
    });
    return res.reply;
  },
};

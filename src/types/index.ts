export type UserRole = 'admin' | 'agent' | 'landlord' | 'tenant' | 'public';

export type CurrencyCode = 'AED' | 'USD' | 'EUR' | 'TND';
export type LanguageCode = 'en' | 'fr' | 'ar';
export type ThemeMode = 'light' | 'dark';

export type TransactionType = 'sale' | 'rent' | 'both';
export type PropertyType = 'apartment' | 'villa' | 'house' | 'land' | 'office' | 'commercial';
export type PropertyStatus =
  | 'draft'
  | 'available'
  | 'under_offer'
  | 'reserved'
  | 'sold'
  | 'rented'
  | 'off_market';

export type EnergyRating = 'A' | 'B' | 'C' | 'D' | 'E';
export type MandateType = 'exclusive' | 'simple';
export type CommissionType = 'percent' | 'fixed';

export interface Property {
  id: string;
  referenceCode: string;
  title: string;
  description: string;
  transactionType: TransactionType;
  propertyType: PropertyType;
  status: PropertyStatus;
  price: number; // Sale price in base AED
  rentAmount: number; // Monthly rent in base AED
  deposit: number; // Security deposit in AED
  charges: number; // Monthly service/chiller charges in AED
  surface: number; // m²
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  floor: number;
  yearBuilt: number;
  energyRating: EnergyRating;
  furnished: boolean;
  parking: boolean;
  pool: boolean;
  elevator: boolean;
  address: string;
  community: string;
  city: string;
  lat: number;
  lng: number;
  images: string[];
  ownerId: string;
  agentId: string;
  mandateType: MandateType;
  commissionType: CommissionType;
  commissionValue: number; // % if percent, AED if fixed
  mandateExpiryDate: string; // YYYY-MM-DD
  featured: boolean;
  daysOnMarket: number;
  createdAt: string;
}

export type ClientType = 'buyer' | 'seller' | 'tenant' | 'landlord';
export type PipelineStage =
  | 'new'
  | 'contacted'
  | 'visit_scheduled'
  | 'offer'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';
export type LeadSource = 'website' | 'referral' | 'bayut_portal' | 'walk_in' | 'social';

export interface ClientActivity {
  id: string;
  type: 'call' | 'email' | 'visit' | 'note';
  summary: string;
  date: string;
  authorName: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: ClientType;
  pipelineStage: PipelineStage;
  source: LeadSource;
  budgetMin: number; // AED
  budgetMax: number; // AED
  preferredTransaction: 'sale' | 'rent';
  preferredZones: string[];
  preferredTypes: PropertyType[];
  minBedrooms: number;
  assignedAgentId: string;
  notes: string;
  activities: ClientActivity[];
  createdAt: string;
}

export interface AgentPermissions {
  canManageListings: boolean;
  canManageDeals: boolean;
  canManageRentals: boolean;
  canExportReports: boolean;
  canManageAgents: boolean;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleTitle: string;
  reraBrn: string;
  avatarInitials: string;
  commissionSplitPct: number;
  active: boolean;
  permissions: AgentPermissions;
  joinedAt: string;
}

export type VisitStatus = 'scheduled' | 'completed' | 'cancelled';

export interface VisitFeedback {
  rating: number;
  interestLevel: 'high' | 'medium' | 'low';
  comments: string;
  nextStep: string;
}

export interface Visit {
  id: string;
  propertyId: string;
  clientId: string;
  agentId: string;
  scheduledAt: string; // ISO datetime
  durationMinutes: number;
  status: VisitStatus;
  notes: string;
  feedback: VisitFeedback | null;
}

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'countered';

export interface Offer {
  id: string;
  propertyId: string;
  clientId: string;
  agentId: string;
  amount: number; // AED
  conditions: string;
  status: OfferStatus;
  counterAmount?: number;
  createdAt: string;
}

export type DealStage = 'mou_signed' | 'noc_pending' | 'dld_transfer' | 'closed';

export interface DealChecklist {
  buyerIdVerified: boolean;
  sellerTitleDeed: boolean;
  proofOfFunds: boolean;
  mouSigned: boolean;
  developerNoc: boolean;
  dldTransferComplete: boolean;
}

export interface Deal {
  id: string;
  propertyId: string;
  offerId: string;
  buyerId: string;
  sellerId: string;
  agentId: string;
  salePrice: number; // AED
  commissionAmount: number; // AED
  stage: DealStage;
  checklist: DealChecklist;
  closingDate: string;
  createdAt: string;
}

export type LeaseStatus = 'active' | 'expiring_soon' | 'expired' | 'terminated';

export interface Lease {
  id: string;
  propertyId: string;
  tenantId: string;
  landlordId: string;
  agentId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number; // AED
  deposit: number; // AED
  monthlyCharges: number; // AED
  paymentDay: number; // 1-28
  indexationPct: number;
  status: LeaseStatus;
  ejariNumber: string;
  createdAt: string;
}

export type PaymentStatus = 'paid' | 'pending' | 'overdue';
export type PaymentMethod = 'bank_transfer' | 'cheque' | 'card' | 'portal';

export interface Payment {
  id: string;
  leaseId: string;
  propertyId: string;
  tenantId: string;
  dueDate: string;
  paidDate?: string;
  amount: number; // AED
  chargesAmount: number; // AED
  status: PaymentStatus;
  method?: PaymentMethod;
  reference: string;
  periodLabel: string;
}

export type TicketCategory =
  | 'plumbing'
  | 'electrical'
  | 'hvac'
  | 'structural'
  | 'appliance'
  | 'general';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'resolved';

export interface MaintenanceTicket {
  id: string;
  propertyId: string;
  leaseId?: string;
  tenantId: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  contractorName?: string;
  contractorPhone?: string;
  estimatedCost: number;
  actualCost: number;
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

export type RoomCondition = 'excellent' | 'good' | 'fair' | 'damaged';

export interface InspectionRoom {
  room: string;
  condition: RoomCondition;
  notes: string;
}

export interface Inspection {
  id: string;
  propertyId: string;
  leaseId: string;
  type: 'move_in' | 'move_out';
  date: string;
  inspectorName: string;
  overallCondition: 'excellent' | 'good' | 'fair' | 'needs_repair';
  rooms: InspectionRoom[];
  signedByTenant: boolean;
  signedByAgent: boolean;
}

export type DocumentType =
  | 'lease_agreement'
  | 'rent_receipt'
  | 'visit_voucher'
  | 'offer_letter'
  | 'title_deed'
  | 'emirates_id'
  | 'noc'
  | 'mandate';

export interface AgencyDocument {
  id: string;
  title: string;
  type: DocumentType;
  entityType: 'property' | 'client' | 'lease' | 'deal';
  entityId: string;
  fileName: string;
  fileSize: string;
  uploadedBy: string;
  createdAt: string;
  contentSummary: string;
}

export interface Inquiry {
  id: string;
  propertyId?: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: 'new' | 'replied' | 'archived';
  aiDraftReply?: string;
  createdAt: string;
}

export interface AgencySettings {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  reraOrn: string;
  currency: CurrencyCode;
  language: LanguageCode;
  managementFeePct: number;
  theme: ThemeMode;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'info' | 'success';
  read: boolean;
  linkModule: string;
  createdAt: string;
}

export interface SmartSearchFilters {
  transactionType: 'all' | 'sale' | 'rent';
  propertyType: 'all' | PropertyType;
  community: string;
  minBedrooms: number;
  maxPriceAed: number;
  furnished: boolean;
  pool: boolean;
  nearSea: boolean;
  keywords: string;
  summary: string;
}

export interface PriceEstimateResult {
  estimatedSaleAed: number;
  saleRangeMinAed: number;
  saleRangeMaxAed: number;
  estimatedMonthlyRentAed: number;
  pricePerSqmAed: number;
  grossYieldPct: number;
  rationale: string;
}

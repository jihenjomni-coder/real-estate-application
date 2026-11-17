import {
  AgencyDocument,
  AgencySettings,
  Agent,
  Client,
  Deal,
  Inquiry,
  Inspection,
  Lease,
  MaintenanceTicket,
  NotificationItem,
  Offer,
  Payment,
  Property,
  UserRole,
  Visit,
} from '../types';
import {
  INITIAL_SETTINGS,
  SEED_AGENTS,
  SEED_CLIENTS,
  SEED_DEALS,
  SEED_DOCUMENTS,
  SEED_INQUIRIES,
  SEED_INSPECTIONS,
  SEED_LEASES,
  SEED_OFFERS,
  SEED_PAYMENTS,
  SEED_PROPERTIES,
  SEED_TICKETS,
  SEED_VISITS,
} from '../data/seedData';

const STORAGE_KEY = 'harbour_crest_dubai_v1';

export interface AppDatabase {
  properties: Property[];
  clients: Client[];
  agents: Agent[];
  visits: Visit[];
  offers: Offer[];
  deals: Deal[];
  leases: Lease[];
  payments: Payment[];
  tickets: MaintenanceTicket[];
  inspections: Inspection[];
  documents: AgencyDocument[];
  inquiries: Inquiry[];
  favorites: string[];
  compareIds: string[];
  settings: AgencySettings;
  currentRole: UserRole;
  activeAgentId: string;
  activeLandlordId: string;
  activeTenantId: string;
  readNotificationIds: string[];
}

function buildDefaultDatabase(): AppDatabase {
  return {
    properties: SEED_PROPERTIES,
    clients: SEED_CLIENTS,
    agents: SEED_AGENTS,
    visits: SEED_VISITS,
    offers: SEED_OFFERS,
    deals: SEED_DEALS,
    leases: SEED_LEASES,
    payments: SEED_PAYMENTS,
    tickets: SEED_TICKETS,
    inspections: SEED_INSPECTIONS,
    documents: SEED_DOCUMENTS,
    inquiries: SEED_INQUIRIES,
    favorites: ['prop-1', 'prop-6'],
    compareIds: ['prop-1', 'prop-2'],
    settings: INITIAL_SETTINGS,
    currentRole: 'public',
    activeAgentId: 'agent-2',
    activeLandlordId: 'client-landlord-1',
    activeTenantId: 'client-tenant-1',
    readNotificationIds: [],
  };
}

/**
 * Persistence service module structured for seamless migration
 * from localStorage to Firebase/Supabase in production.
 */
export const dataService = {
  load(): AppDatabase {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const fresh = buildDefaultDatabase();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        return fresh;
      }
      const parsed = JSON.parse(raw) as Partial<AppDatabase>;
      const defaults = buildDefaultDatabase();
      return {
        ...defaults,
        ...parsed,
        settings: { ...defaults.settings, ...(parsed.settings ?? {}) },
      };
    } catch {
      return buildDefaultDatabase();
    }
  },

  save(db: AppDatabase): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (err) {
      console.error('Failed to persist app state:', err);
    }
  },

  resetDemo(): AppDatabase {
    const fresh = buildDefaultDatabase();
    this.save(fresh);
    return fresh;
  },

  computeAlerts(db: AppDatabase): NotificationItem[] {
    const now = new Date('2026-11-17T08:00:00Z');
    const items: NotificationItem[] = [];

    // 1. Overdue rent payments
    db.payments
      .filter((p) => p.status === 'overdue')
      .forEach((p) => {
        const prop = db.properties.find((pr) => pr.id === p.propertyId);
        const tenant = db.clients.find((c) => c.id === p.tenantId);
        items.push({
          id: `alert-overdue-${p.id}`,
          title: 'Overdue Rent Payment',
          message: `${tenant?.name ?? 'Tenant'} · ${prop?.title ?? p.propertyId} (${p.periodLabel})`,
          type: 'alert',
          read: db.readNotificationIds.includes(`alert-overdue-${p.id}`),
          linkModule: 'rentals',
          createdAt: p.dueDate,
        });
      });

    // 2. Leases expiring within 60 days
    db.leases
      .filter((l) => l.status === 'active' || l.status === 'expiring_soon')
      .forEach((l) => {
        const end = new Date(l.endDate);
        const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= -5 && diffDays <= 60) {
          const prop = db.properties.find((pr) => pr.id === l.propertyId);
          items.push({
            id: `alert-lease-${l.id}`,
            title: `Lease Expiring in ${Math.max(diffDays, 0)} Days`,
            message: `${prop?.title ?? l.propertyId} (${l.ejariNumber}) ends ${l.endDate}`,
            type: 'alert',
            read: db.readNotificationIds.includes(`alert-lease-${l.id}`),
            linkModule: 'rentals',
            createdAt: l.endDate,
          });
        }
      });

    // 3. Mandates expiring within 60 days
    db.properties
      .filter((pr) => pr.status === 'available' || pr.status === 'under_offer')
      .forEach((pr) => {
        const exp = new Date(pr.mandateExpiryDate);
        const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 60) {
          items.push({
            id: `alert-mandate-${pr.id}`,
            title: `Mandate Expiring (${diffDays}d)`,
            message: `${pr.referenceCode} · ${pr.title} expires ${pr.mandateExpiryDate}`,
            type: 'info',
            read: db.readNotificationIds.includes(`alert-mandate-${pr.id}`),
            linkModule: 'listings',
            createdAt: pr.mandateExpiryDate,
          });
        }
      });

    // 4. New public inquiries
    db.inquiries
      .filter((inq) => inq.status === 'new')
      .forEach((inq) => {
        items.push({
          id: `alert-inq-${inq.id}`,
          title: 'New Client Inquiry',
          message: `${inq.name}: "${inq.message.slice(0, 64)}..."`,
          type: 'info',
          read: db.readNotificationIds.includes(`alert-inq-${inq.id}`),
          linkModule: 'crm',
          createdAt: inq.createdAt,
        });
      });

    return items;
  },
};

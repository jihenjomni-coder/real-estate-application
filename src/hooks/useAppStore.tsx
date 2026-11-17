import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  AgencyDocument,
  AgencySettings,
  Agent,
  Client,
  CurrencyCode,
  Deal,
  Inquiry,
  Inspection,
  LanguageCode,
  Lease,
  MaintenanceTicket,
  NotificationItem,
  Offer,
  Payment,
  Property,
  ThemeMode,
  UserRole,
  Visit,
} from '../types';
import { AppDatabase, dataService } from '../services/dataService';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface AppContextValue {
  db: AppDatabase;
  alerts: NotificationItem[];
  toasts: ToastMessage[];
  addToast: (title: string, type?: ToastMessage['type'], description?: string) => void;
  dismissToast: (id: string) => void;
  setRole: (role: UserRole, specificId?: string) => void;
  updateSettings: (patch: Partial<AgencySettings>) => void;
  toggleTheme: () => void;
  setLanguage: (lang: LanguageCode) => void;
  setCurrency: (currency: CurrencyCode) => void;
  markAlertRead: (id: string) => void;
  markAllAlertsRead: () => void;
  resetDemoData: () => void;

  // Properties & Public interactions
  upsertProperty: (prop: Property) => void;
  deleteProperty: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleCompare: (id: string) => void;
  clearCompare: () => void;

  // Clients & CRM
  upsertClient: (client: Client) => void;
  deleteClient: (id: string) => void;

  // Agents
  upsertAgent: (agent: Agent) => void;
  deleteAgent: (id: string) => void;

  // Visits
  upsertVisit: (visit: Visit) => void;
  deleteVisit: (id: string) => void;

  // Offers & Deals
  upsertOffer: (offer: Offer) => void;
  deleteOffer: (id: string) => void;
  upsertDeal: (deal: Deal) => void;
  deleteDeal: (id: string) => void;

  // Rentals, Payments, Maintenance, Inspections
  upsertLease: (lease: Lease) => void;
  deleteLease: (id: string) => void;
  upsertPayment: (payment: Payment) => void;
  recordPayment: (paymentId: string, method: Payment['method']) => void;
  upsertTicket: (ticket: MaintenanceTicket) => void;
  deleteTicket: (id: string) => void;
  upsertInspection: (insp: Inspection) => void;

  // Documents & Inquiries
  addDocument: (doc: AgencyDocument) => void;
  deleteDocument: (id: string) => void;
  addInquiry: (inq: Inquiry) => void;
  updateInquiry: (inq: Inquiry) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<AppDatabase>(() => dataService.load());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Persist on every state change
  useEffect(() => {
    dataService.save(db);
  }, [db]);

  // Sync HTML theme class & RTL language direction
  useEffect(() => {
    const root = document.documentElement;
    if (db.settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.lang = db.settings.language;
    root.dir = db.settings.language === 'ar' ? 'rtl' : 'ltr';
  }, [db.settings.theme, db.settings.language]);

  const addToast = useCallback(
    (title: string, type: ToastMessage['type'] = 'success', description?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, title, type, description }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const alerts = useMemo(() => dataService.computeAlerts(db), [db]);

  const setRole = useCallback((role: UserRole, specificId?: string) => {
    setDb((prev) => ({
      ...prev,
      currentRole: role,
      activeAgentId: role === 'agent' && specificId ? specificId : prev.activeAgentId,
      activeLandlordId: role === 'landlord' && specificId ? specificId : prev.activeLandlordId,
      activeTenantId: role === 'tenant' && specificId ? specificId : prev.activeTenantId,
    }));
  }, []);

  const updateSettings = useCallback((patch: Partial<AgencySettings>) => {
    setDb((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
  }, []);

  const toggleTheme = useCallback(() => {
    setDb((prev) => {
      const nextTheme: ThemeMode = prev.settings.theme === 'dark' ? 'light' : 'dark';
      return { ...prev, settings: { ...prev.settings, theme: nextTheme } };
    });
  }, []);

  const setLanguage = useCallback((language: LanguageCode) => {
    setDb((prev) => ({ ...prev, settings: { ...prev.settings, language } }));
  }, []);

  const setCurrency = useCallback((currency: CurrencyCode) => {
    setDb((prev) => ({ ...prev, settings: { ...prev.settings, currency } }));
  }, []);

  const markAlertRead = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      readNotificationIds: prev.readNotificationIds.includes(id)
        ? prev.readNotificationIds
        : [...prev.readNotificationIds, id],
    }));
  }, []);

  const markAllAlertsRead = useCallback(() => {
    setDb((prev) => ({
      ...prev,
      readNotificationIds: dataService.computeAlerts(prev).map((a) => a.id),
    }));
  }, []);

  const resetDemoData = useCallback(() => {
    const fresh = dataService.resetDemo();
    setDb(fresh);
    addToast('Demo data restored', 'info');
  }, [addToast]);

  const upsertProperty = useCallback((prop: Property) => {
    setDb((prev) => {
      const exists = prev.properties.some((p) => p.id === prop.id);
      return {
        ...prev,
        properties: exists
          ? prev.properties.map((p) => (p.id === prop.id ? prop : p))
          : [prop, ...prev.properties],
      };
    });
  }, []);

  const deleteProperty = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      properties: prev.properties.filter((p) => p.id !== id),
      favorites: prev.favorites.filter((fid) => fid !== id),
      compareIds: prev.compareIds.filter((cid) => cid !== id),
    }));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      favorites: prev.favorites.includes(id)
        ? prev.favorites.filter((f) => f !== id)
        : [...prev.favorites, id],
    }));
  }, []);

  const toggleCompare = useCallback(
    (id: string) => {
      setDb((prev) => {
        if (prev.compareIds.includes(id)) {
          return { ...prev, compareIds: prev.compareIds.filter((c) => c !== id) };
        }
        if (prev.compareIds.length >= 3) {
          addToast('Compare limit reached', 'info', 'You can compare up to 3 properties at once.');
          return prev;
        }
        return { ...prev, compareIds: [...prev.compareIds, id] };
      });
    },
    [addToast]
  );

  const clearCompare = useCallback(() => {
    setDb((prev) => ({ ...prev, compareIds: [] }));
  }, []);

  const upsertClient = useCallback((client: Client) => {
    setDb((prev) => {
      const exists = prev.clients.some((c) => c.id === client.id);
      return {
        ...prev,
        clients: exists
          ? prev.clients.map((c) => (c.id === client.id ? client : c))
          : [client, ...prev.clients],
      };
    });
  }, []);

  const deleteClient = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      clients: prev.clients.filter((c) => c.id !== id),
    }));
  }, []);

  const upsertAgent = useCallback((agent: Agent) => {
    setDb((prev) => {
      const exists = prev.agents.some((a) => a.id === agent.id);
      return {
        ...prev,
        agents: exists
          ? prev.agents.map((a) => (a.id === agent.id ? agent : a))
          : [...prev.agents, agent],
      };
    });
  }, []);

  const deleteAgent = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      agents: prev.agents.filter((a) => a.id !== id),
    }));
  }, []);

  const upsertVisit = useCallback((visit: Visit) => {
    setDb((prev) => {
      const exists = prev.visits.some((v) => v.id === visit.id);
      return {
        ...prev,
        visits: exists
          ? prev.visits.map((v) => (v.id === visit.id ? visit : v))
          : [visit, ...prev.visits],
      };
    });
  }, []);

  const deleteVisit = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      visits: prev.visits.filter((v) => v.id !== id),
    }));
  }, []);

  const upsertOffer = useCallback((offer: Offer) => {
    setDb((prev) => {
      const exists = prev.offers.some((o) => o.id === offer.id);
      return {
        ...prev,
        offers: exists
          ? prev.offers.map((o) => (o.id === offer.id ? offer : o))
          : [offer, ...prev.offers],
      };
    });
  }, []);

  const deleteOffer = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      offers: prev.offers.filter((o) => o.id !== id),
    }));
  }, []);

  const upsertDeal = useCallback((deal: Deal) => {
    setDb((prev) => {
      const exists = prev.deals.some((d) => d.id === deal.id);
      const nextProperties =
        deal.stage === 'closed'
          ? prev.properties.map((p) =>
              p.id === deal.propertyId ? { ...p, status: 'sold' as const } : p
            )
          : prev.properties;
      return {
        ...prev,
        properties: nextProperties,
        deals: exists
          ? prev.deals.map((d) => (d.id === deal.id ? deal : d))
          : [deal, ...prev.deals],
      };
    });
  }, []);

  const deleteDeal = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      deals: prev.deals.filter((d) => d.id !== id),
    }));
  }, []);

  const upsertLease = useCallback((lease: Lease) => {
    setDb((prev) => {
      const exists = prev.leases.some((l) => l.id === lease.id);
      return {
        ...prev,
        leases: exists
          ? prev.leases.map((l) => (l.id === lease.id ? lease : l))
          : [lease, ...prev.leases],
      };
    });
  }, []);

  const deleteLease = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      leases: prev.leases.filter((l) => l.id !== id),
    }));
  }, []);

  const upsertPayment = useCallback((payment: Payment) => {
    setDb((prev) => {
      const exists = prev.payments.some((p) => p.id === payment.id);
      return {
        ...prev,
        payments: exists
          ? prev.payments.map((p) => (p.id === payment.id ? payment : p))
          : [payment, ...prev.payments],
      };
    });
  }, []);

  const recordPayment = useCallback((paymentId: string, method: Payment['method'] = 'portal') => {
    const today = new Date().toISOString().slice(0, 10);
    setDb((prev) => ({
      ...prev,
      payments: prev.payments.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: 'paid',
              paidDate: today,
              method,
              reference: p.reference.startsWith('DUE')
                ? p.reference.replace('DUE', 'RCPT')
                : p.reference,
            }
          : p
      ),
    }));
  }, []);

  const upsertTicket = useCallback((ticket: MaintenanceTicket) => {
    setDb((prev) => {
      const exists = prev.tickets.some((t) => t.id === ticket.id);
      return {
        ...prev,
        tickets: exists
          ? prev.tickets.map((t) => (t.id === ticket.id ? ticket : t))
          : [ticket, ...prev.tickets],
      };
    });
  }, []);

  const deleteTicket = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      tickets: prev.tickets.filter((t) => t.id !== id),
    }));
  }, []);

  const upsertInspection = useCallback((insp: Inspection) => {
    setDb((prev) => {
      const exists = prev.inspections.some((i) => i.id === insp.id);
      return {
        ...prev,
        inspections: exists
          ? prev.inspections.map((i) => (i.id === insp.id ? insp : i))
          : [insp, ...prev.inspections],
      };
    });
  }, []);

  const addDocument = useCallback((doc: AgencyDocument) => {
    setDb((prev) => ({ ...prev, documents: [doc, ...prev.documents] }));
  }, []);

  const deleteDocument = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      documents: prev.documents.filter((d) => d.id !== id),
    }));
  }, []);

  const addInquiry = useCallback((inq: Inquiry) => {
    setDb((prev) => ({ ...prev, inquiries: [inq, ...prev.inquiries] }));
  }, []);

  const updateInquiry = useCallback((inq: Inquiry) => {
    setDb((prev) => ({
      ...prev,
      inquiries: prev.inquiries.map((i) => (i.id === inq.id ? inq : i)),
    }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        db,
        alerts,
        toasts,
        addToast,
        dismissToast,
        setRole,
        updateSettings,
        toggleTheme,
        setLanguage,
        setCurrency,
        markAlertRead,
        markAllAlertsRead,
        resetDemoData,
        upsertProperty,
        deleteProperty,
        toggleFavorite,
        toggleCompare,
        clearCompare,
        upsertClient,
        deleteClient,
        upsertAgent,
        deleteAgent,
        upsertVisit,
        deleteVisit,
        upsertOffer,
        deleteOffer,
        upsertDeal,
        deleteDeal,
        upsertLease,
        deleteLease,
        upsertPayment,
        recordPayment,
        upsertTicket,
        deleteTicket,
        upsertInspection,
        addDocument,
        deleteDocument,
        addInquiry,
        updateInquiry,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useAppStore(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppStore must be used inside AppProvider');
  }
  return ctx;
}

import React, { useState } from 'react';
import { Building2, KeyRound, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { Modal, inputClassName } from './ui/Primitives';
import { useAppStore } from '../hooks/useAppStore';
import { UserRole } from '../types';

interface RoleSwitcherModalProps {
  open: boolean;
  onClose: () => void;
  onAfterSwitch?: (role: UserRole) => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  open,
  onClose,
  onAfterSwitch,
}) => {
  const { db, setRole, addToast } = useAppStore();
  const [selectedAgentId, setSelectedAgentId] = useState(db.activeAgentId);
  const [selectedLandlordId, setSelectedLandlordId] = useState(db.activeLandlordId);
  const [selectedTenantId, setSelectedTenantId] = useState(db.activeTenantId);

  const landlords = db.clients.filter((c) => c.type === 'landlord');
  const tenants = db.clients.filter((c) => c.type === 'tenant');

  const handleSelect = (role: UserRole) => {
    if (role === 'agent') {
      setRole('agent', selectedAgentId);
    } else if (role === 'landlord') {
      setRole('landlord', selectedLandlordId);
    } else if (role === 'tenant') {
      setRole('tenant', selectedTenantId);
    } else {
      setRole(role);
    }
    addToast(`Switched workspace role to ${role.toUpperCase()}`, 'info');
    onAfterSwitch?.(role);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Select Demo Workspace Role"
      subtitle="Switch between Public Website, Agency Back-Office, Owner Portal, and Tenant Portal."
      maxWidth="max-w-2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleSelect('admin')}
          className={`text-start p-4 rounded-xl border transition-colors flex items-start gap-3 ${
            db.currentRole === 'admin'
              ? 'border-teal-600 bg-teal-50/60 dark:bg-teal-950/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <ShieldCheck className="w-5 h-5 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Admin (Agency Owner)
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Full access to KPIs, all listings, CRM, deals, rentals, AI studio, agents, and agency settings.
            </p>
          </div>
        </button>

        <div
          className={`p-4 rounded-xl border transition-colors flex flex-col gap-2.5 ${
            db.currentRole === 'agent'
              ? 'border-teal-600 bg-teal-50/60 dark:bg-teal-950/30'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-sky-700 dark:text-sky-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Agent / Broker
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manages assigned Dubai listings, leads, scheduled visits, offers, and deals.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className={`${inputClassName} text-xs py-1.5`}
            >
              {db.agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.reraBrn})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handleSelect('agent')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 dark:bg-teal-600 text-white hover:bg-slate-800 dark:hover:bg-teal-500 whitespace-nowrap shrink-0"
            >
              Enter
            </button>
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border transition-colors flex flex-col gap-2.5 ${
            db.currentRole === 'landlord'
              ? 'border-teal-600 bg-teal-50/60 dark:bg-teal-950/30'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Landlord / Owner
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Views owned properties, monthly net rental statements, and maintenance progress.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedLandlordId}
              onChange={(e) => setSelectedLandlordId(e.target.value)}
              className={`${inputClassName} text-xs py-1.5`}
            >
              {landlords.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handleSelect('landlord')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 dark:bg-teal-600 text-white hover:bg-slate-800 dark:hover:bg-teal-500 whitespace-nowrap shrink-0"
            >
              Enter
            </button>
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border transition-colors flex flex-col gap-2.5 ${
            db.currentRole === 'tenant'
              ? 'border-teal-600 bg-teal-50/60 dark:bg-teal-950/30'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-start gap-3">
            <KeyRound className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Tenant
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Views active Ejari lease, pays monthly rent, downloads receipts, and submits tickets.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className={`${inputClassName} text-xs py-1.5`}
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handleSelect('tenant')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 dark:bg-teal-600 text-white hover:bg-slate-800 dark:hover:bg-teal-500 whitespace-nowrap shrink-0"
            >
              Enter
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleSelect('public')}
          className={`md:col-span-2 text-start p-4 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
            db.currentRole === 'public'
              ? 'border-teal-600 bg-teal-50/60 dark:bg-teal-950/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-slate-700 dark:text-slate-300 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Public Visitor (Dubai Brokerage Website)
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Browse listings, search via AI, view map pins, calculate mortgages, compare up to 3 residences, and book viewings.
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-teal-700 dark:text-teal-400 whitespace-nowrap">
            Open Site
          </span>
        </button>
      </div>
    </Modal>
  );
};

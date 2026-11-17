import React, { useEffect, useState } from 'react';
import { AlertTriangle, Building2, CheckCircle2, Info, X } from 'lucide-react';

type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONE_MAP: Record<string, StatusTone> = {
  available: 'success',
  active: 'success',
  paid: 'success',
  resolved: 'success',
  completed: 'success',
  accepted: 'success',
  closed: 'success',
  closed_won: 'success',
  excellent: 'success',
  good: 'success',
  replied: 'success',

  under_offer: 'warning',
  reserved: 'warning',
  expiring_soon: 'warning',
  pending: 'warning',
  in_progress: 'warning',
  assigned: 'warning',
  countered: 'warning',
  noc_pending: 'warning',
  dld_transfer: 'info',
  scheduled: 'info',
  mou_signed: 'info',
  contacted: 'info',
  visit_scheduled: 'info',
  offer: 'info',
  negotiation: 'warning',
  new: 'info',
  open: 'warning',
  fair: 'warning',

  overdue: 'danger',
  expired: 'danger',
  rejected: 'danger',
  cancelled: 'danger',
  closed_lost: 'danger',
  urgent: 'danger',
  high: 'danger',
  damaged: 'danger',
  needs_repair: 'danger',

  sold: 'neutral',
  rented: 'neutral',
  draft: 'neutral',
  off_market: 'neutral',
  terminated: 'neutral',
  low: 'neutral',
  medium: 'info',
  archived: 'neutral',
};

const TONE_CLASSES: Record<StatusTone, string> = {
  success:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/70',
  warning:
    'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/70',
  danger:
    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/70',
  info: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/70',
  neutral:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700',
};

export const StatusBadge: React.FC<{ status: string; label?: string }> = ({
  status,
  label,
}) => {
  const tone = TONE_MAP[status] ?? 'neutral';
  const text = label ?? status.replace(/_/g, ' ');
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border capitalize whitespace-nowrap shrink-0 ${TONE_CLASSES[tone]}`}
    >
      {text}
    </span>
  );
};

export const StatCard: React.FC<{
  label: string;
  value: string | number;
  detail?: string;
  action?: React.ReactNode;
}> = ({ label, value, detail, action }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-2">
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      {action}
    </div>
    <div className="text-2xl font-display font-semibold tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
      {value}
    </div>
    {detail && (
      <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">{detail}</div>
    )}
  </div>
);

export const FormField: React.FC<{
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, error, required, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
      {label}
      {required && <span className="text-rose-600 dark:text-rose-400 ms-0.5">*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
  </div>
);

export const inputClassName =
  'w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 focus:border-teal-600 transition-colors';

export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidth?: string;
  children: React.ReactNode;
}> = ({ open, onClose, title, subtitle, maxWidth = 'max-w-2xl', children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${maxWidth} max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-slate-50">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export const ConfirmDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
}> = ({ open, onClose, onConfirm, title, description, confirmLabel = 'Delete' }) => (
  <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{description}</p>
      </div>
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors whitespace-nowrap"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </Modal>
);

export const PropertyImage: React.FC<{
  src?: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className = 'w-full h-full object-cover' }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 p-4 text-center ${className}`}
      >
        <Building2 className="w-8 h-8 stroke-[1.5]" />
        <span className="text-xs font-medium line-clamp-2 max-w-[180px]">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-10 flex flex-col items-center justify-center text-center gap-3 bg-white dark:bg-slate-900">
    {icon && <div className="text-slate-400 dark:text-slate-500">{icon}</div>}
    <h3 className="text-base font-display font-semibold text-slate-900 dark:text-slate-100">
      {title}
    </h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">{description}</p>
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="px-4 py-3.5 flex items-center gap-4 animate-pulse">
        <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-4 flex-1 bg-slate-100 dark:bg-slate-800/70 rounded" />
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
    ))}
  </div>
);

export const ToastContainer: React.FC<{
  toasts: { id: string; type: 'success' | 'error' | 'info'; title: string; description?: string }[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 end-4 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg"
        >
          {toast.type === 'success' && (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          )}
          {toast.type === 'error' && (
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          )}
          {toast.type === 'info' && (
            <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{toast.title}</p>
            {toast.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {toast.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

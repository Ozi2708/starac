import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from './core';
import { Icon } from './Icon';

// ---------- Toasts ----------
export type ToastTone = 'success' | 'points' | 'error' | 'info';
interface ToastItem { id: number; tone: ToastTone; title: string; message?: string; action?: { label: string; onClick: () => void } }
interface ToastApi { show: (t: Omit<ToastItem, 'id'>) => void }
const ToastCtx = createContext<ToastApi>({ show: () => undefined });
const IC: Record<ToastTone, string> = { success: 'check', points: 'star', error: 'x', info: 'info' };

export function ToastProvider({ children, position = 'top' }: { children: ReactNode; position?: 'top' | 'bottom-right' }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const show = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = ++seq.current;
    setItems([{ ...t, id }]);
    setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), t.action ? 6000 : 3200);
  }, []);
  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div
        className={position === 'top' ? 'pointer-events-none fixed inset-x-4 z-[80] flex justify-center' : 'pointer-events-none fixed bottom-6 right-6 z-[80]'}
        style={position === 'top' ? { top: 'calc(env(safe-area-inset-top) + 14px)' } : undefined}
        aria-live="polite"
      >
        {items.map((t) => (
          <div key={t.id} className={'gp-toast pointer-events-auto gp-toast--' + t.tone} role={t.tone === 'error' ? 'alert' : 'status'}>
            <span className="gp-toast__ic"><Icon name={IC[t.tone]} size={16} /></span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="gp-toast__title">{t.title}</span>
              {t.message && <span className="gp-toast__msg">{t.message}</span>}
              {t.action && (
                <button type="button" className="mt-1 self-start border-0 bg-transparent p-0 font-bold text-magenta-400" style={{ font: 'var(--text-body-s)', fontWeight: 700 }} onClick={t.action.onClick}>
                  {t.action.label}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx).show;

// ---------- Dialog ----------
export function Dialog({ open, title, children, actions, onClose, width }: { open: boolean; title?: ReactNode; children?: ReactNode; actions?: ReactNode; onClose?: () => void; width?: number }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="gp-dialog__scrim" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="gp-dialog" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} style={width ? { maxWidth: width } : undefined}>
        {title && <h2 className="gp-dialog__title">{title}</h2>}
        {children && <div className="gp-dialog__body">{children}</div>}
        {actions && <div className="gp-dialog__actions">{actions}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, children, confirmLabel, cancelLabel = 'Annuler', onConfirm, onCancel, loading, danger }: {
  open: boolean; title: string; children?: ReactNode; confirmLabel: string; cancelLabel?: string; onConfirm: () => void; onCancel: () => void; loading?: boolean; danger?: boolean;
}) {
  return (
    <Dialog open={open} title={title} onClose={loading ? undefined : onCancel} actions={<>
      <Button block variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      <Button block variant="ghost" onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
    </>}>
      {children}
    </Dialog>
  );
}

// ---------- États vides / erreur ----------
export function EmptyState({ icon = 'sparkles', title, message, action }: { icon?: string; title: string; message?: ReactNode; action?: ReactNode }) {
  return (
    <div className="card-plain flex flex-col items-center gap-3 px-5 py-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[.08] text-secondary"><Icon name={icon} size={22} /></span>
      <span className="t-body font-bold">{title}</span>
      {message && <span className="t-body-s text-pretty text-muted">{message}</span>}
      {action}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState icon="x" title="Chargement impossible" message="Vérifie ta connexion. Rien n’a été modifié."
      action={onRetry && <Button size="sm" variant="secondary" icon="refresh-cw" onClick={onRetry}>Réessayer</Button>} />
  );
}

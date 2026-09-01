import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section className="w-full max-w-sm overflow-hidden rounded-3xl border border-rose-400/20 bg-slate-900 shadow-2xl shadow-slate-950/50" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description">
        <div className="flex items-start gap-3 border-b border-slate-800 bg-rose-500/[0.07] p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-rose-400/25 bg-rose-500/15 text-rose-300">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-dialog-title" className="text-base font-black tracking-tight text-white">{title}</h2>
            <p id="confirm-dialog-description" className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white" aria-label="Fechar confirmação">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex flex-col-reverse gap-2 p-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-slate-700 hover:text-white">Cancelar</button>
          <button type="button" onClick={onConfirm} className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-rose-950/30 transition hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-300/60">{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
};

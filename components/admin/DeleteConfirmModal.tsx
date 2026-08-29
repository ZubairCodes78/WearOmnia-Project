'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, Loader2, X, ShieldAlert } from 'lucide-react';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  itemName: string;
  itemType: string;
  warningMessage?: string;
  requirePhrase?: string; // e.g. "DELETE"
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType,
  warningMessage = 'This action is destructive and cannot be undone.',
  requirePhrase,
}: DeleteConfirmModalProps) {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requirePhrase && confirmationInput.trim().toUpperCase() !== requirePhrase.toUpperCase()) {
      setErrorMessage(`Please type "${requirePhrase}" to confirm deletion.`);
      return;
    }

    setIsDeleting(true);
    setErrorMessage('');
    try {
      await onConfirm();
    } catch (err: any) {
      setErrorMessage(err?.message || `Failed to delete ${itemType.toLowerCase()}.`);
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#0A2528] border border-red-500/40 rounded-3xl shadow-2xl overflow-hidden text-[#FAF8F5] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-[#D4AF37] to-red-600" />

        <div className="p-6 border-b border-[#D4AF37]/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-950/80 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-red-400">
                Destructive Action
              </span>
              <h2 className="font-serif text-lg font-bold text-[#FAF8F5]">{title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-[#FAF8F5]/60 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-sans">
          <div className="bg-[#06191B] border border-red-500/20 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#FAF8F5]/60 uppercase font-bold tracking-wider">{itemType}</span>
              <span className="font-mono font-bold text-sm text-[#D4AF37] break-all">{itemName}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-600/30 text-xs text-red-200/90 leading-relaxed">
            {warningMessage}
          </div>

          {requirePhrase && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-[#D4AF37] block">
                Type <span className="font-mono text-white bg-red-950 px-1.5 py-0.5 rounded border border-red-500/40">{requirePhrase}</span> to confirm:
              </label>
              <input
                type="text"
                required
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={`Type ${requirePhrase}`}
                disabled={isDeleting}
                className="w-full bg-[#06191B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF8F5] font-mono focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-950/80 border border-red-500 rounded-xl text-xs text-red-200">
              {errorMessage}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D4AF37]/15">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-[#FAF8F5]/80 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDeleting || (requirePhrase ? confirmationInput.trim().toUpperCase() !== requirePhrase.toUpperCase() : false)}
              className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 disabled:opacity-40"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" /> Delete {itemType}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

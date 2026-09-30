import React, { useState } from 'react';
import {
  CheckCircle2,
  Send,
  Truck,
  Printer,
  FileText,
  ChevronDown,
  Trash2,
  RotateCcw,
  X,
  Loader2,
} from 'lucide-react';
import { AdminButton } from './AdminButton';

export interface AdminBulkActionBarProps {
  selectedCount: number;
  totalCount?: number;
  onClearSelection: () => void;
  onConfirmOrders?: () => void;
  onSendWhatsApp?: () => void;
  onCreatePostEx?: () => void;
  onDownloadInvoices?: () => void;
  onPrintLabels?: () => void;
  onUpdateStatus?: () => void;
  onDeleteOrders?: () => void;
  isProcessing?: boolean;
  processingLabel?: string;
  className?: string;
}

export function AdminBulkActionBar({
  selectedCount,
  totalCount,
  onClearSelection,
  onConfirmOrders,
  onSendWhatsApp,
  onCreatePostEx,
  onDownloadInvoices,
  onPrintLabels,
  onUpdateStatus,
  onDeleteOrders,
  isProcessing = false,
  processingLabel = 'Processing...',
  className = '',
}: AdminBulkActionBarProps) {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div
      className={`fixed bottom-4 sm:bottom-6 inset-x-3 sm:inset-x-6 max-w-4xl mx-auto z-40 bg-[#0A2528]/95 backdrop-blur-xl border border-[#D4AF37]/50 rounded-2xl p-3 sm:p-4 shadow-2xl shadow-black/80 font-sans animate-in fade-in slide-in-from-bottom-4 duration-200 ${className}`}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Counter & Clear */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#D4AF37] text-black font-mono font-black text-xs flex items-center justify-center shadow-xs">
              {selectedCount}
            </span>
            <div>
              <span className="text-xs font-bold text-[#FAF8F5] tracking-wide">
                {selectedCount} {selectedCount === 1 ? 'Order' : 'Orders'} Selected
              </span>
              {totalCount && (
                <span className="text-[10px] text-[#FAF8F5]/50 block">
                  of {totalCount} matching
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClearSelection}
            disabled={isProcessing}
            className="text-[11px] text-[#FAF8F5]/60 hover:text-[#D4AF37] underline transition-colors cursor-pointer disabled:opacity-50"
          >
            Clear Selection
          </button>
        </div>

        {/* Right: Action Buttons Group */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          {/* 1. Bulk Confirm */}
          {onConfirmOrders && (
            <AdminButton
              size="sm"
              variant="primary"
              onClick={onConfirmOrders}
              disabled={isProcessing}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Confirm Orders
            </AdminButton>
          )}

          {/* 2. Bulk Send WhatsApp */}
          {onSendWhatsApp && (
            <AdminButton
              size="sm"
              variant="secondary"
              onClick={onSendWhatsApp}
              disabled={isProcessing}
              leftIcon={<Send className="w-3.5 h-3.5 text-emerald-400" />}
            >
              Send WhatsApp
            </AdminButton>
          )}

          {/* 3. Bulk Create PostEx */}
          {onCreatePostEx && (
            <AdminButton
              size="sm"
              variant="secondary"
              onClick={onCreatePostEx}
              disabled={isProcessing}
              leftIcon={<Truck className="w-3.5 h-3.5 text-sky-400" />}
            >
              Create PostEx
            </AdminButton>
          )}

          {/* 4. Bulk Print Labels */}
          {onPrintLabels && (
            <AdminButton
              size="sm"
              variant="outline"
              onClick={onPrintLabels}
              disabled={isProcessing}
              leftIcon={<Printer className="w-3.5 h-3.5 text-amber-300" />}
            >
              Print Labels
            </AdminButton>
          )}

          {/* 5. More Actions Dropdown */}
          {(onDownloadInvoices || onUpdateStatus || onDeleteOrders) && (
            <div className="relative">
              <AdminButton
                size="sm"
                variant="outline"
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                disabled={isProcessing}
                rightIcon={<ChevronDown className="w-3 h-3 ml-0.5" />}
              >
                More
              </AdminButton>

              {moreMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMoreMenuOpen(false)}
                  />
                  <div className="absolute right-0 bottom-full mb-2 w-48 bg-[#0A2528] rounded-xl border border-[#D4AF37]/30 shadow-2xl p-1.5 z-20 space-y-1">
                    {onDownloadInvoices && (
                      <button
                        onClick={() => {
                          setMoreMenuOpen(false);
                          onDownloadInvoices();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-[#FAF8F5]/90 hover:bg-[#103A3E] hover:text-[#D4AF37] transition-colors text-left cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Download Invoices</span>
                      </button>
                    )}

                    {onUpdateStatus && (
                      <button
                        onClick={() => {
                          setMoreMenuOpen(false);
                          onUpdateStatus();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-[#FAF8F5]/90 hover:bg-[#103A3E] hover:text-[#D4AF37] transition-colors text-left cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Update Status</span>
                      </button>
                    )}

                    {onDeleteOrders && (
                      <div className="border-t border-[#D4AF37]/15 pt-1 mt-1">
                        <button
                          onClick={() => {
                            setMoreMenuOpen(false);
                            onDeleteOrders();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-rose-300 hover:bg-rose-950/80 hover:text-white transition-colors text-left cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Delete Orders</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* In-Flight Operation Status Bar */}
      {isProcessing && (
        <div className="mt-2.5 pt-2.5 border-t border-[#D4AF37]/20 flex items-center justify-between text-xs text-[#D4AF37]">
          <div className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{processingLabel}</span>
          </div>
          <span className="text-[10px] text-[#FAF8F5]/50">
            Please wait while the server securely processes your batch.
          </span>
        </div>
      )}
    </div>
  );
}

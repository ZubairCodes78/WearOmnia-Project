import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  Send,
  Printer,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { AdminModal } from './ui/AdminModal';
import { AdminButton } from './ui/AdminButton';

export interface BulkResultItem {
  orderId: string;
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  success: boolean;
  action: string;
  message: string;
  trackingNumber?: string;
  skipped?: boolean;
  status?: 'SENT' | 'FAILED' | 'SKIPPED';
  messageId?: string;
}

export interface BulkSummary {
  total: number;
  successful: number;
  skipped: number;
  failed: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Bulk Confirm Confirmation Modal
// ─────────────────────────────────────────────────────────────────────────────
export function BulkConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  eligibleCount,
  skippedCount,
  skippedReasons,
  isProcessing,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  eligibleCount: number;
  skippedCount: number;
  skippedReasons: string[];
  isProcessing: boolean;
}) {
  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Selected Orders?"
      description="Orders will transition to CONFIRMED and become eligible for WhatsApp messaging and PostEx dispatch."
      footer={
        <>
          <AdminButton
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </AdminButton>
          <AdminButton
            variant="primary"
            size="md"
            onClick={onConfirm}
            isLoading={isProcessing}
            disabled={eligibleCount === 0}
          >
            Confirm {eligibleCount} {eligibleCount === 1 ? 'Order' : 'Orders'}
          </AdminButton>
        </>
      }
    >
      <div className="space-y-3 font-sans">
        <div className="p-3.5 rounded-xl bg-[#06191B] border border-[#D4AF37]/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Eligible for Confirmation</span>
          </div>
          <span className="font-mono text-sm font-black text-emerald-400">
            {eligibleCount}
          </span>
        </div>

        {skippedCount > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-600/40 space-y-2">
            <div className="flex items-center justify-between text-amber-300 font-bold">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Will Be Skipped</span>
              </div>
              <span className="font-mono text-sm font-black">
                {skippedCount}
              </span>
            </div>
            <div className="space-y-1 text-[11px] text-amber-200/80 max-h-24 overflow-y-auto">
              {skippedReasons.map((reason, idx) => (
                <p key={idx}>• {reason}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminModal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Bulk Create PostEx Shipments Confirmation Modal
// ─────────────────────────────────────────────────────────────────────────────
export function BulkShipmentModal({
  isOpen,
  onClose,
  onConfirm,
  eligibleCount,
  alreadyTrackedCount,
  isProcessing,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  eligibleCount: number;
  alreadyTrackedCount: number;
  isProcessing: boolean;
}) {
  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create PostEx Shipments?"
      description="Orders will be submitted directly to PostEx Courier API. Tracking numbers will be automatically generated and linked."
      footer={
        <>
          <AdminButton
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </AdminButton>
          <AdminButton
            variant="primary"
            size="md"
            onClick={onConfirm}
            isLoading={isProcessing}
            disabled={eligibleCount === 0}
            leftIcon={<Truck className="w-4 h-4" />}
          >
            Create {eligibleCount} {eligibleCount === 1 ? 'Shipment' : 'Shipments'}
          </AdminButton>
        </>
      }
    >
      <div className="space-y-3 font-sans">
        <div className="p-3.5 rounded-xl bg-[#06191B] border border-[#D4AF37]/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sky-400 font-bold">
            <Truck className="w-4 h-4" />
            <span>Eligible for PostEx Booking</span>
          </div>
          <span className="font-mono text-sm font-black text-sky-400">
            {eligibleCount}
          </span>
        </div>

        {alreadyTrackedCount > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-600/40 flex items-center justify-between text-amber-300">
            <div className="flex items-center gap-2 text-xs font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>Already has active tracking (will be skipped)</span>
            </div>
            <span className="font-mono text-sm font-black">
              {alreadyTrackedCount}
            </span>
          </div>
        )}
      </div>
    </AdminModal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Bulk Update Status Modal
// ─────────────────────────────────────────────────────────────────────────────
export function BulkStatusModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  isProcessing,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetStatus: string) => void;
  selectedCount: number;
  isProcessing: boolean;
}) {
  const [selectedStatus, setSelectedStatus] = React.useState('PACKING');

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Status Update"
      description={`Update fulfillment status for ${selectedCount} selected orders. Invalid state transitions will be safely skipped.`}
      footer={
        <>
          <AdminButton
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </AdminButton>
          <AdminButton
            variant="primary"
            size="md"
            onClick={() => onConfirm(selectedStatus)}
            isLoading={isProcessing}
          >
            Update {selectedCount} Orders
          </AdminButton>
        </>
      }
    >
      <div className="space-y-3 font-sans">
        <label className="block text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
          Target Status
        </label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-[#06191B] rounded-xl text-xs font-bold text-[#FAF8F5] border border-[#D4AF37]/30 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] cursor-pointer uppercase"
        >
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="PACKING">PACKING (In Warehouse)</option>
          <option value="DISPATCHED">DISPATCHED</option>
          <option value="DELIVERED">DELIVERED</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="RETURNED">RETURNED</option>
        </select>
      </div>
    </AdminModal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Bulk WhatsApp Pre-Send Confirmation Modal (Phase 2 & Phase 9)
// ─────────────────────────────────────────────────────────────────────────────
export function BulkWhatsAppModal({
  isOpen,
  onClose,
  onConfirm,
  totalSelected,
  eligibleCount,
  skippedCount,
  skippedReasons,
  isProcessing,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action: 'AUTO' | 'CONFIRMATION' | 'TRACKING' | 'DELIVERED', forceResend: boolean) => void;
  totalSelected: number;
  eligibleCount: number;
  skippedCount: number;
  skippedReasons: string[];
  isProcessing: boolean;
}) {
  const [selectedAction, setSelectedAction] = React.useState<'AUTO' | 'CONFIRMATION' | 'TRACKING' | 'DELIVERED'>('AUTO');
  const [forceResend, setForceResend] = React.useState(false);

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Send WhatsApp Messages"
      description="Dispatch official customer notifications via Meta WhatsApp Cloud API with controlled rate limiting."
      footer={
        <>
          <AdminButton
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </AdminButton>
          <AdminButton
            variant="primary"
            size="md"
            onClick={() => onConfirm(selectedAction, forceResend)}
            isLoading={isProcessing}
            disabled={eligibleCount === 0 && !forceResend}
            leftIcon={<Send className="w-4 h-4 text-emerald-300" />}
          >
            Send WhatsApp ({eligibleCount || totalSelected})
          </AdminButton>
        </>
      }
    >
      <div className="space-y-4 font-sans">
        {/* KPI Preview */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-[#06191B] border border-[#D4AF37]/20">
            <span className="font-mono text-lg font-black text-[#FAF8F5]">
              {totalSelected}
            </span>
            <span className="block text-[10px] text-[#FAF8F5]/60 font-bold uppercase tracking-wider mt-0.5">
              Selected
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-700/50">
            <span className="font-mono text-lg font-black text-emerald-400">
              {eligibleCount}
            </span>
            <span className="block text-[10px] text-emerald-300 font-bold uppercase tracking-wider mt-0.5">
              Eligible
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-600/50">
            <span className="font-mono text-lg font-black text-amber-300">
              {skippedCount}
            </span>
            <span className="block text-[10px] text-amber-300 font-bold uppercase tracking-wider mt-0.5">
              Skipped
            </span>
          </div>
        </div>

        {/* Action Type Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
            Message Type
          </label>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value as any)}
            className="w-full px-3.5 py-2.5 bg-[#06191B] rounded-xl text-xs font-bold text-[#FAF8F5] border border-[#D4AF37]/30 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] cursor-pointer"
          >
            <option value="AUTO">Smart Auto-Lifecycle (Auto-picks next pending step)</option>
            <option value="CONFIRMATION">Order Confirmation (Phase 4 Detailed Summary)</option>
            <option value="TRACKING">Courier Dispatch Update (PostEx tracking slip)</option>
            <option value="DELIVERED">Delivery Completed Notice</option>
          </select>
        </div>

        {/* Force Re-send Checkbox */}
        <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#06191B] border border-white/5 cursor-pointer text-xs text-[#FAF8F5]/90 hover:bg-[#103A3E]/40 transition-colors">
          <input
            type="checkbox"
            checked={forceResend}
            onChange={(e) => setForceResend(e.target.checked)}
            className="rounded border-[#D4AF37]/40 text-[#D4AF37] focus:ring-[#D4AF37]"
          />
          <span className="text-[11px]">Force re-send to orders that already received this notification</span>
        </label>

        {/* Skipped Reasons Breakdown */}
        {skippedCount > 0 && !forceResend && (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/40 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Skipped Orders ({skippedCount})</span>
            </div>
            <div className="space-y-1 text-[11px] text-amber-200/80 max-h-24 overflow-y-auto pr-1">
              {skippedReasons.map((reason, idx) => (
                <p key={idx}>• {reason}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminModal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Bulk Result Summary Modal with "Retry Failed Only" (Phase 2 & Phase 9)
// ─────────────────────────────────────────────────────────────────────────────
export function BulkResultModal({
  isOpen,
  onClose,
  title,
  summary,
  results,
  onRetryFailed,
  isRetrying = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  summary: BulkSummary;
  results: BulkResultItem[];
  onRetryFailed?: (failedOrderIds: string[]) => void;
  isRetrying?: boolean;
}) {
  const [showDetails, setShowDetails] = React.useState(true);

  const failedItems = results.filter((r) => !r.success && !r.skipped);
  const failedIds = failedItems.map((r) => r.orderId);

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description="The batch operation has finished processing. Summary of results below:"
      footer={
        <div className="flex items-center justify-between w-full gap-2">
          {summary.failed > 0 && onRetryFailed ? (
            <AdminButton
              variant="outline"
              size="md"
              onClick={() => onRetryFailed(failedIds)}
              isLoading={isRetrying}
              leftIcon={<RotateCcw className="w-3.5 h-3.5 text-rose-300" />}
            >
              Retry Failed ({summary.failed})
            </AdminButton>
          ) : (
            <div />
          )}

          <AdminButton variant="primary" size="md" onClick={onClose}>
            Done
          </AdminButton>
        </div>
      }
    >
      <div className="space-y-4 font-sans">
        {/* KPI Summary Tiles */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-700/50">
            <span className="font-mono text-xl sm:text-2xl font-black text-emerald-400">
              {summary.successful}
            </span>
            <span className="block text-[10px] text-emerald-300 font-bold uppercase tracking-wider mt-0.5">
              Sent
            </span>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-600/50">
            <span className="font-mono text-xl sm:text-2xl font-black text-amber-300">
              {summary.skipped}
            </span>
            <span className="block text-[10px] text-amber-300 font-bold uppercase tracking-wider mt-0.5">
              Skipped
            </span>
          </div>

          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/50">
            <span className="font-mono text-xl sm:text-2xl font-black text-rose-400">
              {summary.failed}
            </span>
            <span className="block text-[10px] text-rose-300 font-bold uppercase tracking-wider mt-0.5">
              Failed
            </span>
          </div>
        </div>

        {/* Collapsible View Details */}
        <div className="pt-2 border-t border-[#D4AF37]/15">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between py-2 text-xs font-bold text-[#D4AF37] hover:text-white transition-colors cursor-pointer"
          >
            <span>Recipient Result Details ({results.length})</span>
            {showDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showDetails && (
            <div className="mt-2 space-y-2 max-h-64 overflow-y-auto pr-1">
              {results.map((res, idx) => {
                const statusBadge = res.success
                  ? res.skipped
                    ? { bg: 'bg-amber-950/60 border-amber-600/40 text-amber-300', label: 'SKIPPED' }
                    : { bg: 'bg-emerald-950/60 border-emerald-600/40 text-emerald-400', label: 'SENT' }
                  : { bg: 'bg-rose-950/60 border-rose-700/50 text-rose-300', label: 'FAILED' };

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#06191B] border border-white/10 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {res.success ? (
                          res.skipped ? (
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          )
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span className="font-mono font-bold text-[#FAF8F5]">
                          #{res.orderNumber}
                        </span>
                        {res.customerName && (
                          <span className="text-[#FAF8F5]/80 font-medium truncate">
                            {res.customerName}
                          </span>
                        )}
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${statusBadge.bg}`}
                      >
                        {statusBadge.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] text-[#FAF8F5]/60">
                      {res.customerPhone && (
                        <span>Phone: <span className="font-mono text-[#FAF8F5]/90">{res.customerPhone}</span></span>
                      )}
                      {res.messageId && (
                        <span>Msg ID: <span className="font-mono text-[#D4AF37]">{res.messageId}</span></span>
                      )}
                      {res.action && (
                        <span>Action: <span className="font-mono text-[#FAF8F5]/80">{res.action}</span></span>
                      )}
                    </div>

                    {res.message && (
                      <p
                        className={`text-[11px] font-sans pt-1 border-t border-white/5 ${
                          !res.success
                            ? 'text-rose-300'
                            : res.skipped
                            ? 'text-amber-200/90'
                            : 'text-[#FAF8F5]/70'
                        }`}
                      >
                        {res.message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminModal>
  );
}

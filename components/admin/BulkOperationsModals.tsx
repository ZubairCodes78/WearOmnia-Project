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
} from 'lucide-react';
import { AdminModal } from './ui/AdminModal';
import { AdminButton } from './ui/AdminButton';

export interface BulkResultItem {
  orderId: string;
  orderNumber: string;
  success: boolean;
  action: string;
  message: string;
  trackingNumber?: string;
  skipped?: boolean;
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
// 4. Bulk Result Summary Modal
// ─────────────────────────────────────────────────────────────────────────────
export function BulkResultModal({
  isOpen,
  onClose,
  title,
  summary,
  results,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  summary: BulkSummary;
  results: BulkResultItem[];
}) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description="The batch operation has finished processing. Summary of results below:"
      footer={
        <AdminButton variant="primary" size="md" onClick={onClose}>
          Done
        </AdminButton>
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
              Successful
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
            <span>View Operation Details ({results.length})</span>
            {showDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showDetails && (
            <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {results.map((res, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-[#06191B] border border-white/5 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {res.success ? (
                      res.skipped ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                    <span className="font-mono font-bold text-[#FAF8F5] shrink-0">
                      {res.orderNumber}
                    </span>
                    <span className="text-[#FAF8F5]/60 text-[11px] truncate">
                      {res.message}
                    </span>
                  </div>

                  {res.trackingNumber && (
                    <span className="font-mono text-[11px] font-bold text-emerald-400 shrink-0">
                      {res.trackingNumber}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminModal>
  );
}

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  Search,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
  Phone,
  Package,
  Maximize2,
  Camera,
  Filter,
} from 'lucide-react';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { useDebounce } from '@/hooks/useDebounce';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

interface ReviewItem {
  id: string;
  productId: string;
  orderId?: string | null;
  customerName: string;
  customerPhone?: string | null;
  rating: number;
  comment: string;
  imageUrl?: string | null;
  isApproved: boolean;
  status?: string;
  rejectionReason?: string | null;
  verifiedPurchase?: boolean;
  createdAt: string;
  product?: {
    id: string;
    title: string;
    sku: string;
    slug?: string;
    images?: Array<{ url: string }>;
  } | null;
  order?: {
    id: string;
    orderNumber: string;
    customerPhone: string;
    customerWhatsapp?: string | null;
    status: string;
    deliveredAt?: string | null;
  } | null;
}

export function ReviewsClient({ initialReviews }: { initialReviews: ReviewItem[] }) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [selectedProductId, setSelectedProductId] = useState<string>('ALL');
  const [zoomReviewImage, setZoomReviewImage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteModalReview, setDeleteModalReview] = useState<ReviewItem | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const pendingCount = reviews.filter((r) => !r.isApproved && r.status !== 'REJECTED').length;
  const approvedCount = reviews.filter((r) => r.isApproved).length;
  const rejectedCount = reviews.filter((r) => r.status === 'REJECTED').length;

  const productsList = React.useMemo(() => {
    const map = new Map<string, { id: string; title: string; sku?: string }>();
    reviews.forEach((r) => {
      if (r.product?.id) {
        map.set(r.product.id, {
          id: r.product.id,
          title: r.product.title,
          sku: r.product.sku,
        });
      }
    });
    return Array.from(map.values());
  }, [reviews]);

  const handleAction = async (id: string, isApproved: boolean, action: string = 'update') => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/reviews/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isApproved, action }),
      });
      if (res.ok) {
        if (action === 'delete') {
          setReviews((prev) => prev.filter((r) => r.id !== id));
        } else if (action === 'reject') {
          setReviews((prev) =>
            prev.map((r) =>
              r.id === id ? { ...r, isApproved: false, status: 'REJECTED' } : r
            )
          );
        } else {
          setReviews((prev) =>
            prev.map((r) =>
              r.id === id
                ? { ...r, isApproved, status: isApproved ? 'APPROVED' : 'PENDING' }
                : r
            )
          );
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalReview) return;
    await handleAction(deleteModalReview.id, false, 'delete');
    setDeleteModalReview(null);
  };

  const filteredReviews = reviews.filter((r) => {
    const term = debouncedSearch.trim().toLowerCase();
    const matchesSearch =
      !term ||
      r.customerName.toLowerCase().includes(term) ||
      r.comment.toLowerCase().includes(term) ||
      (r.product?.title && r.product.title.toLowerCase().includes(term)) ||
      (r.order?.orderNumber && r.order.orderNumber.toLowerCase().includes(term));

    let matchesStatus = true;
    if (statusFilter === 'PENDING') matchesStatus = !r.isApproved && r.status !== 'REJECTED';
    else if (statusFilter === 'APPROVED') matchesStatus = r.isApproved;
    else if (statusFilter === 'REJECTED') matchesStatus = r.status === 'REJECTED';

    let matchesProduct = true;
    if (selectedProductId !== 'ALL') {
      matchesProduct = r.productId === selectedProductId;
    }

    return matchesSearch && matchesStatus && matchesProduct;
  });

  const totalPages = Math.ceil(filteredReviews.length / pageSize) || 1;
  const paginatedReviews = filteredReviews.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, selectedProductId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Customer Reviews Moderation"
        description="Verify and approve genuine customer testimonials before publishing them live to storefront product pages."
        badge={
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-md border border-[#D4AF37]/20">
            <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" /> Reputation &amp; Feedback
          </span>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#0A2528] rounded-xl border border-white/5 p-5 shadow-sm">
          <span className="text-[11px] uppercase font-semibold tracking-wider text-[#D4AF37]">Total Submissions</span>
          <p className="font-serif text-2xl font-bold text-[#FAF8F5] mt-1">{reviews.length}</p>
          <span className="text-[11px] text-[#FAF8F5]/50 mt-1 block">Customer testimonials</span>
        </div>

        <div className="bg-[#0A2528] rounded-xl border border-amber-500/20 p-5 shadow-sm">
          <span className="text-[11px] uppercase font-semibold tracking-wider text-amber-400">Pending Approval</span>
          <p className="font-serif text-2xl font-bold text-amber-400 mt-1">{pendingCount}</p>
          <span className="text-[11px] text-amber-300/70 mt-1 block">Awaiting verification</span>
        </div>

        <div className="bg-[#0A2528] rounded-xl border border-emerald-500/20 p-5 shadow-sm">
          <span className="text-[11px] uppercase font-semibold tracking-wider text-emerald-400">Published Live</span>
          <p className="font-serif text-2xl font-bold text-emerald-400 mt-1">{approvedCount}</p>
          <span className="text-[11px] text-emerald-300/70 mt-1 block">Visible on storefront</span>
        </div>

        <div className="bg-[#0A2528] rounded-xl border border-rose-500/20 p-5 shadow-sm">
          <span className="text-[11px] uppercase font-semibold tracking-wider text-rose-400">Rejected / Declined</span>
          <p className="font-serif text-2xl font-bold text-rose-400 mt-1">{rejectedCount}</p>
          <span className="text-[11px] text-rose-300/70 mt-1 block">Hidden from public</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0A2528] rounded-xl border border-white/5 p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors whitespace-nowrap ${
              statusFilter === 'ALL'
                ? 'bg-[#D4AF37] text-black shadow-sm'
                : 'text-[#FAF8F5]/70 hover:text-white hover:bg-white/5'
            }`}
          >
            All Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors whitespace-nowrap ${
              statusFilter === 'PENDING'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors whitespace-nowrap ${
              statusFilter === 'APPROVED'
                ? 'bg-emerald-500 text-black shadow-sm'
                : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-500/10'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setStatusFilter('REJECTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors whitespace-nowrap ${
              statusFilter === 'REJECTED'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          {productsList.length > 0 && (
            <div className="relative w-full sm:w-56">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-[#06191B] rounded-lg text-xs text-[#FAF8F5] border border-white/10 px-3 py-2 pr-8 focus:outline-none focus:border-[#D4AF37]/50 appearance-none font-sans"
              >
                <option value="ALL">All Products ({reviews.length})</option>
                {productsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title.length > 25 ? `${p.title.slice(0, 25)}...` : p.title} ({reviews.filter((r) => r.productId === p.id).length})
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-[#D4AF37] absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#FAF8F5]/40 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search customer, comment, order #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#06191B] rounded-lg text-xs text-[#FAF8F5] border border-white/10 focus:outline-none focus:border-[#D4AF37]/50 font-sans placeholder:text-[#FAF8F5]/30 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-[#0A2528] rounded-xl border border-white/5 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#06191B] text-[#FAF8F5]/60 border-b border-white/5 font-semibold">
              <tr>
                <th className="px-4 py-3">Customer &amp; Order</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Review Feedback</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8">
                    <AdminEmptyState
                      icon={MessageSquare}
                      title="No reviews found"
                      description="No reviews match your current search or moderation filters."
                      action={
                        search || statusFilter !== 'ALL'
                          ? {
                              label: 'Clear Filters',
                              onClick: () => {
                                setSearch('');
                                setStatusFilter('ALL');
                              },
                            }
                          : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                paginatedReviews.map((rev) => {
                  const isPending = !rev.isApproved && rev.status !== 'REJECTED';
                  const isApproved = rev.isApproved;
                  const isRejected = rev.status === 'REJECTED';
                  const phone = rev.customerPhone || rev.order?.customerPhone || rev.order?.customerWhatsapp;

                  return (
                    <tr key={rev.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Customer & Order */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-[#FAF8F5]">{rev.customerName}</span>
                            {rev.verifiedPurchase !== false && (
                              <span
                                className="inline-flex items-center gap-0.5 text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20"
                                title="Verified order purchase"
                              >
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> Verified
                              </span>
                            )}
                          </div>

                          {rev.order ? (
                            <Link
                              href={`/admin/orders/${rev.order.id}`}
                              className="inline-flex items-center gap-1 text-[11px] text-[#D4AF37] hover:underline font-mono"
                            >
                              <Package className="w-3 h-3" /> Order #{rev.order.orderNumber}
                            </Link>
                          ) : (
                            <span className="text-[10px] text-white/40 block">Direct Submission</span>
                          )}

                          {phone && (
                            <span className="text-[10px] text-white/50 flex items-center gap-1 font-mono">
                              <Phone className="w-2.5 h-2.5" /> {phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Product */}
                      <td className="px-4 py-3">
                        <span className="font-medium text-[#FAF8F5] block truncate max-w-[200px]">
                          {rev.product?.title || 'Unknown Product'}
                        </span>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-[10px] text-[#D4AF37] font-mono">{rev.product?.sku}</span>
                          {rev.product?.slug && (
                            <Link
                              href={`/product/${rev.product.slug}`}
                              target="_blank"
                              className="text-[10px] text-white/40 hover:text-white flex items-center gap-0.5 underline"
                            >
                              Live <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          )}
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-[#D4AF37]">
                          <div className="flex">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-current" />
                            ))}
                          </div>
                          <span className="text-[10px] text-white/60 font-semibold ml-1">
                            {rev.rating}/5
                          </span>
                        </div>
                      </td>

                      {/* Review Comment */}
                      <td className="px-4 py-3 text-[#FAF8F5]/80 max-w-sm">
                        <div className="flex items-start gap-3">
                          {rev.imageUrl && (
                            <button
                              type="button"
                              onClick={() => setZoomReviewImage(rev.imageUrl || null)}
                              className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#D4AF37]/30 hover:border-[#D4AF37] shrink-0 group cursor-pointer transition-all bg-black/40"
                              title="Click to enlarge customer photo"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={rev.imageUrl}
                                alt="Customer outfit photo"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Maximize2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                              </div>
                            </button>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 leading-relaxed">&quot;{rev.comment}&quot;</p>
                            <span className="text-[10px] text-white/40 block mt-0.5">
                              Submitted on {new Date(rev.createdAt).toLocaleDateString('en-PK')}
                            </span>
                            {rev.rejectionReason && (
                              <span className="text-[10px] text-rose-300/80 block mt-0.5 font-medium">
                                Note: {rev.rejectionReason}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {isApproved ? (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wider border inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Approved
                          </span>
                        ) : isRejected ? (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wider border inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 border-rose-500/20">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wider border inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border-amber-500/20">
                            <AlertCircle className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isApproved && (
                            <button
                              onClick={() => handleAction(rev.id, true, 'approve')}
                              disabled={actionLoading === rev.id}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors disabled:opacity-50"
                              title="Publish review live"
                            >
                              Approve
                            </button>
                          )}

                          {!isRejected && (
                            <button
                              onClick={() => handleAction(rev.id, false, 'reject')}
                              disabled={actionLoading === rev.id}
                              className="bg-rose-600/80 hover:bg-rose-600 text-white px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors disabled:opacity-50"
                              title="Reject review"
                            >
                              Reject
                            </button>
                          )}

                          <button
                            onClick={() => setDeleteModalReview(rev)}
                            disabled={actionLoading === rev.id}
                            className="p-1 rounded-md border border-white/10 text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                            title="Delete Review Permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredReviews.length > 0 && (
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredReviews.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      <DeleteConfirmModal
        isOpen={Boolean(deleteModalReview)}
        onClose={() => setDeleteModalReview(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer Review?"
        itemName={`Review by ${deleteModalReview?.customerName}`}
        itemType="Review"
        warningMessage="This will permanently remove this customer review from the database."
      />

      {/* Customer Review Image Zoom Lightbox Modal */}
      {zoomReviewImage && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col bg-[#0A2528] rounded-2xl border border-[#D4AF37]/30 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[#D4AF37]/20 bg-[#06191B]">
              <span className="font-serif font-bold text-sm text-[#FAF8F5] flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#D4AF37]" /> Customer Garment Photo Proof
              </span>
              <button
                onClick={() => setZoomReviewImage(null)}
                className="text-[#FAF8F5]/60 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={zoomReviewImage}
                alt="Customer outfit proof full view"
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

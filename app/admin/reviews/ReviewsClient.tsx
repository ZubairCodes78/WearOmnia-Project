'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Star, CheckCircle2, XCircle, Trash2, Search, AlertCircle, MessageSquare } from 'lucide-react';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { useDebounce } from '@/hooks/useDebounce';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

interface ReviewItem {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  imageUrl?: string | null;
  isApproved: boolean;
  createdAt: string;
  product?: {
    id: string;
    title: string;
    sku: string;
    images?: Array<{ url: string }>;
  } | null;
}

export function ReviewsClient({ initialReviews }: { initialReviews: ReviewItem[] }) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteModalReview, setDeleteModalReview] = useState<ReviewItem | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const pendingCount = reviews.filter((r) => !r.isApproved).length;
  const approvedCount = reviews.filter((r) => r.isApproved).length;

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
        } else {
          setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, isApproved } : r)));
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
      (r.product?.title && r.product.title.toLowerCase().includes(term));

    let matchesStatus = true;
    if (statusFilter === 'PENDING') matchesStatus = !r.isApproved;
    else if (statusFilter === 'APPROVED') matchesStatus = r.isApproved;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredReviews.length / pageSize) || 1;
  const paginatedReviews = filteredReviews.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Customer Reviews Moderation"
        description="Verify and approve genuine customer testimonials before publishing them live to storefront product pages."
        badge={
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-md border border-[#D4AF37]/20">
            <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" /> Reputation & Feedback
          </span>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#FAF8F5]/40 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search customer, comment, product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#06191B] rounded-lg text-xs text-[#FAF8F5] border border-white/10 focus:outline-none focus:border-[#D4AF37]/50 font-sans placeholder:text-[#FAF8F5]/30 transition-colors"
          />
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-[#0A2528] rounded-xl border border-white/5 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#06191B] text-[#FAF8F5]/60 border-b border-white/5 font-semibold">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Review</th>
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
                paginatedReviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-[#FAF8F5]">{rev.customerName}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-[#FAF8F5] block truncate max-w-[200px]">
                        {rev.product?.title || 'Unknown Product'}
                      </span>
                      <span className="text-[10px] text-[#D4AF37] font-mono">{rev.product?.sku}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex text-[#D4AF37]">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#FAF8F5]/80 max-w-sm line-clamp-2">
                      &quot;{rev.comment}&quot;
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wider border inline-flex items-center gap-1 ${
                          rev.isApproved
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {rev.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {!rev.isApproved ? (
                          <button
                            onClick={() => handleAction(rev.id, true)}
                            disabled={actionLoading === rev.id}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(rev.id, false)}
                            disabled={actionLoading === rev.id}
                            className="bg-amber-600 hover:bg-amber-500 text-white px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors disabled:opacity-50"
                          >
                            Unapprove
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteModalReview(rev)}
                          disabled={actionLoading === rev.id}
                          className="p-1 rounded-md border border-white/10 text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                          title="Delete Review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
    </div>
  );
}

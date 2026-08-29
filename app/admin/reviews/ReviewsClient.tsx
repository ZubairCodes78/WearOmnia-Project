'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Star, CheckCircle2, XCircle, Trash2, Search, Sparkles, AlertCircle } from 'lucide-react';

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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const filteredReviews = reviews.filter((r) => {
    const term = search.toLowerCase();
    const matchesSearch =
      r.customerName.toLowerCase().includes(term) ||
      r.comment.toLowerCase().includes(term) ||
      (r.product?.title && r.product.title.toLowerCase().includes(term));

    let matchesStatus = true;
    if (statusFilter === 'PENDING') matchesStatus = !r.isApproved;
    else if (statusFilter === 'APPROVED') matchesStatus = r.isApproved;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 text-[#FAF8F5]">
      {/* Header */}
      <div className="bg-[#0A2528]/85 backdrop-blur-2xl p-8 rounded-3xl border border-[#D4AF37]/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] font-bold text-[#D4AF37] bg-teal-950/80 px-3.5 py-1 rounded-full border border-[#D4AF37]/30">
              <Star className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" /> Reputation & Feedback
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#FAF8F5] mt-2">
            Customer Reviews Moderation Queue
          </h1>
          <p className="text-xs text-[#FAF8F5]/70 mt-1 font-sans">
            Verify and approve genuine customer testimonials before publishing them live to product pages.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-[#0A2528]/70 backdrop-blur-md p-5 rounded-2xl border border-[#D4AF37]/20 shadow-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#D4AF37]">Total Submissions</span>
          <p className="font-serif text-2xl font-bold text-[#FAF8F5]">{reviews.length}</p>
        </div>

        <div className="bg-[#0A2528]/70 backdrop-blur-md p-5 rounded-2xl border border-amber-500/30 shadow-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-amber-400">Pending Approval</span>
          <p className="font-serif text-2xl font-bold text-amber-400">{pendingCount}</p>
        </div>

        <div className="bg-[#0A2528]/70 backdrop-blur-md p-5 rounded-2xl border border-emerald-500/30 shadow-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-400">Published Live</span>
          <p className="font-serif text-2xl font-bold text-emerald-400">{approvedCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0A2528]/80 backdrop-blur-xl p-6 rounded-3xl border border-[#D4AF37]/20 shadow-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              statusFilter === 'ALL' ? 'bg-[#D4AF37] text-black shadow' : 'bg-[#06191B] text-[#FAF8F5]/80 hover:text-[#D4AF37]'
            }`}
          >
            All Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              statusFilter === 'PENDING' ? 'bg-amber-500 text-black shadow' : 'bg-[#06191B] text-amber-300 hover:text-white'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              statusFilter === 'APPROVED' ? 'bg-emerald-500 text-black shadow' : 'bg-[#06191B] text-emerald-300 hover:text-white'
            }`}
          >
            Approved ({approvedCount})
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search Customer, Review Text, Product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#06191B] rounded-xl text-xs text-[#FAF8F5] border border-[#D4AF37]/20 focus:outline-none focus:border-[#D4AF37] font-sans"
          />
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-[#0A2528]/80 backdrop-blur-2xl rounded-3xl border border-[#D4AF37]/20 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#06191B] text-[#D4AF37] uppercase tracking-wider font-semibold border-b border-[#D4AF37]/15">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Product</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Review Text</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/10">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#FAF8F5]/50 italic">
                    No customer reviews match your filter.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-[#103A3E]/40 transition-colors">
                    <td className="p-4 font-serif font-bold text-[#FAF8F5]">{rev.customerName}</td>
                    <td className="p-4">
                      <span className="font-semibold text-[#FAF8F5] block truncate max-w-[200px]">
                        {rev.product?.title || 'Unknown Product'}
                      </span>
                      <span className="text-[10px] text-[#D4AF37] font-mono">{rev.product?.sku}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex text-[#D4AF37]">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-[#FAF8F5]/80 max-w-sm font-sans line-clamp-2">
                      &quot;{rev.comment}&quot;
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        rev.isApproved
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                      }`}>
                        {rev.isApproved ? 'Published Live' : 'Pending Review'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      {!rev.isApproved ? (
                        <button
                          onClick={() => handleAction(rev.id, true)}
                          disabled={actionLoading === rev.id}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shadow"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(rev.id, false)}
                          disabled={actionLoading === rev.id}
                          className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shadow"
                        >
                          Unapprove
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm('Delete this customer review permanently?')) {
                            handleAction(rev.id, false, 'delete');
                          }
                        }}
                        disabled={actionLoading === rev.id}
                        className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded-lg border border-red-800/40 transition-all inline-block align-middle"
                        title="Delete Review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

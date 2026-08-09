'use client';

import React, { useState } from 'react';
import { Star, Check, X, Trash2 } from 'lucide-react';

export const ReviewsClient: React.FC<{ initialReviews: any[] }> = ({ initialReviews }) => {
  const [reviews, setReviews] = useState(initialReviews);

  const handleAction = async (id: string, isApproved: boolean, action: string = 'update') => {
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
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-offwhite p-6 rounded-3xl border border-sand shadow-sm">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-champagne-700">Moderation</span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-teal mt-1">Review Approval Queue ({reviews.length})</h1>
        </div>
      </div>

      <div className="bg-offwhite rounded-3xl border border-sand shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-sand text-charcoal uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Product</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Review Comment</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {reviews.map((rev) => (
                <tr key={rev.id} className="hover:bg-sand/40">
                  <td className="p-4 font-semibold text-teal">{rev.customerName}</td>
                  <td className="p-4 font-medium text-charcoal">{rev.product?.title || 'Unknown Product'}</td>
                  <td className="p-4">
                    <div className="flex text-champagne">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-charcoal-muted max-w-xs line-clamp-2 font-sans">"{rev.comment}"</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold ${
                      rev.isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {rev.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-1">
                    {!rev.isApproved ? (
                      <button
                        onClick={() => handleAction(rev.id, true)}
                        className="bg-green-700 text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase"
                      >
                        Approve
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(rev.id, false)}
                        className="bg-amber-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase"
                      >
                        Unapprove
                      </button>
                    )}
                    <button
                      onClick={() => handleAction(rev.id, false, 'delete')}
                      className="p-1 bg-red-50 text-red-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

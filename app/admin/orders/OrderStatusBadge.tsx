import React from 'react';

export const OrderStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let colorClass = 'bg-gray-800 text-gray-200 border-gray-700';
  let label = status.replace(/_/g, ' ');

  switch (status) {
    case 'PENDING':
      colorClass = 'bg-amber-950/70 text-amber-300 border-amber-500/40 shadow-amber-900/20';
      label = 'Pending Confirmation';
      break;
    case 'CONFIRMED':
      colorClass = 'bg-blue-950/70 text-blue-300 border-blue-500/40 shadow-blue-900/20';
      label = 'Confirmed';
      break;
    case 'PACKING':
      colorClass = 'bg-purple-950/70 text-purple-300 border-purple-500/40 shadow-purple-900/20';
      label = 'Packing Parcel';
      break;
    case 'DISPATCHED':
      colorClass = 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40 shadow-cyan-900/20';
      label = 'Dispatched';
      break;
    case 'OUT_FOR_DELIVERY':
      colorClass = 'bg-indigo-950/70 text-indigo-300 border-indigo-500/40 shadow-indigo-900/20';
      label = 'Out For Delivery';
      break;
    case 'DELIVERED':
      colorClass = 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 shadow-emerald-900/20';
      label = 'Delivered';
      break;
    case 'CANCELLED':
      colorClass = 'bg-rose-950/70 text-rose-300 border-rose-500/40 shadow-rose-900/20';
      label = 'Cancelled';
      break;
    case 'RETURNED':
      colorClass = 'bg-orange-950/70 text-orange-300 border-orange-500/40 shadow-orange-900/20';
      label = 'Returned / RTO';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm badge-3d ${colorClass}`}
    >
      {label}
    </span>
  );
};

import React from 'react';

export const OrderStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let colorClass = 'bg-gray-200 text-gray-800';

  switch (status) {
    case 'PENDING':
      colorClass = 'bg-amber-100 text-amber-900 border border-amber-300';
      break;
    case 'CONFIRMED':
      colorClass = 'bg-blue-100 text-blue-900 border border-blue-300';
      break;
    case 'PACKING':
      colorClass = 'bg-purple-100 text-purple-900 border border-purple-300';
      break;
    case 'DISPATCHED':
      colorClass = 'bg-cyan-100 text-cyan-900 border border-cyan-300';
      break;
    case 'OUT_FOR_DELIVERY':
      colorClass = 'bg-indigo-100 text-indigo-900 border border-indigo-300';
      break;
    case 'DELIVERED':
      colorClass = 'bg-green-100 text-green-900 border border-green-300';
      break;
    case 'CANCELLED':
      colorClass = 'bg-red-100 text-red-900 border border-red-300';
      break;
    case 'RETURNED':
      colorClass = 'bg-orange-100 text-orange-900 border border-orange-300';
      break;
  }

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${colorClass}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

'use client';

import React from 'react';
import { Printer } from 'lucide-react';

interface PrintControlsProps {
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  className?: string;
}

export function PrintControls({
  title = 'Printable Document',
  subtitle = 'Printable on standard thermal or A4 paper',
  buttonLabel = 'Print Document',
  className = '',
}: PrintControlsProps) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className={`no-print mb-8 max-w-xl mx-auto flex items-center justify-between bg-gray-100 p-4 rounded-2xl border border-gray-200 ${className}`}>
      <div>
        <h3 className="font-bold text-sm uppercase text-teal-950">{title}</h3>
        <p className="text-[11px] text-gray-600">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={handlePrint}
        className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
      >
        <Printer className="w-4 h-4" /> {buttonLabel}
      </button>
    </div>
  );
}

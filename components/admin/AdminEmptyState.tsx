import React from 'react';
import { Package } from 'lucide-react';

export interface AdminEmptyActionConfig {
  label: string;
  onClick: () => void;
}

interface AdminEmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode | AdminEmptyActionConfig;
  className?: string;
}

export function AdminEmptyState({
  icon: Icon = Package,
  title,
  description,
  action,
  className = '',
}: AdminEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-[#0A2528]/40 border border-[#D4AF37]/15 rounded-2xl font-sans ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-[#103A3E]/60 text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/20 mb-3 shadow-inner">
        <Icon className="w-6 h-6 text-[#D4AF37]" />
      </div>
      <h3 className="text-sm sm:text-base font-bold text-[#FAF8F5] mb-1">
        {title}
      </h3>
      <p className="text-xs text-[#FAF8F5]/60 max-w-sm mb-5 leading-relaxed">
        {description}
      </p>
      {action && (
        <div>
          {React.isValidElement(action) ? (
            action
          ) : typeof (action as any)?.onClick === 'function' ? (
            <button
              type="button"
              onClick={(action as AdminEmptyActionConfig).onClick}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              {(action as AdminEmptyActionConfig).label}
            </button>
          ) : (
            (action as React.ReactNode)
          )}
        </div>
      )}
    </div>
  );
}

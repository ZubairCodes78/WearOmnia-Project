import React from 'react';

export type AdminBadgeVariant =
  | 'gold'
  | 'emerald'
  | 'sky'
  | 'amber'
  | 'rose'
  | 'purple'
  | 'neutral';

export interface AdminBadgeProps {
  children: React.ReactNode;
  variant?: AdminBadgeVariant;
  icon?: React.ReactNode;
  pulse?: boolean;
  className?: string;
}

const variantStyles: Record<AdminBadgeVariant, string> = {
  gold: 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/40',
  emerald: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50',
  sky: 'bg-sky-950/70 text-sky-300 border-sky-700/50',
  amber: 'bg-amber-950/70 text-amber-300 border-amber-600/50',
  rose: 'bg-rose-950/70 text-rose-300 border-rose-700/50',
  purple: 'bg-purple-950/70 text-purple-300 border-purple-700/50',
  neutral: 'bg-white/5 text-[#FAF8F5]/80 border-white/15',
};

export function AdminBadge({
  children,
  variant = 'gold',
  icon,
  pulse = false,
  className = '',
}: AdminBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-md border text-[10px] font-mono font-bold uppercase tracking-wider whitespace-nowrap select-none shrink-0 ${variantStyles[variant]} ${
        pulse ? 'animate-pulse' : ''
      } ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

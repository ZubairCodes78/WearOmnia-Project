import React from 'react';

export interface AdminCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  noPadding?: boolean;
  className?: string;
}

export function AdminCard({
  children,
  title,
  subtitle,
  icon,
  action,
  noPadding = false,
  className = '',
  ...props
}: AdminCardProps) {
  const hasHeader = Boolean(title || subtitle || icon || action);

  return (
    <div
      className={`bg-[#0A2528] rounded-2xl border border-[#D4AF37]/20 shadow-md transition-all duration-150 overflow-hidden font-sans ${className}`}
      {...props}
    >
      {hasHeader && (
        <div className="p-4 sm:p-5 border-b border-[#D4AF37]/15 flex items-center justify-between gap-4 flex-wrap bg-[#06191B]/40">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="w-8 h-8 rounded-lg bg-[#103A3E] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-sm sm:text-base font-bold text-[#FAF8F5] tracking-tight truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-[11px] text-[#FAF8F5]/60 mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
        </div>
      )}

      <div className={noPadding ? '' : 'p-4 sm:p-5 lg:p-6'}>{children}</div>
    </div>
  );
}

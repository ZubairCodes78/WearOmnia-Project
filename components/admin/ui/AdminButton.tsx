import React from 'react';
import { Loader2 } from 'lucide-react';

export type AdminButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'warning';

export type AdminButtonSize = 'sm' | 'md' | 'lg' | 'icon-sm' | 'icon-md';

export interface AdminButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  tooltip?: string;
}

export const AdminButton = React.forwardRef<HTMLButtonElement, AdminButtonProps>(
  (
    {
      children,
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      tooltip,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    // ─────────────────────────────────────────────────────────────────────────────
    // Base Styles
    // ─────────────────────────────────────────────────────────────────────────────
    const baseClasses =
      'inline-flex items-center justify-center font-sans uppercase tracking-wider transition-all duration-150 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06191B] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] shrink-0';

    // ─────────────────────────────────────────────────────────────────────────────
    // Size Mapping (Consistent Spacing Scale)
    // ─────────────────────────────────────────────────────────────────────────────
    const sizeClasses: Record<AdminButtonSize, string> = {
      // 32px height - ideal for tables, dense toolbars
      sm: 'h-8 px-2.5 text-[11px] font-bold rounded-lg gap-1.5',
      // 40px height - standard for filters, forms, card actions
      md: 'h-10 px-4 text-xs font-bold rounded-xl gap-2',
      // 44px height - primary page CTAs, prominent modals
      lg: 'h-11 px-5 text-xs font-extrabold rounded-xl gap-2.5',
      // 32x32px square icon button
      'icon-sm': 'w-8 h-8 p-0 rounded-lg',
      // 40x40px square icon button
      'icon-md': 'w-10 h-10 p-0 rounded-xl',
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // Variant Mapping (WearOMNIA Atelier Aesthetic)
    // ─────────────────────────────────────────────────────────────────────────────
    const variantClasses: Record<AdminButtonVariant, string> = {
      primary:
        'bg-[#D4AF37] text-black font-extrabold hover:bg-[#FAF8F5] shadow-sm shadow-[#D4AF37]/20 border border-[#D4AF37]',
      secondary:
        'bg-[#103A3E] text-[#FAF8F5] font-bold hover:bg-[#15464B] hover:text-[#D4AF37] border border-[#D4AF37]/25 shadow-xs',
      outline:
        'bg-transparent text-[#FAF8F5]/90 font-semibold hover:bg-[#103A3E]/60 hover:text-[#D4AF37] border border-[#D4AF37]/30',
      ghost:
        'bg-transparent text-[#FAF8F5]/75 font-semibold hover:bg-[#103A3E]/50 hover:text-[#D4AF37] border border-transparent',
      danger:
        'bg-rose-950/70 text-rose-300 font-bold hover:bg-rose-900/90 hover:text-white border border-rose-800/50 shadow-xs',
      success:
        'bg-emerald-950/70 text-emerald-300 font-bold hover:bg-emerald-900/90 hover:text-white border border-emerald-700/50 shadow-xs',
      warning:
        'bg-amber-950/70 text-amber-300 font-bold hover:bg-amber-900/90 hover:text-white border border-amber-600/50 shadow-xs',
    };

    return (
      <button
        ref={ref}
        title={tooltip}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

AdminButton.displayName = 'AdminButton';

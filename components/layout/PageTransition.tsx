import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Renders page content immediately at opacity 1 on SSR/first paint
 * so above-the-fold hero images and headlines never wait on client hydration for LCP.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  return <div className={className}>{children}</div>;
};

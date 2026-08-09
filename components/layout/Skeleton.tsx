import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'heading' | 'image' | 'card' | 'button' | 'circle';
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
}) => {
  const variantClasses: Record<string, string> = {
    text: 'skeleton skeleton-text w-full',
    heading: 'skeleton skeleton-heading w-3/4',
    image: 'skeleton skeleton-image w-full aspect-[3/4]',
    card: 'skeleton rounded-2xl w-full',
    button: 'skeleton rounded-xl w-full h-12',
    circle: 'skeleton rounded-full',
  };

  return (
    <div
      className={`${variantClasses[variant]} ${className}`}
      style={{
        ...(width ? { width } : {}),
        ...(height ? { height } : {}),
      }}
    />
  );
};

export const ProductCardSkeleton: React.FC = () => (
  <div className="space-y-3">
    <Skeleton variant="image" className="rounded-2xl" />
    <div className="space-y-2 pt-1">
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="heading" width="80%" />
      <Skeleton variant="text" width="35%" />
    </div>
    <Skeleton variant="button" height="36px" />
  </div>
);

export const OrderDetailSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
    <div className="lg:col-span-7 space-y-6">
      <Skeleton variant="card" height="200px" />
      <Skeleton variant="card" height="150px" />
      <Skeleton variant="card" height="300px" />
    </div>
    <div className="lg:col-span-5 space-y-6">
      <Skeleton variant="card" height="180px" />
      <Skeleton variant="card" height="200px" />
      <Skeleton variant="card" height="120px" />
    </div>
  </div>
);

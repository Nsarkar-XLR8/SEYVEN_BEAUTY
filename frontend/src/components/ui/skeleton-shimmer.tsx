import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * SEYVEN Cashmere Stone Skeleton Shimmer
 * Ensures Cumulative Layout Shift (CLS = 0) with luxury silk/stone shimmer.
 */
export function SkeletonShimmer({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-[#E6DFD5]/40 rounded relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-[#F9F6F0]/30 before:to-transparent ${className}`}
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col space-y-3 p-2">
      {/* 4:5 luxury aspect ratio image placeholder */}
      <div className="w-full aspect-[4/5] rounded bg-[#E6DFD5]/50 animate-pulse relative overflow-hidden" />
      <SkeletonShimmer className="h-3 w-20" />
      <SkeletonShimmer className="h-4 w-3/4" />
      <SkeletonShimmer className="h-3 w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <SkeletonShimmer className="h-5 w-16" />
        <SkeletonShimmer className="h-7 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function PDPGallerySkeleton() {
  return (
    <div className="w-full space-y-4">
      <div className="w-full aspect-[4/5] rounded bg-[#E6DFD5]/40 animate-pulse" />
      <div className="grid grid-cols-4 gap-2">
        <div className="aspect-[4/5] rounded bg-[#E6DFD5]/30 animate-pulse" />
        <div className="aspect-[4/5] rounded bg-[#E6DFD5]/30 animate-pulse" />
        <div className="aspect-[4/5] rounded bg-[#E6DFD5]/30 animate-pulse" />
        <div className="aspect-[4/5] rounded bg-[#E6DFD5]/30 animate-pulse" />
      </div>
    </div>
  );
}

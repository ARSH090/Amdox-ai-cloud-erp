// apps/web/src/components/ui/skeleton.tsx
// Slow-pulsing skeleton loading components preventing CLS
"use client";

import React from "react";

/**
 * Enterprise Skeleton Loading Components.
 * Implements slow-pulsing placeholders that maintain exact layout
 * dimensions to prevent Cumulative Layout Shift (CLS) violations.
 *
 * Covers Checklist Items:
 * - 20.1: CLS Guard via dimensional skeleton placeholders
 * - 20.2: Loading state presentation without layout collapse
 */

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
}

export function Skeleton({ className = '', width, height, borderRadius = '8px' }: SkeletonProps) {
  return (
    <div
      className={`skeleton-pulse ${className}`}
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius,
        background: 'linear-gradient(90deg, rgba(11,15,25,0.6) 25%, rgba(79,70,229,0.08) 50%, rgba(11,15,25,0.6) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 2s ease-in-out infinite',
      }}
      aria-hidden="true"
      role="presentation"
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`} aria-hidden="true" role="presentation">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height="14px"
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`p-6 rounded-xl border border-white/[0.04] bg-[#0B0F19]/70 ${className}`}
      aria-hidden="true"
      role="presentation"
    >
      <div className="flex items-center gap-4 mb-4">
        <Skeleton width="48px" height="48px" borderRadius="12px" />
        <div className="flex-1 space-y-2">
          <Skeleton width="40%" height="16px" />
          <Skeleton width="25%" height="12px" />
        </div>
      </div>
      <SkeletonText lines={2} />
      <div className="mt-4 flex gap-3">
        <Skeleton width="80px" height="32px" borderRadius="6px" />
        <Skeleton width="60px" height="32px" borderRadius="6px" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={`rounded-xl border border-white/[0.04] overflow-hidden ${className}`} aria-hidden="true" role="presentation">
      {/* Header */}
      <div className="flex gap-4 p-4 bg-[#0B0F19]/90 border-b border-white/[0.04]">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`h-${i}`} width={i === 0 ? '20%' : '18%'} height="14px" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={`r-${rowIdx}`}
          className="flex gap-4 p-4 border-b border-white/[0.02]"
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton
              key={`c-${rowIdx}-${colIdx}`}
              width={colIdx === 0 ? '20%' : '18%'}
              height="14px"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ className = '' }: { className?: string }) {
  return (
    <div
      className={`p-6 rounded-xl border border-white/[0.04] bg-[#0B0F19]/70 ${className}`}
      aria-hidden="true"
      role="presentation"
    >
      <div className="flex justify-between items-center mb-6">
        <Skeleton width="30%" height="18px" />
        <div className="flex gap-2">
          <Skeleton width="60px" height="28px" borderRadius="6px" />
          <Skeleton width="60px" height="28px" borderRadius="6px" />
        </div>
      </div>
      <div className="flex items-end gap-2 h-40">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            width="100%"
            height={`${30 + Math.random() * 70}%`}
            borderRadius="4px 4px 0 0"
          />
        ))}
      </div>
    </div>
  );
}

// Inject skeleton animation keyframes via style tag
export function SkeletonStyles() {
  return (
    <style jsx global>{`
      @keyframes skeleton-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      .skeleton-pulse {
        animation: skeleton-shimmer 2s ease-in-out infinite;
      }
    `}</style>
  );
}

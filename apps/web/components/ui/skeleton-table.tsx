// apps/web/components/ui/skeleton-table.tsx
import React from 'react';

export function SkeletonTable() {
  return (
    <div className="w-full space-y-4 p-4 border border-[#1F2937] bg-[#0B0F19] rounded-md animate-pulse">
      {/* High-density header placeholder bar row */}
      <div className="h-6 bg-[#1F2937] rounded-md w-1/4 mb-6" />
      
      {/* Tabular line block rows */}
      {[1, 2, 3, 4].map((index) => (
        <div key={index} className="flex space-x-4 items-center justify-between border-b border-[#1F2937]/50 py-2">
          <div className="h-4 bg-[#1F2937] rounded w-1/5" />
          <div className="h-4 bg-[#1F2937] rounded w-1/3" />
          <div className="h-4 bg-[#1F2937] rounded w-1/12" />
          <div className="h-4 bg-[#1F2937] rounded w-1/6" />
        </div>
      ))}
    </div>
  );
}

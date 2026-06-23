// apps/web/components/ui/empty-state.tsx
import React from 'react';

export function EmptyState() {
  return (
    <div className="h-[200px] w-full border border-dashed border-[#1F2937] bg-[#0B0F19] rounded-md flex items-center justify-center text-center p-6">
      <div className="space-y-2">
        <p className="font-mono text-xs text-[#5D6D7E] tracking-tight">
          [ COLLECTION PARTITION EMPTY: Awaiting Live Datastore Aggregation ]
        </p>
        <p className="text-[11px] text-[#2C3E50]">
          System state synchronizer pipeline is operational. Core collection contains zero active data blocks.
        </p>
      </div>
    </div>
  );
}

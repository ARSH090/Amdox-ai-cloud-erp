// apps/web/src/components/ui/empty-state.tsx
// Zero-Collapse fallback UI for empty data partitions
"use client";

import React from "react";

/**
 * Enterprise Empty State Components.
 * Renders graceful, layout-preserving fallbacks when database queries
 * return empty result sets. Maintains visual density and prevents
 * layout collapse.
 *
 * Covers Checklist Items:
 * - 20.3: Zero-Collapse Rule enforcement
 * - 20.4: Empty partition graceful rendering
 */

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'compact' | 'table';
  className?: string;
}

export function EmptyState({
  title = 'No Data Available',
  description = 'This partition has no records to display. Create your first entry to begin.',
  icon = 'inbox',
  actionLabel,
  onAction,
  variant = 'default',
  className = '',
}: EmptyStateProps) {
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 p-4 rounded-lg border border-white/[0.04] bg-[#0B0F19]/40 ${className}`}>
        <span className="material-symbols-outlined text-white/20 text-xl">{icon}</span>
        <div>
          <p className="text-xs font-medium text-white/40">{title}</p>
          <p className="text-[10px] text-white/20 font-mono">{description}</p>
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`flex flex-col items-center justify-center py-16 px-8 ${className}`}>
        <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-white/15 text-3xl">{icon}</span>
        </div>
        <p className="text-sm font-medium text-white/30 mb-1">{title}</p>
        <p className="text-xs text-white/15 font-mono text-center max-w-xs">{description}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center py-20 px-8 rounded-xl border border-white/[0.04] bg-[#0B0F19]/30 ${className}`}>
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#4F46E5]/10 to-[#10B981]/5 border border-white/[0.04] flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-white/15 text-4xl">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-white/40 mb-2">{title}</h3>
      <p className="text-sm text-white/20 text-center max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-lg bg-[#4F46E5] text-white text-xs font-bold uppercase tracking-wider hover:translate-y-[-1px] hover:shadow-lg hover:shadow-[#4F46E5]/20 transition-all duration-300"
        >
          {actionLabel}
        </button>
      )}
      <span className="mt-4 text-[10px] font-mono text-white/10 tracking-wider">[SYS_STATE // EMPTY_PARTITION]</span>
    </div>
  );
}

/**
 * Error State Component.
 * Renders when API calls fail or network errors occur.
 */
export function ErrorState({
  title = 'Connection Error',
  description = 'Unable to retrieve data from the server. Please check your connection and try again.',
  onRetry,
  className = '',
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-8 rounded-xl border border-red-500/10 bg-red-500/[0.02] ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-red-500/40 text-3xl">error_outline</span>
      </div>
      <h3 className="text-base font-semibold text-red-400/60 mb-2">{title}</h3>
      <p className="text-xs text-red-400/30 text-center max-w-sm mb-4">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wider border border-red-500/20 hover:bg-red-500/20 transition-all duration-300"
        >
          Retry Connection
        </button>
      )}
      <span className="mt-3 text-[10px] font-mono text-red-500/15 tracking-wider">[SYS_ERR // FETCH_FAILED]</span>
    </div>
  );
}

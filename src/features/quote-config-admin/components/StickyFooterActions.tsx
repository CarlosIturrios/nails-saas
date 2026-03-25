"use client";

import type { ReactNode } from "react";

interface StickyFooterActionsProps {
  primaryAction: ReactNode;
  secondaryAction?: ReactNode;
  utilityAction?: ReactNode;
  helperText?: string;
}

export function StickyFooterActions({
  primaryAction,
  secondaryAction,
  utilityAction,
  helperText,
}: StickyFooterActionsProps) {
  return (
    <>
      <div className="h-52 lg:hidden" />

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 lg:pointer-events-auto lg:static lg:px-0 lg:pb-0 lg:pt-0">
        <div className="mx-auto max-w-5xl">
          <div className="pointer-events-auto admin-surface rounded-[24px] border border-[#eadfcb] bg-[rgba(255,253,250,0.96)] p-3 shadow-[0_-10px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:rounded-[28px] lg:p-4 lg:shadow-none">
            {helperText ? (
              <p className="admin-muted px-1 pb-3 text-xs leading-5 lg:text-sm">
                {helperText}
              </p>
            ) : null}

            {utilityAction ? (
              <div className="pb-3">{utilityAction}</div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              {secondaryAction ? (
                <div className="w-full sm:min-w-[160px] sm:w-auto">{secondaryAction}</div>
              ) : (
                <div />
              )}
              <div className="w-full sm:min-w-[220px] sm:w-auto">{primaryAction}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

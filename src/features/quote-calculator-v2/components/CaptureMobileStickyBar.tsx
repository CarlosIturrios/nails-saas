"use client";

import { ReceiptText } from "lucide-react";

import {
  formatMoney,
  type QuoteCalculatorTheme,
} from "@/src/features/quote-calculator-v2/components/QuoteCalculatorV2.shared";

interface CaptureMobileStickyBarProps {
  total: number;
  totalLabel: string;
  currency: string;
  language: string;
  actionLabel: string;
  itemCount?: number;
  theme: QuoteCalculatorTheme;
  onAction: () => void;
  onShowTicket?: () => void;
}

export function CaptureMobileStickyBar({
  total,
  totalLabel,
  currency,
  language,
  actionLabel,
  itemCount = 0,
  theme,
  onAction,
  onShowTicket,
}: CaptureMobileStickyBarProps) {
  if (total <= 0) {
    return null;
  }

  const isPosLayout = theme.layoutVariant !== "stacked";

  return (
    <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 px-4 md:hidden">
      <div
        className={`rounded-[24px] border backdrop-blur ${
          isPosLayout ? "p-3.5 shadow-[0_20px_48px_rgba(15,23,42,0.18)]" : "p-3 shadow-[0_16px_36px_rgba(15,23,42,0.14)]"
        }`}
        style={{
          borderColor: isPosLayout ? theme.ticketBorder : "#e8dece",
          background: isPosLayout ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.96)",
        }}
      >
        <div className={isPosLayout ? "space-y-3" : "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {totalLabel}
              </p>
              <p className="truncate font-poppins text-lg font-semibold text-slate-950">
                {formatMoney(total, currency, language)}
              </p>
            </div>

            {isPosLayout ? (
              <span
                className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold"
                style={{
                  borderColor: theme.badgeBorder,
                  background: theme.ticketAccentBackground,
                  color: theme.ticketAccentText,
                }}
              >
                <ReceiptText size={12} />
                {itemCount} concepto{itemCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>

          {isPosLayout ? (
            <div className="grid gap-2 sm:grid-cols-[minmax(0,auto)_1fr]">
              {onShowTicket ? (
                <button
                  type="button"
                  onClick={onShowTicket}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 text-sm font-semibold text-slate-700"
                  style={{
                    borderColor: theme.panelBorder,
                    background: theme.ticketMutedBackground,
                  }}
                >
                  Ver ticket
                </button>
              ) : null}
              <button
                type="button"
                onClick={onAction}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl px-4 text-sm font-semibold text-white"
                style={{ background: theme.primaryButton }}
              >
                {actionLabel}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white sm:w-auto"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

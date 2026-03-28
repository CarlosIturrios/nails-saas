"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

import type {
  CaptureExtraRow,
  CaptureSelectedRow,
  ManualAdjustment,
  QuoteCalculatorTheme,
} from "@/src/features/quote-calculator-v2/components/QuoteCalculatorV2.shared";
import { formatMoney } from "@/src/features/quote-calculator-v2/components/QuoteCalculatorV2.shared";
import { getExtraChargeSummary } from "@/src/features/quote-calculator-v2/lib/extra-display";

interface CaptureSummaryPanelProps {
  title: string;
  emptyMessage: string;
  totalLabel: string;
  total: number;
  selectedRows: CaptureSelectedRow[];
  extraRows: CaptureExtraRow[];
  manualAdjustments: ManualAdjustment[];
  currency: string;
  language: string;
  theme: QuoteCalculatorTheme;
  onRemoveSelectedRow?: (row: CaptureSelectedRow) => void;
  onAdjustExtra?: (extraId: string, delta: number) => void;
  onRemoveManualAdjustment?: (id: string) => void;
}

export function CaptureSummaryPanel({
  title,
  emptyMessage,
  totalLabel,
  total,
  selectedRows,
  extraRows,
  manualAdjustments,
  currency,
  language,
  theme,
  onRemoveSelectedRow,
  onAdjustExtra,
  onRemoveManualAdjustment,
}: CaptureSummaryPanelProps) {
  const lineItemCount = selectedRows.length + extraRows.length + manualAdjustments.length;
  const isPosLayout = theme.layoutVariant !== "stacked";
  const isTouch = theme.layoutVariant === "pos_touch";
  const ticketStatus = total > 0 ? "Listo para cerrar" : "Sin conceptos";

  if (!isPosLayout) {
    return (
      <div
        className="admin-surface rounded-3xl p-6 sm:p-8"
        style={{
          background: theme.summaryBackground,
          borderColor: theme.summaryBorder,
        }}
      >
        <p className="ops-kicker" style={{ color: theme.badgeText }}>
          Resumen
        </p>
        <h2 className="mt-3 text-lg font-semibold text-slate-950">{title}</h2>

        {total === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[#e8ddcc] bg-white/70 p-4">
            <p className="admin-muted text-sm leading-6">{emptyMessage}</p>
          </div>
        ) : (
          <>
            <div className="mt-5 rounded-2xl border border-[#efe6d8] bg-white/70 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span
                  className="font-poppins text-xl font-semibold text-slate-950"
                  style={{ color: theme.accentText }}
                >
                  {totalLabel}
                </span>
                <span
                  className="font-poppins text-2xl font-semibold text-slate-950 sm:text-3xl"
                  style={{ color: theme.accentText }}
                >
                  {formatMoney(total, currency, language)}
                </span>
              </div>
              <p className="admin-muted mt-2 text-xs leading-5 md:hidden">
                {lineItemCount} concepto{lineItemCount === 1 ? "" : "s"} listo
                {lineItemCount === 1 ? "" : "s"} para guardar.
              </p>
            </div>

            <details className="mt-5 rounded-2xl border border-[#efe6d8] bg-white/70 p-4 md:hidden">
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
                Ver desglose
              </summary>
              <div className="mt-4 space-y-3 text-sm">
                {selectedRows.map((row) => (
                  <div key={row.id} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <span className="text-slate-700">{row.label}</span>
                    <span className="font-semibold text-slate-900">
                      {formatMoney(row.amount, currency, language)}
                    </span>
                  </div>
                ))}

                {extraRows.map((row) => (
                  <div key={row.id} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div className="min-w-0">
                      <span className="block text-slate-700">{row.label}</span>
                      {row.pricingType === "PER_UNIT" ? (
                        <span className="admin-muted mt-1 block text-xs leading-5">
                          {getExtraChargeSummary({
                            pricingType: row.pricingType,
                            quantity: row.quantity,
                            billableQuantity: row.billableQuantity,
                            includedQuantity: row.includedQuantity,
                            captureMode: row.captureMode,
                            unitLabel: row.unitLabel,
                          })}
                        </span>
                      ) : null}
                    </div>
                    <span className="shrink-0 font-semibold text-slate-900">
                      {formatMoney(row.amount, currency, language)}
                    </span>
                  </div>
                ))}

                {manualAdjustments.map((row) => (
                  <div key={row.id} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div className="min-w-0">
                      <span className="block text-slate-700">{row.label}</span>
                      <span className="admin-muted mt-1 block text-xs leading-5">Ajuste manual</span>
                    </div>
                    <span className="shrink-0 font-semibold text-slate-900">
                      {formatMoney(row.amount, currency, language)}
                    </span>
                  </div>
                ))}
              </div>
            </details>

            <div className="mt-6 hidden space-y-3 text-sm md:block">
              {selectedRows.map((row) => (
                <div key={row.id} className="flex items-start justify-between gap-3">
                  <span className="text-slate-700">{row.label}</span>
                  <span className="font-semibold text-slate-900">
                    {formatMoney(row.amount, currency, language)}
                  </span>
                </div>
              ))}

              {extraRows.map((row) => (
                <div key={row.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block text-slate-700">{row.label}</span>
                    {row.pricingType === "PER_UNIT" ? (
                      <span className="admin-muted mt-1 block text-xs leading-5">
                        {getExtraChargeSummary({
                          pricingType: row.pricingType,
                          quantity: row.quantity,
                          billableQuantity: row.billableQuantity,
                          includedQuantity: row.includedQuantity,
                          captureMode: row.captureMode,
                          unitLabel: row.unitLabel,
                        })}
                      </span>
                    ) : null}
                  </div>
                  <span className="shrink-0 font-semibold text-slate-900">
                    {formatMoney(row.amount, currency, language)}
                  </span>
                </div>
              ))}

              {manualAdjustments.map((row) => (
                <div key={row.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block text-slate-700">{row.label}</span>
                    <span className="admin-muted mt-1 block text-xs leading-5">Ajuste manual</span>
                  </div>
                  <span className="shrink-0 font-semibold text-slate-900">
                    {formatMoney(row.amount, currency, language)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className={`admin-surface rounded-[28px] ${isTouch ? "p-5 sm:p-6" : "p-4 sm:p-5"}`}
      style={{
        background: theme.ticketBackground,
        borderColor: theme.ticketBorder,
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: theme.badgeText }}>
            Ticket
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">{title}</h2>
        </div>
        <span
          className="inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold"
          style={{
            borderColor: theme.badgeBorder,
            background: theme.ticketAccentBackground,
            color: theme.ticketAccentText,
          }}
        >
          {lineItemCount > 0 ? `${lineItemCount} concepto${lineItemCount === 1 ? "" : "s"}` : "Sin ticket"}
        </span>
      </div>

      <div
        className="mt-4 rounded-[24px] border p-4"
        style={{
          borderColor: theme.ticketBorder,
          background: theme.ticketMutedBackground,
        }}
      >
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {totalLabel}
            </p>
            <p className="mt-1 text-3xl font-semibold text-slate-950">
              {formatMoney(total, currency, language)}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Estado
            </p>
            <p className="mt-1 text-sm font-semibold" style={{ color: theme.ticketAccentText }}>
              {ticketStatus}
            </p>
          </div>
        </div>
      </div>

      {total === 0 ? (
        <div className="mt-4 rounded-[24px] border border-dashed border-[#d9dce2] bg-white/80 p-4 sm:p-5">
          <p className="text-sm leading-6 text-slate-600">{emptyMessage}</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {selectedRows.map((row) => (
            <div
              key={row.id}
              className="rounded-[24px] border bg-white p-4"
              style={{ borderColor: theme.ticketBorder }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950">{row.label}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Servicio
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm font-semibold text-slate-950">
                    {formatMoney(row.amount, currency, language)}
                  </p>
                  {onRemoveSelectedRow ? (
                    <button
                      type="button"
                      onClick={() => onRemoveSelectedRow(row)}
                      className="mt-3 inline-flex items-center rounded-2xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600"
                    >
                      <Trash2 size={14} className="mr-1.5" />
                      Quitar
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}

          {extraRows.map((row) => (
            <div
              key={row.id}
              className="rounded-[24px] border bg-white p-4"
              style={{ borderColor: theme.ticketBorder }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950">{row.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {row.pricingType === "PER_UNIT"
                      ? getExtraChargeSummary({
                          pricingType: row.pricingType,
                          quantity: row.quantity,
                          billableQuantity: row.billableQuantity,
                          includedQuantity: row.includedQuantity,
                          captureMode: row.captureMode,
                          unitLabel: row.unitLabel,
                        })
                      : "Cargo fijo"}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm font-semibold text-slate-950">
                    {formatMoney(row.amount, currency, language)}
                  </p>
                </div>
              </div>

              {onAdjustExtra ? (
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Cantidad
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">{row.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onAdjustExtra(row.id, -1)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border text-slate-700"
                      style={{ borderColor: theme.badgeBorder, background: theme.ticketMutedBackground }}
                    >
                      <Minus size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onAdjustExtra(row.id, 1)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border"
                      style={{
                        borderColor: theme.optionActiveBorder,
                        background: theme.optionActiveBackground,
                        color: theme.ticketAccentText,
                      }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}

          {manualAdjustments.map((row) => (
            <div
              key={row.id}
              className="rounded-[24px] border bg-white p-4"
              style={{ borderColor: theme.ticketBorder }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950">{row.label}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Ajuste manual
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm font-semibold text-slate-950">
                    {formatMoney(row.amount, currency, language)}
                  </p>
                  {onRemoveManualAdjustment ? (
                    <button
                      type="button"
                      onClick={() => onRemoveManualAdjustment(row.id)}
                      className="mt-3 inline-flex items-center rounded-2xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600"
                    >
                      <Trash2 size={14} className="mr-1.5" />
                      Quitar
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

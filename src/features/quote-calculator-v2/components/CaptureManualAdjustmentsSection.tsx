"use client";

import type {
  ManualAdjustment,
  QuoteCalculatorTheme,
} from "@/src/features/quote-calculator-v2/components/QuoteCalculatorV2.shared";
import { formatMoney } from "@/src/features/quote-calculator-v2/components/QuoteCalculatorV2.shared";

interface CaptureManualAdjustmentsSectionProps {
  manualLabel: string;
  manualAmount: string;
  manualAdjustments: ManualAdjustment[];
  theme: QuoteCalculatorTheme;
  currency: string;
  language: string;
  onManualLabelChange: (value: string) => void;
  onManualAmountChange: (value: string) => void;
  onAddManualAdjustment: () => void;
  onRemoveManualAdjustment: (id: string) => void;
}

export function CaptureManualAdjustmentsSection({
  manualLabel,
  manualAmount,
  manualAdjustments,
  theme,
  currency,
  language,
  onManualLabelChange,
  onManualAmountChange,
  onAddManualAdjustment,
  onRemoveManualAdjustment,
}: CaptureManualAdjustmentsSectionProps) {
  const isPosLayout = theme.layoutVariant !== "stacked";
  const isTouch = theme.layoutVariant === "pos_touch";

  if (!isPosLayout) {
    return (
      <div
        className="admin-surface rounded-3xl p-6 sm:p-8"
        style={{
          background: theme.surfaceBackground,
          borderColor: theme.surfaceBorder,
        }}
      >
        <div className="flex flex-col gap-3">
          <p className="admin-label text-sm font-medium">Ajustes manuales</p>
          <p className="admin-muted text-sm leading-6">
            Agrega conceptos temporales para esta captura si el servicio o producto aún no existe
            en el sistema.
          </p>
        </div>

        <div className="mt-7 rounded-3xl border border-[#efe6d8] bg-white/70 p-4 sm:p-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
            <label className="space-y-2">
              <span className="admin-label block text-sm font-medium">Nombre del ajuste</span>
              <input
                value={manualLabel}
                onChange={(event) => onManualLabelChange(event.target.value)}
                placeholder="Ejemplo: Producto especial o servicio adicional"
                className="admin-input px-4 py-3 text-sm"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,140px)_auto] xl:grid-cols-[minmax(0,120px)_auto]">
              <label className="space-y-2">
                <span className="admin-label block text-sm font-medium">Monto</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={manualAmount}
                  onChange={(event) => onManualAmountChange(event.target.value)}
                  placeholder="Precio"
                  className="admin-input px-4 py-3 text-sm"
                />
              </label>
              <button
                type="button"
                onClick={onAddManualAdjustment}
                className="admin-primary w-full self-end px-5 py-3 text-sm font-semibold"
              >
                Agregar ajuste
              </button>
            </div>
          </div>
        </div>

        {manualAdjustments.length > 0 ? (
          <div className="mt-6 space-y-3">
            {manualAdjustments.map((item) => (
              <div
                key={item.id}
                className="admin-panel flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
                style={{
                  background: theme.panelBackground,
                  borderColor: theme.panelBorder,
                }}
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950">{item.label}</p>
                  <p className="admin-muted mt-1 text-sm leading-6">
                    Ajuste manual visible solo en esta captura.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                  <span className="text-base font-semibold text-slate-900 sm:text-sm">
                    {formatMoney(item.amount, currency, language)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveManualAdjustment(item.id)}
                    className="w-full rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 sm:w-auto"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`admin-surface rounded-[28px] ${isTouch ? "p-5 sm:p-6" : "p-4 sm:p-5"}`}
      style={{
        background: theme.surfaceBackground,
        borderColor: theme.surfaceBorder,
      }}
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-slate-950">Otro concepto rápido</p>
        <p className="text-sm leading-6 text-slate-600">
          Úsalo cuando necesites cobrar algo que todavía no está en el catálogo.
        </p>
      </div>

      <div
        className="mt-4 rounded-[24px] border p-3.5 sm:p-4"
        style={{
          borderColor: theme.panelBorder,
          background: theme.panelBackground,
        }}
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_150px_auto]">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Concepto
            </span>
            <input
              value={manualLabel}
              onChange={(event) => onManualLabelChange(event.target.value)}
              placeholder="Ej. producto especial"
              className="admin-input px-4 py-3 text-sm"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Monto
            </span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={manualAmount}
              onChange={(event) => onManualAmountChange(event.target.value)}
              placeholder="0"
              className="admin-input px-4 py-3 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={onAddManualAdjustment}
            className="admin-primary w-full self-end px-5 py-3 text-sm font-semibold"
            style={{ background: theme.primaryButton }}
          >
            Agregar
          </button>
        </div>
      </div>

      {manualAdjustments.length > 0 ? (
        <div className="mt-4 space-y-3">
          {manualAdjustments.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-[22px] border p-4 sm:flex-row sm:items-center sm:justify-between"
              style={{
                borderColor: theme.panelBorder,
                background: theme.ticketMutedBackground,
              }}
            >
              <div className="min-w-0">
                <p className="font-semibold text-slate-950">{item.label}</p>
                <p className="mt-1 text-sm text-slate-600">Ajuste manual en esta venta</p>
              </div>
              <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
                <span className="text-sm font-semibold text-slate-950">
                  {formatMoney(item.amount, currency, language)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveManualAdjustment(item.id)}
                  className="rounded-2xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600"
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

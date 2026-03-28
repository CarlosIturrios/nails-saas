"use client";

import { CalendarClock, CheckCircle2, ClipboardList, FileText } from "lucide-react";
import { ServiceOrderFlowType, ServiceOrderStatus } from "@prisma/client";

import type {
  CaptureSaveIntentOption,
  SaveIntent,
  QuoteCalculatorTheme,
} from "@/src/features/quote-calculator-v2/components/QuoteCalculatorV2.shared";
import type { CaptureIntentMode } from "@/src/features/quote-calculator-v2/lib/capture-flow";

interface CaptureSaveStepProps {
  intentMode: CaptureIntentMode;
  intentLocked?: boolean;
  demoMode?: boolean;
  quoteActionLabel: string;
  availableSaveIntents: CaptureSaveIntentOption[];
  primarySaveIntent: CaptureSaveIntentOption | null;
  saveIntent: SaveIntent;
  total: number;
  savingQuote: boolean;
  savingOrder: boolean;
  downloading: boolean;
  flowType: ServiceOrderFlowType;
  canScheduleOrders: boolean;
  downloadLabel: string;
  theme: QuoteCalculatorTheme;
  onSaveIntentChange: (intent: SaveIntent) => void;
  onSaveQuote: () => void;
  onSaveOrder: (status: "CONFIRMED" | "PAID") => void;
  onDownloadSummary: () => void;
  onReset: () => void;
  resetLabel: string;
}

export function CaptureSaveStep({
  intentMode,
  intentLocked = false,
  demoMode = false,
  quoteActionLabel,
  availableSaveIntents,
  primarySaveIntent,
  saveIntent,
  total,
  savingQuote,
  savingOrder,
  downloading,
  flowType,
  canScheduleOrders,
  downloadLabel,
  theme,
  onSaveIntentChange,
  onSaveQuote,
  onSaveOrder,
  onDownloadSummary,
  onReset,
  resetLabel,
}: CaptureSaveStepProps) {
  const primaryTitle =
    intentMode === "appointment"
      ? "Agendar"
      : intentMode === "quote"
        ? "Cotización"
        : "Cobro";
  const isPosLayout = theme.layoutVariant !== "stacked";
  const isTouch = theme.layoutVariant === "pos_touch";

  if (demoMode) {
    return (
      <div
        className={
          isPosLayout
            ? `admin-surface rounded-[30px] ${isTouch ? "p-5 sm:p-6" : "p-4 sm:p-5"}`
            : "admin-surface rounded-3xl p-6 sm:p-8"
        }
        style={
          isPosLayout
            ? {
                background: theme.surfaceBackground,
                borderColor: theme.surfaceBorder,
              }
            : undefined
        }
      >
        <p
          className={isPosLayout ? "text-xs font-semibold uppercase tracking-[0.16em]" : "ops-kicker"}
          style={isPosLayout ? { color: theme.badgeText } : undefined}
        >
          Demo
        </p>
        <h2 className="mt-3 text-lg font-semibold text-slate-950 sm:text-xl">
          Explora sin guardar
        </h2>
        <p className="admin-muted mt-2 text-sm leading-6">
          Esta demo no guarda propuestas ni órdenes reales. Usa este cierre para descargar el
          resumen o reiniciar la captura.
        </p>

        <div className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={onDownloadSummary}
            disabled={total === 0 || downloading}
            className="admin-secondary w-full px-5 py-3 text-sm font-semibold disabled:opacity-50"
          >
            {downloading ? "Generando imagen..." : downloadLabel}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="admin-secondary w-full px-5 py-3 text-sm font-semibold"
          >
            {resetLabel}
          </button>
        </div>
      </div>
    );
  }

  if (!isPosLayout) {
    return (
      <div className="admin-surface rounded-3xl p-6 sm:p-8">
        <p className="ops-kicker">Cierre</p>
        <h2 className="mt-3 text-lg font-semibold text-slate-950 sm:text-xl">
          {intentLocked ? `Confirma el ${primaryTitle.toLowerCase()}` : "Elige cómo quedará"}
        </h2>
        <p className="admin-muted mt-2 text-sm leading-6">
          {intentLocked
            ? "Dejamos una sola salida principal para que no tengas que decidir dos veces."
            : "Usa una sola salida según lo que pasó con el cliente y lo que tu perfil puede registrar."}
        </p>

        {!intentLocked ? (
          <div className="mt-5 grid gap-3">
            {availableSaveIntents.map((intent) => (
              <button
                key={intent.id}
                type="button"
                onClick={() => onSaveIntentChange(intent.id)}
                className={`rounded-2xl border p-3.5 text-left transition sm:p-4 ${
                  saveIntent === intent.id
                    ? "border-[var(--ops-primary)] bg-[rgba(21,94,117,0.08)]"
                    : "border-[var(--ops-border)] bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-[var(--ops-primary)] shadow-sm sm:h-10 sm:w-10">
                    {intent.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-950">{intent.title}</p>
                    <p className="admin-muted mt-1 text-xs leading-5 sm:text-sm sm:leading-6">
                      {intent.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 border-t border-[#efe6d8] pt-5">
          {primarySaveIntent?.id === "quote" ? (
            <button
              type="button"
              onClick={onSaveQuote}
              disabled={total === 0 || savingQuote || savingOrder}
              className="admin-secondary w-full px-5 py-3 text-left text-sm font-semibold disabled:opacity-50"
            >
              <span className="flex items-center gap-3">
                <FileText size={18} />
                <span className="flex-1">
                  <span className="block text-slate-950">
                    {savingQuote ? "Guardando..." : quoteActionLabel}
                  </span>
                  <span className="admin-muted mt-1 block text-xs font-medium">
                    Úsalo si el cliente todavía no confirma o si se hará después.
                  </span>
                </span>
              </span>
            </button>
          ) : null}
          {primarySaveIntent?.id === "order" ? (
            <button
              type="button"
              onClick={() => onSaveOrder(ServiceOrderStatus.CONFIRMED)}
              disabled={total === 0 || savingOrder || savingQuote}
              className="admin-primary w-full px-5 py-3 text-left text-sm font-semibold disabled:opacity-50"
              style={{ background: theme.primaryButton }}
            >
              <span className="flex items-center gap-3">
                {flowType === ServiceOrderFlowType.SCHEDULED ? (
                  <CalendarClock size={18} />
                ) : (
                  <ClipboardList size={18} />
                )}
                <span className="flex-1">
                  <span className="block">
                    {savingOrder
                      ? "Guardando..."
                      : flowType === ServiceOrderFlowType.SCHEDULED && canScheduleOrders
                        ? "Guardar y agendar"
                        : "Guardar trabajo"}
                  </span>
                  <span className="mt-1 block text-xs font-medium text-white/80">
                    Déjalo listo para moverlo en pendientes o agenda.
                  </span>
                </span>
              </span>
            </button>
          ) : null}
          {primarySaveIntent?.id === "paid" ? (
            <button
              type="button"
              onClick={() => onSaveOrder(ServiceOrderStatus.PAID)}
              disabled={total === 0 || savingOrder || savingQuote}
              className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-left text-sm font-semibold text-emerald-800 shadow-sm disabled:opacity-50"
            >
              <span className="flex items-center gap-3">
                <CheckCircle2 size={18} />
                <span className="flex-1">
                  <span className="block">{savingOrder ? "Guardando..." : "Guardar y cobrar"}</span>
                  <span className="mt-1 block text-xs font-medium text-emerald-700/80">
                    Úsalo cuando la venta o atención ya quedó cobrada.
                  </span>
                </span>
              </span>
            </button>
          ) : null}
          <details className="rounded-2xl border border-[#efe6d8] bg-white/70">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-700">
              Más opciones
            </summary>
            <div className="grid gap-3 border-t border-[#efe6d8] p-4">
              <button
                type="button"
                onClick={onDownloadSummary}
                disabled={total === 0 || downloading}
                className="admin-secondary w-full px-5 py-3 text-sm font-semibold disabled:opacity-50"
              >
                {downloading ? "Generando imagen..." : downloadLabel}
              </button>
              <button
                type="button"
                onClick={onReset}
                className="admin-secondary w-full px-5 py-3 text-sm font-semibold"
              >
                {resetLabel}
              </button>
            </div>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`admin-surface rounded-[30px] ${isTouch ? "p-5 sm:p-6" : "p-4 sm:p-5"}`}
      style={{
        background: theme.surfaceBackground,
        borderColor: theme.surfaceBorder,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: theme.badgeText }}>
            Cierre
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">
            {intentLocked ? `Cerrar ${primaryTitle.toLowerCase()}` : "Cómo lo quieres cerrar"}
          </h2>
        </div>
      </div>

      {!intentLocked ? (
        <div className="mt-4 grid gap-2">
          {availableSaveIntents.map((intent) => (
            <button
              key={intent.id}
              type="button"
              onClick={() => onSaveIntentChange(intent.id)}
              className={`rounded-[22px] border text-left transition ${isTouch ? "p-4" : "p-3"}`}
              style={{
                borderColor:
                  saveIntent === intent.id ? theme.optionActiveBorder : theme.optionInactiveBorder,
                background:
                  saveIntent === intent.id
                    ? theme.optionActiveBackground
                    : theme.optionInactiveBackground,
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl"
                  style={{ background: theme.ticketMutedBackground, color: theme.ticketAccentText }}
                >
                  {intent.icon}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950">{intent.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{intent.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {primarySaveIntent?.id === "quote" ? (
          <button
            type="button"
            onClick={onSaveQuote}
            disabled={total === 0 || savingQuote || savingOrder}
            className={`w-full rounded-[24px] border px-5 text-left text-sm font-semibold disabled:opacity-50 ${isTouch ? "py-5" : "py-4"}`}
            style={{
              borderColor: theme.optionActiveBorder,
              background: theme.optionActiveBackground,
              color: theme.accentText,
            }}
          >
            <span className="flex items-start gap-3">
              <FileText size={18} className="mt-0.5" />
              <span className="flex-1">
                <span className="block">{savingQuote ? "Guardando..." : quoteActionLabel}</span>
                <span className="mt-1 block text-xs font-medium text-slate-600">
                  Déjala lista para convertirla después.
                </span>
              </span>
            </span>
          </button>
        ) : null}

        {primarySaveIntent?.id === "order" ? (
          <button
            type="button"
            onClick={() => onSaveOrder(ServiceOrderStatus.CONFIRMED)}
            disabled={total === 0 || savingOrder || savingQuote}
            className={`w-full rounded-[24px] px-5 text-left text-sm font-semibold text-white disabled:opacity-50 ${isTouch ? "py-5" : "py-4"}`}
            style={{ background: theme.primaryButton }}
          >
            <span className="flex items-start gap-3">
              {flowType === ServiceOrderFlowType.SCHEDULED ? (
                <CalendarClock size={18} className="mt-0.5" />
              ) : (
                <ClipboardList size={18} className="mt-0.5" />
              )}
              <span className="flex-1">
                <span className="block">
                  {savingOrder
                    ? "Guardando..."
                    : flowType === ServiceOrderFlowType.SCHEDULED && canScheduleOrders
                      ? "Guardar y agendar"
                      : "Guardar trabajo"}
                </span>
                <span className="mt-1 block text-xs font-medium text-white/75">
                  Queda listo para seguirlo hoy o en agenda.
                </span>
              </span>
            </span>
          </button>
        ) : null}

        {primarySaveIntent?.id === "paid" ? (
          <button
            type="button"
            onClick={() => onSaveOrder(ServiceOrderStatus.PAID)}
            disabled={total === 0 || savingOrder || savingQuote}
            className={`w-full rounded-[24px] border px-5 text-left text-sm font-semibold text-emerald-900 disabled:opacity-50 ${isTouch ? "py-5" : "py-4"}`}
            style={{
              borderColor: "#b7e3cf",
              background: "#ecfdf5",
            }}
          >
            <span className="flex items-start gap-3">
              <CheckCircle2 size={18} className="mt-0.5" />
              <span className="flex-1">
                <span className="block">{savingOrder ? "Guardando..." : "Cobrar ahora"}</span>
                <span className="mt-1 block text-xs font-medium text-emerald-700">
                  Cierra la venta en este momento.
                </span>
              </span>
            </span>
          </button>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onDownloadSummary}
            disabled={total === 0 || downloading}
            className="rounded-[22px] border px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
            style={{
              borderColor: theme.panelBorder,
              background: theme.ticketMutedBackground,
            }}
          >
            {downloading ? "Generando..." : downloadLabel}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-[22px] border px-4 py-3 text-sm font-semibold text-slate-700"
            style={{
              borderColor: theme.panelBorder,
              background: "#ffffff",
            }}
          >
            {resetLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

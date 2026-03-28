"use client";

import type { OrganizationQuoteConfigView } from "@/src/features/quote-calculator-v2/lib/types";
import {
  formatMoney,
  type QuoteCalculatorTheme,
} from "@/src/features/quote-calculator-v2/components/QuoteCalculatorV2.shared";
import {
  getBillableExtraQuantity,
  getExtraCaptureMode,
  getExtraCaptureModeLabel,
  getExtraChargeSummary,
  getExtraLiveAmount,
  getExtraPricingCopy,
  getExtraUnitLabel,
  groupExtrasForDisplay,
} from "@/src/features/quote-calculator-v2/lib/extra-display";

interface CaptureExtrasSectionProps {
  extras: OrganizationQuoteConfigView["extras"];
  extraQuantities: Record<string, number>;
  theme: QuoteCalculatorTheme;
  currency: string;
  language: string;
  title: string;
  helperText: string;
  onAdjustExtra: (extraId: string, delta: number) => void;
}

export function CaptureExtrasSection({
  extras,
  extraQuantities,
  theme,
  currency,
  language,
  title,
  helperText,
  onAdjustExtra,
}: CaptureExtrasSectionProps) {
  const groupedExtras = groupExtrasForDisplay(extras);
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
          <p className="admin-label text-sm font-medium">{title}</p>
          <p className="admin-muted text-sm leading-6">{helperText}</p>
        </div>

        <div className="mt-7 space-y-7">
          {groupedExtras.map((group) => (
            <div key={group.key} className="space-y-4">
              {groupedExtras.length > 1 || group.key !== "standard:general" ? (
                <div className="flex flex-col gap-2">
                  <p className="admin-label text-xs font-semibold uppercase tracking-[0.14em]">
                    {group.label}
                  </p>
                  <p className="admin-muted text-sm leading-6">{group.helper}</p>
                </div>
              ) : null}

              <div className="space-y-3">
                {group.extras.map((extra) => {
                  const quantity = extraQuantities[extra.id] ?? 0;
                  const captureMode = getExtraCaptureMode(extra);
                  const unitLabel = getExtraUnitLabel(extra);
                  const billableQuantity = getBillableExtraQuantity(
                    extra.pricingType,
                    quantity,
                    extra.includedQuantity
                  );
                  const liveAmount = getExtraLiveAmount(
                    extra.pricingType,
                    quantity,
                    extra.includedQuantity,
                    extra.price
                  );
                  const chargeSummary = getExtraChargeSummary({
                    pricingType: extra.pricingType,
                    quantity,
                    billableQuantity,
                    includedQuantity: extra.includedQuantity,
                    captureMode,
                    unitLabel,
                  });

                  return (
                    <div
                      key={extra.id}
                      className="admin-panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
                      style={{
                        background: theme.panelBackground,
                        borderColor: theme.panelBorder,
                      }}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-950">{extra.name}</p>
                          {captureMode === "individual" ? (
                            <span className="inline-flex items-center rounded-full border border-[#ddd1bf] bg-[#fffaf2] px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                              {getExtraCaptureModeLabel(captureMode)}
                            </span>
                          ) : null}
                        </div>
                        {extra.description ? (
                          <p className="admin-muted mt-1 text-sm leading-6">{extra.description}</p>
                        ) : null}
                        <p className="admin-muted mt-1 text-xs leading-5">
                          {getExtraPricingCopy({
                            pricingType: extra.pricingType,
                            priceLabel: formatMoney(extra.price, currency, language),
                            captureMode,
                            unitLabel,
                          })}
                        </p>
                        {extra.includedQuantity > 0 ? (
                          <p className="admin-muted mt-1 text-xs leading-5">
                            Incluye sin costo {extra.includedQuantity} {unitLabel}
                            {extra.includedQuantity === 1 ? "" : "s"}.
                          </p>
                        ) : null}
                        {quantity > 0 ? (
                          <p className="admin-muted mt-2 text-xs leading-5">
                            {extra.pricingType === "FIXED"
                              ? `Cargo actual: ${formatMoney(liveAmount, currency, language)}`
                              : chargeSummary}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
                        {quantity > 0 ? (
                          <p className="text-base font-semibold text-slate-900 sm:text-sm">
                            {formatMoney(liveAmount, currency, language)}
                          </p>
                        ) : null}
                        <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
                          <button
                            type="button"
                            onClick={() => onAdjustExtra(extra.id, -1)}
                            className="admin-secondary inline-flex h-11 w-11 items-center justify-center text-lg font-semibold"
                            style={{
                              borderColor: theme.badgeBorder,
                              background: theme.badgeBackground,
                            }}
                          >
                            -
                          </button>
                          <span className="min-w-8 text-center text-sm font-semibold text-slate-900">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onAdjustExtra(extra.id, 1)}
                            className="admin-secondary inline-flex h-11 w-11 items-center justify-center text-lg font-semibold"
                            style={{
                              borderColor: theme.badgeBorder,
                              background: theme.badgeBackground,
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{helperText}</p>
        </div>
      </div>

      <div className="mt-5 space-y-4 sm:space-y-5">
        {groupedExtras.map((group) => (
          <div key={group.key} className="space-y-3">
            {groupedExtras.length > 1 || group.key !== "standard:general" ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: theme.badgeText }}>
                  {group.label}
                </p>
                <p className="mt-1 text-sm text-slate-600">{group.helper}</p>
              </div>
            ) : null}

            <div
              className={
                isTouch
                  ? "grid gap-4 md:grid-cols-2"
                  : "grid gap-3 min-[480px]:grid-cols-2 xl:grid-cols-3"
              }
            >
              {group.extras.map((extra) => {
                const quantity = extraQuantities[extra.id] ?? 0;
                const captureMode = getExtraCaptureMode(extra);
                const unitLabel = getExtraUnitLabel(extra);
                const billableQuantity = getBillableExtraQuantity(
                  extra.pricingType,
                  quantity,
                  extra.includedQuantity
                );
                const liveAmount = getExtraLiveAmount(
                  extra.pricingType,
                  quantity,
                  extra.includedQuantity,
                  extra.price
                );
                const chargeSummary = getExtraChargeSummary({
                  pricingType: extra.pricingType,
                  quantity,
                  billableQuantity,
                  includedQuantity: extra.includedQuantity,
                  captureMode,
                  unitLabel,
                });

                return (
                  <div
                    key={extra.id}
                    className={`rounded-[24px] border ${isTouch ? "p-5" : "p-4"}`}
                    style={{
                      borderColor: quantity > 0 ? theme.optionActiveBorder : theme.panelBorder,
                      background: quantity > 0 ? theme.optionActiveBackground : theme.panelBackground,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-950">{extra.name}</p>
                          {captureMode === "individual" ? (
                            <span
                              className="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                              style={{
                                borderColor: theme.badgeBorder,
                                background: theme.badgeBackground,
                                color: theme.badgeText,
                              }}
                            >
                              {getExtraCaptureModeLabel(captureMode)}
                            </span>
                          ) : null}
                        </div>
                        {extra.description ? (
                          <p className="mt-2 text-sm leading-6 text-slate-600">{extra.description}</p>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-slate-950">
                        {formatMoney(extra.price, currency, language)}
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {getExtraPricingCopy({
                        pricingType: extra.pricingType,
                        priceLabel: formatMoney(extra.price, currency, language),
                        captureMode,
                        unitLabel,
                      })}
                    </p>

                    {quantity > 0 ? (
                      <p className="mt-2 text-xs leading-5" style={{ color: theme.ticketAccentText }}>
                        {extra.pricingType === "FIXED"
                          ? `Cargo actual: ${formatMoney(liveAmount, currency, language)}`
                          : chargeSummary}
                      </p>
                    ) : null}

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Cantidad
                        </p>
                        <p className="mt-1 text-lg font-semibold text-slate-950">{quantity}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onAdjustExtra(extra.id, -1)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border text-lg font-semibold"
                          style={{
                            borderColor: theme.badgeBorder,
                            background: theme.ticketMutedBackground,
                            color: theme.accentText,
                          }}
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => onAdjustExtra(extra.id, 1)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border text-lg font-semibold"
                          style={{
                            borderColor: theme.optionActiveBorder,
                            background: theme.optionActiveBackground,
                            color: theme.ticketAccentText,
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

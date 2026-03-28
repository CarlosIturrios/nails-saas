"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import type { OrganizationQuoteConfigView } from "@/src/features/quote-calculator-v2/lib/types";
import {
  formatMoney,
  type QuoteCalculatorTheme,
} from "@/src/features/quote-calculator-v2/components/QuoteCalculatorV2.shared";

interface CaptureCatalogSectionProps {
  categories: OrganizationQuoteConfigView["categories"];
  selectedOptions: Record<string, string[]>;
  theme: QuoteCalculatorTheme;
  currency: string;
  language: string;
  title: string;
  helperText: string;
  onToggleOption: (categoryId: string, optionId: string) => void;
}

export function CaptureCatalogSection({
  categories,
  selectedOptions,
  theme,
  currency,
  language,
  title,
  helperText,
  onToggleOption,
}: CaptureCatalogSectionProps) {
  const isPosLayout = theme.layoutVariant !== "stacked";
  const isCompact = theme.layoutVariant === "pos_compact";
  const isTouch = theme.layoutVariant === "pos_touch";
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id ?? "");
  const resolvedActiveCategoryId = categories.some((category) => category.id === activeCategoryId)
    ? activeCategoryId
    : categories[0]?.id ?? "";
  const activeCategory =
    categories.find((category) => category.id === resolvedActiveCategoryId) ?? categories[0];
  const activeSelectionCount = useMemo(
    () => Object.values(selectedOptions).reduce((sum, items) => sum + items.length, 0),
    [selectedOptions]
  );
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const quickOptions = useMemo(
    () =>
      categories
        .flatMap((category) =>
          category.options.map((option) => ({
            categoryId: category.id,
            categoryName: category.name,
            optionId: option.id,
            optionName: option.name,
            optionDescription: option.description,
            price: option.price,
          }))
        )
        .slice(0, isCompact ? 8 : 6),
    [categories, isCompact]
  );
  const searchResults = useMemo(
    () =>
      categories.flatMap((category) =>
        category.options
          .filter((option) => {
            const haystack = `${category.name} ${option.name} ${option.description || ""}`.toLowerCase();
            return haystack.includes(normalizedSearch);
          })
          .map((option) => ({
            categoryId: category.id,
            categoryName: category.name,
            optionId: option.id,
            optionName: option.name,
            optionDescription: option.description,
            price: option.price,
          }))
      ),
    [categories, normalizedSearch]
  );

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

        <div className="mt-7 space-y-5">
          {categories.map((category) => {
            const selectedIds = selectedOptions[category.id] ?? [];

            return (
              <div
                key={category.id}
                className="admin-panel rounded-3xl p-5"
                style={{
                  background: theme.panelBackground,
                  borderColor: theme.panelBorder,
                }}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-poppins text-xl font-semibold text-slate-950">
                      {category.name}
                    </h2>
                    {category.description ? (
                      <p className="admin-muted mt-2 text-sm leading-6">{category.description}</p>
                    ) : null}
                  </div>
                  <span
                    className="inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
                    style={{
                      borderColor: theme.badgeBorder,
                      background: theme.badgeBackground,
                      color: theme.badgeText,
                    }}
                  >
                    {category.multiSelect ? "Múltiple" : "Una opción"}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {category.options.map((option) => {
                    const active = selectedIds.includes(option.id);

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => onToggleOption(category.id, option.id)}
                        className="rounded-2xl border p-4 text-left transition sm:p-5"
                        style={{
                          borderColor: active
                            ? theme.optionActiveBorder
                            : theme.optionInactiveBorder,
                          background: active
                            ? theme.optionActiveBackground
                            : theme.optionInactiveBackground,
                        }}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-950">{option.name}</p>
                            {option.description ? (
                              <p className="admin-muted mt-1 text-sm leading-6">
                                {option.description}
                              </p>
                            ) : null}
                          </div>
                          <span className="self-start text-sm font-semibold text-slate-900 sm:self-auto">
                            {formatMoney(option.price, currency, language)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: theme.badgeText }}>
            POS
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{helperText}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold"
            style={{
              borderColor: theme.badgeBorder,
              background: theme.badgeBackground,
              color: theme.badgeText,
            }}
          >
            {categories.length} categorías
          </span>
          <span
            className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold"
            style={{
              borderColor: theme.badgeBorder,
              background: theme.ticketAccentBackground,
              color: theme.ticketAccentText,
            }}
          >
            {activeSelectionCount} en ticket
          </span>
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border p-3 sm:p-4" style={{ borderColor: theme.panelBorder, background: theme.panelBackground }}>
        <label className="flex items-center gap-3">
          <span
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
            style={{ borderColor: theme.badgeBorder, background: theme.ticketMutedBackground, color: theme.badgeText }}
          >
            <Search size={18} />
          </span>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar servicio o categoría"
            className="admin-input border-0 bg-transparent px-0 py-0 text-sm shadow-none focus:ring-0"
          />
        </label>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => {
          const active = category.id === resolvedActiveCategoryId;
          const count = selectedOptions[category.id]?.length ?? 0;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategoryId(category.id)}
              className="shrink-0 rounded-2xl border px-4 py-3 text-left transition"
              style={{
                borderColor: active ? theme.optionActiveBorder : theme.optionInactiveBorder,
                background: active ? theme.optionActiveBackground : theme.optionInactiveBackground,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-950">{category.name}</span>
                {count > 0 ? (
                  <span
                    className="inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{
                      background: theme.ticketAccentBackground,
                      color: theme.ticketAccentText,
                    }}
                  >
                    {count}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {!normalizedSearch && quickOptions.length > 0 ? (
        <section className="mt-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Accesos rápidos</p>
              <p className="text-sm text-slate-600">Para vender con 1 toque los conceptos más comunes.</p>
            </div>
          </div>

          <div
            className={
              isTouch
                ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                : isCompact
                  ? "grid gap-3 min-[480px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                  : "grid gap-3 min-[480px]:grid-cols-2 xl:grid-cols-3"
            }
          >
            {quickOptions.map((option) => {
              const active = (selectedOptions[option.categoryId] ?? []).includes(option.optionId);

              return (
                <button
                  key={`quick-${option.categoryId}-${option.optionId}`}
                  type="button"
                  onClick={() => onToggleOption(option.categoryId, option.optionId)}
                  className={`rounded-[24px] border text-left transition ${isTouch ? "p-5" : "p-4"}`}
                  style={{
                    borderColor: active ? theme.optionActiveBorder : theme.optionInactiveBorder,
                    background: active ? theme.optionActiveBackground : theme.optionInactiveBackground,
                  }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: theme.badgeText }}>
                    {option.categoryName}
                  </p>
                  <p className="mt-3 text-base font-semibold text-slate-950">{option.optionName}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-600">{active ? "En ticket" : "Agregar"}</span>
                    <span className="text-sm font-semibold text-slate-950">
                      {formatMoney(option.price, currency, language)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="mt-6 space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-950">
              {normalizedSearch
                ? searchResults.length > 0
                  ? `Resultados para "${searchQuery.trim()}"`
                  : "Sin resultados"
                : activeCategory?.name || "Servicios"}
            </p>
            <p className="text-sm text-slate-600">
              {normalizedSearch
                ? "Busca y agrega sin cambiar de pantalla."
                : activeCategory?.multiSelect
                  ? "Puedes tocar varios conceptos dentro de esta categoría."
                  : "Al tocar otro concepto, se reemplaza el anterior de esta categoría."}
            </p>
          </div>
          {!normalizedSearch && activeCategory?.description ? (
            <p className="max-w-xl text-sm text-slate-500">{activeCategory.description}</p>
          ) : null}
        </div>

        {normalizedSearch && searchResults.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[#d7c8b0] bg-[#fffdfa] p-5 text-sm leading-6 text-slate-600">
            No encontramos coincidencias. Prueba con otra palabra o elige una categoría.
          </div>
        ) : null}

        <div
          className={
            isTouch
              ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
              : isCompact
                ? "grid gap-3 min-[480px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                : "grid gap-3 min-[480px]:grid-cols-2 xl:grid-cols-3"
          }
        >
          {(normalizedSearch
            ? searchResults
            : (activeCategory?.options ?? []).map((option) => ({
                categoryId: activeCategory?.id ?? "",
                categoryName: activeCategory?.name ?? "",
                optionId: option.id,
                optionName: option.name,
                optionDescription: option.description,
                price: option.price,
              }))
          ).map((option) => {
            const active = (selectedOptions[option.categoryId] ?? []).includes(option.optionId);

            return (
              <button
                key={`${option.categoryId}-${option.optionId}`}
                type="button"
                onClick={() => onToggleOption(option.categoryId, option.optionId)}
                className={`rounded-[24px] border text-left transition ${isTouch ? "p-5 sm:p-6" : isCompact ? "p-3.5 sm:p-4" : "p-4 sm:p-5"}`}
                style={{
                  borderColor: active ? theme.optionActiveBorder : theme.optionInactiveBorder,
                  background: active ? theme.optionActiveBackground : theme.optionInactiveBackground,
                  boxShadow: active
                    ? "0 14px 30px rgba(15, 23, 42, 0.08)"
                    : "0 8px 18px rgba(15, 23, 42, 0.03)",
                }}
              >
                {normalizedSearch ? (
                  <span
                    className="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                    style={{
                      borderColor: theme.badgeBorder,
                      background: theme.badgeBackground,
                      color: theme.badgeText,
                    }}
                  >
                    {option.categoryName}
                  </span>
                ) : null}
                <p className={`font-semibold text-slate-950 ${normalizedSearch ? "mt-3" : ""}`}>
                  {option.optionName}
                </p>
                {option.optionDescription ? (
                  <p className="mt-2 text-sm leading-6 text-slate-600">{option.optionDescription}</p>
                ) : null}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-600">{active ? "Quitar" : "Agregar"}</span>
                  <span className="text-sm font-semibold text-slate-950">
                    {formatMoney(option.price, currency, language)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

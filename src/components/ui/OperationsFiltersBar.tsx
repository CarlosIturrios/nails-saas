"use client";

import { CalendarRange, Filter, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import type { OperationsRangePreset } from "@/src/features/v2/lib/filters";

interface FilterOption {
  value: string;
  label: string;
}

interface OperationsFiltersBarProps {
  rangePreset: OperationsRangePreset;
  anchorDate: string;
  from: string | null;
  to: string | null;
  searchValue?: string;
  searchParamName?: string;
  searchPlaceholder?: string;
  statusValue?: string;
  statusParamName?: string;
  statusLabel?: string;
  statusOptions?: FilterOption[];
  secondaryStatusValue?: string;
  secondaryStatusParamName?: string;
  secondaryStatusLabel?: string;
  secondaryStatusOptions?: FilterOption[];
  helperText?: string;
}

function presetLabel(preset: OperationsRangePreset) {
  switch (preset) {
    case "week":
      return "Semana";
    case "month":
      return "Mes";
    case "custom":
      return "Personalizado";
    case "all":
      return "Todo";
    case "day":
    default:
      return "Día";
  }
}

export function OperationsFiltersBar({
  rangePreset,
  anchorDate,
  from,
  to,
  searchValue = "",
  searchParamName = "q",
  searchPlaceholder = "Buscar por cliente o nota",
  statusValue,
  statusParamName = "status",
  statusLabel = "Estado",
  statusOptions = [],
  secondaryStatusValue,
  secondaryStatusParamName = "substatus",
  secondaryStatusLabel = "Estado secundario",
  secondaryStatusOptions = [],
  helperText,
}: OperationsFiltersBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchDraft, setSearchDraft] = useState(searchValue);

  useEffect(() => {
    setSearchDraft(searchValue);
  }, [searchValue]);

  function updateParams(nextValues: Record<string, string | null | undefined>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(nextValues).forEach(([key, value]) => {
      if (value && value.trim()) {
        params.set(key, value.trim());
      } else {
        params.delete(key);
      }
    });

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function handlePresetChange(nextPreset: OperationsRangePreset) {
    if (nextPreset === "all") {
      updateParams({
        preset: "all",
        date: anchorDate,
        from: null,
        to: null,
      });
      return;
    }

    if (nextPreset === "custom") {
      updateParams({
        preset: "custom",
        from: from ?? anchorDate,
        to: to ?? anchorDate,
      });
      return;
    }

    updateParams({
      preset: nextPreset,
      date: anchorDate,
      from: null,
      to: null,
    });
  }

  return (
    <section className="rounded-[24px] border border-[#e8dece] bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff7eb] text-slate-800 ring-1 ring-[#eadfcb]">
              <Filter size={18} />
            </span>
            <div>
              <p className="ops-kicker">Filtros</p>
              <h3 className="mt-1 font-poppins text-xl font-semibold text-slate-950">
                Ajusta el volumen de trabajo
              </h3>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {helperText ||
              "Filtra por fecha, estado o búsqueda para que la pantalla no se sature cuando haya mucho movimiento."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["day", "week", "month", "custom", "all"] as OperationsRangePreset[]).map(
            (preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetChange(preset)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  rangePreset === preset
                    ? "bg-slate-950 text-white"
                    : "border border-[#e8dece] bg-white text-slate-700 hover:border-[#d6c8b3]"
                }`}
              >
                {presetLabel(preset)}
              </button>
            )
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,220px))]">
        <label className="space-y-2">
          <span className="admin-label flex items-center gap-2 text-sm font-medium">
            <Search size={14} />
            Buscar
          </span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  updateParams({ [searchParamName]: searchDraft });
                }
              }}
              placeholder={searchPlaceholder}
              className="admin-input w-full px-4 py-3 text-sm"
            />
            <div className="flex gap-2 sm:shrink-0">
              <button
                type="button"
                onClick={() => updateParams({ [searchParamName]: searchDraft })}
                className="admin-secondary min-h-[46px] flex-1 px-4 py-3 text-sm font-semibold sm:flex-none"
              >
                Aplicar
              </button>
              {searchValue ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchDraft("");
                    updateParams({ [searchParamName]: null });
                  }}
                  className="inline-flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl border border-[#e8dece] bg-white text-slate-500"
                  aria-label="Limpiar búsqueda"
                  title="Limpiar búsqueda"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>
          </div>
        </label>

        {statusOptions.length > 0 ? (
          <label className="space-y-2">
            <span className="admin-label block text-sm font-medium">{statusLabel}</span>
            <select
              value={statusValue ?? "all"}
              onChange={(event) =>
                updateParams({ [statusParamName]: event.target.value === "all" ? null : event.target.value })
              }
              className="admin-input w-full px-4 py-3 text-sm"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {secondaryStatusOptions.length > 0 ? (
          <label className="space-y-2">
            <span className="admin-label block text-sm font-medium">{secondaryStatusLabel}</span>
            <select
              value={secondaryStatusValue ?? "all"}
              onChange={(event) =>
                updateParams({
                  [secondaryStatusParamName]:
                    event.target.value === "all" ? null : event.target.value,
                })
              }
              className="admin-input w-full px-4 py-3 text-sm"
            >
              {secondaryStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="space-y-2">
          <span className="admin-label flex items-center gap-2 text-sm font-medium">
            <CalendarRange size={14} />
            Rango
          </span>
          {rangePreset === "custom" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                type="date"
                value={from ?? anchorDate}
                onChange={(event) =>
                  updateParams({ preset: "custom", from: event.target.value, to: to ?? event.target.value })
                }
                className="admin-input w-full px-4 py-3 text-sm"
              />
              <input
                type="date"
                value={to ?? from ?? anchorDate}
                onChange={(event) =>
                  updateParams({ preset: "custom", from: from ?? event.target.value, to: event.target.value })
                }
                className="admin-input w-full px-4 py-3 text-sm"
              />
            </div>
          ) : (
            <input
              type="date"
              value={anchorDate}
              onChange={(event) => updateParams({ date: event.target.value })}
              disabled={rangePreset === "all"}
              className="admin-input w-full px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            />
          )}
        </div>
      </div>
    </section>
  );
}

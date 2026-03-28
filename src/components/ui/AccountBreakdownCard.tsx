import { ChevronDown, ReceiptText } from "lucide-react";

interface AccountBreakdownItem {
  id?: string;
  label: string;
  amount: number;
  description?: string | null;
}

interface AccountBreakdownCardProps {
  locale: string;
  currency: string;
  total?: number;
  items: AccountBreakdownItem[];
  eyebrow?: string;
  title?: string;
  description?: string;
  totalLabel?: string;
  emptyMessage?: string;
  detailTitle?: string;
  detailDescription?: string;
  defaultOpen?: boolean;
  previewLimit?: number;
  showTotal?: boolean;
}

function formatMoney(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function AccountBreakdownCard({
  locale,
  currency,
  total = 0,
  items,
  eyebrow = "Cuenta completa",
  title = "Detalle de la cuenta",
  description = "Servicios, extras y ajustes que forman este total.",
  totalLabel = "Total",
  emptyMessage = "Todavía no hay conceptos agregados.",
  detailTitle = "Ver detalle completo",
  detailDescription = "Abre este bloque solo cuando quieras revisar cada concepto.",
  defaultOpen = false,
  previewLimit = 4,
  showTotal = false,
}: AccountBreakdownCardProps) {
  const previewItems = items.slice(0, previewLimit);
  const remainingCount = Math.max(items.length - previewItems.length, 0);

  return (
    <section className="rounded-[24px] border border-[#efe6d8] bg-[#fffdfa] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--ops-primary)] shadow-sm ring-1 ring-[#efe6d8]">
              <ReceiptText size={18} />
            </span>
            <div className="min-w-0">
              <p className="ops-kicker">{eyebrow}</p>
              <h3 className="mt-2 font-poppins text-lg font-semibold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          </div>

          {items.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {previewItems.map((item, index) => (
                <span
                  key={item.id ?? `${item.label}-${index}`}
                  className="inline-flex items-center rounded-full border border-[#ddd1bf] bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                >
                  {item.label}
                </span>
              ))}
              {remainingCount > 0 ? (
                <span className="inline-flex items-center rounded-full border border-dashed border-[#ddd1bf] bg-[#fff7eb] px-3 py-1 text-xs font-semibold text-slate-500">
                  +{remainingCount} más
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {showTotal ? (
          <div className="rounded-2xl border border-[#efe6d8] bg-white px-4 py-3 lg:min-w-[180px]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {totalLabel}
            </p>
            <p className="mt-2 font-poppins text-2xl font-semibold text-slate-950">
              {formatMoney(total, currency, locale)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {items.length} concepto{items.length === 1 ? "" : "s"}
            </p>
          </div>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[#e8ddcc] bg-white/80 p-4">
          <p className="text-sm leading-6 text-slate-600">{emptyMessage}</p>
        </div>
      ) : (
        <details
          className="group mt-4 rounded-[22px] border border-[#efe6d8] bg-white/90 p-4"
          open={defaultOpen}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-950">{detailTitle}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{detailDescription}</p>
            </div>
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#efe6d8] bg-[#fffdfa] text-slate-500 transition group-open:rotate-180">
              <ChevronDown size={16} />
            </span>
          </summary>

          <div className="mt-4 space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id ?? `${item.label}-${index}`}
                className="flex flex-col gap-2 rounded-2xl border border-[#efe6d8] bg-[#fffdfa] px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                  {item.description ? (
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-sm font-semibold text-slate-900 sm:text-right">
                  {formatMoney(item.amount, currency, locale)}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}

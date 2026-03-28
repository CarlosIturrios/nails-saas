"use client";

import Link from "next/link";
import { QuoteStatus } from "@prisma/client";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Phone,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";

import { AccountBreakdownCard } from "@/src/components/ui/AccountBreakdownCard";
import { OperationsFiltersBar } from "@/src/components/ui/OperationsFiltersBar";
import {
  ActionHint,
  StatusBadge,
} from "@/src/components/ui/OperationsUI";
import { getApiErrorMessage } from "@/src/components/ui/apiFeedback";
import { downloadQuoteImage } from "@/src/components/ui/downloadQuoteImage";
import Toast from "@/src/components/ui/Toast";

interface QuotesBoardProps {
  locale: string;
  rangePreset: "day" | "week" | "month" | "custom" | "all";
  anchorDate: string;
  rangeFrom: string | null;
  rangeTo: string | null;
  statusFilter: string;
  searchQuery: string;
  canConvertQuotes: boolean;
  quoteHrefPrefix?: string;
  orderHrefPrefix?: string;
  clientHrefPrefix?: string;
  newSaleHrefBase?: string;
  printBranding: {
    businessName: string;
    organizationName: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    currency: string;
    language: string;
    title: string;
    subtitle?: string | null;
    totalLabel?: string | null;
    downloadLabel?: string | null;
    isLegacyTemplate?: boolean;
  };
  assignableUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  quotes: Array<{
    id: string;
    clientId: string | null;
    status: QuoteStatus;
    customerName: string | null;
    customerPhone: string | null;
    notes: string | null;
    scheduledFor: string | null;
    createdAt: string;
    total: number;
    currency: string;
    linkedOrderId: string | null;
    items: Array<{
      id: string;
      label: string;
      total: number;
    }>;
  }>;
}

const STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  ACCEPTED: "Aceptada",
  CONVERTED: "Convertida",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada",
};

function formatMoney(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateLabel(value: string | null, locale: string) {
  if (!value) {
    return "Sin fecha programada";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function toDatetimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const normalized = new Date(date.getTime() - offset * 60_000);
  return normalized.toISOString().slice(0, 16);
}

function getStatusTone(status: QuoteStatus) {
  if (status === QuoteStatus.ACCEPTED || status === QuoteStatus.CONVERTED) {
    return "success" as const;
  }

  if (status === QuoteStatus.SENT) {
    return "info" as const;
  }

  if (status === QuoteStatus.CANCELLED) {
    return "danger" as const;
  }

  if (status === QuoteStatus.EXPIRED) {
    return "warning" as const;
  }

  return "neutral" as const;
}

function buildNewSaleHref(
  quote: QuotesBoardProps["quotes"][number],
  newSaleHrefBase: string
) {
  const params = new URLSearchParams();

  if (quote.clientId) {
    params.set("clientId", quote.clientId);
  }
  if (quote.customerName) {
    params.set("customerName", quote.customerName);
  }
  if (quote.customerPhone) {
    params.set("customerPhone", quote.customerPhone);
  }
  params.set("intent", "quote");

  return `${newSaleHrefBase}?${params.toString()}`;
}

function QuotesOverviewCard({
  icon,
  label,
  value,
  description,
  tone = "slate",
}: {
  icon: ReactNode;
  label: string;
  value: number;
  description: string;
  tone?: "sky" | "emerald" | "amber" | "slate";
}) {
  const toneClassName = {
    sky: "border-sky-200 bg-sky-50/70",
    emerald: "border-emerald-200 bg-emerald-50/70",
    amber: "border-amber-200 bg-amber-50/70",
    slate: "border-[#e8dece] bg-[#fffdfa]",
  }[tone];

  return (
    <article className={`rounded-[24px] border p-5 ${toneClassName}`}>
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[var(--ops-primary)] shadow-sm ring-1 ring-[#efe6d8]">
        {icon}
      </span>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 font-poppins text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}

function QuoteMetaRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#efe6d8] bg-[#fffdfa] p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-[#efe6d8]">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>
          <div className="mt-1 text-sm leading-6 text-slate-700">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function QuotesBoard({
  locale,
  rangePreset,
  anchorDate,
  rangeFrom,
  rangeTo,
  statusFilter,
  searchQuery,
  canConvertQuotes,
  quoteHrefPrefix = "/propuestas",
  orderHrefPrefix = "/ordenes",
  clientHrefPrefix = "/clientes",
  newSaleHrefBase = "/capturar",
  printBranding,
  assignableUsers,
  quotes,
}: QuotesBoardProps) {
  const getQuoteHref = (quoteId: string) => `${quoteHrefPrefix}/${quoteId}`;
  const getOrderHref = (orderId: string) => `${orderHrefPrefix}/${orderId}`;
  const getClientHref = (clientId: string) => `${clientHrefPrefix}/${clientId}`;
  const router = useRouter();
  const [pendingQuoteId, setPendingQuoteId] = useState<string | null>(null);
  const [expandedConvertQuoteId, setExpandedConvertQuoteId] = useState<string | null>(null);
  const [assignmentValues, setAssignmentValues] = useState<Record<string, string>>({});
  const [scheduleValues, setScheduleValues] = useState<Record<string, string>>(
    () => Object.fromEntries(quotes.map((quote) => [quote.id, toDatetimeLocal(quote.scheduledFor)]))
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "open"
            ? quote.status !== QuoteStatus.CONVERTED && quote.status !== QuoteStatus.CANCELLED
            : statusFilter === "closed"
              ? quote.status === QuoteStatus.CONVERTED || quote.status === QuoteStatus.CANCELLED
              : quote.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        quote.customerName,
        quote.customerPhone,
        quote.notes,
        ...quote.items.map((item) => item.label),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [normalizedSearch, quotes, statusFilter]);
  const visibleSummary = useMemo(
    () => ({
      drafts: filteredQuotes.filter(
        (quote) => quote.status === QuoteStatus.DRAFT || quote.status === QuoteStatus.SENT
      ).length,
      accepted: filteredQuotes.filter(
        (quote) => quote.status === QuoteStatus.ACCEPTED && !quote.linkedOrderId
      ).length,
      linked: filteredQuotes.filter((quote) => Boolean(quote.linkedOrderId)).length,
      scheduled: filteredQuotes.filter((quote) => Boolean(quote.scheduledFor)).length,
    }),
    [filteredQuotes]
  );

  async function updateStatus(quoteId: string, status: QuoteStatus) {
    setPendingQuoteId(quoteId);

    try {
      const response = await fetch(`/api/quotes/${quoteId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage({
            status: response.status,
            payloadError: payload.error,
            fallback: "No se pudo actualizar la propuesta",
            permissionAction: "create_quote",
          })
        );
      }

      setToast({
        message: "Propuesta actualizada correctamente",
        type: "success",
      });
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setPendingQuoteId(null);
    }
  }

  async function convertToOrder(quoteId: string) {
    setPendingQuoteId(quoteId);

    try {
      const response = await fetch(`/api/quotes/${quoteId}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedToUserId: assignmentValues[quoteId] || null,
          scheduledFor: scheduleValues[quoteId] || null,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage({
            status: response.status,
            payloadError: payload.error,
            fallback: "No se pudo convertir la propuesta",
            permissionAction: "convert_quote",
          })
        );
      }

      setToast({
        message: "Propuesta convertida a orden correctamente",
        type: "success",
      });
      setExpandedConvertQuoteId(null);
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setPendingQuoteId(null);
    }
  }

  async function downloadQuote(quote: QuotesBoardProps["quotes"][number]) {
    try {
      await downloadQuoteImage({
        branding: {
          ...printBranding,
          organizationName: printBranding.organizationName,
        },
        title: printBranding.title,
        subtitle: printBranding.subtitle,
        totalLabel: printBranding.totalLabel,
        total: quote.total,
        isLegacyTemplate: printBranding.isLegacyTemplate,
        rows: quote.items.map((item) => ({
          label: item.label,
          amount: item.total,
        })),
        filename: "cotizacion-v2.png",
      });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo descargar la cotización",
        type: "error",
      });
    }
  }

  if (quotes.length === 0) {
    return (
      <section className="admin-surface rounded-3xl p-6 sm:p-8">
        <p className="text-sm font-medium text-slate-700">Aún no hay propuestas guardadas.</p>
        <p className="admin-muted mt-2 text-sm leading-6">
          Usa el cotizador para guardar la primera propuesta antes de convertirla en orden.
        </p>
      </section>
    );
  }

  return (
    <>
      <OperationsFiltersBar
        rangePreset={rangePreset}
        anchorDate={anchorDate}
        from={rangeFrom}
        to={rangeTo}
        statusValue={statusFilter}
        statusParamName="status"
        statusLabel="Estado de propuesta"
        statusOptions={[
          { value: "all", label: "Todos los estados" },
          { value: "open", label: "Abiertas" },
          { value: "closed", label: "Cerradas" },
          { value: QuoteStatus.DRAFT, label: "Borrador" },
          { value: QuoteStatus.SENT, label: "Enviada" },
          { value: QuoteStatus.ACCEPTED, label: "Aceptada" },
          { value: QuoteStatus.CONVERTED, label: "Convertida" },
          { value: QuoteStatus.CANCELLED, label: "Cancelada" },
          { value: QuoteStatus.EXPIRED, label: "Expirada" },
        ]}
        searchValue={searchQuery}
        searchParamName="q"
        searchPlaceholder="Buscar por cliente, teléfono o concepto"
        helperText="Usa rango, estado y búsqueda para revisar propuestas nuevas, antiguas, abiertas o ya cerradas sin saturar la vista."
      />

      <section className="ops-card p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="ops-kicker">Preventa activa</p>
            <h2 className="ops-section-title mt-2">Qué se puede mover hoy</h2>
            <p className="admin-muted mt-2 text-sm leading-6">
              Aquí revisas qué propuestas siguen abiertas, cuáles ya dijeron que sí y cuáles ya aterrizaron en orden.
            </p>
          </div>
          <div className="rounded-[24px] border border-[#efe6d8] bg-[#fffdfa] px-5 py-4 lg:max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Criterio
            </p>
            <p className="mt-2 font-poppins text-xl font-semibold text-slate-950">
              Total visible
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              El total siempre queda al frente; el desglose completo se abre solo cuando lo necesitas revisar.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <QuotesOverviewCard
              icon={<FileText size={18} />}
              label="Por revisar"
              value={visibleSummary.drafts}
            description="Borradores o propuestas enviadas que todavía siguen abiertas."
            tone="slate"
          />
            <QuotesOverviewCard
              icon={<CheckCircle2 size={18} />}
              label="Listas para convertir"
              value={visibleSummary.accepted}
            description="Ya aceptadas y listas para pasar a orden cuando toque."
            tone="emerald"
          />
            <QuotesOverviewCard
              icon={<ClipboardList size={18} />}
              label="Con orden ligada"
              value={visibleSummary.linked}
            description="Propuestas que ya se convirtieron y sirven como referencia."
            tone="sky"
          />
            <QuotesOverviewCard
              icon={<CalendarClock size={18} />}
              label="Con fecha"
              value={visibleSummary.scheduled}
            description="Propuestas que ya traen una fecha sugerida o prometida."
            tone="amber"
          />
        </div>
      </section>

      <section className="space-y-4">
        {filteredQuotes.map((quote) => (
          <article key={quote.id} className="admin-surface rounded-[28px] p-6 sm:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <Link
                    href={getQuoteHref(quote.id)}
                    className="font-poppins text-xl font-semibold text-slate-950 underline-offset-4 hover:underline"
                  >
                    {quote.customerName || "Cliente potencial"}
                  </Link>
                  <StatusBadge tone={getStatusTone(quote.status)}>
                    {STATUS_LABELS[quote.status]}
                  </StatusBadge>
                  {quote.linkedOrderId ? (
                    <Link
                      href={getOrderHref(quote.linkedOrderId)}
                      className="inline-flex w-fit rounded-full border border-[#ddd1bf] bg-[#fffaf2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 underline-offset-4 hover:underline"
                    >
                      Orden creada
                    </Link>
                  ) : null}
                </div>

                {canConvertQuotes && quote.status === QuoteStatus.ACCEPTED && !quote.linkedOrderId ? (
                  <div className="mt-4">
                    <ActionHint tone="success">
                      Siguiente paso: convertir en orden.
                    </ActionHint>
                  </div>
                ) : null}

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <QuoteMetaRow icon={<FileText size={16} />} label="Creada">
                    {formatDateLabel(quote.createdAt, locale)}
                  </QuoteMetaRow>
                  <QuoteMetaRow icon={<CalendarClock size={16} />} label="Programada">
                    {formatDateLabel(quote.scheduledFor, locale)}
                  </QuoteMetaRow>
                  {quote.customerPhone ? (
                    <QuoteMetaRow icon={<Phone size={16} />} label="Contacto">
                      {quote.customerPhone}
                    </QuoteMetaRow>
                  ) : null}
                  {quote.clientId ? (
                    <QuoteMetaRow icon={<ClipboardList size={16} />} label="Cliente">
                      <Link
                        href={getClientHref(quote.clientId)}
                        className="font-semibold text-[var(--ops-primary)] underline-offset-4 hover:underline"
                      >
                        Abrir ficha del cliente
                      </Link>
                    </QuoteMetaRow>
                  ) : null}
                  {quote.notes ? (
                    <div className="sm:col-span-2">
                      <QuoteMetaRow icon={<FileText size={16} />} label="Nota">
                        {quote.notes}
                      </QuoteMetaRow>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="xl:w-[320px] xl:max-w-[320px]">
                <div className="rounded-[24px] border border-[#efe6d8] bg-[#fffdfa] p-5">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--ops-primary)] shadow-sm ring-1 ring-[#efe6d8]">
                      <Sparkles size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Total propuesto
                      </p>
                      <p className="mt-2 font-poppins text-3xl font-semibold text-slate-950">
                        {formatMoney(quote.total, quote.currency, locale)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3">
                    <Link
                      href={buildNewSaleHref(quote, newSaleHrefBase)}
                      className="admin-secondary inline-flex w-full items-center justify-center px-4 py-3 text-sm font-semibold"
                    >
                      Nueva venta con este cliente
                    </Link>
                    <button
                      type="button"
                      onClick={() => void downloadQuote(quote)}
                      className="admin-secondary inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-semibold"
                    >
                      <Download size={16} />
                      {printBranding.downloadLabel || "Descargar cotización"}
                    </button>
                    {canConvertQuotes && quote.status === QuoteStatus.DRAFT ? (
                      <button
                        type="button"
                        onClick={() => updateStatus(quote.id, QuoteStatus.SENT)}
                        disabled={pendingQuoteId === quote.id}
                        className="admin-secondary w-full px-4 py-3 text-sm font-semibold disabled:opacity-50"
                      >
                        Marcar enviada
                      </button>
                    ) : null}
                    {canConvertQuotes &&
                    (quote.status === QuoteStatus.DRAFT || quote.status === QuoteStatus.SENT) ? (
                      <button
                        type="button"
                        onClick={() => updateStatus(quote.id, QuoteStatus.ACCEPTED)}
                        disabled={pendingQuoteId === quote.id}
                        className="admin-secondary w-full px-4 py-3 text-sm font-semibold disabled:opacity-50"
                      >
                        Marcar aceptada
                      </button>
                    ) : null}
                    {canConvertQuotes &&
                    !quote.linkedOrderId &&
                    quote.status !== QuoteStatus.CONVERTED ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedConvertQuoteId((current) =>
                            current === quote.id ? null : quote.id
                          )
                        }
                        disabled={pendingQuoteId === quote.id}
                        className="admin-primary w-full px-4 py-3 text-sm font-semibold disabled:opacity-50"
                      >
                        {expandedConvertQuoteId === quote.id
                          ? "Ocultar conversión"
                          : "Convertir a orden"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {canConvertQuotes && expandedConvertQuoteId === quote.id ? (
              <div className="mt-5 rounded-[24px] border border-[#efe6d8] bg-[#fffdfa] p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--ops-primary)] ring-1 ring-[#efe6d8]">
                    <ClipboardList size={18} />
                  </span>
                  <div>
                    <p className="admin-label text-sm font-medium">Conversión a orden</p>
                    <p className="admin-muted mt-2 text-sm leading-6">
                      Define quién atenderá el trabajo y ajusta la fecha final si ya quedó confirmada.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="admin-label block text-sm font-medium">Responsable</span>
                    <select
                      value={assignmentValues[quote.id] ?? ""}
                      onChange={(event) =>
                        setAssignmentValues((current) => ({
                          ...current,
                          [quote.id]: event.target.value,
                        }))
                      }
                      className="admin-input px-4 py-3 text-sm"
                    >
                      <option value="">Sin asignar</option>
                      {assignableUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name || user.email}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="admin-label block text-sm font-medium">Fecha final</span>
                    <input
                      type="datetime-local"
                      value={scheduleValues[quote.id] ?? ""}
                      onChange={(event) =>
                        setScheduleValues((current) => ({
                          ...current,
                          [quote.id]: event.target.value,
                        }))
                      }
                      className="admin-input px-4 py-3 text-sm"
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => convertToOrder(quote.id)}
                    disabled={pendingQuoteId === quote.id}
                    className="admin-primary px-4 py-3 text-sm font-semibold disabled:opacity-50"
                  >
                    {pendingQuoteId === quote.id ? "Convirtiendo..." : "Confirmar conversión"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedConvertQuoteId(null)}
                    disabled={pendingQuoteId === quote.id}
                    className="admin-secondary px-4 py-3 text-sm font-semibold disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-5">
              <AccountBreakdownCard
                locale={locale}
                currency={quote.currency}
                total={quote.total}
                items={quote.items.map((item) => ({
                  id: item.id,
                  label: item.label,
                  amount: item.total,
                }))}
                title="Lo que incluye esta propuesta"
                description="El total queda siempre visible y el detalle completo solo se abre cuando necesites revisarlo."
                detailTitle="Ver servicios, extras y ajustes"
                detailDescription="Aquí se muestra el desglose completo de la propuesta."
              />
            </div>
          </article>
        ))}
        {filteredQuotes.length === 0 ? (
          <section className="admin-surface rounded-[28px] p-6 sm:p-8">
            <p className="text-sm font-medium text-slate-700">
              No hay propuestas para los filtros seleccionados.
            </p>
          </section>
        ) : null}
      </section>

      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      ) : null}
    </>
  );
}

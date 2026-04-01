"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { QuoteStatus, ServiceOrderStatus } from "@prisma/client";
import { PencilLine, PlusCircle } from "lucide-react";

import { ServiceOrderActionsPanel } from "@/src/components/orders/ServiceOrderActionsPanel";
import { AccountBreakdownCard } from "@/src/components/ui/AccountBreakdownCard";
import { DownloadQuoteImageButton } from "@/src/components/ui/DownloadQuoteImageButton";
import { OperationsFiltersBar } from "@/src/components/ui/OperationsFiltersBar";
import {
  buildV2CaptureEditOrderHref,
  buildV2CaptureEditQuoteHref,
} from "@/src/features/v2/routing";
import { getApiErrorMessage } from "@/src/components/ui/apiFeedback";
import {
  ActionHint,
  StatCard,
  StatusBadge,
} from "@/src/components/ui/OperationsUI";
import Toast from "@/src/components/ui/Toast";
import { formatDate, getUtcTimestamp } from "@/src/lib/dates";

interface PendingOperationsBoardProps {
  locale: string;
  timeZone: string;
  currency: string;
  rangePreset: "day" | "week" | "month" | "custom" | "all";
  anchorDate: string;
  rangeFrom: string | null;
  rangeTo: string | null;
  searchQuery: string;
  quoteStatusFilter: string;
  orderStatusFilter: string;
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
  canConvertQuotes: boolean;
  canEditQuoteDetails?: boolean;
  canEditOrderDetails?: boolean;
  canScheduleOrders: boolean;
  canProgressOrders: boolean;
  canChargeOrders: boolean;
  assignableUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  quotes: Array<{
    id: string;
    clientId: string | null;
    linkedOrderId: string | null;
    status: QuoteStatus;
    customerName: string | null;
    customerPhone: string | null;
    notes: string | null;
    scheduledFor: string | null;
    createdAt: string;
    total: number;
    items: Array<{
      id?: string;
      label: string;
      total: number;
    }>;
  }>;
  orders: Array<{
    id: string;
    clientId: string | null;
    sourceQuoteId: string | null;
    status: ServiceOrderStatus;
    customerName: string | null;
    customerPhone: string | null;
    notes: string | null;
    scheduledFor: string | null;
    createdAt: string;
    total: number;
    currency: string;
    assignedToName: string | null;
    assignedToUserId: string | null;
    items: Array<{
      id?: string;
      label: string;
      total: number;
    }>;
  }>;
}

const STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  DRAFT: "Borrador",
  CONFIRMED: "Pendiente",
  IN_PROGRESS: "En proceso",
  COMPLETED: "Terminada",
  PAID: "Pagada",
  CANCELLED: "Cancelada",
};

function getNextStatus(status: ServiceOrderStatus) {
  if (status === ServiceOrderStatus.DRAFT) {
    return ServiceOrderStatus.CONFIRMED;
  }

  if (status === ServiceOrderStatus.CONFIRMED) {
    return ServiceOrderStatus.IN_PROGRESS;
  }

  if (status === ServiceOrderStatus.IN_PROGRESS) {
    return ServiceOrderStatus.COMPLETED;
  }

  if (status === ServiceOrderStatus.COMPLETED) {
    return ServiceOrderStatus.PAID;
  }

  return null;
}

function getNextActionLabel(status: ServiceOrderStatus) {
  if (status === ServiceOrderStatus.DRAFT) {
    return "Confirmar";
  }

  if (status === ServiceOrderStatus.CONFIRMED) {
    return "Iniciar";
  }

  if (status === ServiceOrderStatus.IN_PROGRESS) {
    return "Terminar";
  }

  if (status === ServiceOrderStatus.COMPLETED) {
    return "Cobrar";
  }

  return null;
}

function getActionHint(status: ServiceOrderStatus) {
  if (status === ServiceOrderStatus.DRAFT) {
    return "Deja lista la orden para empezar a trabajar.";
  }

  if (status === ServiceOrderStatus.CONFIRMED) {
    return "Empieza el trabajo para moverla a en proceso.";
  }

  if (status === ServiceOrderStatus.IN_PROGRESS) {
    return "Marca terminada en cuanto acabes el trabajo.";
  }

  if (status === ServiceOrderStatus.COMPLETED) {
    return "Solo falta cobrar para cerrar esta venta.";
  }

  return "";
}

function formatMoney(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string | null, locale: string, timeZone: string) {
  if (!value) {
    return "Atención sin horario";
  }

  return formatDate(value, {
    locale,
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getOrderPriority(status: ServiceOrderStatus) {
  if (status === ServiceOrderStatus.COMPLETED) {
    return 0;
  }

  if (status === ServiceOrderStatus.IN_PROGRESS) {
    return 1;
  }

  if (status === ServiceOrderStatus.CONFIRMED) {
    return 2;
  }

  if (status === ServiceOrderStatus.DRAFT) {
    return 3;
  }

  return 4;
}

function getOrderTone(status: ServiceOrderStatus) {
  if (status === ServiceOrderStatus.COMPLETED) {
    return "warning" as const;
  }

  if (status === ServiceOrderStatus.IN_PROGRESS) {
    return "info" as const;
  }

  if (status === ServiceOrderStatus.CONFIRMED) {
    return "neutral" as const;
  }

  return "neutral" as const;
}

function getQuoteTone(status: QuoteStatus) {
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

const ACTIONABLE_ORDER_STATUSES: ServiceOrderStatus[] = [
  ServiceOrderStatus.DRAFT,
  ServiceOrderStatus.CONFIRMED,
  ServiceOrderStatus.IN_PROGRESS,
  ServiceOrderStatus.COMPLETED,
];

function buildQuoteNewSaleHref(
  quote: PendingOperationsBoardProps["quotes"][number],
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

export function PendingOperationsBoard({
  locale,
  timeZone,
  currency,
  rangePreset,
  anchorDate,
  rangeFrom,
  rangeTo,
  searchQuery,
  quoteStatusFilter,
  orderStatusFilter,
  quoteHrefPrefix = "/propuestas",
  orderHrefPrefix = "/ordenes",
  clientHrefPrefix = "/clientes",
  newSaleHrefBase = "/capturar",
  printBranding,
  canConvertQuotes,
  canEditQuoteDetails = false,
  canEditOrderDetails = false,
  canScheduleOrders,
  canProgressOrders,
  canChargeOrders,
  assignableUsers,
  quotes,
  orders,
}: PendingOperationsBoardProps) {
  const getQuoteHref = (quoteId: string) => `${quoteHrefPrefix}/${quoteId}`;
  const getOrderHref = (orderId: string) => `${orderHrefPrefix}/${orderId}`;
  const getClientHref = (clientId: string) => `${clientHrefPrefix}/${clientId}`;
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedFilter, setFeedFilter] = useState<
    "all" | "quotes" | "orders" | "charge" | "work" | "open" | "closed"
  >("all");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const matchesStatus =
        quoteStatusFilter === "all"
          ? true
          : quoteStatusFilter === "open"
            ? quote.status !== QuoteStatus.CONVERTED && quote.status !== QuoteStatus.CANCELLED
            : quoteStatusFilter === "closed"
              ? quote.status === QuoteStatus.CONVERTED || quote.status === QuoteStatus.CANCELLED
              : quote.status === quoteStatusFilter;

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
  }, [normalizedSearch, quoteStatusFilter, quotes]);
  const sortedOrders = useMemo(
    () =>
      [...orders].sort((a, b) => {
        const priorityDiff = getOrderPriority(a.status) - getOrderPriority(b.status);

        if (priorityDiff !== 0) {
          return priorityDiff;
        }

        const aTime = getUtcTimestamp(a.scheduledFor);
        const bTime = getUtcTimestamp(b.scheduledFor);
        return aTime - bTime;
      }),
    [orders]
  );
  const filteredOrders = useMemo(() => {
    return sortedOrders.filter((order) => {
      const matchesStatus =
        orderStatusFilter === "all"
          ? true
          : orderStatusFilter === "open"
            ? order.status !== ServiceOrderStatus.PAID &&
              order.status !== ServiceOrderStatus.CANCELLED
            : orderStatusFilter === "closed"
              ? order.status === ServiceOrderStatus.PAID ||
                order.status === ServiceOrderStatus.CANCELLED
              : order.status === orderStatusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        order.customerName,
        order.customerPhone,
        order.notes,
        order.assignedToName,
        ...order.items.map((item) => item.label),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [normalizedSearch, orderStatusFilter, sortedOrders]);
  const actionableQuotes = filteredQuotes.filter(
    (quote) => quote.status === QuoteStatus.ACCEPTED && !quote.linkedOrderId
  );
  const actionableOrders = filteredOrders.filter((order) =>
    ACTIONABLE_ORDER_STATUSES.includes(order.status)
  );
  const summary = {
    quoteCount: filteredQuotes.length,
    orderCount: filteredOrders.length,
    quoteAmount: filteredQuotes.reduce((sum, quote) => sum + quote.total, 0),
    orderAmount: filteredOrders.reduce((sum, order) => sum + order.total, 0),
  };
  const visibleQuotes = filteredQuotes.filter((quote) => {
    if (feedFilter === "orders" || feedFilter === "charge" || feedFilter === "work") {
      return false;
    }

    if (feedFilter === "open") {
      return quote.status !== QuoteStatus.CONVERTED && quote.status !== QuoteStatus.CANCELLED;
    }

    if (feedFilter === "closed") {
      return quote.status === QuoteStatus.CONVERTED || quote.status === QuoteStatus.CANCELLED;
    }

    return true;
  });
  const visibleOrders = filteredOrders.filter((order) => {
    if (feedFilter === "quotes") {
      return false;
    }

    if (feedFilter === "all") {
      return true;
    }

    if (feedFilter === "charge") {
      return order.status === ServiceOrderStatus.COMPLETED;
    }

    if (feedFilter === "work") {
      return order.status !== ServiceOrderStatus.COMPLETED &&
        order.status !== ServiceOrderStatus.PAID &&
        order.status !== ServiceOrderStatus.CANCELLED;
    }

    if (feedFilter === "open") {
      return order.status !== ServiceOrderStatus.PAID &&
        order.status !== ServiceOrderStatus.CANCELLED;
    }

    if (feedFilter === "closed") {
      return order.status === ServiceOrderStatus.PAID ||
        order.status === ServiceOrderStatus.CANCELLED;
    }

    return true;
  });
  const quickActions = [
    ...actionableOrders.slice(0, 2).map((order) => {
      const nextStatus = getNextStatus(order.status);
      const canMoveOrder =
        nextStatus === ServiceOrderStatus.PAID ? canChargeOrders : canProgressOrders;

      return {
        id: order.id,
        kind: "order" as const,
        title: order.customerName || "Cliente mostrador",
        subtitle: getActionHint(order.status),
        meta: STATUS_LABELS[order.status],
        amount: order.total,
        actionLabel: canMoveOrder ? getNextActionLabel(order.status) : null,
        nextStatus: canMoveOrder ? nextStatus : null,
      };
    }),
    ...actionableQuotes.slice(0, 1).map((quote) => ({
      id: quote.id,
      kind: "quote" as const,
      title: quote.customerName || "Cliente potencial",
      subtitle: "Ya aceptó. Convierte esta propuesta para empezar el trabajo.",
      meta: "Aceptada",
      amount: quote.total,
      actionLabel: canConvertQuotes ? "Convertir ahora" : null,
      nextStatus: null,
    })),
  ].filter((item) => item.actionLabel);

  async function convertQuote(quoteId: string) {
    setPendingId(quoteId);

    try {
      const response = await fetch(`/api/quotes/${quoteId}/convert`, {
        method: "POST",
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
        message: "Propuesta convertida correctamente",
        type: "success",
      });
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setPendingId(null);
    }
  }

  async function updateOrderStatus(orderId: string, status: ServiceOrderStatus) {
    setPendingId(orderId);

    try {
      const response = await fetch(`/api/service-orders/${orderId}/status`, {
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
            fallback: "No se pudo actualizar la orden",
            permissionAction:
              status === ServiceOrderStatus.PAID ? "charge_order" : "progress_order",
          })
        );
      }

      setToast({
        message: "Orden actualizada correctamente",
        type: "success",
      });
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <OperationsFiltersBar
          rangePreset={rangePreset}
          anchorDate={anchorDate}
          from={rangeFrom}
          to={rangeTo}
          searchValue={searchQuery}
          searchParamName="q"
          searchPlaceholder="Buscar por cliente, nota o concepto"
          statusValue={quoteStatusFilter}
          statusParamName="quoteStatus"
          statusLabel="Estado de propuesta"
          statusOptions={[
            { value: "all", label: "Todas las propuestas" },
            { value: "open", label: "Propuestas abiertas" },
            { value: "closed", label: "Propuestas cerradas" },
            { value: QuoteStatus.DRAFT, label: "Borrador" },
            { value: QuoteStatus.SENT, label: "Enviada" },
            { value: QuoteStatus.ACCEPTED, label: "Aceptada" },
            { value: QuoteStatus.CONVERTED, label: "Convertida" },
            { value: QuoteStatus.CANCELLED, label: "Cancelada" },
            { value: QuoteStatus.EXPIRED, label: "Expirada" },
          ]}
          secondaryStatusValue={orderStatusFilter}
          secondaryStatusParamName="orderStatus"
          secondaryStatusLabel="Estado de orden"
          secondaryStatusOptions={[
            { value: "all", label: "Todas las órdenes" },
            { value: "open", label: "Órdenes abiertas" },
            { value: "closed", label: "Órdenes cerradas" },
            { value: ServiceOrderStatus.DRAFT, label: "Borrador" },
            { value: ServiceOrderStatus.CONFIRMED, label: "Pendiente" },
            { value: ServiceOrderStatus.IN_PROGRESS, label: "En proceso" },
            { value: ServiceOrderStatus.COMPLETED, label: "Terminada" },
            { value: ServiceOrderStatus.PAID, label: "Pagada" },
            { value: ServiceOrderStatus.CANCELLED, label: "Cancelada" },
          ]}
          helperText="Aquí ya no ves solo lo aceptado del día. Puedes revisar propuestas y órdenes nuevas, viejas, abiertas o cerradas según el rango que elijas."
        />

        {quickActions.length > 0 ? (
          <section className="ops-action-card p-6 sm:p-8">
            <div className="flex flex-col gap-2">
              <p className="ops-kicker">Sigue esto ahora</p>
              <h2 className="ops-section-title">Acciones recomendadas</h2>
              <p className="admin-muted text-sm leading-6">
                Estas son las siguientes mejores acciones para mover el trabajo sin tener que revisar toda la lista.
              </p>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-3">
              {quickActions.map((item) => (
                <article
                  key={`${item.kind}-${item.id}`}
                  className="ops-card-soft p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="ops-kicker">
                        {item.kind === "order" ? "Orden activa" : "Propuesta aceptada"}
                      </p>
                      <h3 className="mt-3 text-xl font-semibold text-slate-950">
                        {item.title}
                      </h3>
                    </div>
                    <StatusBadge tone={item.kind === "quote" ? "success" : getOrderTone(item.nextStatus ?? ServiceOrderStatus.CONFIRMED)}>
                      {item.meta}
                    </StatusBadge>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-700">{item.subtitle}</p>
                  <p className="mt-4 font-poppins text-2xl font-semibold text-slate-950">
                    {formatMoney(item.amount, currency, locale)}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      item.kind === "quote"
                        ? convertQuote(item.id)
                        : item.nextStatus
                          ? updateOrderStatus(item.id, item.nextStatus)
                          : null
                    }
                    disabled={pendingId === item.id}
                    className="admin-primary mt-5 w-full px-4 py-3 text-sm font-semibold disabled:opacity-50"
                  >
                    {pendingId === item.id ? "Procesando..." : item.actionLabel}
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Propuestas visibles"
            value={summary.quoteCount}
            hint={`${formatMoney(summary.quoteAmount, currency, locale)} dentro del filtro actual.`}
          />
          <StatCard
            label="Órdenes visibles"
            value={summary.orderCount}
            hint={`${formatMoney(summary.orderAmount, currency, locale)} dentro del filtro actual.`}
          />
          <StatCard
            label="Por convertir"
            value={actionableQuotes.length}
            hint="Aceptadas y todavía sin orden ligada."
          />
          <StatCard
            label="Valor en movimiento"
            value={formatMoney(summary.quoteAmount + summary.orderAmount, currency, locale)}
          />
        </section>

        <section className="ops-card p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "Todo", count: filteredQuotes.length + filteredOrders.length },
              {
                id: "open",
                label: "Abierto",
                count:
                  filteredQuotes.filter(
                    (quote) =>
                      quote.status !== QuoteStatus.CONVERTED &&
                      quote.status !== QuoteStatus.CANCELLED
                  ).length +
                  filteredOrders.filter(
                    (order) =>
                      order.status !== ServiceOrderStatus.PAID &&
                      order.status !== ServiceOrderStatus.CANCELLED
                  ).length,
              },
              {
                id: "closed",
                label: "Cerrado",
                count:
                  filteredQuotes.filter(
                    (quote) =>
                      quote.status === QuoteStatus.CONVERTED ||
                      quote.status === QuoteStatus.CANCELLED
                  ).length +
                  filteredOrders.filter(
                    (order) =>
                      order.status === ServiceOrderStatus.PAID ||
                      order.status === ServiceOrderStatus.CANCELLED
                  ).length,
              },
              {
                id: "charge",
                label: "Cobrar",
                count: filteredOrders.filter((order) => order.status === ServiceOrderStatus.COMPLETED)
                  .length,
              },
              {
                id: "work",
                label: "Trabajar",
                count: filteredOrders.filter(
                  (order) =>
                    order.status !== ServiceOrderStatus.COMPLETED &&
                    order.status !== ServiceOrderStatus.PAID &&
                    order.status !== ServiceOrderStatus.CANCELLED
                )
                  .length,
              },
              { id: "quotes", label: "Propuestas", count: filteredQuotes.length },
              { id: "orders", label: "Órdenes", count: filteredOrders.length },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFeedFilter(item.id as typeof feedFilter)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  feedFilter === item.id
                    ? "bg-[var(--ops-primary)] text-white"
                    : "border border-[var(--ops-border)] bg-white text-slate-700"
                }`}
              >
                {item.label} · {item.count}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-4">
            <div className="ops-card p-6 sm:p-8">
              <p className="ops-kicker">Seguimiento comercial</p>
              <h2 className="ops-section-title mt-3">Propuestas</h2>
              <p className="admin-muted mt-3 text-sm leading-6">
                Aquí ves propuestas abiertas, cerradas, nuevas o viejas dentro del rango actual.
              </p>
            </div>

            {visibleQuotes.length > 0 ? (
              visibleQuotes.map((quote) => (
                <article key={quote.id} className="ops-card p-6 sm:p-8">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                        <Link
                          href={getQuoteHref(quote.id)}
                          className="text-xl font-semibold text-slate-950 underline-offset-4 hover:underline"
                        >
                          {quote.customerName || "Cliente potencial"}
                        </Link>
                        <StatusBadge tone={getQuoteTone(quote.status)}>
                          {quote.status === QuoteStatus.DRAFT
                            ? "Borrador"
                            : quote.status === QuoteStatus.SENT
                              ? "Enviada"
                              : quote.status === QuoteStatus.ACCEPTED
                                ? "Aceptada"
                                : quote.status === QuoteStatus.CONVERTED
                                  ? "Convertida"
                                  : quote.status === QuoteStatus.CANCELLED
                                    ? "Cancelada"
                                    : "Expirada"}
                        </StatusBadge>
                      </div>
                      <p className="admin-muted mt-2 text-sm leading-6">
                        Creada: {formatDateTime(quote.createdAt, locale, timeZone)}
                      </p>
                      <p className="admin-muted text-sm leading-6">
                        {formatDateTime(quote.scheduledFor, locale, timeZone)}
                      </p>
                      {quote.customerPhone ? (
                        <p className="admin-muted text-sm leading-6">
                          Teléfono: {quote.customerPhone}
                        </p>
                      ) : null}
                      {quote.clientId ? (
                        <p className="admin-muted text-sm leading-6">
                          <Link
                            href={getClientHref(quote.clientId)}
                            className="font-semibold text-[var(--ops-primary)] underline-offset-4 hover:underline"
                          >
                            Ver cliente
                          </Link>
                        </p>
                      ) : null}
                      {quote.linkedOrderId ? (
                        <p className="admin-muted text-sm leading-6">
                          <Link
                            href={getOrderHref(quote.linkedOrderId)}
                            className="font-semibold text-[var(--ops-primary)] underline-offset-4 hover:underline"
                          >
                            Ver orden ligada
                          </Link>
                        </p>
                      ) : null}
                      {quote.notes ? (
                        <p className="admin-muted text-sm leading-6">Nota: {quote.notes}</p>
                      ) : null}
                      {quote.status === QuoteStatus.ACCEPTED && !quote.linkedOrderId ? (
                        <div className="mt-3">
                          <ActionHint tone="success">
                            Siguiente paso: convertir en orden.
                          </ActionHint>
                        </div>
                      ) : quote.status === QuoteStatus.DRAFT || quote.status === QuoteStatus.SENT ? (
                        <div className="mt-3">
                          <ActionHint tone="info">
                            Siguiente paso: dar seguimiento comercial.
                          </ActionHint>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-end">
                      <p className="font-poppins text-2xl font-semibold text-slate-950 sm:text-right">
                        {formatMoney(quote.total, currency, locale)}
                      </p>
                      {(quote.clientId || quote.customerName || quote.customerPhone) ? (
                        <Link
                          href={buildQuoteNewSaleHref(quote, newSaleHrefBase)}
                          className="admin-secondary inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-semibold sm:w-auto"
                        >
                          <PlusCircle size={16} />
                          Nueva venta
                        </Link>
                      ) : null}
                      {canEditQuoteDetails ? (
                        <Link
                          href={buildV2CaptureEditQuoteHref(quote.id)}
                          className="admin-secondary inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-semibold sm:w-auto"
                        >
                          <PencilLine size={16} />
                          Editar detalle
                        </Link>
                      ) : null}
                      {canConvertQuotes &&
                      quote.status === QuoteStatus.ACCEPTED &&
                      !quote.linkedOrderId ? (
                        <button
                          type="button"
                          onClick={() => convertQuote(quote.id)}
                          disabled={pendingId === quote.id}
                          className="admin-primary w-full px-4 py-3 text-sm font-semibold disabled:opacity-50 sm:w-auto"
                        >
                          {pendingId === quote.id ? "Convirtiendo..." : "Convertir ahora"}
                        </button>
                      ) : null}
                      <DownloadQuoteImageButton
                        branding={printBranding}
                        title={printBranding.title}
                        subtitle={printBranding.subtitle}
                        totalLabel={printBranding.totalLabel}
                        total={quote.total}
                        items={quote.items.map((item) => ({
                          label: item.label,
                          amount: item.total,
                        }))}
                        isLegacyTemplate={printBranding.isLegacyTemplate}
                        label={printBranding.downloadLabel || "Descargar cotización"}
                        className="admin-secondary inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-semibold sm:w-auto"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <AccountBreakdownCard
                      locale={locale}
                      currency={currency}
                      items={quote.items.map((item, index) => ({
                        id: item.id ?? `${quote.id}-${index}`,
                        label: item.label,
                        amount: item.total,
                      }))}
                      title="Detalle de la propuesta"
                      description="Deja el total a la vista y abre esto solo cuando quieras revisar el desglose."
                      detailTitle="Ver servicios, extras y ajustes"
                      detailDescription="Aquí se muestra el contenido completo de esta propuesta."
                    />
                  </div>
                </article>
              ))
            ) : (
              <section className="admin-surface rounded-3xl p-6 sm:p-8">
                <p className="text-sm font-medium text-slate-700">
                  No hay propuestas para los filtros seleccionados.
                </p>
              </section>
            )}
          </div>

          <div className="space-y-4">
            <div className="ops-card p-6 sm:p-8">
              <p className="ops-kicker">Seguimiento operativo</p>
              <h2 className="ops-section-title mt-3">Órdenes</h2>
              <p className="admin-muted mt-3 text-sm leading-6">
                Aquí ves órdenes abiertas, cerradas, viejas o recientes dentro del rango actual.
              </p>
            </div>

            {visibleOrders.length > 0 ? (
              visibleOrders.map((order) => {
                const nextStatus = getNextStatus(order.status);
                const nextActionLabel = getNextActionLabel(order.status);
                const canMoveOrder =
                  nextStatus === ServiceOrderStatus.PAID ? canChargeOrders : canProgressOrders;

                return (
                  <article key={order.id} className="ops-card p-6 sm:p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                          <Link
                            href={getOrderHref(order.id)}
                            className="text-xl font-semibold text-slate-950 underline-offset-4 hover:underline"
                          >
                            {order.customerName || "Cliente mostrador"}
                          </Link>
                          <StatusBadge tone={getOrderTone(order.status)}>
                            {STATUS_LABELS[order.status]}
                          </StatusBadge>
                        </div>
                        <p className="admin-muted mt-2 text-sm leading-6">
                          Creada: {formatDateTime(order.createdAt, locale, timeZone)}
                        </p>
                        <p className="admin-muted text-sm leading-6">
                          {formatDateTime(order.scheduledFor, locale, timeZone)}
                        </p>
                        {order.assignedToName ? (
                          <p className="admin-muted text-sm leading-6">
                            Responsable: {order.assignedToName}
                          </p>
                        ) : null}
                        {order.customerPhone ? (
                          <p className="admin-muted text-sm leading-6">
                            Teléfono: {order.customerPhone}
                          </p>
                        ) : null}
                        {order.clientId ? (
                          <p className="admin-muted text-sm leading-6">
                            <Link
                              href={getClientHref(order.clientId)}
                              className="font-semibold text-[var(--ops-primary)] underline-offset-4 hover:underline"
                            >
                              Ver cliente
                            </Link>
                          </p>
                        ) : null}
                        {order.sourceQuoteId ? (
                          <p className="admin-muted text-sm leading-6">
                            <Link
                              href={getQuoteHref(order.sourceQuoteId)}
                              className="font-semibold text-[var(--ops-primary)] underline-offset-4 hover:underline"
                            >
                              Ver propuesta origen
                            </Link>
                          </p>
                        ) : null}
                        {order.notes ? (
                          <p className="admin-muted text-sm leading-6">Nota: {order.notes}</p>
                        ) : null}
                        {nextActionLabel && canMoveOrder ? (
                          <div className="mt-3">
                            <ActionHint
                              tone={
                                order.status === ServiceOrderStatus.COMPLETED
                                  ? "warning"
                                  : order.status === ServiceOrderStatus.IN_PROGRESS
                                    ? "info"
                                    : "info"
                              }
                            >
                              Siguiente paso: {nextActionLabel.toLowerCase()}.
                            </ActionHint>
                          </div>
                        ) : null}
                      </div>
                      <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-end">
                        <p className="font-poppins text-2xl font-semibold text-slate-950 sm:text-right">
                          {formatMoney(order.total, currency, locale)}
                        </p>
                        <div className="w-full sm:min-w-[280px]">
                          <ServiceOrderActionsPanel
                            locale={locale}
                            timeZone={timeZone}
                            order={order}
                            canScheduleOrders={canScheduleOrders}
                            canProgressOrders={canProgressOrders}
                            canChargeOrders={canChargeOrders}
                            assignableUsers={assignableUsers}
                            printBranding={printBranding}
                            newSaleHrefBase={newSaleHrefBase}
                            editHref={
                              canEditOrderDetails
                                ? buildV2CaptureEditOrderHref(order.id)
                                : null
                            }
                            collapsed
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <AccountBreakdownCard
                        locale={locale}
                        currency={currency}
                        items={order.items.map((item, index) => ({
                          id: item.id ?? `${order.id}-${index}`,
                          label: item.label,
                          amount: item.total,
                        }))}
                        title="Detalle de la orden"
                        description="El total se mantiene visible y el desglose completo solo se abre cuando hace falta."
                        detailTitle="Ver servicios, extras y ajustes"
                        detailDescription="Aquí se muestra el contenido completo de esta orden."
                      />
                    </div>
                  </article>
                );
              })
            ) : (
              <section className="admin-surface rounded-3xl p-6 sm:p-8">
                <p className="text-sm font-medium text-slate-700">
                  No hay órdenes para los filtros seleccionados.
                </p>
              </section>
            )}
          </div>
        </section>
      </div>

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

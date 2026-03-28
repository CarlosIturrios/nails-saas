"use client";

import Link from "next/link";
import { ServiceOrderStatus } from "@prisma/client";
import {
  CalendarClock,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  NotebookText,
  Phone,
  Sparkles,
  UserRound,
  UserRoundPlus,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { DownloadQuoteImageButton } from "@/src/components/ui/DownloadQuoteImageButton";
import { getApiErrorMessage } from "@/src/components/ui/apiFeedback";
import { ActionHint, StatusBadge } from "@/src/components/ui/OperationsUI";
import Toast from "@/src/components/ui/Toast";
import {
  formatCalendarDate,
  formatDate,
  getTodayInTimezone,
  getUtcTimestamp,
  serializeDateTimeForApi,
  toDatetimeLocalValue,
} from "@/src/lib/dates";
import {
  canRescheduleServiceOrderStatus,
  getServiceOrderRescheduleBlockedReason,
} from "@/src/lib/service-order-rules";

interface ServiceAgendaBoardProps {
  locale: string;
  timeZone: string;
  selectedDate: string;
  canScheduleOrders: boolean;
  canProgressOrders: boolean;
  canChargeOrders: boolean;
  orderHrefPrefix?: string;
  quoteHrefPrefix?: string;
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
  orders: Array<{
    id: string;
    clientId: string | null;
    sourceQuoteId: string | null;
    status: ServiceOrderStatus;
    flowType: string;
    customerName: string | null;
    customerPhone: string | null;
    notes: string | null;
    scheduledFor: string | null;
    total: number;
    currency: string;
    assignedToName: string | null;
    assignedToUserId: string | null;
    items: Array<{
      id: string;
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

function formatMoney(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTime(value: string | null, locale: string, timeZone: string) {
  if (!value) {
    return "Sin horario";
  }

  return formatDate(value, {
    locale,
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDatetimeLocal(value: string | null, timeZone: string) {
  if (!value) {
    return "";
  }

  return toDatetimeLocalValue(value, timeZone);
}

function getNextStatus(status: ServiceOrderStatus) {
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
    return "Deja esta orden lista para empezar a trabajar.";
  }

  if (status === ServiceOrderStatus.CONFIRMED) {
    return "Ya llegó o está por llegar. Conviene iniciar el trabajo.";
  }

  if (status === ServiceOrderStatus.IN_PROGRESS) {
    return "Este servicio ya está en curso. Lo importante es terminarlo.";
  }

  if (status === ServiceOrderStatus.COMPLETED) {
    return "El trabajo ya quedó listo. Solo falta cobrar.";
  }

  return "Revisa horario, responsable y siguiente movimiento.";
}

function getOrderPriority(order: ServiceAgendaBoardProps["orders"][number]) {
  if (order.status === ServiceOrderStatus.COMPLETED) {
    return 0;
  }

  if (order.status === ServiceOrderStatus.IN_PROGRESS) {
    return 1;
  }

  if (order.status === ServiceOrderStatus.CONFIRMED && order.scheduledFor) {
    return 2;
  }

  if (order.status === ServiceOrderStatus.CONFIRMED) {
    return 3;
  }

  return 4;
}

function getOrderCategoryLabel(
  order: ServiceAgendaBoardProps["orders"][number],
  locale: string,
  timeZone: string
) {
  if (order.scheduledFor) {
    return `Cita ${formatTime(order.scheduledFor, locale, timeZone)}`;
  }

  return "Atención inmediata";
}

function getFocusLabel(order: ServiceAgendaBoardProps["orders"][number]) {
  if (order.status === ServiceOrderStatus.COMPLETED) {
    return "Cobro pendiente";
  }

  if (order.status === ServiceOrderStatus.IN_PROGRESS) {
    return "Trabajo en curso";
  }

  if (!order.assignedToUserId) {
    return "Falta responsable";
  }

  if (order.status === ServiceOrderStatus.CONFIRMED) {
    return "Lista para atender";
  }

  if (order.status === ServiceOrderStatus.DRAFT) {
    return "Revisar antes de iniciar";
  }

  return "Revisar";
}

function getActionHeadline(order: ServiceAgendaBoardProps["orders"][number]) {
  if (order.status === ServiceOrderStatus.COMPLETED) {
    return "Siguiente paso: cobrar";
  }

  if (order.status === ServiceOrderStatus.IN_PROGRESS) {
    return "Siguiente paso: terminar";
  }

  if (!order.assignedToUserId) {
    return "Siguiente paso: asignar responsable";
  }

  if (!order.scheduledFor) {
    return "Siguiente paso: atender o programar";
  }

  if (order.status === ServiceOrderStatus.CONFIRMED) {
    return "Siguiente paso: iniciar";
  }

  if (order.status === ServiceOrderStatus.DRAFT) {
    return "Siguiente paso: confirmar";
  }

  return "Siguiente paso: revisar";
}

function getUrgencyClass(order: ServiceAgendaBoardProps["orders"][number]) {
  if (order.status === ServiceOrderStatus.COMPLETED) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (order.status === ServiceOrderStatus.IN_PROGRESS) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (!order.assignedToUserId) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-sky-200 bg-sky-50 text-sky-700";
}

function getToneForOrder(order: ServiceAgendaBoardProps["orders"][number]) {
  if (order.status === ServiceOrderStatus.COMPLETED) {
    return "warning" as const;
  }

  if (order.status === ServiceOrderStatus.IN_PROGRESS) {
    return "info" as const;
  }

  if (!order.assignedToUserId) {
    return "danger" as const;
  }

  return "neutral" as const;
}

function formatSelectedDay(value: string, locale: string) {
  return formatCalendarDate(value, {
    locale,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function AgendaOverviewCard({
  icon,
  label,
  value,
  description,
  tone = "slate",
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  description: string;
  tone?: "sky" | "amber" | "emerald" | "rose" | "slate";
}) {
  const toneClassName = {
    sky: {
      surface: "border-sky-200 bg-sky-50/70",
      badge: "bg-white text-sky-700 ring-1 ring-sky-100",
    },
    amber: {
      surface: "border-amber-200 bg-amber-50/70",
      badge: "bg-white text-amber-700 ring-1 ring-amber-100",
    },
    emerald: {
      surface: "border-emerald-200 bg-emerald-50/70",
      badge: "bg-white text-emerald-700 ring-1 ring-emerald-100",
    },
    rose: {
      surface: "border-rose-200 bg-rose-50/70",
      badge: "bg-white text-rose-700 ring-1 ring-rose-100",
    },
    slate: {
      surface: "border-[#e8dece] bg-[#fffdfa]",
      badge: "bg-white text-slate-700 ring-1 ring-[#efe6d8]",
    },
  }[tone];

  return (
    <article className={`rounded-[28px] border p-5 sm:p-6 ${toneClassName.surface}`}>
      <span
        className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${toneClassName.badge}`}
      >
        {icon}
      </span>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 font-poppins text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}

function AgendaSectionBlock({
  icon,
  eyebrow,
  title,
  description,
  count,
  children,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="ops-card-soft p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--ops-primary)] shadow-sm ring-1 ring-[#efe6d8]">
              {icon}
            </span>
            <div className="min-w-0">
              <p className="ops-kicker">{eyebrow}</p>
              <h2 className="ops-section-title mt-2">{title}</h2>
              <p className="admin-muted mt-2 text-sm leading-6">{description}</p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center rounded-full border border-[#ddd1bf] bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            {count} {count === 1 ? "registro" : "registros"}
          </span>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function AgendaEmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="admin-surface rounded-[28px] p-6 sm:p-8">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff7eb] text-[var(--ops-primary)] ring-1 ring-[#efe6d8]">
          {icon}
        </span>
        <div>
          <p className="font-semibold text-slate-950">{title}</p>
          <p className="admin-muted mt-2 text-sm leading-6">{description}</p>
        </div>
      </div>
    </div>
  );
}

function AgendaMetaRow({
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

function buildAgendaOrderNewSaleHref(
  order: ServiceAgendaBoardProps["orders"][number],
  newSaleHrefBase: string
) {
  const params = new URLSearchParams();

  if (order.clientId) {
    params.set("clientId", order.clientId);
  }
  if (order.customerName) {
    params.set("customerName", order.customerName);
  }
  if (order.customerPhone) {
    params.set("customerPhone", order.customerPhone);
  }
  params.set("intent", "order");

  return `${newSaleHrefBase}?${params.toString()}`;
}

export function ServiceAgendaBoard({
  locale,
  timeZone,
  selectedDate,
  canScheduleOrders,
  canProgressOrders,
  canChargeOrders,
  orderHrefPrefix = "/ordenes",
  quoteHrefPrefix = "/propuestas",
  clientHrefPrefix = "/clientes",
  newSaleHrefBase = "/capturar",
  printBranding,
  assignableUsers,
  orders,
}: ServiceAgendaBoardProps) {
  const agendaBasePath = orderHrefPrefix.startsWith("/v2/") ? "/v2/agenda" : "/agenda";
  const getOrderHref = (orderId: string) => `${orderHrefPrefix}/${orderId}`;
  const getQuoteHref = (quoteId: string) => `${quoteHrefPrefix}/${quoteId}`;
  const getClientHref = (clientId: string) => `${clientHrefPrefix}/${clientId}`;
  const router = useRouter();
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});
  const [selectedAssignee, setSelectedAssignee] = useState("all");
  const [scheduleValues, setScheduleValues] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        orders.map((order) => [order.id, toDatetimeLocal(order.scheduledFor, timeZone)])
      )
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [assignmentValues, setAssignmentValues] = useState<Record<string, string>>(
    () => Object.fromEntries(orders.map((order) => [order.id, order.assignedToUserId ?? ""]))
  );

  useEffect(() => {
    setScheduleValues(
      Object.fromEntries(
        orders.map((order) => [order.id, toDatetimeLocal(order.scheduledFor, timeZone)])
      )
    );
    setAssignmentValues(
      Object.fromEntries(orders.map((order) => [order.id, order.assignedToUserId ?? ""]))
    );
  }, [orders, timeZone]);

  const filteredOrders = useMemo(() => {
    if (selectedAssignee === "all") {
      return orders;
    }

    if (selectedAssignee === "unassigned") {
      return orders.filter((order) => !order.assignedToUserId);
    }

    return orders.filter((order) => order.assignedToUserId === selectedAssignee);
  }, [orders, selectedAssignee]);

  const groupedOrders = useMemo(() => {
    const sorted = [...filteredOrders].sort((a, b) => {
      const priorityDiff = getOrderPriority(a) - getOrderPriority(b);

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      const aTime = getUtcTimestamp(a.scheduledFor);
      const bTime = getUtcTimestamp(b.scheduledFor);
      return aTime - bTime;
    });
    const scheduled = sorted.filter((order) => order.scheduledFor);
    const walkIns = sorted.filter((order) => !order.scheduledFor);

    return {
      scheduled,
      walkIns,
    };
  }, [filteredOrders]);
  const sortedForAction = useMemo(
    () =>
      [...filteredOrders].sort((a, b) => {
        const priorityDiff = getOrderPriority(a) - getOrderPriority(b);

        if (priorityDiff !== 0) {
          return priorityDiff;
        }

        const aTime = getUtcTimestamp(a.scheduledFor);
        const bTime = getUtcTimestamp(b.scheduledFor);
        return aTime - bTime;
      }),
    [filteredOrders]
  );
  const quickActions = sortedForAction
    .slice(0, 3)
    .flatMap((order) => {
      const nextStatus = getNextStatus(order.status);
      const canMoveOrder =
        nextStatus === ServiceOrderStatus.PAID ? canChargeOrders : canProgressOrders;
      const nextActionLabel = canMoveOrder ? getNextActionLabel(order.status) : null;

      if (nextStatus === null || nextActionLabel === null) {
        return [];
      }

      return [
        {
        id: order.id,
        title: order.customerName || "Cliente mostrador",
        badge: order.scheduledFor ? formatTime(order.scheduledFor, locale, timeZone) : "Inmediata",
        subtitle: getActionHint(order.status),
        total: order.total,
        nextStatus,
        nextActionLabel,
        },
      ];
    });
  const summary = useMemo(
    () => ({
      scheduled: groupedOrders.scheduled.length,
      walkIns: groupedOrders.walkIns.length,
      inProgress: filteredOrders.filter((order) => order.status === ServiceOrderStatus.IN_PROGRESS)
        .length,
      readyToCharge: filteredOrders.filter((order) => order.status === ServiceOrderStatus.COMPLETED)
        .length,
      unassigned: filteredOrders.filter((order) => !order.assignedToUserId).length,
    }),
    [filteredOrders, groupedOrders.scheduled.length, groupedOrders.walkIns.length]
  );

  async function updateStatus(orderId: string, status: ServiceOrderStatus) {
    setPendingOrderId(orderId);

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
      setPendingOrderId(null);
    }
  }

  async function updateSchedule(orderId: string) {
    setPendingOrderId(orderId);

    try {
      const response = await fetch(`/api/service-orders/${orderId}/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledFor: serializeDateTimeForApi(scheduleValues[orderId] || null, timeZone),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage({
            status: response.status,
            payloadError: payload.error,
            fallback: "No se pudo reprogramar la orden",
            permissionAction: "schedule_order",
          })
        );
      }

      setToast({
        message: "Horario actualizado correctamente",
        type: "success",
      });
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setPendingOrderId(null);
    }
  }

  async function updateAssignment(orderId: string) {
    setPendingOrderId(orderId);

    try {
      const response = await fetch(`/api/service-orders/${orderId}/assignment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedToUserId: assignmentValues[orderId] || null,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage({
            status: response.status,
            payloadError: payload.error,
            fallback: "No se pudo asignar responsable",
            permissionAction: "schedule_order",
          })
        );
      }

      setToast({
        message: "Responsable actualizado correctamente",
        type: "success",
      });
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setPendingOrderId(null);
    }
  }

  function toggleDetails(orderId: string) {
    setExpandedOrderIds((current) => ({
      ...current,
      [orderId]: !current[orderId],
    }));
  }

  function goToDate(date: string) {
    router.push(`${agendaBasePath}?date=${date}`);
  }

  const todayString = getTodayInTimezone(timeZone);
  const selectedDayLabel = formatSelectedDay(selectedDate, locale);

  function renderOrderCard(order: ServiceAgendaBoardProps["orders"][number]) {
    const nextStatus = getNextStatus(order.status);
    const nextActionLabel = getNextActionLabel(order.status);
    const canMoveOrder =
      nextStatus === ServiceOrderStatus.PAID ? canChargeOrders : canProgressOrders;
    const hasDetails = expandedOrderIds[order.id];
    const canReschedule = canRescheduleServiceOrderStatus(order.status);
    const rescheduleBlockedReason = getServiceOrderRescheduleBlockedReason(order.status);
    const hasScheduleValue = Boolean(scheduleValues[order.id]?.trim());

    return (
      <article key={order.id} className="admin-surface rounded-[28px] p-6 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href={getOrderHref(order.id)}
                className="font-poppins text-xl font-semibold text-slate-950 underline-offset-4 hover:underline"
              >
                {order.customerName || "Cliente mostrador"}
              </Link>
              <StatusBadge tone={getToneForOrder(order)}>
                {STATUS_LABELS[order.status]}
              </StatusBadge>
              <span
                className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getUrgencyClass(order)}`}
              >
                {getFocusLabel(order)}
              </span>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#ddd1bf] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                {order.scheduledFor ? <CalendarClock size={14} /> : <Clock3 size={14} />}
                {getOrderCategoryLabel(order, locale, timeZone)}
              </span>
            </div>

            <div className="mt-4">
              <ActionHint
                tone={
                  order.status === ServiceOrderStatus.COMPLETED
                    ? "warning"
                    : order.status === ServiceOrderStatus.IN_PROGRESS
                      ? "info"
                      : "info"
                }
              >
                {getActionHeadline(order)}
              </ActionHint>
            </div>
            <p className="admin-muted mt-2 text-sm leading-6">{getActionHint(order.status)}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {order.customerPhone ? (
                <AgendaMetaRow icon={<Phone size={16} />} label="Contacto">
                  {order.customerPhone}
                </AgendaMetaRow>
              ) : null}
              <AgendaMetaRow icon={<UserRound size={16} />} label="Responsable">
                {order.assignedToName || "Sin asignar"}
              </AgendaMetaRow>
              {order.clientId ? (
                <AgendaMetaRow icon={<ClipboardList size={16} />} label="Cliente">
                  <Link
                    href={getClientHref(order.clientId)}
                    className="font-semibold text-[var(--ops-primary)] underline-offset-4 hover:underline"
                  >
                    Abrir ficha del cliente
                  </Link>
                </AgendaMetaRow>
              ) : null}
              {order.sourceQuoteId ? (
                <AgendaMetaRow icon={<ClipboardList size={16} />} label="Origen">
                  <Link
                    href={getQuoteHref(order.sourceQuoteId)}
                    className="font-semibold text-[var(--ops-primary)] underline-offset-4 hover:underline"
                  >
                    Ver propuesta origen
                  </Link>
                </AgendaMetaRow>
              ) : null}
              {order.notes ? (
                <div className="sm:col-span-2">
                  <AgendaMetaRow icon={<NotebookText size={16} />} label="Nota">
                    {order.notes}
                  </AgendaMetaRow>
                </div>
              ) : null}
            </div>
          </div>

          <div className="xl:w-[320px] xl:max-w-[320px]">
            <div className="rounded-[24px] border border-[#efe6d8] bg-[#fffdfa] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Total del trabajo
              </p>
              <p className="mt-3 font-poppins text-3xl font-semibold text-slate-950">
                {formatMoney(order.total, order.currency, locale)}
              </p>

              <div className="mt-5 flex flex-col gap-3">
                {nextStatus && nextActionLabel && canMoveOrder ? (
                  <button
                    type="button"
                    onClick={() => updateStatus(order.id, nextStatus)}
                    disabled={pendingOrderId === order.id}
                    className="admin-primary w-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
                  >
                    {pendingOrderId === order.id ? "Actualizando..." : nextActionLabel}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => toggleDetails(order.id)}
                  className="admin-secondary w-full px-5 py-3 text-sm font-semibold"
                >
                  {hasDetails ? "Ocultar ajustes" : "Ver ajustes rápidos"}
                </button>
                {(order.clientId || order.customerName || order.customerPhone) ? (
                  <Link
                    href={buildAgendaOrderNewSaleHref(order, newSaleHrefBase)}
                    className="admin-secondary inline-flex w-full items-center justify-center px-5 py-3 text-sm font-semibold"
                  >
                    Nueva venta
                  </Link>
                ) : null}
                <DownloadQuoteImageButton
                  branding={printBranding}
                  title={printBranding.title}
                  subtitle={printBranding.subtitle}
                  totalLabel={printBranding.totalLabel}
                  total={order.total}
                  items={order.items.map((item) => ({
                    label: item.label,
                    amount: item.total,
                  }))}
                  isLegacyTemplate={printBranding.isLegacyTemplate}
                  label={printBranding.downloadLabel || "Descargar cotización"}
                  className="admin-secondary inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-semibold"
                />
              </div>
            </div>
          </div>
        </div>

        {hasDetails ? (
          <>
            <div className="mt-5 rounded-[24px] border border-[#efe6d8] bg-[#fffdfa] p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--ops-primary)] ring-1 ring-[#efe6d8]">
                    <UserRoundPlus size={18} />
                  </span>
                  <div>
                    <p className="admin-label text-xs font-semibold uppercase tracking-[0.14em]">
                      Ajustes rápidos
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Reprograma órdenes no iniciadas o ajusta responsable sin salir de esta tarjeta.
                    </p>
                  </div>
                </div>
              </div>
              {canScheduleOrders ? (
                <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
                  <label className="space-y-2">
                    <span className="admin-label block text-sm font-medium">
                      {order.scheduledFor ? "Mover horario" : "Poner horario"}
                    </span>
                    <input
                      type="datetime-local"
                      value={scheduleValues[order.id] ?? ""}
                      onChange={(event) =>
                        setScheduleValues((current) => ({
                          ...current,
                          [order.id]: event.target.value,
                        }))
                      }
                      disabled={!canReschedule || pendingOrderId === order.id}
                      className="admin-input w-full px-4 py-3 text-sm"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="admin-label block text-sm font-medium">Responsable</span>
                    <select
                      value={assignmentValues[order.id] ?? ""}
                      onChange={(event) =>
                        setAssignmentValues((current) => ({
                          ...current,
                          [order.id]: event.target.value,
                        }))
                      }
                      className="admin-input w-full px-4 py-3 text-sm"
                    >
                      <option value="">Sin asignar</option>
                      {assignableUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name || user.email}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
                    <button
                      type="button"
                      onClick={() => updateSchedule(order.id)}
                      disabled={
                        pendingOrderId === order.id || !canReschedule || !hasScheduleValue
                      }
                      className="admin-secondary w-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
                    >
                      {pendingOrderId === order.id
                        ? "Guardando..."
                        : order.scheduledFor
                          ? "Reprogramar"
                          : "Pasar a agenda"}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateAssignment(order.id)}
                      disabled={pendingOrderId === order.id}
                      className="admin-secondary w-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
                    >
                      {pendingOrderId === order.id ? "Guardando..." : "Guardar responsable"}
                    </button>
                  </div>
                </div>
              ) : null}
              {!canScheduleOrders ? (
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Tu perfil puede mover el trabajo, pero no cambiar horario ni responsable.
                </p>
              ) : (
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {canReschedule
                    ? "Solo se pueden reprogramar órdenes que todavía no empiezan."
                    : rescheduleBlockedReason}
                </p>
              )}
            </div>

            <div className="mt-5 rounded-[24px] border border-[#efe6d8] bg-[#fffdfa] p-5">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--ops-primary)] ring-1 ring-[#efe6d8]">
                  <Wrench size={18} />
                </span>
                <div className="min-w-0">
                  <p className="admin-label text-xs font-semibold uppercase tracking-[0.14em]">
                    Lo incluido
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Conceptos que forman este trabajo.
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-[#efe6d8] bg-white px-4 py-3"
                  >
                    <span className="text-sm text-slate-700">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatMoney(item.total, order.currency, locale)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </article>
    );
  }

  return (
    <>
      {quickActions.length > 0 ? (
        <section className="ops-action-card p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[var(--ops-primary)] shadow-sm ring-1 ring-[#efe6d8]">
                  <Sparkles size={18} />
                </span>
                <div>
                  <p className="ops-kicker">Empieza por aquí</p>
                  <h2 className="ops-section-title mt-1">Siguientes acciones recomendadas</h2>
                </div>
              </div>
              <p className="admin-muted mt-3 text-sm leading-6">
                La agenda ya te propone primero lo que conviene mover para que no tengas que revisar toda la lista.
              </p>
            </div>
            <div className="rounded-2xl border border-[#efe6d8] bg-white/80 px-4 py-3 text-sm text-slate-600">
              Te estamos mostrando lo que más urge avanzar primero.
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            {quickActions.map((item) => (
              <article key={item.id} className="ops-card-soft p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--ops-primary)] shadow-sm ring-1 ring-[#efe6d8]">
                      {item.nextActionLabel === "Cobrar" ? (
                        <CircleDollarSign size={18} />
                      ) : (
                        <CalendarClock size={18} />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="ops-kicker">Agenda activa</p>
                      <h3 className="mt-2 font-poppins text-xl font-semibold text-slate-950">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                  <span className="rounded-full border border-[#ddd1bf] bg-[#fffaf2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700">
                    {item.badge}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-700">{item.subtitle}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="font-poppins text-2xl font-semibold text-slate-950">
                    {formatMoney(item.total, orders[0]?.currency ?? "MXN", locale)}
                  </p>
                  <span className="rounded-full border border-[#efe6d8] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Acción sugerida
                  </span>
                </div>

                {item.nextStatus && item.nextActionLabel ? (
                  <button
                    type="button"
                    onClick={() => updateStatus(item.id, item.nextStatus)}
                    disabled={pendingOrderId === item.id}
                    className="admin-primary mt-5 w-full px-4 py-3 text-sm font-semibold disabled:opacity-50"
                  >
                    {pendingOrderId === item.id ? "Actualizando..." : item.nextActionLabel}
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="ops-card p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="ops-kicker">Agenda del día</p>
            <h2 className="ops-section-title mt-2">Qué está pasando hoy</h2>
            <p className="admin-muted mt-2 text-sm leading-6">
              Revisa el día de un vistazo, filtra por responsable y entra solo a lo que necesita movimiento.
            </p>
          </div>
          <div className="rounded-[24px] border border-[#efe6d8] bg-[#fffdfa] px-5 py-4 text-left lg:max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Fecha activa
            </p>
            <p className="mt-2 font-poppins text-xl font-semibold capitalize text-slate-950">
              {selectedDayLabel}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Cambia la fecha si necesitas revisar otro día.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-4 md:grid-cols-2">
            <AgendaOverviewCard
              icon={<CalendarClock size={18} />}
              label="Con horario"
              value={summary.scheduled}
              description="Trabajos que ya tienen una hora definida."
              tone="sky"
            />
            <AgendaOverviewCard
              icon={<Clock3 size={18} />}
              label="Atención inmediata"
              value={summary.walkIns}
              description="Registros que puedes tomar en cuanto haya espacio."
              tone="slate"
            />
            <AgendaOverviewCard
              icon={<Wrench size={18} />}
              label="En curso"
              value={summary.inProgress}
              description="Servicios que ya arrancaron y conviene cerrar."
              tone="amber"
            />
            <AgendaOverviewCard
              icon={<CircleDollarSign size={18} />}
              label="Listas para cobrar"
              value={summary.readyToCharge}
              description="Trabajo terminado que ya puede pasar a cobro."
              tone="emerald"
            />
            <div className="md:col-span-2">
              <AgendaOverviewCard
                icon={<UserRoundPlus size={18} />}
                label="Sin responsable"
                value={summary.unassigned}
                description={
                  summary.unassigned > 0
                    ? "Hay trabajo visible que todavía no tiene responsable."
                    : "Todo lo visible ya tiene responsable asignado."
                }
                tone="rose"
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-[#efe6d8] bg-[#fffdfa] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--ops-primary)] shadow-sm ring-1 ring-[#efe6d8]">
                <CalendarClock size={18} />
              </span>
              <div>
                <p className="ops-kicker">Filtrar agenda</p>
                <h3 className="mt-2 font-poppins text-xl font-semibold text-slate-950">
                  Mira solo lo que te importa
                </h3>
                <p className="admin-muted mt-2 text-sm leading-6">
                  Puedes revisar por responsable o saltar rápido a otra fecha.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <label className="space-y-2">
                <span className="admin-label block text-sm font-medium">Responsable</span>
                <select
                  value={selectedAssignee}
                  onChange={(event) => setSelectedAssignee(event.target.value)}
                  className="admin-input w-full px-4 py-3 text-sm"
                >
                  <option value="all">Todos los responsables</option>
                  <option value="unassigned">Solo sin asignar</option>
                  {assignableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="admin-label block text-sm font-medium">Fecha</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => goToDate(event.target.value)}
                  className="admin-input w-full px-4 py-3 text-sm"
                />
              </label>

              <button
                type="button"
                onClick={() => goToDate(todayString)}
                className="admin-secondary w-full px-4 py-3 text-sm font-semibold"
              >
                Volver a hoy
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <AgendaSectionBlock
          icon={<CalendarClock size={20} />}
          eyebrow="Con horario"
          title="Citas y trabajos programados"
          description="Aquí ves primero lo que ya tiene una hora comprometida."
          count={groupedOrders.scheduled.length}
        >
          {groupedOrders.scheduled.length > 0 ? (
            groupedOrders.scheduled.map((order) => renderOrderCard(order))
          ) : (
            <AgendaEmptyState
              icon={<CalendarClock size={20} />}
              title="No hay citas programadas para esta fecha"
              description="Si hoy trabajas por demanda, esta parte se mantendrá vacía hasta que alguien tenga horario asignado."
            />
          )}
        </AgendaSectionBlock>

        <AgendaSectionBlock
          icon={<Clock3 size={20} />}
          eyebrow="Atención inmediata"
          title="Trabajos sin horario fijo"
          description="Úsalo para servicios urgentes, mostrador o atención que entra sobre la marcha."
          count={groupedOrders.walkIns.length}
        >
          {groupedOrders.walkIns.length > 0 ? (
            groupedOrders.walkIns.map((order) => renderOrderCard(order))
          ) : (
            <AgendaEmptyState
              icon={<Clock3 size={20} />}
              title="No hay trabajo inmediato registrado"
              description="Cuando alguien llegue sin cita o quieras dejar algo pendiente para hoy, aparecerá aquí."
            />
          )}
        </AgendaSectionBlock>
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

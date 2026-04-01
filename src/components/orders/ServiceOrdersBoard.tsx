"use client";

import Link from "next/link";
import { ServiceOrderStatus } from "@prisma/client";
import {
  CalendarClock,
  CircleDollarSign,
  ClipboardList,
  Download,
  PencilLine,
  Phone,
  PlusCircle,
  Sparkles,
  UserRound,
  UserRoundPlus,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { AccountBreakdownCard } from "@/src/components/ui/AccountBreakdownCard";
import { OperationsFiltersBar } from "@/src/components/ui/OperationsFiltersBar";
import {
  ActionHint,
  StatusBadge,
} from "@/src/components/ui/OperationsUI";
import { getApiErrorMessage } from "@/src/components/ui/apiFeedback";
import { downloadQuoteImage } from "@/src/components/ui/downloadQuoteImage";
import Toast from "@/src/components/ui/Toast";
import { buildV2CaptureEditOrderHref } from "@/src/features/v2/routing";
import {
  formatDate,
  serializeDateTimeForApi,
  toDatetimeLocalValue,
} from "@/src/lib/dates";
import {
  canRescheduleServiceOrderStatus,
  getServiceOrderRescheduleBlockedReason,
} from "@/src/lib/service-order-rules";

interface ServiceOrdersBoardProps {
  locale: string;
  timeZone: string;
  rangePreset: "day" | "week" | "month" | "custom" | "all";
  anchorDate: string;
  rangeFrom: string | null;
  rangeTo: string | null;
  statusFilter: string;
  searchQuery: string;
  canScheduleOrders: boolean;
  canProgressOrders: boolean;
  canChargeOrders: boolean;
  canEditOrderDetails?: boolean;
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
    createdAt: string;
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

function formatDateLabel(value: string | null, locale: string, timeZone: string) {
  if (!value) {
    return "Atención inmediata";
  }

  return formatDate(value, {
    locale,
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
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

function getStatusTone(status: ServiceOrderStatus) {
  if (status === ServiceOrderStatus.COMPLETED || status === ServiceOrderStatus.PAID) {
    return "success" as const;
  }

  if (status === ServiceOrderStatus.IN_PROGRESS) {
    return "info" as const;
  }

  if (status === ServiceOrderStatus.CANCELLED) {
    return "danger" as const;
  }

  if (status === ServiceOrderStatus.CONFIRMED) {
    return "warning" as const;
  }

  return "neutral" as const;
}

function getNextActionLabel(status: ServiceOrderStatus) {
  if (status === ServiceOrderStatus.CONFIRMED) {
    return "Iniciar";
  }

  if (status === ServiceOrderStatus.IN_PROGRESS) {
    return "Marcar terminada";
  }

  if (status === ServiceOrderStatus.COMPLETED) {
    return "Cobrar";
  }

  return null;
}

function buildNewSaleHref(
  order: ServiceOrdersBoardProps["orders"][number],
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

function OrdersOverviewCard({
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
  tone?: "slate" | "amber" | "emerald" | "rose";
}) {
  const toneClassName = {
    slate: "border-[#e8dece] bg-[#fffdfa]",
    amber: "border-amber-200 bg-amber-50/70",
    emerald: "border-emerald-200 bg-emerald-50/70",
    rose: "border-rose-200 bg-rose-50/70",
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

function OrderMetaRow({
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

export function ServiceOrdersBoard({
  locale,
  timeZone,
  rangePreset,
  anchorDate,
  rangeFrom,
  rangeTo,
  statusFilter,
  searchQuery,
  canScheduleOrders,
  canProgressOrders,
  canChargeOrders,
  canEditOrderDetails = false,
  orderHrefPrefix = "/ordenes",
  quoteHrefPrefix = "/propuestas",
  clientHrefPrefix = "/clientes",
  newSaleHrefBase = "/capturar",
  printBranding,
  assignableUsers,
  orders,
}: ServiceOrdersBoardProps) {
  const getOrderHref = (orderId: string) => `${orderHrefPrefix}/${orderId}`;
  const getQuoteHref = (quoteId: string) => `${quoteHrefPrefix}/${quoteId}`;
  const getClientHref = (clientId: string) => `${clientHrefPrefix}/${clientId}`;
  const router = useRouter();
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState("all");
  const [scheduleValues, setScheduleValues] = useState<Record<string, string>>(
    () => Object.fromEntries(orders.map((order) => [order.id, toDatetimeLocal(order.scheduledFor, timeZone)]))
  );
  const [assignmentValues, setAssignmentValues] = useState<Record<string, string>>(
    () => Object.fromEntries(orders.map((order) => [order.id, order.assignedToUserId ?? ""]))
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
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
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesAssignee =
        selectedAssignee === "all"
          ? true
          : selectedAssignee === "unassigned"
            ? !order.assignedToUserId
            : order.assignedToUserId === selectedAssignee;

      if (!matchesAssignee) {
        return false;
      }

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "open"
            ? order.status !== ServiceOrderStatus.PAID &&
              order.status !== ServiceOrderStatus.CANCELLED
            : statusFilter === "closed"
              ? order.status === ServiceOrderStatus.PAID ||
                order.status === ServiceOrderStatus.CANCELLED
              : order.status === statusFilter;

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
  }, [normalizedSearch, orders, selectedAssignee, statusFilter]);
  const summary = useMemo(
    () => ({
      active: filteredOrders.length,
      inProgress: filteredOrders.filter(
        (order) => order.status === ServiceOrderStatus.IN_PROGRESS
      ).length,
      readyToCharge: filteredOrders.filter(
        (order) => order.status === ServiceOrderStatus.COMPLETED
      ).length,
      unassigned: filteredOrders.filter((order) => !order.assignedToUserId).length,
    }),
    [filteredOrders]
  );
  const ordersFiltersBar = (
    <OperationsFiltersBar
      rangePreset={rangePreset}
      anchorDate={anchorDate}
      from={rangeFrom}
      to={rangeTo}
      statusValue={statusFilter}
      statusParamName="status"
      statusLabel="Estado de la orden"
      statusOptions={[
        { value: "all", label: "Todos los estados" },
        { value: "open", label: "Abiertas" },
        { value: "closed", label: "Cerradas" },
        { value: ServiceOrderStatus.DRAFT, label: "Borrador" },
        { value: ServiceOrderStatus.CONFIRMED, label: "Pendiente" },
        { value: ServiceOrderStatus.IN_PROGRESS, label: "En proceso" },
        { value: ServiceOrderStatus.COMPLETED, label: "Terminada" },
        { value: ServiceOrderStatus.PAID, label: "Pagada" },
        { value: ServiceOrderStatus.CANCELLED, label: "Cancelada" },
      ]}
      searchValue={searchQuery}
      searchParamName="q"
      searchPlaceholder="Buscar por cliente, responsable o concepto"
      helperText="Usa rango, estado, responsable y búsqueda para revisar órdenes nuevas, viejas, abiertas o cerradas sin llenar toda la pantalla."
    />
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

  async function downloadOrderQuote(order: ServiceOrdersBoardProps["orders"][number]) {
    try {
      await downloadQuoteImage({
        branding: {
          ...printBranding,
          organizationName: printBranding.organizationName,
        },
        title: printBranding.title,
        subtitle: printBranding.subtitle,
        totalLabel: printBranding.totalLabel,
        total: order.total,
        isLegacyTemplate: printBranding.isLegacyTemplate,
        rows: order.items.map((item) => ({
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

  if (orders.length === 0) {
    return (
      <>
        {ordersFiltersBar}

        <section className="admin-surface rounded-3xl p-6 sm:p-8">
          <p className="text-sm font-medium text-slate-700">
            No hay órdenes registradas para este rango.
          </p>
          <p className="admin-muted mt-2 text-sm leading-6">
            Cambia el rango para revisar otro día, semana o periodo, o usa el cotizador para
            guardar la primera orden.
          </p>
        </section>
      </>
    );
  }

  return (
    <>
      {ordersFiltersBar}

      <section className="ops-card p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="ops-kicker">Operación activa</p>
            <h2 className="ops-section-title mt-2">Órdenes listas para mover</h2>
            <p className="admin-muted mt-2 text-sm leading-6">
              Revisa qué trabajo sigue abierto, qué ya está en curso y qué ya puedes cerrar o cobrar.
            </p>
          </div>
          <div className="rounded-[24px] border border-[#efe6d8] bg-[#fffdfa] px-5 py-4 lg:max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Enfoque
            </p>
            <p className="mt-2 font-poppins text-xl font-semibold text-slate-950">
              Total al frente
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              El monto queda visible todo el tiempo y el desglose se abre solo cuando quieras revisar la cuenta completa.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-4 md:grid-cols-2">
            <OrdersOverviewCard
              icon={<ClipboardList size={18} />}
              label="Visibles"
              value={summary.active}
              description="Órdenes dentro del filtro actual."
            />
            <OrdersOverviewCard
              icon={<Wrench size={18} />}
              label="En curso"
              value={summary.inProgress}
              description="Trabajo que ya arrancó y sigue ocupando tiempo del equipo."
              tone="amber"
            />
            <OrdersOverviewCard
              icon={<CircleDollarSign size={18} />}
              label="Listas para cobrar"
              value={summary.readyToCharge}
              description="Trabajo terminado que ya puede pasar a caja."
              tone="emerald"
            />
            <OrdersOverviewCard
              icon={<UserRoundPlus size={18} />}
              label="Sin responsable"
              value={summary.unassigned}
              description="Órdenes que todavía no tienen a quién atenderá."
              tone="rose"
            />
          </div>

          <div className="rounded-[28px] border border-[#efe6d8] bg-[#fffdfa] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--ops-primary)] shadow-sm ring-1 ring-[#efe6d8]">
                <Sparkles size={18} />
              </span>
              <div>
                <p className="ops-kicker">Filtrar órdenes</p>
                <h3 className="mt-2 font-poppins text-xl font-semibold text-slate-950">
                  Revisión por responsable
                </h3>
                <p className="admin-muted mt-2 text-sm leading-6">
                  Enfócate en una persona o revisa solo lo que sigue sin asignar.
                </p>
              </div>
            </div>

            <label className="mt-5 block space-y-2">
              <span className="admin-label block text-sm font-medium">Responsable</span>
              <select
                value={selectedAssignee}
                onChange={(event) => setSelectedAssignee(event.target.value)}
                className="admin-input w-full px-4 py-3 text-sm"
              >
                <option value="all">Todos</option>
                <option value="unassigned">Solo sin asignar</option>
                {assignableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {filteredOrders.length > 0 ? filteredOrders.map((order) => {
          const nextStatus = getNextStatus(order.status);
          const nextActionLabel = getNextActionLabel(order.status);
          const canMoveOrder =
            nextStatus === ServiceOrderStatus.PAID ? canChargeOrders : canProgressOrders;
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
                    <StatusBadge tone={getStatusTone(order.status)}>
                      {STATUS_LABELS[order.status]}
                    </StatusBadge>
                    <span className="inline-flex w-fit rounded-full border border-[#ddd1bf] bg-[#fffaf2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                      {order.flowType === "SCHEDULED" ? "Agendada" : "Inmediata"}
                    </span>
                  </div>

                  {nextActionLabel && canMoveOrder ? (
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
                        Siguiente paso: {nextActionLabel.toLowerCase()}.
                      </ActionHint>
                    </div>
                  ) : null}

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <OrderMetaRow icon={<CalendarClock size={16} />} label="Momento">
                      {formatDateLabel(order.scheduledFor, locale, timeZone)}
                    </OrderMetaRow>
                    <OrderMetaRow icon={<UserRound size={16} />} label="Responsable">
                      {order.assignedToName || "Sin asignar"}
                    </OrderMetaRow>
                    {order.customerPhone ? (
                      <OrderMetaRow icon={<Phone size={16} />} label="Contacto">
                        {order.customerPhone}
                      </OrderMetaRow>
                    ) : null}
                    <OrderMetaRow icon={<Wrench size={16} />} label="Tipo de atención">
                      {order.flowType === "SCHEDULED" ? "Agendada" : "Inmediata"}
                    </OrderMetaRow>
                    {order.clientId ? (
                      <OrderMetaRow icon={<ClipboardList size={16} />} label="Cliente">
                        <Link
                          href={getClientHref(order.clientId)}
                          className="font-semibold text-[var(--ops-primary)] underline-offset-4 hover:underline"
                        >
                          Abrir ficha del cliente
                        </Link>
                      </OrderMetaRow>
                    ) : null}
                    {order.sourceQuoteId ? (
                      <OrderMetaRow icon={<ClipboardList size={16} />} label="Origen">
                        <Link
                          href={getQuoteHref(order.sourceQuoteId)}
                          className="font-semibold text-[var(--ops-primary)] underline-offset-4 hover:underline"
                        >
                          Ver propuesta origen
                        </Link>
                      </OrderMetaRow>
                    ) : null}
                    {order.notes ? (
                      <div className="sm:col-span-2">
                        <OrderMetaRow icon={<ClipboardList size={16} />} label="Nota">
                          {order.notes}
                        </OrderMetaRow>
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
                          Total del trabajo
                        </p>
                        <p className="mt-2 font-poppins text-3xl font-semibold text-slate-950">
                          {formatMoney(order.total, order.currency, locale)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3">
                      <Link
                        href={buildNewSaleHref(order, newSaleHrefBase)}
                        className="admin-secondary inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-semibold"
                      >
                        <PlusCircle size={16} />
                        Nueva venta con este cliente
                      </Link>
                      {canEditOrderDetails ? (
                        <Link
                          href={buildV2CaptureEditOrderHref(order.id)}
                          className="admin-secondary inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-semibold"
                        >
                          <PencilLine size={16} />
                          Editar detalle
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void downloadOrderQuote(order)}
                        className="admin-secondary inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-semibold"
                      >
                        <Download size={16} />
                        {printBranding.downloadLabel || "Descargar cotización"}
                      </button>
                      {canScheduleOrders ? (
                        <button
                          type="button"
                          onClick={() => updateAssignment(order.id)}
                          disabled={pendingOrderId === order.id}
                          className="admin-secondary w-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
                        >
                          {pendingOrderId === order.id ? "Guardando..." : "Guardar responsable"}
                        </button>
                      ) : null}
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
                      {canScheduleOrders &&
                      order.status !== ServiceOrderStatus.CANCELLED &&
                      order.status !== ServiceOrderStatus.PAID ? (
                        <button
                          type="button"
                          onClick={() => updateStatus(order.id, ServiceOrderStatus.CANCELLED)}
                          disabled={pendingOrderId === order.id}
                          className="w-full rounded-2xl border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-600 disabled:opacity-60"
                        >
                          Cancelar
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <AccountBreakdownCard
                  locale={locale}
                  currency={order.currency}
                  total={order.total}
                  items={order.items.map((item) => ({
                    id: item.id,
                    label: item.label,
                    amount: item.total,
                  }))}
                  title="Lo que forma esta orden"
                  description="El total queda al frente y el detalle completo se abre solo cuando lo necesites revisar."
                  detailTitle="Ver servicios, extras y ajustes"
                  detailDescription="Aquí se muestra la cuenta completa ligada a esta orden."
                />
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,280px)_minmax(0,260px)_minmax(220px,1fr)] lg:items-end">
                {canScheduleOrders ? (
                  <>
                    <label className="space-y-2">
                      <span className="admin-label block text-sm font-medium">
                        {order.scheduledFor ? "Reprogramar para" : "Agendar para"}
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
                    <div className="space-y-3">
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
                      <div className="rounded-[24px] border border-[#efe6d8] bg-[#fffdfa] px-4 py-4 text-sm leading-6 text-slate-600">
                        {canReschedule
                          ? "Solo se pueden reprogramar órdenes que todavía no empiezan."
                          : rescheduleBlockedReason}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-[#efe6d8] bg-[#fffdfa] px-4 py-3 text-sm leading-6 text-slate-600 lg:col-span-3">
                    Tu perfil no puede cambiar horario ni responsable.
                  </div>
                )}
              </div>
            </article>
          );
        }) : (
          <section className="admin-surface rounded-3xl p-6 sm:p-8">
            <p className="text-sm font-medium text-slate-700">
              No hay órdenes para el filtro seleccionado.
            </p>
          </section>
        )}
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

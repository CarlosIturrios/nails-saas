"use client";

import Link from "next/link";
import { ServiceOrderStatus } from "@prisma/client";
import { ChevronDown, ChevronUp, PencilLine, PlusCircle, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { DownloadQuoteImageButton } from "@/src/components/ui/DownloadQuoteImageButton";
import { getApiErrorMessage } from "@/src/components/ui/apiFeedback";
import Toast from "@/src/components/ui/Toast";
import {
  formatDate,
  serializeDateTimeForApi,
  toDatetimeLocalValue,
} from "@/src/lib/dates";
import {
  canRescheduleServiceOrderStatus,
  getServiceOrderRescheduleBlockedReason,
} from "@/src/lib/service-order-rules";

interface AssignableUserOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface PrintableBranding {
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
}

interface ServiceOrderActionableItem {
  id?: string | null;
  label: string;
  total: number;
}

interface ServiceOrderActionable {
  id: string;
  clientId: string | null;
  sourceQuoteId?: string | null;
  status: ServiceOrderStatus;
  customerName: string | null;
  customerPhone: string | null;
  notes?: string | null;
  scheduledFor: string | null;
  total: number;
  currency: string;
  assignedToName?: string | null;
  assignedToUserId: string | null;
  items: ServiceOrderActionableItem[];
}

interface ServiceOrderActionsPanelProps {
  locale: string;
  timeZone: string;
  order: ServiceOrderActionable;
  canScheduleOrders: boolean;
  canProgressOrders: boolean;
  canChargeOrders: boolean;
  assignableUsers?: AssignableUserOption[];
  printBranding?: PrintableBranding;
  newSaleHrefBase?: string;
  editHref?: string | null;
  collapsed?: boolean;
  defaultExpanded?: boolean;
  toggleLabel?: string;
}

function formatMoney(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatScheduleSummary(value: string | null, locale: string, timeZone: string) {
  if (!value) {
    return "Sin horario programado";
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

function buildNewSaleHref(order: ServiceOrderActionable, newSaleHrefBase: string) {
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

export function ServiceOrderActionsPanel({
  locale,
  timeZone,
  order,
  canScheduleOrders,
  canProgressOrders,
  canChargeOrders,
  assignableUsers = [],
  printBranding,
  newSaleHrefBase,
  editHref,
  collapsed = false,
  defaultExpanded = false,
  toggleLabel = "Ver acciones de la orden",
}: ServiceOrderActionsPanelProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [scheduleValue, setScheduleValue] = useState(() =>
    toDatetimeLocal(order.scheduledFor, timeZone)
  );
  const [assignmentValue, setAssignmentValue] = useState(order.assignedToUserId ?? "");
  const [pendingAction, setPendingAction] = useState<
    "status" | "assignment" | "schedule" | "cancel" | null
  >(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    setScheduleValue(toDatetimeLocal(order.scheduledFor, timeZone));
    setAssignmentValue(order.assignedToUserId ?? "");
  }, [order.assignedToUserId, order.id, order.scheduledFor, timeZone]);

  const nextStatus = getNextStatus(order.status);
  const nextActionLabel = getNextActionLabel(order.status);
  const canMoveOrder = useMemo(() => {
    if (!nextStatus) {
      return false;
    }

    return nextStatus === ServiceOrderStatus.PAID ? canChargeOrders : canProgressOrders;
  }, [canChargeOrders, canProgressOrders, nextStatus]);
  const canCancelOrder =
    canScheduleOrders &&
    order.status !== ServiceOrderStatus.CANCELLED &&
    order.status !== ServiceOrderStatus.PAID;
  const canReschedule = canRescheduleServiceOrderStatus(order.status);
  const rescheduleBlockedReason = getServiceOrderRescheduleBlockedReason(order.status);
  const hasScheduleValue = Boolean(scheduleValue.trim());
  const newSaleHref = newSaleHrefBase ? buildNewSaleHref(order, newSaleHrefBase) : null;
  const assigneeSummary =
    order.assignedToName ||
    assignableUsers.find((user) => user.id === order.assignedToUserId)?.name ||
    "Sin asignar";

  async function updateStatus(status: ServiceOrderStatus) {
    setPendingAction(status === ServiceOrderStatus.CANCELLED ? "cancel" : "status");

    try {
      const response = await fetch(`/api/service-orders/${order.id}/status`, {
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
              status === ServiceOrderStatus.PAID
                ? "charge_order"
                : status === ServiceOrderStatus.CANCELLED
                  ? "schedule_order"
                  : "progress_order",
          })
        );
      }

      setToast({
        message:
          status === ServiceOrderStatus.CANCELLED
            ? "Orden cancelada correctamente"
            : "Orden actualizada correctamente",
        type: "success",
      });
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function updateAssignment() {
    setPendingAction("assignment");

    try {
      const response = await fetch(`/api/service-orders/${order.id}/assignment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedToUserId: assignmentValue || null,
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
      setPendingAction(null);
    }
  }

  async function updateSchedule() {
    setPendingAction("schedule");

    try {
      const response = await fetch(`/api/service-orders/${order.id}/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledFor: serializeDateTimeForApi(scheduleValue || null, timeZone),
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
      setPendingAction(null);
    }
  }

  const panel = (
    <div className="rounded-[24px] border border-[#efe6d8] bg-[#fffdfa] p-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--ops-primary)] shadow-sm ring-1 ring-[#efe6d8]">
          <Sparkles size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Acciones de la orden
          </p>
          <p className="mt-2 font-poppins text-3xl font-semibold text-slate-950">
            {formatMoney(order.total, order.currency, locale)}
          </p>
          <div className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
            <p>Responsable: {assigneeSummary}</p>
            <p>{formatScheduleSummary(order.scheduledFor, locale, timeZone)}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {newSaleHref ? (
          <Link
            href={newSaleHref}
            className="admin-secondary inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-semibold"
          >
            <PlusCircle size={16} />
            {order.clientId || order.customerName || order.customerPhone
              ? "Nueva venta con este cliente"
              : "Nueva venta"}
          </Link>
        ) : null}

        {editHref ? (
          <Link
            href={editHref}
            className="admin-secondary inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-semibold"
          >
            <PencilLine size={16} />
            Editar detalle
          </Link>
        ) : null}

        {printBranding ? (
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
        ) : null}

        {nextStatus && nextActionLabel && canMoveOrder ? (
          <button
            type="button"
            onClick={() => void updateStatus(nextStatus)}
            disabled={pendingAction !== null}
            className="admin-primary w-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
          >
            {pendingAction === "status" ? "Actualizando..." : nextActionLabel}
          </button>
        ) : null}

        {canCancelOrder ? (
          <button
            type="button"
            onClick={() => void updateStatus(ServiceOrderStatus.CANCELLED)}
            disabled={pendingAction !== null}
            className="w-full rounded-2xl border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-600 disabled:opacity-60"
          >
            {pendingAction === "cancel" ? "Cancelando..." : "Cancelar"}
          </button>
        ) : null}
      </div>

      {canScheduleOrders ? (
        <div className="mt-5 rounded-[20px] border border-[#efe6d8] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Ajustes rápidos
          </p>

          <div className="mt-4 grid gap-4">
            <label className="space-y-2">
              <span className="admin-label block text-sm font-medium">
                {order.scheduledFor ? "Reprogramar para" : "Agendar para"}
              </span>
              <input
                type="datetime-local"
                value={scheduleValue}
                onChange={(event) => setScheduleValue(event.target.value)}
                disabled={!canReschedule || pendingAction !== null}
                className="admin-input w-full px-4 py-3 text-sm"
              />
            </label>

            {assignableUsers.length > 0 ? (
              <label className="space-y-2">
                <span className="admin-label block text-sm font-medium">Responsable</span>
                <select
                  value={assignmentValue}
                  onChange={(event) => setAssignmentValue(event.target.value)}
                  disabled={pendingAction !== null}
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
            ) : null}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => void updateSchedule()}
              disabled={pendingAction !== null || !canReschedule || !hasScheduleValue}
              className="admin-secondary w-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
            >
              {pendingAction === "schedule"
                ? "Guardando..."
                : order.scheduledFor
                  ? "Reprogramar"
                  : "Pasar a agenda"}
            </button>

            {assignableUsers.length > 0 ? (
              <button
                type="button"
                onClick={() => void updateAssignment()}
                disabled={pendingAction !== null}
                className="admin-secondary w-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
              >
                {pendingAction === "assignment" ? "Guardando..." : "Guardar responsable"}
              </button>
            ) : null}
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            {canReschedule
              ? "Solo se pueden reprogramar órdenes que todavía no empiezan."
              : rescheduleBlockedReason}
          </p>
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      {collapsed ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="admin-secondary inline-flex w-full items-center justify-between gap-3 px-4 py-3 text-sm font-semibold"
          >
            <span>{expanded ? "Ocultar acciones" : toggleLabel}</span>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {expanded ? panel : null}
        </div>
      ) : (
        panel
      )}

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

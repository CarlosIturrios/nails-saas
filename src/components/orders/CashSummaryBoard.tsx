"use client";

import Link from "next/link";
import { ServiceOrderStatus } from "@prisma/client";

import { ServiceOrderActionsPanel } from "@/src/components/orders/ServiceOrderActionsPanel";
import {
  StatCard,
  StatusBadge,
} from "@/src/components/ui/OperationsUI";
import { buildV2CaptureEditOrderHref } from "@/src/features/v2/routing";
import { formatDate } from "@/src/lib/dates";

interface CashSummaryBoardProps {
  locale: string;
  timeZone: string;
  currency: string;
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
  canScheduleOrders: boolean;
  canProgressOrders: boolean;
  canChargeOrders: boolean;
  canEditOrderDetails?: boolean;
  assignableUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  summary: {
    totalOrders: number;
    paidCount: number;
    pendingCount: number;
    cancelledCount: number;
    paidAmount: number;
    pendingAmount: number;
    cancelledAmount: number;
  };
  paidOrders: Array<{
    id: string;
    clientId: string | null;
    customerName: string | null;
    customerPhone: string | null;
    total: number;
    paidAt: string | null;
    scheduledFor: string | null;
    status: ServiceOrderStatus;
    currency: string;
    notes: string | null;
    sourceQuoteId: string | null;
    assignedToName: string | null;
    assignedToUserId: string | null;
    items: Array<{
      id?: string | null;
      label: string;
      total: number;
    }>;
  }>;
  pendingOrders: Array<{
    id: string;
    clientId: string | null;
    customerName: string | null;
    customerPhone: string | null;
    total: number;
    status: ServiceOrderStatus;
    scheduledFor: string | null;
    currency: string;
    notes: string | null;
    sourceQuoteId: string | null;
    assignedToName: string | null;
    assignedToUserId: string | null;
    items: Array<{
      id?: string | null;
      label: string;
      total: number;
    }>;
  }>;
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
    return "Sin hora registrada";
  }

  return formatDate(value, {
    locale,
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  DRAFT: "Borrador",
  CONFIRMED: "Pendiente",
  IN_PROGRESS: "En proceso",
  COMPLETED: "Terminada",
  PAID: "Pagada",
  CANCELLED: "Cancelada",
};

export function CashSummaryBoard({
  locale,
  timeZone,
  currency,
  orderHrefPrefix = "/ordenes",
  clientHrefPrefix = "/clientes",
  newSaleHrefBase = "/capturar",
  printBranding,
  canScheduleOrders,
  canProgressOrders,
  canChargeOrders,
  canEditOrderDetails = false,
  assignableUsers,
  summary,
  paidOrders,
  pendingOrders,
}: CashSummaryBoardProps) {
  const getOrderHref = (orderId: string) => `${orderHrefPrefix}/${orderId}`;
  const getClientHref = (clientId: string) => `${clientHrefPrefix}/${clientId}`;
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Cobrado hoy"
          value={formatMoney(summary.paidAmount, currency, locale)}
          hint={`${summary.paidCount} ventas cerradas.`}
        />
        <StatCard
          label="Pendiente por cobrar"
          value={formatMoney(summary.pendingAmount, currency, locale)}
          hint={`${summary.pendingCount} órdenes abiertas.`}
        />
        <StatCard
          label="Órdenes del día"
          value={summary.totalOrders}
          hint={`${summary.cancelledCount} canceladas hoy.`}
        />
        <StatCard
          label="Valor cancelado"
          value={formatMoney(summary.cancelledAmount, currency, locale)}
          hint="Solo como referencia operativa."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="ops-card p-6 sm:p-8">
          <p className="ops-kicker">Pendientes</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">
            Lo que falta cerrar
          </h2>

          <div className="mt-5 space-y-3">
            {pendingOrders.length > 0 ? (
              pendingOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-[#efe6d8] bg-[#fffdfa] px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={getOrderHref(order.id)}
                        className="text-sm font-semibold text-slate-950 underline-offset-4 hover:underline"
                      >
                        {order.customerName || "Cliente mostrador"}
                      </Link>
                      <div className="mt-2">
                        <StatusBadge tone={order.status === ServiceOrderStatus.COMPLETED ? "warning" : "neutral"}>
                          {STATUS_LABELS[order.status]}
                        </StatusBadge>
                      </div>
                      {order.clientId ? (
                        <p className="mt-2 text-sm">
                          <Link
                            href={getClientHref(order.clientId)}
                          className="text-slate-600 underline-offset-4 hover:underline"
                        >
                          Ver cliente
                        </Link>
                      </p>
                    ) : null}
                      {order.scheduledFor ? (
                        <p className="admin-muted text-sm leading-6">
                          {formatDateTime(order.scheduledFor, locale, timeZone)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex w-full max-w-[280px] flex-col gap-3">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatMoney(order.total, order.currency, locale)}
                      </span>
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
                          canEditOrderDetails ? buildV2CaptureEditOrderHref(order.id) : null
                        }
                        collapsed
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="admin-muted text-sm leading-6">
                No hay órdenes pendientes por cobrar en esta fecha.
              </p>
            )}
          </div>
        </article>

        <article className="ops-card p-6 sm:p-8">
          <p className="ops-kicker">Cobradas</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">
            Ventas cerradas del día
          </h2>

          <div className="mt-5 space-y-3">
            {paidOrders.length > 0 ? (
              paidOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-[#efe6d8] bg-[#fffdfa] px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={getOrderHref(order.id)}
                        className="text-sm font-semibold text-slate-950 underline-offset-4 hover:underline"
                      >
                        {order.customerName || "Cliente mostrador"}
                      </Link>
                      {order.clientId ? (
                        <p className="mt-1 text-sm">
                          <Link
                            href={getClientHref(order.clientId)}
                            className="text-slate-600 underline-offset-4 hover:underline"
                          >
                            Ver cliente
                          </Link>
                        </p>
                      ) : null}
                      <p className="admin-muted mt-1 text-sm leading-6">
                        {formatDateTime(order.paidAt, locale, timeZone)}
                      </p>
                    </div>
                    <div className="flex w-full max-w-[280px] flex-col gap-3">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatMoney(order.total, order.currency, locale)}
                      </span>
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
                          canEditOrderDetails ? buildV2CaptureEditOrderHref(order.id) : null
                        }
                        collapsed
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="admin-muted text-sm leading-6">
                Aún no hay ventas cobradas en esta fecha.
              </p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

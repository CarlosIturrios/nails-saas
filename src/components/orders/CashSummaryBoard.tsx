"use client";

import Link from "next/link";
import { ServiceOrderStatus } from "@prisma/client";

import {
  StatCard,
  StatusBadge,
} from "@/src/components/ui/OperationsUI";
import { formatDate } from "@/src/lib/dates";

interface CashSummaryBoardProps {
  locale: string;
  timeZone: string;
  currency: string;
  orderHrefPrefix?: string;
  clientHrefPrefix?: string;
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
    total: number;
    paidAt: string | null;
    status: ServiceOrderStatus;
  }>;
  pendingOrders: Array<{
    id: string;
    clientId: string | null;
    customerName: string | null;
    total: number;
    status: ServiceOrderStatus;
    scheduledFor: string | null;
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
                    <span className="text-sm font-semibold text-slate-900">
                      {formatMoney(order.total, currency, locale)}
                    </span>
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
                    <span className="text-sm font-semibold text-slate-900">
                      {formatMoney(order.total, currency, locale)}
                    </span>
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

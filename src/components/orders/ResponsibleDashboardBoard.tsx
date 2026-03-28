import Link from "next/link";
import { ServiceOrderStatus } from "@prisma/client";

import {
  StatCard,
  StatusBadge,
} from "@/src/components/ui/OperationsUI";
import { formatDate } from "@/src/lib/dates";

interface ResponsibleDashboardBoardProps {
  locale: string;
  timeZone: string;
  currency: string;
  currentUserId: string;
  orderHrefPrefix?: string;
  clientHrefPrefix?: string;
  overall: {
    totalOrders: number;
    assignedOrders: number;
    unassignedOrders: number;
    paidAmount: number;
    pendingAmount: number;
  };
  groups: Array<{
    key: string;
    responsibleId: string | null;
    responsibleName: string;
    responsibleEmail: string | null;
    isUnassigned: boolean;
    totalOrders: number;
    pendingCount: number;
    inProgressCount: number;
    scheduledCount: number;
    paidAmount: number;
    pendingAmount: number;
    orders: Array<{
      id: string;
      clientId: string | null;
      customerName: string | null;
      total: number;
      currency: string;
      status: ServiceOrderStatus;
      scheduledFor: Date | null;
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

function formatDateTime(value: Date | null, locale: string, timeZone: string) {
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

export function ResponsibleDashboardBoard({
  locale,
  timeZone,
  currency,
  currentUserId,
  orderHrefPrefix = "/ordenes",
  clientHrefPrefix = "/clientes",
  overall,
  groups,
}: ResponsibleDashboardBoardProps) {
  const getOrderHref = (orderId: string) => `${orderHrefPrefix}/${orderId}`;
  const getClientHref = (clientId: string) => `${clientHrefPrefix}/${clientId}`;
  return (
    <div className="ops-page">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Órdenes del día" value={overall.totalOrders} />
        <StatCard
          label="Asignadas"
          value={overall.assignedOrders}
          hint={`${overall.unassignedOrders} sin responsable`}
        />
        <StatCard
          label="Cobrado"
          value={formatMoney(overall.paidAmount, currency, locale)}
        />
        <StatCard
          label="Pendiente"
          value={formatMoney(overall.pendingAmount, currency, locale)}
        />
      </section>

      <section className="space-y-4">
        {groups.map((group) => (
          <article
            key={group.key}
            className={`ops-card p-6 sm:p-8 ${
              group.responsibleId === currentUserId ? "ring-2 ring-[#c6a66b]" : ""
            }`}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <h2 className="font-poppins text-2xl font-semibold text-slate-950">
                    {group.responsibleName}
                  </h2>
                  {group.responsibleId === currentUserId ? (
                    <StatusBadge tone="info">Mi carga</StatusBadge>
                  ) : null}
                  {group.isUnassigned ? (
                    <StatusBadge tone="warning">Sin asignar</StatusBadge>
                  ) : null}
                </div>
                {group.responsibleEmail ? (
                  <p className="admin-muted mt-2 text-sm leading-6">
                    {group.responsibleEmail}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Órdenes" value={group.totalOrders} />
                <StatCard label="Pendientes" value={group.pendingCount} />
                <StatCard label="En proceso" value={group.inProgressCount} />
                <StatCard
                  label="Cobrado"
                  value={formatMoney(group.paidAmount, currency, locale)}
                />
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <StatCard label="Programadas" value={group.scheduledCount} />
              <StatCard
                label="Pendiente monetario"
                value={formatMoney(group.pendingAmount, currency, locale)}
              />
            </div>

            <div className="mt-5 space-y-3">
              {group.orders.map((order) => (
                <div
                  key={order.id}
                  className="ops-card-soft flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0">
                    <Link
                      href={getOrderHref(order.id)}
                      className="text-sm font-semibold text-slate-950 underline-offset-4 hover:underline"
                    >
                      {order.customerName || "Cliente mostrador"}
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge
                        tone={
                          order.status === ServiceOrderStatus.PAID ||
                          order.status === ServiceOrderStatus.COMPLETED
                            ? "success"
                            : order.status === ServiceOrderStatus.IN_PROGRESS
                              ? "info"
                              : order.status === ServiceOrderStatus.CANCELLED
                                ? "danger"
                                : order.status === ServiceOrderStatus.CONFIRMED
                                  ? "warning"
                                  : "neutral"
                        }
                      >
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
                    <p className="admin-muted text-sm leading-6">
                      {formatDateTime(order.scheduledFor, locale, timeZone)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-950">
                    {formatMoney(order.total, order.currency, locale)}
                  </span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

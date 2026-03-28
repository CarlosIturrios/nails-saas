import { redirect } from "next/navigation";

import { CashSummaryBoard } from "@/src/components/orders/CashSummaryBoard";
import { V2PageHero } from "@/src/features/v2/shell/V2Shell";
import { V2_ROUTES } from "@/src/features/v2/routing";
import { normalizeCalendarDateParam, parseCalendarDateAtMidday } from "@/src/lib/dates";
import { requireCurrentOrganization } from "@/src/lib/organizations/context";
import { getOperationalFrontendAccess } from "@/src/lib/authorization";
import { getServiceOrderCashSummary } from "@/src/lib/service-orders";

interface V2CashPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function V2CashPage({ searchParams }: V2CashPageProps) {
  const context = await requireCurrentOrganization();
  const timeZone =
    context.currentTimezone?.timezone ?? context.currentOrganization.defaultTimezone;
  const query = await searchParams;
  const access = getOperationalFrontendAccess(
    context.user.role,
    context.currentOrganizationRole,
    context.currentOrganizationPermissionProfile
  );

  if (!access.canUseCash) {
    redirect(V2_ROUTES.more);
  }

  const selectedDate = normalizeCalendarDateParam(query.date, timeZone);
  const cashSummary = await getServiceOrderCashSummary(context.currentOrganizationId, {
    date: parseCalendarDateAtMidday(selectedDate, timeZone),
    timeZone,
    limit: 100,
  });
  const currency = cashSummary.orders[0]?.currency ?? "MXN";

  return (
    <div className="space-y-5">
      <V2PageHero
        kicker="Cierre"
        title="Caja"
        description="Aqui revisas cuanto ya se cobro, cuanto sigue pendiente y cuanto quedo cancelado."
      />

      <CashSummaryBoard
        locale="es-MX"
        timeZone={timeZone}
        currency={currency}
        orderHrefPrefix={V2_ROUTES.orders}
        clientHrefPrefix={V2_ROUTES.clients}
        summary={cashSummary.totals}
        paidOrders={cashSummary.paidOrders.map((order) => ({
          id: order.id,
          clientId: order.client?.id ?? null,
          customerName: order.customerName ?? order.client?.name ?? null,
          total: order.total,
          paidAt: order.paidAt?.toISOString() ?? null,
          status: order.status,
        }))}
        pendingOrders={cashSummary.pendingOrders.map((order) => ({
          id: order.id,
          clientId: order.client?.id ?? null,
          customerName: order.customerName ?? order.client?.name ?? null,
          total: order.total,
          status: order.status,
          scheduledFor: order.scheduledFor?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}

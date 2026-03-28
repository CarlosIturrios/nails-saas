import { redirect } from "next/navigation";

import { ResponsibleDashboardBoard } from "@/src/components/orders/ResponsibleDashboardBoard";
import { getOrganizationQuoteConfigView } from "@/src/features/quote-calculator-v2/lib/config";
import { V2PageHero } from "@/src/features/v2/shell/V2Shell";
import { V2_ROUTES } from "@/src/features/v2/routing";
import { normalizeCalendarDateParam, parseCalendarDateAtMidday } from "@/src/lib/dates";
import { requireCurrentOrganization } from "@/src/lib/organizations/context";
import { getOperationalFrontendAccess } from "@/src/lib/authorization";
import { getResponsibleOperationalDashboard } from "@/src/lib/service-orders";

interface V2DashboardPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function V2DashboardPage({ searchParams }: V2DashboardPageProps) {
  const context = await requireCurrentOrganization();
  const timeZone =
    context.currentTimezone?.timezone ?? context.currentOrganization.defaultTimezone;
  const query = await searchParams;
  const access = getOperationalFrontendAccess(
    context.user.role,
    context.currentOrganizationRole,
    context.currentOrganizationPermissionProfile
  );

  if (!access.canUseDashboard) {
    redirect(V2_ROUTES.more);
  }

  const selectedDate = normalizeCalendarDateParam(query.date, timeZone);
  const [dashboard, quoteConfig] = await Promise.all([
    getResponsibleOperationalDashboard(context.currentOrganizationId, {
      date: parseCalendarDateAtMidday(selectedDate, timeZone),
      timeZone,
      limit: 200,
    }),
    getOrganizationQuoteConfigView(context.currentOrganizationId),
  ]);

  return (
    <div className="space-y-5">
      <V2PageHero
        kicker="Supervision"
        title="Tablero"
        description="Revisa como va el dia por responsable y detecta carga, pendientes y cobros."
      />

      <ResponsibleDashboardBoard
        locale="es-MX"
        timeZone={timeZone}
        currency={quoteConfig.branding.currency}
        currentUserId={context.user.id}
        orderHrefPrefix={V2_ROUTES.orders}
        clientHrefPrefix={V2_ROUTES.clients}
        overall={dashboard.overall}
        groups={dashboard.groups.map((group) => ({
          ...group,
          orders: group.orders.map((order) => ({
            ...order,
            clientId: order.client?.id ?? null,
          })),
        }))}
      />
    </div>
  );
}

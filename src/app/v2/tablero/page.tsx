import { redirect } from "next/navigation";

import { ResponsibleDashboardBoard } from "@/src/components/orders/ResponsibleDashboardBoard";
import { getOrganizationQuoteConfigView } from "@/src/features/quote-calculator-v2/lib/config";
import { getEffectiveLogoUrl } from "@/src/features/quote-calculator-v2/lib/logo";
import { V2PageHero } from "@/src/features/v2/shell/V2Shell";
import { V2_ROUTES } from "@/src/features/v2/routing";
import { normalizeCalendarDateParam, parseCalendarDateAtMidday } from "@/src/lib/dates";
import { requireCurrentOrganization } from "@/src/lib/organizations/context";
import {
  canManageOrganization,
  getOperationalFrontendAccess,
} from "@/src/lib/authorization";
import {
  getResponsibleOperationalDashboard,
  listAssignableUsersForOrganization,
} from "@/src/lib/service-orders";

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
  const canEditOrderDetails = canManageOrganization(
    context.user.role,
    context.currentOrganizationRole
  );

  if (!access.canUseDashboard) {
    redirect(V2_ROUTES.more);
  }

  const selectedDate = normalizeCalendarDateParam(query.date, timeZone);
  const [dashboard, quoteConfig, assignableUsers] = await Promise.all([
    getResponsibleOperationalDashboard(context.currentOrganizationId, {
      date: parseCalendarDateAtMidday(selectedDate, timeZone),
      timeZone,
      limit: 200,
    }),
    getOrganizationQuoteConfigView(context.currentOrganizationId),
    listAssignableUsersForOrganization(context.currentOrganizationId),
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
        newSaleHrefBase={V2_ROUTES.capture}
        printBranding={{
          businessName: quoteConfig.branding.businessName,
          organizationName:
            context.currentOrganization?.name ?? quoteConfig.branding.businessName,
          logoUrl: getEffectiveLogoUrl({
            businessType: quoteConfig.branding.businessType,
            logoUrl: quoteConfig.branding.logoUrl,
          }),
          primaryColor: quoteConfig.branding.primaryColor,
          secondaryColor: quoteConfig.branding.secondaryColor,
          currency: quoteConfig.branding.currency,
          language: quoteConfig.branding.language,
          title:
            quoteConfig.ui.titles.calculatorTitle ||
            `Cotizacion ${quoteConfig.branding.businessName}`,
          subtitle:
            quoteConfig.ui.titles.calculatorSubtitle || "Resumen de servicios y extras",
          totalLabel: quoteConfig.ui.labels.total || "Total",
          downloadLabel: quoteConfig.ui.labels.download || "Descargar cotizacion",
          isLegacyTemplate: quoteConfig.branding.quoteTemplate === "legacy_gica",
        }}
        canScheduleOrders={access.canScheduleOrders}
        canProgressOrders={access.canProgressOrders}
        canChargeOrders={access.canChargeOrders}
        canEditOrderDetails={canEditOrderDetails}
        assignableUsers={assignableUsers}
        overall={dashboard.overall}
        groups={dashboard.groups.map((group) => ({
          key: group.key,
          responsibleId: group.responsibleId,
          responsibleName: group.responsibleName,
          responsibleEmail: group.responsibleEmail,
          isUnassigned: group.isUnassigned,
          totalOrders: group.totalOrders,
          pendingCount: group.pendingCount,
          inProgressCount: group.inProgressCount,
          scheduledCount: group.scheduledCount,
          paidAmount: group.paidAmount,
          pendingAmount: group.pendingAmount,
          orders: group.orders.map((order) => ({
            clientId: order.client?.id ?? null,
            id: order.id,
            customerName: order.customerName ?? order.client?.name ?? null,
            customerPhone:
              order.customerPhone ??
              (order.client?.phone && order.client.phone !== "SIN_TELEFONO"
                ? order.client.phone
                : null),
            total: order.total,
            currency: order.currency,
            status: order.status,
            scheduledFor: order.scheduledFor?.toISOString() ?? null,
            sourceQuoteId: order.sourceQuoteId ?? null,
            notes: order.notes,
            assignedToName: order.assignedTo
              ? `${order.assignedTo.firstName} ${order.assignedTo.lastName}`.trim()
              : null,
            assignedToUserId: order.assignedTo?.id ?? null,
            items: order.items.map((item) => ({
              id: item.id,
              label: item.label,
              total: item.total,
            })),
          })),
        }))}
      />
    </div>
  );
}

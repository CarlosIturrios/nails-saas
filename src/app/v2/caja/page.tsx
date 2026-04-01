import { redirect } from "next/navigation";

import { CashSummaryBoard } from "@/src/components/orders/CashSummaryBoard";
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
  getServiceOrderCashSummary,
  listAssignableUsersForOrganization,
} from "@/src/lib/service-orders";

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
  const canEditOrderDetails = canManageOrganization(
    context.user.role,
    context.currentOrganizationRole
  );

  if (!access.canUseCash) {
    redirect(V2_ROUTES.more);
  }

  const selectedDate = normalizeCalendarDateParam(query.date, timeZone);
  const [cashSummary, quoteConfig, assignableUsers] = await Promise.all([
    getServiceOrderCashSummary(context.currentOrganizationId, {
      date: parseCalendarDateAtMidday(selectedDate, timeZone),
      timeZone,
      limit: 100,
    }),
    getOrganizationQuoteConfigView(context.currentOrganizationId),
    listAssignableUsersForOrganization(context.currentOrganizationId),
  ]);
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
        summary={cashSummary.totals}
        paidOrders={cashSummary.paidOrders.map((order) => ({
          id: order.id,
          clientId: order.client?.id ?? null,
          customerName: order.customerName ?? order.client?.name ?? null,
          customerPhone:
            order.customerPhone ??
            (order.client?.phone && order.client.phone !== "SIN_TELEFONO"
              ? order.client.phone
              : null),
          total: order.total,
          paidAt: order.paidAt?.toISOString() ?? null,
          scheduledFor: order.scheduledFor?.toISOString() ?? null,
          status: order.status,
          currency: order.currency,
          notes: order.notes,
          sourceQuoteId: order.sourceQuoteId ?? null,
          assignedToName: order.assignedTo
            ? `${order.assignedTo.firstName} ${order.assignedTo.lastName}`.trim()
            : null,
          assignedToUserId: order.assignedTo?.id ?? null,
          items: order.items.map((item) => ({
            id: item.id,
            label: item.label,
            total: item.total,
          })),
        }))}
        pendingOrders={cashSummary.pendingOrders.map((order) => ({
          id: order.id,
          clientId: order.client?.id ?? null,
          customerName: order.customerName ?? order.client?.name ?? null,
          customerPhone:
            order.customerPhone ??
            (order.client?.phone && order.client.phone !== "SIN_TELEFONO"
              ? order.client.phone
              : null),
          total: order.total,
          status: order.status,
          scheduledFor: order.scheduledFor?.toISOString() ?? null,
          currency: order.currency,
          notes: order.notes,
          sourceQuoteId: order.sourceQuoteId ?? null,
          assignedToName: order.assignedTo
            ? `${order.assignedTo.firstName} ${order.assignedTo.lastName}`.trim()
            : null,
          assignedToUserId: order.assignedTo?.id ?? null,
          items: order.items.map((item) => ({
            id: item.id,
            label: item.label,
            total: item.total,
          })),
        }))}
      />
    </div>
  );
}

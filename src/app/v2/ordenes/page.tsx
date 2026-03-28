import { redirect } from "next/navigation";

import { ServiceOrdersBoard } from "@/src/components/orders/ServiceOrdersBoard";
import { getOrganizationQuoteConfigView } from "@/src/features/quote-calculator-v2/lib/config";
import { resolveOperationsDateRange } from "@/src/features/v2/lib/filters";
import { getEffectiveLogoUrl } from "@/src/features/quote-calculator-v2/lib/logo";
import { V2PageHero } from "@/src/features/v2/shell/V2Shell";
import { V2_ROUTES } from "@/src/features/v2/routing";
import { requireCurrentOrganization } from "@/src/lib/organizations/context";
import { getOperationalFrontendAccess } from "@/src/lib/authorization";
import {
  listAssignableUsersForOrganization,
  listServiceOrdersForOrganization,
} from "@/src/lib/service-orders";

interface V2OrdersPageProps {
  searchParams: Promise<{
    preset?: string;
    date?: string;
    from?: string;
    to?: string;
    status?: string;
    q?: string;
  }>;
}

export default async function V2OrdersPage({ searchParams }: V2OrdersPageProps) {
  const context = await requireCurrentOrganization();
  const timeZone =
    context.currentTimezone?.timezone ?? context.currentOrganization.defaultTimezone;
  const query = await searchParams;
  const access = getOperationalFrontendAccess(
    context.user.role,
    context.currentOrganizationRole,
    context.currentOrganizationPermissionProfile
  );

  if (!access.canUseOrders) {
    redirect(V2_ROUTES.more);
  }

  const range = resolveOperationsDateRange(
    {
      preset: query.preset,
      date: query.date,
      from: query.from,
      to: query.to,
    },
    timeZone
  );

  const [orders, assignableUsers, quoteConfig] = await Promise.all([
    listServiceOrdersForOrganization(context.currentOrganizationId, {
      from: range.start,
      to: range.end,
      limit: range.preset === "all" ? 500 : 300,
    }),
    listAssignableUsersForOrganization(context.currentOrganizationId),
    getOrganizationQuoteConfigView(context.currentOrganizationId),
  ]);

  return (
    <div className="space-y-5">
      <V2PageHero
        kicker="Trabajo activo"
        title="Ordenes"
        description="Aquí revisas el trabajo ya creado, filtras por responsable y mueves lo que sigue pendiente de atender, cerrar o cobrar."
      />

      <ServiceOrdersBoard
        locale="es-MX"
        timeZone={timeZone}
        rangePreset={range.preset}
        anchorDate={range.anchorDate}
        rangeFrom={range.from}
        rangeTo={range.to}
        statusFilter={query.status ?? "all"}
        searchQuery={query.q ?? ""}
        orderHrefPrefix={V2_ROUTES.orders}
        quoteHrefPrefix={V2_ROUTES.quotes}
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
        assignableUsers={assignableUsers}
        canScheduleOrders={access.canScheduleOrders}
        canProgressOrders={access.canProgressOrders}
        canChargeOrders={access.canChargeOrders}
        orders={orders.map((order) => ({
          id: order.id,
          clientId: order.client?.id ?? null,
          sourceQuoteId: order.sourceQuoteId ?? null,
          status: order.status,
          flowType: order.flowType,
          customerName: order.customerName ?? order.client?.name ?? null,
          customerPhone:
            order.customerPhone ??
            (order.client?.phone && order.client.phone !== "SIN_TELEFONO"
              ? order.client.phone
              : null),
          notes: order.notes,
          scheduledFor: order.scheduledFor?.toISOString() ?? null,
          createdAt: order.createdAt.toISOString(),
          total: order.total,
          currency: order.currency,
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

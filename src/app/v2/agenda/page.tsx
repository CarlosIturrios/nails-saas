import { redirect } from "next/navigation";

import { ServiceAgendaBoard } from "@/src/components/orders/ServiceAgendaBoard";
import { getOrganizationQuoteConfigView } from "@/src/features/quote-calculator-v2/lib/config";
import { getEffectiveLogoUrl } from "@/src/features/quote-calculator-v2/lib/logo";
import { V2PageHero } from "@/src/features/v2/shell/V2Shell";
import { V2_ROUTES } from "@/src/features/v2/routing";
import { getIndustryPresentation } from "@/src/features/v2/presentation";
import { normalizeCalendarDateParam, parseCalendarDateAtMidday } from "@/src/lib/dates";
import { requireCurrentOrganization } from "@/src/lib/organizations/context";
import {
  canManageOrganization,
  getOperationalFrontendAccess,
} from "@/src/lib/authorization";
import {
  listAssignableUsersForOrganization,
  listServiceOrdersForOrganization,
} from "@/src/lib/service-orders";

interface V2AgendaPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function V2AgendaPage({ searchParams }: V2AgendaPageProps) {
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

  if (!access.canUseAgenda) {
    redirect(V2_ROUTES.pending);
  }

  const selectedDate = normalizeCalendarDateParam(query.date, timeZone);
  const [orders, assignableUsers, quoteConfig] = await Promise.all([
    listServiceOrdersForOrganization(context.currentOrganizationId, {
      date: parseCalendarDateAtMidday(selectedDate, timeZone),
      timeZone,
      limit: 100,
    }),
    listAssignableUsersForOrganization(context.currentOrganizationId),
    getOrganizationQuoteConfigView(context.currentOrganizationId),
  ]);
  const presentation = getIndustryPresentation({
    businessType: quoteConfig.branding.businessType,
  });

  return (
    <div className="space-y-5">
      <V2PageHero
        kicker="Tu día"
        title={presentation.agendaLabel}
        description={`Revisa quien llega hoy, que urge mover y que ya puedes avanzar o cobrar. Aqui controlas ${presentation.itemGroupLabel.toLowerCase()} cuando el tiempo importa.`}
      />

      <ServiceAgendaBoard
        locale="es-MX"
        timeZone={timeZone}
        selectedDate={selectedDate}
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
        canScheduleOrders={access.canScheduleOrders}
        canProgressOrders={access.canProgressOrders}
        canChargeOrders={access.canChargeOrders}
        canEditOrderDetails={canEditOrderDetails}
        assignableUsers={assignableUsers}
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

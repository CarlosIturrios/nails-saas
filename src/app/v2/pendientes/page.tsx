import { redirect } from "next/navigation";

import { PendingOperationsBoard } from "@/src/components/operations/PendingOperationsBoard";
import { getOrganizationQuoteConfigView } from "@/src/features/quote-calculator-v2/lib/config";
import { resolveOperationsDateRange } from "@/src/features/v2/lib/filters";
import { getEffectiveLogoUrl } from "@/src/features/quote-calculator-v2/lib/logo";
import { V2PageHero } from "@/src/features/v2/shell/V2Shell";
import { V2_ROUTES } from "@/src/features/v2/routing";
import { getIndustryPresentation } from "@/src/features/v2/presentation";
import { requireCurrentOrganization } from "@/src/lib/organizations/context";
import { getOperationalFrontendAccess } from "@/src/lib/authorization";
import { listQuotesForOrganization } from "@/src/lib/quotes";
import { listServiceOrdersForOrganization } from "@/src/lib/service-orders";

interface V2PendingPageProps {
  searchParams: Promise<{
    preset?: string;
    date?: string;
    from?: string;
    to?: string;
    quoteStatus?: string;
    orderStatus?: string;
    q?: string;
  }>;
}

export default async function V2PendingPage({ searchParams }: V2PendingPageProps) {
  const context = await requireCurrentOrganization();
  const query = await searchParams;
  const access = getOperationalFrontendAccess(
    context.user.role,
    context.currentOrganizationRole,
    context.currentOrganizationPermissionProfile
  );

  if (!access.canUsePending) {
    redirect(V2_ROUTES.capture);
  }

  const range = resolveOperationsDateRange({
    preset: query.preset,
    date: query.date,
    from: query.from,
    to: query.to,
  });

  const [quotes, orders, quoteConfig] = await Promise.all([
    listQuotesForOrganization(context.currentOrganizationId, {
      from: range.start,
      to: range.end,
      limit: range.preset === "all" ? 500 : 300,
    }),
    listServiceOrdersForOrganization(context.currentOrganizationId, {
      from: range.start,
      to: range.end,
      limit: range.preset === "all" ? 500 : 300,
    }),
    getOrganizationQuoteConfigView(context.currentOrganizationId),
  ]);
  const presentation = getIndustryPresentation({
    businessType: quoteConfig.branding.businessType,
  });

  return (
    <div className="space-y-5">
      <V2PageHero
        kicker="Seguimiento"
        title={presentation.pendingLabel}
        description={`Aqui mueves lo que ya existe: cobros, conversiones y ${presentation.itemGroupLabel.toLowerCase()} activos del dia.`}
      />

      <PendingOperationsBoard
        locale="es-MX"
        currency={quoteConfig.branding.currency}
        rangePreset={range.preset}
        anchorDate={range.anchorDate}
        rangeFrom={range.from}
        rangeTo={range.to}
        quoteStatusFilter={query.quoteStatus ?? "all"}
        orderStatusFilter={query.orderStatus ?? "all"}
        searchQuery={query.q ?? ""}
        quoteHrefPrefix={V2_ROUTES.quotes}
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
        canConvertQuotes={access.canConvertQuotes}
        canProgressOrders={access.canProgressOrders}
        canChargeOrders={access.canChargeOrders}
        quotes={quotes.map((quote) => ({
          id: quote.id,
          clientId: quote.client?.id ?? null,
          linkedOrderId: quote.serviceOrders[0]?.id ?? null,
          status: quote.status,
          customerName: quote.customerName ?? quote.client?.name ?? null,
          customerPhone:
            quote.customerPhone ??
            (quote.client?.phone && quote.client.phone !== "SIN_TELEFONO"
              ? quote.client.phone
              : null),
          notes: quote.notes,
          scheduledFor: quote.scheduledFor?.toISOString() ?? null,
          createdAt: quote.createdAt.toISOString(),
          total: quote.total,
          items: quote.items.map((item) => ({
            id: item.id,
            label: item.label,
            total: item.total,
          })),
        }))}
        orders={orders.map((order) => ({
          id: order.id,
          clientId: order.client?.id ?? null,
          sourceQuoteId: order.sourceQuoteId ?? null,
          status: order.status,
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
          assignedToName: order.assignedTo
            ? `${order.assignedTo.firstName} ${order.assignedTo.lastName}`.trim()
            : null,
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

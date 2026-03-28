import { redirect } from "next/navigation";

import { QuotesBoard } from "@/src/components/quotes/QuotesBoard";
import { getOrganizationQuoteConfigView } from "@/src/features/quote-calculator-v2/lib/config";
import { resolveOperationsDateRange } from "@/src/features/v2/lib/filters";
import { getEffectiveLogoUrl } from "@/src/features/quote-calculator-v2/lib/logo";
import { V2PageHero } from "@/src/features/v2/shell/V2Shell";
import { V2_ROUTES } from "@/src/features/v2/routing";
import { requireCurrentOrganization } from "@/src/lib/organizations/context";
import { getOperationalFrontendAccess } from "@/src/lib/authorization";
import { listQuotesForOrganization } from "@/src/lib/quotes";
import { listAssignableUsersForOrganization } from "@/src/lib/service-orders";

interface V2QuotesPageProps {
  searchParams: Promise<{
    preset?: string;
    date?: string;
    from?: string;
    to?: string;
    status?: string;
    q?: string;
  }>;
}

export default async function V2QuotesPage({ searchParams }: V2QuotesPageProps) {
  const context = await requireCurrentOrganization();
  const timeZone =
    context.currentTimezone?.timezone ?? context.currentOrganization.defaultTimezone;
  const query = await searchParams;
  const access = getOperationalFrontendAccess(
    context.user.role,
    context.currentOrganizationRole,
    context.currentOrganizationPermissionProfile
  );

  if (!access.canUseQuotes) {
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

  const [quotes, assignableUsers, quoteConfig] = await Promise.all([
    listQuotesForOrganization(context.currentOrganizationId, {
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
        kicker="Antes de vender"
        title="Propuestas"
        description="Aquí revisas lo que todavía está en propuesta, lo que ya aceptaron y lo que ya conviene convertir en trabajo."
      />

      <QuotesBoard
        locale="es-MX"
        timeZone={timeZone}
        rangePreset={range.preset}
        anchorDate={range.anchorDate}
        rangeFrom={range.from}
        rangeTo={range.to}
        statusFilter={query.status ?? "all"}
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
        assignableUsers={assignableUsers}
        canConvertQuotes={access.canConvertQuotes}
        quotes={quotes.map((quote) => ({
          id: quote.id,
          clientId: quote.client?.id ?? null,
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
          currency: quote.currency,
          linkedOrderId: quote.serviceOrders[0]?.id ?? null,
          items: quote.items.map((item) => ({
            id: item.id,
            label: item.label,
            total: item.total,
          })),
        }))}
      />
    </div>
  );
}

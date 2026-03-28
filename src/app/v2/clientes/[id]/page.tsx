import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteStatus, ServiceOrderStatus } from "@prisma/client";

import { AccountBreakdownCard } from "@/src/components/ui/AccountBreakdownCard";
import { DownloadQuoteImageButton } from "@/src/components/ui/DownloadQuoteImageButton";
import { QuickLinkCard, StatCard, StatusBadge } from "@/src/components/ui/OperationsUI";
import { getOrganizationQuoteConfigView } from "@/src/features/quote-calculator-v2/lib/config";
import { getEffectiveLogoUrl } from "@/src/features/quote-calculator-v2/lib/logo";
import { V2PageHero } from "@/src/features/v2/shell/V2Shell";
import {
  V2_ROUTES,
  buildV2NewSaleHref,
  getV2OrderHref,
  getV2QuoteHref,
} from "@/src/features/v2/routing";
import { formatDate } from "@/src/lib/dates";
import { requireCurrentOrganization } from "@/src/lib/organizations/context";
import { getClientCommercialHistory } from "@/src/lib/quotes";

interface V2ClientHistoryPageProps {
  params: Promise<{ id: string }>;
}

const STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  DRAFT: "Borrador",
  CONFIRMED: "Pendiente",
  IN_PROGRESS: "En proceso",
  COMPLETED: "Terminada",
  PAID: "Pagada",
  CANCELLED: "Cancelada",
};

const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  ACCEPTED: "Aceptada",
  CONVERTED: "Convertida",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada",
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
    return "Sin actividad reciente";
  }

  return formatDate(value, {
    locale,
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function V2ClientHistoryPage({ params }: V2ClientHistoryPageProps) {
  const [{ id }, context] = await Promise.all([params, requireCurrentOrganization()]);
  const timeZone =
    context.currentTimezone?.timezone ?? context.currentOrganization.defaultTimezone;

  let client;
  const quoteConfig = await getOrganizationQuoteConfigView(context.currentOrganizationId);

  try {
    client = await getClientCommercialHistory(context.currentOrganizationId, id);
  } catch {
    notFound();
  }

  const currency = client.orders[0]?.currency ?? client.quotes[0]?.currency ?? "MXN";
  const printBranding = {
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
  };

  return (
    <div className="space-y-5">
      <V2PageHero
        kicker="Cliente"
        title={client.name}
        description="Esta ficha combina preventa y operacion para que puedas vender, consultar historial y reimprimir sin perder contexto."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total cotizado" value={formatMoney(client.totalQuoted, currency, "es-MX")} />
        <StatCard label="Total pagado" value={formatMoney(client.totalPaid, currency, "es-MX")} />
        <StatCard
          label="Ultima actividad"
          value={formatDateTime(client.lastActivityAt, "es-MX", timeZone)}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {client.quotes[0] ? (
          <QuickLinkCard
            href={getV2QuoteHref(client.quotes[0].id)}
            title="Ultima propuesta"
            description="Abre la propuesta mas reciente de este cliente."
            icon="sale"
          />
        ) : null}
        {client.orders[0] ? (
          <QuickLinkCard
            href={getV2OrderHref(client.orders[0].id)}
            title="Ultima orden"
            description="Abre la ultima orden o trabajo realizado."
            icon="today"
          />
        ) : null}
        <QuickLinkCard
          href={V2_ROUTES.pending}
          title="Pendientes"
          description="Vuelve a la cola principal de seguimiento."
          icon="today"
        />
        <QuickLinkCard
          href={buildV2NewSaleHref({
            clientId: client.id,
            customerName: client.name,
            customerPhone: client.phone,
          })}
          title="Nueva venta"
          description="Captura otra venta o cotizacion para este cliente."
          icon="sale"
        />
      </section>

      {client.quotes.length > 0 ? (
        <section className="space-y-4">
          <div className="rounded-[24px] border border-[#e8dece] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Preventa</p>
            <h2 className="mt-3 font-poppins text-xl font-semibold text-slate-950">Propuestas</h2>
          </div>
          {client.quotes.map((quote) => (
            <article key={quote.id} className="rounded-[28px] border border-[#e8dece] bg-white p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={getV2QuoteHref(quote.id)}
                      className="font-poppins text-lg font-semibold text-slate-950 underline-offset-4 hover:underline"
                    >
                      Ver propuesta
                    </Link>
                    <StatusBadge tone={quote.status === QuoteStatus.ACCEPTED || quote.status === QuoteStatus.CONVERTED ? "success" : quote.status === QuoteStatus.SENT ? "info" : quote.status === QuoteStatus.CANCELLED ? "danger" : quote.status === QuoteStatus.EXPIRED ? "warning" : "neutral"}>
                      {QUOTE_STATUS_LABELS[quote.status]}
                    </StatusBadge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {formatDateTime(
                      quote.convertedAt ?? quote.acceptedAt ?? quote.createdAt,
                      "es-MX",
                      timeZone
                    )}
                  </p>
                </div>
                <p className="font-poppins text-2xl font-semibold text-slate-950">
                  {formatMoney(quote.total, quote.currency, "es-MX")}
                </p>
              </div>

              <div className="mt-4">
                <DownloadQuoteImageButton
                  branding={printBranding}
                  title={quoteConfig.ui.titles.calculatorTitle || `Cotizacion ${quoteConfig.branding.businessName}`}
                  subtitle={quoteConfig.ui.titles.calculatorSubtitle || "Resumen de servicios y extras"}
                  totalLabel={quoteConfig.ui.labels.total || "Total"}
                  total={quote.total}
                  items={quote.items.map((item) => ({ label: item.label, amount: item.total }))}
                  isLegacyTemplate={quoteConfig.branding.quoteTemplate === "legacy_gica"}
                  label={quoteConfig.ui.labels.download || "Descargar cotizacion"}
                />
              </div>

              <div className="mt-4">
                <AccountBreakdownCard
                  locale="es-MX"
                  currency={quote.currency}
                  total={quote.total}
                  items={quote.items.map((item) => ({
                    id: item.id,
                    label: item.label,
                    amount: item.total,
                  }))}
                  title="Cuenta de esta propuesta"
                  description="Mantén el total a la vista y abre el detalle solo cuando quieras revisar conceptos."
                  detailTitle="Ver detalle"
                  detailDescription="Aquí se muestra el desglose completo de esta propuesta."
                />
              </div>
            </article>
          ))}
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="rounded-[24px] border border-[#e8dece] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Operacion</p>
          <h2 className="mt-3 font-poppins text-xl font-semibold text-slate-950">Ordenes</h2>
        </div>
        {client.orders.map((order) => (
          <article key={order.id} className="rounded-[28px] border border-[#e8dece] bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={getV2OrderHref(order.id)}
                    className="font-poppins text-lg font-semibold text-slate-950 underline-offset-4 hover:underline"
                  >
                    Ver orden
                  </Link>
                  <StatusBadge tone={order.status === ServiceOrderStatus.COMPLETED || order.status === ServiceOrderStatus.PAID ? "success" : order.status === ServiceOrderStatus.IN_PROGRESS ? "info" : order.status === ServiceOrderStatus.CANCELLED ? "danger" : order.status === ServiceOrderStatus.CONFIRMED ? "warning" : "neutral"}>
                    {STATUS_LABELS[order.status]}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {formatDateTime(order.paidAt ?? order.createdAt, "es-MX", timeZone)}
                </p>
              </div>
              <p className="font-poppins text-2xl font-semibold text-slate-950">
                {formatMoney(order.total, order.currency, "es-MX")}
              </p>
            </div>

            <div className="mt-4">
              <DownloadQuoteImageButton
                branding={printBranding}
                title={quoteConfig.ui.titles.calculatorTitle || `Cotizacion ${quoteConfig.branding.businessName}`}
                subtitle={quoteConfig.ui.titles.calculatorSubtitle || "Resumen de servicios y extras"}
                totalLabel={quoteConfig.ui.labels.total || "Total"}
                total={order.total}
                items={order.items.map((item) => ({ label: item.label, amount: item.total }))}
                isLegacyTemplate={quoteConfig.branding.quoteTemplate === "legacy_gica"}
                label={quoteConfig.ui.labels.download || "Descargar cotizacion"}
              />
            </div>

            <div className="mt-4">
              <AccountBreakdownCard
                locale="es-MX"
                currency={order.currency}
                total={order.total}
                items={order.items.map((item) => ({
                  id: item.id,
                  label: item.label,
                  amount: item.total,
                }))}
                title="Cuenta de esta orden"
                description="El total se queda visible y el detalle completo se abre solo cuando lo necesites."
                detailTitle="Ver detalle"
                detailDescription="Aquí se muestra todo lo que forma esta orden."
              />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

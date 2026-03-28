import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteStatus } from "@prisma/client";

import { AccountBreakdownCard } from "@/src/components/ui/AccountBreakdownCard";
import { DownloadQuoteImageButton } from "@/src/components/ui/DownloadQuoteImageButton";
import { QuickLinkCard, StatusBadge } from "@/src/components/ui/OperationsUI";
import { getOrganizationQuoteConfigView } from "@/src/features/quote-calculator-v2/lib/config";
import { getEffectiveLogoUrl } from "@/src/features/quote-calculator-v2/lib/logo";
import { V2PageHero } from "@/src/features/v2/shell/V2Shell";
import {
  V2_ROUTES,
  buildV2NewSaleHref,
  getV2ClientHref,
  getV2OrderHref,
} from "@/src/features/v2/routing";
import { requireCurrentOrganization } from "@/src/lib/organizations/context";
import { getQuoteById } from "@/src/lib/quotes";

interface V2QuoteDetailPageProps {
  params: Promise<{ id: string }>;
}

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

function formatDateTime(value: Date | null, locale: string) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function V2QuoteDetailPage({ params }: V2QuoteDetailPageProps) {
  const [{ id }, context] = await Promise.all([params, requireCurrentOrganization()]);

  let quote;
  const quoteConfig = await getOrganizationQuoteConfigView(context.currentOrganizationId);

  try {
    quote = await getQuoteById(context.currentOrganizationId, id);
  } catch {
    notFound();
  }

  const printBranding = {
    businessName: quoteConfig.branding.businessName,
    organizationName: context.currentOrganization?.name ?? quoteConfig.branding.businessName,
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
        kicker="Propuesta"
        title={quote.customerName || "Cliente potencial"}
        description="Aqui revisas la propuesta completa, reimprimes y saltas a cliente u orden ligada."
        aside={
          <StatusBadge tone={quote.status === QuoteStatus.ACCEPTED || quote.status === QuoteStatus.CONVERTED ? "success" : quote.status === QuoteStatus.SENT ? "info" : quote.status === QuoteStatus.CANCELLED ? "danger" : quote.status === QuoteStatus.EXPIRED ? "warning" : "neutral"}>
            {QUOTE_STATUS_LABELS[quote.status]}
          </StatusBadge>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quote.client?.id ? (
          <QuickLinkCard href={getV2ClientHref(quote.client.id)} title="Abrir cliente" description="Consulta historial y actividad." icon="clients" />
        ) : null}
        {quote.serviceOrders[0]?.id ? (
          <QuickLinkCard href={getV2OrderHref(quote.serviceOrders[0].id)} title="Abrir orden ligada" description="Continua ejecucion o cobro." icon="today" />
        ) : null}
        <QuickLinkCard href={V2_ROUTES.pending} title="Pendientes" description="Vuelve a la cola principal." icon="today" />
        <QuickLinkCard
          href={buildV2NewSaleHref({
            clientId: quote.client?.id ?? null,
            customerName: quote.customerName,
            customerPhone: quote.customerPhone,
            intent: "quote",
          })}
          title="Nueva venta"
          description="Empieza otra captura reutilizando el contexto."
          icon="sale"
        />
      </section>

      <section className="rounded-[28px] border border-[#e8dece] bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm leading-6 text-slate-600">Creada: {formatDateTime(quote.createdAt, "es-MX")}</p>
            <p className="text-sm leading-6 text-slate-600">Programada: {formatDateTime(quote.scheduledFor, "es-MX")}</p>
            {quote.notes ? <p className="text-sm leading-6 text-slate-600">Nota: {quote.notes}</p> : null}
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-right font-poppins text-3xl font-semibold text-slate-950">
              {formatMoney(quote.total, quote.currency, "es-MX")}
            </p>
            <DownloadQuoteImageButton
              branding={printBranding}
              title={quoteConfig.ui.titles.calculatorTitle || `Cotizacion ${quoteConfig.branding.businessName}`}
              subtitle={quoteConfig.ui.titles.calculatorSubtitle || "Resumen de servicios y extras"}
              totalLabel={quoteConfig.ui.labels.total || "Total"}
              total={quote.total}
              items={quote.items.map((item) => ({ label: item.label, amount: item.total }))}
              isLegacyTemplate={quoteConfig.branding.quoteTemplate === "legacy_gica"}
              label={quoteConfig.ui.labels.download || "Descargar cotizacion"}
              className="inline-flex items-center justify-center rounded-2xl border border-[#e8dece] px-4 py-3 text-sm font-semibold text-slate-700"
            />
          </div>
        </div>

        <div className="mt-5">
          <AccountBreakdownCard
            locale="es-MX"
            currency={quote.currency}
            total={quote.total}
            items={quote.items.map((item) => ({
              id: item.id,
              label: item.label,
              amount: item.total,
              description: item.description,
            }))}
            title="Cuenta completa de la propuesta"
            description="Deja el total siempre visible y abre el bloque solo cuando quieras revisar servicios, extras y ajustes."
            detailTitle="Ver detalle completo"
            detailDescription="Aquí aparece el desglose completo que forma esta propuesta."
            defaultOpen
          />
        </div>

        <div className="mt-5">
          <Link href={V2_ROUTES.quotes} className="text-sm font-semibold text-slate-700 underline-offset-4 hover:underline">
            Volver a propuestas
          </Link>
        </div>
      </section>
    </div>
  );
}

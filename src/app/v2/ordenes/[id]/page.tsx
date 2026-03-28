import Link from "next/link";
import { notFound } from "next/navigation";
import { ServiceOrderStatus } from "@prisma/client";

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
  getV2QuoteHref,
} from "@/src/features/v2/routing";
import { formatDate } from "@/src/lib/dates";
import { requireCurrentOrganization } from "@/src/lib/organizations/context";
import { getServiceOrderById } from "@/src/lib/service-orders";

interface V2OrderDetailPageProps {
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

function formatMoney(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: Date | null, locale: string, timeZone: string) {
  if (!value) {
    return "Sin fecha";
  }

  return formatDate(value, {
    locale,
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusTone(status: ServiceOrderStatus) {
  if (status === ServiceOrderStatus.PAID) return "success" as const;
  if (status === ServiceOrderStatus.COMPLETED) return "warning" as const;
  if (status === ServiceOrderStatus.IN_PROGRESS) return "info" as const;
  if (status === ServiceOrderStatus.CANCELLED) return "danger" as const;
  return "neutral" as const;
}

export default async function V2OrderDetailPage({ params }: V2OrderDetailPageProps) {
  const [{ id }, context] = await Promise.all([params, requireCurrentOrganization()]);
  const timeZone =
    context.currentTimezone?.timezone ?? context.currentOrganization.defaultTimezone;

  let order;
  const quoteConfig = await getOrganizationQuoteConfigView(context.currentOrganizationId);

  try {
    order = await getServiceOrderById(context.currentOrganizationId, id);
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
        kicker="Orden"
        title={order.customerName || "Cliente mostrador"}
        description="Aqui revisas el trabajo completo, reimprimes y saltas a cliente, propuesta origen o seguimiento."
        aside={<StatusBadge tone={getStatusTone(order.status)}>{STATUS_LABELS[order.status]}</StatusBadge>}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {order.client?.id ? (
          <QuickLinkCard href={getV2ClientHref(order.client.id)} title="Abrir cliente" description="Consulta historial y actividad." icon="clients" />
        ) : null}
        {order.sourceQuote ? (
          <QuickLinkCard href={getV2QuoteHref(order.sourceQuote.id)} title="Propuesta origen" description="Revisa la propuesta base de esta orden." icon="sale" />
        ) : null}
        <QuickLinkCard href={V2_ROUTES.agenda} title="Agenda" description="Ve horario, responsable y programacion." icon="agenda" />
        <QuickLinkCard
          href={buildV2NewSaleHref({
            clientId: order.client?.id ?? null,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            intent: "order",
          })}
          title="Nueva venta"
          description="Crea otra venta reutilizando este cliente."
          icon="sale"
        />
      </section>

      <section className="rounded-[28px] border border-[#e8dece] bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm leading-6 text-slate-600">
              Creada: {formatDateTime(order.createdAt, "es-MX", timeZone)}
            </p>
            <p className="text-sm leading-6 text-slate-600">
              Programada: {formatDateTime(order.scheduledFor, "es-MX", timeZone)}
            </p>
            <p className="text-sm leading-6 text-slate-600">
              Responsable: {order.assignedTo ? `${order.assignedTo.firstName} ${order.assignedTo.lastName}`.trim() : "Sin asignar"}
            </p>
            {order.notes ? <p className="text-sm leading-6 text-slate-600">Nota: {order.notes}</p> : null}
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-right font-poppins text-3xl font-semibold text-slate-950">
              {formatMoney(order.total, order.currency, "es-MX")}
            </p>
            <DownloadQuoteImageButton
              branding={printBranding}
              title={quoteConfig.ui.titles.calculatorTitle || `Cotizacion ${quoteConfig.branding.businessName}`}
              subtitle={quoteConfig.ui.titles.calculatorSubtitle || "Resumen de servicios y extras"}
              totalLabel={quoteConfig.ui.labels.total || "Total"}
              total={order.total}
              items={order.items.map((item) => ({ label: item.label, amount: item.total }))}
              isLegacyTemplate={quoteConfig.branding.quoteTemplate === "legacy_gica"}
              label={quoteConfig.ui.labels.download || "Descargar cotizacion"}
              className="inline-flex items-center justify-center rounded-2xl border border-[#e8dece] px-4 py-3 text-sm font-semibold text-slate-700"
            />
          </div>
        </div>

        <div className="mt-5">
          <AccountBreakdownCard
            locale="es-MX"
            currency={order.currency}
            total={order.total}
            items={order.items.map((item) => ({
              id: item.id,
              label: item.label,
              amount: item.total,
              description: item.description,
            }))}
            title="Cuenta completa de la orden"
            description="Mantén el total a la vista y abre este bloque solo cuando quieras revisar el desglose completo."
            detailTitle="Ver detalle completo"
            detailDescription="Aquí aparece todo lo que se cobró o se trabajó dentro de esta orden."
            defaultOpen
          />
        </div>

        <div className="mt-5">
          <Link href={V2_ROUTES.orders} className="text-sm font-semibold text-slate-700 underline-offset-4 hover:underline">
            Volver a ordenes
          </Link>
        </div>
      </section>
    </div>
  );
}

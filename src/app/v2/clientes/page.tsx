import Link from "next/link";
import { redirect } from "next/navigation";

import { V2PageHero } from "@/src/features/v2/shell/V2Shell";
import { V2_ROUTES, buildV2NewSaleHref, getV2ClientHref } from "@/src/features/v2/routing";
import { getOperationalFrontendAccess } from "@/src/lib/authorization";
import { requireCurrentOrganization } from "@/src/lib/organizations/context";
import { listClientsWithCommercialHistory } from "@/src/lib/quotes";
import { StatCard } from "@/src/components/ui/OperationsUI";

function formatMoney(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: Date | null, locale: string) {
  if (!value) {
    return "Sin actividad reciente";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function V2ClientsPage() {
  const context = await requireCurrentOrganization();
  const access = getOperationalFrontendAccess(
    context.user.role,
    context.currentOrganizationRole,
    context.currentOrganizationPermissionProfile
  );

  if (!access.canUseClients) {
    redirect(V2_ROUTES.more);
  }

  const clients = await listClientsWithCommercialHistory(context.currentOrganizationId);

  return (
    <div className="space-y-5">
      <V2PageHero
        kicker="Clientes"
        title="Clientes con actividad"
        description="Consulta historial comercial y operativo. Desde aqui puedes volver a vender rapido con contexto ya conocido."
      />

      {clients.length > 0 ? (
        <section className="space-y-4">
          {clients.map((client) => (
            <article key={client.id} className="rounded-[28px] border border-[#e8dece] bg-white p-5 sm:p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <h2 className="font-poppins text-xl font-semibold text-slate-950">
                    {client.name}
                  </h2>
                  {client.phone ? (
                    <p className="mt-2 text-sm leading-6 text-slate-600">Telefono: {client.phone}</p>
                  ) : null}
                  <p className="text-sm leading-6 text-slate-600">
                    Ultima actividad: {formatDateTime(client.lastActivityAt, "es-MX")}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
                  <StatCard label="Propuestas" value={client.quoteCount} />
                  <StatCard label="Ordenes" value={client.orderCount} />
                  <StatCard label="Cotizado" value={formatMoney(client.totalQuoted, "MXN", "es-MX")} />
                  <StatCard label="Pagado" value={formatMoney(client.totalPaid, "MXN", "es-MX")} />
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    href={getV2ClientHref(client.id)}
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                  >
                    Ver historial
                  </Link>
                  <Link
                    href={buildV2NewSaleHref({
                      clientId: client.id,
                      customerName: client.name,
                      customerPhone: client.phone,
                    })}
                    className="inline-flex items-center justify-center rounded-2xl border border-[#e8dece] px-5 py-3 text-sm font-semibold text-slate-700"
                  >
                    Nueva venta
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-[28px] border border-[#e8dece] bg-white p-5 sm:p-6">
          <p className="text-sm font-medium text-slate-700">Aun no hay clientes con historial.</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Cuando guardes propuestas u ordenes con nombre o telefono, aqui aparecera su actividad.
          </p>
        </section>
      )}
    </div>
  );
}

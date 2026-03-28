import Link from "next/link";
import { redirect } from "next/navigation";

import { CreateClientCard } from "@/src/components/clients/CreateClientCard";
import { V2PageHero } from "@/src/features/v2/shell/V2Shell";
import { V2_ROUTES, buildV2NewSaleHref, getV2ClientHref } from "@/src/features/v2/routing";
import { canManageOrganization, getOperationalFrontendAccess } from "@/src/lib/authorization";
import { formatDate } from "@/src/lib/dates";
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

export default async function V2ClientsPage() {
  const context = await requireCurrentOrganization();
  const timeZone =
    context.currentTimezone?.timezone ?? context.currentOrganization.defaultTimezone;
  const access = getOperationalFrontendAccess(
    context.user.role,
    context.currentOrganizationRole,
    context.currentOrganizationPermissionProfile
  );
  const canCreateClients = canManageOrganization(
    context.user.role,
    context.currentOrganizationRole
  );

  if (!access.canUseClients) {
    redirect(V2_ROUTES.more);
  }

  const clients = await listClientsWithCommercialHistory(context.currentOrganizationId, {
    includeWithoutHistory: true,
  });

  return (
    <div className="space-y-5">
      <V2PageHero
        kicker="Clientes"
        title="Clientes del negocio"
        description="Consulta historial comercial, agrega clientes manualmente y vuelve a vender rápido con el contexto ya conocido."
      />

      {canCreateClients ? <CreateClientCard /> : null}

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
                  {client.email ? (
                    <p className="text-sm leading-6 text-slate-600">Correo: {client.email}</p>
                  ) : null}
                  <p className="text-sm leading-6 text-slate-600">
                    Ultima actividad: {formatDateTime(client.lastActivityAt, "es-MX", timeZone)}
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
          <p className="text-sm font-medium text-slate-700">Aun no hay clientes registrados.</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Cuando agregues un cliente manualmente o guardes propuestas y órdenes, aquí aparecerá su ficha.
          </p>
        </section>
      )}
    </div>
  );
}

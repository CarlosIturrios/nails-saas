import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLogoutButton } from "@/src/admin/components/AdminLogoutButton";
import { OrganizationSelectorClient } from "@/src/components/home/OrganizationSelectorClient";
import { StatCard } from "@/src/components/ui/OperationsUI";
import { V2PageHero } from "@/src/features/v2/shell/V2Shell";
import {
  canAccessPlatformAdmin,
  getUserRoleLabel,
} from "@/src/lib/authorization";
import { requireOrganizationContext } from "@/src/lib/organizations/context";

interface SelectOrganizationPageProps {
  searchParams: Promise<{
    next?: string;
  }>;
}

export default async function SelectOrganizationPage({
  searchParams,
}: SelectOrganizationPageProps) {
  const query = await searchParams;
  const context = await requireOrganizationContext();
  const destination =
    query.next && query.next.startsWith("/") ? query.next : "/";
  const isPlatformAdmin = canAccessPlatformAdmin(context.user.role);

  if (context.memberships.length === 0) {
    return (
      <main className="min-h-screen bg-[#f7f5ef] px-4 py-6 text-slate-950 sm:px-6 lg:px-8 xl:px-10 lg:py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <header className="rounded-[28px] border border-[#e8dece] bg-white/92 p-5 shadow-[0_10px_26px_rgba(15,23,42,0.05)] backdrop-blur sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Sesión activa
                </p>
                <h1 className="mt-3 font-poppins text-2xl font-semibold text-slate-950">
                  {context.user.firstName} {context.user.lastName}
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">{context.user.email}</p>
              </div>
              <div className="flex flex-col gap-3 sm:items-end">
                <span className="inline-flex rounded-full border border-[#ddd1bf] bg-[#fffaf2] px-3 py-1 text-xs font-semibold text-slate-700">
                  {getUserRoleLabel(context.user.role)}
                </span>
                <AdminLogoutButton />
              </div>
            </div>
          </header>

          <V2PageHero
            kicker="Organizaciones"
            title={
              isPlatformAdmin
                ? "Tu cuenta no tiene organizaciones ligadas"
                : "Todavía no tienes una organización asignada"
            }
            description={
              isPlatformAdmin
                ? "Puedes entrar al admin SaaS para revisar cuentas, crear organizaciones o vincularte a una antes de usar la app operativa."
                : "Para usar la app necesitas que un administrador te ligue a una organización. Mientras eso pasa, aquí verás este aviso en lugar del selector."
            }
          />

          <section className="grid gap-4 md:grid-cols-3">
            <StatCard
              label="Organizaciones disponibles"
              value={0}
              hint="Aún no hay espacios ligados a tu cuenta."
            />
            <StatCard
              label="Perfil"
              value={getUserRoleLabel(context.user.role)}
              hint={
                isPlatformAdmin
                  ? "Tu rol sí puede entrar al admin SaaS aunque no tengas una organización activa."
                  : "Tu acceso operativo depende de que te asignen una organización."
              }
            />
            <StatCard
              label="Siguiente paso"
              value={isPlatformAdmin ? "Abrir admin SaaS" : "Pedir acceso"}
              hint={
                isPlatformAdmin
                  ? "Desde ahí puedes crear organizaciones o revisar la configuración global."
                  : "Pide apoyo a un admin para que te vincule correctamente."
              }
            />
          </section>

          <section className="rounded-[28px] border border-[#e8dece] bg-white p-6 shadow-[0_10px_26px_rgba(15,23,42,0.05)] sm:p-8">
            <div className="space-y-4">
              <p className="text-sm leading-7 text-slate-600">
                {isPlatformAdmin
                  ? "No hay organizaciones disponibles para elegir, así que el selector no aparece. Tu cuenta puede seguir entrando al portal SaaS sin problema."
                  : "No hay organizaciones para mostrar en este selector, así que no se puede continuar al flujo operativo todavía."}
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                {isPlatformAdmin ? (
                  <>
                    <Link
                      href="/admin"
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                    >
                      Ir a admin SaaS
                    </Link>
                    <Link
                      href="/admin/organizations"
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#e8dece] px-5 py-3 text-sm font-semibold text-slate-700"
                    >
                      Ver organizaciones
                    </Link>
                  </>
                ) : (
                  <p className="text-sm font-medium text-slate-700">
                    Cuando un administrador te asigne una organización, aquí aparecerá el selector.
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (context.memberships.length === 1) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-4 py-6 text-slate-950 sm:px-6 lg:px-8 xl:px-10 lg:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-[28px] border border-[#e8dece] bg-white/92 p-5 shadow-[0_10px_26px_rgba(15,23,42,0.05)] backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Sesión activa
              </p>
              <h1 className="mt-3 font-poppins text-2xl font-semibold text-slate-950">
                {context.user.firstName} {context.user.lastName}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">{context.user.email}</p>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <span className="inline-flex rounded-full border border-[#ddd1bf] bg-[#fffaf2] px-3 py-1 text-xs font-semibold text-slate-700">
                {getUserRoleLabel(context.user.role)}
              </span>
              <AdminLogoutButton />
            </div>
          </div>
        </header>

        <V2PageHero
          kicker="Organizaciones"
          title="Elige tu espacio de trabajo"
          description="Selecciona la organización con la que quieres capturar, mover pendientes y administrar tu operación en esta sesión."
        />

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Organizaciones disponibles"
            value={context.memberships.length}
            hint="Solo ves las organizaciones a las que tu usuario tiene acceso."
          />
          <StatCard
            label="Destino"
            value="Espacio principal"
            hint="Después de elegir una organización entrarás al flujo principal de trabajo."
          />
          <StatCard
            label="Perfil"
            value={getUserRoleLabel(context.user.role)}
            hint="Tu rol global puede cambiar los accesos que veas después."
          />
        </section>

        <OrganizationSelectorClient
          destination={destination}
          currentOrganizationId={context.currentOrganizationId}
          currentOrganizationName={context.currentOrganization?.name ?? null}
          organizations={context.memberships.map((membership) => ({
            id: membership.organization.id,
            name: membership.organization.name,
            logoUrl: membership.organization.logoUrl ?? null,
          }))}
        />
      </div>
    </main>
  );
}

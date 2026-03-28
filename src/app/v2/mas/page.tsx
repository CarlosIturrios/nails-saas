import Link from "next/link";

import { TimezonePreferencesCard } from "@/src/components/timezone/TimezonePreferencesCard";
import LogoutButton from "@/src/components/ui/LogoutButton";
import { V2QuickLink, V2PageHero } from "@/src/features/v2/shell/V2Shell";
import { getDefaultAppRoute, V2_ROUTES } from "@/src/features/v2/routing";
import {
  canAccessPlatformAdmin,
  getOperationalFrontendAccess,
} from "@/src/lib/authorization";
import { getSupportedTimezones, UTC_TIMEZONE } from "@/src/lib/dates";
import { requireCurrentOrganization } from "@/src/lib/organizations/context";

export default async function V2MorePage() {
  const context = await requireCurrentOrganization();
  const timezones = getSupportedTimezones();
  const currentTimezone = context.currentTimezone ?? {
    timezone: context.currentOrganization.defaultTimezone,
    source: "organization" as const,
    userTimezone: context.user.timezone,
    detectedTimezone: null,
    organizationTimezone: context.currentOrganization.defaultTimezone ?? UTC_TIMEZONE,
  };
  const access = getOperationalFrontendAccess(
    context.user.role,
    context.currentOrganizationRole,
    context.currentOrganizationPermissionProfile
  );
  const canManageBusiness =
    canAccessPlatformAdmin(context.user.role) ||
    context.currentOrganizationRole === "ORG_ADMIN";
  const returnHref = getDefaultAppRoute(access);
  const switchOrganizationHref =
    context.memberships.length > 1
      ? `/select-organization?next=${encodeURIComponent(returnHref)}`
      : null;
  const operationLinks = [
    access.canUseClients
      ? {
          href: V2_ROUTES.clients,
          title: "Clientes",
          description: "Consulta historial, pagos y actividad reciente de cada cliente.",
          eyebrow: "Relación",
          icon: "clients" as const,
          tone: "sky" as const,
        }
      : null,
    access.canUseCash
      ? {
          href: V2_ROUTES.cash,
          title: "Caja",
          description: "Revisa lo cobrado, lo pendiente y el cierre operativo del día.",
          eyebrow: "Cobros",
          icon: "cash" as const,
          tone: "emerald" as const,
        }
      : null,
    access.canUseQuotes
      ? {
          href: V2_ROUTES.quotes,
          title: "Propuestas",
          description: "Da seguimiento a cotizaciones y conviértelas cuando el cliente confirme.",
          eyebrow: "Preventa",
          icon: "quotes" as const,
          tone: "amber" as const,
        }
      : null,
    access.canUseOrders
      ? {
          href: V2_ROUTES.orders,
          title: "Órdenes",
          description: "Entra a trabajos activos, urgentes o pendientes por terminar.",
          eyebrow: "Operación",
          icon: "orders" as const,
          tone: "slate" as const,
        }
      : null,
    access.canUseDashboard
      ? {
          href: V2_ROUTES.dashboard,
          title: "Tablero",
          description: "Supervisa carga, responsables y el estado general de la operación.",
          eyebrow: "Vista general",
          icon: "dashboard" as const,
          tone: "rose" as const,
        }
      : null,
  ].filter(Boolean) as Array<{
    href: string;
    title: string;
    description: string;
    eyebrow: string;
    icon: "clients" | "cash" | "quotes" | "orders" | "dashboard";
    tone: "sky" | "emerald" | "amber" | "slate" | "rose";
  }>;
  const adminLinks = [
    switchOrganizationHref
      ? {
          href: switchOrganizationHref,
          title: "Cambiar organización",
          description: "Muévete a otra organización sin perder el contexto de la app.",
          eyebrow: "Cuenta",
          icon: "switch" as const,
          tone: "neutral" as const,
        }
      : null,
    canManageBusiness
      ? {
          href: "/organization-admin",
          title: "Organización",
          description: "Equipo, permisos y datos base de tu negocio en un solo lugar.",
          eyebrow: "Administración",
          icon: "organization" as const,
          tone: "sky" as const,
        }
      : null,
    canManageBusiness
      ? {
          href: "/organization-admin/captura",
          title: "Configurar captura",
          description: "Ajusta el asistente de venta, catálogo base y estilo visual.",
          eyebrow: "Configuración",
          icon: "capture" as const,
          tone: "amber" as const,
        }
      : null,
    canManageBusiness
      ? {
          href: "/cotizaciones",
          title: "Demo de captura",
          description: "Prueba estilos y presets sin tocar la operación diaria.",
          eyebrow: "Explorar",
          icon: "demo" as const,
          tone: "rose" as const,
        }
      : null,
    canAccessPlatformAdmin(context.user.role)
      ? {
          href: "/admin",
          title: "Admin SaaS",
          description: "Usuarios, organizaciones y herramientas globales de la plataforma.",
          eyebrow: "Plataforma",
          icon: "admin" as const,
          tone: "slate" as const,
        }
      : null,
  ].filter(Boolean) as Array<{
    href: string;
    title: string;
    description: string;
    eyebrow: string;
    icon: "switch" | "organization" | "capture" | "demo" | "admin";
    tone: "neutral" | "sky" | "amber" | "rose" | "slate";
  }>;

  return (
    <div className="space-y-5">
      <V2PageHero
        kicker="Mas"
        title="Herramientas del negocio"
        description="Aqui quedan las vistas de consulta, seguimiento y administracion que no deben competir con el modulo principal."
      />

      {operationLinks.length > 0 ? (
        <section className="space-y-3">
          <div className="px-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Seguimiento diario
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Vistas para revisar clientes, cobros, órdenes y seguimiento sin meterte a configuración.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {operationLinks.map((item) => (
              <V2QuickLink
                key={item.href}
                href={item.href}
                title={item.title}
                description={item.description}
                eyebrow={item.eyebrow}
                icon={item.icon}
                tone={item.tone}
              />
            ))}
          </div>
        </section>
      ) : null}

      {adminLinks.length > 0 ? (
        <section className="space-y-3">
          <div className="px-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Configuración y administración
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Espacios para mover organizaciones, ajustar la captura o entrar a herramientas de administración.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {adminLinks.map((item) => (
              <V2QuickLink
                key={item.href}
                href={item.href}
                title={item.title}
                description={item.description}
                eyebrow={item.eyebrow}
                icon={item.icon}
                tone={item.tone}
              />
            ))}
          </div>
        </section>
      ) : null}

      <TimezonePreferencesCard
        currentTimezone={currentTimezone.timezone}
        currentSource={currentTimezone.source}
        userTimezone={context.user.timezone}
        detectedTimezone={currentTimezone.detectedTimezone}
        organizationTimezone={currentTimezone.organizationTimezone}
        organizationName={context.currentOrganization.name}
        timezoneOptions={timezones}
      />

      <section className="rounded-[28px] border border-[#e8dece] bg-white p-5 sm:p-6">
        <p className="text-sm font-semibold text-slate-950">Sesión</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Aquí puedes cerrar sesión sin buscar acciones flotantes ni salir del flujo principal.
        </p>
        <div className="mt-4">
          <LogoutButton />
        </div>
      </section>

      <section className="rounded-[28px] border border-[#e8dece] bg-white p-5 sm:p-6">
        <p className="text-sm font-semibold text-slate-950">Volver al trabajo</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Usa este espacio para entrar a configuración o administración y volver al trabajo
          sin perder el flujo principal.
        </p>
        <Link
          href={V2_ROUTES.capture}
          className="mt-4 inline-flex rounded-2xl border border-[#e8dece] px-4 py-3 text-sm font-semibold text-slate-700"
        >
          Ir a capturar
        </Link>
      </section>
    </div>
  );
}

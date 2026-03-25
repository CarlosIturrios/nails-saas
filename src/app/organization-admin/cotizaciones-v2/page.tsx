import { redirect } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@prisma/client";

import { AdminLogoutButton } from "@/src/admin/components/AdminLogoutButton";
import {
  AppHeader,
  AppMain,
  AppShell,
  DrawerActionStack,
} from "@/src/components/layout/AppShell";
import { QuoteConfigWizard } from "@/src/features/quote-config-admin/components/QuoteConfigWizard";
import { getOrganizationQuoteConfigView } from "@/src/features/quote-calculator-v2/lib/config";
import { requireOrganizationContext } from "@/src/lib/organizations/context";

interface OrganizationAdminQuoteConfigPageProps {
  searchParams: Promise<{
    organizationId?: string;
  }>;
}

export default async function OrganizationAdminQuoteConfigPage({
  searchParams,
}: OrganizationAdminQuoteConfigPageProps) {
  const context = await requireOrganizationContext();

  const organizations = (
    context.user.role === UserRole.ADMIN
      ? context.memberships
      : context.memberships.filter((membership) => membership.role === "ADMIN")
  ).map((membership) => ({
    id: membership.organization.id,
    name: membership.organization.name,
  }));

  if (organizations.length === 0) {
    redirect("/home");
  }

  const query = await searchParams;
  const selectedOrganizationId =
    query.organizationId && organizations.some((item) => item.id === query.organizationId)
      ? query.organizationId
      : context.currentOrganizationId &&
          organizations.some((item) => item.id === context.currentOrganizationId)
        ? context.currentOrganizationId
        : organizations[0].id;

  if (query.organizationId !== selectedOrganizationId) {
    redirect(
      `/organization-admin/cotizaciones-v2?organizationId=${selectedOrganizationId}`
    );
  }

  const initialConfig = await getOrganizationQuoteConfigView(selectedOrganizationId);

  return (
    <AppShell>
      <AppHeader
        eyebrow="Configuración activa"
        title="Cotizaciones por organización"
        mobileTitle="Cotizaciones"
        subtitle={`${context.user.firstName} ${context.user.lastName} · ${context.user.email}`}
        organizationName={context.currentOrganization?.name ?? null}
        userName={`${context.user.firstName} ${context.user.lastName}`}
        userEmail={context.user.email}
        badges={[{ label: context.user.role }]}
        navItems={[
          { href: "/home", label: "Inicio" },
          { href: "/organization-admin", label: "Gestionar organización" },
          {
            href: `/organization-admin/cotizaciones-v2?organizationId=${selectedOrganizationId}`,
            label: "Configurar cotizaciones",
          },
        ]}
        actions={
          <DrawerActionStack>
            <Link
              href="/organization-admin"
              className="admin-secondary inline-flex w-full items-center justify-center px-4 py-3 text-sm font-medium"
            >
              Volver
            </Link>
            <Link
              href="/home"
              className="admin-secondary inline-flex w-full items-center justify-center px-4 py-3 text-sm font-medium"
            >
              Ir a Home
            </Link>
            <AdminLogoutButton />
          </DrawerActionStack>
        }
      />

      <AppMain>
        <QuoteConfigWizard
          initialConfig={initialConfig}
          organizations={organizations}
          basePath="/organization-admin/cotizaciones-v2"
        />
      </AppMain>
    </AppShell>
  );
}

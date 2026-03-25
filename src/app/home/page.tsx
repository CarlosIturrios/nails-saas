import { redirect } from "next/navigation";

import { HomeClient } from "@/src/components/home/HomeClient";
import { requireOrganizationContext } from "@/src/lib/organizations/context";
import { AdminLogoutButton } from "@/src/admin/components/AdminLogoutButton";
import {
  AppHeader,
  AppMain,
  AppShell,
  DrawerActionStack,
} from "@/src/components/layout/AppShell";

export default async function HomePage() {
  const context = await requireOrganizationContext();

  if (context.memberships.length > 1 && !context.currentOrganizationId) {
    redirect("/select-organization");
  }

  return (
    <AppShell>
      <AppHeader
        eyebrow="Sesión activa"
        title="Tu espacio de trabajo"
        mobileTitle="Inicio"
        subtitle={`${context.user.firstName} ${context.user.lastName} · ${context.user.email}`}
        organizationName={context.currentOrganization?.name ?? null}
        userName={`${context.user.firstName} ${context.user.lastName}`}
        userEmail={context.user.email}
        badges={[
          ...(context.currentOrganizationRole
            ? [{ label: context.currentOrganizationRole }]
            : []),
          { label: context.user.role },
        ]}
        navItems={[
          ...(context.currentOrganizationId
            ? [{ href: "/cotizaciones/v2", label: "Ir a cotizaciones" }]
            : []),
          { href: "/home", label: "Inicio" },
          ...(context.user.role === "ADMIN" ? [{ href: "/admin", label: "Panel admin" }] : []),
          ...(
            context.user.role === "ADMIN" ||
            context.memberships.some((membership) => membership.role === "ADMIN")
              ? [{ href: "/organization-admin", label: "Administrar organización" }]
              : []
          ),
        ]}
        actions={
          <DrawerActionStack>
            <AdminLogoutButton />
          </DrawerActionStack>
        }
      />

      <AppMain>
        <HomeClient
          organizationCount={context.memberships.length}
          currentOrganizationId={context.currentOrganizationId}
          currentOrganizationName={context.currentOrganization?.name ?? null}
          canAccessAdmin={context.user.role === "ADMIN"}
          canManageOrganizations={
            context.user.role === "ADMIN" ||
            context.memberships.some((membership) => membership.role === "ADMIN")
          }
          organizations={context.memberships.map((membership) => ({
            id: membership.organization.id,
            name: membership.organization.name,
            logoUrl: membership.organization.logoUrl ?? null,
          }))}
          canCreateOrganization={context.user.role === "ADMIN"}
        />
      </AppMain>
    </AppShell>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { AdminLogoutButton } from "@/src/admin/components/AdminLogoutButton";
import { OrganizationAdminClient } from "@/src/components/organization-admin/OrganizationAdminClient";
import {
  AppHeader,
  AppMain,
  AppShell,
  DrawerActionStack,
} from "@/src/components/layout/AppShell";
import { prisma } from "@/src/lib/db";
import { requireOrganizationContext } from "@/src/lib/organizations/context";

export default async function OrganizationAdminPage() {
  const context = await requireOrganizationContext();
  const hasOrganizationAdminAccess =
    context.user.role === UserRole.ADMIN ||
    context.memberships.some((membership) => membership.role === "ADMIN");

  if (!hasOrganizationAdminAccess) {
    redirect("/home");
  }

  if (!context.currentOrganizationId && context.memberships.length > 1) {
    redirect("/select-organization?next=/organization-admin");
  }

  const members = context.currentOrganizationId
    ? await prisma.userOrganization.findMany({
        where: {
          organizationId: context.currentOrganizationId,
        },
        select: {
          id: true,
          role: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: [
          {
            role: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      })
    : [];

  const manageableOrganizations = (
    context.user.role === UserRole.ADMIN
      ? context.memberships
      : context.memberships.filter((membership) => membership.role === "ADMIN")
  ).map((membership) => ({
    id: membership.organization.id,
    name: membership.organization.name,
  }));

  return (
    <AppShell>
      <AppHeader
        eyebrow="Sesión activa"
        title="Administración de organizaciones"
        mobileTitle="Organización"
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
          { href: "/home", label: "Inicio" },
          { href: "/organization-admin", label: "Gestionar organización" },
          { href: "/organization-admin/cotizaciones-v2", label: "Configurar cotizaciones" },
          ...(context.user.role === UserRole.ADMIN
            ? [{ href: "/admin", label: "Panel admin" }]
            : []),
        ]}
        actions={
          <DrawerActionStack>
            <Link
              href="/home"
              className="admin-secondary inline-flex w-full items-center justify-center px-4 py-3 text-sm font-medium"
            >
              Ir a Home
            </Link>
            {context.user.role === UserRole.ADMIN ? (
              <Link
                href="/admin"
                className="admin-secondary inline-flex w-full items-center justify-center px-4 py-3 text-sm font-medium"
              >
                Ir a Admin
              </Link>
            ) : null}
            <AdminLogoutButton />
          </DrawerActionStack>
        }
      />

      <AppMain>
        <OrganizationAdminClient
          canCreateOrganization={context.user.role === UserRole.ADMIN}
          currentOrganizationId={context.currentOrganizationId}
          currentOrganizationName={context.currentOrganization?.name ?? null}
          manageableOrganizations={manageableOrganizations}
          members={members.map((member) => ({
            ...member,
            createdAt: member.createdAt.toISOString(),
          }))}
        />
      </AppMain>
    </AppShell>
  );
}

import { redirect } from "next/navigation";

import { AdminLogoutButton } from "@/src/admin/components/AdminLogoutButton";
import { OrganizationSelectorClient } from "@/src/components/home/OrganizationSelectorClient";
import {
  AppHeader,
  AppMain,
  AppShell,
  DrawerActionStack,
  PageHero,
} from "@/src/components/layout/AppShell";
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
    query.next && query.next.startsWith("/") ? query.next : "/home";

  if (context.memberships.length === 0) {
    redirect("/home");
  }

  if (context.memberships.length === 1) {
    redirect("/home");
  }

  if (context.currentOrganizationId) {
    redirect("/home");
  }

  return (
    <AppShell>
      <AppHeader
        eyebrow="Sesión activa"
        title="Elegir organización"
        mobileTitle="Organizaciones"
        subtitle={`${context.user.firstName} ${context.user.lastName} · ${context.user.email}`}
        userName={`${context.user.firstName} ${context.user.lastName}`}
        userEmail={context.user.email}
        badges={[{ label: context.user.role }]}
        navItems={[{ href: "/home", label: "Ir a inicio" }]}
        actions={
          <DrawerActionStack>
            <AdminLogoutButton />
          </DrawerActionStack>
        }
      />

      <AppMain>
        <section className="space-y-5 sm:space-y-6">
          <PageHero
            eyebrow="Inicio"
            title="¿Con cuál quieres trabajar?"
            description="Elige la organización que quieres usar en esta sesión para continuar."
          />

          <OrganizationSelectorClient
            destination={destination}
            organizations={context.memberships.map((membership) => ({
              id: membership.organization.id,
              name: membership.organization.name,
              logoUrl: membership.organization.logoUrl ?? null,
            }))}
          />
        </section>
      </AppMain>
    </AppShell>
  );
}

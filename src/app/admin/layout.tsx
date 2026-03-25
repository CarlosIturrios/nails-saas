import {
  getAdminModelEntries,
} from "@/src/admin/config/models";
import { requireAdminPageUser } from "@/src/admin/lib/auth";
import { AdminLogoutButton } from "@/src/admin/components/AdminLogoutButton";
import { AdminSidebarNav } from "@/src/admin/components/AdminSidebarNav";
import { AppHeader, DrawerActionStack } from "@/src/components/layout/AppShell";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await requireAdminPageUser();
  const modelEntries = getAdminModelEntries();
  const extraItems = [
    {
      key: "cotizaciones-v2",
      href: "/admin/cotizaciones-v2",
      label: "Cotizaciones",
    },
  ];
  const mobileNavItems = [
    { href: "/home", label: "Inicio" },
    { href: "/admin", label: "Dashboard" },
    ...extraItems.map((item) => ({
      href: item.href,
      label: item.label,
    })),
    ...modelEntries.map(([key, config]) => ({
      href: `/admin/${key}`,
      label: config.label,
    })),
  ];

  return (
    <div className="admin-shell min-h-screen text-slate-950">
      <div className="flex min-h-screen w-full">
        <AdminSidebarNav items={modelEntries} extraItems={extraItems} mode="sidebar" />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <AppHeader
            eyebrow="Panel activo"
            title="Administración general"
            mobileTitle="Admin"
            subtitle={`${currentUser.user.firstName} ${currentUser.user.lastName} · ${currentUser.user.email}`}
            organizationName={currentUser.currentOrganization?.name ?? null}
            userName={`${currentUser.user.firstName} ${currentUser.user.lastName}`}
            userEmail={currentUser.user.email}
            desktopLeadingSlot={
              <AdminSidebarNav items={modelEntries} extraItems={extraItems} mode="toggle" />
            }
            badges={[
              ...(currentUser.currentOrganizationRole
                ? [{ label: currentUser.currentOrganizationRole }]
                : []),
              { label: currentUser.user.role },
            ]}
            navItems={mobileNavItems}
            actions={
              <DrawerActionStack>
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

          <main className="min-w-0 max-w-none flex-1 px-4 py-6 sm:px-6 lg:px-8 xl:px-10 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

import {
  getAdminModelEntries,
} from "@/src/admin/config/models";
import { requireAdminPageUser } from "@/src/admin/lib/auth";
import { AdminLogoutButton } from "@/src/admin/components/AdminLogoutButton";
import { AdminSidebarNav } from "@/src/admin/components/AdminSidebarNav";
import { V2_ROUTES } from "@/src/features/v2/routing";
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
      label: "Configurar captura",
    },
  ];
  const mobileNavItems = [
    { href: V2_ROUTES.capture, label: "Capturar" },
    { href: V2_ROUTES.more, label: "Más" },
    { href: "/admin", label: "Dashboard" },
    { href: "/organization-admin", label: "Organización" },
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
    <div className="min-h-screen bg-[#f7f5ef] text-slate-950">
      <div className="flex min-h-screen w-full">
        <AdminSidebarNav items={modelEntries} extraItems={extraItems} mode="sidebar" />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[#e8dece] bg-white/92 backdrop-blur">
            <div className="flex w-full items-center justify-between gap-3 px-4 py-3 lg:px-8 xl:px-10">
              <div className="flex min-w-0 items-center gap-3">
                <AdminSidebarNav items={modelEntries} extraItems={extraItems} mode="toggle" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Admin SaaS
                  </p>
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {currentUser.user.firstName} {currentUser.user.lastName}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {currentUser.currentOrganization?.name ?? currentUser.user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden rounded-full border border-[#ddd1bf] bg-[#fffaf2] px-3 py-1 text-xs font-semibold text-slate-700 sm:inline-flex">
                  {currentUser.user.role}
                </span>
                <Link
                  href={V2_ROUTES.more}
                  className="hidden h-11 items-center justify-center rounded-2xl border border-[#e8dece] bg-white px-4 text-sm font-semibold text-slate-700 sm:inline-flex"
                >
                  Volver al trabajo
                </Link>
                <Link
                  href="/organization-admin"
                  className="hidden h-11 items-center justify-center rounded-2xl border border-[#e8dece] bg-white px-4 text-sm font-semibold text-slate-700 lg:inline-flex"
                >
                  Organización
                </Link>
                <AdminLogoutButton />
              </div>
            </div>

            <div className="border-t border-[#f0e7da] px-4 py-2 lg:hidden">
              <div className="flex gap-2 overflow-x-auto">
                {mobileNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="shrink-0 rounded-full border border-[#e8dece] bg-[#fffdfa] px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </header>

          <main className="min-w-0 max-w-none flex-1 px-4 py-6 sm:px-6 lg:px-8 xl:px-10 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

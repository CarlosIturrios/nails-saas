"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, Menu, X } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import { AdminModelKey, AdminModelConfig } from "@/src/admin/config/models";

interface AdminSidebarNavProps {
  items: [AdminModelKey, AdminModelConfig][];
  extraItems?: Array<{
    key: string;
    href: string;
    label: string;
  }>;
  mode?: "sidebar" | "toggle";
}

const ADMIN_SIDEBAR_STORAGE_KEY = "admin-sidebar-collapsed";
const ADMIN_SIDEBAR_EVENT = "admin-sidebar-collapsed-change";

function getCompactLabel(value: string) {
  return (
    value
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "AD"
  );
}

function readAdminSidebarCollapsed() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(ADMIN_SIDEBAR_STORAGE_KEY) === "true";
}

function subscribeToAdminSidebarCollapsed(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== ADMIN_SIDEBAR_STORAGE_KEY) {
      return;
    }

    callback();
  };

  const handleSidebarEvent = () => {
    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(ADMIN_SIDEBAR_EVENT, handleSidebarEvent);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(ADMIN_SIDEBAR_EVENT, handleSidebarEvent);
  };
}

function updateAdminSidebarCollapsed(nextValue: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ADMIN_SIDEBAR_STORAGE_KEY, nextValue ? "true" : "false");
  window.dispatchEvent(
    new CustomEvent<boolean>(ADMIN_SIDEBAR_EVENT, {
      detail: nextValue,
    })
  );
}

export function AdminSidebarNav({
  items,
  extraItems = [],
  mode = "sidebar",
}: AdminSidebarNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const collapsed = useSyncExternalStore(
    subscribeToAdminSidebarCollapsed,
    readAdminSidebarCollapsed,
    () => false
  );

  if (mode === "sidebar") {
    return (
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-[#e8dece] bg-white/92 text-slate-950 backdrop-blur transition-[width,padding,opacity,border-color] duration-200 lg:flex ${
          collapsed
            ? "w-0 border-r-transparent px-0 py-0 opacity-0"
            : "w-64 px-5 py-6 opacity-100 xl:w-72"
        }`}
        aria-hidden={collapsed}
      >
        <div className={`${collapsed ? "flex flex-col items-center gap-3" : "block"}`}>
          <Link href="/admin" className={`block ${collapsed ? "w-full text-center" : ""}`} title="Admin SaaS">
            {collapsed ? (
              <>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e8dece] bg-[#fffaf2] text-sm font-semibold text-slate-700">
                  AS
                </div>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Admin
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Admin SaaS
                </p>
                <h1 className="mt-2 font-poppins text-2xl font-semibold text-slate-950">
                  Administración
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Configura la plataforma, revisa modelos y entra al configurador principal sin salir del mismo entorno.
                </p>
              </>
            )}
          </Link>
        </div>

        <nav className={`mt-8 flex-1 space-y-2 overflow-y-auto ${collapsed ? "" : "pr-1"}`}>
          {extraItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.key}
                href={item.href}
                title={item.label}
                className={`block rounded-xl border px-4 py-3 text-sm leading-6 transition ${
                  active
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-[#e8dece] bg-[#fffdfa] text-slate-700 hover:border-[#d6c8b3] hover:bg-white"
                } ${collapsed ? "px-0 py-2.5" : ""}`}
              >
                {collapsed ? (
                  <span
                    className={`mx-auto flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-semibold ${
                      active ? "bg-white/10 text-white" : "bg-[#fff7eb] text-slate-700"
                    }`}
                  >
                    {getCompactLabel(item.label)}
                  </span>
                ) : (
                  <p className="font-medium">{item.label}</p>
                )}
              </Link>
            );
          })}

          {items.map(([key, config]) => {
            const href = `/admin/${key}`;
            const active = pathname === href;

            return (
              <Link
                key={key}
                href={href}
                title={config.label}
                className={`block rounded-xl border px-4 py-3 text-sm leading-6 transition ${
                  active
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-[#e8dece] bg-[#fffdfa] text-slate-700 hover:border-[#d6c8b3] hover:bg-white"
                } ${collapsed ? "px-0 py-2.5" : ""}`}
              >
                {collapsed ? (
                  <span
                    className={`mx-auto flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-semibold ${
                      active ? "bg-white/10 text-white" : "bg-[#fff7eb] text-slate-700"
                    }`}
                  >
                    {getCompactLabel(config.label)}
                  </span>
                ) : (
                  <p className="font-medium">{config.label}</p>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    );
  }

  return (
    <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => updateAdminSidebarCollapsed(!collapsed)}
          className="admin-secondary hidden h-11 w-11 items-center justify-center lg:inline-flex"
          aria-label={collapsed ? "Mostrar sidebar" : "Ocultar sidebar"}
          title={collapsed ? "Mostrar sidebar" : "Ocultar sidebar"}
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>

      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="admin-secondary inline-flex h-11 w-11 items-center justify-center"
          aria-label="Abrir menu"
        >
          <Menu size={18} />
        </button>

        {open ? (
          <div className="fixed inset-0 z-[80] bg-slate-950/35 backdrop-blur-sm">
            <button
              type="button"
              aria-label="Cerrar menu"
              onClick={() => setOpen(false)}
              className="absolute inset-0 h-full w-full cursor-default"
            />
            <div className="fixed inset-y-0 left-0 flex h-dvh w-[min(23rem,calc(100vw-1rem))] flex-col border-r border-[#e8dece] bg-white px-5 py-5 text-slate-950 shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-[#efe6d8] pb-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                    Admin SaaS
                  </p>
                  <h2 className="mt-2 font-poppins text-xl font-semibold text-slate-950">
                    Administración
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Abre la sección que necesitas y vuelve a la app cuando termines.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e8dece] text-slate-500 transition hover:bg-[#fff7eb] hover:text-slate-950"
                  aria-label="Cerrar menu"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="mt-5 flex-1 space-y-2 overflow-y-auto pr-1">
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className={`block rounded-xl border px-4 py-3 text-sm leading-6 transition ${
                    pathname === "/admin"
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-[#e8dece] bg-[#fffdfa] text-slate-700 hover:border-[#d6c8b3] hover:bg-white"
                  }`}
                >
                  <p className="font-medium">Dashboard</p>
                  <p className="mt-1 text-xs text-slate-500">Vista general</p>
                </Link>

                {extraItems.map((item) => {
                  const active = pathname === item.href;

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`block rounded-xl border px-4 py-3 text-sm leading-6 transition ${
                        active
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-[#e8dece] bg-[#fffdfa] text-slate-700 hover:border-[#d6c8b3] hover:bg-white"
                      }`}
                    >
                      <p className="font-medium">{item.label}</p>
                    </Link>
                  );
                })}

                {items.map(([key, config]) => {
                  const href = `/admin/${key}`;
                  const active = pathname === href;

                  return (
                    <Link
                      key={key}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`block rounded-xl border px-4 py-3 text-sm leading-6 transition ${
                        active
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-[#e8dece] bg-[#fffdfa] text-slate-700 hover:border-[#d6c8b3] hover:bg-white"
                      }`}
                    >
                      <p className="font-medium">{config.label}</p>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

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

export function AdminSidebarNav({
  items,
  extraItems = [],
  mode = "sidebar",
}: AdminSidebarNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (mode === "sidebar") {
    return (
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[#d6c8b3] bg-[#2d241d] px-5 py-7 text-white lg:flex xl:w-72">
        <Link href="/admin" className="block">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#d9cdbb]">
            Administracion
          </p>
          <h1 className="mt-2 font-poppins text-2xl font-semibold">
            Gica Control
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#d9cdbb]">
            Elige una seccion para revisar o actualizar informacion.
          </p>
        </Link>

        <nav className="mt-8 flex-1 space-y-2 overflow-y-auto pr-1">
          {extraItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`block rounded-xl border px-4 py-3 text-sm leading-6 transition ${
                  active
                    ? "border-[#8a7356] bg-[#433225] text-white"
                    : "border-transparent text-[#f2e9dc] hover:border-[#6a5845] hover:bg-[#34291f] hover:text-white"
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
                className={`block rounded-xl border px-4 py-3 text-sm leading-6 transition ${
                  active
                    ? "border-[#8a7356] bg-[#433225] text-white"
                    : "border-transparent text-[#f2e9dc] hover:border-[#6a5845] hover:bg-[#34291f] hover:text-white"
                }`}
              >
                <p className="font-medium">{config.label}</p>
              </Link>
            );
          })}
        </nav>
      </aside>
    );
  }

  return (
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
            <div className="fixed inset-y-0 left-0 flex h-dvh w-[min(23rem,calc(100vw-1rem))] flex-col bg-[#2d241d] px-5 py-5 text-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-[#4a3a2d] pb-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#d9cdbb]">
                    Administracion
                  </p>
                  <h2 className="mt-2 font-poppins text-xl font-semibold">
                    Gica Control
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#d9cdbb]">
                    Abre la seccion que necesitas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#4a3a2d] text-[#f2e9dc] transition hover:bg-[#34291f] hover:text-white"
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
                      ? "border-[#8a7356] bg-[#433225] text-white"
                      : "border-transparent text-[#f2e9dc] hover:border-[#6a5845] hover:bg-[#34291f] hover:text-white"
                  }`}
                >
                  <p className="font-medium">Dashboard</p>
                  <p className="mt-1 text-xs text-[#c1b19c]">Vista general</p>
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
                          ? "border-[#8a7356] bg-[#433225] text-white"
                          : "border-transparent text-[#f2e9dc] hover:border-[#6a5845] hover:bg-[#34291f] hover:text-white"
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
                          ? "border-[#8a7356] bg-[#433225] text-white"
                          : "border-transparent text-[#f2e9dc] hover:border-[#6a5845] hover:bg-[#34291f] hover:text-white"
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
  );
}

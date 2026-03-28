"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Coins,
  FileText,
  LayoutGrid,
  ListTodo,
  Menu,
  PlusCircle,
  Settings2,
  Sparkles,
  Users,
} from "lucide-react";
import { useSyncExternalStore, type ReactNode } from "react";

import LogoutButton from "@/src/components/ui/LogoutButton";
import type { OperationalFrontendAccess } from "@/src/lib/authorization";
import { V2_ROUTES } from "@/src/features/v2/routing";

interface V2ShellProps {
  children: ReactNode;
  organizationName: string;
  organizationLogoUrl?: string | null;
  moduleLabel: string;
  userName: string;
  access: OperationalFrontendAccess;
  managementLinks?: Array<{
    href: string;
    label: string;
  }>;
  canSwitchOrganization?: boolean;
}

const APP_SIDEBAR_STORAGE_KEY = "app-sidebar-collapsed";
const APP_SIDEBAR_EVENT = "app-sidebar-collapsed-change";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function readAppSidebarCollapsed() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(APP_SIDEBAR_STORAGE_KEY) === "true";
}

function subscribeToAppSidebarCollapsed(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== APP_SIDEBAR_STORAGE_KEY) {
      return;
    }

    callback();
  };

  const handleSidebarEvent = () => {
    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(APP_SIDEBAR_EVENT, handleSidebarEvent);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(APP_SIDEBAR_EVENT, handleSidebarEvent);
  };
}

function updateAppSidebarCollapsed(nextValue: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(APP_SIDEBAR_STORAGE_KEY, nextValue ? "true" : "false");
  window.dispatchEvent(
    new CustomEvent<boolean>(APP_SIDEBAR_EVENT, {
      detail: nextValue,
    })
  );
}

function getInitials(value: string) {
  return (
    value
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "OR"
  );
}

export function V2Shell({
  children,
  organizationName,
  organizationLogoUrl = null,
  moduleLabel,
  userName,
  access,
  managementLinks = [],
  canSwitchOrganization = false,
}: V2ShellProps) {
  const pathname = usePathname();
  const sidebarCollapsed = useSyncExternalStore(
    subscribeToAppSidebarCollapsed,
    readAppSidebarCollapsed,
    () => false
  );
  const currentPath = pathname || V2_ROUTES.root;
  const switchOrganizationHref = canSwitchOrganization
    ? `/select-organization?next=${encodeURIComponent(currentPath)}`
    : null;
  const sellLabel = "Vender";
  const sellDescription = "Cobrar, agendar o cotizar";
  const primaryShortcutHref = access.canUseNewSale
    ? V2_ROUTES.capture
    : access.canUsePending
      ? V2_ROUTES.pending
      : V2_ROUTES.more;
  const primaryShortcutLabel = access.canUseNewSale
    ? sellLabel
    : access.canUsePending
      ? "Pendientes"
      : "Más";
  const showPrimaryShortcut = !isActive(pathname, primaryShortcutHref);

  const captureItem = access.canUseNewSale
    ? { href: V2_ROUTES.capture, label: sellLabel, icon: PlusCircle }
    : null;
  const mobileNavItems = [
    access.canUsePending
      ? { href: V2_ROUTES.pending, label: "Pendientes", icon: ListTodo }
      : null,
    access.canUseAgenda
      ? { href: V2_ROUTES.agenda, label: "Agenda", icon: CalendarDays }
      : null,
    { href: V2_ROUTES.more, label: "Más", icon: Menu },
  ].filter(Boolean) as Array<{
    href: string;
    label: string;
    icon: typeof PlusCircle;
  }>;
  const primaryItems = [
    captureItem,
    ...mobileNavItems,
  ].filter(Boolean) as Array<{
    href: string;
    label: string;
    icon: typeof PlusCircle;
  }>;
  const mobileNavColumnsClass =
    primaryItems.length <= 2
      ? "grid-cols-2"
      : primaryItems.length === 3
        ? "grid-cols-3"
        : "grid-cols-4";
  const workbenchItems = [
    access.canUsePending
      ? {
          href: V2_ROUTES.pending,
          label: "Pendientes",
          description: "Todo lo que sigue abierto o sin cerrar.",
          icon: ListTodo,
        }
      : null,
    access.canUseAgenda
      ? {
          href: V2_ROUTES.agenda,
          label: "Agenda",
          description: "Horarios, llegadas y reprogramaciones.",
          icon: CalendarDays,
        }
      : null,
    access.canUseQuotes
      ? {
          href: V2_ROUTES.quotes,
          label: "Propuestas",
          description: "Enviadas, abiertas, aceptadas o viejas.",
          icon: FileText,
        }
      : null,
    access.canUseOrders
      ? {
          href: V2_ROUTES.orders,
          label: "Órdenes",
          description: "Trabajo activo, cerrado o histórico.",
          icon: ClipboardList,
        }
      : null,
  ].filter(Boolean) as Array<{
    href: string;
    label: string;
    description: string;
    icon: typeof PlusCircle;
  }>;
  const supportItems = [
    access.canUseClients
      ? {
          href: V2_ROUTES.clients,
          label: "Clientes",
          description: "Historial y relación comercial.",
          icon: Users,
        }
      : null,
    access.canUseCash
      ? {
          href: V2_ROUTES.cash,
          label: "Caja",
          description: "Cobros, pendientes y resumen.",
          icon: Coins,
        }
      : null,
    access.canUseDashboard
      ? {
          href: V2_ROUTES.dashboard,
          label: "Tablero",
          description: "Vista general del negocio.",
          icon: LayoutGrid,
        }
      : null,
    {
      href: V2_ROUTES.more,
      label: "Más módulos",
      description: "Accesos extra y administración rápida.",
      icon: Menu,
    },
  ].filter(Boolean) as Array<{
    href: string;
    label: string;
    description: string;
    icon: typeof PlusCircle;
  }>;

  return (
    <div className="min-h-screen bg-[#f7f5ef] text-slate-950">
      <div className="flex min-h-screen w-full">
        <aside
          className={`hidden shrink-0 overflow-hidden border-r border-[#e8dece] bg-white/80 backdrop-blur transition-[width,padding,opacity,border-color] duration-200 lg:flex lg:flex-col ${
            sidebarCollapsed
              ? "w-0 border-r-transparent p-0 opacity-0"
              : "w-72 p-5 opacity-100"
          }`}
          aria-hidden={sidebarCollapsed}
        >
          <div className="rounded-[24px] border border-[#e8dece] bg-[#fffdf9] p-4">
            <div className="flex items-start gap-3">
              {organizationLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={organizationLogoUrl}
                  alt={organizationName}
                  className="h-14 w-14 shrink-0 rounded-2xl border border-[#e8dece] bg-white object-contain p-2"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#e8dece] bg-[#fffaf4] text-sm font-semibold text-slate-700">
                  {getInitials(organizationName)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Organizacion activa
                </p>
                <h1 className="mt-2 font-poppins text-xl font-semibold text-slate-950">
                  {organizationName}
                </h1>
                <p className="mt-1 text-sm text-slate-600">{userName}</p>
              </div>
            </div>
          </div>

          {captureItem ? (
            <Link
              href={captureItem.href}
              className={`mt-5 rounded-[28px] border p-4 transition ${
                isActive(pathname, captureItem.href)
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-[#eadfcb] bg-[#fff7eb] text-slate-950 hover:border-[#d6c8b3] hover:bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                    isActive(pathname, captureItem.href)
                      ? "bg-white/10 text-white"
                      : "bg-white text-slate-950 shadow-sm"
                  }`}
                >
                  <PlusCircle size={20} />
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-semibold uppercase tracking-[0.16em] ${
                      isActive(pathname, captureItem.href) ? "text-white/70" : "text-slate-500"
                    }`}
                  >
                    {moduleLabel}
                  </p>
                  <p className="mt-2 text-lg font-semibold">{sellLabel}</p>
                  <p
                    className={`mt-1 text-sm leading-6 ${
                      isActive(pathname, captureItem.href) ? "text-white/80" : "text-slate-600"
                    }`}
                  >
                    {sellDescription}
                  </p>
                </div>
              </div>
            </Link>
          ) : null}

          <div className="mt-5 space-y-3">
            <p className="px-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Operación diaria
            </p>
            <nav className="space-y-2">
              {workbenchItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-start gap-3 rounded-[22px] border px-4 py-3.5 transition ${
                      active
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-[#e8dece] bg-white text-slate-700 hover:border-[#d6c8b3] hover:bg-[#fffdf9]"
                    }`}
                  >
                    <span
                      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                        active ? "bg-white/10 text-white" : "bg-[#fff7eb] text-slate-800"
                      }`}
                    >
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span
                        className={`mt-1 block text-xs leading-5 ${
                          active ? "text-white/70" : "text-slate-500"
                        }`}
                      >
                        {item.description}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-5 space-y-3">
            <p className="px-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Consulta y control
            </p>
            <nav className="space-y-2">
              {supportItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-start gap-3 rounded-[22px] border px-4 py-3.5 transition ${
                      active
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-[#e8dece] bg-white text-slate-700 hover:border-[#d6c8b3] hover:bg-[#fffdf9]"
                    }`}
                  >
                    <span
                      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                        active ? "bg-white/10 text-white" : "bg-[#f2f4f7] text-slate-700"
                      }`}
                    >
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span
                        className={`mt-1 block text-xs leading-5 ${
                          active ? "text-white/70" : "text-slate-500"
                        }`}
                      >
                        {item.description}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {managementLinks.length > 0 ? (
            <div className="mt-6 space-y-2">
              <p className="px-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Administración
              </p>
              {managementLinks.map((item) => {
                const active = isActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-[22px] px-4 py-3 text-sm font-semibold transition ${
                      active
                        ? "bg-slate-950 text-white"
                        : "border border-[#e8dece] bg-white text-slate-700 hover:border-[#d6c8b3]"
                    }`}
                  >
                    <Settings2 size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ) : null}

          <div className="mt-6 space-y-2 border-t border-[#efe6d8] pt-6">
            <p className="px-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Sesión
            </p>
            {switchOrganizationHref ? (
              <Link
                href={switchOrganizationHref}
                className="flex items-center gap-3 rounded-2xl border border-[#e8dece] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#d6c8b3]"
              >
                <span>Cambiar organización</span>
              </Link>
            ) : null}
            <LogoutButton className="w-full justify-center" />
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[#e8dece] bg-white/92 backdrop-blur">
            <div className="flex w-full items-center justify-between gap-3 px-4 py-3 lg:px-8 xl:px-10 2xl:px-12">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateAppSidebarCollapsed(!sidebarCollapsed)}
                  className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-[#e8dece] bg-white text-slate-700 transition hover:border-[#d6c8b3] hover:bg-[#fff7eb] lg:inline-flex"
                  aria-label={sidebarCollapsed ? "Mostrar menu lateral" : "Ocultar menu lateral"}
                  title={sidebarCollapsed ? "Mostrar menu lateral" : "Ocultar menu lateral"}
                >
                  {sidebarCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
                </button>
                {organizationLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={organizationLogoUrl}
                    alt={organizationName}
                    className="h-11 w-11 shrink-0 rounded-2xl border border-[#e8dece] bg-white object-contain p-1.5"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#e8dece] bg-[#fffaf4] text-xs font-semibold text-slate-700">
                    {getInitials(organizationName)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">{organizationName}</p>
                  <p className="truncate text-xs text-slate-500">{userName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {switchOrganizationHref ? (
                  <Link
                    href={switchOrganizationHref}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e8dece] bg-white text-slate-700 sm:hidden"
                    aria-label="Cambiar organización"
                    title="Cambiar organización"
                  >
                    <ArrowLeftRight size={18} />
                  </Link>
                ) : null}
                {showPrimaryShortcut ? (
                  <Link
                    href={primaryShortcutHref}
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white"
                  >
                    {primaryShortcutLabel}
                  </Link>
                ) : null}
              </div>
            </div>
          </header>

          <main className="w-full flex-1 px-4 py-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:px-8 lg:pb-8 xl:px-10 2xl:px-12">
            {children}
          </main>

          <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e8dece] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
            <div className={`grid ${mobileNavColumnsClass}`}>
              {primaryItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`m-1 flex flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-[11px] font-semibold transition ${
                      active
                        ? "bg-[#fff7eb] text-slate-950 shadow-[0_6px_18px_rgba(15,23,42,0.06)]"
                        : "text-slate-500"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}

export function V2PageHero({
  kicker,
  title,
  description,
  aside,
}: {
  kicker: string;
  title: string;
  description: string;
  aside?: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[#e8dece] bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.05)] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {kicker}
          </p>
          <h1 className="mt-3 font-poppins text-2xl font-semibold text-slate-950 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            {description}
          </p>
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
    </section>
  );
}

export function V2QuickLink({
  href,
  title,
  description,
  eyebrow,
  icon = "module",
  tone = "neutral",
  actionLabel = "Abrir",
}: {
  href: string;
  title: string;
  description: string;
  eyebrow?: string;
  icon?:
    | "organization"
    | "capture"
    | "clients"
    | "cash"
    | "quotes"
    | "orders"
    | "dashboard"
    | "switch"
    | "demo"
    | "admin"
    | "module";
  tone?: "neutral" | "amber" | "sky" | "emerald" | "slate" | "rose";
  actionLabel?: string;
}) {
  const iconMap = {
    organization: Building2,
    capture: Settings2,
    clients: Users,
    cash: Coins,
    quotes: FileText,
    orders: ClipboardList,
    dashboard: LayoutGrid,
    switch: ArrowLeftRight,
    demo: Sparkles,
    admin: BriefcaseBusiness,
    module: Menu,
  } as const;
  const toneMap = {
    neutral: {
      border: "border-[#e8dece]",
      badge: "bg-[#fffaf2] text-slate-700 border-[#e8dece]",
      iconWrap: "bg-[#fff7eb] text-slate-800 border-[#eadfcb]",
      hover: "hover:border-[#d6c8b3] hover:bg-[#fffdf9]",
    },
    amber: {
      border: "border-[#efd7b2]",
      badge: "bg-[#fff4da] text-amber-800 border-[#efd7b2]",
      iconWrap: "bg-[#fff1dc] text-amber-700 border-[#efd7b2]",
      hover: "hover:border-[#d9b97f] hover:bg-[#fffaf1]",
    },
    sky: {
      border: "border-[#cfe2f6]",
      badge: "bg-[#eef6ff] text-sky-800 border-[#cfe2f6]",
      iconWrap: "bg-[#edf6ff] text-sky-700 border-[#cfe2f6]",
      hover: "hover:border-[#9cc4ef] hover:bg-[#f8fbff]",
    },
    emerald: {
      border: "border-[#cfe8de]",
      badge: "bg-[#edf9f2] text-emerald-800 border-[#cfe8de]",
      iconWrap: "bg-[#edf9f2] text-emerald-700 border-[#cfe8de]",
      hover: "hover:border-[#9ed1b8] hover:bg-[#f7fdf9]",
    },
    slate: {
      border: "border-[#d7dce4]",
      badge: "bg-[#f2f4f7] text-slate-700 border-[#d7dce4]",
      iconWrap: "bg-[#f2f4f7] text-slate-700 border-[#d7dce4]",
      hover: "hover:border-[#b4becd] hover:bg-[#fbfcfd]",
    },
    rose: {
      border: "border-[#efd3dc]",
      badge: "bg-[#fff1f5] text-rose-800 border-[#efd3dc]",
      iconWrap: "bg-[#fff1f5] text-rose-700 border-[#efd3dc]",
      hover: "hover:border-[#e1a9ba] hover:bg-[#fff8fa]",
    },
  } as const;
  const Icon = iconMap[icon];
  const styles = toneMap[tone];

  return (
    <Link
      href={href}
      className={`group rounded-[28px] border bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.04)] transition sm:p-5 ${styles.border} ${styles.hover}`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${styles.iconWrap}`}
        >
          <Icon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${styles.badge}`}
            >
              {eyebrow}
            </span>
          ) : null}
          <p className="mt-3 text-base font-semibold text-slate-950">{title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span>{actionLabel}</span>
            <ArrowUpRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

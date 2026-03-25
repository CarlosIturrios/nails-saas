"use client";

import Link from "next/link";
import { Menu, UserCircle2, X } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

interface AppShellProps {
  children: ReactNode;
  className?: string;
}

interface AppHeaderBadge {
  label: string;
}

interface AppHeaderNavItem {
  href: string;
  label: string;
}

interface AppHeaderProps {
  eyebrow: string;
  title?: string;
  mobileTitle?: string;
  subtitle?: string;
  organizationName?: string | null;
  userName?: string;
  userEmail?: string;
  badges?: AppHeaderBadge[];
  navItems?: AppHeaderNavItem[];
  actions?: ReactNode;
  desktopLeadingSlot?: ReactNode;
}

interface MobileHeaderProps {
  title: string;
  onOpenMenu: () => void;
}

interface DesktopHeaderProps {
  eyebrow: string;
  title?: string;
  subtitle?: string;
  organizationName?: string | null;
  badges?: AppHeaderBadge[];
  actions?: ReactNode;
  leadingSlot?: ReactNode;
}

interface AppDrawerProps {
  open: boolean;
  title: string;
  userName?: string;
  userEmail?: string;
  organizationName?: string | null;
  badges?: AppHeaderBadge[];
  navItems?: AppHeaderNavItem[];
  actions?: ReactNode;
  onClose: () => void;
}

interface DrawerActionStackProps {
  children: ReactNode;
}

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}

function getInitials(name?: string) {
  if (!name) {
    return "TU";
  }

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "TU";
}

export function AppShell({ children, className = "" }: AppShellProps) {
  return (
    <div className={`admin-shell min-h-screen text-slate-950 ${className}`.trim()}>
      <div className="min-h-screen w-full">{children}</div>
    </div>
  );
}

export function MobileHeader({
  title,
  onOpenMenu,
}: MobileHeaderProps) {
  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between gap-3 rounded-[26px] border border-[#eadfcb] bg-white/92 px-3 py-2 shadow-[0_10px_26px_rgba(15,23,42,0.06)] backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenMenu}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e8dece] bg-[#fffdfa] text-slate-700 shadow-sm transition hover:bg-white"
            aria-label="Abrir menú"
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0">
            <p className="truncate font-poppins text-sm font-semibold text-slate-950">
              {title}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenMenu}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#e8dece] bg-[#fff8f2] text-slate-700 shadow-sm transition hover:bg-white"
          aria-label="Abrir perfil"
        >
          <UserCircle2 size={18} />
        </button>
      </div>
    </div>
  );
}

export function DesktopHeader({
  eyebrow,
  title,
  subtitle,
  organizationName,
  badges = [],
  actions,
  leadingSlot,
}: DesktopHeaderProps) {
  return (
    <div className="hidden lg:block">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {leadingSlot ? <div className="shrink-0">{leadingSlot}</div> : null}

          <div className="min-w-0">
            <p className="admin-label text-xs font-medium uppercase tracking-[0.16em] sm:text-sm">
              {eyebrow}
            </p>
            {title ? (
              <h1 className="admin-title mt-2 break-words font-poppins text-2xl font-semibold text-slate-950">
                {title}
              </h1>
            ) : null}
            {subtitle ? (
              <p className="mt-2 break-words text-sm leading-6 text-slate-700 sm:text-base">
                {subtitle}
              </p>
            ) : null}
            {organizationName ? (
              <p className="admin-muted mt-1 text-sm leading-6">
                Organización: {organizationName}
              </p>
            ) : null}
          </div>
        </div>

        {(badges.length > 0 || actions) ? (
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            {badges.map((badge) => (
              <span
                key={badge.label}
                className="inline-flex justify-center rounded-full border border-[#ddd1bf] bg-[#fffaf2] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700"
              >
                {badge.label}
              </span>
            ))}
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AppDrawer({
  open,
  title,
  userName,
  userEmail,
  organizationName,
  badges = [],
  navItems = [],
  actions,
  onClose,
}: AppDrawerProps) {
  const initials = useMemo(() => getInitials(userName), [userName]);

  if (!open) {
    return null;
  }

  return (
    <div className="lg:hidden">
      <div className="fixed inset-0 z-[90] bg-slate-950/28 backdrop-blur-[2px]" />
      <button
        type="button"
        aria-label="Cerrar menú"
        className="fixed inset-0 z-[91] cursor-default"
        onClick={onClose}
      />

      <aside className="fixed inset-y-0 left-0 z-[92] flex h-dvh w-[min(22rem,calc(100vw-1rem))] flex-col border-r border-[#eadfcb] bg-[rgba(255,253,250,0.98)] px-4 py-4 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="admin-label text-xs font-medium uppercase tracking-[0.16em]">
              Menú
            </p>
            <h2 className="mt-1 font-poppins text-lg font-semibold text-slate-950">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#e8dece] bg-white text-slate-700 shadow-sm"
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 rounded-[28px] border border-[#eadfcb] bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff3e8] text-sm font-semibold text-slate-800">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">
                {userName || "Tu cuenta"}
              </p>
              {userEmail ? (
                <p className="truncate text-xs text-slate-500">{userEmail}</p>
              ) : null}
            </div>
          </div>

          {organizationName ? (
            <div className="mt-4 rounded-2xl bg-[#fffaf4] px-3 py-3">
              <p className="admin-label text-[11px] font-semibold uppercase tracking-[0.14em]">
                Organización
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {organizationName}
              </p>
            </div>
          ) : null}

          {badges.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {badges.map((badge) => (
                <span
                  key={badge.label}
                  className="inline-flex rounded-full border border-[#ddd1bf] bg-[#fffaf2] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700"
                >
                  {badge.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {navItems.length > 0 ? (
          <nav className="mt-5 flex-1 space-y-2 overflow-y-auto pb-4">
            {navItems.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                onClick={onClose}
                className="flex items-center rounded-2xl border border-transparent bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition hover:border-[#eadfcb]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}

        {actions ? (
          <div className="mt-auto border-t border-[#efe6d8] pt-4">
            <div className="space-y-3">{actions}</div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

export function DrawerActionStack({ children }: DrawerActionStackProps) {
  return <div className="flex flex-col gap-3">{children}</div>;
}

export function AppHeader({
  eyebrow,
  title,
  mobileTitle,
  subtitle,
  organizationName,
  userName,
  userEmail,
  badges = [],
  navItems = [],
  actions,
  desktopLeadingSlot,
}: AppHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const resolvedMobileTitle = mobileTitle ?? title ?? "Inicio";

  return (
    <>
      <header className="border-b border-[#eadfcb] bg-white/84 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8 lg:py-4 xl:px-10">
        <MobileHeader
          title={resolvedMobileTitle}
          onOpenMenu={() => setDrawerOpen(true)}
        />

        <DesktopHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          organizationName={organizationName}
          badges={badges}
          actions={actions}
          leadingSlot={desktopLeadingSlot}
        />
      </header>

      <AppDrawer
        open={drawerOpen}
        title={resolvedMobileTitle}
        userName={userName}
        userEmail={userEmail}
        organizationName={organizationName}
        badges={badges}
        navItems={navItems}
        actions={actions}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}

export function AppMain({ children, className = "" }: AppShellProps) {
  return (
    <main
      className={`min-w-0 max-w-none px-4 py-5 sm:px-6 lg:px-8 lg:py-8 xl:px-10 ${className}`.trim()}
    >
      {children}
    </main>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  aside,
}: PageHeroProps) {
  return (
    <section className="admin-surface rounded-[28px] p-5 sm:rounded-3xl sm:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 max-w-3xl">
          <p className="admin-label text-xs font-medium uppercase tracking-[0.16em] sm:text-sm">
            {eyebrow}
          </p>
          <h1 className="admin-title mt-2 break-words font-poppins text-2xl font-semibold text-slate-950 sm:text-3xl">
            {title}
          </h1>
          <p className="admin-muted mt-3 text-sm leading-6 sm:text-base">
            {description}
          </p>
        </div>

        {aside ? <div className="w-full xl:w-auto">{aside}</div> : null}
      </div>
    </section>
  );
}

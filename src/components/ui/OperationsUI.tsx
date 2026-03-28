"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  CalendarDays,
  ListTodo,
  PlusCircle,
} from "lucide-react";

type Tone = "info" | "success" | "warning" | "danger" | "neutral";

interface StatusBadgeProps {
  tone?: Tone;
  children: ReactNode;
}

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
}

interface ActionTileProps {
  kicker: string;
  title: string;
  description: string;
  action: ReactNode;
  aside?: ReactNode;
}

interface QuickLinkCardProps {
  href: string;
  title: string;
  description: string;
  icon: "today" | "sale" | "agenda" | "clients" | "cash";
}

const TONE_CLASSNAME: Record<Tone, string> = {
  info: "ops-badge-info",
  success: "ops-badge-success",
  warning: "ops-badge-warning",
  danger: "ops-badge-danger",
  neutral: "ops-badge-neutral",
};

function resolveQuickLinkIcon(icon: QuickLinkCardProps["icon"]) {
  switch (icon) {
    case "sale":
      return <PlusCircle size={20} />;
    case "agenda":
      return <CalendarDays size={20} />;
    case "clients":
      return <ClipboardList size={20} />;
    case "cash":
      return <CircleDollarSign size={20} />;
    case "today":
    default:
      return <ListTodo size={20} />;
  }
}

export function StatusBadge({ tone = "neutral", children }: StatusBadgeProps) {
  return <span className={`ops-badge ${TONE_CLASSNAME[tone]}`}>{children}</span>;
}

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <article className="ops-stat-card">
      <p className="ops-kicker">{label}</p>
      <p className="ops-stat-value mt-3">{value}</p>
      {hint ? <p className="admin-muted mt-2 text-sm leading-6">{hint}</p> : null}
    </article>
  );
}

export function ActionTile({
  kicker,
  title,
  description,
  action,
  aside,
}: ActionTileProps) {
  return (
    <section className="ops-action-card p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="ops-kicker">{kicker}</p>
          <h2 className="ops-section-title mt-3">{title}</h2>
          <p className="admin-muted mt-3 max-w-2xl text-sm leading-6">{description}</p>
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
          {aside}
          {action}
        </div>
      </div>
    </section>
  );
}

export function QuickLinkCard({
  href,
  title,
  description,
  icon,
}: QuickLinkCardProps) {
  return (
    <Link
      href={href}
      className="ops-card-soft flex items-start gap-4 p-4 transition hover:-translate-y-0.5 hover:border-[var(--ops-border-strong)]"
    >
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--ops-primary)] shadow-sm">
        {resolveQuickLinkIcon(icon)}
      </span>
      <span className="min-w-0">
        <span className="block text-base font-semibold text-slate-950">{title}</span>
        <span className="admin-muted mt-1 block text-sm leading-6">{description}</span>
      </span>
    </Link>
  );
}

export function ActionHint({
  tone,
  children,
}: {
  tone: "success" | "warning" | "info";
  children: ReactNode;
}) {
  const icon =
    tone === "success" ? <CheckCircle2 size={16} /> :
    tone === "warning" ? <CircleDollarSign size={16} /> :
    <AlertCircle size={16} />;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
        tone === "success"
          ? "bg-emerald-50 text-emerald-700"
          : tone === "warning"
            ? "bg-amber-50 text-amber-700"
            : "bg-sky-50 text-sky-700"
      }`}
    >
      {icon}
      <span>{children}</span>
    </div>
  );
}

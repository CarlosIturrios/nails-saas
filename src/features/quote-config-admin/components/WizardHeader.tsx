"use client";

import type { ReactNode } from "react";

interface WizardHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}

export function WizardHeader({
  eyebrow,
  title,
  description,
  aside,
}: WizardHeaderProps) {
  return (
    <section className="admin-surface rounded-[28px] p-5 sm:p-6 lg:p-8">
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

        {aside ? <div className="w-full xl:w-[320px]">{aside}</div> : null}
      </div>
    </section>
  );
}

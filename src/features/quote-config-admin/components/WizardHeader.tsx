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
    <section className="rounded-[28px] border border-[#e8dece] bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.05)] sm:p-6 lg:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-sm">
            {eyebrow}
          </p>
          <h1 className="mt-3 break-words font-poppins text-2xl font-semibold text-slate-950 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            {description}
          </p>
        </div>

        {aside ? <div className="w-full xl:w-[320px]">{aside}</div> : null}
      </div>
    </section>
  );
}

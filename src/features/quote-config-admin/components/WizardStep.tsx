"use client";

import type { ReactNode } from "react";

interface WizardStepProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  description: string;
  children: ReactNode;
}

export function WizardStep({
  stepNumber,
  totalSteps,
  title,
  description,
  children,
}: WizardStepProps) {
  return (
    <section className="admin-surface rounded-[28px] p-5 sm:p-6 lg:p-8">
      <div className="border-b border-[#efe6d8] pb-4 sm:pb-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex rounded-full border border-[#ddd1bf] bg-[#fffaf2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
            Paso {stepNumber} de {totalSteps}
          </span>
        </div>
        <h2 className="admin-title mt-3 break-words font-poppins text-xl font-semibold text-slate-950 sm:text-2xl">
          {title}
        </h2>
        <p className="admin-muted mt-2 max-w-3xl text-sm leading-6 sm:text-base">
          {description}
        </p>
      </div>

      <div className="mt-5 sm:mt-6">{children}</div>
    </section>
  );
}

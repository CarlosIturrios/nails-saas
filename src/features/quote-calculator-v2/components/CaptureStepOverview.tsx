"use client";

import {
  CalendarClock,
  ClipboardList,
  PlayCircle,
  ReceiptText,
} from "lucide-react";
import { ServiceOrderFlowType } from "@prisma/client";

interface CaptureStepOverviewProps {
  flowType: ServiceOrderFlowType;
  operationModeLabel: string;
  operationModeDescription: string;
}

export function CaptureStepOverview({
  flowType,
  operationModeLabel,
  operationModeDescription,
}: CaptureStepOverviewProps) {
  return (
    <section className="grid gap-3 md:grid-cols-3">
      <article className="ops-card-soft p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[var(--ops-primary)] shadow-sm">
            <ClipboardList size={20} />
          </span>
          <div>
            <p className="ops-kicker">Paso 1</p>
            <h2 className="mt-2 text-base font-semibold text-slate-950 sm:text-lg">
              Arma el servicio
            </h2>
            <p className="admin-muted mt-2 text-sm leading-5 sm:leading-6">
              Selecciona servicios, extras y ajustes hasta cerrar el total.
            </p>
          </div>
        </div>
      </article>

      <article className="ops-card-soft p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[var(--ops-primary)] shadow-sm">
            {flowType === ServiceOrderFlowType.SCHEDULED ? (
              <CalendarClock size={20} />
            ) : (
              <PlayCircle size={20} />
            )}
          </span>
          <div>
            <p className="ops-kicker">Paso 2</p>
            <h2 className="mt-2 text-base font-semibold text-slate-950 sm:text-lg">
              {operationModeLabel}
            </h2>
            <p className="admin-muted mt-2 text-sm leading-5 sm:leading-6">
              {operationModeDescription}
            </p>
          </div>
        </div>
      </article>

      <article className="ops-card-soft p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[var(--ops-primary)] shadow-sm">
            <ReceiptText size={20} />
          </span>
          <div>
            <p className="ops-kicker">Paso 3</p>
            <h2 className="mt-2 text-base font-semibold text-slate-950 sm:text-lg">
              Guarda el resultado
            </h2>
            <p className="admin-muted mt-2 text-sm leading-5 sm:leading-6">
              Elige si esto queda como propuesta, trabajo o venta cobrada.
            </p>
          </div>
        </div>
      </article>
    </section>
  );
}

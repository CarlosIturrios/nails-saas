"use client";

import { AlertCircle, CheckCircle2, CloudCog, Clock3 } from "lucide-react";

export type InlineSaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

interface InlineSaveIndicatorProps {
  status: InlineSaveStatus;
  lastSavedAt?: number | null;
}

function formatRelativeSavedTime(value: number | null | undefined) {
  if (!value) {
    return "Todavía no se guarda";
  }

  const diff = Date.now() - value;

  if (diff < 15_000) {
    return "Guardado hace un momento";
  }

  if (diff < 60_000) {
    return "Guardado hace menos de 1 min";
  }

  const minutes = Math.floor(diff / 60_000);
  return `Guardado hace ${minutes} min`;
}

export function InlineSaveIndicator({
  status,
  lastSavedAt,
}: InlineSaveIndicatorProps) {
  const tone =
    status === "error"
      ? {
          wrap: "border-rose-200 bg-rose-50 text-rose-700",
          icon: <AlertCircle size={16} />,
          label: "Error al guardar",
          hint: "Revisa tu conexión o vuelve a intentar.",
        }
      : status === "saving"
        ? {
            wrap: "border-sky-200 bg-sky-50 text-sky-700",
            icon: <CloudCog size={16} className="animate-spin" />,
            label: "Guardando",
            hint: "Tus cambios se están guardando.",
          }
        : status === "dirty"
          ? {
              wrap: "border-amber-200 bg-amber-50 text-amber-700",
              icon: <Clock3 size={16} />,
              label: "Cambios pendientes",
              hint: "Se guardarán en automático.",
            }
          : {
              wrap: "border-emerald-200 bg-emerald-50 text-emerald-700",
              icon: <CheckCircle2 size={16} />,
              label: "Guardado",
              hint: formatRelativeSavedTime(lastSavedAt),
            };

  return (
    <div className={`rounded-2xl border px-4 py-3 ${tone.wrap}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex shrink-0">{tone.icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{tone.label}</p>
          <p className="mt-1 text-xs leading-5 opacity-90">{tone.hint}</p>
        </div>
      </div>
    </div>
  );
}

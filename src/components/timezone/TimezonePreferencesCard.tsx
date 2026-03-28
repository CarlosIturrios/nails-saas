"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import Toast from "@/src/components/ui/Toast";
import {
  formatTimezoneOffsetLabel,
  sanitizeTimezone,
  type TimezoneSource,
} from "@/src/lib/dates";

interface TimezonePreferencesCardProps {
  currentTimezone: string;
  currentSource: TimezoneSource;
  userTimezone: string | null;
  detectedTimezone: string | null;
  organizationTimezone: string;
  organizationName: string;
  timezoneOptions: string[];
}

function getSourceLabel(source: TimezoneSource) {
  if (source === "user") {
    return "Preferencia del perfil";
  }

  if (source === "device") {
    return "Zona detectada del dispositivo";
  }

  if (source === "organization") {
    return "Fallback de la organización";
  }

  return "Fallback UTC";
}

export function TimezonePreferencesCard({
  currentTimezone,
  currentSource,
  userTimezone,
  detectedTimezone,
  organizationTimezone,
  organizationName,
  timezoneOptions,
}: TimezonePreferencesCardProps) {
  const router = useRouter();
  const [draftTimezone, setDraftTimezone] = useState(
    userTimezone ?? detectedTimezone ?? organizationTimezone
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const timezonePreview = useMemo(() => {
    const safeTimezone = sanitizeTimezone(draftTimezone);

    if (!safeTimezone) {
      return "Escribe una zona IANA válida, por ejemplo America/Tijuana.";
    }

    return `${safeTimezone} · ${formatTimezoneOffsetLabel(safeTimezone)}`;
  }, [draftTimezone]);

  async function saveUserTimezone(nextTimezone: string | null) {
    setSaving(true);

    try {
      const response = await fetch("/api/preferences/timezone", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timezone: nextTimezone,
          detectedTimezone,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo guardar la zona horaria");
      }

      setToast({
        message:
          nextTimezone === null
            ? "Se activó el modo automático de zona horaria."
            : "Zona horaria guardada correctamente.",
        type: "success",
      });
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section
        id="zona-horaria"
        className="rounded-[28px] border border-[#e8dece] bg-white p-5 sm:p-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Zona horaria
        </p>
        <h2 className="mt-3 font-poppins text-2xl font-semibold text-slate-950">
          Tu horario de trabajo
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          La app usa esta zona para mostrar horas, calcular &quot;hoy&quot;, filtros por rango y cortes
          de caja. Todo se sigue guardando en UTC.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#efe6d8] bg-[#fffdfa] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Activa ahora
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{currentTimezone}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Fuente: {getSourceLabel(currentSource)}.
            </p>
          </div>

          <div className="rounded-2xl border border-[#efe6d8] bg-[#fffdfa] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Dispositivo
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {detectedTimezone || "No disponible"}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Si viajas, este valor puede cambiar y la app lo tomará cuando dejes el perfil en automático.
            </p>
          </div>

          <div className="rounded-2xl border border-[#efe6d8] bg-[#fffdfa] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Fallback del negocio
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{organizationTimezone}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Se usa para {organizationName} cuando no existe una zona fija de usuario ni se puede detectar el dispositivo.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-900">Zona horaria fija del perfil</span>
            <input
              list="timezone-options"
              value={draftTimezone}
              onChange={(event) => setDraftTimezone(event.target.value)}
              placeholder="Ejemplo: America/Tijuana"
              className="admin-input w-full px-4 py-3 text-sm"
            />
            <datalist id="timezone-options">
              {timezoneOptions.map((timezone) => (
                <option key={timezone} value={timezone} />
              ))}
            </datalist>
            <p className="text-sm leading-6 text-slate-600">{timezonePreview}</p>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <button
              type="button"
              onClick={() => saveUserTimezone(sanitizeTimezone(draftTimezone) ?? draftTimezone)}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar zona fija"}
            </button>
            <button
              type="button"
              onClick={() => saveUserTimezone(null)}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-2xl border border-[#e8dece] px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-60"
            >
              Usar automático
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[#e8dece] bg-[#fffdfa] p-4 text-sm leading-6 text-slate-600">
          Si eliges una zona fija, seguirá igual aunque viajes. Si usas automático, la prioridad será:
          dispositivo detectado y, si eso falla, la zona de la organización.
        </div>
      </section>

      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      ) : null}
    </>
  );
}

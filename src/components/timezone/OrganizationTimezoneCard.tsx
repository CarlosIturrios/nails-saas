"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import Toast from "@/src/components/ui/Toast";
import { formatTimezoneOffsetLabel, sanitizeTimezone } from "@/src/lib/dates";

interface OrganizationTimezoneCardProps {
  organizationId: string | null;
  organizationName: string | null;
  defaultTimezone: string;
  detectedTimezone: string | null;
  timezoneOptions: string[];
}

export function OrganizationTimezoneCard({
  organizationId,
  organizationName,
  defaultTimezone,
  detectedTimezone,
  timezoneOptions,
}: OrganizationTimezoneCardProps) {
  const router = useRouter();
  const [draftTimezone, setDraftTimezone] = useState(defaultTimezone);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const timezonePreview = useMemo(() => {
    const safeTimezone = sanitizeTimezone(draftTimezone);

    if (!safeTimezone) {
      return "Escribe una zona IANA válida, por ejemplo America/Hermosillo.";
    }

    return `${safeTimezone} · ${formatTimezoneOffsetLabel(safeTimezone)}`;
  }, [draftTimezone]);

  async function saveOrganizationTimezone() {
    if (!organizationId) {
      setToast({
        message: "Selecciona una organización antes de continuar.",
        type: "info",
      });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/organization-admin/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          defaultTimezone: draftTimezone,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo guardar la zona horaria");
      }

      setToast({
        message: payload.message || "Zona horaria guardada correctamente.",
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
      <div className="admin-surface rounded-3xl p-6 sm:p-8">
        <p className="admin-label text-sm font-medium">Zona horaria de la organización</p>
        <h2 className="admin-title mt-2 font-poppins text-2xl font-semibold text-slate-950">
          Fallback operativo
        </h2>
        <p className="admin-muted mt-3 text-sm leading-6">
          Esta zona se usa cuando una persona no tiene zona fija en su perfil y tampoco se pudo detectar la del dispositivo.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] border border-[#e8dece] bg-[#fffdf9] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Organización
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {organizationName ?? "Sin organización activa"}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Zona actual: {defaultTimezone}
            </p>
          </div>

          <div className="rounded-[24px] border border-[#e8dece] bg-[#fffdf9] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Referencia del dispositivo
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {detectedTimezone || "No disponible"}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Úsala como guía si el equipo trabaja normalmente en una sola región.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <label className="space-y-2">
            <span className="admin-label block text-sm font-medium">Zona horaria por default</span>
            <input
              list="organization-timezone-options"
              value={draftTimezone}
              onChange={(event) => setDraftTimezone(event.target.value)}
              placeholder="Ejemplo: America/Tijuana"
              className="admin-input w-full px-4 py-3 text-sm"
            />
            <datalist id="organization-timezone-options">
              {timezoneOptions.map((timezone) => (
                <option key={timezone} value={timezone} />
              ))}
            </datalist>
            <p className="admin-muted text-sm leading-6">{timezonePreview}</p>
          </label>

          <button
            type="button"
            onClick={saveOrganizationTimezone}
            disabled={saving}
            className="admin-primary px-5 py-3 text-sm font-semibold disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar fallback"}
          </button>
        </div>
      </div>

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

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { OrganizationWorkspace } from "@/src/components/home/OrganizationWorkspace";
import { PageHero } from "@/src/components/layout/AppShell";
import Toast from "@/src/components/ui/Toast";
import {
  QUOTE_CONFIG_PRESETS,
  QuoteConfigPresetKey,
} from "@/src/features/quote-calculator-v2/lib/presets";

interface HomeClientProps {
  organizationCount: number;
  currentOrganizationId: string | null;
  currentOrganizationName: string | null;
  canAccessAdmin: boolean;
  canManageOrganizations: boolean;
  organizations: Array<{
    id: string;
    name: string;
    logoUrl?: string | null;
  }>;
  canCreateOrganization: boolean;
}

export function HomeClient({
  organizationCount,
  currentOrganizationId,
  currentOrganizationName,
  canAccessAdmin,
  canManageOrganizations,
  organizations,
  canCreateOrganization,
}: HomeClientProps) {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [quoteConfigPreset, setQuoteConfigPreset] = useState<QuoteConfigPresetKey>("none");
  const [submitting, setSubmitting] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  async function activateOrganization(organizationId: string, destination = "/home") {
    setSwitching(true);

    try {
      const response = await fetch("/api/organizations/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo cambiar la organización");
      }

      router.push(destination);
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setSwitching(false);
    }
  }

  async function clearActiveOrganization() {
    setSwitching(true);

    try {
      const response = await fetch("/api/organizations/active", {
        method: "DELETE",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo salir de la organización");
      }

      router.push("/home");
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setSwitching(false);
    }
  }

  async function createOrganization() {
    if (!organizationName.trim()) {
      setToast({
        message: "Escribe un nombre para la organización",
        type: "info",
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: organizationName, quoteConfigPreset }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo crear la organización");
      }

      setOrganizationName("");
      setToast({
        message: "Organización creada correctamente",
        type: "success",
      });
      router.push("/home");
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="space-y-5 sm:space-y-6">
        <section className="space-y-5">
          <PageHero
            eyebrow="Inicio"
            title="Bienvenido"
            description={
              currentOrganizationName
                ? `Tu organización activa es ${currentOrganizationName}.`
                : canCreateOrganization
                  ? "Aún no tienes una organización activa. Crea la primera para comenzar a usar el sistema."
                  : "En este momento no tienes acceso al sistema. Por favor comunícate con tu administrador."
            }
          />

          <section className="admin-surface rounded-3xl p-6 sm:p-8">
            {currentOrganizationName ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() =>
                    currentOrganizationId
                      ? activateOrganization(currentOrganizationId, "/cotizaciones/v2")
                      : router.push("/home")
                  }
                  disabled={switching}
                  className="admin-primary w-full px-5 py-3 text-sm font-semibold disabled:opacity-60 sm:w-auto"
                >
                  Ir a cotizaciones
                </button>

                <Link
                  href="/cotizaciones"
                  className="admin-secondary inline-flex w-full items-center justify-center px-5 py-3 text-center text-sm font-semibold sm:w-auto"
                >
                  Demo cotización manicurista
                </Link>

                {canAccessAdmin ? (
                  <Link
                    href="/admin"
                    className="admin-secondary inline-flex w-full items-center justify-center px-5 py-3 text-center text-sm font-semibold sm:w-auto"
                  >
                    Ir al panel admin
                  </Link>
                ) : null}

                {canManageOrganizations ? (
                  <Link
                    href="/organization-admin"
                    className="admin-secondary inline-flex w-full items-center justify-center px-5 py-3 text-center text-sm font-semibold sm:w-auto"
                  >
                    Administrar organización
                  </Link>
                ) : null}
              </div>
            ) : canCreateOrganization ? (
              <div className="space-y-5">
                <label className="block space-y-2">
                  <span className="admin-label block text-sm font-medium">
                    Nombre de la organización
                  </span>
                  <input
                    value={organizationName}
                    onChange={(event) => setOrganizationName(event.target.value)}
                    placeholder="Ejemplo: GICA Nails"
                    className="admin-input px-4 py-3 text-sm"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="admin-label block text-sm font-medium">
                    Configuración inicial de cotizaciones
                  </span>
                  <select
                    value={quoteConfigPreset}
                    onChange={(event) =>
                      setQuoteConfigPreset(event.target.value as QuoteConfigPresetKey)
                    }
                    className="admin-input px-4 py-3 text-sm"
                  >
                    {Object.entries(QUOTE_CONFIG_PRESETS).map(([value, preset]) => (
                      <option key={value} value={value}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                  <p className="admin-muted text-sm leading-6">
                    {QUOTE_CONFIG_PRESETS[quoteConfigPreset].description}
                  </p>
                </label>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <button
                    type="button"
                    onClick={createOrganization}
                    disabled={submitting}
                    className="admin-primary w-full px-5 py-3 text-sm font-semibold disabled:opacity-60 sm:w-auto"
                  >
                    {submitting ? "Creando..." : "Crear organización"}
                  </button>

                  {canAccessAdmin ? (
                    <Link
                      href="/admin"
                      className="admin-secondary inline-flex w-full items-center justify-center px-5 py-3 text-sm font-semibold sm:w-auto"
                    >
                      Ir al panel admin
                    </Link>
                  ) : null}

                  {canManageOrganizations ? (
                    <Link
                      href="/organization-admin"
                      className="admin-secondary inline-flex w-full items-center justify-center px-5 py-3 text-sm font-semibold sm:w-auto"
                    >
                      Administrar organización
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : canAccessAdmin || canManageOrganizations ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {canAccessAdmin ? (
                  <Link
                    href="/admin"
                    className="admin-secondary inline-flex w-full items-center justify-center px-5 py-3 text-sm font-semibold sm:w-auto"
                  >
                    Ir al panel admin
                  </Link>
                ) : null}

                {canManageOrganizations ? (
                  <Link
                    href="/organization-admin"
                    className="admin-secondary inline-flex w-full items-center justify-center px-5 py-3 text-sm font-semibold sm:w-auto"
                  >
                    Administrar organización
                  </Link>
                ) : null}
              </div>
            ) : null}
          </section>
        </section>

        {!currentOrganizationId ? (
          <OrganizationWorkspace
            organizations={organizations}
            currentOrganizationId={currentOrganizationId}
            currentOrganizationName={currentOrganizationName}
            switching={switching}
            onActivate={(organizationId) => activateOrganization(organizationId)}
            onClear={organizationCount > 1 ? clearActiveOrganization : undefined}
          />
        ) : null}
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

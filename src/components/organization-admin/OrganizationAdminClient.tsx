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

interface OrganizationAdminClientProps {
  canCreateOrganization: boolean;
  currentOrganizationId: string | null;
  currentOrganizationName: string | null;
  manageableOrganizations: Array<{
    id: string;
    name: string;
  }>;
  members: Array<{
    id: string;
    role: string;
    createdAt: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
}

export function OrganizationAdminClient({
  canCreateOrganization,
  currentOrganizationId,
  currentOrganizationName,
  manageableOrganizations,
  members,
}: OrganizationAdminClientProps) {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [quoteConfigPreset, setQuoteConfigPreset] = useState<QuoteConfigPresetKey>("none");
  const [email, setEmail] = useState("");
  const [creatingOrganization, setCreatingOrganization] = useState(false);
  const [assigningUser, setAssigningUser] = useState(false);
  const [switchingOrganization, setSwitchingOrganization] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  async function activateOrganization(organizationId: string) {
    setSwitchingOrganization(true);

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

      router.push("/organization-admin");
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setSwitchingOrganization(false);
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

    setCreatingOrganization(true);

    try {
      const response = await fetch("/api/organization-admin/organizations", {
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
      router.push("/organization-admin");
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setCreatingOrganization(false);
    }
  }

  async function assignExistingUser() {
    if (!currentOrganizationId) {
      setToast({
        message: "Selecciona primero la organización que quieres administrar",
        type: "info",
      });
      return;
    }

    if (!email.trim()) {
      setToast({
        message: "Escribe el correo del usuario",
        type: "info",
      });
      return;
    }

    setAssigningUser(true);

    try {
      const response = await fetch("/api/organization-admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          organizationId: currentOrganizationId,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo asignar el usuario");
      }

      setEmail("");
      setToast({
        message: payload.message || "Usuario asignado correctamente",
        type: payload.status === "existing" ? "info" : "success",
      });
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setAssigningUser(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <PageHero
          eyebrow="Administración de organización"
          title="Gestiona accesos y organizaciones"
          description="Desde aquí puedes administrar las organizaciones que tienes asignadas como administrador y agregar usuarios existentes usando su correo."
          aside={
            <Link
              href="/organization-admin/cotizaciones-v2"
              className="admin-secondary inline-flex w-full items-center justify-center px-5 py-3 text-sm font-semibold xl:w-auto"
            >
              Configurar cotizaciones
            </Link>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
          <section className="space-y-6">
            <div className="admin-surface rounded-3xl p-6 sm:p-8">
              <p className="admin-label text-sm font-medium">Organización activa</p>
              <h2 className="admin-title mt-2 font-poppins text-2xl font-semibold text-slate-950">
                {currentOrganizationName ?? "Selecciona una organización"}
              </h2>
              <p className="admin-muted mt-3 text-sm leading-6">
                {currentOrganizationName
                  ? "Escribe el correo del usuario que quieres agregar. Si ya existe en la base, se ligará a esta organización."
                  : "Primero selecciona una organización para poder administrar sus usuarios."}
              </p>

              <div className="mt-6 space-y-4">
                <label className="block space-y-2">
                  <span className="admin-label block text-sm font-medium">
                    Correo del usuario
                  </span>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="usuario@correo.com"
                    className="admin-input px-4 py-3 text-sm"
                  />
                </label>

                <button
                  type="button"
                  onClick={assignExistingUser}
                  disabled={assigningUser || !currentOrganizationId}
                  className="admin-primary w-full px-5 py-3 text-sm font-semibold disabled:opacity-60 sm:w-auto"
                >
                  {assigningUser ? "Asignando..." : "Asignar usuario existente"}
                </button>
              </div>
            </div>

            <div className="admin-surface rounded-3xl p-6 sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="admin-label text-sm font-medium">Miembros actuales</p>
                  <h2 className="admin-title mt-2 font-poppins text-2xl font-semibold text-slate-950">
                    Usuarios ligados
                  </h2>
                </div>
                {currentOrganizationName ? (
                  <span className="inline-flex rounded-full border border-[#ddd1bf] bg-[#fffaf2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                    {currentOrganizationName}
                  </span>
                ) : null}
              </div>

              {members.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="admin-panel flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {member.user.firstName} {member.user.lastName}
                        </p>
                        <p className="admin-muted mt-1 break-words text-sm">
                          {member.user.email}
                        </p>
                      </div>
                      <span className="inline-flex w-fit rounded-full border border-[#ddd1bf] bg-[#fffaf2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-[#eadfcb] bg-[#fffaf4] p-5">
                  <p className="text-sm font-medium text-slate-700">
                    Aún no hay usuarios ligados a esta organización.
                  </p>
                  <p className="admin-muted mt-2 text-sm leading-6">
                    Usa el campo de correo para agregar a un usuario existente.
                  </p>
                </div>
              )}
            </div>

            {canCreateOrganization ? (
              <div className="admin-surface rounded-3xl p-6 sm:p-8">
                <p className="admin-label text-sm font-medium">Nueva organización</p>
                <h2 className="admin-title mt-2 font-poppins text-2xl font-semibold text-slate-950">
                  Crea otra organización
                </h2>
                <p className="admin-muted mt-3 text-sm leading-6">
                  Al crearla, quedarás ligado como administrador y pasará a ser tu organización activa.
                </p>

                <div className="mt-6 space-y-4">
                  <label className="block space-y-2">
                    <span className="admin-label block text-sm font-medium">
                      Nombre de la organización
                    </span>
                    <input
                      value={organizationName}
                      onChange={(event) => setOrganizationName(event.target.value)}
                      placeholder="Ejemplo: GICA Dental"
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

                  <button
                    type="button"
                    onClick={createOrganization}
                    disabled={creatingOrganization}
                    className="admin-primary w-full px-5 py-3 text-sm font-semibold disabled:opacity-60 sm:w-auto"
                  >
                    {creatingOrganization ? "Creando..." : "Crear organización"}
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <OrganizationWorkspace
            organizations={manageableOrganizations}
            currentOrganizationId={currentOrganizationId}
            currentOrganizationName={currentOrganizationName}
            switching={switchingOrganization}
            onActivate={activateOrganization}
          />
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

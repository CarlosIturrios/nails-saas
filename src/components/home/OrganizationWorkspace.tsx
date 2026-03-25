"use client";

import { useMemo, useState } from "react";
import { OrganizationSelector } from "@/src/components/organization/OrganizationSelector";

interface OrganizationWorkspaceProps {
  organizations: Array<{
    id: string;
    name: string;
    logoUrl?: string | null;
  }>;
  currentOrganizationId: string | null;
  currentOrganizationName: string | null;
  switching?: boolean;
  selectionOnly?: boolean;
  onActivate: (organizationId: string) => void;
  onClear?: () => void;
}

export function OrganizationWorkspace({
  organizations,
  currentOrganizationId,
  currentOrganizationName,
  switching = false,
  selectionOnly = false,
  onActivate,
  onClear,
}: OrganizationWorkspaceProps) {
  const [search, setSearch] = useState("");
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(
    currentOrganizationId ?? organizations[0]?.id ?? ""
  );

  const filteredOrganizations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return organizations;
    }

    return organizations.filter((organization) =>
      organization.name.toLowerCase().includes(normalizedSearch)
    );
  }, [organizations, search]);

  const selectedOrganization =
    organizations.find((organization) => organization.id === selectedOrganizationId) ??
    null;

  return (
    <section className="admin-surface rounded-3xl p-6 sm:p-8">
      <div className="flex flex-col gap-4 border-b border-[#efe6d8] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="admin-label text-sm font-medium">
            Organización
          </p>
          <h2 className="admin-title mt-2 font-poppins text-xl font-semibold text-slate-950 sm:text-2xl">
            {selectionOnly ? "Elige dónde quieres trabajar" : "Administra tu acceso"}
          </h2>
          <p className="admin-muted mt-2 max-w-2xl text-sm leading-6">
            {selectionOnly
              ? "Busca y selecciona la organización que quieres usar en esta sesión."
              : "Consulta tu organización activa, cambia de espacio o sal de la organización actual."}
          </p>
        </div>

        {currentOrganizationName ? (
          <div className="w-full rounded-2xl border border-[#eadfcb] bg-[#fffaf4] px-4 py-3 sm:w-auto">
            <p className="admin-label text-xs font-semibold uppercase tracking-[0.16em]">
              Organización activa
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {currentOrganizationName}
            </p>
          </div>
        ) : null}
      </div>

      {organizations.length > 1 ? (
        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <OrganizationSelector
            organizations={filteredOrganizations}
            currentOrganizationId={currentOrganizationId}
            selectedOrganizationId={selectedOrganizationId}
            search={search}
            onSearchChange={setSearch}
            onSelect={setSelectedOrganizationId}
          />

            <aside className="admin-panel rounded-2xl p-5 sm:p-6">
              <p className="admin-label text-sm font-medium">
                Selección
              </p>
              <h3 className="mt-2 break-words font-poppins text-lg font-semibold text-slate-950 sm:text-xl">
                {selectedOrganization?.name ?? "Selecciona una organización"}
              </h3>
              <p className="admin-muted mt-2 text-sm leading-6">
                {selectedOrganization
                  ? "Usa este espacio para ver cotizaciones, administrar datos o cambiar tu contexto de trabajo."
                  : "Primero elige una organización de la lista para continuar."}
              </p>

              <div className="mt-5 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => selectedOrganizationId && onActivate(selectedOrganizationId)}
                  disabled={!selectedOrganizationId || switching}
                  className="admin-primary w-full px-4 py-3 text-sm font-semibold disabled:opacity-60"
                >
                  {switching
                    ? "Cambiando..."
                    : selectionOnly
                      ? "Entrar con esta organización"
                      : "Usar esta organización"}
                </button>

                {!selectionOnly && onClear ? (
                  <button
                    type="button"
                    onClick={onClear}
                    disabled={switching}
                    className="admin-secondary w-full px-4 py-3 text-sm font-medium disabled:opacity-60"
                  >
                    Salir de la organización actual
                  </button>
                ) : null}
              </div>
            </aside>
        </div>
      ) : currentOrganizationName ? (
        <div className="mt-6 rounded-2xl border border-[#eadfcb] bg-[#fffaf4] p-5">
          <p className="admin-label text-sm font-medium">
            Tu organización
          </p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {currentOrganizationName}
          </p>
          <p className="admin-muted mt-2 text-sm leading-6">
            Esta es la única organización disponible para tu usuario en este momento.
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-[#eadfcb] bg-[#fffaf4] p-5">
          <p className="text-sm font-medium text-slate-700">
            Aún no tienes una organización disponible.
          </p>
          <p className="admin-muted mt-2 text-sm leading-6">
            Cuando te asignen una organización, podrás verla y cambiarla desde aquí.
          </p>
        </div>
      )}
    </section>
  );
}

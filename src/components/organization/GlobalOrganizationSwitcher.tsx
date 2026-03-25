"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { OrganizationSelector } from "@/src/components/organization/OrganizationSelector";

interface GlobalOrganizationSwitcherProps {
  currentOrganizationId: string | null;
  currentOrganizationName: string | null;
  organizations: Array<{
    id: string;
    name: string;
    logoUrl?: string | null;
  }>;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() ?? "")
    .join("");
}

export function GlobalOrganizationSwitcher({
  currentOrganizationId,
  currentOrganizationName,
  organizations,
}: GlobalOrganizationSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(
    currentOrganizationId ?? organizations[0]?.id ?? ""
  );
  const [switching, setSwitching] = useState(false);

  const currentOrganization =
    organizations.find((item) => item.id === currentOrganizationId) ?? null;

  const filteredOrganizations = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return organizations;
    }

    return organizations.filter((organization) =>
      organization.name.toLowerCase().includes(normalized)
    );
  }, [organizations, search]);

  if (
    !pathname ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/select-organization") ||
    organizations.length === 0
      ) {
    return null;
  }

  async function handleActivate(organizationId: string) {
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

      setOpen(false);
      router.refresh();
    } catch {
      setSwitching(false);
      return;
    }

    setSwitching(false);
  }

  return (
    <>
      <div className="fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6 lg:right-8 xl:right-10">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group admin-surface inline-flex items-center gap-3 rounded-full px-2.5 py-2.5 text-left shadow-sm transition-all duration-200 hover:shadow-md focus-visible:shadow-md"
        >
          {currentOrganization?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentOrganization.logoUrl}
              alt={currentOrganization.name}
              className="h-10 w-10 shrink-0 rounded-full border border-[#eadfcb] bg-white object-contain p-1.5"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#eadfcb] bg-[#fffaf4] text-xs font-semibold text-slate-700">
              {getInitials(currentOrganizationName || organizations[0]?.name || "OR") || "OR"}
            </div>
          )}

          <div className="hidden min-w-0 overflow-hidden transition-all duration-200 sm:block sm:max-w-0 sm:opacity-0 sm:group-hover:max-w-[220px] sm:group-hover:opacity-100 sm:group-focus-visible:max-w-[220px] sm:group-focus-visible:opacity-100">
            <p className="admin-label whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.14em]">
              Organización
            </p>
            <p className="truncate whitespace-nowrap text-sm font-semibold text-slate-900">
              {currentOrganizationName || "Elegir organización"}
            </p>
          </div>

          <span className="hidden whitespace-nowrap text-xs font-semibold text-slate-500 sm:block sm:max-w-0 sm:overflow-hidden sm:opacity-0 sm:transition-all sm:duration-200 sm:group-hover:max-w-[70px] sm:group-hover:opacity-100 sm:group-focus-visible:max-w-[70px] sm:group-focus-visible:opacity-100">
            Cambiar
          </span>
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            aria-label="Cerrar selector"
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />

          <div className="absolute inset-x-0 bottom-0 p-4 sm:inset-auto sm:right-6 sm:bottom-20 sm:w-[420px] sm:p-0 lg:right-8 xl:right-10">
            <div className="admin-surface rounded-[28px] p-5 shadow-xl sm:rounded-3xl sm:p-6">
              <div className="flex items-start justify-between gap-3 border-b border-[#efe6d8] pb-4">
                <div className="min-w-0">
                  <p className="admin-label text-sm font-medium">Cambiar organización</p>
                  <h2 className="mt-2 break-words font-poppins text-xl font-semibold text-slate-950">
                    {currentOrganizationName || "Elige dónde trabajar"}
                  </h2>
                  <p className="admin-muted mt-2 text-sm leading-6">
                    Selecciona otra organización para cambiar tu contexto de trabajo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="admin-secondary inline-flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold"
                >
                  ×
                </button>
              </div>

              <div className="mt-5">
                <OrganizationSelector
                  organizations={filteredOrganizations}
                  currentOrganizationId={currentOrganizationId}
                  selectedOrganizationId={selectedOrganizationId}
                  search={search}
                  onSearchChange={setSearch}
                  onSelect={setSelectedOrganizationId}
                  emptyTitle="No encontramos organizaciones con ese nombre."
                  emptyDescription="Prueba con otra palabra o limpia la búsqueda."
                />
              </div>

              <div className="mt-5 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => selectedOrganizationId && handleActivate(selectedOrganizationId)}
                  disabled={!selectedOrganizationId || switching}
                  className="admin-primary w-full px-4 py-3 text-sm font-semibold disabled:opacity-60"
                >
                  {switching ? "Cambiando..." : "Usar esta organización"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

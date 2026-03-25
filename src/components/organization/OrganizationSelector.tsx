"use client";

interface OrganizationSelectorProps {
  organizations: Array<{
    id: string;
    name: string;
    logoUrl?: string | null;
  }>;
  currentOrganizationId: string | null;
  selectedOrganizationId: string;
  search: string;
  emptyTitle?: string;
  emptyDescription?: string;
  onSearchChange: (value: string) => void;
  onSelect: (organizationId: string) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() ?? "")
    .join("");
}

export function OrganizationSelector({
  organizations,
  currentOrganizationId,
  selectedOrganizationId,
  search,
  emptyTitle = "No encontramos organizaciones con ese nombre.",
  emptyDescription = "Intenta con otra palabra o borra la búsqueda.",
  onSearchChange,
  onSelect,
}: OrganizationSelectorProps) {
  return (
    <div className="space-y-4">
      <label className="block space-y-2">
        <span className="admin-label block text-sm font-medium">
          Buscar organización
        </span>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Escribe el nombre de una organización"
          className="admin-input px-4 py-3 text-sm"
        />
      </label>

      <div className="admin-panel max-h-[380px] overflow-y-auto rounded-2xl p-2 sm:p-3">
        <div className="space-y-2">
          {organizations.length > 0 ? (
            organizations.map((organization) => {
              const isSelected = organization.id === selectedOrganizationId;
              const isActive = organization.id === currentOrganizationId;

              return (
                <button
                  key={organization.id}
                  type="button"
                  onClick={() => onSelect(organization.id)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    isSelected
                      ? "border-[#c6a66b] bg-[#fffaf2]"
                      : "border-transparent bg-white hover:border-[#eadfcb] hover:bg-[#fffdf9]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      {organization.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={organization.logoUrl}
                          alt={organization.name}
                          className="h-11 w-11 shrink-0 rounded-2xl border border-[#eadfcb] bg-white object-contain p-1.5"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#eadfcb] bg-[#fffaf4] text-xs font-semibold text-slate-700">
                          {getInitials(organization.name) || "OR"}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {organization.name}
                        </p>
                        <p className="admin-muted mt-1 text-sm">
                          {isActive ? "Actualmente en uso" : "Disponible para seleccionar"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border ${
                        isSelected
                          ? "border-[#c6a66b] bg-[#c6a66b]"
                          : "border-[#d8cbb8] bg-white"
                      }`}
                    />
                  </div>
                </button>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-[#eadfcb] px-4 py-10 text-center">
              <p className="text-sm font-medium text-slate-700">{emptyTitle}</p>
              <p className="admin-muted mt-2 text-sm">{emptyDescription}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import {
  useCallback,
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AdminFieldOption,
  AdminModelConfig,
  getEditableFields,
  getListFields,
} from "@/src/admin/config/models";
import { StatCard } from "@/src/components/ui/OperationsUI";
import { V2PageHero } from "@/src/features/v2/shell/V2Shell";
import { getInitialFormValues } from "@/src/admin/lib/form";
import { AdminModal } from "@/src/admin/components/AdminModal";
import DataTable from "@/src/admin/components/DataTable";
import DynamicForm from "@/src/admin/components/DynamicForm";
import Toast from "@/src/components/ui/Toast";
import { formatDate, toDatetimeLocalValue } from "@/src/lib/dates";

interface AdminListResponse {
  items: Array<Record<string, unknown> & { id: string }>;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface AdminModelClientProps {
  modelKey: string;
  config: AdminModelConfig;
  initialData: AdminListResponse;
  initialFormOptions: Record<string, AdminFieldOption[]>;
  timeZone: string;
}

function formatCellValue(value: unknown, type: string, timeZone: string) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-400">-</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-slate-400">-</span>;
    }

    return value.join(", ");
  }

  if (type === "boolean") {
    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
          value ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
        }`}
      >
        {value ? "Activo" : "Inactivo"}
      </span>
    );
  }

  if (type === "date") {
    return formatDate(String(value), {
      locale: "es-MX",
      timeZone,
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return String(value);
}

export function AdminModelClient({
  modelKey,
  config,
  initialData,
  initialFormOptions,
  timeZone,
}: AdminModelClientProps) {
  const listFields = useMemo(() => getListFields(config), [config]);
  const editableFields = useMemo(() => getEditableFields(config), [config]);
  const [rows, setRows] = useState(initialData.items);
  const [page, setPage] = useState(initialData.page);
  const [pageSize] = useState(initialData.pageSize);
  const [total, setTotal] = useState(initialData.total);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<(Record<string, unknown> & { id: string }) | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<(Record<string, unknown> & { id: string }) | null>(null);
  const [formOptions] = useState(initialFormOptions);
  const [formValues, setFormValues] = useState<Record<string, unknown>>(
    getInitialFormValues(config)
  );
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const didMountRef = useRef(false);
  const visibleCount = rows.length;
  const createLabel = `Nuevo ${config.singularLabel.toLowerCase()}`;
  const emptyTitle = `Todavía no hay ${config.label.toLowerCase()}.`;
  const searchSummary = deferredSearch
    ? `Filtrando por “${deferredSearch}”.`
    : "Sin filtros activos.";
  const emptyDescription = deferredSearch
    ? "Prueba con otro texto o limpia la búsqueda para volver a ver todos los registros."
    : `Crea el primer ${config.singularLabel.toLowerCase()} para empezar a trabajar esta sección.`;

  const fetchRows = useCallback(async (nextPage: number, nextSearch: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: String(pageSize),
      });

      if (nextSearch) {
        params.set("search", nextSearch);
      }

      const response = await fetch(`/api/admin/${modelKey}?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("No se pudo cargar la información");
      }

      const data = (await response.json()) as AdminListResponse;
      setRows(data.items);
      setPage(data.page);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [modelKey, pageSize]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    fetchRows(page, deferredSearch).catch((error: Error) => {
      setLoading(false);
      setToast({ message: error.message, type: "error" });
    });
  }, [deferredSearch, fetchRows, page]);

  function openCreateModal() {
    setEditingRow(null);
    setFormValues(getInitialFormValues(config));
    setModalOpen(true);
  }

  function openEditModal(row: Record<string, unknown> & { id: string }) {
    setEditingRow(row);

    const nextValues = editableFields.reduce<Record<string, unknown>>((acc, field) => {
      const currentValue = row[field.name];

      if (field.type === "date" && currentValue) {
        acc[field.name] = toDatetimeLocalValue(String(currentValue), timeZone);
        return acc;
      }

      if (field.type === "multiselect") {
        acc[field.name] = Array.isArray(currentValue) ? currentValue : [];
        return acc;
      }

      acc[field.name] = currentValue ?? (field.type === "boolean" ? false : "");
      return acc;
    }, {});

    setFormValues(nextValues);
    setModalOpen(true);
  }

  async function handleSubmit() {
    setSubmitting(true);

    try {
      const response = await fetch(`/api/admin/${modelKey}`, {
        method: editingRow ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingRow
            ? { id: editingRow.id, data: formValues }
            : { data: formValues }
        ),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo guardar");
      }

      setModalOpen(false);
      await fetchRows(page, deferredSearch);
      setToast({
        message: editingRow
          ? `${config.singularLabel} actualizado correctamente`
          : `${config.singularLabel} creado correctamente`,
        type: "success",
      });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function requestDelete(row: Record<string, unknown> & { id: string }) {
    setDeleteTarget(row);
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeletingId(deleteTarget.id);

    try {
      const response = await fetch(`/api/admin/${modelKey}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo eliminar");
      }

      const nextPage =
        rows.length === 1 && page > 1 ? page - 1 : page;

      await fetchRows(nextPage, deferredSearch);
      setDeleteTarget(null);
      setToast({
        message: `${config.singularLabel} eliminado correctamente`,
        type: "success",
      });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <section className="space-y-6">
        <V2PageHero
          kicker="Administración SaaS"
          title={config.label}
          description={
            config.description ||
            "Revisa, crea y ajusta la información de esta sección desde una sola vista."
          }
          aside={
            <div className="flex w-full flex-col gap-3 xl:w-[320px]">
              <div className="w-full min-w-0">
                <label className="admin-label mb-2 block text-sm font-medium">
                  Buscar
                </label>
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder={`Buscar en ${config.label.toLowerCase()}`}
                  className="admin-input px-4 py-3 text-sm"
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row xl:justify-end">
                {search ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="admin-secondary w-full px-5 py-3 text-sm font-semibold sm:w-auto"
                  >
                    Limpiar búsqueda
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="admin-primary w-full px-5 py-3 text-sm font-semibold sm:w-auto"
                >
                  {createLabel}
                </button>
              </div>
            </div>
          }
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Registros totales"
            value={total}
            hint="Conteo actual dentro de esta sección."
          />
          <StatCard
            label="Visibles ahora"
            value={visibleCount}
            hint={
              loading
                ? "Actualizando la lista..."
                : "Cantidad de registros mostrados en esta página."
            }
          />
          <StatCard
            label="Página actual"
            value={page}
            hint={`Se muestran hasta ${pageSize} registros por página.`}
          />
          <StatCard
            label="Filtros"
            value={deferredSearch ? "Activos" : "Sin filtro"}
            hint={searchSummary}
          />
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <section className="rounded-[28px] border border-[#e8dece] bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.04)] sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Registros
                </p>
                <h2 className="mt-3 font-poppins text-2xl font-semibold text-slate-950">
                  Listado actual
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {searchSummary} Usa editar para ajustar un registro o crea uno nuevo desde el botón principal.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex rounded-full border border-[#ddd1bf] bg-[#fffaf2] px-3 py-1 text-xs font-semibold text-slate-700">
                  {config.singularLabel}
                </span>
                <span className="inline-flex rounded-full border border-[#ddd1bf] bg-[#fffaf2] px-3 py-1 text-xs font-semibold text-slate-700">
                  {visibleCount} en pantalla
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-[#e8dece] bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.04)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Cómo trabajar aquí
            </p>
            <h2 className="mt-3 font-poppins text-xl font-semibold text-slate-950">
              Administra sin perder contexto
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Busca primero, revisa la fila correcta y usa editar para cambios puntuales. Si vas a dar de alta algo nuevo, hazlo desde el botón principal.
            </p>
          </section>
        </div>

        <DataTable
          columns={listFields.map((field) => ({
            key: field.name,
            label: field.label,
            render: (row: Record<string, unknown>) =>
              formatCellValue(row[field.name], field.type, timeZone),
          }))}
          rows={rows}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={(nextPage) =>
            startTransition(() => {
              setPage(nextPage);
            })
          }
          onEdit={openEditModal}
          onDelete={requestDelete}
          deletingId={deletingId}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          onCreate={openCreateModal}
          createLabel={createLabel}
        />
      </section>

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingRow
            ? `Editar ${config.singularLabel.toLowerCase()}`
            : `Nuevo ${config.singularLabel.toLowerCase()}`
        }
        description="Completa los datos y guarda los cambios."
      >
        <DynamicForm
          fields={editableFields}
          fieldOptions={formOptions}
          values={formValues}
          submitting={submitting}
          submitLabel={editingRow ? "Guardar cambios" : "Crear registro"}
          onChange={(fieldName, value) =>
            setFormValues((current) => ({ ...current, [fieldName]: value }))
          }
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </AdminModal>

      <AdminModal
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deletingId) {
            setDeleteTarget(null);
          }
        }}
        title={`Eliminar ${config.singularLabel.toLowerCase()}`}
        description="Esta acción eliminará el registro de forma permanente."
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4">
            <p className="text-sm font-semibold text-rose-700">
              ¿Seguro que quieres continuar?
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Esta acción no se puede deshacer. Si eliminas este{" "}
              {config.singularLabel.toLowerCase()}, dejará de estar disponible en el sistema.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              disabled={Boolean(deletingId)}
              className="admin-secondary w-full px-5 py-3 text-sm font-semibold disabled:opacity-50 sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={Boolean(deletingId)}
              className="w-full rounded-2xl border border-rose-200 bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50 sm:w-auto"
            >
              {deletingId ? "Eliminando..." : "Sí, eliminar"}
            </button>
          </div>
        </div>
      </AdminModal>

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

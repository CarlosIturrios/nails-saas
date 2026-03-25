"use client";

import type { ReactNode } from "react";

interface DataTableColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T extends { id: string }> {
  columns: DataTableColumn<T>[];
  rows: T[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  deletingId?: string | null;
}

export default function DataTable<T extends { id: string }>({
  columns,
  rows,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onEdit,
  onDelete,
  deletingId,
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = total === 0 ? 0 : Math.min(total, page * pageSize);
  const showDesktopEmpty = !loading && rows.length === 0;
  const showMobileEmpty = !loading && rows.length === 0;

  return (
    <div className="admin-surface w-full overflow-hidden rounded-3xl">
      <div className="flex flex-col gap-3 border-b border-[#efe6d8] px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        <p className="admin-muted text-sm leading-6">
          {loading ? "Cargando registros..." : `${from}-${to} de ${total} registros`}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1 || loading}
            className="admin-secondary w-full px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Anterior
          </button>
          <span className="text-center text-sm font-medium text-slate-700">
            Pagina {page} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
            className="admin-secondary w-full px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Siguiente
          </button>
        </div>
      </div>

      <div className="hidden md:block">
        {loading ? (
          <div className="admin-muted flex min-h-[280px] items-center justify-center px-6 py-14 text-center text-sm">
            Cargando datos...
          </div>
        ) : showDesktopEmpty ? (
          <div className="border-t border-[#efe6d8] px-6 py-14">
            <div className="admin-panel flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center">
              <p className="text-sm font-medium text-slate-700">
                No hay registros para mostrar.
              </p>
              <p className="admin-muted mt-2 max-w-md text-sm">
                Cuando existan registros, apareceran aqui con sus acciones disponibles.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-full divide-y divide-slate-100">
              <thead className="bg-[#faf6ef]">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="admin-label px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em]"
                    >
                      {column.label}
                    </th>
                  ))}
                  <th className="admin-label px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.16em]">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-slate-50/80">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className="align-top px-4 py-4 text-sm leading-6 text-slate-700 sm:px-6"
                      >
                        <div className="min-w-0 break-words">
                          {column.render
                            ? column.render(row)
                            : String(row[column.key as keyof T] ?? "-")}
                        </div>
                      </td>
                    ))}
                    <td className="align-top px-4 py-4 sm:px-6">
                      <div className="flex justify-end gap-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onEdit(row)}
                          className="admin-secondary px-3 py-2.5 text-sm font-semibold"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(row)}
                          disabled={deletingId === row.id}
                          className="rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === row.id ? "Eliminando..." : "Eliminar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-4 p-4 md:hidden">
        {loading ? (
          <div className="admin-panel admin-muted flex min-h-[220px] items-center justify-center rounded-2xl p-6 text-center text-sm">
            Cargando datos...
          </div>
        ) : showMobileEmpty ? (
          <div className="admin-panel flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center">
            <p className="text-sm font-medium text-slate-700">
              No hay registros para mostrar.
            </p>
            <p className="admin-muted mt-2 text-sm">
              Crea el primer registro para verlo aqui.
            </p>
          </div>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="admin-panel overflow-hidden rounded-2xl p-4">
              <div className="space-y-3">
                {columns.map((column) => (
                  <div key={column.key} className="min-w-0">
                    <p className="admin-label text-xs font-semibold uppercase tracking-[0.16em]">
                      {column.label}
                    </p>
                    <div className="mt-1 break-words text-sm leading-6 text-slate-700">
                      {column.render ? column.render(row) : String(row[column.key as keyof T] ?? "-")}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => onEdit(row)}
                  className="admin-secondary w-full px-3 py-2.5 text-sm font-semibold sm:flex-1"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(row)}
                  disabled={deletingId === row.id}
                  className="w-full rounded-xl border border-rose-200 px-3 py-2.5 text-sm font-semibold text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
                >
                  {deletingId === row.id ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

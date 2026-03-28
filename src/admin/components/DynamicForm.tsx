"use client";

import { useMemo, useState } from "react";

import {
  AdminFieldConfig,
  AdminFieldOption,
} from "@/src/admin/config/models";

interface DynamicFormProps {
  fields: AdminFieldConfig[];
  fieldOptions?: Record<string, AdminFieldOption[]>;
  values: Record<string, unknown>;
  submitting?: boolean;
  submitLabel: string;
  onChange: (fieldName: string, value: unknown) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function DynamicForm({
  fields,
  fieldOptions = {},
  values,
  submitting = false,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
}: DynamicFormProps) {
  const [optionSearch, setOptionSearch] = useState<Record<string, string>>({});

  const filteredOptions = useMemo(
    () =>
      fields.reduce<Record<string, AdminFieldOption[]>>((acc, field) => {
        const options = fieldOptions[field.name] ?? [];
        const search = optionSearch[field.name]?.trim().toLowerCase();

        if (!search) {
          acc[field.name] = options;
          return acc;
        }

        acc[field.name] = options.filter((option) => {
          const haystack = `${option.label} ${option.description ?? ""}`.toLowerCase();
          return haystack.includes(search);
        });

        return acc;
      }, {}),
    [fieldOptions, fields, optionSearch]
  );

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="rounded-[24px] border border-[#eadfcb] bg-[#fffaf4] p-4">
        <p className="text-sm font-semibold text-slate-900">Antes de guardar</p>
        <p className="admin-muted mt-2 text-sm leading-6">
          Completa los datos que quieras registrar. Los campos marcados con * son obligatorios.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {fields.map((field) => {
          const value = values[field.name];
          const options = filteredOptions[field.name] ?? fieldOptions[field.name] ?? [];
          const selectedValues =
            field.type === "multiselect" && Array.isArray(value)
              ? value.map((entry) => String(entry))
              : [];

          return (
            <div
              key={field.name}
              className={`space-y-2 ${field.type === "multiselect" ? "lg:col-span-2" : ""}`}
            >
              <span className="admin-label text-sm font-medium">
                {field.label}
                {field.required ? " *" : ""}
              </span>

              {field.helperText ? (
                <p className="admin-muted text-xs leading-5">
                  {field.helperText}
                </p>
              ) : null}

              {field.type === "select" || field.type === "relation" ? (
                <select
                  value={String(value ?? "")}
                  onChange={(event) => onChange(field.name, event.target.value)}
                  className="admin-input px-4 py-3 text-sm"
                >
                  <option value="">Selecciona una opción</option>
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : null}

              {field.type === "multiselect" ? (
                <div className="space-y-3 rounded-2xl border border-[#e8ddcc] bg-[#fffdf9] p-3">
                  <input
                    value={optionSearch[field.name] ?? ""}
                    onChange={(event) =>
                      setOptionSearch((current) => ({
                        ...current,
                        [field.name]: event.target.value,
                      }))
                    }
                    placeholder={`Buscar en ${field.label.toLowerCase()}`}
                    className="admin-input px-4 py-3 text-sm"
                  />

                  <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                    {options.length === 0 ? (
                      <p className="admin-muted rounded-2xl border border-dashed border-[#e8ddcc] px-4 py-5 text-sm text-center">
                        No hay opciones disponibles.
                      </p>
                    ) : (
                      options.map((option) => {
                        const checked = selectedValues.includes(option.value);

                        return (
                          <label
                            key={option.value}
                            className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition sm:px-4 ${
                              checked
                                ? "border-[#d8c8ae] bg-[#fff6e9]"
                                : "border-[#ece3d5] bg-white hover:border-[#dfcfb5]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) => {
                                const nextValues = event.target.checked
                                  ? [...selectedValues, option.value]
                                  : selectedValues.filter(
                                      (selectedValue) => selectedValue !== option.value
                                    );

                                onChange(field.name, nextValues);
                              }}
                              className="mt-1 h-4 w-4 rounded border-[#ccbda8] text-slate-900 focus:ring-[#9f8a6c]"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-slate-900">
                                {option.label}
                              </span>
                              {option.description ? (
                                <span className="admin-muted mt-1 block text-xs leading-5">
                                  {option.description}
                                </span>
                              ) : null}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : null}

              {field.type === "boolean" ? (
                <button
                  type="button"
                  onClick={() => onChange(field.name, !Boolean(value))}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                    value
                      ? "border-[#cfe2d2] bg-[#f3faf4] text-emerald-700"
                      : "border-[#ddd1bf] bg-[#fffdfa] text-slate-600"
                  }`}
                >
                  <span>{Boolean(value) ? "Sí" : "No"}</span>
                  <span
                    className={`h-6 w-11 rounded-full p-1 transition ${
                      value ? "bg-emerald-500" : "bg-[#cbbba6]"
                    }`}
                  >
                    <span
                      className={`block h-4 w-4 rounded-full bg-white transition ${
                        value ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </span>
                </button>
              ) : null}

              {field.type !== "select" &&
              field.type !== "relation" &&
              field.type !== "multiselect" &&
              field.type !== "boolean" ? (
                <input
                  type={field.type === "date" ? "datetime-local" : field.type}
                  value={
                    field.type === "date" && typeof value === "string"
                      ? value.slice(0, 16)
                      : String(value ?? "")
                  }
                  placeholder={field.placeholder}
                  onChange={(event) => onChange(field.name, event.target.value)}
                  className="admin-input px-4 py-3 text-sm"
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-[#efe6d8] pt-4 sm:flex-row sm:flex-wrap sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="admin-secondary w-full px-4 py-2.5 text-sm font-medium sm:w-auto"
        >
          Volver
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="admin-primary w-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {submitting ? "Guardando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

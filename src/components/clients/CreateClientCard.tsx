"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";

import Toast from "@/src/components/ui/Toast";

export function CreateClientCard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setToast({
        message: "Escribe el nombre del cliente para continuar.",
        type: "error",
      });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          email,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo crear el cliente");
      }

      setName("");
      setPhone("");
      setEmail("");
      setToast({
        message: `Cliente ${payload.client?.name ?? "creado"} guardado correctamente.`,
        type: "success",
      });
      startTransition(() => {
        router.refresh();
      });
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
      <section className="rounded-[28px] border border-[#e8dece] bg-white p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Alta manual
        </p>
        <h2 className="mt-3 font-poppins text-xl font-semibold text-slate-950">
          Agregar cliente
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Úsalo para registrar clientes antes de crear una venta. El teléfono y el correo son opcionales.
        </p>

        <form
          className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1fr)_auto] lg:items-end"
          onSubmit={handleSubmit}
        >
          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-900">Nombre</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Gloria Gonzalez"
              className="admin-input w-full px-4 py-3 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-900">Teléfono</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Opcional"
              className="admin-input w-full px-4 py-3 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-900">Correo</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Opcional"
              className="admin-input w-full px-4 py-3 text-sm"
            />
          </label>

          <button
            type="submit"
            disabled={saving || isPending}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving || isPending ? "Guardando..." : "Guardar cliente"}
          </button>
        </form>
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

import Link from "next/link";

import { getAdminModelEntries } from "@/src/admin/config/models";
import { requireAdminPageUser } from "@/src/admin/lib/auth";
import { PageHero } from "@/src/components/layout/AppShell";

export default async function AdminHomePage() {
  await requireAdminPageUser();
  const modelEntries = getAdminModelEntries();

  return (
    <section className="space-y-6">
      <PageHero
        eyebrow="Panel principal"
        title="Elige lo que quieres administrar"
        description="Entra a una sección para revisar registros, crear nuevos datos o actualizar relaciones del sistema."
      />

      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Link
          href="/admin/cotizaciones-v2"
          className="admin-surface rounded-3xl p-5 transition hover:border-[#d7c8b0] sm:p-6"
        >
          <h2 className="admin-title text-xl font-poppins font-semibold text-slate-950 sm:text-2xl">
            Cotizaciones
          </h2>
          <p className="admin-muted mt-3 text-sm leading-6">
            Configura branding, servicios, extras y reglas del nuevo módulo dinámico por organización.
          </p>
          <div className="mt-6 inline-flex rounded-2xl border border-[#ddd1bf] bg-[#fffdfa] px-4 py-2.5 text-sm font-semibold text-slate-900">
            Abrir configurador
          </div>
        </Link>

        {modelEntries.map(([key, config]) => (
          <Link
            key={key}
            href={`/admin/${key}`}
            className="admin-surface rounded-3xl p-5 transition hover:border-[#d7c8b0] sm:p-6"
          >
            <h2 className="admin-title text-xl font-poppins font-semibold text-slate-950 sm:text-2xl">
              {config.label}
            </h2>
            <p className="admin-muted mt-3 text-sm leading-6">
              {config.description || "Administración dinámica generada por configuración."}
            </p>
            <div className="mt-6 inline-flex rounded-2xl border border-[#ddd1bf] bg-[#fffdfa] px-4 py-2.5 text-sm font-semibold text-slate-900">
              Abrir seccion
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

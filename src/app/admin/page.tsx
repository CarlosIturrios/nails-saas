import Link from "next/link";

import { getAdminModelEntries } from "@/src/admin/config/models";
import { requireAdminPageUser } from "@/src/admin/lib/auth";
import { StatCard } from "@/src/components/ui/OperationsUI";
import { V2PageHero } from "@/src/features/v2/shell/V2Shell";

export default async function AdminHomePage() {
  await requireAdminPageUser();
  const modelEntries = getAdminModelEntries();

  return (
    <section className="space-y-6">
      <V2PageHero
        kicker="Administración"
        title="Administra la plataforma"
        description="Aquí administras modelos, cuentas, organizaciones y configuración avanzada. La operación diaria vive en el flujo principal."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Secciones globales"
          value={modelEntries.length + 1}
          hint="Incluye configuración de captura y modelos administrativos."
        />
        <StatCard
          label="Tipo de trabajo"
          value="Administración"
          hint="Úsalo para mantenimiento, soporte y gobierno del sistema."
        />
        <StatCard
          label="Flujo diario"
          value="Operación"
          hint="Capturar, pendientes y agenda siguen viviendo en la app principal."
        />
      </section>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Link
          href="/admin/cotizaciones-v2"
          className="admin-surface rounded-3xl p-5 transition hover:border-[#d7c8b0] sm:p-6"
        >
          <h2 className="admin-title text-xl font-poppins font-semibold text-slate-950 sm:text-2xl">
            Configurar captura
          </h2>
          <p className="admin-muted mt-3 text-sm leading-6">
            Configura branding, servicios, extras y reglas del módulo principal por organización.
          </p>
          <div className="mt-6 inline-flex rounded-2xl border border-[#ddd1bf] bg-[#fffdfa] px-4 py-2.5 text-sm font-semibold text-slate-900">
            Abrir módulo
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
              Abrir módulo
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

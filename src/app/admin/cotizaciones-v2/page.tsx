import { redirect } from "next/navigation";

import { requireAdminPageUser } from "@/src/admin/lib/auth";
import { QuoteConfigWizard } from "@/src/features/quote-config-admin/components/QuoteConfigWizard";
import {
  getOrganizationQuoteConfigView,
  listOrganizationsForQuoteConfig,
} from "@/src/features/quote-calculator-v2/lib/config";

interface AdminQuoteConfigPageProps {
  searchParams: Promise<{
    organizationId?: string;
  }>;
}

export default async function AdminQuoteConfigPage({
  searchParams,
}: AdminQuoteConfigPageProps) {
  await requireAdminPageUser();
  const [organizations, query] = await Promise.all([
    listOrganizationsForQuoteConfig(),
    searchParams,
  ]);

  if (organizations.length === 0) {
    return (
      <section className="admin-surface rounded-3xl p-6 sm:p-8">
        <p className="admin-label text-sm font-medium">Cotizaciones</p>
        <h1 className="admin-title mt-2 font-poppins text-3xl font-semibold text-slate-950">
          No hay organizaciones disponibles
        </h1>
        <p className="admin-muted mt-3 text-sm leading-6">
          Primero crea al menos una organización para comenzar a configurar este módulo.
        </p>
      </section>
    );
  }

  const selectedOrganizationId =
    query.organizationId && organizations.some((item) => item.id === query.organizationId)
      ? query.organizationId
      : organizations[0].id;

  if (query.organizationId !== selectedOrganizationId) {
    redirect(`/admin/cotizaciones-v2?organizationId=${selectedOrganizationId}`);
  }

  const initialConfig = await getOrganizationQuoteConfigView(selectedOrganizationId);

  return (
    <QuoteConfigWizard
      initialConfig={initialConfig}
      organizations={organizations}
    />
  );
}

import { redirect } from "next/navigation";

import { QuoteConfigWizardV2 } from "@/src/features/quote-config-admin/components/QuoteConfigWizardV2";
import { getOrganizationQuoteConfigView } from "@/src/features/quote-calculator-v2/lib/config";
import {
  canAccessPlatformAdmin,
} from "@/src/lib/authorization";
import { requireOrganizationContext } from "@/src/lib/organizations/context";

interface OrganizationAdminCapturePageProps {
  searchParams: Promise<{
    organizationId?: string;
  }>;
}

export default async function OrganizationAdminCapturePage({
  searchParams,
}: OrganizationAdminCapturePageProps) {
  const context = await requireOrganizationContext();

  const organizations = (
    canAccessPlatformAdmin(context.user.role)
      ? context.memberships
      : context.memberships.filter((membership) => membership.role === "ORG_ADMIN")
  ).map((membership) => ({
    id: membership.organization.id,
    name: membership.organization.name,
  }));

  if (organizations.length === 0) {
    redirect("/organization-admin");
  }

  const query = await searchParams;
  const selectedOrganizationId =
    query.organizationId && organizations.some((item) => item.id === query.organizationId)
      ? query.organizationId
      : context.currentOrganizationId &&
          organizations.some((item) => item.id === context.currentOrganizationId)
        ? context.currentOrganizationId
        : organizations[0].id;

  if (query.organizationId !== selectedOrganizationId) {
    redirect(`/organization-admin/captura?organizationId=${selectedOrganizationId}`);
  }

  const initialConfig = await getOrganizationQuoteConfigView(selectedOrganizationId);

  return (
    <QuoteConfigWizardV2
      initialConfig={initialConfig}
      organizations={organizations}
      basePath="/organization-admin/captura"
    />
  );
}

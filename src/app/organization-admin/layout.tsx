import { redirect } from "next/navigation";

import { V2Shell } from "@/src/features/v2/shell/V2Shell";
import { getIndustryPresentation } from "@/src/features/v2/presentation";
import { V2_ROUTES } from "@/src/features/v2/routing";
import { getOrganizationQuoteConfigView } from "@/src/features/quote-calculator-v2/lib/config";
import {
  canAccessPlatformAdmin,
  getOperationalFrontendAccess,
} from "@/src/lib/authorization";
import { requireOrganizationContext } from "@/src/lib/organizations/context";

export default async function OrganizationAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requireOrganizationContext();
  const hasOrganizationAdminAccess =
    canAccessPlatformAdmin(context.user.role) ||
    context.memberships.some((membership) => membership.role === "ORG_ADMIN");

  if (!hasOrganizationAdminAccess) {
    redirect(V2_ROUTES.more);
  }

  if (!context.currentOrganizationId && context.memberships.length > 1) {
    redirect("/select-organization?next=/organization-admin");
  }

  const access = getOperationalFrontendAccess(
    context.user.role,
    context.currentOrganizationRole,
    context.currentOrganizationPermissionProfile
  );

  const quoteConfig = context.currentOrganizationId
    ? await getOrganizationQuoteConfigView(context.currentOrganizationId)
    : null;
  const presentation = getIndustryPresentation({
    businessType: quoteConfig?.branding.businessType,
  });

  return (
    <V2Shell
      organizationName={
        context.currentOrganization?.name ??
        quoteConfig?.branding.businessName ??
        "Organización"
      }
      organizationLogoUrl={
        context.currentOrganization?.logoUrl ?? quoteConfig?.branding.logoUrl ?? null
      }
      moduleLabel={presentation.primaryModuleLabel}
      userName={`${context.user.firstName} ${context.user.lastName}`.trim()}
      access={access}
      managementLinks={[
        { href: "/organization-admin", label: "Organización" },
        { href: "/organization-admin/captura", label: "Configurar captura" },
        ...(canAccessPlatformAdmin(context.user.role)
          ? [{ href: "/admin", label: "Admin SaaS" }]
          : []),
      ]}
      canSwitchOrganization={context.memberships.length > 1}
    >
      {children}
    </V2Shell>
  );
}

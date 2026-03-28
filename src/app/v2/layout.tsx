import { V2Shell } from "@/src/features/v2/shell/V2Shell";
import { getIndustryPresentation } from "@/src/features/v2/presentation";
import { getOrganizationQuoteConfigView } from "@/src/features/quote-calculator-v2/lib/config";
import {
  canAccessPlatformAdmin,
  getOperationalFrontendAccess,
} from "@/src/lib/authorization";
import { requireCurrentOrganization } from "@/src/lib/organizations/context";

export default async function V2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requireCurrentOrganization();
  const access = getOperationalFrontendAccess(
    context.user.role,
    context.currentOrganizationRole,
    context.currentOrganizationPermissionProfile
  );

  const quoteConfig = await getOrganizationQuoteConfigView(context.currentOrganizationId);
  const presentation = getIndustryPresentation({
    businessType: quoteConfig.branding.businessType,
  });
  const managementLinks = [
    ...(context.currentOrganizationRole === "ORG_ADMIN" || canAccessPlatformAdmin(context.user.role)
      ? [
          { href: "/organization-admin", label: "Organización" },
          { href: "/organization-admin/captura", label: "Configurar captura" },
        ]
      : []),
    ...(canAccessPlatformAdmin(context.user.role)
      ? [{ href: "/admin", label: "Admin SaaS" }]
      : []),
  ];

  return (
    <V2Shell
      organizationName={context.currentOrganization?.name ?? quoteConfig.branding.businessName}
      organizationLogoUrl={
        context.currentOrganization?.logoUrl ?? quoteConfig.branding.logoUrl ?? null
      }
      moduleLabel={presentation.primaryModuleLabel}
      userName={`${context.user.firstName} ${context.user.lastName}`.trim()}
      access={access}
      managementLinks={managementLinks}
      canSwitchOrganization={context.memberships.length > 1}
    >
      {children}
    </V2Shell>
  );
}

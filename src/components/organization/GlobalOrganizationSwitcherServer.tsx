import { GlobalOrganizationSwitcher } from "@/src/components/organization/GlobalOrganizationSwitcher";
import { getOrganizationContextFromRequest } from "@/src/lib/organizations/context";

export async function GlobalOrganizationSwitcherServer() {
  try {
    const context = await getOrganizationContextFromRequest();

    return (
      <GlobalOrganizationSwitcher
        currentOrganizationId={context.currentOrganizationId}
        currentOrganizationName={context.currentOrganization?.name ?? null}
        organizations={context.memberships.map((membership) => ({
          id: membership.organization.id,
          name: membership.organization.name,
          logoUrl: membership.organization.logoUrl ?? null,
        }))}
      />
    );
  } catch {
    return null;
  }
}

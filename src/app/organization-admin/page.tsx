import { redirect } from "next/navigation";

import { OrganizationAdminClient } from "@/src/components/organization-admin/OrganizationAdminClient";
import { V2_ROUTES } from "@/src/features/v2/routing";
import {
  canAccessPlatformAdmin,
  canCreateOrganizations,
} from "@/src/lib/authorization";
import { getSupportedTimezones } from "@/src/lib/dates";
import { prisma } from "@/src/lib/db";
import { requireOrganizationContext } from "@/src/lib/organizations/context";

export default async function OrganizationAdminPage() {
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

  const members = context.currentOrganizationId
    ? await prisma.userOrganization.findMany({
        where: {
          organizationId: context.currentOrganizationId,
        },
        select: {
          id: true,
          role: true,
          permissionProfile: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: [
          {
            role: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      })
    : [];

  const manageableOrganizations = (
    canAccessPlatformAdmin(context.user.role)
      ? context.memberships
      : context.memberships.filter((membership) => membership.role === "ORG_ADMIN")
  ).map((membership) => ({
    id: membership.organization.id,
    name: membership.organization.name,
  }));
  const currentTimezone = context.currentTimezone ?? null;

  return (
    <OrganizationAdminClient
      canCreateOrganization={canCreateOrganizations(context.user.role)}
      currentUserId={context.user.id}
      canManageOtherAdmins={canAccessPlatformAdmin(context.user.role)}
      currentOrganizationId={context.currentOrganizationId}
      currentOrganizationName={context.currentOrganization?.name ?? null}
      currentOrganizationDefaultTimezone={context.currentOrganization?.defaultTimezone ?? "UTC"}
      currentUserTimezone={context.user.timezone}
      detectedTimezone={currentTimezone?.detectedTimezone ?? null}
      resolvedTimezone={currentTimezone?.timezone ?? context.currentOrganization?.defaultTimezone ?? "UTC"}
      timezoneOptions={getSupportedTimezones()}
      manageableOrganizations={manageableOrganizations}
      members={members.map((member) => ({
        ...member,
        createdAt: member.createdAt.toISOString(),
      }))}
    />
  );
}

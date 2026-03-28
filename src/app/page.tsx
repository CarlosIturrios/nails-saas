import { redirect } from "next/navigation";

import { getDefaultAppRoute } from "@/src/features/v2/routing";
import {
  canAccessPlatformAdmin,
  getOperationalFrontendAccess,
} from "@/src/lib/authorization";
import { requireOrganizationContext } from "@/src/lib/organizations/context";

export default async function Page() {
  const context = await requireOrganizationContext();

  if (context.memberships.length === 0) {
    if (canAccessPlatformAdmin(context.user.role)) {
      redirect("/admin");
    }

    redirect("/select-organization");
  }

  if (context.memberships.length > 1 && !context.currentOrganizationId) {
    redirect("/select-organization");
  }

  if (context.currentOrganizationId) {
    const access = getOperationalFrontendAccess(
      context.user.role,
      context.currentOrganizationRole,
      context.currentOrganizationPermissionProfile
    );
    redirect(getDefaultAppRoute(access));
  }

  redirect("/select-organization");
}

import { redirect } from "next/navigation";

import { getOperationalFrontendAccess } from "@/src/lib/authorization";
import { requireCurrentOrganization } from "@/src/lib/organizations/context";
import { getDefaultAppRoute } from "@/src/features/v2/routing";

export default async function V2RootPage() {
  const context = await requireCurrentOrganization();
  const access = getOperationalFrontendAccess(
    context.user.role,
    context.currentOrganizationRole,
    context.currentOrganizationPermissionProfile
  );

  redirect(getDefaultAppRoute(access));
}

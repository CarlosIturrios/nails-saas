import { redirect } from "next/navigation";
import { getOperationalFrontendAccess } from "@/src/lib/authorization";
import { requireOrganizationContext } from "@/src/lib/organizations/context";
import { getDefaultAppRoute } from "@/src/features/v2/routing";

export default async function HomePage() {
  const context = await requireOrganizationContext();

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

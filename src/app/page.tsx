import { redirect } from "next/navigation";

import { requireOrganizationContext } from "@/src/lib/organizations/context";

export default async function Page() {
  const context = await requireOrganizationContext();

  if (context.memberships.length > 1 && !context.currentOrganizationId) {
    redirect("/select-organization");
  }

  redirect("/home");
}

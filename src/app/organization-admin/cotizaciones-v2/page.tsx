import { redirect } from "next/navigation";

interface OrganizationAdminQuoteConfigPageProps {
  searchParams: Promise<{
    organizationId?: string;
  }>;
}

export default async function OrganizationAdminQuoteConfigPage({
  searchParams,
}: OrganizationAdminQuoteConfigPageProps) {
  const query = await searchParams;
  const next = query.organizationId
    ? `/organization-admin/captura?organizationId=${query.organizationId}`
    : "/organization-admin/captura";
  redirect(next);
}

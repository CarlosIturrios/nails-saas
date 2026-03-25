import { notFound } from "next/navigation";

import { getAdminModelConfig } from "@/src/admin/config/models";
import { AdminModelClient } from "@/src/admin/components/AdminModelClient";
import { requireAdminPageUser } from "@/src/admin/lib/auth";
import { getAdminFormOptions, listAdminRecords } from "@/src/admin/lib/data";

interface AdminModelPageProps {
  params: Promise<{
    model: string;
  }>;
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function AdminModelPage({
  params,
  searchParams,
}: AdminModelPageProps) {
  const [{ model }, query, currentUser] = await Promise.all([
    params,
    searchParams,
    requireAdminPageUser(),
  ]);
  const config = getAdminModelConfig(model);

  if (!config) {
    notFound();
  }

  const [initialData, initialFormOptions] = await Promise.all([
    listAdminRecords(config, {
      page: Number(query.page) || 1,
      search: query.search || "",
      currentOrganizationId: currentUser.currentOrganizationId,
    }),
    getAdminFormOptions(config),
  ]);

  return (
    <AdminModelClient
      modelKey={model}
      config={config}
      initialData={initialData}
      initialFormOptions={initialFormOptions}
    />
  );
}

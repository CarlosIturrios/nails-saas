"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { OrganizationWorkspace } from "@/src/components/home/OrganizationWorkspace";
import Toast from "@/src/components/ui/Toast";

interface OrganizationSelectorClientProps {
  destination?: string;
  currentOrganizationId?: string | null;
  currentOrganizationName?: string | null;
  organizations: Array<{
    id: string;
    name: string;
    logoUrl?: string | null;
  }>;
}

export function OrganizationSelectorClient({
  destination = "/",
  currentOrganizationId = null,
  currentOrganizationName = null,
  organizations,
}: OrganizationSelectorClientProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  async function handleSelect(organizationId: string) {
    setLoadingId(organizationId);

    try {
      const response = await fetch("/api/organizations/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo seleccionar la organización");
      }

      router.push(destination);
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <>
      <OrganizationWorkspace
        organizations={organizations}
        currentOrganizationId={currentOrganizationId}
        currentOrganizationName={currentOrganizationName}
        switching={Boolean(loadingId)}
        selectionOnly
        onActivate={handleSelect}
      />

      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      ) : null}
    </>
  );
}

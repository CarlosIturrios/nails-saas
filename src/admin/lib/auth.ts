import { redirect } from "next/navigation";

import {
  requirePlatformAdminContext,
} from "@/src/lib/organizations/context";

export async function requireAdminPageUser() {
  try {
    return await requirePlatformAdminContext();
  } catch {
    redirect("/login");
  }
}

export async function requireAdminApiUser() {
  const context = await requirePlatformAdminContext();
  return context;
}

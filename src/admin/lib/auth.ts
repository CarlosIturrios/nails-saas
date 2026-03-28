import {
  requirePlatformAdminContext,
} from "@/src/lib/organizations/context";

export async function requireAdminPageUser() {
  return requirePlatformAdminContext();
}

export async function requireAdminApiUser() {
  const context = await requirePlatformAdminContext();
  return context;
}

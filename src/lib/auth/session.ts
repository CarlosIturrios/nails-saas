import type { UserRole } from "@prisma/client";

export const AUTH_COOKIE_NAME = "token";
export const ACTIVE_ORGANIZATION_COOKIE = "activeOrganizationId";
export const ORGANIZATION_STATE_COOKIE = "organizationState";

export type OrganizationState = "none" | "single" | "multi";

export interface SessionTokenPayload {
  userId: string;
  role: UserRole;
}

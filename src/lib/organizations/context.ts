import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  Prisma,
  UserOrganizationPermissionProfile,
  UserOrganizationRole,
  UserRole,
} from "@prisma/client";
import type { NextResponse } from "next/server";

import {
  ACTIVE_ORGANIZATION_COOKIE,
  AUTH_COOKIE_NAME,
  ORGANIZATION_STATE_COOKIE,
  OrganizationState,
  SESSION_MAX_AGE_SECONDS,
  SessionTokenPayload,
} from "@/src/lib/auth/session";
import { verifyJwt } from "@/src/lib/auth/jwt";
import { prisma } from "@/src/lib/db";
import {
  canManageOrganization,
  canAccessPlatformAdmin,
} from "@/src/lib/authorization";
import {
  DETECTED_TIMEZONE_COOKIE,
  ResolvedTimezonePreference,
  resolveTimezonePreference,
} from "@/src/lib/dates";

export interface OrganizationMembershipSummary {
  organizationId: string;
  role: UserOrganizationRole;
  permissionProfile: UserOrganizationPermissionProfile;
  organization: {
    id: string;
    name: string;
    logoUrl?: string | null;
    defaultTimezone: string;
  };
}

export interface OrganizationContext {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    timezone: string | null;
    role: UserRole;
    active: boolean;
  };
  memberships: OrganizationMembershipSummary[];
  currentOrganizationId: string | null;
  currentOrganization: OrganizationMembershipSummary["organization"] | null;
  currentOrganizationRole: UserOrganizationRole | null;
  currentOrganizationPermissionProfile: UserOrganizationPermissionProfile | null;
  currentTimezone: ResolvedTimezonePreference | null;
}

export interface CurrentOrganizationContext extends OrganizationContext {
  currentOrganizationId: string;
  currentOrganization: OrganizationMembershipSummary["organization"];
  currentOrganizationRole: UserOrganizationRole;
  currentOrganizationPermissionProfile: UserOrganizationPermissionProfile;
}

interface SetOrganizationCookiesParams {
  activeOrganizationId?: string | null;
  organizationState: OrganizationState;
}

function baseCookieOptions() {
  return {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export function applyOrganizationCookies(
  response: NextResponse,
  params: SetOrganizationCookiesParams
) {
  if (params.activeOrganizationId) {
    response.cookies.set(ACTIVE_ORGANIZATION_COOKIE, params.activeOrganizationId, baseCookieOptions());
  } else {
    response.cookies.set(ACTIVE_ORGANIZATION_COOKIE, "", {
      ...baseCookieOptions(),
      maxAge: 0,
    });
  }

  response.cookies.set(ORGANIZATION_STATE_COOKIE, params.organizationState, baseCookieOptions());
}

export function clearSessionCookies(response: NextResponse) {
  for (const cookieName of [
    AUTH_COOKIE_NAME,
    ACTIVE_ORGANIZATION_COOKIE,
    ORGANIZATION_STATE_COOKIE,
  ]) {
    response.cookies.set(cookieName, "", {
      ...baseCookieOptions(),
      maxAge: 0,
    });
  }
}

export async function getSessionPayloadFromRequest() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    throw new Error("No autenticado");
  }

  return verifyJwt(token) as SessionTokenPayload;
}

export function getOrganizationStateFromMemberships(count: number): OrganizationState {
  if (count === 0) {
    return "none";
  }

  if (count === 1) {
    return "single";
  }

  return "multi";
}

export async function getLoginOrganizationState(userId: string) {
  const memberships = await prisma.userOrganization.findMany({
    where: { userId },
    select: {
      organizationId: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return {
    organizationState: getOrganizationStateFromMemberships(memberships.length),
    activeOrganizationId:
      memberships.length === 1 ? memberships[0].organizationId : null,
    organizationCount: memberships.length,
  };
}

export async function getOrganizationContextForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      timezone: true,
      role: true,
      active: true,
      memberships: {
        select: {
          organizationId: true,
          role: true,
          permissionProfile: true,
          organization: {
            select: {
              id: true,
              name: true,
              defaultTimezone: true,
              quoteConfig: {
                select: {
                  logoUrl: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!user || !user.active) {
    throw new Error("No autenticado");
  }

  const cookieStore = await cookies();
  const activeOrganizationIdCookie =
    cookieStore.get(ACTIVE_ORGANIZATION_COOKIE)?.value ?? null;
  const memberships = user.memberships;
  const fallbackOrganizationId =
    memberships.length === 1 ? memberships[0].organizationId : null;
  const currentMembership =
    memberships.find(
      (membership) => membership.organizationId === activeOrganizationIdCookie
    ) ??
    memberships.find(
      (membership) => membership.organizationId === fallbackOrganizationId
    ) ??
    null;
  const detectedTimezone =
    cookieStore.get(DETECTED_TIMEZONE_COOKIE)?.value ?? null;
  const currentTimezone = currentMembership
    ? resolveTimezonePreference({
        userTimezone: user.timezone,
        detectedTimezone,
        organizationTimezone: currentMembership.organization.defaultTimezone,
      })
    : null;

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      timezone: user.timezone,
      role: user.role,
      active: user.active,
    },
    memberships: memberships.map((membership) => ({
      ...membership,
      organization: {
          ...membership.organization,
          logoUrl: membership.organization.quoteConfig?.logoUrl ?? null,
        },
      })),
    currentOrganizationId: currentMembership?.organizationId ?? null,
    currentOrganization: currentMembership?.organization
      ? {
          ...currentMembership.organization,
          logoUrl: currentMembership.organization.quoteConfig?.logoUrl ?? null,
        }
      : null,
    currentOrganizationRole: currentMembership?.role ?? null,
    currentOrganizationPermissionProfile: currentMembership?.permissionProfile ?? null,
    currentTimezone,
  } satisfies OrganizationContext;
}

export async function getOrganizationContextFromRequest() {
  const session = await getSessionPayloadFromRequest();
  return getOrganizationContextForUser(session.userId);
}

export async function requireOrganizationContext() {
  try {
    return await getOrganizationContextFromRequest();
  } catch {
    redirect("/login");
  }
}

export async function requireCurrentOrganization() {
  const context = await requireOrganizationContext();

  if (!context.currentOrganizationId) {
    redirect("/");
  }

  return context as CurrentOrganizationContext;
}

export async function requireOrganizationAdminContext() {
  const context = await requireOrganizationContext();

  if (canManageOrganization(context.user.role, context.currentOrganizationRole)) {
    return context;
  }
  redirect("/mas");
}

export async function requireOrganizationAdminApiContext() {
  const context = await getOrganizationContextFromRequest();

  if (canManageOrganization(context.user.role, context.currentOrganizationRole)) {
    return context;
  }
  if (!context.currentOrganizationId) {
    throw new Error("Selecciona una organización antes de continuar");
  }
  throw new Error("No autorizado");
}

export async function requirePlatformAdminContext() {
  const context = await requireOrganizationContext();

  if (!canAccessPlatformAdmin(context.user.role)) {
    redirect("/mas");
  }

  return context;
}

export async function assertOrganizationMembership(
  userId: string,
  organizationId: string
) {
  const membership = await prisma.userOrganization.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
    select: {
      organizationId: true,
      role: true,
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!membership) {
    throw new Error("No tienes acceso a esta organización");
  }

  return membership;
}

export async function assertOrganizationAdminAccess(
  userId: string,
  organizationId: string
) {
  const context = await getOrganizationContextForUser(userId);

  if (canManageOrganization(context.user.role, null)) {
    return true;
  }

  const membership = context.memberships.find(
    (item) => item.organizationId === organizationId
  );

  if (!membership || membership.role !== UserOrganizationRole.ORG_ADMIN) {
    throw new Error("No autorizado para administrar esta organización");
  }

  return true;
}

export function buildScopedMembershipWhere(organizationId: string) {
  return {
    memberships: {
      some: {
        organizationId,
      },
    },
  } satisfies Prisma.UserWhereInput;
}

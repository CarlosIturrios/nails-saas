import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma, UserOrganizationRole, UserRole } from "@prisma/client";
import type { NextResponse } from "next/server";

import {
  ACTIVE_ORGANIZATION_COOKIE,
  AUTH_COOKIE_NAME,
  ORGANIZATION_STATE_COOKIE,
  OrganizationState,
  SessionTokenPayload,
} from "@/src/lib/auth/session";
import { verifyJwt } from "@/src/lib/auth/jwt";
import { prisma } from "@/src/lib/db";

export interface OrganizationMembershipSummary {
  organizationId: string;
  role: UserOrganizationRole;
  organization: {
    id: string;
    name: string;
    logoUrl?: string | null;
  };
}

export interface OrganizationContext {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    active: boolean;
  };
  memberships: OrganizationMembershipSummary[];
  currentOrganizationId: string | null;
  currentOrganization: OrganizationMembershipSummary["organization"] | null;
  currentOrganizationRole: UserOrganizationRole | null;
}

interface SetOrganizationCookiesParams {
  activeOrganizationId?: string | null;
  organizationState: OrganizationState;
}

function baseCookieOptions() {
  return {
    httpOnly: true,
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
      role: true,
      active: true,
      memberships: {
        select: {
          organizationId: true,
          role: true,
          organization: {
            select: {
              id: true,
              name: true,
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

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      active: user.active,
    },
      memberships,
      currentOrganizationId: currentMembership?.organizationId ?? null,
    currentOrganization: currentMembership?.organization
      ? {
          ...currentMembership.organization,
          logoUrl: currentMembership.organization.quoteConfig?.logoUrl ?? null,
        }
      : null,
    currentOrganizationRole: currentMembership?.role ?? null,
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
    redirect("/home");
  }

  return context;
}

export async function requireOrganizationAdminContext() {
  const context = await requireOrganizationContext();

  if (context.user.role === UserRole.ADMIN) {
    return context;
  }

  if (!context.currentOrganizationId) {
    redirect("/home");
  }

  if (context.currentOrganizationRole !== UserOrganizationRole.ADMIN) {
    redirect("/home");
  }

  return context;
}

export async function requireOrganizationAdminApiContext() {
  const context = await getOrganizationContextFromRequest();

  if (context.user.role === UserRole.ADMIN) {
    return context;
  }

  if (!context.currentOrganizationId) {
    throw new Error("Selecciona una organización antes de continuar");
  }

  if (context.currentOrganizationRole !== UserOrganizationRole.ADMIN) {
    throw new Error("No autorizado");
  }

  return context;
}

export async function requirePlatformAdminContext() {
  const context = await requireOrganizationContext();

  if (context.user.role !== UserRole.ADMIN) {
    redirect("/home");
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

  if (context.user.role === UserRole.ADMIN) {
    return true;
  }

  const membership = context.memberships.find(
    (item) => item.organizationId === organizationId
  );

  if (!membership || membership.role !== UserOrganizationRole.ADMIN) {
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

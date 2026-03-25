// src/proxy.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifyJwtEdge } from "@/src/lib/auth/jwt-edge";
import {
  ACTIVE_ORGANIZATION_COOKIE,
  AUTH_COOKIE_NAME,
  ORGANIZATION_STATE_COOKIE,
} from "@/src/lib/auth/session";

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const activeOrganizationId = req.cookies.get(ACTIVE_ORGANIZATION_COOKIE)?.value;
  const organizationState = req.cookies.get(ORGANIZATION_STATE_COOKIE)?.value;
  const pathname = req.nextUrl.pathname;

  const publicPaths = [
    "/login",
    "/api/auth/send-code",
    "/api/auth/verify-code",
  ];

  if (publicPaths.some((path) => req.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const session = await verifyJwtEdge(token);
    const userRole = session.payload.role;

    if (pathname.startsWith("/select-organization") && organizationState !== "multi") {
      return NextResponse.redirect(new URL("/home", req.url));
    }

  const isAdminPath =
      pathname.startsWith("/admin") ||
      pathname.startsWith("/api/admin");

    if (isAdminPath && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/home", req.url));
    }

  const needsActiveOrganization = pathname.startsWith("/cotizaciones");

    if (needsActiveOrganization && !activeOrganizationId) {
      const destination =
        organizationState === "multi" ? "/select-organization" : "/home";
      return NextResponse.redirect(new URL(destination, req.url));
    }

    return NextResponse.next();
  } catch (err) {
    console.warn("JWT inválido:", err);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    "/cotizaciones/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/organization-admin/:path*",
    "/api/organization-admin/:path*",
    "/home/:path*",
    "/select-organization/:path*",
    "/",
  ],
};

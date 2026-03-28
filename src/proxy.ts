// src/proxy.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifyJwtEdge } from "@/src/lib/auth/jwt-edge";
import { AUTH_COOKIE_NAME } from "@/src/lib/auth/session";

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

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
    await verifyJwtEdge(token);
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
    "/capturar/:path*",
    "/pendientes/:path*",
    "/agenda/:path*",
    "/mas/:path*",
    "/clientes/:path*",
    "/propuestas/:path*",
    "/ordenes/:path*",
    "/caja/:path*",
    "/tablero/:path*",
    "/select-organization/:path*",
    "/v2/:path*",
    "/",
  ],
};

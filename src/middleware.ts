// src/middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwtEdge } from "@/src/lib/auth/jwt-edge";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  // Rutas públicas
  const publicPaths = ["/login", "/api/auth/send-code", "/api/auth/verify-code"];
  if (publicPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // No hay token → redirect login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Verificar token
  try {
    await verifyJwtEdge(token);
    return NextResponse.next(); // todo OK
  } catch (err) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

// Rutas donde aplicar middleware
export const config = {
  matcher: ["/cotizaciones/:path*", "/"],
};
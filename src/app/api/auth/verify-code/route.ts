// src/app/api/auth/verify-code/route.ts
import { NextResponse } from "next/server";
import { verifyLoginCode } from "@/src/lib/services/auth.service";
import {
  applyOrganizationCookies,
} from "@/src/lib/organizations/context";
import { AUTH_COOKIE_NAME } from "@/src/lib/auth/session";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    const loginResult = await verifyLoginCode(email, code);

    const res = NextResponse.json({ ok: true });
    res.cookies.set(AUTH_COOKIE_NAME, loginResult.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    applyOrganizationCookies(res, {
      activeOrganizationId: loginResult.activeOrganizationId,
      organizationState: loginResult.organizationState,
    });

    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error verificando código";
    console.error(err);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
